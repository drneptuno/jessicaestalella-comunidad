// Vista previa SIN login — SOLO desarrollo.
//
// El middleware activa el bypass únicamente si:
//   1. `import.meta.env.DEV` es true (en el build de producción es false, así que
//      esta rama queda MUERTA y no hay forma de activarla en prod), y
//   2. la env var `PREVIEW_BYPASS_AUTH === 'true'`.
//
// Sirve para recorrer todas las pantallas del área privada sin autenticarse.
// La usuaria ficticia coincide con la que crea `npm run seed:demo`.

export const PREVIEW_USER_ID = 'preview-user'

export const PREVIEW_USER = {
  id: PREVIEW_USER_ID,
  email: 'preview@local.test',
  name: 'Vista Previa',
  role: 'admin',
  emailVerified: true,
} as const
