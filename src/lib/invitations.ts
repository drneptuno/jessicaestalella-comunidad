// Utilidades de invitaciones: generación de código, hash y comparación segura.
// El código nunca se guarda en texto plano: se almacena su hash SHA-256.
// Web Crypto funciona igual en Workers y en Node.

// Alfabeto sin caracteres ambiguos (0/O, 1/I/L) para que sea fácil de tipear.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** Código nuevo, formato XXXX-XXXX. */
export function generateCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  let out = ''
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length]
  return `${out.slice(0, 4)}-${out.slice(4, 8)}`
}

/** Normaliza para comparar: mayúsculas, solo alfanumérico. */
export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase()
}

export async function hashCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(normalizeCode(code))
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Comparación en tiempo constante de dos hex del mismo largo. */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}
