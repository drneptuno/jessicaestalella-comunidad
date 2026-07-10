// Resolver de variables de entorno del servidor.
//
// Astro 6 + @astrojs/cloudflare: los secretos/bindings del runtime se leen con
// `import { env } from 'cloudflare:workers'` (reemplaza al viejo
// Astro.locals.runtime.env). En `astro dev` el adapter llena ese `env` desde
// .env.local. Fallbacks a process.env / import.meta.env por si se usa fuera
// del runtime de Workers.

import { env as workerEnv } from 'cloudflare:workers'

export interface ServerEnv {
  DATABASE_URL: string
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  RESEND_API_KEY?: string
  RESEND_FROM_EMAIL?: string
  MAILERLITE_API_KEY?: string
  MAILERLITE_GROUP_ID?: string
  PUBLIC_SITE_URL?: string
}

type Source = Record<string, string | undefined> | undefined

function reader(...sources: Source[]) {
  return (key: string): string | undefined => {
    for (const src of sources) {
      const value = src?.[key]
      if (value) return value
    }
    return undefined
  }
}

export function getServerEnv(): ServerEnv {
  const cfEnv = workerEnv as unknown as Record<string, string | undefined>
  const procEnv = typeof process !== 'undefined' ? process.env : undefined
  const metaEnv = import.meta.env as unknown as Record<string, string | undefined>
  const get = reader(cfEnv, procEnv, metaEnv)

  const DATABASE_URL = get('DATABASE_URL')
  const BETTER_AUTH_SECRET = get('BETTER_AUTH_SECRET')
  if (!DATABASE_URL) throw new Error('DATABASE_URL no está definida')
  if (!BETTER_AUTH_SECRET) throw new Error('BETTER_AUTH_SECRET no está definida')

  return {
    DATABASE_URL,
    BETTER_AUTH_SECRET,
    BETTER_AUTH_URL:
      get('BETTER_AUTH_URL') ?? get('PUBLIC_SITE_URL') ?? 'http://localhost:4321',
    RESEND_API_KEY: get('RESEND_API_KEY'),
    RESEND_FROM_EMAIL: get('RESEND_FROM_EMAIL'),
    MAILERLITE_API_KEY: get('MAILERLITE_API_KEY'),
    MAILERLITE_GROUP_ID: get('MAILERLITE_GROUP_ID'),
    PUBLIC_SITE_URL: get('PUBLIC_SITE_URL'),
  }
}
