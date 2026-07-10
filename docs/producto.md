# Producto — Capitana BSAS

← Volver al [índice de documentación](./README.md)

## Qué es y para quién

Comunidad **privada y curada** de mujeres (emprendedoras, profesionales) de Jessica Estalella.
El objetivo es que puedan **presentarse y conectar con intención**: conocerse, mostrar sus
proyectos y generar oportunidades reales (socias, clientas, proveedoras, mentoría).

**No es** una academia ni una plataforma de cursos. El producto pago (cursos) vive en otro
repo; comprar ahí es lo que —a
futuro— habilita el acceso a esta comunidad.

## Foco y modelo mental

El modelo es un **muro estilo Padlet**: una grilla de tarjetas donde cada mujer se presenta.
Pero no es un Padlet genérico ni un directorio estático: es privado, con la identidad de
Jessica, y con **intención estructurada**.

## Diferenciales (lo que lo hace distinto de Padlet y de comunidades tipo directorio)

1. **Perfil con intención estructurada** — cada tarjeta muestra **"Ofrezco"** y **"Busco"**,
   no solo una bio. Ahí el muro deja de ser vitrina y sirve para que pasen cosas.
2. **Contacto con intención** — botón **"Presentarme"** que manda una intro por email
   (con reply-to a quien escribe), **sin exponer el correo** de la otra persona.
3. **Filtros por intención** — buscar por "busca socias / clientas / proveedoras / mentoría".
4. **Privado y curado** — se entra por invitación / compra, no es un muro público.
5. **Identidad propia de Jessica** — cálido y cuidado, no una plantilla genérica.

Detalle y fast-follows (muro de bienvenidas, destacadas) en [`../PLAN.md`](../PLAN.md).

## Las piezas

- **Perfil / tarjeta de presentación** (`/app/perfil`) — editable, con opt-in de visibilidad.
- **Muro** (`/muro`) — las tarjetas visibles, con filtros y "Presentarme".
- **Ingreso** (`/ingresar`) — email + código (o reingreso por email).
- **Inicio** (`/app`) — dashboard de bienvenida que guía a completar el perfil.

## Ecosistema

```
cursos (compra el acceso)  ──►  MailerLite (grupo + bienvenida/marketing)  ──►  Capitana BSAS
```

Ver [`arquitectura.md`](./arquitectura.md) y [`acceso-y-auth.md`](./acceso-y-auth.md).

## Ver también
- [`arquitectura.md`](./arquitectura.md) · [`acceso-y-auth.md`](./acceso-y-auth.md) · [`../PLAN.md`](../PLAN.md)
