import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resetPassword } from '@/lib/auth-store';
import { validationError } from '@/lib/api-utils';

const resetConfirmSchema = z.object({
  email: z.string().trim().email(),
  token: z.string().trim().min(20),
  password: z.string().min(8).max(128)
    .regex(/[A-Za-zÀ-ÿ]/, 'Ajoutez au moins une lettre.')
    .regex(/\d/, 'Ajoutez au moins un chiffre.'),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const parsed = resetConfirmSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const updated = await resetPassword(parsed.data);
    if (!updated) {
      return NextResponse.json({
        error: 'Lien invalide',
        message: 'Ce lien est invalide, expiré ou déjà utilisé.',
      }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Password reset confirmation error:', error);
    return NextResponse.json({ error: 'Réinitialisation indisponible.' }, { status: 500 });
  }
}
