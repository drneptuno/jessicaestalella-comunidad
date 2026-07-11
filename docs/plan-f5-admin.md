# Plan de implementación — F5: Panel de administración

← Volver al [índice de documentación](./README.md) · Ver también [`acceso-y-auth.md`](./acceso-y-auth.md) · [`base-de-datos.md`](./base-de-datos.md)

> Estado: **planificado, sin empezar.** Este documento es la guía de implementación.

## Objetivo

Darle a Jessica (rol **admin**) una UI para gestionar la comunidad sin depender de la CLI:
generar/revocar invitaciones, ver y dar de baja miembras, y curar recursos. Toda acción
administrativa queda registrada en `audit_logs`. RBAC validado **siempre en el servidor**.

## Alcance del MVP

**Incluye**
- Guard de admin (rol) + layout + home del panel con métricas básicas.
- Invitaciones: listar, generar (mostrar el código una vez), revocar.
- Miembras: listar, dar de baja / reactivar.
- Recursos: listar, agregar, editar, eliminar, reordenar.
- Auditoría de todas las acciones mutantes.
- Script para nombrar al primer admin.

**Fuera de alcance (futuro)**
- Métricas/analytics avanzadas, exportaciones.
- Edición del perfil de otra miembra por el admin.
- Gestión de grupos de MailerLite desde el panel (hoy se define por env).
- 2FA para admin (se puede sumar luego con el plugin de Better Auth).

## Decisiones de diseño

1. **Baja de miembra = flag `active`, no borrado.** Se agrega `users.active` (boolean, default
   true). Dar de baja: `active=false` **y** se borran sus sesiones. Reactivar: `active=true`.
   - Enforcement: `active` se expone como *additionalField* de Better Auth (para que venga en
     `session.user`); el `middleware` trata `active=false` como sin sesión (redirect a
     `/ingresar`). Además, el reingreso por magic link en `/api/ingresar` no se dispara si la
     usuaria está inactiva. (Alternativa considerada: plugin `admin` de Better Auth con `ban*`
     — más pesado; se descarta para el MVP.)
2. **El código de invitación se muestra UNA vez, sin pasar por la URL.** La página de
   invitaciones procesa el POST y **renderiza el código en la misma respuesta** (no
   redirect-with-querystring), para no filtrarlo en logs/historial. En la DB solo vive el hash.
3. **Primer admin por script** (`npm run hacer-admin -- <email>`): no hay auto-promoción por
   UI. Cambia `role` a `admin` de una usuaria existente y lo audita.
4. **RBAC en dos capas**: el `middleware` bloquea `/app/admin/*` y `/api/admin/*` si el rol no
   es admin; además cada endpoint revalida el rol (defensa en profundidad).
5. **Vista previa**: la usuaria de preview ya es `admin`, así que el panel entra en el modo
   preview sin login (ver [`operaciones.md`](./operaciones.md)).

## Cambios de esquema

- `users.active boolean not null default true`.
- (Ya existe `audit_logs`; se empieza a usar.)
- Migración nueva vía `npm run db:generate` + `db:migrate`.

## RBAC y auditoría (helpers)

- `requireAdmin(locals)` → si `!user || user.role !== 'admin'` corta (redirect/403).
- Better Auth `user.additionalFields`: sumar `active` (además del ya existente `role`).
- `middleware`: agregar prefijos admin y chequeo de rol + de `active`.
- `logAudit(db, { actorId, action, target, metadata })` → inserta en `audit_logs`. Se llama en
  cada acción mutante (generar/revocar invitación, baja/alta de miembra, alta/edición/borrado
  de recurso, promoción a admin).

## Rutas

| Ruta | Tipo | Qué hace |
|------|------|----------|
| `/app/admin` | página | Home: métricas (miembras activas, invitaciones pendientes, recursos). |
| `/app/admin/invitaciones` | página | Lista + form de generar + botón revocar. Muestra el código nuevo una vez. |
| `/app/admin/miembras` | página | Lista de usuarias con estado; baja/alta. |
| `/app/admin/recursos` | página | Lista + alta/edición/borrado + orden. |
| `/api/admin/invitacion` | POST | Crear invitación (devuelve la página con el código). |
| `/api/admin/invitacion/revocar` | POST | `status='revoked'`. |
| `/api/admin/miembra/estado` | POST | `active` true/false + borrar sesiones al dar de baja. |
| `/api/admin/recurso` | POST | Crear / editar / borrar (según `accion`). |

