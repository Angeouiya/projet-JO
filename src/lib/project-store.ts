import { neon } from '@neondatabase/serverless';
import { getTursoClient, hasTursoDatabase } from '@/lib/turso';
import type { ProjectData } from '@/types';

type ProjectStoreRow = {
  payload: ProjectData | string;
  total_count?: string | number | bigint;
};

export type ProjectStoreInput = Omit<ProjectData, 'createdAt' | 'updatedAt' | 'progress'> & {
  progress?: number;
  createdAt?: string;
  updatedAt?: string;
};

type ListProjectsParams = {
  userId?: string;
  status?: string;
  page: number;
  limit: number;
};

let neonSchemaReady: Promise<void> | null = null;
let tursoSchemaReady: Promise<void> | null = null;

function getExternalDatabaseUrl() {
  const candidates = [
    process.env.NEON_DATABASE_URL,
    process.env.BUILDIFY_PROJECTS_DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.EXTERNAL_DATABASE_URL,
    process.env.DATABASE_URL,
  ];

  return candidates.find(value => value?.startsWith('postgres://') || value?.startsWith('postgresql://'));
}

export function hasExternalProjectStore() {
  return hasTursoDatabase() || Boolean(getExternalDatabaseUrl());
}

export function projectStoreName() {
  if (hasTursoDatabase()) return 'turso';
  if (getExternalDatabaseUrl()) return 'neon';
  return 'sqlite-fallback';
}

function parsePayload(payload: ProjectStoreRow['payload']) {
  if (typeof payload === 'string') return JSON.parse(payload) as ProjectData;
  return payload;
}

function normalizeProject(input: ProjectStoreInput | ProjectData): ProjectData {
  const now = new Date().toISOString();
  return {
    ...input,
    id: input.id || crypto.randomUUID(),
    progress: input.progress ?? 5,
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  } as ProjectData;
}

function getNeonSql() {
  const databaseUrl = getExternalDatabaseUrl();
  return databaseUrl ? neon(databaseUrl) : null;
}

