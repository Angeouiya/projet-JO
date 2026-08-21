import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const standing = searchParams.get('standing');
    const city = searchParams.get('city');
    const featured = searchParams.get('featured');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { isPublished: true };
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
      models: models.map(m => ({
        ...m,
        images: JSON.parse(m.images),
        plans: JSON.parse(m.plans),
        equipment: JSON.parse(m.equipment),
        features: JSON.parse(m.features),
        variants: JSON.parse(m.variants),
        categoryName: m.category?.name,
      })),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Models API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
