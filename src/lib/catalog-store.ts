import { getTursoClient, hasTursoDatabase } from '@/lib/turso';
import { DEFAULT_CATALOG_MODELS } from '@/data/catalog-models';
import type { CatalogModelData } from '@/types';

type CatalogStoreRow = {
  payload: string;
  total_count?: string | number | bigint;
};

type ListCatalogParams = {
  id?: string;
  category?: string;
  standing?: string;
  featured?: boolean;
  search?: string;
  includeDrafts?: boolean;
  page: number;
  limit: number;
};

let catalogSchemaReady: Promise<void> | null = null;
let catalogSeedReady: Promise<void> | null = null;

export function hasExternalCatalogStore() {
  return hasTursoDatabase();
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || `modele-${Date.now()}`;
}

function normalizedArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map(item => String(item).trim()).filter(Boolean)
    : [];
}

export function normalizeCatalogModel(input: Partial<CatalogModelData> & Pick<CatalogModelData, 'name'>): CatalogModelData {
  const name = input.name.trim();
  const categoryName = input.categoryName?.trim() || input.categoryId?.trim() || 'Projet BTP';
  const slug = input.slug?.trim() || slugify(name);
  const categoryId = input.categoryId?.trim() || slugify(categoryName);
  const mainImage = input.mainImage?.trim() || input.images?.[0] || '/images/villa-1.png';

  return {
    id: input.id?.trim() || crypto.randomUUID(),
    name,
    slug,
    description: input.description?.trim() || undefined,
    categoryId,
    categoryName,
    mainImage,
    images: normalizedArray(input.images).length ? normalizedArray(input.images) : [mainImage],
    plans: normalizedArray(input.plans),
    levels: Math.max(0, Math.round(Number(input.levels ?? 1))),
    rooms: input.rooms === undefined ? undefined : Math.max(0, Math.round(Number(input.rooms))),
    bedrooms: input.bedrooms === undefined ? undefined : Math.max(0, Math.round(Number(input.bedrooms))),
    bathrooms: input.bathrooms === undefined ? undefined : Math.max(0, Math.round(Number(input.bathrooms))),
    surfaceArea: input.surfaceArea === undefined ? undefined : Math.max(0, Number(input.surfaceArea)),
    minLandArea: input.minLandArea === undefined ? undefined : Math.max(0, Number(input.minLandArea)),
    standing: input.standing?.trim() || 'standard',
    style: input.style?.trim() || undefined,
    equipment: normalizedArray(input.equipment),
    budgetMin: input.budgetMin === undefined ? undefined : Math.max(0, Number(input.budgetMin)),
    budgetMax: input.budgetMax === undefined ? undefined : Math.max(0, Number(input.budgetMax)),
    durationMin: input.durationMin === undefined ? undefined : Math.max(0, Math.round(Number(input.durationMin))),
    durationMax: input.durationMax === undefined ? undefined : Math.max(0, Math.round(Number(input.durationMax))),
    features: normalizedArray(input.features),
    viewCount: Math.max(0, Math.round(Number(input.viewCount ?? 0))),
    isPublished: input.isPublished ?? true,
    isFeatured: input.isFeatured ?? false,
  };
}

async function ensureCatalogStore() {
  const db = getTursoClient();
  if (!db) throw new Error('CATALOG_STORE_NOT_CONFIGURED');

  catalogSchemaReady ??= (async () => {
    await db.batch([
      `CREATE TABLE IF NOT EXISTS buildify_catalog_models (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        category_id TEXT NOT NULL,
        category_name TEXT,
        standing TEXT,
        is_published INTEGER NOT NULL DEFAULT 1,
        is_featured INTEGER NOT NULL DEFAULT 0,
        budget_min REAL,
        budget_max REAL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS buildify_catalog_models_public_idx ON buildify_catalog_models (is_published, is_featured)`,
      `CREATE INDEX IF NOT EXISTS buildify_catalog_models_category_idx ON buildify_catalog_models (category_id)`,
      `CREATE INDEX IF NOT EXISTS buildify_catalog_models_updated_idx ON buildify_catalog_models (updated_at DESC)`,
    ], 'write');
  })();

  await catalogSchemaReady;
  return db;
}

