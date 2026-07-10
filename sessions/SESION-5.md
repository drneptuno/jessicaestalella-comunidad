# Sesión 5 — Muro real (F3)

## Hecho
- `/muro` (movido a `src/pages/muro/index.astro`, **protegido**): ahora renderiza los perfiles
  reales con `visible=true` (query `getVisibleProfiles`), tarjetas estilo Padlet con la
  identidad de Capitana BSAS y el diferencial Ofrezco/Busco.
- **Filtros por intención** funcionales vía querystring (`/muro?intencion=socias`), sin JS.
- **Estado vacío** con CTA a completar el perfil. La tarjeta propia muestra "Sos vos · editar".
- **"Presentarme"**: `/muro/presentarme?a=<userId>` (form) + `POST /api/presentarme`. Envía una
  intro por email a la destinataria con `reply_to` = email de quien se presenta, **sin exponer
  el correo de la destinataria**. Rate limit por remitente. HTML escapado (anti-XSS).
- `/muro` agregado a las rutas protegidas del middleware.
- Email: `EmailMessage` ahora soporta `replyTo`.

## Verificado (E2E en dev, DB real)
Con una miembra B visible y una viewer A logueada: el muro muestra a B, el filtro socias la
incluye y clientas la excluye, la página presentarme carga con su nombre, el POST llega al
envío, y `/muro` sin sesión redirige a `/ingresar`. `build` y `typecheck` OK.

## Bloqueante externo (acción de Jessi/Martín)
El envío real de emails falla con **403: "The jessicaestalella.com domain is not verified"**.
Hay que **verificar el dominio en Resend** (agregar registros DNS en Hostinger:
https://resend.com/domains). Afecta magic link y presentarme. El código maneja el fallo
(redirige con error); una vez verificado el dominio, los correos salen solos.

## Pendiente
- Verificar dominio en Resend (arriba).
- **F1.5** gate por grupo MailerLite. **F4** recursos. **F5** admin de invitaciones.
- Probar en runtime real de Workers (`npm run preview`) antes de deploy.
- Documentación completa en `docs/` (se hace ahora).
