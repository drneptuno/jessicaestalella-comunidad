// Carga datos de EJEMPLO para la vista previa (dev). Idempotente: borra los
// datos demo previos y los vuelve a crear. Los demo usan emails @demo.local y
// recursos con url https://demo.* para no tocar datos reales.
//
// Uso: npm run seed:demo   (con PREVIEW_BYPASS_AUTH=true para recorrer sin login)

import { eq, like } from 'drizzle-orm'
import { createDb } from '../src/lib/db'
import { profiles, resources, users } from '../src/lib/db/schema'
import { PREVIEW_USER } from '../src/lib/preview'

const miembras = [
  {
    name: 'Valentina Ríos',
    rubro: 'Diseño de marca',
    zona: 'CABA',
    bio: 'Estudio de branding para emprendimientos liderados por mujeres.',
    ofrezco: 'Identidad visual, naming y sistemas de marca.',
    busco: 'Socia comercial para escalar el estudio.',
    intencion: 'socias' as const,
    instagram: 'valen.estudio',
  },
  {
    name: 'Camila Ferrer',
    rubro: 'Nutrición',
    zona: 'La Plata',
    bio: 'Nutricionista con enfoque en salud hormonal femenina.',
    ofrezco: 'Planes de alimentación y talleres para comunidades.',
    busco: 'Clientas y espacios donde dar charlas.',
    intencion: 'clientas' as const,
    instagram: 'cami.nutre',
  },
  {
    name: 'Lucía Domínguez',
    rubro: 'Contenido & redes',
    zona: 'Rosario',
    bio: 'Ayudo a marcas chicas a sonar como personas.',
    ofrezco: 'Estrategia editorial y gestión de redes.',
    busco: 'Proveedora de diseño y edición de video.',
    intencion: 'proveedoras' as const,
    instagram: null,
  },
  {
    name: 'Mariana Costa',
    rubro: 'Finanzas personales',
    zona: 'Córdoba',
    bio: 'Contadora reconvertida en educadora financiera.',
    ofrezco: 'Mentorías 1:1 y talleres de finanzas para emprendedoras.',
    busco: 'Sumarme como mentora a más comunidades.',
    intencion: 'mentoria' as const,
    instagram: 'mariana.finanzas',
  },
  {
    name: 'Sofía Núñez',
    rubro: 'Fotografía',
    zona: 'CABA',
    bio: 'Fotógrafa de producto y retrato para emprendimientos.',
    ofrezco: 'Sesiones de producto y personal branding.',
    busco: 'Clientas en zona norte y colaboraciones.',
    intencion: 'clientas' as const,
    instagram: 'sofinunez.ph',
  },
]

const recursos = [
  { url: 'https://demo.capitanabsas/guia-precios', title: 'Cómo poner precio a tu servicio', category: 'Guías', description: 'Una guía práctica para dejar de subvaluarte.' },
  { url: 'https://demo.capitanabsas/plantilla-propuesta', title: 'Plantilla de propuesta comercial', category: 'Plantillas', description: 'Modelo editable listo para enviar.' },
  { url: 'https://demo.capitanabsas/checklist-marca', title: 'Checklist de identidad de marca', category: 'Guías', description: 'Todo lo que tu marca necesita antes de lanzar.' },
  { url: 'https://demo.capitanabsas/webinar-redes', title: 'Webinar: redes con intención', category: 'Videos', description: 'Grabación del último encuentro.' },
]

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL no está definida (¿corriste con .env.local?).')
    process.exit(1)
  }
  const db = createDb(process.env.DATABASE_URL)

  // Limpiar demo previo (profiles caen por cascade al borrar users).
  await db.delete(users).where(like(users.email, '%@demo.local'))
  await db.delete(users).where(eq(users.id, PREVIEW_USER.id))
  await db.delete(resources).where(like(resources.url, 'https://demo.%'))

  // Usuaria de vista previa + su perfil.
  await db.insert(users).values({
    id: PREVIEW_USER.id,
    email: PREVIEW_USER.email,
    name: PREVIEW_USER.name,
    role: 'admin',
    emailVerified: true,
  })
  await db.insert(profiles).values({
    userId: PREVIEW_USER.id,
    rubro: 'Psicología',
    zona: 'CABA',
    bio: 'Perfil de ejemplo para la vista previa.',
    ofrezco: 'Acompañamiento y espacios de conexión.',
    busco: 'Conocer a las mujeres de la comunidad.',
    intencion: 'socias',
    instagram: 'capitanabsas',
    visible: true,
  })

  // Miembras demo.
  for (const m of miembras) {
    const id = crypto.randomUUID()
    await db.insert(users).values({
      id,
      email: `${m.name.split(' ')[0].toLowerCase()}@demo.local`,
      name: m.name,
      role: 'member',
      emailVerified: true,
    })
    await db.insert(profiles).values({
      userId: id,
      rubro: m.rubro,
      zona: m.zona,
      bio: m.bio,
      ofrezco: m.ofrezco,
      busco: m.busco,
      intencion: m.intencion,
      instagram: m.instagram,
      visible: true,
    })
  }

  // Recursos demo.
  for (let i = 0; i < recursos.length; i++) {
    await db.insert(resources).values({ id: crypto.randomUUID(), sort: i, ...recursos[i] })
  }

  console.log(`\n✅ Datos demo cargados: 1 usuaria de preview + ${miembras.length} miembras + ${recursos.length} recursos.`)
  console.log('   Poné PREVIEW_BYPASS_AUTH=true en .env.local, corré `npm run dev` y entrá a /app\n')
  process.exit(0)
}

main().catch((err) => {
  console.error('Error en el seed demo:', err)
  process.exit(1)
})
