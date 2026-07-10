import { defineMiddleware } from 'astro:middleware'
import { getAuth } from './lib/auth'
import { getServerEnv } from './lib/env'

// Zonas privadas: todo bajo /app requiere sesión.
const PROTECTED_PREFIX = '/app'
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

  if (context.url.pathname.startsWith(PROTECTED_PREFIX) && !session) {
    return context.redirect(LOGIN_PATH)
  }

  return next()
})
