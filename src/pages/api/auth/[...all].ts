import type { APIRoute } from 'astro'
import { getAuth } from '../../../lib/auth'
import { getServerEnv } from '../../../lib/env'

export const prerender = false

// Monta todos los endpoints de Better Auth bajo /api/auth/*.
export const ALL: APIRoute = (context) => {
  const auth = getAuth(getServerEnv())
  return auth.handler(context.request)
}
