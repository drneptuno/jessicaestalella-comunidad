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

    // Comunidad por invitación: nada de email+contraseña. El acceso es por
    // código de invitación (endpoint propio) y reingreso por magic link.
    emailAndPassword: { enabled: false },

    user: {
      additionalFields: {
        // El rol lo maneja el servidor; nunca entra desde el cliente.
        role: { type: 'string', input: false, defaultValue: 'member' },
      },
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
