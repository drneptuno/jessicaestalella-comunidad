import { and, asc, desc, eq } from 'drizzle-orm'
import type { Db } from './index'
import { profiles, resources, users } from './schema'

export type Intencion = 'socias' | 'clientas' | 'proveedoras' | 'mentoria'

export type ProfileData = {
  rubro: string | null
  zona: string | null
  bio: string | null
  ofrezco: string | null
  busco: string | null
  intencion: 'socias' | 'clientas' | 'proveedoras' | 'mentoria' | null
  instagram: string | null
  sitioWeb: string | null
  avatarUrl: string | null
  visible: boolean
}

export async function getProfile(db: Db, userId: string) {
  return (await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1))[0] ?? null
}

export async function upsertProfile(db: Db, userId: string, data: ProfileData): Promise<void> {
  await db
    .insert(profiles)
    .values({ userId, ...data, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: { ...data, updatedAt: new Date() },
    })
}

/** ¿El perfil tiene lo mínimo para mostrarse con sentido? */
export function isProfileComplete(p: { bio: string | null; ofrezco: string | null; busco: string | null } | null): boolean {
  return Boolean(p && p.bio && p.ofrezco && p.busco)
}

const publicColumns = {
  userId: profiles.userId,
  name: users.name,
  rubro: profiles.rubro,
  zona: profiles.zona,
  bio: profiles.bio,
  ofrezco: profiles.ofrezco,
  busco: profiles.busco,
  intencion: profiles.intencion,
  instagram: profiles.instagram,
  sitioWeb: profiles.sitioWeb,
}

/** Tarjetas del muro: solo perfiles opt-in (visible=true), sin exponer email. */
export async function getVisibleProfiles(db: Db, intencion?: Intencion) {
  const conds = [eq(profiles.visible, true)]
  if (intencion) conds.push(eq(profiles.intencion, intencion))
  return db
    .select(publicColumns)
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(and(...conds))
    .orderBy(desc(profiles.updatedAt))
}

/** Perfil público de una miembra (para la pantalla "presentarme"). null si no es visible. */
export async function getPublicProfile(db: Db, userId: string) {
  return (
    (
      await db
        .select(publicColumns)
        .from(profiles)
        .innerJoin(users, eq(profiles.userId, users.id))
        .where(and(eq(profiles.userId, userId), eq(profiles.visible, true)))
        .limit(1)
    )[0] ?? null
  )
}

/** Email de una miembra visible — solo para uso server-side (envío de intro). */
export async function getVisibleMemberEmail(db: Db, userId: string): Promise<string | null> {
  const row = (
    await db
      .select({ email: users.email, visible: profiles.visible })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .where(and(eq(users.id, userId), eq(profiles.visible, true)))
      .limit(1)
  )[0]
  return row?.email ?? null
}

export type Resource = typeof resources.$inferSelect

/** Recursos ordenados por categoría y orden manual. */
export async function getResources(db: Db): Promise<Resource[]> {
  return db
    .select()
    .from(resources)
    .orderBy(asc(resources.category), asc(resources.sort), desc(resources.createdAt))
}

/** Agrupa recursos por categoría, preservando el orden. */
export function groupByCategory(items: Resource[]): { category: string; items: Resource[] }[] {
  const grupos: { category: string; items: Resource[] }[] = []
  for (const item of items) {
    let grupo = grupos.find((g) => g.category === item.category)
    if (!grupo) {
      grupo = { category: item.category, items: [] }
      grupos.push(grupo)
    }
    grupo.items.push(item)
  }
  return grupos
}

/** Solo permitimos abrir enlaces http(s) (evita javascript:, data:, etc.). */
export function isSafeUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}
