import { head } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequestUser } from '@/lib/auth-http';
import { getStoredProject, saveStoredProject } from '@/lib/project-store';
import {
  canAccessProjectDocuments,
  hasPrivateDocumentStore,
  PROJECT_DOCUMENT_CONTENT_TYPES,
  PROJECT_DOCUMENT_MAX_SIZE,
  projectDocumentPrefix,
  secureDocumentUrl,
} from '@/lib/project-documents';
import type { ProjectDocumentData } from '@/types';

const attachDocumentSchema = z.object({
  blobUrl: z.string().url(),
  pathname: z.string().trim().min(1).max(500),
  name: z.string().trim().min(1).max(180),
  type: z.enum(['photo', 'document', 'plan', 'contrat', 'facture']).default('document'),
  size: z.coerce.number().int().positive().max(PROJECT_DOCUMENT_MAX_SIZE),
  contentType: z.enum(PROJECT_DOCUMENT_CONTENT_TYPES as [string, ...string[]]),
});

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  if (!hasPrivateDocumentStore()) {
    return NextResponse.json({ error: 'Service non configuré', code: 'SERVICE_NOT_CONFIGURED' }, { status: 503 });
  }
  const actor = await getRequestUser();
  if (!actor) return NextResponse.json({ error: 'Session requise' }, { status: 401 });
  const { projectId } = await params;
  const project = await getStoredProject(projectId);
  if (!project) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });
  if (!canAccessProjectDocuments(actor, project)) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }
  const parsed = attachDocumentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Métadonnées du document invalides' }, { status: 400 });

  try {
    const metadata = await head(parsed.data.blobUrl);
    const prefix = projectDocumentPrefix(project.id);
    if (
      metadata.pathname !== parsed.data.pathname
      || !metadata.pathname.startsWith(prefix)
      || metadata.size !== parsed.data.size
      || metadata.contentType !== parsed.data.contentType
    ) {
      return NextResponse.json({ error: 'Le fichier transféré ne correspond pas au dossier.' }, { status: 400 });
    }

    const existing = (project.documents ?? []).find(document => document.storagePath === metadata.pathname);
    if (existing) return NextResponse.json({ document: existing, project });

    const now = new Date().toISOString();
    const documentId = crypto.randomUUID();
    const document: ProjectDocumentData = {
      id: documentId,
      name: parsed.data.name,
      type: parsed.data.type,
      date: now.slice(0, 10),
      url: secureDocumentUrl(project.id, documentId),
      size: metadata.size,
      storagePath: metadata.pathname,
      contentType: metadata.contentType,
      etag: metadata.etag,
      uploadedAt: metadata.uploadedAt.toISOString(),
      uploadedBy: actor.name,
      uploadedByRole: actor.type === 'admin' || actor.type === 'employee' ? 'admin' : 'client',
    };
    const saved = await saveStoredProject({
      ...project,
      documents: [document, ...(project.documents ?? [])],
      activityLog: [{
        id: crypto.randomUUID(),
        label: `Document sécurisé ajouté : ${document.name}`,
        actor: actor.name,
        type: 'document',
        createdAt: now,
      }, ...(project.activityLog ?? [])],
      updatedAt: now,
    });
    return NextResponse.json({ document, project: saved }, { status: 201 });
  } catch (error) {
    console.error('Document attachment error:', error);
    return NextResponse.json({ error: 'Le document transféré ne peut pas être rattaché.' }, { status: 500 });
  }
}
