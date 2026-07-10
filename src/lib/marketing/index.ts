// Integración con MailerLite (marketing / automatizaciones de Jessica).
//
// Reparto de responsabilidades:
//   - Resend  → email TRANSACCIONAL (el enlace de acceso). Instantáneo y 1-a-1.
//   - MailerLite → LISTA y automatizaciones. Cuando una mujer entra a la
//     comunidad la sumamos a un grupo, y ahí corren las automatizaciones que
//     Jessica ya tiene armadas.
//
// Sin SDK (menor lock-in): API HTTP por fetch, igual que el proyecto principal.
// Si no hay MAILERLITE_API_KEY, es un no-op (no rompe el flujo de acceso).

import type { ServerEnv } from '../env'

interface Subscriber {
  email: string
  name?: string
}

export async function addToCommunity(env: ServerEnv, sub: Subscriber): Promise<void> {
  if (!env.MAILERLITE_API_KEY) return // no configurado → no-op

  const res = await fetch('https://connect.mailerlite.com/api/subscribers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.MAILERLITE_API_KEY}`,
    },
    // Upsert: crea o actualiza nombre/grupos si el email ya existe.
    body: JSON.stringify({
      email: sub.email,
      fields: sub.name ? { name: sub.name } : undefined,
      groups: env.MAILERLITE_GROUP_ID ? [env.MAILERLITE_GROUP_ID] : undefined,
    }),
  })

  if (!res.ok) {
    throw new Error(`MailerLite respondió ${res.status}`)
  }
}
