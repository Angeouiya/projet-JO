import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequestUser } from '@/lib/auth-http';
import { getStoredProject, saveStoredProject } from '@/lib/project-store';
import type {
  ProjectData,
  ProjectDocumentData,
  ProjectMessageData,
  ProjectQuoteData,
  ProjectScheduleItemData,
  ProjectVisualProposalData,
} from '@/types';

const projectUpdateSchema = z.object({
  project: z.record(z.string(), z.unknown()),
});

function mergeById<T extends { id: string }>(existing: T[] = [], incoming: T[] = []) {
  const merged = new Map(existing.map(item => [item.id, item]));
  incoming.forEach(item => {
    if (!merged.has(item.id)) merged.set(item.id, item);
  });
  return Array.from(merged.values());
}

function mergeClientQuotes(existing: ProjectQuoteData[] = [], incoming: ProjectQuoteData[] = []) {
  return existing.map(quote => {
    const candidate = incoming.find(item => item.id === quote.id);
    if (!candidate || !['accepted', 'refused'].includes(candidate.status)) return quote;
    return {
      ...quote,
      status: candidate.status,
      updatedAt: candidate.updatedAt || new Date().toISOString(),
    };
  });
}

function mergeClientProposals(existing: ProjectVisualProposalData[] = [], incoming: ProjectVisualProposalData[] = []) {
  return existing.map(proposal => {
    const candidate = incoming.find(item => item.id === proposal.id);
    if (!candidate?.validatedAt) return proposal;
    return {
      ...proposal,
      validatedAt: candidate.validatedAt,
      validatedBy: candidate.validatedBy || 'Client',
    };
  });
}

function mergeClientSchedule(existing: ProjectScheduleItemData[] = [], incoming: ProjectScheduleItemData[] = []) {
  return existing.map(item => {
    const candidate = incoming.find(entry => entry.id === item.id);
    if (!candidate || !['confirmed', 'reschedule_requested'].includes(candidate.status)) return item;
    return {
      ...item,
      status: candidate.status,
      clientResponseNote: candidate.clientResponseNote,
      clientRespondedAt: candidate.clientRespondedAt,
      clientRespondedBy: candidate.clientRespondedBy,
      updatedAt: candidate.updatedAt || new Date().toISOString(),
    };
  });
}

