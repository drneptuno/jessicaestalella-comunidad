# Sesión 1 — Fundaciones (F0)

## Objetivo
Arrancar el repo de la academia con la fundación documental y el scaffold de F0.

## Hecho
- Documentación base: `CLAUDE.md`, `PLAN.md`, `ROADMAP.md`, `README.md`,
  `docs/PROMPT-ARRANQUE.md`, `.env.local.example`.
- Decisiones cerradas: Astro 6 SSR + Better Auth + Drizzle + Postgres (Neon) +
  Cloudflare + Resend · acceso por email+código · MVP dashboard/perfil/directorio/recursos.
- Scaffold F0:
  - `package.json` (versiones alineadas con repos hermanos), `astro.config.mjs`
    (`output: 'server'`, adapter Cloudflare), `tsconfig.json`, `.gitignore`.
  - `src/styles/globals.css` con los tokens de marca heredados.
  - `src/layouts/BaseLayout.astro` (noindex por defecto — espacio privado) + fuentes Fontsource.
  - `src/pages/index.astro`: placeholder branded para verificar identidad.
  - Base de datos: `drizzle.config.ts`, `src/lib/db/{index,schema}.ts` (schema vacío, pipeline listo).
  - `wrangler.jsonc` (sin secretos), `public/_headers` con headers de seguridad.

## Pendiente / notas
- Confirmar subdominio con Jessi.
- F1: validar Better Auth en runtime de Workers (riesgo principal). Env vars en
  Workers llegan por `Astro.locals.runtime.env`, no `process.env` — ver nota en `db/index.ts`.
- Falta crear Neon DB real y cargar `DATABASE_URL` para probar `db:studio`/migraciones.

## Verificación F0
- [ ] `npm run dev` levanta y el placeholder muestra la identidad.
- [ ] `npm run typecheck` pasa.
- [ ] `npm run build` pasa.
