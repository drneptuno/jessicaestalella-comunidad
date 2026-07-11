# Documentación — Capitana BSAS

Hub de documentación de la comunidad **Capitana BSAS** (`capitanabsas.jessicaestalella.com`).
Si estás retomando el proyecto en una conversación nueva, **empezá por acá**.

## Qué es

Espacio privado y curado **donde mujeres se presentan y conectan con intención**. Cada
miembra tiene una tarjeta de presentación (qué ofrece / qué busca) que aparece en un **muro**
estilo Padlet; desde ahí puede "presentarse" a otra por email. El acceso es por invitación
(hoy) y, a futuro, automático al comprar en la plataforma de cursos. Parte del ecosistema
`jessicaestalella.com`.

## Orden de lectura para tener el contexto completo

1. [`producto.md`](./producto.md) — qué es, para quién, diferenciales.
2. [`arquitectura.md`](./arquitectura.md) — ecosistema, stack, runtime y sus gotchas.
3. [`acceso-y-auth.md`](./acceso-y-auth.md) — cómo se entra y cómo está asegurado.
4. [`base-de-datos.md`](./base-de-datos.md) — Neon, tablas, migraciones.
5. [`emails-y-marketing.md`](./emails-y-marketing.md) — Resend + MailerLite.
6. [`operaciones.md`](./operaciones.md) — comandos, variables, deploy, pendientes.

## Planes de fases

- [`plan-f5-admin.md`](./plan-f5-admin.md) — plan de implementación del **panel de
  administración (F5)**: aún sin empezar.

## Documentos vivos (raíz del repo)

| Documento | Para qué |
|-----------|----------|
| [`../CLAUDE.md`](../CLAUDE.md) | Convenciones de trabajo, reglas de seguridad, notas del runtime. **Léelo siempre.** |
| [`../PLAN.md`](../PLAN.md) | Plan por fases (F0–F6), diferenciales y decisiones. |
| [`../ROADMAP.md`](../ROADMAP.md) | Estado vivo de cada fase (qué está hecho). |
| [`../sessions/`](../sessions/) | Bitácora sesión por sesión (qué se hizo y por qué). |

## Estado actual (resumen)

F0 fundaciones ✅ · F1 auth por código + magic link ✅ · F2 perfil ✅ · F3 muro real ✅ ·
F1.5 gate por MailerLite ⬜ · F4 recursos ⬜ · F5 admin ⬜ · F6 deploy ⬜.
Detalle siempre actualizado en [`../ROADMAP.md`](../ROADMAP.md).

## Pendientes externos (no son código)

- **Verificar el dominio en Resend** para que los emails salgan (ver [`emails-y-marketing.md`](./emails-y-marketing.md)).
- **Definir el grupo de MailerLite** que habilita el acceso (ver [`acceso-y-auth.md`](./acceso-y-auth.md)).
- **Confirmar** el subdominio y apuntarlo en Hostinger a Cloudflare (ver [`operaciones.md`](./operaciones.md)).
