# Sesión 4 — Perfil de miembro (F2) + decisión de acceso por MailerLite

## Decisión de producto (importante)
Los 3 repos son un todo: un cliente **compra un acceso** (repo cursos) y esa compra incluye
el acceso a esta comunidad. **MailerLite es el pilar**: la compra dispara una automatización
que suma el email a un grupo, y ahí corre el circuito de bienvenida/marketing que Jessica ya
tiene (hoy manual en WordPress porque no le funciona).

→ Nuevo plan de acceso (registrado como **F1.5** en PLAN.md): el **gate principal será estar
en el grupo de MailerLite** (ingreso por email solo, verificando el grupo al primer acceso).
Los **códigos de invitación** (F1) quedan como vía manual/curada. Dos puertas conviviendo.
No implementado aún; F2 es independiente del gate.

## Hecho (F2)
- Esquema: tabla `profiles` (1-1 con users): rubro, zona, bio, ofrezco, busco, intención
  (enum), instagram, sitio_web, avatar_url, `visible` (opt-in al muro). Migración `0001`.
- `src/lib/db/queries.ts`: `getProfile`, `upsertProfile`, `isProfileComplete`.
- `POST /api/perfil`: exige sesión (si no → /ingresar), valida con Zod, normaliza (@ de
  instagram, https:// en web), upsert.
- `/app/perfil` (protegida): form con la identidad, precargado, mensajes guardado/error.
- `/app` (dashboard): usa `AppHeader` compartido; refleja si el perfil está completo (link a
  editar + estado ✓).
- `src/components/layout/AppHeader.astro`: nav del área privada + salir.

## Verificado (E2E en dev, DB real)
login → GET /app/perfil 200 → POST guardar 303 (guardado=1) → persistido OK con
normalización → /app muestra "Editá tu presentación" (completo) → form precargado →
/api/perfil sin sesión redirige a /ingresar. `build` y `typecheck` OK.

## Pendiente
- **F1.5**: gate por grupo MailerLite (necesita group id + que la compra en cursos alimente
  el grupo). Confirmar con Jessi el grupo.
- **F3**: conectar el muro (`/muro`, hoy mock) a los perfiles reales (`visible=true`) +
  filtros + botón "presentarme" (intro por email).
- Visibilidad por campo (hoy hay un único toggle `visible`).
- Probar en runtime real de Workers (`npm run preview`).
- Copies definitivos con Jessi.
