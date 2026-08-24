import { NextResponse } from "next/server";
import { PLATFORM_RELEASE } from '@/data/platform-release';
import { projectStoreName } from '@/lib/project-store';

export async function GET() {
  return NextResponse.json({
    name: 'Buildify API',
    status: 'ok',
    release: PLATFORM_RELEASE,
    modules: ['projects', 'models', 'team', 'auth-password-reset', 'pwa-refresh'],
    projectStore: projectStoreName(),
  });
}
