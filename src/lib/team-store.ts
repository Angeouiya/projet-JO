import { DEFAULT_TEAM_MEMBERS } from '@/data/team';
import { getTursoClient, hasTursoDatabase } from '@/lib/turso';
import type { TeamMemberData } from '@/types';

type TeamStoreRow = {
  payload: string;
};

type ListTeamParams = {
  includeInactive?: boolean;
  includePrivate?: boolean;
  search?: string;
  page: number;
  limit: number;
};

let teamSchemaReady: Promise<void> | null = null;
let teamSeedReady: Promise<void> | null = null;

export function hasExternalTeamStore() {
  return hasTursoDatabase();
}

function normalizeBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return ['1', 'true', 'yes', 'oui'].includes(value.toLowerCase());
  return fallback;
}

export function normalizeTeamMember(input: Partial<TeamMemberData> & Pick<TeamMemberData, 'name' | 'email'>): TeamMemberData {
  const now = new Date().toISOString();
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  return {
    id: input.id?.trim() || crypto.randomUUID(),
    name,
    email,
    role: input.role?.trim() || 'commercial',
    department: input.department?.trim() || 'commercial',
    phone: input.phone?.trim() || undefined,
    photoUrl: input.photoUrl?.trim() || DEFAULT_TEAM_MEMBERS[0]?.photoUrl || '/images/hero-villa.png',
    bio: input.bio?.trim() || 'Membre de l’équipe Buildify.',
    publicVisible: normalizeBoolean(input.publicVisible, true),
    active: normalizeBoolean(input.active, true),
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
}

async function ensureTeamStore() {
  const db = getTursoClient();
  if (!db) throw new Error('TEAM_STORE_NOT_CONFIGURED');

  teamSchemaReady ??= (async () => {
    await db.batch([
      `CREATE TABLE IF NOT EXISTS buildify_team_members (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL,
        department TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1,
        public_visible INTEGER NOT NULL DEFAULT 1,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS buildify_team_members_public_idx ON buildify_team_members (active, public_visible)`,
      `CREATE INDEX IF NOT EXISTS buildify_team_members_role_idx ON buildify_team_members (role, department)`,
      `CREATE INDEX IF NOT EXISTS buildify_team_members_updated_idx ON buildify_team_members (updated_at DESC)`,
    ], 'write');
  })();

  await teamSchemaReady;
  return db;
}

function teamArgs(member: TeamMemberData) {
  return [
    member.id,
    member.name,
    member.email,
    member.role,
    member.department,
    member.active ? 1 : 0,
    member.publicVisible ? 1 : 0,
    JSON.stringify(member),
    member.createdAt,
    member.updatedAt,
  ];
}

async function upsertTeamMember(member: TeamMemberData) {
  const db = await ensureTeamStore();
  await db.execute({
    sql: `INSERT INTO buildify_team_members (
            id, name, email, role, department, active, public_visible, payload, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            email = excluded.email,
            role = excluded.role,
            department = excluded.department,
            active = excluded.active,
            public_visible = excluded.public_visible,
            payload = excluded.payload,
            updated_at = excluded.updated_at`,
    args: teamArgs(member),
  });
  return member;
}

async function seedTeamIfEmpty() {
  const db = await ensureTeamStore();
  teamSeedReady ??= (async () => {
    const count = await db.execute('SELECT COUNT(*) AS total FROM buildify_team_members');
    if (Number(count.rows[0]?.total ?? 0) > 0) return;
    for (const member of DEFAULT_TEAM_MEMBERS.map(item => normalizeTeamMember(item))) {
      await upsertTeamMember(member);
    }
  })();
  await teamSeedReady;
}

function parseTeamPayload(row: TeamStoreRow) {
  return normalizeTeamMember(JSON.parse(row.payload) as TeamMemberData);
}

export async function listTeamMembers(params: ListTeamParams) {
  await seedTeamIfEmpty();
  const db = await ensureTeamStore();
  const clauses: string[] = [];
  const args: Array<string | number> = [];

  if (!params.includeInactive) clauses.push('active = 1');
  if (!params.includePrivate) clauses.push('public_visible = 1');
  if (params.search) {
    clauses.push('(lower(name) LIKE ? OR lower(email) LIKE ? OR lower(role) LIKE ? OR lower(department) LIKE ? OR lower(payload) LIKE ?)');
    const query = `%${params.search.toLowerCase()}%`;
    args.push(query, query, query, query, query);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const offset = (params.page - 1) * params.limit;
  const [rows, count] = await Promise.all([
    db.execute({
      sql: `SELECT payload FROM buildify_team_members ${where} ORDER BY active DESC, public_visible DESC, updated_at DESC LIMIT ? OFFSET ?`,
      args: [...args, params.limit, offset],
    }),
    db.execute({
      sql: `SELECT COUNT(*) AS total FROM buildify_team_members ${where}`,
      args,
    }),
  ]);

  return {
    members: rows.rows.map(row => ({ payload: String(row.payload) })).map(parseTeamPayload),
    total: Number(count.rows[0]?.total ?? 0),
  };
}

export async function saveTeamMember(input: Partial<TeamMemberData> & Pick<TeamMemberData, 'name' | 'email'>) {
  await seedTeamIfEmpty();
  return upsertTeamMember(normalizeTeamMember({ ...input, updatedAt: new Date().toISOString() }));
}

export async function deleteTeamMember(memberId: string) {
  await seedTeamIfEmpty();
  const db = await ensureTeamStore();
  await db.execute({
    sql: 'DELETE FROM buildify_team_members WHERE id = ?',
    args: [memberId],
  });
}
