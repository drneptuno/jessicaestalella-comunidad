# Emails y marketing

← Volver al [índice de documentación](./README.md)

## Reparto de responsabilidades

| Servicio | Rol | Qué manda |
|----------|-----|-----------|
| **Resend** | Transaccional | Magic link de acceso · intro de "Presentarme". Instantáneo, 1-a-1. |
| **MailerLite** | Marketing / automatizaciones | Circuito de bienvenida y todo el marketing que Jessica ya tiene. Es el **pilar** del ecosistema. |

**Por qué separados:** MailerLite no está hecho para emails instantáneos y sensibles al
tiempo (un enlace de login). Resend sí. MailerLite, en cambio, es la fuente de verdad de la
audiencia y corre las automatizaciones (hoy Jessica las hace a mano en WordPress porque no le
funcionan).

## Resend (transaccional)

- Adapter en `src/lib/email/index.ts` — **sin SDK**, por API HTTP (`fetch`), portable a Workers.
- Soporta `replyTo`: en "Presentarme", el mail va a la destinataria con **reply-to = email de
  quien se presenta**, sin exponerle el correo de la destinataria.
- En dev, si no hay `RESEND_API_KEY`, cae a un **sender de consola** (loguea el email).

> ⚠️ **Pendiente crítico:** el dominio `jessicaestalella.com` **no está verificado en Resend**.
> Mientras no lo esté, Resend responde `403` y los emails **no salen** (magic link ni
> presentarme). El código maneja el fallo con gracia. **Acción:** verificar el dominio en
> https://resend.com/domains agregando los registros DNS en **Hostinger**. Alternativa de
> prueba: usar un `RESEND_FROM_EMAIL` de un dominio ya verificado.

## MailerLite (marketing)

- Adapter en `src/lib/marketing/index.ts` — API HTTP (`connect.mailerlite.com/api/subscribers`),
  upsert del suscriptor a un grupo.
- Se llama al **canjear la invitación**: suma a la miembra al grupo (no bloqueante — si falla
  o no está configurado, el acceso sigue).
- A futuro (**F1.5**) el mismo grupo será la **puerta de acceso automática** por compra.

> **Pendiente:** definir/crear el grupo (`MAILERLITE_GROUP_ID`) — p. ej. "Comunidad Capitana
> BSAS" — y cargar `MAILERLITE_API_KEY`. Sin config, el paso se saltea.

## Variables

`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `MAILERLITE_API_KEY`, `MAILERLITE_GROUP_ID` — ver
[`operaciones.md`](./operaciones.md).

## Ver también
- [`acceso-y-auth.md`](./acceso-y-auth.md) · [`operaciones.md`](./operaciones.md)
