import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { del } from '@vercel/blob';
import { ensureTursoProjectStore } from '@/lib/project-store';
import { hasPrivateDocumentStore } from '@/lib/project-documents';
import { getTursoClient, hasTursoDatabase } from '@/lib/turso';
import type { AppUser, ProjectData } from '@/types';

const scryptAsync = promisify(scrypt);
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

type AuthRow = {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  type: AppUser['type'];
  role: string;
  avatar: string | null;
  residence_country: string | null;
  time_zone: string | null;
  preferred_contact_channel: string | null;
  representative_name: string | null;
  representative_phone: string | null;
  representative_relation: string | null;
  failed_attempts: number;
  locked_until: string | null;
  is_active: number;
};

export type AuthenticationResult =
  | { ok: true; user: AppUser; token: string; expiresAt: Date }
  | { ok: false; code: 'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED' | 'ACCESS_DENIED' | 'SERVICE_NOT_CONFIGURED'; message: string };

let authSchemaReady: Promise<void> | null = null;

export function hasAuthStore() {
  return hasTursoDatabase();
}

function normalizeEmail(value?: string | null) {
  return value?.trim().toLowerCase() || null;
}

function normalizePhone(value?: string | null) {
  return value?.replace(/[\s().-]/g, '').trim() || null;
}

function tokenDigest(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function rowToUser(row: AuthRow): AppUser {
  return {
    id: row.id,
    email: row.email || undefined,
    phone: row.phone || undefined,
    name: row.name,
    type: row.type,
    role: row.role,
    avatar: row.avatar || undefined,
    residenceCountry: row.residence_country || undefined,
    timeZone: row.time_zone || undefined,
    preferredContactChannel: row.preferred_contact_channel || undefined,
    representativeName: row.representative_name || undefined,
    representativePhone: row.representative_phone || undefined,
    representativeRelation: row.representative_relation || undefined,
  };
}

async function ensureAuthSchema() {
  const db = getTursoClient();
  if (!db) throw new Error('AUTH_STORE_NOT_CONFIGURED');

  authSchemaReady ??= (async () => {
    await db.batch([
      `CREATE TABLE IF NOT EXISTS buildify_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        phone TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'client',
        role TEXT NOT NULL DEFAULT 'client',
        avatar TEXT,
        residence_country TEXT,
        time_zone TEXT,
        preferred_contact_channel TEXT,
        representative_name TEXT,
        representative_phone TEXT,
        representative_relation TEXT,
        failed_attempts INTEGER NOT NULL DEFAULT 0,
        locked_until TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS buildify_users_type_idx ON buildify_users (type)`,
      `CREATE TABLE IF NOT EXISTS buildify_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT UNIQUE NOT NULL,
        expires_at TEXT NOT NULL,
        revoked_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES buildify_users(id) ON DELETE CASCADE
      )`,
      `CREATE INDEX IF NOT EXISTS buildify_sessions_user_idx ON buildify_sessions (user_id)`,
      `CREATE INDEX IF NOT EXISTS buildify_sessions_expiry_idx ON buildify_sessions (expires_at)`,
      `CREATE TABLE IF NOT EXISTS buildify_password_resets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT UNIQUE NOT NULL,
        expires_at TEXT NOT NULL,
        used_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES buildify_users(id) ON DELETE CASCADE
      )`,
      `CREATE INDEX IF NOT EXISTS buildify_password_resets_user_idx ON buildify_password_resets (user_id)`,
    ], 'write');

    const columnsResult = await db.execute('PRAGMA table_info(buildify_users)');
    const existingColumns = new Set(columnsResult.rows.map(row => String(row.name)));
    const profileColumns = [
      ['residence_country', 'TEXT'],
      ['time_zone', 'TEXT'],
      ['preferred_contact_channel', 'TEXT'],
      ['representative_name', 'TEXT'],
      ['representative_phone', 'TEXT'],
      ['representative_relation', 'TEXT'],
    ] as const;
    const migrations = profileColumns
      .filter(([name]) => !existingColumns.has(name))
      .map(([name, type]) => `ALTER TABLE buildify_users ADD COLUMN ${name} ${type}`);
    for (const migration of migrations) {
      try {
        await db.execute(migration);
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : '';
        if (!message.includes('duplicate column')) throw error;
      }
    }
  })();

  await authSchemaReady;
  return db;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, 64) as Buffer;
  return `scrypt:${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, expectedHex] = storedHash.split(':');
  if (algorithm !== 'scrypt' || !salt || !expectedHex) return false;

  const expected = Buffer.from(expectedHex, 'hex');
  const actual = await scryptAsync(password, salt, expected.length) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function findUserByIdentifier(identifier: string) {
  const db = await ensureAuthSchema();
  const email = normalizeEmail(identifier);
  const phone = normalizePhone(identifier);
  const result = await db.execute({
    sql: `SELECT id, email, phone, password_hash, name, type, role, avatar,
                 residence_country, time_zone, preferred_contact_channel,
                 representative_name, representative_phone, representative_relation,
                 failed_attempts, locked_until, is_active
          FROM buildify_users
          WHERE email = ? OR phone = ?
          LIMIT 1`,
    args: [email, phone],
  });
  return result.rows[0] as unknown as (AuthRow & { password_hash: string }) | undefined;
}

async function createSession(userId: string) {
  const db = await ensureAuthSchema();
  const token = randomBytes(32).toString('base64url');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  await db.batch([
    {
      sql: `DELETE FROM buildify_sessions WHERE expires_at <= ? OR revoked_at IS NOT NULL`,
      args: [now.toISOString()],
    },
    {
      sql: `INSERT INTO buildify_sessions (id, user_id, token_hash, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [crypto.randomUUID(), userId, tokenDigest(token), expiresAt.toISOString(), now.toISOString()],
    },
  ], 'write');

  return { token, expiresAt };
}

