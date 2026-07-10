// Rate limiting persistido en Postgres (en Workers la memoria es por-isolate y
// no sirve como límite real). Reusa la tabla rate_limits con claves propias
// namespaceadas (p. ej. "ingresar:ip:...") para no chocar con Better Auth.

import { eq } from 'drizzle-orm'
import type { Db } from './db'
import { rateLimits } from './db/schema'

interface Options {
  windowSec: number
  max: number
}

/** Devuelve true si la acción está permitida; false si superó el límite. */
export async function checkRateLimit(db: Db, key: string, opts: Options): Promise<boolean> {
  const now = Date.now()
  const windowMs = opts.windowSec * 1000

  const existing = (await db.select().from(rateLimits).where(eq(rateLimits.key, key)).limit(1))[0]

  if (!existing) {
    await db.insert(rateLimits).values({ id: crypto.randomUUID(), key, count: 1, lastRequest: now })
    return true
  }

  // Ventana vencida → reinicia el contador.
  if (now - existing.lastRequest > windowMs) {
    await db.update(rateLimits).set({ count: 1, lastRequest: now }).where(eq(rateLimits.key, key))
    return true
  }

  if (existing.count >= opts.max) {
    return false
  }

  await db
    .update(rateLimits)
    .set({ count: existing.count + 1, lastRequest: now })
    .where(eq(rateLimits.key, key))
  return true
}
