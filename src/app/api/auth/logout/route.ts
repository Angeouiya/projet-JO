import { NextResponse } from 'next/server';
import { clearSessionCookie, readSessionToken } from '@/lib/auth-http';
import { revokeSession } from '@/lib/auth-store';

export async function POST() {
  const token = await readSessionToken();
  try {
    await revokeSession(token);
  } finally {
    await clearSessionCookie();
  }
  return NextResponse.json({ ok: true });
}
