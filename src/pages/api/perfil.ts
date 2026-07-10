import type { APIRoute } from 'astro'
import { z } from 'zod'
import { getAuth } from '../../lib/auth'
import { createDb } from '../../lib/db'
import { upsertProfile } from '../../lib/db/queries'
import { getServerEnv } from '../../lib/env'

export const prerender = false

const schema = z.object({
  rubro: z.string().max(80).optional(),
  zona: z.string().max(80).optional(),
  bio: z.string().max(600).optional(),
  ofrezco: z.string().max(400).optional(),
  busco: z.string().max(400).optional(),
  intencion: z.enum(['socias', 'clientas', 'proveedoras', 'mentoria']).optional(),
  instagram: z.string().max(100).optional(),
  sitioWeb: z.string().max(200).optional(),
  visible: z.string().optional(), // checkbox: 'on' o ausente
})

function seeOther(path: string): Response {
  return new Response(null, { status: 303, headers: { Location: path } })
}

/** '' → null; recorta espacios. */
function limpio(v: string | undefined): string | null {
  const t = v?.trim()
  return t ? t : null
}

export const POST: APIRoute = async ({ request }) => {
  const env = getServerEnv()
  const auth = getAuth(env)
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return seeOther('/ingresar')

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return seeOther('/app/perfil?error=datos')
  }

  const parsed = schema.safeParse({
    rubro: form.get('rubro') || undefined,
    zona: form.get('zona') || undefined,
    bio: form.get('bio') || undefined,
    ofrezco: form.get('ofrezco') || undefined,
    busco: form.get('busco') || undefined,
    intencion: form.get('intencion') || undefined,
    instagram: form.get('instagram') || undefined,
    sitioWeb: form.get('sitioWeb') || undefined,
    visible: form.get('visible') || undefined,
  })
  if (!parsed.success) return seeOther('/app/perfil?error=datos')

  const d = parsed.data

  // Normalizaciones suaves.
  const instagram = limpio(d.instagram)?.replace(/^@+/, '').replace(/\s+/g, '') ?? null
  let sitioWeb = limpio(d.sitioWeb)
  if (sitioWeb && !/^https?:\/\//i.test(sitioWeb)) sitioWeb = `https://${sitioWeb}`

  const db = createDb(env.DATABASE_URL)
  await upsertProfile(db, session.user.id, {
    rubro: limpio(d.rubro),
    zona: limpio(d.zona),
    bio: limpio(d.bio),
    ofrezco: limpio(d.ofrezco),
    busco: limpio(d.busco),
    intencion: d.intencion ?? null,
    instagram,
    sitioWeb,
    avatarUrl: null,
    visible: d.visible === 'on',
  })

  return seeOther('/app/perfil?guardado=1')
}
