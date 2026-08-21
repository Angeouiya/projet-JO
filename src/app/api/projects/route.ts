import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const projects = await db.project.findMany({
      where,
      include: { category: true, model: true },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      projects: projects.map(p => ({
        ...p,
        formData: JSON.parse(p.formData),
        missingInfo: JSON.parse(p.missingInfo),
        categoryName: p.category?.name,
        modelName: p.model?.name,
      })),
    });
  } catch (error) {
    console.error('Projects API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, categoryId, modelId, formData, title, description, city, budgetMin, budgetMax } = body;

    const refNumber = `PRJ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    const project = await db.project.create({
      data: {
        referenceNumber: refNumber,
        userId,
        categoryId: categoryId || null,
        modelId: modelId || null,
        title: title || null,
        description: description || null,
        formData: JSON.stringify(formData || {}),
        status: 'submitted',
        city: city || null,
        budgetMin: budgetMin || null,
        budgetMax: budgetMax || null,
        country: "Côte d'Ivoire",
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Project create error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
