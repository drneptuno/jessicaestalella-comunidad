import type { APIRoute } from 'astro'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { getAuth } from '../../lib/auth'
import { createDb } from '../../lib/db'
import { invitations, users } from '../../lib/db/schema'
import { getServerEnv } from '../../lib/env'
import { addToCommunity } from '../../lib/marketing'
import { grantMembership } from '../../lib/membership'
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

/**
 * Devuelve el id de la usuaria, creándola si no existía.
 *
 * OJO: `users` es la tabla COMPARTIDA del ecosistema (la posee `cursos`), así
 * que acá puede aparecer una alumna que ya tiene cuenta por haber comprado un
 * curso. En ese caso NO se crea nada: se reutiliza su cuenta, que es
 * justamente el objetivo de la cuenta única.
 */
async function ensureUser(
  db: ReturnType<typeof createDb>,
  email: string,
  name: string,
): Promise<string> {
  const existing = (
    await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
  )[0]
  if (existing) return existing.id

  const id = crypto.randomUUID()
  await db.insert(users).values({
    id,
    email,
    name,
    role: 'student',
    emailVerified: true,
  })
  return id
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
    const userId = await ensureUser(db, email, nombre)
    // El canje es lo que otorga la pertenencia: la cuenta puede ya existir
    // (alumna de cursos), pero la membresía de la comunidad nace acá.
    await grantMembership(db, userId, 'invitation')
    await db
      .update(invitations)
      .set({ status: 'redeemed', redeemedAt: new Date(), redeemedByUserId: userId })
      .where(eq(invitations.id, inv.id))

    // La sumamos a MailerLite (marketing/automatizaciones). Nunca bloquea el
    // acceso: si falla o no está configurado, seguimos igual.
    try {
      await addToCommunity(env, { email, name: nombre })
    } catch {
      /* no crítico */
    }
  }
  // ── Sin código ──────────────────────────────────────────────────────────
  // Reingreso de una usuaria existente. Con la cuenta única, "existente"
  // incluye a cualquier alumna de cursos: el magic link se le manda igual.
  // Que además PUEDA entrar lo decide el middleware (`ensureAccess`), que da el
  // alta sola si tiene membresía vigente. Mandar el link nunca otorga acceso.
  //
  // ⚠️ Acá había una vía legada que consultaba el grupo de MailerLite y, si el
  // email figuraba, CREABA la usuaria con `emailVerified: true` en la tabla
  // `users` compartida y le otorgaba la membresía. Se retiró por dos motivos:
  //   1. Convertía una lista de marketing en un mecanismo de alta de cuentas
  //      del ecosistema y de acceso a la comunidad, sin autenticar nada. Si esa
  //      lista se alimentaba desde cualquier formulario público, era auto-alta.
  //   2. Ese camino hacía una llamada HTTPS externa solo para los emails que NO
  //      existían, y esa diferencia de latencia permitía distinguir quién tiene
  //      cuenta — dato sensible dado el perfil de la comunidad.
  // El acceso por compra ya se resuelve contra `subscriptions`, que es la
  // fuente real, así que esta vía no aporta nada.

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
