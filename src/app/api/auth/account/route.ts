import { NextResponse } from 'next/server';
import { z } from 'zod';
import { clearSessionCookie, getRequestUser } from '@/lib/auth-http';
import { deleteClientAccount } from '@/lib/auth-store';
import { validationError } from '@/lib/api-utils';

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(128),
  confirmation: z.literal('SUPPRIMER'),
});

export async function DELETE(request: Request) {
  const actor = await getRequestUser();
  if (!actor) return NextResponse.json({ error: 'Session requise' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const parsed = deleteAccountSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const result = await deleteClientAccount(actor.id, parsed.data.password);
    if (!result.ok) {
      const status = result.code === 'ACCOUNT_NOT_FOUND' ? 404 : 403;
      return NextResponse.json({ error: result.message, code: result.code }, { status });
    }

    await clearSessionCookie();
    return NextResponse.json({ ok: true, deletedProjects: result.deletedProjects });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: 'La suppression du compte a échoué.' }, { status: 500 });
  }
}
