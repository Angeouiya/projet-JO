import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getRequestUser } from '@/lib/auth-http';
import { parseJsonField, serverError, validationError } from '@/lib/api-utils';
import {
  deleteCatalogModel,
  hasExternalCatalogStore,
  listCatalogModels,
  normalizeCatalogModel,
  saveCatalogModel,
} from '@/lib/catalog-store';
import type { AppUser, CatalogModelData } from '@/types';

const modelQuerySchema = z.object({
  id: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  standing: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  featured: z.enum(['true', 'false']).optional(),
  admin: z.enum(['true', 'false']).optional(),
  search: z.string().trim().min(1).max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(20),
});

const catalogModelSchema = z.object({
  id: z.string().trim().min(1).optional(),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(1200).optional(),
  categoryId: z.string().trim().min(1).max(80).optional(),
  categoryName: z.string().trim().min(1).max(120).optional(),
  mainImage: z.string().trim().min(1).max(500).optional(),
  images: z.array(z.string().trim().min(1).max(500)).optional(),
  plans: z.array(z.string().trim().min(1).max(500)).optional(),
  levels: z.coerce.number().int().min(0).max(80).optional(),
  rooms: z.coerce.number().int().min(0).max(500).optional(),
  bedrooms: z.coerce.number().int().min(0).max(500).optional(),
  bathrooms: z.coerce.number().int().min(0).max(500).optional(),
  surfaceArea: z.coerce.number().min(0).optional(),
  minLandArea: z.coerce.number().min(0).optional(),
  standing: z.string().trim().min(1).max(80).optional(),
  style: z.string().trim().max(120).optional(),
  equipment: z.array(z.string().trim().min(1).max(120)).optional(),
  budgetMin: z.coerce.number().min(0).optional(),
  budgetMax: z.coerce.number().min(0).optional(),
  durationMin: z.coerce.number().int().min(0).max(240).optional(),
  durationMax: z.coerce.number().int().min(0).max(240).optional(),
  features: z.array(z.string().trim().min(1).max(160)).optional(),
  viewCount: z.coerce.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

function isAdminUser(user: AppUser | null) {
  return user?.type === 'admin' || user?.type === 'employee';
}

function forbiddenAdminResponse() {
  return NextResponse.json({ error: 'Accès administrateur requis' }, { status: 403 });
}

function readonlyDatabaseResponse() {
  return NextResponse.json({
    error: 'Catalogue non disponible en écriture',
    code: 'DATABASE_READONLY',
    message: 'Configurez le store externe Buildify pour rendre le catalogue admin durable en production.',
  }, { status: 503 });
}

function isReadonlyDatabaseError(error: unknown) {
  return error instanceof Error && error.message.toLowerCase().includes('readonly database');
}

function serializePrismaModel(model: Prisma.CatalogModelGetPayload<{ include: { category: true } }>): CatalogModelData {
  return normalizeCatalogModel({
    id: model.id,
    name: model.name,
    slug: model.slug,
    description: model.description || undefined,
    categoryId: model.category?.slug || model.categoryId,
    categoryName: model.category?.name,
    mainImage: model.mainImage || undefined,
    images: parseJsonField<string[]>(model.images, []),
    plans: parseJsonField<string[]>(model.plans, []),
    levels: model.levels,
    rooms: model.rooms || undefined,
    bedrooms: model.bedrooms || undefined,
    bathrooms: model.bathrooms || undefined,
    surfaceArea: model.surfaceArea || undefined,
    minLandArea: model.minLandArea || undefined,
    standing: model.standing,
    style: model.style || undefined,
    equipment: parseJsonField<string[]>(model.equipment, []),
    budgetMin: model.budgetMin || undefined,
    budgetMax: model.budgetMax || undefined,
    durationMin: model.durationMin || undefined,
    durationMax: model.durationMax || undefined,
    features: parseJsonField<string[]>(model.features, []),
    viewCount: model.viewCount,
    isPublished: model.isPublished,
    isFeatured: model.isFeatured,
  });
}

async function resolveCategoryId(input: CatalogModelData) {
  const slug = input.categoryId || input.categoryName?.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'projet-btp';
  const category = await db.projectCategory.upsert({
    where: { slug },
    update: {
      name: input.categoryName || input.categoryId,
      description: `Catégorie catalogue Buildify : ${input.categoryName || input.categoryId}`,
    },
    create: {
      slug,
      name: input.categoryName || input.categoryId,
      description: `Catégorie catalogue Buildify : ${input.categoryName || input.categoryId}`,
      icon: 'Package',
    },
  });
  return category.id;
}

async function writePrismaModel(input: CatalogModelData) {
  const categoryId = await resolveCategoryId(input);
  return db.catalogModel.upsert({
    where: { id: input.id },
    update: {
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      categoryId,
      mainImage: input.mainImage || null,
      images: JSON.stringify(input.images),
      plans: JSON.stringify(input.plans),
      levels: input.levels,
      rooms: input.rooms || null,
      bedrooms: input.bedrooms || null,
      bathrooms: input.bathrooms || null,
      surfaceArea: input.surfaceArea || null,
      minLandArea: input.minLandArea || null,
      standing: input.standing,
      style: input.style || null,
      equipment: JSON.stringify(input.equipment),
      budgetMin: input.budgetMin || null,
      budgetMax: input.budgetMax || null,
      durationMin: input.durationMin || null,
      durationMax: input.durationMax || null,
      features: JSON.stringify(input.features),
      viewCount: input.viewCount,
      isPublished: input.isPublished,
      isFeatured: input.isFeatured,
    },
    create: {
      id: input.id,
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      categoryId,
      mainImage: input.mainImage || null,
      images: JSON.stringify(input.images),
      plans: JSON.stringify(input.plans),
      levels: input.levels,
      rooms: input.rooms || null,
      bedrooms: input.bedrooms || null,
      bathrooms: input.bathrooms || null,
      surfaceArea: input.surfaceArea || null,
      minLandArea: input.minLandArea || null,
      standing: input.standing,
      style: input.style || null,
      equipment: JSON.stringify(input.equipment),
      budgetMin: input.budgetMin || null,
      budgetMax: input.budgetMax || null,
      durationMin: input.durationMin || null,
      durationMax: input.durationMax || null,
      features: JSON.stringify(input.features),
      viewCount: input.viewCount,
      isPublished: input.isPublished,
      isFeatured: input.isFeatured,
    },
    include: { category: true },
  });
}

async function requireAdmin() {
  const actor = await getRequestUser();
  if (!isAdminUser(actor)) return null;
  return actor;
}

export async function GET(request: Request) {
  const parsed = modelQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return validationError(parsed.error);

  try {
    const actor = await getRequestUser();
    const includeDrafts = parsed.data.admin === 'true' && isAdminUser(actor);
    const { id, category, standing, featured, search, page, limit } = parsed.data;

    if (hasExternalCatalogStore()) {
      const { models, total } = await listCatalogModels({
        id,
        category,
        standing,
        featured: featured === undefined ? undefined : featured === 'true',
        search,
        includeDrafts,
        page,
        limit,
      });
      return NextResponse.json({ models, total, page, limit, store: 'external' });
    }

    const where: Prisma.CatalogModelWhereInput = includeDrafts ? {} : { isPublished: true };
    if (id) where.OR = [{ id }, { slug: id }];
    if (category) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          OR: [
            { categoryId: category },
            { category: { name: { contains: category } } },
          ],
        },
      ];
    }
    if (standing) where.standing = standing;
    if (featured === 'true') where.isFeatured = true;
    if (search) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
            { category: { name: { contains: search } } },
          ],
        },
      ];
    }

    const [models, total] = await Promise.all([
      db.catalogModel.findMany({
        where,
        include: { category: true },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.catalogModel.count({ where }),
    ]);

    return NextResponse.json({
      models: models.map(serializePrismaModel),
      total,
      page,
      limit,
      store: 'prisma',
    });
  } catch (error) {
    console.error('Models API error:', error);
    return serverError();
  }
}

