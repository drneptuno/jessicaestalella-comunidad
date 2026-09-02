import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

// Esquema Drizzle de la comunidad, sobre la base COMPARTIDA del ecosistema.
//
// ⚠️ PROPIEDAD DE TABLAS — leer antes de tocar nada:
// Las tablas de auth (users, sessions, accounts, verifications, rate_limits)
// las posee el repo `jessicaestalella-cursos`: allí se declaran y desde allí
// se migran. Acá se declaran SOLO para poder tiparlas y consultarlas; deben
// reflejar exactamente la forma que tienen allá.
// `drizzle.config.ts` las excluye vía `tablesFilter`, así que `db:generate`
// de este repo nunca emite DDL sobre ellas. Si cambian en cursos, se copian
// acá a mano.
// Tablas propias de este repo: community_members, invitations, profiles,
// resources, community_audit_logs.

// ── Enums ────────────────────────────────────────────────────────────────
// Espejo del enum de cursos (dueño). La pertenencia a la comunidad NO es un
// rol: es una fila en `community_members` (ver más abajo).
export const userRole = pgEnum('user_role', ['student', 'admin'])

export const memberStatus = pgEnum('member_status', ['active', 'revoked'])
export const memberSource = pgEnum('member_source', [
  'invitation', // canjeó un código de invitación
  'subscription', // acceso por membresía activa en cursos
  'manual', // alta a mano por Jessica
])
export const invitationStatus = pgEnum('invitation_status', [
  'pending',
  'redeemed',
  'revoked',
])
export const intencion = pgEnum('intencion', ['socias', 'clientas', 'proveedoras', 'mentoria'])

// ── Usuarias y auth (TABLAS DE `cursos` — solo lectura desde acá) ─────────
// Espejo exacto del schema de cursos. No migrar desde este repo.
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: userRole('role').notNull().default('student'),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
  banned: boolean('banned').notNull().default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    token: text('token').notNull().unique(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    impersonatedBy: text('impersonated_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
)

export const accounts = pgTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('accounts_user_idx').on(t.userId)],
)

export const verifications = pgTable(
  'verifications',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('verifications_identifier_idx').on(t.identifier)],
)

// Rate limiting de Better Auth persistido en DB (en Workers la memoria es
// por-isolate y no sirve como límite real).
export const rateLimits = pgTable('rate_limits', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  count: integer('count').notNull().default(0),
  lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
})

// ── Suscripciones (TABLA DE `cursos` — solo lectura desde acá) ────────────
// Espejo PARCIAL: solo las columnas que la comunidad necesita para responder
// "¿esta usuaria tiene membresía activa?". Con la base compartida, el acceso
// por compra se resuelve consultando la fuente real en vez de confiar en un
// grupo de MailerLite sincronizado. Excluida del `tablesFilter`.
export const subscriptionStatus = pgEnum('subscription_status', [
  'pending',
  'active',
  'past_due',
  'cancelled',
  'expired',
])

export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  status: subscriptionStatus('status').notNull().default('pending'),
  // Gobierna el acceso: se extiende con cada cobro aprobado.
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
})

// ── Pertenencia a la comunidad (EL gate de acceso) ────────────────────────
// Con sesión compartida entre cursos y comunidad, tener sesión válida ya NO
// alcanza para entrar acá: cualquier alumna de cursos la tiene. La pertenencia
// es explícita y se comprueba en el middleware junto con la sesión.
//
// Se da de alta al canjear una invitación, y (a futuro) automáticamente
// cuando exista una suscripción activa en cursos — reemplazando al grupo de
// MailerLite como mecanismo de acceso.
export const communityMembers = pgTable(
  'community_members',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: memberStatus('status').notNull().default('active'),
    source: memberSource('source').notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (t) => [index('community_members_status_idx').on(t.status)],
)

// ── Invitaciones (el gate de acceso) ──────────────────────────────────────
// El código se guarda HASHEADO, nunca en texto plano. Una por persona,
// ligada a su email, un solo uso.
export const invitations = pgTable(
  'invitations',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    codeHash: text('code_hash').notNull(),
    name: text('name'),
    status: invitationStatus('status').notNull().default('pending'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    redeemedAt: timestamp('redeemed_at', { withTimezone: true }),
    redeemedByUserId: text('redeemed_by_user_id').references(() => users.id),
    createdBy: text('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('invitations_email_idx').on(t.email)],
)

// ── Perfil / tarjeta de presentación ──────────────────────────────────────
// El corazón del producto: qué ofrece y qué busca cada miembra. Relación 1-1
// con users. `visible` es el opt-in para aparecer en el muro.
export const profiles = pgTable('profiles', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  rubro: text('rubro'),
  zona: text('zona'),
  bio: text('bio'),
  ofrezco: text('ofrezco'),
  busco: text('busco'),
  intencion: intencion('intencion'),
  instagram: text('instagram'),
  sitioWeb: text('sitio_web'),
  avatarUrl: text('avatar_url'),
  visible: boolean('visible').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Recursos (herramientas, guías, materiales) ────────────────────────────
// v1: enlaces/embeds curados por Jessica (sin almacenamiento propio). Se
// agrupan por `category` en la página de recursos.
export const resources = pgTable(
  'resources',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description'),
    url: text('url').notNull(),
    category: text('category').notNull().default('General'),
    sort: integer('sort').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('resources_category_idx').on(t.category)],
)

// ── Auditoría (acciones de admin en la comunidad) ─────────────────────────
// Renombrada a `community_audit_logs`: en la base compartida, `audit_logs`
// pertenece a cursos y tiene otra forma.
export const auditLogs = pgTable(
  'community_audit_logs',
  {
    id: text('id').primaryKey(),
    actorId: text('actor_id').notNull(),
    action: text('action').notNull(),
    target: text('target').notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('audit_logs_actor_idx').on(t.actorId)],
)
