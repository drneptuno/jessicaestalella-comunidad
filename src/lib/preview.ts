// Vista previa SIN login — SOLO desarrollo.
//
// El middleware activa el bypass únicamente si se cumplen las TRES:
//   1. `import.meta.env.DEV` es true. Vite lo sustituye estáticamente en el
//      build, así que en producción la rama queda muerta y se elimina.
//   2. `PREVIEW_BYPASS_AUTH === 'true'`.
//   3. `COOKIE_DOMAIN` está vacía — solo se setea en producción.
//
// La tercera condición existe porque la primera depende del MODO de build:
// un `astro build --mode development` compilaría el bypass dentro del Worker.
// Ese candado no depende del modo, así que en prod no se activa ni siquiera
// habiéndose compilado por error.
//
// Sirve para recorrer todas las pantallas del área privada sin autenticarse.
// La usuaria ficticia coincide con la que crea `npm run seed:demo`.

export const PREVIEW_USER_ID = 'preview-user'

export const PREVIEW_USER = {
  id: PREVIEW_USER_ID,
  email: 'preview@local.test',
  name: 'Vista Previa',
  // Rol mínimo a propósito: si este bypass alguna vez se activara donde no
  // corresponde, que no entregue además privilegios de administración.
  role: 'student',
  emailVerified: true,
} as const
