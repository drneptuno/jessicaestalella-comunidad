import { loadEnvFile } from 'node:process'
import { defineConfig } from 'drizzle-kit'

// drizzle-kit corre en Node (no en Astro): leemos .env.local si existe.
try {
  loadEnvFile('.env.local')
} catch {
  // sin .env.local (p. ej. CI) se usa el entorno del proceso
}

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  strict: true,
  verbose: true,
})
