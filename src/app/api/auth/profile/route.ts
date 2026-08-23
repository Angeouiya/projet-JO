import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequestUser } from '@/lib/auth-http';
import { updateAuthProfile } from '@/lib/auth-store';
import { validationError } from '@/lib/api-utils';

const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(32).optional().or(z.literal('')),
  residenceCountry: z.string().trim().max(120).optional().or(z.literal('')),
  timeZone: z.string().trim().max(120).optional().or(z.literal('')),
  preferredContactChannel: z.string().trim().max(40).optional().or(z.literal('')),
  representativeName: z.string().trim().max(120).optional().or(z.literal('')),
  representativePhone: z.string().trim().min(7).max(32).optional().or(z.literal('')),
  representativeRelation: z.string().trim().max(80).optional().or(z.literal('')),
});

export async function PATCH(request: Request) {
  const actor = await getRequestUser();
  if (!actor) return NextResponse.json({ error: 'Session requise' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const user = await updateAuthProfile(actor.id, parsed.data);
    if (!user) return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({
        error: 'Téléphone déjà utilisé',
        message: 'Ce numéro de téléphone est déjà associé à un autre compte.',
      }, { status: 409 });
    }
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Le profil ne peut pas être enregistré actuellement.' }, { status: 500 });
  }
}
