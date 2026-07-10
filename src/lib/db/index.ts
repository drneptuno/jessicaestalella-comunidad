import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// postgres.js funciona igual en Workers, en local y en un VPS: cero lock-in de
// driver. La connection string es la única configuración.
//
// NOTA (F1): en el runtime de Cloudflare Workers las env vars llegan por el
// binding del runtime (Astro.locals.runtime.env), NO por process.env. Cuando
// conectemos queries desde páginas SSR, pasar la URL explícitamente a createDb()
// desde el handler en vez de depender del singleton global.
function resolveDatabaseUrl(explicit?: string): string {
  const url = explicit ?? process.env.DATABASE_URL ?? import.meta.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL no está definida')
  }
  return url
}

export function createDb(databaseUrl?: string) {
  const client = postgres(resolveDatabaseUrl(databaseUrl), { max: 5 })
  return drizzle(client, { schema })
}

export type Db = ReturnType<typeof createDb>

export { schema }
