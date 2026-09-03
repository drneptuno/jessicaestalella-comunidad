// Pertenencia a la comunidad.
//
// Con sesión compartida entre `cursos` y `comunidad` (misma cookie, misma base),
// tener sesión válida ya NO alcanza para entrar acá: cualquier alumna de cursos
// la tiene. La pertenencia es un hecho explícito y separado, en
// `community_members`, y se comprueba en el middleware junto con la sesión.
//
// Dos vías de alta:
//   1. Canje de un código de invitación  → source 'invitation'
//   2. Membresía activa en cursos        → source 'subscription'
// La segunda se resuelve leyendo `subscriptions` (fuente real), no un grupo de
// MailerLite: la base es compartida, así que no hace falta un intermediario.

import { and, eq, gt, or, isNull } from 'drizzle-orm'
import type { Db } from './db'
import { communityMembers, subscriptions } from './db/schema'

export type MemberSource = 'invitation' | 'subscription' | 'manual'

/** Fila de membresía (o null). */
async function getMembership(db: Db, userId: string) {
  return (
    (
      await db
        .select({ status: communityMembers.status, source: communityMembers.source })
        .from(communityMembers)
        .where(eq(communityMembers.userId, userId))
        .limit(1)
    )[0] ?? null
  )
}

/** ¿La usuaria es miembra activa? Única fuente de verdad del acceso. */
export async function isActiveMember(db: Db, userId: string): Promise<boolean> {
  const row = await getMembership(db, userId)
  return row?.status === 'active'
}

/**
 * Alta idempotente. Si ya existe una fila revocada la reactiva: una miembra
 * que vuelve (por ejemplo, resuscribiéndose) recupera el acceso sin duplicar.
 */
export async function grantMembership(
  db: Db,
  userId: string,
  source: MemberSource,
): Promise<void> {
  await db
    .insert(communityMembers)
    .values({ userId, source, status: 'active' })
    .onConflictDoUpdate({
      target: communityMembers.userId,
      set: { status: 'active', revokedAt: null },
    })
}

export async function revokeMembership(db: Db, userId: string): Promise<void> {
  await db
    .update(communityMembers)
    .set({ status: 'revoked', revokedAt: new Date() })
    .where(eq(communityMembers.userId, userId))
}

/**
 * ¿Tiene una membresía vigente en `cursos`? Activa y con el período todavía
 * abierto (`current_period_end` en el futuro, o sin fecha si aún no hubo
 * primer cobro registrado).
 */
export async function hasActiveSubscription(db: Db, userId: string): Promise<boolean> {
  const row = (
    await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active'),
          or(
            isNull(subscriptions.currentPeriodEnd),
            gt(subscriptions.currentPeriodEnd, new Date()),
          ),
        ),
      )
      .limit(1)
  )[0]
  return Boolean(row)
}

/**
 * Resuelve el acceso de una usuaria ya autenticada, en ambos sentidos:
 *
 * - Si todavía no es miembra pero tiene membresía vigente en cursos, la da de
 *   alta en el momento — una compra habilita la comunidad sin paso manual.
 * - Si su acceso venía de una suscripción que ya **no** está vigente (venció o
 *   la canceló), lo revoca. Sin esto, quien pagaba un mes conservaba acceso
 *   vitalicio a los datos personales de todas las miembras.
 *
 * Las altas por invitación o manuales no dependen de la suscripción y no se
 * tocan acá: se revocan a mano con `revokeMembership`.
 */
export async function ensureAccess(db: Db, userId: string): Promise<boolean> {
  const membership = await getMembership(db, userId)

  if (membership?.status === 'active') {
    // El acceso por suscripción vale mientras la suscripción valga.
    if (membership.source === 'subscription' && !(await hasActiveSubscription(db, userId))) {
      await revokeMembership(db, userId)
      return false
    }
    return true
  }

  if (await hasActiveSubscription(db, userId)) {
    await grantMembership(db, userId, 'subscription')
    return true
  }
  return false
}