export async function registerClient(input: {
  name: string;
  email?: string | null;
  phone?: string | null;
  password: string;
}) {
  const db = await ensureAuthSchema();
  const now = new Date().toISOString();
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(input.password);

  await db.execute({
    sql: `INSERT INTO buildify_users (
            id, email, phone, password_hash, name, type, role, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, 'client', 'client', ?, ?)`,
    args: [id, email, phone, passwordHash, input.name.trim(), now, now],
  });

  const session = await createSession(id);
  return {
    user: {
      id,
      email: email || undefined,
      phone: phone || undefined,
      name: input.name.trim(),
      type: 'client' as const,
      role: 'client',
    },
    ...session,
  };
}

async function bootstrapConfiguredAdmin(identifier: string, password: string) {
  const configuredEmail = normalizeEmail(process.env.BUILDIFY_ADMIN_EMAIL);
  const configuredHash = process.env.BUILDIFY_ADMIN_PASSWORD_HASH;
  if (!configuredEmail || !configuredHash || normalizeEmail(identifier) !== configuredEmail) return null;
  if (!await verifyPassword(password, configuredHash)) return null;

  const db = await ensureAuthSchema();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  try {
    await db.execute({
      sql: `INSERT INTO buildify_users (
              id, email, phone, password_hash, name, type, role, created_at, updated_at
            ) VALUES (?, ?, NULL, ?, ?, 'admin', 'super_admin', ?, ?)`,
      args: [id, configuredEmail, configuredHash, process.env.BUILDIFY_ADMIN_NAME || 'Administration Buildify', now, now],
    });
  } catch {
    return findUserByIdentifier(identifier);
  }
  return findUserByIdentifier(identifier);
}

