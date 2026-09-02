import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { magicLink } from 'better-auth/plugins'
import { createDb } from '../db'
import * as schema from '../db/schema'
import { getEmailSender } from '../email'
import type { ServerEnv } from '../env'

// Better Auth se crea por-request con el env resuelto (en Workers los secretos
// llegan por el runtime, no hay singleton global posible). Memoizamos por
// DATABASE_URL para reusar dentro del mismo isolate/proceso.
const cache = new Map<string, ReturnType<typeof build>>()

function build(env: ServerEnv) {
  const db = createDb(env.DATABASE_URL)

  return betterAuth({
    appName: 'Capitana BSAS',
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,

    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
        rateLimit: schema.rateLimits,
      },
    }),

    // Cuenta ÚNICA del ecosistema: la misma persona puede entrar acá con el
    // magic link de la comunidad o con la contraseña que creó en `cursos`.
    // El registro abierto sigue cerrado: quien no tiene cuenta no la crea acá
    // (`disableSignUp` en el magic link, y sin endpoint de sign-up expuesto).
    // Entrar NO implica pertenecer: el gate real es `community_members`.
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
      // El alta y el reseteo de contraseña los maneja `cursos` (dueño del
      // flujo). Acá solo se valida la contraseña ya existente.
      disableSignUp: true,
    },

    user: {
      additionalFields: {
        // El rol lo maneja el servidor; nunca entra desde el cliente.
        // Espejo del enum de cursos (dueño del schema de auth).
        role: { type: 'string', input: false, defaultValue: 'student' },
      },
    },

    // SSO por subdominios: la cookie se emite en `.jessicaestalella.com` y
    // viaja tanto a cursos.* como a capitanabsas.*. Requiere que ambas apps
    // compartan BETTER_AUTH_SECRET y base de datos.
    advanced: {
      crossSubDomainCookies: env.COOKIE_DOMAIN
        ? { enabled: true, domain: env.COOKIE_DOMAIN }
        : { enabled: false },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 días
      updateAge: 60 * 60 * 24, // se renueva a diario con actividad
    },

    // Rate limit persistido en Postgres (en Workers la memoria es por-isolate).
    rateLimit: {
      enabled: true,
      storage: 'database',
      window: 60,
      max: 30,
      customRules: {
        '/sign-in/magic-link': { window: 60, max: 5 },
        '/magic-link/verify': { window: 60, max: 10 },
      },
    },

    // ⚠️ Solo el propio origen. `cursos` no postea contra este `/api/auth`
    // (monta su propio Better Auth y lee la sesión de la base compartida), así
    // que sumarlo no habilitaría nada y sí ampliaría la superficie de CSRF
    // entre subdominios hermanos, donde `SameSite=Lax` no protege.
    // `COURSES_URL` se sigue usando, pero solo como destino de enlaces.
    trustedOrigins: [env.BETTER_AUTH_URL],

    plugins: [
      magicLink({
        // Solo entran usuarias que ya existen (creadas al canjear su invitación).
        // El registro abierto está deshabilitado a propósito.
        disableSignUp: true,
        expiresIn: 60 * 10, // 10 minutos
        sendMagicLink: async ({ email, url }) => {
          await getEmailSender(env).send({
            to: email,
            subject: 'Tu acceso a Capitana BSAS',
            text: `Hola:\n\nEntrá a la comunidad con este enlace (vence en 10 minutos):\n${url}\n\nSi no lo pediste vos, ignorá este email.`,
            html: `<p>Hola:</p><p>Entrá a la comunidad con este enlace (vence en 10 minutos):</p><p><a href="${url}">Ingresar a Capitana BSAS</a></p><p>Si no lo pediste vos, ignorá este email.</p>`,
          })
        },
      }),
    ],
  })
}

export function getAuth(env: ServerEnv) {
  const key = env.DATABASE_URL
  let instance = cache.get(key)
  if (!instance) {
    instance = build(env)
    cache.set(key, instance)
  }
  return instance
}

export type Auth = ReturnType<typeof build>
