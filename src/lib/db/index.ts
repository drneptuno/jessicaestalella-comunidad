import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Driver HTTP de Neon (neon-http): cada query es un request HTTP sin conexión
// TCP persistente. Es lo indicado para Cloudflare Workers, donde una conexión
// TCP de postgres.js se corta entre requests ("Network connection lost").
// Better Auth no usa transacciones interactivas, así que neon-http alcanza.
//
// Lock-in acotado a ESTE archivo: el SQL/esquema es Postgres puro y portable
// (salida con pg_dump). Las migraciones (drizzle-kit) siguen usando postgres.js.

function resolveDatabaseUrl(explicit?: string): string {
  const url = explicit ?? process.env.DATABASE_URL ?? import.meta.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL no está definida')
  }
  return url
}

export function createDb(databaseUrl?: string) {
  const sql = neon(resolveDatabaseUrl(databaseUrl))
  return drizzle(sql, { schema })
}

export type Db = ReturnType<typeof createDb>

export { schema }
