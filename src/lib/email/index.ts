// Envío de email — interface propia + adapter. Sin SDK de proveedor (menor
// lock-in): Resend por su API HTTP con fetch, que corre igual en Workers.
// Si no hay API key (dev), cae a un sender que loguea a consola.

import type { ServerEnv } from '../env'

export interface EmailMessage {
  to: string
  subject: string
  text: string
  html: string
}

export interface EmailSender {
  send(message: EmailMessage): Promise<void>
}

class ConsoleEmailSender implements EmailSender {
  async send(m: EmailMessage): Promise<void> {
    console.log(`\n[email:dev] → ${m.to}\n  asunto: ${m.subject}\n  ${m.text}\n`)
  }
}

class ResendEmailSender implements EmailSender {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(m: EmailMessage): Promise<void> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: m.to,
        subject: m.subject,
        text: m.text,
        html: m.html,
      }),
    })
    if (!res.ok) {
      throw new Error(`Resend respondió ${res.status}`)
    }
  }
}

export function getEmailSender(env: ServerEnv): EmailSender {
  if (env.RESEND_API_KEY) {
    return new ResendEmailSender(
      env.RESEND_API_KEY,
      env.RESEND_FROM_EMAIL ?? 'hola@jessicaestalella.com',
    )
  }
  return new ConsoleEmailSender()
}
