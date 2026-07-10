# Base de datos

← Volver al [índice de documentación](./README.md)

## Neon: una base nueva dentro del proyecto existente

Se reusa el proyecto Neon **`jessicaestalella.com`** (plan free, un solo branch `production`),
pero con una **base de datos nueva y vacía llamada `capitanabsas`**, creada dentro de ese
mismo branch.

- **Por qué una base nueva y no un branch:** un branch de Neon es una copia copy-on-write del
  branch padre (arrancaría con los datos de cursos adentro). Una base nueva nace **limpia** y
  no consume branches ni proyectos del plan free.
- La connection string usa el host **`-pooler`** (pooler de Neon) con `?sslmode=require`.
- Aislamiento total de los datos de cursos, aunque compartan el mismo proyecto Neon.

Cómo crearla (referencia): SQL Editor de Neon → `CREATE DATABASE capitanabsas;` → botón
Connect → elegir la base → copiar la connection string (pooled) → `DATABASE_URL` en `.env.local`.

## Drivers

- **App (runtime)**: `@neondatabase/serverless` + `drizzle-orm/neon-http` (HTTP por query).
  Necesario en Cloudflare Workers (postgres.js/TCP se corta). En `src/lib/db/index.ts`.
- **Migraciones (Node)**: `drizzle-kit` con `postgres.js`. Config en `drizzle.config.ts`
  (lee `.env.local` con `loadEnvFile`). Con el pooler, `postgres.js` va con `prepare: false`.

## Tablas (`src/lib/db/schema.ts`)

| Tabla | Para qué |
|-------|----------|
| `users` | Usuarias (id, email, name, `role` member/admin, email_verified). Gestionada por Better Auth. |
| `sessions` | Sesiones activas. |
| `accounts` | Cuentas/credenciales de Better Auth (sin password: solo magic link). |
| `verifications` | Tokens de verificación (magic link). Token en texto plano. |
| `rate_limits` | Contadores de rate limit (Better Auth + nuestros con claves `ingresar:` / `presentarme:`). |
| `invitations` | Códigos de invitación: `code_hash`, email, estado (pending/redeemed/revoked), expiración. |
| `profiles` | Tarjeta de presentación (1-1 con users): rubro, zona, bio, ofrezco, busco, intención, redes, `visible`. |
| `audit_logs` | Acciones de admin (para F5). |

## Migraciones

```
npm run db:generate   # genera SQL desde schema.ts → drizzle/
npm run db:migrate     # aplica a la base (usa DATABASE_URL)
npm run db:studio      # UI de Drizzle
```

Regla: **nunca** editar el SQL generado a mano ni tocar la DB directo; todo pasa por
`db:generate`. Las migraciones (`drizzle/`) se commitean.

## Ver también
- [`arquitectura.md`](./arquitectura.md) · [`acceso-y-auth.md`](./acceso-y-auth.md) · [`operaciones.md`](./operaciones.md)
