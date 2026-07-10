# CLAUDE.md — jessicaestalella-academia

## De qué se trata

**Comunidad privada "Capitana BSAS"** de Jessica Estalella
(`capitanabsas.jessicaestalella.com`).

Es un espacio curado por invitación **donde las mujeres se presentan y conectan con
intención**. La persona ingresa con su **email + un código de invitación** (uno por persona,
ligado a su email); en reingresos, magic link. El **corazón del producto es el perfil como
carta de presentación** y el **directorio** de la comunidad; los recursos son secundarios.

> "Academia" quedó solo como nombre interno del repo/carpeta. El producto NO es cursos.

Inspiración de producto: la comunidad de Boosting Women (login por email + código →
dashboard de bienvenida, perfil, directorio, recursos). **La identidad visual NO se copia**:
la academia usa la identidad de Jessica (ver más abajo), no el fucsia del referente.

**División de repos del ecosistema (regla):**

```
jessicaestalella.com            cursos.jessicaestalella.com        academia (este repo)
  Astro 6 + Sanity                Next.js 16 + Better Auth           Astro 6 SSR + Better Auth
  contenido anónimo, SEO          producto pago (checkout)           comunidad privada por invitación
  Cloudflare (static)             Cloudflare (OpenNext)              Cloudflare (SSR)
```

- ¿Contenido para convencer a una visita anónima (home, blog, SEO)? → repo **Astro** (web principal).
- ¿Producto pago, checkout, fulfillment? → repo **cursos** (Next.js).
- ¿Comunidad privada por invitación (perfiles, directorio, recursos)? → **este repo**.

Cero código compartido entre repos; se conectan solo por URLs. El repo de cursos es una
**referencia de patrones** de auth/DB/seguridad, no una dependencia.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | **Astro 6 (SSR)** — `output: 'server'`, adapter `@astrojs/cloudflare` |
| Interactividad | React (islas con `client:load` / `client:visible`) solo donde hay estado |
| Estilos | Tailwind CSS v4 — tokens en `src/styles/globals.css` con `@theme inline` |
| Auth | **Better Auth** — sesiones en NUESTRO Postgres. Acceso gated por código de invitación |
| Base de datos | **PostgreSQL (Neon)** + **Drizzle ORM** (driver `postgres.js`) |
| Email | Resend (envío de código / notificaciones) |
| Deploy | Cloudflare Workers/Pages (SSR) |
| Lenguaje | TypeScript strict |

### Principio rector: menor lock-in reversible
- Ningún componente/página importa un SDK de proveedor directo. Todo pasa por `src/lib/`
  con interfaces propias y adapters (`email/`, `db/`).
- Postgres puro (salida: `pg_dump`), driver `postgres.js` portable.
- El adapter de Cloudflare es capa de build, no código de la app.

## Identidad visual (heredada del ecosistema)

Mismos tokens que la web principal. **Usar siempre `var(--color-*)`, nunca hex directos.**

### Colores
| Nombre | Hex | Token | Uso |
|--------|-----|-------|-----|
| Azul marino | `#203f62` | `--color-brand-primary` | Primario — nav, headings, fondos oscuros |
| Naranja | `#ff7e21` | `--color-brand-secondary` | CTAs, botones de acción, hover |
| Verde agua | `#0c96a9` | `--color-brand-accent` | Acento — badges, links, highlights |
| Cremita | `#efe7df` | `--color-brand-neutral` | Fondos alternados, cards |
| Blanco tiza | `#f6f5f3` | `--color-brand-chalk` | Fondo base |

> Existen variantes accesibles (`-ink`, `-light`) para texto chico sobre fondos claros/navy.
> Copiar la sección `@theme inline` completa desde el repo Astro principal.

### Tipografía
| Rol | Fuente | Token | Uso |
|-----|--------|-------|-----|
| Primaria | **League Spartan** | `--font-display` | h1–h4, CTAs, nav |
| Secundaria | **Libre Baskerville** | `--font-body` | Párrafos, cuerpo |
| Terciaria | Libre Baskerville *italic* | `italic` sobre `font-body` | Citas, destacados |

## Seguridad — reglas no negociables

Toda implementación las respeta. Sin excepciones.

**Auth y acceso por código**
- El acceso se otorga **solo** validando el código de invitación en el servidor contra la DB.
- Códigos: hasheados en reposo (nunca en texto plano), de un solo uso o con cupo/expiración,
  ligados a un email o a una invitación concreta. Comparación en tiempo constante.
