import { neon } from '@neondatabase/serverless';
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

let schemaReady: Promise<void> | null = null;

function getExternalDatabaseUrl() {
  const candidates = [
    process.env.NEON_DATABASE_URL,
    process.env.BUILDIFY_PROJECTS_DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.EXTERNAL_DATABASE_URL,
    process.env.DATABASE_URL,
  ];

  return candidates.find((value) => value?.startsWith('postgres://') || value?.startsWith('postgresql://'));
}

export function hasExternalProjectStore() {
  return Boolean(getExternalDatabaseUrl());
}

function getSql() {
  const databaseUrl = getExternalDatabaseUrl();
  if (!databaseUrl) return null;
  return neon(databaseUrl);
}

function parsePayload(payload: ProjectStoreRow['payload']) {
  if (typeof payload === 'string') return JSON.parse(payload) as ProjectData;
  return payload;
}

async function ensureProjectStore() {
  const sql = getSql();
  if (!sql) throw new Error('External project database is not configured.');

  schemaReady ??= (async () => {
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

  await schemaReady;
  return sql;
}

export async function createStoredProject(input: ProjectStoreInput) {
  const sql = await ensureProjectStore();
  const now = new Date().toISOString();
  const project: ProjectData = {
    ...input,
    id: input.id || crypto.randomUUID(),
    progress: input.progress ?? 5,
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };

  const rows = await sql`
    INSERT INTO buildify_project_requests (
      id,
      reference_number,
      user_id,
      client_email,
      client_phone,
      status,
      country,
      city,
      category_id,
      model_id,
      title,
      budget_min,
      budget_max,
      payload,
      created_at,
      updated_at
    )
    VALUES (
      ${project.id},
      ${project.referenceNumber},
      ${project.userId || null},
      ${project.clientEmail || null},
      ${project.clientPhone || null},
      ${project.status},
      ${project.country || null},
      ${project.city || null},
      ${project.categoryId || null},
      ${project.modelId || null},
      ${project.title || null},
      ${project.budgetMin ?? null},
      ${project.budgetMax ?? null},
      ${JSON.stringify(project)}::jsonb,
      ${project.createdAt},
      ${project.updatedAt}
    )
    RETURNING payload
  ` as ProjectStoreRow[];

  return parsePayload(rows[0].payload);
}

export async function listStoredProjects({ userId, status, page, limit }: ListProjectsParams) {
  const sql = await ensureProjectStore();
  const offset = (page - 1) * limit;

  const rows = userId && status
    ? await sql`
        SELECT payload, COUNT(*) OVER() AS total_count
        FROM buildify_project_requests
        WHERE user_id = ${userId} AND status = ${status}
        ORDER BY updated_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      ` as ProjectStoreRow[]
    : userId
      ? await sql`
          SELECT payload, COUNT(*) OVER() AS total_count
          FROM buildify_project_requests
          WHERE user_id = ${userId}
          ORDER BY updated_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        ` as ProjectStoreRow[]
      : status
        ? await sql`
            SELECT payload, COUNT(*) OVER() AS total_count
            FROM buildify_project_requests
            WHERE status = ${status}
            ORDER BY updated_at DESC
            LIMIT ${limit}
            OFFSET ${offset}
          ` as ProjectStoreRow[]
        : await sql`
            SELECT payload, COUNT(*) OVER() AS total_count
            FROM buildify_project_requests
            ORDER BY updated_at DESC
            LIMIT ${limit}
            OFFSET ${offset}
          ` as ProjectStoreRow[];

  const total = rows[0]?.total_count;

  return {
    projects: rows.map(row => parsePayload(row.payload)),
    total: typeof total === 'bigint' ? Number(total) : Number(total ?? 0),
  };
}