export async function authenticateUser(input: {
  identifier: string;
  password: string;
  platform: 'client' | 'admin';
}): Promise<AuthenticationResult> {
  if (!hasAuthStore()) {
    return {
      ok: false,
      code: 'SERVICE_NOT_CONFIGURED',
      message: "Le service d'authentification sécurisé n'est pas configuré.",
    };
  }

  let row = await findUserByIdentifier(input.identifier);
  if (!row && input.platform === 'admin') {
    row = await bootstrapConfiguredAdmin(input.identifier, input.password) || undefined;
  }

  if (!row) {
    await scryptAsync(input.password, 'buildify-credential-check', 64);
    return { ok: false, code: 'INVALID_CREDENTIALS', message: 'Identifiant ou mot de passe incorrect.' };
  }

  if (!row.is_active) {
    return { ok: false, code: 'ACCESS_DENIED', message: 'Ce compte est désactivé.' };
  }

  const lockedUntil = row.locked_until ? new Date(row.locked_until) : null;
  if (lockedUntil && lockedUntil.getTime() > Date.now()) {
    return {
      ok: false,
      code: 'ACCOUNT_LOCKED',
      message: `Compte temporairement verrouillé. Réessayez après ${lockedUntil.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.`,
    };
  }

  const validPassword = await verifyPassword(input.password, row.password_hash);
  if (!validPassword) {
    const failedAttempts = Number(row.failed_attempts || 0) + 1;
    const nextLock = failedAttempts >= MAX_FAILED_ATTEMPTS
      ? new Date(Date.now() + LOCK_DURATION_MS).toISOString()
      : null;
    await (await ensureAuthSchema()).execute({
      sql: `UPDATE buildify_users SET failed_attempts = ?, locked_until = ?, updated_at = ? WHERE id = ?`,
      args: [nextLock ? 0 : failedAttempts, nextLock, new Date().toISOString(), row.id],
    });
    return {
      ok: false,
      code: nextLock ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS',
      message: nextLock
        ? 'Compte verrouillé pendant 15 minutes après plusieurs tentatives.'
        : 'Identifiant ou mot de passe incorrect.',
    };
  }

  const isAdmin = row.type === 'admin' || row.type === 'employee';
  if ((input.platform === 'admin' && !isAdmin) || (input.platform === 'client' && isAdmin)) {
    return {
      ok: false,
      code: 'ACCESS_DENIED',
      message: input.platform === 'admin'
        ? "Ce compte n'est pas habilité pour la plateforme administrateur."
        : "Ce compte appartient à l'administration. Utilisez le lien /admin.",
    };
  }

  const db = await ensureAuthSchema();
  await db.execute({
    sql: `UPDATE buildify_users SET failed_attempts = 0, locked_until = NULL, updated_at = ? WHERE id = ?`,
    args: [new Date().toISOString(), row.id],
  });
  const session = await createSession(row.id);
  return { ok: true, user: rowToUser(row), ...session };
}

export async function getSessionUser(token?: string | null) {
  if (!token || !hasAuthStore()) return null;
  const db = await ensureAuthSchema();
  const result = await db.execute({
    sql: `SELECT u.id, u.email, u.phone, u.name, u.type, u.role, u.avatar,
                 u.residence_country, u.time_zone, u.preferred_contact_channel,
                 u.representative_name, u.representative_phone, u.representative_relation,
                 u.failed_attempts, u.locked_until, u.is_active
          FROM buildify_sessions s
          JOIN buildify_users u ON u.id = s.user_id
          WHERE s.token_hash = ?
            AND s.revoked_at IS NULL
            AND s.expires_at > ?
            AND u.is_active = 1
          LIMIT 1`,
    args: [tokenDigest(token), new Date().toISOString()],
  });
  const row = result.rows[0] as unknown as AuthRow | undefined;
  return row ? rowToUser(row) : null;
}

export async function revokeSession(token?: string | null) {
  if (!token || !hasAuthStore()) return;
  const db = await ensureAuthSchema();
  await db.execute({
    sql: `UPDATE buildify_sessions SET revoked_at = ? WHERE token_hash = ?`,
    args: [new Date().toISOString(), tokenDigest(token)],
  });
}

type ProfileUpdate = Pick<
  AppUser,
  | 'name'
  | 'phone'
  | 'residenceCountry'
  | 'timeZone'
  | 'preferredContactChannel'
  | 'representativeName'
  | 'representativePhone'
  | 'representativeRelation'
>;

function optionalText(value?: string | null) {
  return value?.trim() || null;
}

export async function updateAuthProfile(userId: string, profile: ProfileUpdate) {
  const db = await ensureAuthSchema();
  const now = new Date().toISOString();
  await db.execute({
    sql: `UPDATE buildify_users
          SET name = ?, phone = ?, residence_country = ?, time_zone = ?,
              preferred_contact_channel = ?, representative_name = ?,
              representative_phone = ?, representative_relation = ?, updated_at = ?
          WHERE id = ? AND is_active = 1`,
    args: [
      profile.name.trim(),
      normalizePhone(profile.phone),
      optionalText(profile.residenceCountry),
      optionalText(profile.timeZone),
      optionalText(profile.preferredContactChannel),
      optionalText(profile.representativeName),
      normalizePhone(profile.representativePhone),
      optionalText(profile.representativeRelation),
      now,
      userId,
    ],
  });

  const result = await db.execute({
    sql: `SELECT id, email, phone, name, type, role, avatar,
                 residence_country, time_zone, preferred_contact_channel,
                 representative_name, representative_phone, representative_relation,
                 failed_attempts, locked_until, is_active
          FROM buildify_users WHERE id = ? AND is_active = 1 LIMIT 1`,
    args: [userId],
  });
  const row = result.rows[0] as unknown as AuthRow | undefined;
  return row ? rowToUser(row) : null;
}

