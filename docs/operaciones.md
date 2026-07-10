# Operaciones

← Volver al [índice de documentación](./README.md)

## Comandos

```
npm run dev          # desarrollo local (http://localhost:4321)
npm run build        # build de producción
npm run preview      # build + wrangler dev (runtime real de Workers)
npm run deploy       # build + wrangler deploy (a Cloudflare)
npm run typecheck    # astro check
npm run db:generate  # generar migración desde el schema
npm run db:migrate   # aplicar migraciones a la base
npm run db:studio    # UI de Drizzle
npm run invitar -- <email> ["Nombre"] [díasVigencia]   # crea una invitación
npm run recurso -- <url> "<título>" ["categoría"] ["descripción"] [orden]   # agrega un recurso
```

## Crear una invitación (alta manual)

```
npm run invitar -- valen@ejemplo.com "Valentina Ríos" 30
```
Imprime el **código en texto plano una sola vez** (en la DB queda solo el hash) para
compartírselo a la persona. Vence en los días indicados (default 30).

## Cargar un recurso (sección Recursos)

```
npm run recurso -- https://ejemplo.com/guia "Guía de precios" "Guías" "Cómo poner precio" 1
```
Solo acepta URLs `http(s)`. Se agrupan por categoría en `/app/recursos`. Hasta que exista el
panel admin (F5), esta es la vía para curar recursos.

## Variables de entorno

Dev: `.env.local` (no se commitea). Prod: `wrangler secret put <NOMBRE>` (nunca en
`wrangler.jsonc` ni en el repo). Referencia completa en `.env.local.example`.

| Variable | Para qué | Dónde |
|----------|----------|-------|
| `DATABASE_URL` | Base Neon `capitanabsas` (host `-pooler`) | secret |
| `BETTER_AUTH_SECRET` | Firma de sesiones (`openssl rand -base64 32`) | secret |
| `BETTER_AUTH_URL` | URL base para callbacks | env |
| `RESEND_API_KEY` | Email transaccional | secret |
| `RESEND_FROM_EMAIL` | Remitente (dominio verificado) | env |
| `MAILERLITE_API_KEY` | Marketing/grupo (opcional) | secret |
| `MAILERLITE_GROUP_ID` | Grupo de acceso/comunidad (opcional) | env |
| `PUBLIC_SITE_URL` | URL pública del sitio | env |

## Deploy (Cloudflare Workers)

1. `npm run preview` para validar en el runtime real antes de publicar.
2. Cargar los secretos con `wrangler secret put ...`.
3. `npm run deploy`.
4. **Dominio**: `capitanabsas.jessicaestalella.com` — apuntar en **Hostinger** (DNS) hacia
   Cloudflare y configurar el custom domain del Worker.

## Pendientes externos (no son código)

- [ ] **Verificar dominio en Resend** (si no, no salen los emails) — ver [`emails-y-marketing.md`](./emails-y-marketing.md).
- [ ] **Crear/definir grupo de MailerLite** y cargar sus claves.
- [ ] **Confirmar y apuntar el subdominio** en Hostinger.
- [ ] Repositorio Git remoto para push (en creación).

## Ver también
- [`base-de-datos.md`](./base-de-datos.md) · [`emails-y-marketing.md`](./emails-y-marketing.md) · [`../CLAUDE.md`](../CLAUDE.md)
