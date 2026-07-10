# Sesión 7 — Recursos (F4)

## Hecho
- Tabla `resources` (title, description, url, category, sort, createdAt). Migración `0002`.
- Query `getResources` + `groupByCategory` + `isSafeUrl` (solo http/https) en queries.ts.
- Página `/app/recursos` (protegida): recursos agrupados por categoría, tarjetas con enlace
  externo (`rel="noopener noreferrer"`, `target="_blank"`). Estado vacío.
- Nav (`AppHeader`) con "Recursos" + dashboard `/app` con tarjeta "Aprovechá los recursos"
  (grid 2×2).
- Script `npm run recurso -- <url> "<título>" ["categoría"] ["descripción"] [orden]` para
  curar recursos (valida http/https). Vía manual hasta el panel admin (F5).

## Verificado (E2E en dev, DB real)
`/app/recursos` autenticada 200 con categorías y recursos; el CLI rechaza URLs no http(s);
`/app/recursos` sin sesión → 302 /ingresar. `typecheck` y `build` OK.

## Nota (aprendizaje de esta sesión)
Tras renombrar la carpeta a `jessicaestalella-comunidad`, los helpers de test en scratchpad
apuntaban a la ruta vieja `jessicaestalella-academia` → fallaban (módulo no encontrado),
haciendo parecer que el login se rompía. La app estaba bien; era el harness. Corregido.

## Pendiente
- F5 admin (generar invitaciones/recursos + baja de miembras) desde UI.
- F6 deploy. Activar F1.5 (API key + group MailerLite). Verificar dominio en Resend.
