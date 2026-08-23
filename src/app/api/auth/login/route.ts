import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateUser } from '@/lib/auth-store';
import { setSessionCookie } from '@/lib/auth-http';
import { validationError } from '@/lib/api-utils';

const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(160),
  password: z.string().min(1).max(128),
  platform: z.enum(['client', 'admin']),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const result = await authenticateUser(parsed.data);
    if (!result.ok) {
      const status = result.code === 'ACCOUNT_LOCKED' ? 423
        : result.code === 'SERVICE_NOT_CONFIGURED' ? 503
          : result.code === 'ACCESS_DENIED' ? 403
            : 401;
      return NextResponse.json({ error: result.code, message: result.message }, { status });
    }

    await setSessionCookie(result.token, result.expiresAt);
    return NextResponse.json({ user: result.user });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Connexion indisponible.' }, { status: 500 });
  }
}

