import { defineMiddleware } from 'astro:middleware'
import { getAuth } from './lib/auth'
import { getServerEnv } from './lib/env'

// Zonas privadas: requieren sesión.
const PROTECTED_PREFIXES = ['/app', '/muro']
const LOGIN_PATH = '/ingresar'

export const onRequest = defineMiddleware(async (context, next) => {
  // Los endpoints de Better Auth se manejan solos.
  if (context.url.pathname.startsWith('/api/auth')) {
    return next()
  }

  const auth = getAuth(getServerEnv())
  const session = await auth.api.getSession({ headers: context.request.headers })

  context.locals.user = session?.user ?? null
  context.locals.session = session?.session ?? null

  const isProtected = PROTECTED_PREFIXES.some((p) => context.url.pathname.startsWith(p))
  if (isProtected && !session) {
    return context.redirect(LOGIN_PATH)
  }

  return next()
})
