// Genera una invitación: crea el registro (código HASHEADO) e imprime el
// código en texto plano UNA sola vez para compartírselo a la persona.
//
// Uso:
//   npm run invitar -- <email> ["Nombre Apellido"] [díasDeVigencia]
// Ejemplo:
//   npm run invitar -- valen@ejemplo.com "Valentina Ríos" 30

import { createDb } from '../src/lib/db'
import { invitations } from '../src/lib/db/schema'
import { generateCode, hashCode, normalizeEmail } from '../src/lib/invitations'

async function main() {
  const [emailArg, nameArg, diasArg] = process.argv.slice(2)

  if (!emailArg) {
    console.error('Falta el email.\n  npm run invitar -- <email> ["Nombre"] [díasDeVigencia]')
    process.exit(1)
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('DATABASE_URL no está definida (¿corriste con .env.local?).')
    process.exit(1)
  }

  const email = normalizeEmail(emailArg)
  const name = nameArg?.trim() || null
  const dias = diasArg ? Number(diasArg) : 30
  const expiresAt =
    Number.isFinite(dias) && dias > 0 ? new Date(Date.now() + dias * 24 * 60 * 60 * 1000) : null

  const code = generateCode()
  const codeHash = await hashCode(code)

  const db = createDb(databaseUrl)
  await db.insert(invitations).values({
    id: crypto.randomUUID(),
    email,
    codeHash,
    name,
    status: 'pending',
    expiresAt,
    createdBy: 'script',
  })

  console.log('\n✅ Invitación creada')
  console.log('   Email:  ', email)
  if (name) console.log('   Nombre: ', name)
  console.log('   Vence:  ', expiresAt ? expiresAt.toISOString() : 'sin vencimiento')
  console.log('\n   ── Código (compartir con la persona, no se vuelve a mostrar) ──')
  console.log(`   👉  ${code}\n`)

  process.exit(0)
}

main().catch((err) => {
  console.error('Error creando la invitación:', err)
  process.exit(1)
})
