// Agrega un recurso (enlace) a la sección Recursos.
//
// Uso:
//   npm run recurso -- <url> "<título>" ["categoría"] ["descripción"] [orden]
// Ejemplo:
//   npm run recurso -- https://ejemplo.com/guia "Guía de precios" "Guías" "Cómo poner precio a tu servicio" 1

import { createDb } from '../src/lib/db'
import { resources } from '../src/lib/db/schema'

async function main() {
  const [url, title, category, description, sortArg] = process.argv.slice(2)

  if (!url || !title) {
    console.error(
      'Faltan datos.\n  npm run recurso -- <url> "<título>" ["categoría"] ["descripción"] [orden]',
    )
    process.exit(1)
  }
  if (!/^https?:\/\//i.test(url)) {
    console.error('La URL debe empezar con http:// o https://')
    process.exit(1)
  }
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL no está definida (¿corriste con .env.local?).')
    process.exit(1)
  }

  const db = createDb(process.env.DATABASE_URL)
  await db.insert(resources).values({
    id: crypto.randomUUID(),
    url,
    title: title.trim(),
    category: category?.trim() || 'General',
    description: description?.trim() || null,
    sort: sortArg ? Number(sortArg) || 0 : 0,
  })

  console.log('\n✅ Recurso agregado')
  console.log('   Título:   ', title)
  console.log('   Categoría:', category?.trim() || 'General')
  console.log('   URL:      ', url, '\n')
  process.exit(0)
}

main().catch((err) => {
  console.error('Error agregando el recurso:', err)
  process.exit(1)
})
