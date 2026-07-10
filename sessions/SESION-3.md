# Sesión 3 — Pantalla de ingreso + canje (F1 completo)

## Hecho
- **Flujo de ingreso completo y probado end-to-end:**
  - `/ingresar` (Astro): form email + código (primera vez) + reingreso por email. Identidad
    de Capitana BSAS, honeypot anti-bots, mensajes por querystring.
  - `POST /api/ingresar`: valida (Zod), rate limit por IP y email (tabla rate_limits),
    canjea la invitación (hash SHA-256, comparación en tiempo constante, chequeo de
    expiración, robusto ante múltiples pending), crea la usuaria, marca `redeemed`, dispara
    magic link. Reingreso sin código no revela si el email existe (anti-enumeración).
  - `/app` (protegida): dashboard de bienvenida con el nombre + salir.
  - Script `npm run invitar -- <email> ["Nombre"] [días]` para generar códigos.
- **MailerLite** (`src/lib/marketing/`): al canjear, la miembra se suma a un grupo (upsert),
  no bloqueante. Resend queda para el transaccional (magic link).

## Verificado (E2E en dev, con DB real)
código → POST canje (303 revisa-email) → magic link → verify (302 /app) → get-session
devuelve la sesión → `/app` muestra "Hola, Valentina". `build` y `typecheck` OK.

## Hallazgos importantes (documentados en CLAUDE.md)
1. **Neon pooler + postgres.js sobre Workers = "Network connection lost"** (TCP se corta).
   Cambiado a **driver `neon-http`** (HTTP por query). Better Auth no usa transacciones, así
   que alcanza. Migraciones siguen con postgres.js.
2. **Astro valida `Origin` en POST** (checkOrigin). En navegador anda; en curl hay que
   mandar el header.
3. Better Auth guarda el token de magic link en texto plano (`storeToken: "plain"`).

## Config actual
- `RESEND_API_KEY` cargada (transaccional real).
- `MAILERLITE_API_KEY` / `MAILERLITE_GROUP_ID` vacías → el paso de MailerLite se saltea sin
  romper. Falta que Jessi decida el grupo.

## Pendiente
- Confirmar grupo de MailerLite (o crear "Comunidad Capitana BSAS").
- Probar en el runtime real de Workers (`npm run preview`) antes de F2.
- Copies definitivos (los vemos con Jessi).
- Siguiente fase: **F2 — perfil de miembro** (la tarjeta de presentación editable).