async function ensureNeonProjectStore() {
  const sql = getNeonSql();
  if (!sql) throw new Error('External project database is not configured.');

  neonSchemaReady ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS buildify_project_requests (
        id TEXT PRIMARY KEY,
        reference_number TEXT UNIQUE NOT NULL,
        user_id TEXT,
        client_email TEXT,
        client_phone TEXT,
        status TEXT NOT NULL,
        country TEXT,
        city TEXT,
        category_id TEXT,
        model_id TEXT,
        title TEXT,
        budget_min DOUBLE PRECISION,
        budget_max DOUBLE PRECISION,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS buildify_project_requests_user_idx ON buildify_project_requests (user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS buildify_project_requests_status_idx ON buildify_project_requests (status)`;
    await sql`CREATE INDEX IF NOT EXISTS buildify_project_requests_updated_idx ON buildify_project_requests (updated_at DESC)`;
  })();

  await neonSchemaReady;
  return sql;
}

async function ensureTursoProjectStore() {
  const db = getTursoClient();
  if (!db) throw new Error('Turso project database is not configured.');

  tursoSchemaReady ??= (async () => {
    await db.batch([
      `CREATE TABLE IF NOT EXISTS buildify_project_requests (
        id TEXT PRIMARY KEY,
        reference_number TEXT UNIQUE NOT NULL,
        user_id TEXT,
        client_email TEXT,
        client_phone TEXT,
        status TEXT NOT NULL,
        country TEXT,
        city TEXT,
        category_id TEXT,
        model_id TEXT,
        title TEXT,
        budget_min REAL,
        budget_max REAL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS buildify_project_requests_user_idx ON buildify_project_requests (user_id)`,
      `CREATE INDEX IF NOT EXISTS buildify_project_requests_status_idx ON buildify_project_requests (status)`,
      `CREATE INDEX IF NOT EXISTS buildify_project_requests_updated_idx ON buildify_project_requests (updated_at DESC)`,
    ], 'write');
  })();

  await tursoSchemaReady;
  return db;
}

function projectArgs(project: ProjectData) {
  return [
    project.id,
    project.referenceNumber,
    project.userId || null,
    project.clientEmail || null,
    project.clientPhone || null,
    project.status,
    project.country || null,
    project.city || null,
    project.categoryId || null,
    project.modelId || null,
    project.title || null,
    project.budgetMin ?? null,
    project.budgetMax ?? null,
    JSON.stringify(project),
    project.createdAt,
    project.updatedAt,
  ];
}

async function createTursoProject(project: ProjectData) {
  const db = await ensureTursoProjectStore();
  await db.execute({
    sql: `INSERT INTO buildify_project_requests (
            id, reference_number, user_id, client_email, client_phone, status,
            country, city, category_id, model_id, title, budget_min, budget_max,
            payload, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: projectArgs(project),
  });
  return project;
}

export async function createStoredProject(input: ProjectStoreInput) {
  const project = normalizeProject(input);
  if (hasTursoDatabase()) return createTursoProject(project);

  const sql = await ensureNeonProjectStore();
  const rows = await sql`
    INSERT INTO buildify_project_requests (
      id, reference_number, user_id, client_email, client_phone, status, country,
      city, category_id, model_id, title, budget_min, budget_max, payload, created_at, updated_at
    ) VALUES (
      ${project.id}, ${project.referenceNumber}, ${project.userId || null},
      ${project.clientEmail || null}, ${project.clientPhone || null}, ${project.status},
      ${project.country || null}, ${project.city || null}, ${project.categoryId || null},
      ${project.modelId || null}, ${project.title || null}, ${project.budgetMin ?? null},
      ${project.budgetMax ?? null}, ${JSON.stringify(project)}::jsonb,
      ${project.createdAt}, ${project.updatedAt}
    ) RETURNING payload
  ` as ProjectStoreRow[];
  return parsePayload(rows[0].payload);
}

export async function saveStoredProject(input: ProjectData) {
  const project = normalizeProject({ ...input, updatedAt: new Date().toISOString() });
  if (hasTursoDatabase()) {
    const db = await ensureTursoProjectStore();
    await db.execute({
      sql: `INSERT INTO buildify_project_requests (
              id, reference_number, user_id, client_email, client_phone, status,
              country, city, category_id, model_id, title, budget_min, budget_max,
              payload, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              reference_number = excluded.reference_number,
              user_id = excluded.user_id,
              client_email = excluded.client_email,
              client_phone = excluded.client_phone,
              status = excluded.status,
              country = excluded.country,
              city = excluded.city,
              category_id = excluded.category_id,
              model_id = excluded.model_id,
              title = excluded.title,
              budget_min = excluded.budget_min,
              budget_max = excluded.budget_max,
              payload = excluded.payload,
              updated_at = excluded.updated_at`,
      args: projectArgs(project),
    });
    return project;
  }

  const sql = await ensureNeonProjectStore();
  const rows = await sql`
    INSERT INTO buildify_project_requests (
      id, reference_number, user_id, client_email, client_phone, status, country,
      city, category_id, model_id, title, budget_min, budget_max, payload, created_at, updated_at
    ) VALUES (
      ${project.id}, ${project.referenceNumber}, ${project.userId || null},
      ${project.clientEmail || null}, ${project.clientPhone || null}, ${project.status},
      ${project.country || null}, ${project.city || null}, ${project.categoryId || null},
      ${project.modelId || null}, ${project.title || null}, ${project.budgetMin ?? null},
      ${project.budgetMax ?? null}, ${JSON.stringify(project)}::jsonb,
      ${project.createdAt}, ${project.updatedAt}
    ) ON CONFLICT (id) DO UPDATE SET
      reference_number = EXCLUDED.reference_number,
      user_id = EXCLUDED.user_id,
      client_email = EXCLUDED.client_email,
      client_phone = EXCLUDED.client_phone,
      status = EXCLUDED.status,
      country = EXCLUDED.country,
      city = EXCLUDED.city,
      category_id = EXCLUDED.category_id,
      model_id = EXCLUDED.model_id,
      title = EXCLUDED.title,
      budget_min = EXCLUDED.budget_min,
      budget_max = EXCLUDED.budget_max,
      payload = EXCLUDED.payload,
      updated_at = EXCLUDED.updated_at
    RETURNING payload
  ` as ProjectStoreRow[];
  return parsePayload(rows[0].payload);
}

export async function getStoredProject(projectId: string) {
  if (hasTursoDatabase()) {
    const db = await ensureTursoProjectStore();
    const result = await db.execute({
      sql: `SELECT payload FROM buildify_project_requests WHERE id = ? LIMIT 1`,
      args: [projectId],
    });
    const payload = result.rows[0]?.payload;
    return typeof payload === 'string' ? parsePayload(payload) : null;
  }

  const sql = await ensureNeonProjectStore();
  const rows = await sql`SELECT payload FROM buildify_project_requests WHERE id = ${projectId} LIMIT 1` as ProjectStoreRow[];
  return rows[0] ? parsePayload(rows[0].payload) : null;
}

export async function listStoredProjects({ userId, status, page, limit }: ListProjectsParams) {
  const offset = (page - 1) * limit;
  if (hasTursoDatabase()) {
    const db = await ensureTursoProjectStore();
    const clauses: string[] = [];
    const args: Array<string | number> = [];
    if (userId) {
      clauses.push('user_id = ?');
      args.push(userId);
    }
    if (status) {
      clauses.push('status = ?');
      args.push(status);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const [rows, count] = await Promise.all([
      db.execute({
        sql: `SELECT payload FROM buildify_project_requests ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
        args: [...args, limit, offset],
      }),
      db.execute({
        sql: `SELECT COUNT(*) AS total FROM buildify_project_requests ${where}`,
        args,
      }),
    ]);
    return {
      projects: rows.rows
        .map(row => row.payload)
        .filter((payload): payload is string => typeof payload === 'string')
        .map(parsePayload),
      total: Number(count.rows[0]?.total ?? 0),
    };
  }

  const sql = await ensureNeonProjectStore();
  const rows = userId && status
    ? await sql`SELECT payload, COUNT(*) OVER() AS total_count FROM buildify_project_requests WHERE user_id = ${userId} AND status = ${status} ORDER BY updated_at DESC LIMIT ${limit} OFFSET ${offset}` as ProjectStoreRow[]
    : userId
      ? await sql`SELECT payload, COUNT(*) OVER() AS total_count FROM buildify_project_requests WHERE user_id = ${userId} ORDER BY updated_at DESC LIMIT ${limit} OFFSET ${offset}` as ProjectStoreRow[]
      : status
        ? await sql`SELECT payload, COUNT(*) OVER() AS total_count FROM buildify_project_requests WHERE status = ${status} ORDER BY updated_at DESC LIMIT ${limit} OFFSET ${offset}` as ProjectStoreRow[]
        : await sql`SELECT payload, COUNT(*) OVER() AS total_count FROM buildify_project_requests ORDER BY updated_at DESC LIMIT ${limit} OFFSET ${offset}` as ProjectStoreRow[];

  const total = rows[0]?.total_count;
  return {
    projects: rows.map(row => parsePayload(row.payload)),
    total: typeof total === 'bigint' ? Number(total) : Number(total ?? 0),
  };
}
