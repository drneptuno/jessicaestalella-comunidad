import type { APIRoute } from 'astro'
import { z } from 'zod'
import { getAuth } from '../../lib/auth'
import { createDb } from '../../lib/db'
import { getVisibleMemberEmail } from '../../lib/db/queries'
import { getEmailSender } from '../../lib/email'
import { getServerEnv } from '../../lib/env'
import { checkRateLimit } from '../../lib/rate-limit'

export const prerender = false

const schema = z.object({
  a: z.string().min(1).max(60),
  mensaje: z.string().min(10).max(1000),
})

function seeOther(path: string): Response {
  return new Response(null, { status: 303, headers: { Location: path } })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export const POST: APIRoute = async ({ request }) => {
  const env = getServerEnv()
  const auth = getAuth(env)
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return seeOther('/ingresar')

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return seeOther('/muro')
  }

  const parsed = schema.safeParse({ a: form.get('a'), mensaje: form.get('mensaje') })
  if (!parsed.success) return seeOther('/muro')

  const targetId = parsed.data.a
  if (targetId === session.user.id) return seeOther('/muro')

  const db = createDb(env.DATABASE_URL)

  // Rate limit por remitente: evita usar el muro como spam.
  const ok = await checkRateLimit(db, `presentarme:${session.user.id}`, {
    windowSec: 3600,
    max: 20,
  })
  if (!ok) return seeOther(`/muro/presentarme?a=${targetId}&error=limite`)

  const destino = await getVisibleMemberEmail(db, targetId)
  if (!destino) return seeOther('/muro')

  const de = session.user.name
  const deEmail = session.user.email
  const mensaje = parsed.data.mensaje

  try {
    await getEmailSender(env).send({
      to: destino,
      replyTo: deEmail,
      subject: `${de} quiere presentarse — Capitana BSAS`,
      text: `${de} (${deEmail}) te dejó una presentación en la comunidad Capitana BSAS:\n\n${mensaje}\n\nPodés responder directo a este correo para conectar.`,
      html: `<p><strong>${escapeHtml(de)}</strong> (${escapeHtml(deEmail)}) te dejó una presentación en la comunidad <strong>Capitana BSAS</strong>:</p><blockquote style="border-left:3px solid #ff7e21;padding-left:12px;color:#152a42">${escapeHtml(mensaje).replace(/\n/g, '<br>')}</blockquote><p>Podés responder directo a este correo para conectar.</p>`,
    })
  } catch {
    return seeOther(`/muro/presentarme?a=${targetId}&error=envio`)
  }

  return seeOther('/muro?presentada=1')
}
