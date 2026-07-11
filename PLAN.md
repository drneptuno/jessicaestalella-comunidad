# PLAN — Comunidad Capitana BSAS

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
- **Dominio:** `capitanabsas.jessicaestalella.com` (nombre público de la comunidad:
  **Capitana BSAS**). En dev, `PUBLIC_SITE_URL=http://localhost:4321`.
- **Modelo de código:** **uno por persona, ligado a su email, un solo uso.** ✅
- **Sesión:** el código canjea la invitación y crea la sesión; **reingresos por magic link
  al email** (sin contraseñas = menos superficie de ataque). ✅

## Reencuadre de foco (importante)

El producto NO es una "academia/cursos": es una **comunidad donde las mujeres se
presentan y conectan con intención**. El corazón es el **perfil como carta de presentación**
y el **directorio**; recursos y kit digital son secundarios. Ver diferenciales acordados abajo.

## Decisiones a confirmar

- **Recursos:** ¿archivos propios (R2) o solo enlaces/embeds? → recomendado v1: **enlaces/embeds**.
- **Diferenciales v1** (ver sección al final): confirmar cuáles entran en el MVP.

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

## F1.5 — Gate por grupo de MailerLite (unifica el ecosistema)

El acceso real al producto viene de una **compra** (repo cursos) que, vía automatización,
suma el email a un **grupo de MailerLite**. Ese grupo es la fuente de verdad de quién puede
entrar. MailerLite además corre el circuito de bienvenida/marketing que Jessica ya tiene
(hoy manual en WordPress).

- Ingreso por **email solo**: al primer ingreso, verificar contra la API de MailerLite si el
  email está en el grupo habilitado (`GET /api/subscribers/{email}` → grupos). Si está →
  crear usuaria + magic link. Si no → respuesta genérica.
- Los **códigos de invitación** (F1) quedan como vía **manual/curada** (invitadas, pruebas,
  altas fuera de compra). Dos puertas conviviendo.
- Solo se consulta MailerLite en el **primer ingreso** (luego la usuaria existe y reingresa
  por magic link) → sin dependencia de MailerLite en cada login.
- **Aceptación:** email en el grupo entra sin código; email fuera del grupo no; el código
  manual sigue funcionando; sin fugas de si el email existe o no.

## F2 — Perfil de miembro

- Extender esquema: `profile` (nombre, bio, proyecto, links, foto/avatar, flags de
  visibilidad por campo). Relación 1–1 con `user`.
- Formulario de perfil (isla React) con validación Zod servidor + cliente.
- Avatar: v1 por URL o iniciales generadas; almacenamiento propio queda para después.
- Opt-in explícito de visibilidad por campo (qué se muestra en el directorio).
- **Aceptación:** la miembro completa y edita su perfil; los cambios persisten; campos
  privados nunca se exponen en API ni HTML.

## F3 — Muro / tablero de presentaciones (estilo Padlet)

Corazón del producto. En vez de un listado formal, un **muro visual de tarjetas**: cada
miembra tiene su tarjeta de presentación (= su perfil renderizado como card).

- Grid responsive de tarjetas (masonry/columnas), cada una con foto/inicial, nombre, rubro,
  y un resumen de "qué ofrezco / qué busco".
- Click en una tarjeta → vista ampliada con el perfil completo (solo campos visibles) y el
  botón "presentarme" (contacto con intención).
- Filtros por rubro, zona e intención (busca socias / clientas / proveedoras / mentoría).
- (Opcional v1) reacción simple tipo "me interesa" para dar señales de vida.
- Secciones/columnas por rubro curadas por Jessica (opcional, fast-follow).
- Queries en `lib/db/queries.ts`; nunca exponer PII no opt-in.
- **Aceptación:** el muro muestra solo tarjetas opt-in; filtros funcionan; abrir una tarjeta
  no filtra campos privados; responsive y AA.

## F4 — Recursos + Dashboard de bienvenida

- Dashboard post-login: tarjetas de próximos pasos (perfil, explorar, recursos, conectar) con
  copy de Jessica. Base visual = la captura del referente, identidad propia.
- Sección de recursos: listado de herramientas/guías/materiales (enlaces/embeds v1).
- **Aceptación:** dashboard refleja el estado real (p. ej. "completá tu perfil" si falta);
  recursos navegables; responsive AA.

## F5 — Panel de administración

- Panel (rol admin): invitaciones (generar/revocar), miembras (baja/alta), recursos (CRUD).
- Todo registrado en `audit_logs`. RBAC servidor.
- **Aceptación:** solo admin accede; generar/revocar funciona y queda auditado.
- **Plan detallado de implementación:** [`docs/plan-f5-admin.md`](./docs/plan-f5-admin.md).

## F6 — Deploy y hardening

- Deploy SSR a Cloudflare; `wrangler secret put` para secretos; dominio definitivo.
- Revisión de seguridad final (`security-auditor`), `npm audit`, headers verificados en prod,
  prueba end-to-end del flujo completo.
- **Aceptación:** flujo real en el dominio de producción; headers y CSP correctos; sin
  secretos expuestos; auditoría sin hallazgos altos/moderados.

---

## Diferenciales vs. el referente (Boosting Women)

Modelo mental: un **muro tipo Padlet** de tarjetas de presentación, pero privado, curado y
con la identidad de Jessica. El referente (Boosting Women) es un directorio + recursos
estático; Padlet es un muro genérico sin identidad ni intención. Combinamos lo mejor de los
dos y le sumamos foco. (⭐ = recomendado para v1):

1. ⭐ **Perfil con intención estructurada** — no solo bio: campos "qué ofrezco" y "qué
   busco/necesito" + rubro + ubicación. El perfil deja de ser vitrina y habilita el match.
2. ⭐ **Buscador por intención** — filtrar por rubro, zona y por "busca socias / clientas /
   proveedoras / mentoría", no solo por nombre.
3. ⭐ **Contacto con intención** — botón "presentarme" que envía una intro por email (Resend)
   sin exponer datos de contacto. Privacidad + acción real.
4. ⭐ **Identidad y calidez de Jessica** — editorial y cuidada, lo opuesto a la plantilla
   genérica; es el activo que el referente no puede copiar.
5. **Muro de bienvenidas** — al entrar, la nueva se presenta y aparece en un feed reciente.
   Da vida y sensación de comunidad activa vs. listado estático. (fast-follow post-v1)
6. **Destacadas rotativas** — Jessica destaca perfiles; la home se siente curada. (fast-follow)
7. **Onboarding guiado + % de perfil** — empuja a completar (perfiles completos = directorio útil).
8. **Privacidad granular opt-in** por campo — confianza; mejor que exponer todo por defecto.

> v1 recomendado: 1 + 2 + 3 + 4 + 8 (con 7 como parte natural del flujo de perfil).
> 5 y 6 quedan como fast-follows una vez que hay masa crítica de perfiles.

## Riesgos / notas

- **Astro SSR + Better Auth en Cloudflare Workers** es camino relativamente nuevo: validar
  temprano en F1 que Better Auth corre en el runtime de Workers (handler + cookies). Si hubiese
  fricción seria, evaluar Astro con adapter Node en un contenedor antes de cambiar de stack.
- Astro 6 (última) alineado con el repo principal. Anclar versiones exactas en F0.
- El envío de email (Resend) debe tener dominio verificado antes de F1 productivo.