function catalogArgs(model: CatalogModelData, createdAt: string, updatedAt: string) {
  return [
    model.id,
    model.slug,
    model.name,
    model.categoryId,
    model.categoryName || null,
    model.standing,
    model.isPublished ? 1 : 0,
    model.isFeatured ? 1 : 0,
    model.budgetMin ?? null,
    model.budgetMax ?? null,
    JSON.stringify(model),
    createdAt,
    updatedAt,
  ];
}

async function upsertCatalogModel(model: CatalogModelData, createdAt = new Date().toISOString()) {
  const db = await ensureCatalogStore();
  const updatedAt = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO buildify_catalog_models (
            id, slug, name, category_id, category_name, standing,
            is_published, is_featured, budget_min, budget_max,
            payload, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            slug = excluded.slug,
            name = excluded.name,
            category_id = excluded.category_id,
            category_name = excluded.category_name,
            standing = excluded.standing,
            is_published = excluded.is_published,
            is_featured = excluded.is_featured,
            budget_min = excluded.budget_min,
            budget_max = excluded.budget_max,
            payload = excluded.payload,
            updated_at = excluded.updated_at`,
    args: catalogArgs(model, createdAt, updatedAt),
  });
  return model;
}

async function seedCatalogIfEmpty() {
  const db = await ensureCatalogStore();
  catalogSeedReady ??= (async () => {
    const count = await db.execute('SELECT COUNT(*) AS total FROM buildify_catalog_models');
    if (Number(count.rows[0]?.total ?? 0) > 0) return;
    const createdAt = new Date().toISOString();
    for (const model of DEFAULT_CATALOG_MODELS.map(item => normalizeCatalogModel(item))) {
      await upsertCatalogModel(model, createdAt);
    }
  })();
  await catalogSeedReady;
}

function parseCatalogPayload(row: CatalogStoreRow) {
  return normalizeCatalogModel(JSON.parse(row.payload) as CatalogModelData);
}

export async function listCatalogModels(params: ListCatalogParams) {
  await seedCatalogIfEmpty();
  const db = await ensureCatalogStore();
  const clauses: string[] = [];
  const args: Array<string | number> = [];

  if (!params.includeDrafts) clauses.push('is_published = 1');
  if (params.id) {
    clauses.push('(id = ? OR slug = ?)');
    args.push(params.id, params.id);
  }
  if (params.category) {
    clauses.push('(category_id = ? OR lower(category_name) LIKE ?)');
    args.push(params.category, `%${params.category.toLowerCase()}%`);
  }
  if (params.standing) {
    clauses.push('lower(standing) = ?');
    args.push(params.standing.toLowerCase());
  }
  if (params.featured !== undefined) {
    clauses.push('is_featured = ?');
    args.push(params.featured ? 1 : 0);
  }
  if (params.search) {
    clauses.push('(lower(name) LIKE ? OR lower(category_name) LIKE ? OR lower(payload) LIKE ?)');
    const query = `%${params.search.toLowerCase()}%`;
    args.push(query, query, query);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const offset = (params.page - 1) * params.limit;
  const [rows, count] = await Promise.all([
    db.execute({
      sql: `SELECT payload FROM buildify_catalog_models ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
      args: [...args, params.limit, offset],
    }),
    db.execute({
      sql: `SELECT COUNT(*) AS total FROM buildify_catalog_models ${where}`,
      args,
    }),
  ]);

  return {
    models: rows.rows
      .map(row => ({ payload: String(row.payload) }))
      .map(parseCatalogPayload),
    total: Number(count.rows[0]?.total ?? 0),
  };
}

export async function saveCatalogModel(input: Partial<CatalogModelData> & Pick<CatalogModelData, 'name'>) {
  await seedCatalogIfEmpty();
  return upsertCatalogModel(normalizeCatalogModel(input));
}

export async function deleteCatalogModel(modelId: string) {
  await seedCatalogIfEmpty();
  const db = await ensureCatalogStore();
  await db.execute({
    sql: 'DELETE FROM buildify_catalog_models WHERE id = ? OR slug = ?',
    args: [modelId, modelId],
  });
}

