import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { parseJsonField, serverError, validationError } from '@/lib/api-utils';

const modelQuerySchema = z.object({
  category: z.string().trim().min(1).optional(),
  standing: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  featured: z.enum(['true', 'false']).optional(),
  search: z.string().trim().min(1).max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(20),
});

export async function GET(request: Request) {
  const parsed = modelQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return validationError(parsed.error);

  try {
    const { category, standing, featured, search, page, limit } = parsed.data;
    const where: Prisma.CatalogModelWhereInput = { isPublished: true };
    if (category) where.categoryId = category;
    if (standing) where.standing = standing;
    if (featured === 'true') where.isFeatured = true;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [models, total] = await Promise.all([
      db.catalogModel.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.catalogModel.count({ where }),
    ]);

    return NextResponse.json({
      models: models.map(model => ({
        ...model,
        images: parseJsonField<string[]>(model.images, []),
        plans: parseJsonField<string[]>(model.plans, []),
        equipment: parseJsonField<string[]>(model.equipment, []),
        features: parseJsonField<string[]>(model.features, []),
        variants: parseJsonField<Record<string, unknown>[]>(model.variants, []),
        categoryName: model.category?.name,
      })),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Models API error:', error);
    return serverError();
  }
}
