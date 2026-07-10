# Prompt de arranque — Comunidad Capitana BSAS

Pegá esto para iniciar la construcción en una sesión nueva (dentro de
`jessicaestalella-comunidad/`).

---

Vamos a arrancar la **comunidad Capitana BSAS**: el espacio privado de Jessica Estalella.
Ya están escritos `CLAUDE.md`, `PLAN.md`, `README.md` y `.env.local.example` en este repo.

**Antes de escribir código, leé `CLAUDE.md` y `PLAN.md` completos y respetalos** (seguridad
no negociable, menor lock-in, identidad visual heredada, TypeScript strict).

Trabajamos por **fases del `PLAN.md`, una por vez**, sin adelantarnos. Empezamos por **F0 —
fundaciones**. Al terminar cada fase: verificás los criterios de aceptación, actualizás
`sessions/SESION-N.md` y commiteás (español, con co-autoría).

### F0 — qué quiero
1. Scaffold **Astro 6 SSR** (`output: 'server'`, adapter `@astrojs/cloudflare`), Node ≥ 22.12,
   TypeScript strict. Todas las deps en su última versión, alineadas con el repo Astro principal
   (`../jessicaestalella-nueva-web-astro`). Integración React para islas.
2. Tailwind v4 + `src/styles/globals.css`: **copiá la sección `@theme inline` completa** del
   repo Astro principal (tokens de color, tipografías, variantes accesibles, radios). Fuentes
   con `@fontsource/league-spartan` y `@fontsource/libre-baskerville`.
3. **Drizzle + postgres.js** conectado a Neon: `src/lib/db/index.ts`, `src/lib/db/schema.ts`
   (vacío por ahora), `drizzle.config.ts`, scripts `db:generate` / `db:migrate` / `db:studio`.
4. `wrangler.jsonc` (sin secretos), `_headers` con los headers de seguridad de `CLAUDE.md`.
5. `sessions/`, `.github/`, `ROADMAP.md`, git init.
6. Una página placeholder con la identidad de Jessica que confirme que los tokens y las fuentes
   cargan bien.

**Criterios de aceptación F0:** `npm run dev` levanta; el placeholder muestra la identidad
correcta; `db:studio` conecta a Neon; typecheck y build pasan sin errores.

### Antes de F1 (auth), confirmame conmigo las decisiones abiertas del `PLAN.md`
(modelo de código, forma de reingreso, recursos v1) y **validá temprano que Better Auth corre
en el runtime de Cloudflare Workers** — es el riesgo principal del stack.

### Skills
Usá `/frontend-design` e `/impeccable` para lo visual, `/writing-plans` si hay que desglosar
tareas, y `/security-review` antes de cerrar cualquier fase que toque auth, códigos o PII.

Si algo del plan no te cierra o falta un dato, preguntame antes de asumir.
