import { defineMiddleware } from 'astro:middleware'
import { getAuth } from './lib/auth'
import { getServerEnv } from './lib/env'
import { PREVIEW_USER, PREVIEW_USER_ID } from './lib/preview'

// Zonas privadas: requieren sesión.
const PROTECTED_PREFIXES = ['/app', '/muro']
const LOGIN_PATH = '/ingresar'

export const onRequest = defineMiddleware(async (context, next) => {
  // Los endpoints de Better Auth se manejan solos.
  if (context.url.pathname.startsWith('/api/auth')) {
    return next()
  }

  const env = getServerEnv()

  // VISTA PREVIA (solo dev): inyecta una usuaria ficticia y saltea la auth.
  // import.meta.env.DEV es false en el build de prod → rama muerta en producción.
  if (import.meta.env.DEV && env.PREVIEW_BYPASS_AUTH === 'true') {
    context.locals.user = { ...PREVIEW_USER }
    context.locals.session = {
      id: 'preview',
      userId: PREVIEW_USER_ID,
      expiresAt: new Date(Date.now() + 86_400_000),
    }
    return next()
  }

  const auth = getAuth(env)
  const session = await auth.api.getSession({ headers: context.request.headers })

  context.locals.user = session?.user ?? null
  context.locals.session = session?.session ?? null

  const isProtected = PROTECTED_PREFIXES.some((p) => context.url.pathname.startsWith(p))
  if (isProtected && !session) {
    return context.redirect(LOGIN_PATH)
  }

  return next()
})