- **RBAC en el servidor** en cada ruta protegida y API. Jamás confiar en ocultar UI.
- Sesiones gestionadas por Better Auth (cookies `HttpOnly`, `Secure`, `SameSite`).
- Rate limiting estricto en login/canje de código (por IP y por email) para frenar fuerza bruta.
- Enumeración: respuestas y tiempos uniformes ante email/código válido o inválido.

**Inputs y datos externos**
- Validar **todo** input en el servidor con **Zod** (tipo, longitud, formato). Nunca solo cliente.
- Endpoints API validan `Content-Type: application/json` antes de parsear el body.
- `encodeURIComponent` / escape al interpolar datos externos en HTML o URLs.
- Nunca `set:html` con datos de usuario. `rel="noopener noreferrer"` en links externos.

**Secretos y entorno**
- Solo `PUBLIC_` va al cliente. API keys (Resend), `DATABASE_URL`, `BETTER_AUTH_SECRET`:
  solo server-side, vía `wrangler secret put` en prod. Nunca en `wrangler.jsonc` ni en el repo.
- Nunca loggear secretos, tokens, emails ni códigos en producción.

**Headers HTTP** (configurar en `_headers` de Cloudflare o middleware SSR):
```
Content-Security-Policy: (restrictiva; sin inline scripts salvo nonce)
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

**Datos de miembros (PII)**
- El directorio muestra solo campos que la miembro marcó como visibles. Opt-in explícito.
- Migraciones solo vía `drizzle-kit generate` — nunca editar SQL a mano ni tocar la DB directo.
- Toda acción de admin (generar códigos, dar de baja) se registra en `audit_logs`.

## Escalabilidad — principios

- Componentes atómicos: cada uno hace una sola cosa.
- Astro puro (cero JS) para todo lo estático; islas React solo con estado.
- Queries en `src/lib/db/queries.ts`, nunca inline en páginas.
- Tipos derivados del esquema Drizzle; interfaces centralizadas en `src/types/`.
- URLs y dominios siempre por env var. Nunca hardcodear.
- CSS con tokens del `@theme`. Sin hex sueltos.

## Buenas prácticas

- TypeScript strict, sin `any`.
- Imágenes con `width`/`height` explícitos (evitar CLS), `loading="lazy"` below-the-fold.
- `alt` descriptivo; decorativas `alt=""`.
- Accesibilidad AA: foco visible, labels en formularios, roles ARIA, contraste mínimo.
- API routes en Astro necesitan SSR (`export const prerender = false` donde aplique).

## Skills a invocar

**Frontend / UI** — antes de implementar componentes visuales:
`/brainstorming` (features nuevas) · `/frontend-design` · `/impeccable` (pulido) ·
`/css-animations` · `/ui-ux-pro-max`.

**Planes** — `/writing-plans` para planificar fases o tareas multi-paso.

**Seguridad** — `/security-review` antes de mergear cualquier cosa de auth, códigos o
manejo de PII; agente `security-auditor` para revisión profunda.

## Flujo de trabajo por sesión

1. Leer `sessions/` para el contexto de sesiones anteriores.
2. Leer `PLAN.md` y ubicar la fase/tarea actual.
3. Implementar respetando seguridad y lock-in mínimo.
4. Al terminar cada tarea: actualizar `sessions/SESION-N.md` y commitear.
5. Al finalizar la sesión: push.

### Commits
- En español, formato `tipo: descripción`, orientados al qué y por qué.
- Co-autoría con Claude.

## Estructura objetivo

```
src/
  pages/            # rutas (file-based) — públicas + protegidas + api/
    api/            # endpoints SSR (login, canje de código, perfil)
  layouts/          # BaseLayout, AppLayout (post-login)
  components/
    layout/         # Header, Footer, Nav de la app
    sections/       # bloques del dashboard
    islands/        # islas React (formularios, menú)
    shared/         # reutilizables
  lib/
    auth/           # config Better Auth + helpers de sesión
    db/             # index.ts (cliente), schema.ts, queries.ts
    email/          # interface + adapter Resend
    rate-limit.ts
  styles/globals.css # Tailwind v4 + tokens (copiar del repo Astro)
  types/
drizzle/            # migraciones SQL versionadas (se commitean)
wrangler.jsonc      # config Worker — secrets NUNCA acá
```
