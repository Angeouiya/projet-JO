import { del, get } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth-http';
import { getStoredProject, saveStoredProject } from '@/lib/project-store';
import {
  canAccessProjectDocuments,
  contentDisposition,
  hasPrivateDocumentStore,
} from '@/lib/project-documents';

type DocumentRouteParams = { params: Promise<{ projectId: string; documentId: string }> };

async function resolveDocument(params: DocumentRouteParams['params']) {
  const actor = await getRequestUser();
  if (!actor) return { error: NextResponse.json({ error: 'Session requise' }, { status: 401 }) };
  const { projectId, documentId } = await params;
  const project = await getStoredProject(projectId);
  if (!project) return { error: NextResponse.json({ error: 'Projet introuvable' }, { status: 404 }) };
  if (!canAccessProjectDocuments(actor, project)) {
    return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) };
  }
  const document = (project.documents ?? []).find(item => item.id === documentId);
  if (!document) return { error: NextResponse.json({ error: 'Document introuvable' }, { status: 404 }) };
  return { actor, project, document };
}

export async function GET(request: Request, { params }: DocumentRouteParams) {
  if (!hasPrivateDocumentStore()) return NextResponse.json({ error: 'Service non configuré' }, { status: 503 });
  const resolved = await resolveDocument(params);
  if ('error' in resolved) return resolved.error;
  if (!resolved.document.storagePath) {
    return NextResponse.json({ error: 'Le fichier original historique n’est plus disponible.' }, { status: 410 });
  }

  const result = await get(resolved.document.storagePath, {
    access: 'private',
    ifNoneMatch: request.headers.get('if-none-match') || undefined,
  });
  if (!result) return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 });
  if (result.statusCode === 304) return new NextResponse(null, { status: 304, headers: { ETag: result.blob.etag } });

  const download = new URL(request.url).searchParams.get('download') === '1';
  return new NextResponse(result.stream, {
    headers: {
      'Content-Type': result.blob.contentType || resolved.document.contentType || 'application/octet-stream',
      'Content-Length': String(result.blob.size),
      'Content-Disposition': contentDisposition(resolved.document.name, download),
      'Cache-Control': 'private, max-age=0, must-revalidate',
      ETag: result.blob.etag,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export async function DELETE(_request: Request, { params }: DocumentRouteParams) {
  if (!hasPrivateDocumentStore()) return NextResponse.json({ error: 'Service non configuré' }, { status: 503 });
  const resolved = await resolveDocument(params);
  if ('error' in resolved) return resolved.error;
  const actorIsAdmin = resolved.actor.type === 'admin' || resolved.actor.type === 'employee';
  if (!actorIsAdmin && resolved.document.uploadedByRole !== 'client') {
    return NextResponse.json({ error: 'Seule l’administration peut retirer ce document.' }, { status: 403 });
  }

  if (resolved.document.storagePath) await del(resolved.document.storagePath);
  const now = new Date().toISOString();
  const saved = await saveStoredProject({
    ...resolved.project,
    documents: (resolved.project.documents ?? []).filter(item => item.id !== resolved.document.id),
    activityLog: [{
      id: crypto.randomUUID(),
      label: `Document retiré : ${resolved.document.name}`,
      actor: resolved.actor.name,
      type: 'document',
      createdAt: now,
    }, ...(resolved.project.activityLog ?? [])],
    updatedAt: now,
  });
  return NextResponse.json({ ok: true, project: saved });
}
