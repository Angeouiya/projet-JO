import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { normalizeEmail, normalizeText, parseJsonField, serverError, validationError } from '@/lib/api-utils';

const projectQuerySchema = z.object({
  userId: z.string().trim().min(1).optional(),
  status: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const projectCreateSchema = z.object({
  userId: z.string().trim().min(1).optional(),
  categoryId: z.string().trim().min(1).optional(),
  categorySlug: z.string().trim().min(1).optional(),
  modelId: z.string().trim().min(1).optional(),
  title: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(2000).optional(),
  budgetMin: z.coerce.number().nonnegative().optional(),
  budgetMax: z.coerce.number().nonnegative().optional(),
  clientName: z.string().trim().min(2).max(120).optional(),
  clientEmail: z.string().trim().email().optional(),
  clientPhone: z.string().trim().min(6).max(32).optional(),
  city: z.string().trim().min(1).max(120).optional(),
  referenceNumber: z.string().trim().min(4).max(40).optional(),
  formData: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

function projectReference() {
  return `PRJ-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function projectContactError() {
  return NextResponse.json(
    {
      error: 'Contact client requis',
      details: [
        {
          field: 'clientEmail',
          message: 'Ajoutez au moins un e-mail, un téléphone ou un userId avant de créer le dossier.',
        },
      ],
    },
    { status: 400 }
  );
}

function isPrismaKnownError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return typeof error === 'object' && error !== null && 'code' in error;
}

export async function GET(request: Request) {
  const parsed = projectQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return validationError(parsed.error);

  try {
    const { userId, status, page, limit } = parsed.data;
    const where: Prisma.ProjectWhereInput = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        include: { category: true, model: true },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.project.count({ where }),
    ]);

    return NextResponse.json({
      projects: projects.map(project => ({
        ...project,
        formData: parseJsonField<Record<string, unknown>>(project.formData, {}),
        missingInfo: parseJsonField<string[]>(project.missingInfo, []),
        categoryName: project.category?.name,
        modelName: project.model?.name,
      })),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Projects API error:', error);
    return serverError();
  }
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const parsed = projectCreateSchema.safeParse(json);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const body = parsed.data;
    const incomingFormData = body.formData && typeof body.formData === 'object' ? body.formData : {};
    const clientEmail = normalizeEmail(body.clientEmail);
    const clientPhone = normalizeText(body.clientPhone);
    const userId = normalizeText(body.userId);

    if (!userId && !clientEmail && !clientPhone) return projectContactError();

    const city = normalizeText(body.city) || normalizeText(String(incomingFormData.city ?? ''));
    const refNumber = body.referenceNumber || String(incomingFormData.referenceNumber ?? '') || projectReference();
    const clientName = normalizeText(body.clientName) || 'Client Buildify';

    const result = await db.$transaction(async tx => {
      const user = userId
        ? await tx.user.upsert({
            where: { id: userId },
            update: {
              name: clientName,
              email: clientEmail,
              phone: clientPhone,
            },
            create: {
              id: userId,
              name: clientName,
              email: clientEmail ?? null,
              phone: clientPhone ?? null,
              type: 'client',
              role: 'client',
              emailVerified: Boolean(clientEmail),
              phoneVerified: Boolean(clientPhone),
            },
          })
        : clientEmail
          ? await tx.user.upsert({
              where: { email: clientEmail },
              update: { name: clientName, phone: clientPhone },
              create: {
                name: clientName,
                email: clientEmail,
                phone: clientPhone ?? null,
                type: 'client',
                role: 'client',
                emailVerified: true,
                phoneVerified: Boolean(clientPhone),
              },
            })
          : await tx.user.upsert({
              where: { phone: clientPhone },
              update: { name: clientName },
              create: {
                name: clientName,
                email: null,
                phone: clientPhone,
                type: 'client',
                role: 'client',
                emailVerified: false,
                phoneVerified: true,
              },
            });

      let resolvedCategoryId = body.categoryId || null;
      if (!resolvedCategoryId && body.categorySlug) {
        const category = await tx.projectCategory.findUnique({ where: { slug: body.categorySlug } });
        resolvedCategoryId = category?.id || null;
      }

      return tx.project.create({
        data: {
          referenceNumber: refNumber,
          userId: user.id,
          categoryId: resolvedCategoryId,
          modelId: body.modelId || null,
          title: body.title || null,
          description: body.description || null,
          formData: JSON.stringify(incomingFormData),
          status: 'submitted',
          city,
          budgetMin: body.budgetMin ?? null,
          budgetMax: body.budgetMax ?? null,
          country: "Côte d'Ivoire",
        },
      });
    });

    return NextResponse.json({ project: result }, { status: 201 });
  } catch (error) {
    console.error('Project create error:', error);
    if (isPrismaKnownError(error) && error.code === 'P2002') {
      return NextResponse.json({ error: 'Un dossier avec cette référence existe déjà.' }, { status: 409 });
    }
    return serverError();
  }
}
