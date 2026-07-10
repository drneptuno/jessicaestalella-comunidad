import { eq } from 'drizzle-orm'
import type { Db } from './index'
import { profiles } from './schema'

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
