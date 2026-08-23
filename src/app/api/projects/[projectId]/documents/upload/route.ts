import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { getRequestUser } from '@/lib/auth-http';
import { getStoredProject } from '@/lib/project-store';
import {
  canAccessProjectDocuments,
  hasPrivateDocumentStore,
  PROJECT_DOCUMENT_CONTENT_TYPES,
  PROJECT_DOCUMENT_MAX_SIZE,
  projectDocumentPrefix,
} from '@/lib/project-documents';

export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  if (!hasPrivateDocumentStore()) {
    return NextResponse.json({
      error: 'Service non configuré',
      code: 'SERVICE_NOT_CONFIGURED',
      message: 'Le stockage privé des documents n’est pas configuré.',
    }, { status: 503 });
  }

  const { projectId } = await params;
  let body: HandleUploadBody;
  try {
    body = await request.json() as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  try {
    const response = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        const actor = await getRequestUser();
        if (!actor) throw new Error('SESSION_REQUIRED');
        const project = await getStoredProject(projectId);
        if (!project) throw new Error('PROJECT_NOT_FOUND');
        if (!canAccessProjectDocuments(actor, project)) throw new Error('ACCESS_DENIED');

        const prefix = projectDocumentPrefix(project.id);
        if (!pathname.startsWith(prefix) || pathname.includes('..')) throw new Error('INVALID_PATHNAME');
        return {
          allowedContentTypes: PROJECT_DOCUMENT_CONTENT_TYPES,
          maximumSizeInBytes: PROJECT_DOCUMENT_MAX_SIZE,
          addRandomSuffix: true,
          allowOverwrite: false,
          cacheControlMaxAge: 60 * 60,
          tokenPayload: JSON.stringify({ projectId: project.id, actorId: actor.id }),
        };
      },
    });
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('SESSION_REQUIRED')) return NextResponse.json({ error: 'Session requise' }, { status: 401 });
    if (message.includes('PROJECT_NOT_FOUND')) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });
    if (message.includes('ACCESS_DENIED')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    if (message.includes('INVALID_PATHNAME')) return NextResponse.json({ error: 'Chemin de document invalide' }, { status: 400 });
    console.error('Document upload token error:', error);
    return NextResponse.json({ error: 'Le document ne peut pas être transféré.' }, { status: 400 });
  }
}
