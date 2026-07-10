import type { APIRoute } from 'astro'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { getAuth } from '../../lib/auth'
import { createDb } from '../../lib/db'
import { invitations, users } from '../../lib/db/schema'
import { getServerEnv } from '../../lib/env'
import { addToCommunity, emailAllowedByGroup } from '../../lib/marketing'
import {
  hashCode,
  normalizeCode,
  normalizeEmail,
  timingSafeEqualHex,
} from '../../lib/invitations'
import { checkRateLimit } from '../../lib/rate-limit'

export const prerender = false

const schema = z.object({
  email: z.string().email().max(200),
  code: z.string().max(40).optional(),
  // Honeypot: los bots lo completan; las personas no lo ven.
  website: z.string().max(0).optional(),
})

function seeOther(path: string): Response {
  return new Response(null, { status: 303, headers: { Location: path } })
}

async function ensureUser(
  db: ReturnType<typeof createDb>,
  email: string,
  name: string,
): Promise<void> {
  const existing = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0]
  if (existing) return
  await db.insert(users).values({
    id: crypto.randomUUID(),
    email,
    name,
    role: 'member',
    emailVerified: true,
  })
}

export const POST: APIRoute = async ({ request }) => {
  const env = getServerEnv()

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return seeOther('/ingresar?error=datos')
  }

  const parsed = schema.safeParse({
    email: form.get('email') ?? undefined,
    code: form.get('code') || undefined,
    website: form.get('website') || undefined,
  })
  if (!parsed.success) return seeOther('/ingresar?error=datos')

  // Trampa de bots: si el honeypot vino lleno, respondemos como si todo ok.
  if (parsed.data.website) return seeOther('/ingresar?estado=revisa-email')

  const email = normalizeEmail(parsed.data.email)
  const code = parsed.data.code ? normalizeCode(parsed.data.code) : ''

  const db = createDb(env.DATABASE_URL)
  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for') ??
    'local'

  // Rate limit por IP y por email (frena fuerza bruta de códigos).
  const okIp = await checkRateLimit(db, `ingresar:ip:${ip}`, { windowSec: 300, max: 10 })
  const okEmail = await checkRateLimit(db, `ingresar:email:${email}`, { windowSec: 300, max: 5 })
  if (!okIp || !okEmail) return seeOther('/ingresar?error=limite')

  if (code) {
    // ── Primera vez: canje de invitación ──────────────────────────────────
    const pendientes = await db
      .select()
      .from(invitations)
      .where(and(eq(invitations.email, email), eq(invitations.status, 'pending')))

    // Hash siempre (aunque no haya pendientes) para uniformar tiempos.
    const provided = await hashCode(code)
    const inv = pendientes.find((cand) => {
      const notExpired = !cand.expiresAt || cand.expiresAt.getTime() > Date.now()
      return notExpired && timingSafeEqualHex(provided, cand.codeHash)
    })

    if (!inv) return seeOther('/ingresar?error=invalido')

    const nombre = inv.name ?? email.split('@')[0]
    await ensureUser(db, email, nombre)
    await db
      .update(invitations)
      .set({ status: 'redeemed', redeemedAt: new Date() })
      .where(eq(invitations.id, inv.id))

    // La sumamos a MailerLite (marketing/automatizaciones). Nunca bloquea el
    // acceso: si falla o no está configurado, seguimos igual.
    try {
      await addToCommunity(env, { email, name: nombre })
    } catch {
      /* no crítico */
    }
  } else {
    // ── Sin código ────────────────────────────────────────────────────────
    // Reingreso (usuaria existente) o PRIMER ingreso por grupo de MailerLite:
    // si el email está en el grupo habilitado (compra), la damos de alta.
    const existente = (
      await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
    )[0]

    if (!existente) {
      try {
        const { allowed, name } = await emailAllowedByGroup(env, email)
        if (allowed) {
          await ensureUser(db, email, name ?? email.split('@')[0])
        }
      } catch {
        // Si MailerLite falla, no creamos usuaria: no se filtra nada, y como no
        // existe, el magic link con disableSignUp no manda (respuesta genérica).
      }
    }
    // Si existía → reingreso normal (el magic link de abajo se encarga).
    // No revelamos en ningún caso si el email pertenece o no a la comunidad.
  }

  // Magic link tanto para canje como para reingreso. Con disableSignUp, si la
  // usuaria no existe Better Auth no manda nada; respondemos igual (genérico).
  try {
    const auth = getAuth(env)
    await auth.api.signInMagicLink({
      body: { email, callbackURL: '/app' },
      headers: request.headers,
    })
  } catch {
    // Silencioso a propósito: no filtramos si el email es o no de la comunidad.
  }

  return seeOther('/ingresar?estado=revisa-email')
}
