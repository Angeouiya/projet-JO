import { NextResponse } from "next/server";
import { hasExternalProjectStore, projectStoreName } from '@/lib/project-store';

export async function GET() {
  return NextResponse.json({
    name: 'Buildify API',
    status: 'ok',
    modules: ['projects', 'models', 'auth-password-reset'],
    projectStore: projectStoreName(),
  });
}
