// Rate limiting persistido en Postgres (en Workers la memoria es por-isolate y
// no sirve como límite real). Reusa la tabla rate_limits con claves propias
// namespaceadas (p. ej. "ingresar:ip:...") para no chocar con Better Auth.

import { sql } from 'drizzle-orm'
import type { Db } from './db'

interface Options {
  windowSec: number
  max: number
}

/**
 * Devuelve true si la acción está permitida; false si superó el límite.
 *
 * ⚠️ UN SOLO statement atómico, a propósito. La versión anterior hacía
 * select → decidir → update en tres queries separadas. Con `neon-http` cada
 * query es un request HTTP independiente, así que N peticiones concurrentes
 * leían el mismo contador y **todas pasaban**: bastaba disparar el formulario
 * en paralelo para saltarse el límite por completo y bombardear a alguien con
 * emails de acceso.
 *
 * `ON CONFLICT` sobre el índice único de `key` resuelve la carrera dentro de la
 * base: el contador se incrementa (o se reinicia si venció la ventana) y el
 * valor resultante vuelve en el `RETURNING`, que es sobre el que se decide.
 */
export async function checkRateLimit(db: Db, key: string, opts: Options): Promise<boolean> {
  const now = Date.now()
  const windowMs = opts.windowSec * 1000

  const rows = (await db.execute(sql`
    INSERT INTO rate_limits (id, key, count, last_request)
    VALUES (${crypto.randomUUID()}, ${key}, 1, ${now})
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN ${now} - rate_limits.last_request > ${windowMs} THEN 1
        ELSE rate_limits.count + 1
      END,
      last_request = ${now}
    RETURNING count
  `)) as unknown as { rows?: { count: number }[] } | { count: number }[]

  // `db.execute` devuelve un array de filas con neon-http y `{ rows }` con
  // otros drivers: soportamos ambas formas para no atarnos al driver.
  const list = Array.isArray(rows) ? rows : (rows.rows ?? [])
  const count = Number(list[0]?.count ?? 1)

  return count <= opts.max
}
