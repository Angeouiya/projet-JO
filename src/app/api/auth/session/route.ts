import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth-http';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getRequestUser();
    if (!user) return NextResponse.json({ user: null });
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null }, { status: 503 });
  }
}