export async function POST(request: Request) {
  if (!await requireAdmin()) return forbiddenAdminResponse();

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const parsed = catalogModelSchema.safeParse(json);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const model = normalizeCatalogModel(parsed.data);
    if (model.budgetMax !== undefined && model.budgetMin !== undefined && model.budgetMax < model.budgetMin) {
      return NextResponse.json({ error: 'Le budget maximum doit être supérieur au minimum.' }, { status: 400 });
    }

    if (hasExternalCatalogStore()) {
      const saved = await saveCatalogModel(model);
      return NextResponse.json({ model: saved, store: 'external' }, { status: 201 });
    }
    if (process.env.VERCEL === '1') return readonlyDatabaseResponse();

    const saved = await writePrismaModel(model);
    return NextResponse.json({ model: serializePrismaModel(saved), store: 'prisma' }, { status: 201 });
  } catch (error) {
    if (isReadonlyDatabaseError(error)) return readonlyDatabaseResponse();
    console.error('Model create error:', error);
    return serverError();
  }
}

export async function PATCH(request: Request) {
  if (!await requireAdmin()) return forbiddenAdminResponse();

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const parsed = catalogModelSchema.extend({ id: z.string().trim().min(1) }).safeParse(json);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const model = normalizeCatalogModel(parsed.data);
    if (model.budgetMax !== undefined && model.budgetMin !== undefined && model.budgetMax < model.budgetMin) {
      return NextResponse.json({ error: 'Le budget maximum doit être supérieur au minimum.' }, { status: 400 });
    }

    if (hasExternalCatalogStore()) {
      const saved = await saveCatalogModel(model);
      return NextResponse.json({ model: saved, store: 'external' });
    }
    if (process.env.VERCEL === '1') return readonlyDatabaseResponse();

    const saved = await writePrismaModel(model);
    return NextResponse.json({ model: serializePrismaModel(saved), store: 'prisma' });
  } catch (error) {
    if (isReadonlyDatabaseError(error)) return readonlyDatabaseResponse();
    console.error('Model update error:', error);
    return serverError();
  }
}

export async function DELETE(request: Request) {
  if (!await requireAdmin()) return forbiddenAdminResponse();

  const id = new URL(request.url).searchParams.get('id')?.trim();
  if (!id) return NextResponse.json({ error: 'Identifiant modèle requis' }, { status: 400 });

  try {
    if (hasExternalCatalogStore()) {
      await deleteCatalogModel(id);
      return NextResponse.json({ ok: true, store: 'external' });
    }
    if (process.env.VERCEL === '1') return readonlyDatabaseResponse();

    await db.catalogModel.delete({ where: { id } });
    return NextResponse.json({ ok: true, store: 'prisma' });
  } catch (error) {
    if (isReadonlyDatabaseError(error)) return readonlyDatabaseResponse();
    console.error('Model delete error:', error);
    return serverError();
  }
}