Todos los endpoints: `prerender=false`, sesión + rol admin, validación Zod, CSRF por `Origin`.

## Tareas (en orden, cada una entregable y verificable)

### T1 — Fundaciones del panel
- Esquema: `users.active` + migración. `active` como additionalField en Better Auth.
- `requireAdmin()` + `logAudit()`. Middleware: proteger `/app/admin` y `/api/admin` por rol; y
  tratar `active=false` como sin sesión.
- `AppHeader`: link "Admin" visible solo si `user.role === 'admin'`.
- Layout/estética del panel (reusar identidad; tablas simples y claras).
- Página `/app/admin` con métricas (counts).
- Script `npm run hacer-admin -- <email>`.
- **Aceptación:** una member no accede a `/app/admin` (redirect); un admin ve las métricas;
  `hacer-admin` promueve y audita; una usuaria con `active=false` no puede entrar.

### T2 — Invitaciones
- `/app/admin/invitaciones`: tabla (email, nombre, estado, creada, vence) + form (email,
  nombre, días) + revocar.
- `POST /api/admin/invitacion`: genera (reusa `generateCode`/`hashCode`), guarda pending,
  **renderiza el código una vez**; audita.
- `POST /api/admin/invitacion/revocar`: pending → revoked; audita.
- **Aceptación:** genero una invitación y veo el código una sola vez; aparece en la lista como
  pending; la revoco y pasa a revoked; la acción queda en `audit_logs`. (Opcional: canjearla
  end-to-end como en F1.)

### T3 — Miembras
- `/app/admin/miembras`: lista (nombre, email, rol, estado, perfil visible sí/no).
- `POST /api/admin/miembra/estado`: baja (`active=false` + borrar sesiones) / alta.
- No permitir que un admin se dé de baja a sí mismo (guardrail).
- **Aceptación:** doy de baja a una miembra → sus sesiones mueren y no puede reingresar; la
  reactivo y vuelve a entrar; queda auditado; no me puedo autodar de baja.

### T4 — Recursos (CRUD)
- `/app/admin/recursos`: lista + form de alta/edición + borrar + `sort`.
- `POST /api/admin/recurso` con `accion` (crear/editar/borrar), valida URL http(s).
- **Aceptación:** creo/edito/borro un recurso desde la UI y se refleja en `/app/recursos`;
  URLs no http(s) rechazadas; acciones auditadas. (El script `npm run recurso` sigue existiendo.)

## Seguridad (no negociable)

- RBAC en servidor en cada página/endpoint admin (nunca confiar en ocultar el link).
- Validación Zod de todo input; longitudes máximas.
- El código de invitación nunca en URL/logs; solo su hash en DB.
- CSRF: `Origin` (ya activo en Astro).
- Rate limit en endpoints admin (por si se filtra una sesión admin).
- `audit_logs` en toda mutación; nunca loggear secretos.
- Escapar HTML de cualquier dato mostrado (nombres, emails, títulos).

## Pruebas E2E a correr (dev)

- member → `/app/admin` redirige; admin entra.
- Generar invitación muestra el código una vez; revocar cambia estado.
- Baja de miembra corta sesión y bloquea reingreso; alta lo restablece.
- CRUD de recurso se refleja en `/app/recursos`.
- Cada acción deja fila en `audit_logs`.
- `typecheck` + `build` en verde.

## Decisiones abiertas (para confirmar antes de T1)

1. **Baja de miembra**: ¿alcanza el flag `active` (recomendado) o querés borrado real de datos
   (irreversible)?
2. **Recursos**: ¿el admin puede editar/borrar cualquiera, o solo agregar (y borrar vía CLI)?
3. **Métricas del home**: ¿con qué números arrancamos (miembras activas, pendientes, recursos)
   o querés algo más?
4. ¿El panel vive en `/app/admin` (dentro del área privada) — recomendado — o preferís otra URL?