export type DeleteAccountResult =
  | { ok: true; deletedProjects: number }
  | { ok: false; code: 'INVALID_PASSWORD' | 'ACCESS_DENIED' | 'ACCOUNT_NOT_FOUND'; message: string };

export async function deleteClientAccount(userId: string, password: string): Promise<DeleteAccountResult> {
  const db = await ensureAuthSchema();
  const result = await db.execute({
    sql: `SELECT id, password_hash, type FROM buildify_users WHERE id = ? AND is_active = 1 LIMIT 1`,
    args: [userId],
  });
  const row = result.rows[0] as unknown as { id: string; password_hash: string; type: AppUser['type'] } | undefined;
  if (!row) return { ok: false, code: 'ACCOUNT_NOT_FOUND', message: 'Compte introuvable.' };
  if (row.type === 'admin' || row.type === 'employee') {
    return {
      ok: false,
      code: 'ACCESS_DENIED',
      message: "Un compte d'administration ne peut pas être supprimé depuis l'espace client.",
    };
  }
  if (!await verifyPassword(password, row.password_hash)) {
    return { ok: false, code: 'INVALID_PASSWORD', message: 'Mot de passe incorrect.' };
  }

  await ensureTursoProjectStore();
  const projectRows = await db.execute({
    sql: 'SELECT payload FROM buildify_project_requests WHERE user_id = ?',
    args: [userId],
  });
  const storagePaths = projectRows.rows.flatMap(row => {
    if (typeof row.payload !== 'string') return [];
    try {
      const project = JSON.parse(row.payload) as ProjectData;
      return (project.documents ?? []).map(document => document.storagePath).filter((path): path is string => Boolean(path));
    } catch {
      return [];
    }
  });
  if (storagePaths.length && hasPrivateDocumentStore()) {
    await del(Array.from(new Set(storagePaths)));
  }
  const countResult = await db.execute({
    sql: 'SELECT COUNT(*) AS total FROM buildify_project_requests WHERE user_id = ?',
    args: [userId],
  });
  const deletedProjects = Number(countResult.rows[0]?.total ?? 0);
  await db.batch([
    { sql: 'DELETE FROM buildify_project_requests WHERE user_id = ?', args: [userId] },
    { sql: 'DELETE FROM buildify_password_resets WHERE user_id = ?', args: [userId] },
    { sql: 'DELETE FROM buildify_sessions WHERE user_id = ?', args: [userId] },
    { sql: 'DELETE FROM buildify_users WHERE id = ?', args: [userId] },
  ], 'write');

  return { ok: true, deletedProjects };
}

export async function createPasswordReset(emailInput: string) {
  const row = await findUserByIdentifier(emailInput);
  if (!row?.email) return null;

  const db = await ensureAuthSchema();
  const token = randomBytes(32).toString('base64url');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
  await db.batch([
    {
      sql: `UPDATE buildify_password_resets SET used_at = ? WHERE user_id = ? AND used_at IS NULL`,
      args: [now.toISOString(), row.id],
    },
    {
      sql: `INSERT INTO buildify_password_resets (id, user_id, token_hash, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [crypto.randomUUID(), row.id, tokenDigest(token), expiresAt.toISOString(), now.toISOString()],
    },
  ], 'write');
  return { token, email: row.email, name: row.name };
}

export async function resetPassword(input: { email: string; token: string; password: string }) {
  const db = await ensureAuthSchema();
  const email = normalizeEmail(input.email);
  const result = await db.execute({
    sql: `SELECT r.id, r.user_id
          FROM buildify_password_resets r
          JOIN buildify_users u ON u.id = r.user_id
          WHERE r.token_hash = ? AND u.email = ? AND r.used_at IS NULL AND r.expires_at > ?
          LIMIT 1`,
    args: [tokenDigest(input.token), email, new Date().toISOString()],
  });
  const reset = result.rows[0] as unknown as { id: string; user_id: string } | undefined;
  if (!reset) return false;

  const now = new Date().toISOString();
  const passwordHash = await hashPassword(input.password);
  await db.batch([
    {
      sql: `UPDATE buildify_users SET password_hash = ?, failed_attempts = 0, locked_until = NULL, updated_at = ? WHERE id = ?`,
      args: [passwordHash, now, reset.user_id],
    },
    {
      sql: `UPDATE buildify_password_resets SET used_at = ? WHERE id = ?`,
      args: [now, reset.id],
    },
    {
      sql: `UPDATE buildify_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL`,
      args: [now, reset.user_id],
    },
  ], 'write');
  return true;
}