function mergeClientProject(existing: ProjectData, incoming: ProjectData, actorName: string) {
  const incomingDocuments = (incoming.documents || []).filter((document): document is ProjectDocumentData => Boolean(document?.id && document?.name));
  const incomingMessages = (incoming.projectMessages || []).filter((message): message is ProjectMessageData => (
    Boolean(message?.id && message?.message) && message.senderRole === 'client'
  ));
  const incomingInfoResponses = incoming.missingInfoResponses || [];
  const quotes = mergeClientQuotes(existing.quotes, incoming.quotes);
  const visualProposals = mergeClientProposals(existing.visualProposals, incoming.visualProposals);
  const scheduleItems = mergeClientSchedule(existing.scheduleItems, incoming.scheduleItems);
  const quoteAccepted = quotes.some((quote, index) => quote.status === 'accepted' && existing.quotes?.[index]?.status !== 'accepted');
  const quoteRefused = quotes.some((quote, index) => quote.status === 'refused' && existing.quotes?.[index]?.status !== 'refused');
  const proposalValidated = visualProposals.some((proposal, index) => proposal.validatedAt && !existing.visualProposals?.[index]?.validatedAt);
  const informationCompleted = existing.status === 'info_required' && incomingInfoResponses.length > (existing.missingInfoResponses?.length || 0);

  let status = existing.status;
  if (informationCompleted) status = 'verifying';
  if (quoteRefused) status = 'modification_requested';
  if (quoteAccepted) status = 'accepted';
  if (proposalValidated && !quoteAccepted && !quoteRefused) status = 'awaiting_validation';

  return {
    ...existing,
    clientName: incoming.clientName || existing.clientName,
    clientEmail: incoming.clientEmail || existing.clientEmail,
    clientPhone: incoming.clientPhone || existing.clientPhone,
    clientResidenceCountry: incoming.clientResidenceCountry || existing.clientResidenceCountry,
    clientTimeZone: incoming.clientTimeZone || existing.clientTimeZone,
    clientPreferredContactChannel: incoming.clientPreferredContactChannel || existing.clientPreferredContactChannel,
    representativeName: incoming.representativeName || existing.representativeName,
    representativePhone: incoming.representativePhone || existing.representativePhone,
    representativeRelation: incoming.representativeRelation || existing.representativeRelation,
    formData: incoming.formData || existing.formData,
    financing: incoming.financing || existing.financing,
    documents: mergeById(existing.documents, incomingDocuments),
    projectMessages: mergeById(existing.projectMessages, incomingMessages),
    missingInfoResponses: mergeById(existing.missingInfoResponses, incomingInfoResponses),
    quotes,
    visualProposals,
    visualProposal: incoming.visualProposal && visualProposals.some(item => item.id === incoming.visualProposal?.id)
      ? incoming.visualProposal
      : existing.visualProposal,
    scheduleItems,
    status,
    progress: informationCompleted ? Math.max(existing.progress || 0, 10) : existing.progress,
    activityLog: mergeById(existing.activityLog, (incoming.activityLog || []).filter(item => item.actor === actorName || item.actor === 'Client')),
    updatedAt: new Date().toISOString(),
  } satisfies ProjectData;
}

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const actor = await getRequestUser();
  if (!actor) return NextResponse.json({ error: 'Session requise' }, { status: 401 });
  const { projectId } = await params;
  const project = await getStoredProject(projectId);
  if (!project) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });

  const actorIsAdmin = actor.type === 'admin' || actor.type === 'employee';
  if (!actorIsAdmin && project.userId !== actor.id) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }
  return NextResponse.json({ project });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const actor = await getRequestUser();
  if (!actor) return NextResponse.json({ error: 'Session requise' }, { status: 401 });
  const { projectId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }
  const parsed = projectUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Projet invalide' }, { status: 400 });

  const existing = await getStoredProject(projectId);
  if (!existing) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });
  const actorIsAdmin = actor.type === 'admin' || actor.type === 'employee';
  if (!actorIsAdmin && existing.userId !== actor.id) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const incoming = parsed.data.project as unknown as ProjectData;
  if (incoming.id !== existing.id || incoming.referenceNumber !== existing.referenceNumber) {
    return NextResponse.json({ error: 'Identité du projet invalide' }, { status: 400 });
  }

  const project = actorIsAdmin
    ? { ...incoming, id: existing.id, referenceNumber: existing.referenceNumber, createdAt: existing.createdAt, updatedAt: new Date().toISOString() }
    : mergeClientProject(existing, incoming, actor.name);
  const saved = await saveStoredProject(project);
  return NextResponse.json({ project: saved });
}

export async function PUT(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const actor = await getRequestUser();
  if (!actor) return NextResponse.json({ error: 'Session requise' }, { status: 401 });
  const actorIsAdmin = actor.type === 'admin' || actor.type === 'employee';
  if (!actorIsAdmin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const { projectId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }
  const parsed = projectUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Projet invalide' }, { status: 400 });
  const incoming = parsed.data.project as unknown as ProjectData;
  if (incoming.id !== projectId || !incoming.referenceNumber || (!incoming.userId && !incoming.clientEmail && !incoming.clientPhone)) {
    return NextResponse.json({ error: 'Identité ou contact du projet invalide' }, { status: 400 });
  }

  const project = await saveStoredProject({
    ...incoming,
    id: projectId,
    updatedAt: new Date().toISOString(),
  });
  return NextResponse.json({ project });
}
