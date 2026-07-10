# jessicaestalella-academia

Espacio privado de comunidad / academia de **Jessica Estalella Psicóloga**.
Acceso curado por **email + código de invitación**. Post-login: dashboard, perfil,
directorio de la comunidad y recursos.

- **Stack:** Astro 6 (SSR) + Better Auth + Drizzle + Postgres (Neon) + Resend, en Cloudflare.
- **Identidad visual:** heredada del ecosistema (azul marino / naranja / verde agua, League
  Spartan + Libre Baskerville).
- **Documentos:** [`CLAUDE.md`](./CLAUDE.md) (convenciones y seguridad) ·
  [`PLAN.md`](./PLAN.md) (fases) · [`docs/PROMPT-ARRANQUE.md`](./docs/PROMPT-ARRANQUE.md)
  (prompt para iniciar la construcción).

> Parte del ecosistema `jessicaestalella.com`. Repos hermanos: web principal (Astro + Sanity)
> y cursos (Next.js, producto pago). Cero código compartido; se conectan por URLs.

## Comandos (una vez scaffoldeado en F0)

```
npm run dev          # desarrollo local (Astro SSR)
npm run build        # build
npm run preview      # preview en el runtime de Cloudflare
npm run db:generate  # migraciones desde el schema Drizzle
npm run db:migrate   # aplicar migraciones
npm run db:studio    # UI de Drizzle
```

## Estado

Fase actual: **F0 — fundaciones** (ver `PLAN.md`). Documentación lista; código por scaffoldear.
