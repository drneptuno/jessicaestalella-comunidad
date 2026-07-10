# Arquitectura

← Volver al [índice de documentación](./README.md)

## Ecosistema (3 repos, un todo)

```
jessicaestalella.com            cursos.jessicaestalella.com     capitanabsas.jessicaestalella.com
  Astro 6 + Sanity                Next.js 16 + Better Auth        Astro 6 SSR + Better Auth  (ESTE)
  marketing, blog, SEO            producto pago (checkout)        comunidad privada
  contenido anónimo               login + DB                      login + DB
```

Regla del ecosistema: **cero código compartido**; los repos se conectan solo por URLs y por
servicios (Resend, MailerLite, Neon). El repo `cursos` es **referencia de patrones** de
auth/DB/seguridad, no una dependencia.

## Stack de este repo

| Capa | Tecnología |
|------|-----------|
| Framework | Astro 6 (SSR, `output: 'server'`) + adapter `@astrojs/cloudflare` |
| UI | Componentes Astro; React solo para islas con estado |
| Estilos | Tailwind v4 (`@theme inline` en `src/styles/globals.css`) |
| Auth | Better Auth (magic link), sesiones en nuestro Postgres |
| DB | Neon (Postgres) + Drizzle ORM · driver `neon-http` |
| Email | Resend (transaccional) · MailerLite (marketing) |
| Deploy | Cloudflare Workers |
| Lenguaje | TypeScript strict |

## Estructura de carpetas

```
src/
  pages/            # rutas file-based
    ingresar.astro        # login (email + código)
    app/                  # área privada (protegida): index, perfil
    muro/                 # muro (protegido): index, presentarme
    api/                  # endpoints SSR: auth/[...all], ingresar, perfil, presentarme
  layouts/BaseLayout.astro
  components/layout/AppHeader.astro
  lib/
    auth/           # Better Auth (factory por-request)
    db/             # index (cliente neon-http), schema, queries
    email/          # interface + adapter Resend
    marketing/      # adapter MailerLite
    env.ts          # getServerEnv() — lee cloudflare:workers
    invitations.ts  # generar/hashear/comparar códigos
    rate-limit.ts   # rate limit en DB
  middleware.ts     # sesión en locals + protección de /app y /muro
  styles/globals.css
drizzle/            # migraciones SQL versionadas
```

## Runtime: gotchas importantes (Astro 6 + Cloudflare)

Estas cosas **no son obvias** y ya nos costaron; están resueltas y documentadas:

1. **Env/secretos**: `Astro.locals.runtime.env` fue **eliminado en Astro 6**. Se lee con
   `import { env } from 'cloudflare:workers'`. Centralizado en `src/lib/env.ts` (`getServerEnv()`).
2. **DB driver**: `postgres.js` (TCP) sobre Workers se corta entre requests
   ("Network connection lost"). Usamos **`neon-http`** (HTTP por query). Better Auth no usa
   transacciones interactivas, así que alcanza. Migraciones sí usan `postgres.js` (Node).
3. **CSRF**: Astro valida el header `Origin` en POST de formularios (`checkOrigin`, activo).
   En navegador anda solo; por `curl` hay que mandar `-H "Origin: <site>"`.
4. **Better Auth por-request**: se crea con `getAuth(getServerEnv())` (memoizado por
   `DATABASE_URL`); en Workers no hay singleton global con secretos al importar el módulo.

## Flujo de un request

```
request → src/middleware.ts
            ├─ /api/auth/* → pasa directo (lo maneja Better Auth)
            └─ resto → getSession() → locals.user/session
                        └─ si ruta protegida (/app, /muro) y sin sesión → redirect /ingresar
          → página o endpoint
```

## Ver también
- [`../CLAUDE.md`](../CLAUDE.md) (notas del runtime, seguridad) · [`base-de-datos.md`](./base-de-datos.md) · [`acceso-y-auth.md`](./acceso-y-auth.md)
