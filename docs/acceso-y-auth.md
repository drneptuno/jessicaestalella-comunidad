# Acceso y autenticación

← Volver al [índice de documentación](./README.md)

## Modelo de acceso: dos puertas

1. **Grupo de MailerLite (automático — F1.5, pendiente).** La fuente de verdad de quién puede
   entrar. Una **compra** en el repo `cursos` dispara una automatización que suma el email a un
   grupo de MailerLite. Al primer ingreso se verifica que el email esté en ese grupo.
2. **Código de invitación (manual — F1, hecho).** Vía curada para altas fuera de compra
   (invitadas, pruebas). Código de un solo uso, ligado a un email.

Ambas puertas conviven. En todos los casos, el acceso efectivo se materializa con un
**magic link** al email (prueba que el correo es de quien dice).

## Flujo

**Primer ingreso (código):**
```
/ingresar (email + código)
  → POST /api/ingresar
      valida (Zod) · rate limit por IP y email
      busca invitación pending del email · compara hash del código en tiempo constante
      si ok → crea la usuaria · marca invitación 'redeemed' · la suma a MailerLite (no bloq.)
              → envía magic link
      si no → "revisá tu email" genérico (anti-enumeración)
  → email con enlace → /api/auth/magic-link/verify → crea sesión → /app
```

**Reingreso (ya es miembra):** en `/ingresar`, form de solo email → magic link directo
(Better Auth con `disableSignUp: true` solo lo manda a usuarias existentes).

## Better Auth (config en `src/lib/auth/index.ts`)

- Plugin **magic link** (`disableSignUp: true`, token vence a los 10 min). Sin email+password.
- Sesiones en Postgres (30 días, se renuevan con actividad).
- **Rate limit en base de datos** (`storage: 'database'`) — en Workers la memoria es por-isolate.
- Se instancia **por-request** (`getAuth(getServerEnv())`), memoizado por `DATABASE_URL`.

## Seguridad (resumen; reglas completas en [`../CLAUDE.md`](../CLAUDE.md))

- **Códigos hasheados** (SHA-256), nunca en texto plano. Comparación en **tiempo constante**.
  Generación sin caracteres ambiguos. Un solo uso + expiración.
- **Anti-enumeración**: respuestas y tiempos uniformes ante email/código válido o no.
- **Rate limit** en `/api/ingresar` (IP y email) y en los endpoints de Better Auth.
- **RBAC en servidor**: rol `member`/`admin` en la tabla users; se valida en el servidor.
- **CSRF**: Astro valida `Origin` en POST (activo).
- **Sesiones**: cookies gestionadas por Better Auth (HttpOnly/Secure/SameSite).
- **Honeypot** anti-bots en el form de ingreso.

## Archivos clave

- `src/pages/ingresar.astro` · `src/pages/api/ingresar.ts`
- `src/lib/auth/index.ts` · `src/lib/invitations.ts` · `src/lib/rate-limit.ts`
- `src/pages/api/auth/[...all].ts` (monta Better Auth) · `src/middleware.ts` (protección)
- Crear invitaciones: `npm run invitar` (ver [`operaciones.md`](./operaciones.md)).

## Ver también
- [`emails-y-marketing.md`](./emails-y-marketing.md) · [`base-de-datos.md`](./base-de-datos.md) · [`../PLAN.md`](../PLAN.md) (F1, F1.5)
