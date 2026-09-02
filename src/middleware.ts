import { defineMiddleware } from 'astro:middleware'
import { getAuth } from './lib/auth'
import { createDb } from './lib/db'
import { getServerEnv } from './lib/env'
import { ensureAccess } from './lib/membership'
import { PREVIEW_USER, PREVIEW_USER_ID } from './lib/preview'

// Zonas privadas: requieren sesión Y pertenencia a la comunidad.
//
// ⚠️ Las dos condiciones son distintas y ambas necesarias. La sesión es
// compartida con `cursos` (misma cookie en el dominio padre), así que una
// alumna que solo compró un curso llega acá YA autenticada. Sin el segundo
// chequeo entraría al muro privado. Ver src/lib/membership.ts.
//
// ⚠️ LISTA BLANCA, no lista negra: todo está protegido salvo lo que figure acá.
// Antes esto era una lista de prefijos protegidos (`/app`, `/muro`) y los
// endpoints `/api/perfil` y `/api/presentarme` quedaban fuera del gate: con solo
// tener sesión —cualquier alumna de cursos— se podía publicar en el muro y
// contactar miembras. Invertido para que una ruta nueva nazca cerrada.
const PUBLIC_PATHS = new Set([
  '/', // portada pública
  '/ingresar', // login
  '/sin-acceso', // autenticada pero sin membresía
  '/api/ingresar', // canje de invitación / pedido de magic link
])
const LOGIN_PATH = '/ingresar'

/** ¿Ruta pública? Todo lo demás exige sesión + membresía activa. */
function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true
  // Archivos estáticos servidos por el Worker (favicon, /marca/*.svg, etc.).
  if (/\.[a-z0-9]+$/i.test(pathname)) return true
  return false
}

export const onRequest = defineMiddleware(async (context, next) => {
  // Los endpoints de Better Auth se manejan solos.
  if (context.url.pathname.startsWith('/api/auth')) {
    return next()
  }

  const env = getServerEnv()

  // VISTA PREVIA (solo dev): inyecta una usuaria ficticia y saltea la auth.
  // import.meta.env.DEV es false en el build de prod → rama muerta en producción.
  // Tercer candado: COOKIE_DOMAIN solo existe en producción (ver preview.ts).
  if (import.meta.env.DEV && env.PREVIEW_BYPASS_AUTH === 'true' && !env.COOKIE_DOMAIN) {
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

  const isPrivate = !isPublicPath(context.url.pathname)

  if (isPrivate) {
    const isApi = context.url.pathname.startsWith('/api/')
    if (!session) {
      return isApi
        ? new Response(null, { status: 401 })
        : withSecurityHeaders(context.redirect(LOGIN_PATH), isPrivate)
    }
    // Autenticada, pero ¿pertenece? `ensureAccess` además da el alta automática
    // si tiene una membresía vigente en cursos (una compra habilita la
    // comunidad sin intervención manual), y revoca si ya no la tiene.
    const db = createDb(env.DATABASE_URL)
    const allowed = await ensureAccess(db, session.user.id)
    if (!allowed) {
      return isApi
        ? new Response(null, { status: 403 })
        : withSecurityHeaders(context.redirect('/sin-acceso'), isPrivate)
    }
  }

  return withSecurityHeaders(await next(), isPrivate)
})

/**
 * Cabeceras de seguridad para las respuestas del SSR.
 *
 * ⚠️ `public/_headers` NO alcanza: en Workers ese archivo solo se aplica a lo
 * que sirve el binding de assets estáticos, y todas las páginas de este sitio
 * son `prerender = false`, o sea generadas por el Worker. Sin esto, el muro y
 * el perfil salían sin CSP, sin `nosniff` y sin HSTS.
 */
function withSecurityHeaders(res: Response, isPrivate: boolean): Response {
  const h = res.headers
  h.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      // Astro inyecta estilos en línea; las fuentes son self-hosted (Fontsource).
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "base-uri 'none'",
      "object-src 'none'",
    ].join('; '),
  )
  h.set('X-Content-Type-Options', 'nosniff')
  h.set('X-Frame-Options', 'DENY')
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  h.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  // Datos personales de las miembras: que no queden en cachés intermedias.
  if (isPrivate) h.set('Cache-Control', 'private, no-store')
  return res
}
