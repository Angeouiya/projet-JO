import { NextResponse } from 'next/server';
import { z } from 'zod';
import { registerClient } from '@/lib/auth-store';
import { setSessionCookie } from '@/lib/auth-http';
import { validationError } from '@/lib/api-utils';

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().optional().or(z.literal('')),
  phone: z.string().trim().min(7).max(32).optional().or(z.literal('')),
  password: z.string().min(8).max(128)
    .regex(/[A-Za-zÀ-ÿ]/, 'Ajoutez au moins une lettre.')
    .regex(/\d/, 'Ajoutez au moins un chiffre.'),
}).refine(data => Boolean(data.email || data.phone), {
  message: 'Ajoutez au moins un e-mail ou un téléphone.',
  path: ['email'],
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const result = await registerClient(parsed.data);
    await setSessionCookie(result.token, result.expiresAt);
    return NextResponse.json({ user: result.user }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({
        error: 'Compte existant',
        message: 'Un compte utilise déjà cet e-mail ou ce numéro de téléphone.',
      }, { status: 409 });
    }
    if (message.includes('AUTH_STORE_NOT_CONFIGURED')) {
      return NextResponse.json({
        error: 'Service non configuré',
        code: 'SERVICE_NOT_CONFIGURED',
        message: "Le service d'authentification sécurisé n'est pas configuré.",
      }, { status: 503 });
    }
    console.error('Registration error:', error);
    return NextResponse.json({ error: "L'inscription n'a pas pu être finalisée." }, { status: 500 });
  }
}
