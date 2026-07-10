/// <reference types="astro/client" />

// Módulo virtual del adapter de Cloudflare (Astro 6). En runtime lo provee
// el Worker; acá declaramos el shape mínimo que usamos para el typecheck.
declare module 'cloudflare:workers' {
  export const env: Record<string, string | undefined>
}

declare namespace App {
  interface Locals {
    user: {
      id: string
      email: string
      name: string
      role: string
      emailVerified: boolean
      image?: string | null
    } | null
    session: {
      id: string
      userId: string
      expiresAt: Date
    } | null
  }
}
