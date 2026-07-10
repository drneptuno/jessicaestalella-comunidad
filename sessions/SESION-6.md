# Sesión 6 — Rename a "comunidad" + gate por MailerLite (F1.5)

## Rename
- Carpeta/repo `jessicaestalella-academia` → **`jessicaestalella-comunidad`** (no es una
  academia). Actualizado `name` en package.json/wrangler.jsonc, títulos de docs y prompt de
  arranque. Producto sigue siendo "Capitana BSAS". Remote: `drneptuno/jessicaestalella-comunidad`
  (branch `master`). Todo pusheado.

## Decisión: emails
Magic link (transaccional) sigue por **Resend** (o MailerSend si algún día se consolida bajo
MailerLite; ambos requieren verificar dominio). MailerLite-marketing NO sirve para el enlace
de acceso. MailerLite queda para automatizaciones/bienvenida.

## F1.5 — gate por grupo de MailerLite (implementado)
- `emailAllowedByGroup(env, email)` en `src/lib/marketing/`: consulta
  `GET /api/subscribers/{email}` y valida que esté en `MAILERLITE_GROUP_ID` con status active.
- `/api/ingresar` (rama sin código): si la usuaria no existe, verifica el grupo; si está, la
  da de alta y manda magic link. Si no, respuesta genérica (anti-enumeración). Reingreso de
  usuaria existente sigue por magic link.
- `/ingresar` reordenado: **email solo** como camino principal; **código** como opción
  secundaria (`<details>`).
- Chequeo de grupo solo en primer ingreso (revocación = baja de usuaria, futuro).

## Verificado (E2E, dev)
- Sin key de MailerLite: email nuevo → 303 genérico y **NO crea usuaria** (gate cerrado) ✓.
- Alta por código → crea usuaria ✓. Reingreso email-only → genera magic link ✓.
- `typecheck` y `build` OK.

## Pendiente / para activar F1.5
- **Cargar `MAILERLITE_API_KEY` + `MAILERLITE_GROUP_ID`** (Martín los va a pasar) y probar el
  chequeo de grupo en vivo.
- Definir qué grupo de MailerLite es el habilitante (idealmente el que alimenta la compra).
- Verificar dominio en Resend (sigue pendiente, para que salgan los emails).
- Próximo: **F4 recursos** · F5 admin · F6 deploy.
