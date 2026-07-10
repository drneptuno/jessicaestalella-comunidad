# PLAN — Academia (comunidad privada)

Plan por fases. Cada fase se entrega funcionando, verificada y commiteada. No se pasa a la
siguiente sin cumplir los criterios de aceptación. Detalle de convenciones en `CLAUDE.md`.

## Visión

Espacio privado de comunidad de Jessica Estalella. Entrada por **email + código de
invitación**. Post-login: dashboard de bienvenida, perfil de miembro, directorio de la
comunidad y recursos. Identidad visual de Jessica. Stack Astro SSR + Better Auth + Drizzle
+ Postgres (Neon) en Cloudflare.

## Decisiones cerradas

- **Stack:** Astro 6 (SSR, últimas versiones) + Better Auth + Drizzle + Postgres (Neon) + Cloudflare + Resend.
- **Acceso:** email + código de invitación (curado, sin pagos en la plataforma).
- **MVP v1:** dashboard de bienvenida, perfil, directorio/comunidad, recursos.
- **Dominio:** por confirmar con Jessi → variable `PUBLIC_SITE_URL` (candidatos:
  `academia.` o `comunidad.jessicaestalella.com`).

## Decisiones a confirmar antes de F1

- **Modelo de código:** ¿un código por persona (ligado a su email, un solo uso) o códigos
  de campaña con cupo/expiración? → recomendado: **uno por persona, ligado a email**.
- **Sesión:** ¿el código es solo la primera vez (luego magic link / contraseña) o se pide
  siempre? → recomendado: **código canjea una invitación y crea la sesión; reingresos por
  magic link al email**. (Sin contraseñas = menos superficie de ataque.)
- **Recursos:** ¿archivos propios (requiere almacenamiento tipo R2) o solo enlaces/embeds?
  → recomendado v1: **enlaces/embeds**, sin almacenamiento propio.

---

## F0 — Fundaciones

- Scaffold **Astro 6** SSR (`output: 'server'`, adapter Cloudflare). Node ≥ 22.12.
  Todas las deps en su última versión (alineadas con el repo Astro principal).
- Tailwind v4 + `globals.css` con los tokens copiados del repo Astro principal.
- Fuentes (`@fontsource/league-spartan`, `@fontsource/libre-baskerville`).
- Drizzle + `postgres.js` conectado a Neon. `drizzle.config.ts`, scripts `db:*`.
- `.env.local.example`, `wrangler.jsonc` (sin secretos), `_headers` con headers de seguridad.
- `CLAUDE.md`, `PLAN.md`, `ROADMAP.md`, `sessions/`, `.github/`, git init + primer commit.
- **Aceptación:** `npm run dev` levanta; página placeholder con identidad correcta; `db:studio`
  conecta a Neon; typecheck y build pasan.

## F1 — Auth por código de invitación

- Esquema Drizzle: `user`, `session`, `account`, `verification` (Better Auth) + `invitation`
  (código hasheado, email destino, estado, expiración, cupo, timestamps).
- Config Better Auth sobre Postgres. Endpoint de canje: valida email + código en servidor
  (Zod, comparación en tiempo constante), marca la invitación usada, crea sesión.
- Reingreso por magic link (email vía Resend).
- Rate limiting por IP y email; respuestas/tiempos uniformes (anti-enumeración).
- Middleware SSR que protege rutas de `/app/*`; redirección a login si no hay sesión.
- Página de login (email + código) con identidad de Jessica. Logout.
- **Aceptación:** invitación válida entra y crea sesión; inválida/expirada/usada es rechazada
  sin filtrar información; rutas protegidas inaccesibles sin sesión; rate limit activo.
  `/security-review` en verde.

## F2 — Perfil de miembro

- Extender esquema: `profile` (nombre, bio, proyecto, links, foto/avatar, flags de
  visibilidad por campo). Relación 1–1 con `user`.
- Formulario de perfil (isla React) con validación Zod servidor + cliente.
- Avatar: v1 por URL o iniciales generadas; almacenamiento propio queda para después.
- Opt-in explícito de visibilidad por campo (qué se muestra en el directorio).
- **Aceptación:** la miembro completa y edita su perfil; los cambios persisten; campos
  privados nunca se exponen en API ni HTML.

## F3 — Directorio / comunidad

- Listado paginado de miembros con perfil visible; búsqueda/filtro básico (nombre, proyecto).
- Vista de detalle de un perfil (solo campos visibles).
- Queries en `lib/db/queries.ts`; nunca exponer PII no opt-in.
- **Aceptación:** el directorio lista solo perfiles opt-in; búsqueda funciona; sin fugas de
  campos privados; paginación estable.

## F4 — Recursos + Dashboard de bienvenida

- Dashboard post-login: tarjetas de próximos pasos (perfil, explorar, recursos, conectar) con
  copy de Jessica. Base visual = la captura del referente, identidad propia.
- Sección de recursos: listado de herramientas/guías/materiales (enlaces/embeds v1).
- **Aceptación:** dashboard refleja el estado real (p. ej. "completá tu perfil" si falta);
  recursos navegables; responsive AA.

## F5 — Admin de invitaciones

- Panel mínimo (rol admin): generar códigos, ver estado, dar de baja miembros.
- Todo registrado en `audit_logs`. RBAC servidor.
- **Aceptación:** solo admin accede; generar/revocar funciona y queda auditado.

## F6 — Deploy y hardening

- Deploy SSR a Cloudflare; `wrangler secret put` para secretos; dominio definitivo.
- Revisión de seguridad final (`security-auditor`), `npm audit`, headers verificados en prod,
  prueba end-to-end del flujo completo.
- **Aceptación:** flujo real en el dominio de producción; headers y CSP correctos; sin
  secretos expuestos; auditoría sin hallazgos altos/moderados.

---

## Riesgos / notas

- **Astro SSR + Better Auth en Cloudflare Workers** es camino relativamente nuevo: validar
  temprano en F1 que Better Auth corre en el runtime de Workers (handler + cookies). Si hubiese
  fricción seria, evaluar Astro con adapter Node en un contenedor antes de cambiar de stack.
- Astro 6 (última) alineado con el repo principal. Anclar versiones exactas en F0.
- El envío de email (Resend) debe tener dominio verificado antes de F1 productivo.
