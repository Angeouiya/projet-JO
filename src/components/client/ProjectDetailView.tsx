'use client';

import NextImage from 'next/image';
import { useMemo, useState, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MapPin, Calendar, Wallet, Layers, Users,
  DraftingCompass, Upload, Image as ImageIcon, FileCheck, Receipt,
  Send, MessageSquare, Check, X, Clock, Camera,
  ClipboardCheck, AlertCircle, Building2, Eye, Download,
  ShieldCheck, CheckCircle2, FolderArchive, ClipboardList, Home,
  Globe2, Clock3, MessageCircle, UserRoundCheck, Gauge,
  Ruler, Calculator, Scale, PiggyBank, Route,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/stores/app-store';
import { PROJECT_STATUS_LABELS, FORMAT_XOF } from '@/types';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { formatProjectLocation } from '@/lib/project-format';
import { buildProjectBrief, projectBriefLabel } from '@/lib/project-brief';
import { buildFinancingDecisionPlan } from '@/lib/financing-decision';
import { buildProjectDecisionCenter } from '@/lib/project-decision-center';
import type { ProjectDecisionTone } from '@/lib/project-decision-center';
import type { ProjectBrief, ProjectBriefItemKey } from '@/lib/project-brief';
import {
  formatProjectScheduleDate,
  projectScheduleModeLabel,
  projectScheduleStatusLabel,
  projectScheduleTypeLabel,
  sortProjectSchedule,
} from '@/lib/project-schedule';
import { DEPARTMENT_LABELS, ROLE_LABELS } from '@/data/team';
import type {
  ProjectData,
  ProjectDocumentData,
  ProjectFinancingData,
  ProjectPaymentMilestoneData,
  ProjectQuoteData,
  ProjectScheduleItemData,
  ProjectSiteUpdateData,
  TeamMemberData,
  ProjectVisualProposalData,
} from '@/types';

// ── Types dossier client ───────────────────────────────────

type ProjectDetailData = {
  referenceNumber: string;
  title: string;
  status: string;
  categoryName: string;
  modelName: string;
  city: string;
  budgetMin: number;
  budgetMax: number;
  progress: number;
  projectId?: string;
  terrain: string;
  terrainStatus: string;
  startDate: string;
  estimatedEnd: string;
  team: {
    name: string;
    role: string;
    department?: string;
    photoUrl?: string;
    email?: string;
    phone?: string;
    bio?: string;
  }[];
  documents: { id?: string; type: string; name: string; date: string; icon: LucideIcon; url?: string; size?: number }[];
  messages: { id: string; sender: string; senderRole: string; text: string; time: string; isOwn: boolean }[];
  infoResponses?: ProjectData['missingInfoResponses'];
  quotes: ProjectQuoteViewData[];
  visualProposals?: ProjectVisualProposalData[];
  visualProposal?: ProjectVisualProposalData;
  financing?: ProjectFinancingData;
  technicalBrief: ProjectBrief;
  scheduleItems: ProjectScheduleItemData[];
  clientPresence?: string;
  clientResidenceCountry?: string;
  clientTimeZone?: string;
  clientPreferredContactChannel?: string;
  clientContactWindow?: string;
  remoteDecisionMode?: string;
  representativeName?: string;
  representativePhone?: string;
  representativeRelation?: string;
  phases: { name: string; status: 'done' | 'in_progress' | 'pending'; progress: number }[];
  siteUpdates: ProjectSiteUpdateData[];
  photos: { id: string; caption: string; date: string; imageUrl: string; phase: string; report?: string; progress: number }[];
};

type VisualProposal = Omit<ProjectVisualProposalData, 'validatedAt' | 'validatedBy' | 'strengths'> & {
  strengths: string[];
};

type ProjectQuoteViewData = Omit<ProjectQuoteData, 'status'> & {
  status: 'pending' | 'accepted' | 'refused';
};

// ── Helper ─────────────────────────────────────────────────

function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'in_progress' || status === 'accepted') return 'default';
  if (status === 'proposal_validated') return 'outline';
  if (status === 'draft') return 'secondary';
  if (status === 'delivered') return 'outline';
  return 'secondary';
}

function getQuoteStatusBadge(status: string) {
  if (status === 'accepted') return { label: 'Accepté', variant: 'outline' as const };
  if (status === 'refused') return { label: 'Refusé', variant: 'destructive' as const };
  return { label: 'En attente', variant: 'secondary' as const };
}

const CLIENT_PRESENCE_LABELS: Record<string, string> = {
  local: 'Client sur place',
  abroad: 'Client hors du pays',
  'abroad-representative': 'Hors pays avec mandataire',
  'representative-only': 'Mandataire uniquement',
  'to-confirm': 'À organiser',
};

const TIME_ZONE_LABELS: Record<string, string> = {
  'Africa/Abidjan': 'Côte d’Ivoire / GMT',
  'Europe/Paris': 'France / Europe centrale',
  'Europe/Brussels': 'Belgique',
  'Europe/London': 'Royaume-Uni',
  'America/Toronto': 'Canada Est',
  'America/New_York': 'États-Unis Est',
  'America/Chicago': 'États-Unis Centre',
  'America/Los_Angeles': 'États-Unis Ouest',
  'Africa/Dakar': 'Sénégal / GMT',
  'Africa/Ouagadougou': 'Burkina Faso / GMT',
};

const CONTACT_CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  phone: 'Appel téléphonique',
  video: 'Visio',
};

const CONTACT_WINDOW_LABELS: Record<string, string> = {
  'morning-ci': 'Matin heure Côte d’Ivoire',
  'afternoon-ci': 'Après-midi heure Côte d’Ivoire',
  'evening-ci': 'Soir heure Côte d’Ivoire',
  weekend: 'Week-end uniquement',
  'to-plan': 'À planifier selon disponibilité',
};

const REMOTE_DECISION_LABELS: Record<string, string> = {
  'written-approval': 'Validation écrite avant action',
  'video-review': 'Réunion visio avant décision',
  'representative-approval': 'Mandataire autorisé à valider sur place',
  mixed: 'Validation mixte client + mandataire',
};

const REPRESENTATIVE_RELATION_LABELS: Record<string, string> = {
  family: 'Famille',
  'trusted-person': 'Personne de confiance',
  company: 'Entreprise / associé',
  none: 'Aucun mandataire',
};

function textValue(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

function projectText(project: ProjectData, key: string): string | undefined {
  return textValue((project as unknown as Record<string, unknown>)[key]) || textValue(project.formData?.[key]);
}

function labelFromMap(labels: Record<string, string>, value?: string): string | undefined {
  if (!value) return undefined;
  return labels[value] || value;
}

function publicActorLabel(value?: string) {
  if (!value) return 'Équipe Buildify';
  return /admin|administration/i.test(value) ? 'Équipe Buildify' : value;
}

function getDocumentIcon(type: string, name = ''): LucideIcon {
  const normalized = `${type} ${name}`.toLowerCase();
  if (normalized.includes('photo') || normalized.includes('image')) return ImageIcon;
  if (normalized.includes('facture')) return Receipt;
  if (normalized.includes('contrat')) return FileCheck;
  if (normalized.includes('rapport')) return ClipboardList;
  if (normalized.includes('villa')) return Home;
  if (normalized.includes('étage') || normalized.includes('etage')) return Layers;
  if (normalized.includes('plan')) return DraftingCompass;
  return FolderArchive;
}

function detailFromStoredProject(project: ProjectData, teamMembers: TeamMemberData[] = []): ProjectDetailData {
  const startDate = project.createdAt?.slice(0, 10) || 'Non défini';
  const siteUpdates = project.siteUpdates ?? [];
  const scheduleItems = sortProjectSchedule(project.scheduleItems ?? []);
  const latestSiteUpdate = siteUpdates[0];
  const assignedMember = teamMembers.find(member => member.active && member.name === project.assignedTo);
  const projectMessages = (project.projectMessages ?? []).slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const technicalBrief = buildProjectBrief(project);
  const missingInfoDate = project.missingInfoRequestedAt
    ? new Date(project.missingInfoRequestedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : 'Maintenant';
  const surfaceSummary = technicalBrief.items.find(item => item.key === 'surface');

  return {
    projectId: project.id,
    referenceNumber: project.referenceNumber,
    title: project.title || project.modelName || 'Projet BTP',
    status: project.status,
    categoryName: project.categoryName || 'Projet BTP',
    modelName: project.modelName || project.categoryName || 'À définir',
    city: formatProjectLocation(project, 'Non défini'),
    budgetMin: project.budgetMin || project.budgetMax || 0,
    budgetMax: project.budgetMax || project.budgetMin || 0,
    progress: project.progress ?? 0,
    terrain: surfaceSummary?.value || 'À préciser',
    terrainStatus: projectBriefLabel(project.formData?.terrainStatus || project.formData?.landStatus) || 'À confirmer',
    startDate,
    estimatedEnd: projectBriefLabel(project.formData?.timeline) || 'À planifier',
    team: assignedMember
      ? [{
          name: assignedMember.name,
          role: ROLE_LABELS[assignedMember.role] || assignedMember.role,
          department: DEPARTMENT_LABELS[assignedMember.department] || assignedMember.department,
          photoUrl: assignedMember.photoUrl,
          email: assignedMember.email,
          phone: assignedMember.phone,
          bio: assignedMember.bio,
        }]
      : project.assignedTo
        ? [{ name: project.assignedTo, role: 'Responsable dossier' }]
        : [],
    documents: (project.documents ?? []).map(document => ({
      id: document.id,
      type: document.type,
      name: document.name,
      date: document.date,
      url: document.url,
      size: document.size,
      icon: getDocumentIcon(document.type, document.name),
    })),
    messages: [
      ...(project.missingInfo ? [
        {
          id: `info-${project.id}`,
          sender: 'Équipe Buildify',
          senderRole: 'Chargé de dossier',
          text: project.missingInfo,
          time: missingInfoDate,
          isOwn: false,
        },
      ] : []),
      ...(project.missingInfoResponses ?? []).slice().reverse().map(response => ({
        id: response.id,
        sender: 'Vous',
        senderRole: 'Client',
        text: response.message,
        time: new Date(response.respondedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
      })),
      ...projectMessages.map(message => ({
        id: message.id,
        sender: message.senderName,
        senderRole: message.senderRole === 'admin' ? 'Équipe Buildify' : 'Client',
        text: message.message,
        time: new Date(message.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        isOwn: message.senderRole === 'client',
      })),
    ],
    infoResponses: project.missingInfoResponses ?? [],
    quotes: (project.quotes ?? []).map(quote => ({
      ...quote,
      status: quote.status === 'accepted' || quote.status === 'refused' ? quote.status : 'pending',
    })),
    visualProposals: project.visualProposals ?? [],
    visualProposal: project.visualProposal,
    financing: project.financing || (project.formData?.financing as ProjectFinancingData | undefined),
    technicalBrief,
    scheduleItems,
    clientPresence: labelFromMap(CLIENT_PRESENCE_LABELS, projectText(project, 'clientPresence')),
    clientResidenceCountry: projectText(project, 'clientResidenceCountry'),
    clientTimeZone: labelFromMap(TIME_ZONE_LABELS, projectText(project, 'clientTimeZone')),
    clientPreferredContactChannel: labelFromMap(CONTACT_CHANNEL_LABELS, projectText(project, 'clientPreferredContactChannel')),
    clientContactWindow: labelFromMap(CONTACT_WINDOW_LABELS, projectText(project, 'clientContactWindow')),
    remoteDecisionMode: labelFromMap(REMOTE_DECISION_LABELS, projectText(project, 'remoteDecisionMode')),
    representativeName: projectText(project, 'representativeName'),
    representativePhone: projectText(project, 'representativePhone'),
    representativeRelation: labelFromMap(REPRESENTATIVE_RELATION_LABELS, projectText(project, 'representativeRelation')),
    phases: [
      { name: 'Demande reçue', status: 'done', progress: 100 },
      { name: 'Vérification', status: project.status === 'submitted' ? 'in_progress' : 'done', progress: project.status === 'submitted' ? 40 : 100 },
      { name: 'Étude & devis', status: ['proposal_validated', 'quote_sent', 'accepted', 'planning', 'in_progress', 'delivered'].includes(project.status) ? 'done' : 'pending', progress: ['proposal_validated', 'quote_sent', 'accepted', 'planning', 'in_progress', 'delivered'].includes(project.status) ? 100 : 0 },
      { name: 'Planification', status: project.status === 'planning' ? 'in_progress' : ['in_progress', 'delivered'].includes(project.status) ? 'done' : 'pending', progress: project.status === 'planning' ? 50 : ['in_progress', 'delivered'].includes(project.status) ? 100 : 0 },
      { name: 'Chantier', status: project.status === 'in_progress' ? 'in_progress' : project.status === 'delivered' ? 'done' : 'pending', progress: latestSiteUpdate ? Math.max(project.progress, latestSiteUpdate.progress) : project.status === 'in_progress' ? Math.max(project.progress, 25) : project.status === 'delivered' ? 100 : 0 },
      { name: 'Livraison', status: project.status === 'delivered' ? 'done' : 'pending', progress: project.status === 'delivered' ? 100 : 0 },
    ],
    siteUpdates,
    photos: siteUpdates.map(update => ({
      id: update.id,
      caption: update.caption,
      date: new Date(update.createdAt).toLocaleDateString('fr-FR'),
      imageUrl: update.imageUrl || '/images/chantier-1.png',
      phase: update.phase,
      report: update.report,
      progress: update.progress,
    })),
  };
}

const PROPOSAL_STORAGE_PREFIX = 'buildify-validated-proposal';

function getProposalStorageKey(referenceNumber: string) {
  return `${PROPOSAL_STORAGE_PREFIX}:${referenceNumber}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function proposalDecisionCriteria(proposal: VisualProposal, data: ProjectDetailData) {
  return proposal.decisionCriteria ?? [
    { label: 'Budget à cadrer', value: proposal.estimate },
    { label: 'Délai cible', value: proposal.duration },
    { label: 'Usage principal', value: data.categoryName },
    { label: 'Niveau de décision', value: proposal.confidence },
  ];
}

function proposalTechnicalScope(proposal: VisualProposal, data: ProjectDetailData) {
  return proposal.technicalScope ?? [
    `Ouvrage : ${data.categoryName}`,
    `Localisation : ${data.city}`,
    `Base livrable : ${proposal.deliverable}`,
    'Chiffrage final après validation des surfaces, documents et hypothèses techniques.',
  ];
}

function proposalRiskControls(proposal: VisualProposal, data: ProjectDetailData) {
  return proposal.riskControls ?? [
    data.terrainStatus || 'Situation terrain à confirmer',
    'Contrôle des surfaces et des limites de prestation avant devis définitif',
    'Validation des documents disponibles avant engagement contractuel',
  ];
}

function proposalNextSteps(proposal: VisualProposal) {
  return proposal.nextSteps ?? [
    'Confirmer cette proposition comme base de travail',
    'Compléter les documents et informations financières manquantes',
    'Recevoir le chiffrage détaillé, puis arbitrer devis, contrat et planning',
  ];
}

function proposalClientCommitment(proposal: VisualProposal, data: ProjectDetailData) {
  return proposal.clientCommitment
    ?? `La validation retient "${proposal.title}" comme orientation visuelle et technique du dossier ${data.referenceNumber}. Elle ne remplace pas le devis définitif, le contrat, les études réglementaires ni les validations terrain.`;
}

function buildStoredVisualProposal(
  proposal: VisualProposal,
  data: ProjectDetailData
): Omit<ProjectVisualProposalData, 'validatedAt' | 'validatedBy'> {
  return {
    ...proposal,
    decisionCriteria: proposalDecisionCriteria(proposal, data),
    technicalScope: proposalTechnicalScope(proposal, data),
    riskControls: proposalRiskControls(proposal, data),
    nextSteps: proposalNextSteps(proposal),
    clientCommitment: proposalClientCommitment(proposal, data),
  };
}

function normalizeVisualProposal(proposal: ProjectVisualProposalData): VisualProposal {
  return {
    ...proposal,
    strengths: proposal.strengths?.length ? proposal.strengths : ['Proposition publiée', 'Image consultable', 'Décision cadrée'],
  };
}

function renderList(items: string[]) {
  return items.map(item => `<li>${escapeHtml(item)}</li>`).join('');
}

function renderCriteria(criteria: { label: string; value: string }[]) {
  return criteria
    .map(item => `
      <div class="box">
        <div class="label">${escapeHtml(item.label)}</div>
        <div class="value">${escapeHtml(item.value)}</div>
      </div>
    `)
    .join('');
}

function buildProposalHtml(proposal: VisualProposal, data: ProjectDetailData) {
  const imageUrl = new URL(proposal.image, window.location.origin).href;
  const criteria = proposalDecisionCriteria(proposal, data);
  const scope = proposalTechnicalScope(proposal, data);
  const risks = proposalRiskControls(proposal, data);
  const nextSteps = proposalNextSteps(proposal);
  const commitment = proposalClientCommitment(proposal, data);
  const decisionScore = proposalDecisionScore(proposal, data);
  const decisionLabel = proposalDecisionLabel(decisionScore);

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(proposal.title)} - ${escapeHtml(data.referenceNumber)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; color: #111; background: #fff; }
    .sheet { max-width: 920px; margin: 0 auto; padding: 40px; }
    .top { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #111; padding-bottom: 18px; }
    .brand { font-size: 24px; font-weight: 800; }
    .ref { text-align: right; font-size: 12px; line-height: 1.6; color: #555; }
    h1 { margin: 28px 0 12px; font-size: 32px; line-height: 1.15; }
    .hero { display: grid; grid-template-columns: 1.15fr .85fr; gap: 16px; align-items: stretch; margin: 22px 0; }
    .meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 24px 0; }
    .box { border: 1px solid #ddd; border-radius: 8px; padding: 14px; }
    .score { border: 2px solid #111; border-radius: 10px; padding: 18px; }
    .score-number { font-size: 44px; line-height: 1; font-weight: 900; letter-spacing: 0; }
    .label { font-size: 10px; text-transform: uppercase; color: #666; letter-spacing: .08em; font-weight: 700; }
    .value { margin-top: 8px; font-size: 14px; font-weight: 700; }
    img { width: 100%; border-radius: 10px; margin: 20px 0; }
    p { line-height: 1.65; color: #333; }
    ul { margin: 10px 0 0; padding-left: 20px; line-height: 1.7; }
    .split { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
    .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    @media (max-width: 720px) { .sheet { padding: 22px; } .top, .split, .hero { display: block; } .ref { margin-top: 12px; text-align: left; } .meta { grid-template-columns: 1fr; } }
    @media print { .sheet { padding: 24px; } }
  </style>
</head>
<body>
  <main class="sheet">
    <div class="top">
      <div>
        <div class="brand">Buildify</div>
        <div>Fiche de proposition visuelle</div>
      </div>
      <div class="ref">
        <div>Dossier ${escapeHtml(data.referenceNumber)}</div>
        <div>${escapeHtml(data.title)}</div>
        <div>${escapeHtml(data.city)}</div>
      </div>
    </div>
    <h1>${escapeHtml(proposal.title)}</h1>
    <p>${escapeHtml(proposal.description)}</p>
    <section class="hero">
      <div class="score">
        <div class="label">Lecture décisionnelle Buildify</div>
        <div class="score-number">${decisionScore}%</div>
        <div class="value">${escapeHtml(decisionLabel)}</div>
        <p>Score interne calculé à partir de la clarté du budget, du délai, du périmètre, des vigilances et des points forts. Il sert à décider quoi cadrer avant devis.</p>
      </div>
      <div class="box">
        <div class="label">Synthèse client</div>
        <div class="value">${escapeHtml(proposal.estimate)} · ${escapeHtml(proposal.duration)}</div>
        <p>${escapeHtml(proposal.confidence)}</p>
      </div>
    </section>
    <img src="${imageUrl}" alt="${escapeHtml(proposal.title)}" />
    <section class="meta">
      ${renderCriteria(criteria)}
    </section>
    <section class="box">
      <div class="label">Livrable client</div>
      <div class="value">${escapeHtml(proposal.deliverable)}</div>
    </section>
    <div class="split">
      <section class="box"><div class="label">Périmètre technique</div><ul>${renderList(scope)}</ul></section>
      <section class="box"><div class="label">Points de vigilance</div><ul>${renderList(risks)}</ul></section>
    </div>
    <div class="split">
      <section class="box"><div class="label">Points forts</div><ul>${renderList(proposal.strengths)}</ul></section>
      <section class="box"><div class="label">Étapes suivantes</div><ul>${renderList(nextSteps)}</ul></section>
    </div>
    <section class="box" style="margin-top: 12px;"><div class="label">Ce que la validation signifie</div><p>${escapeHtml(commitment)}</p></section>
    <div class="footer">
      Cette fiche aide le client à comparer, télécharger et valider une proposition visuelle avant chiffrage, contrat et planning.
    </div>
  </main>
</body>
</html>`;
}

function buildProposalPortfolioHtml(proposals: VisualProposal[], selectedProposal: VisualProposal, data: ProjectDetailData) {
  const rows = proposals.map(proposal => `
    <tr>
      <td>${escapeHtml(proposal.title)}${proposal.id === selectedProposal.id ? ' <strong>(sélection consultée)</strong>' : ''}</td>
      <td>${escapeHtml(proposal.category)}</td>
      <td>${escapeHtml(proposal.estimate)}</td>
      <td>${escapeHtml(proposal.duration)}</td>
      <td>${proposalDecisionScore(proposal, data)}% · ${escapeHtml(proposalDecisionLabel(proposalDecisionScore(proposal, data)))}</td>
      <td>${escapeHtml(proposal.confidence)}</td>
    </tr>
  `).join('');

  const proposalBlocks = proposals.map(proposal => {
    const imageUrl = new URL(proposal.image, window.location.origin).href;
    return `
      <section class="proposal">
        <img src="${imageUrl}" alt="${escapeHtml(proposal.title)}" />
        <div>
          <h2>${escapeHtml(proposal.title)}</h2>
          <p><strong>Lecture Buildify :</strong> ${proposalDecisionScore(proposal, data)}% · ${escapeHtml(proposalDecisionLabel(proposalDecisionScore(proposal, data)))}</p>
          <p>${escapeHtml(proposal.description)}</p>
          <ul>${renderList(proposal.strengths)}</ul>
        </div>
      </section>
    `;
  }).join('');

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Dossier comparatif - ${escapeHtml(data.referenceNumber)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111; margin: 0; background: #fff; }
    main { max-width: 1040px; margin: 0 auto; padding: 40px; }
    header { border-bottom: 2px solid #111; padding-bottom: 18px; }
    .brand { font-size: 24px; font-weight: 800; }
    h1 { font-size: 32px; margin: 24px 0 8px; }
    p { color: #444; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 13px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; text-transform: uppercase; font-size: 10px; letter-spacing: .08em; }
    .proposal { display: grid; grid-template-columns: 280px 1fr; gap: 18px; border: 1px solid #ddd; border-radius: 10px; padding: 14px; margin-top: 14px; break-inside: avoid; }
    img { width: 100%; border-radius: 8px; }
    ul { line-height: 1.7; }
    .note { border: 1px solid #ddd; border-radius: 10px; padding: 16px; margin-top: 18px; }
    @media (max-width: 760px) { main { padding: 22px; } .proposal { display: block; } table { font-size: 12px; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div class="brand">Buildify</div>
      <div>Dossier comparatif des propositions visuelles</div>
    </header>
    <h1>${escapeHtml(data.title)}</h1>
    <p>Dossier ${escapeHtml(data.referenceNumber)} · ${escapeHtml(data.categoryName)} · ${escapeHtml(data.city)}</p>
    <table>
      <thead><tr><th>Proposition</th><th>Catégorie</th><th>Budget indicatif</th><th>Délai</th><th>Score</th><th>Lecture décisionnelle</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${proposalBlocks}
    <section class="note">
      <strong>Validation client</strong>
      <p>${escapeHtml(proposalClientCommitment(selectedProposal, data))}</p>
    </section>
  </main>
</body>
</html>`;
}

function downloadProposalSheet(proposal: VisualProposal, data: ProjectDetailData) {
  const blob = new Blob([buildProposalHtml(proposal, data)], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${proposal.id}-fiche-buildify.html`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadProposalPortfolio(proposals: VisualProposal[], selectedProposal: VisualProposal, data: ProjectDetailData) {
  const blob = new Blob([buildProposalPortfolioHtml(proposals, selectedProposal, data)], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${data.referenceNumber}-comparatif-propositions-buildify.html`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function quoteScopeItems(quote: ProjectQuoteViewData, data: ProjectDetailData) {
  return quote.scope?.length ? quote.scope : [
    `${quote.label} pour ${data.categoryName}`,
    `Localisation : ${data.city || 'à confirmer'}`,
    'Coordination technique, suivi de dossier et préparation des jalons projet.',
  ];
}

function quoteAssumptionItems(quote: ProjectQuoteViewData, data: ProjectDetailData) {
  return quote.assumptions?.length ? quote.assumptions : [
    'Montant établi sur les informations transmises avant métrés définitifs et validation terrain.',
    data.financing?.readiness === 'confirmed'
      ? 'Financement annoncé comme confirmé par le client, sous réserve des pièces justificatives.'
      : 'Financement à confirmer avant engagement contractuel.',
    'Les surfaces, documents, délais et choix de matériaux peuvent modifier le chiffrage final.',
  ];
}

function quoteExclusionItems(quote: ProjectQuoteViewData) {
  return quote.exclusions?.length ? quote.exclusions : [
    'Taxes, frais administratifs, études réglementaires et prestations non listées restent à confirmer.',
    'Toute évolution du périmètre fera l’objet d’un avenant ou d’un nouveau devis.',
  ];
}

function quotePaymentTerms(quote: ProjectQuoteViewData) {
  return quote.paymentTerms || 'Paiement par jalons vérifiés : acompte, lancement, avancements documentés, réception puis solde après contrôle.';
}

function buildQuoteHtml(quote: ProjectQuoteViewData, data: ProjectDetailData) {
  const validity = quote.validityDays ? `${quote.validityDays} jour(s)` : 'À confirmer';
  const statusLabel = getQuoteStatusBadge(quote.status).label;
  const generatedAt = new Date().toLocaleDateString('fr-FR');

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(quote.label)} - ${escapeHtml(data.referenceNumber)}</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; color: #111; background: #fff; }
    main { max-width: 960px; margin: 0 auto; padding: 40px; }
    header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #111; padding-bottom: 18px; }
    .brand { font-size: 26px; font-weight: 800; }
    .muted { color: #555; }
    .right { text-align: right; font-size: 12px; line-height: 1.7; }
    h1 { margin: 28px 0 10px; font-size: 32px; line-height: 1.15; }
    p { line-height: 1.65; color: #333; }
    .amount { margin: 22px 0; border: 2px solid #111; border-radius: 10px; padding: 18px; }
    .amount .label { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #555; font-weight: 700; }
    .amount .value { margin-top: 8px; font-size: 30px; font-weight: 800; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
    .box { border: 1px solid #ddd; border-radius: 8px; padding: 14px; break-inside: avoid; }
    .box-title { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #666; font-weight: 700; }
    .box-value { margin-top: 8px; font-size: 14px; font-weight: 700; }
    .split { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
    ul { margin: 10px 0 0; padding-left: 20px; line-height: 1.7; }
    .decision { margin-top: 14px; border: 1px solid #111; border-radius: 10px; padding: 16px; }
    footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #ddd; color: #666; font-size: 12px; line-height: 1.6; }
    @media (max-width: 760px) { main { padding: 22px; } header, .split { display: block; } .right { margin-top: 12px; text-align: left; } .grid { grid-template-columns: 1fr; } }
    @media print { main { padding: 24px; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <div class="brand">Buildify</div>
        <div class="muted">Devis projet client</div>
      </div>
      <div class="right">
        <div>Dossier ${escapeHtml(data.referenceNumber)}</div>
        <div>${escapeHtml(data.title)}</div>
        <div>${escapeHtml(data.city || 'Localisation à confirmer')}</div>
        <div>Généré le ${escapeHtml(generatedAt)}</div>
      </div>
    </header>
    <h1>${escapeHtml(quote.label)}</h1>
    <p>${escapeHtml(quote.description || 'Ce devis précise le budget, le périmètre, les hypothèses et les modalités de décision du projet.')}</p>
    <section class="amount">
      <div class="label">Montant proposé</div>
      <div class="value">${escapeHtml(FORMAT_XOF(quote.amount))}</div>
    </section>
    <section class="grid">
      <div class="box"><div class="box-title">Statut</div><div class="box-value">${escapeHtml(statusLabel)}</div></div>
      <div class="box"><div class="box-title">Validité</div><div class="box-value">${escapeHtml(validity)}</div></div>
      <div class="box"><div class="box-title">Date devis</div><div class="box-value">${escapeHtml(quote.date)}</div></div>
      <div class="box"><div class="box-title">Préparé par</div><div class="box-value">${escapeHtml(publicActorLabel(quote.createdBy))}</div></div>
    </section>
    <div class="split">
      <section class="box"><div class="box-title">Périmètre inclus</div><ul>${renderList(quoteScopeItems(quote, data))}</ul></section>
      <section class="box"><div class="box-title">Hypothèses financières et techniques</div><ul>${renderList(quoteAssumptionItems(quote, data))}</ul></section>
    </div>
    <div class="split">
      <section class="box"><div class="box-title">Hors périmètre</div><ul>${renderList(quoteExclusionItems(quote))}</ul></section>
      <section class="box"><div class="box-title">Modalités de paiement</div><p>${escapeHtml(quotePaymentTerms(quote))}</p></section>
    </div>
    <section class="decision">
      <strong>Comprendre l’engagement</strong>
      <p>Accepter ce devis autorise Buildify à préparer le contrat, le planning, les pièces de démarrage et les prochaines étapes de paiement. La contractualisation finale reste liée aux vérifications techniques, administratives et financières.</p>
    </section>
    <footer>
      Document généré depuis l’espace client Buildify. Conservez-le avec vos pièces projet, surtout si vous pilotez le chantier depuis l’étranger.
    </footer>
  </main>
</body>
</html>`;
}

function downloadQuoteSheet(quote: ProjectQuoteViewData, data: ProjectDetailData) {
  const blob = new Blob([buildQuoteHtml(quote, data)], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${data.referenceNumber}-${quote.id}-devis-buildify.html`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function openQuoteSheet(quote: ProjectQuoteViewData, data: ProjectDetailData) {
  const tab = window.open('', '_blank');
  if (!tab) {
    downloadQuoteSheet(quote, data);
    return;
  }
  tab.document.write(buildQuoteHtml(quote, data));
  tab.document.close();
}

type ClientDocumentView = ProjectDetailData['documents'][number];

function formatDocumentSize(size?: number) {
  if (!size) return 'Taille non renseignée';
  if (size >= 1024 * 1024) return `${Math.round((size / (1024 * 1024)) * 10) / 10} Mo`;
  return `${Math.max(1, Math.round(size / 1024))} Ko`;
}

function documentTypeLabel(type: string) {
  const labels: Record<string, string> = {
    plan: 'Plan',
    photo: 'Photo',
    contrat: 'Contrat',
    facture: 'Facture',
    document: 'Document',
  };
  return labels[type] || type;
}

function buildDocumentReceiptHtml(document: ClientDocumentView, data: ProjectDetailData) {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(document.name)} - ${escapeHtml(data.referenceNumber)}</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; color: #111; background: #fff; }
    main { max-width: 760px; margin: 0 auto; padding: 38px; }
    header { border-bottom: 2px solid #111; padding-bottom: 18px; display: flex; justify-content: space-between; gap: 24px; }
    .brand { font-size: 24px; font-weight: 900; }
    .ref { text-align: right; font-size: 12px; color: #555; line-height: 1.6; }
    h1 { margin: 28px 0 8px; font-size: 28px; line-height: 1.2; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 22px; }
    .box { border: 1px solid #ddd; border-radius: 10px; padding: 14px; }
    .label { color: #666; font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
    .value { margin-top: 8px; font-size: 15px; font-weight: 800; overflow-wrap: anywhere; }
    .note { margin-top: 18px; border: 1px solid #ddd; border-radius: 10px; padding: 16px; line-height: 1.65; color: #333; }
    footer { margin-top: 28px; padding-top: 14px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    @media (max-width: 640px) { main { padding: 22px; } header { display: block; } .ref { margin-top: 12px; text-align: left; } .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div><div class="brand">Buildify</div><div>Registre documentaire</div></div>
      <div class="ref">
        <div>Dossier ${escapeHtml(data.referenceNumber)}</div>
        <div>${escapeHtml(data.title)}</div>
        <div>${escapeHtml(data.city)}</div>
      </div>
    </header>
    <h1>${escapeHtml(document.name)}</h1>
    <p>Fiche de dépôt générée depuis l’espace projet Buildify.</p>
    <section class="grid">
      <div class="box"><div class="label">Type</div><div class="value">${escapeHtml(documentTypeLabel(document.type))}</div></div>
      <div class="box"><div class="label">Date</div><div class="value">${escapeHtml(document.date)}</div></div>
      <div class="box"><div class="label">Taille</div><div class="value">${escapeHtml(formatDocumentSize(document.size))}</div></div>
      <div class="box"><div class="label">Statut</div><div class="value">Déposé au dossier</div></div>
    </section>
    <section class="note">
      Ce registre ne remplace pas le fichier original. Il sert à tracer la pièce déclarée, faciliter le suivi du dossier, préparer les demandes de pièces complémentaires et sécuriser le parcours devis, banque, contrat et chantier.
      ${document.url ? `<br /><br />Lien déclaré : ${escapeHtml(document.url)}` : ''}
    </section>
    <footer>Document rattaché au dossier ${escapeHtml(data.referenceNumber)} · Buildify</footer>
  </main>
</body>
</html>`;
}

function downloadDocumentReceipt(document: ClientDocumentView, data: ProjectDetailData) {
  const blob = new Blob([buildDocumentReceiptHtml(document, data)], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement('a');
  anchor.href = url;
  anchor.download = `${data.referenceNumber}-${document.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'document'}-registre-buildify.html`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadOriginalDocument(document: ClientDocumentView) {
  if (!document.url) return;
  const anchor = window.document.createElement('a');
  anchor.href = document.url;
  anchor.download = document.name;
  anchor.target = '_blank';
  anchor.rel = 'noreferrer';
  anchor.click();
}

function buildVisualProposals(data: ProjectDetailData): VisualProposal[] {
  const baseEstimate = `${FORMAT_XOF(data.budgetMin)} – ${FORMAT_XOF(data.budgetMax)}`;
  const category = data.categoryName.toLowerCase();

  if (category.includes('vrd') || category.includes('voirie') || category.includes('route')) {
    return [
      {
        id: `${data.referenceNumber}-vrd-voirie`,
        title: 'Voirie et accès opérationnels',
        category: 'VRD',
        image: '/images/road-1.png',
        description: 'Tracé de voirie, circulation chantier, bordures, caniveaux et accès livrables par phase.',
        estimate: baseEstimate,
        duration: '6 à 12 semaines',
        confidence: 'Optimisé pour sites actifs',
        deliverable: 'Plan VRD, phasage, liste des ouvrages et repères terrain.',
        strengths: ['Accès chantier lisible', 'Drainage intégré', 'Maintenance anticipée'],
      },
      {
        id: `${data.referenceNumber}-vrd-hydraulique`,
        title: 'Réseaux hydrauliques maîtrisés',
        category: 'VRD',
        image: '/images/hydraulique-1.png',
        description: 'Proposition centrée sur l’assainissement, les regards, les pentes et la continuité des écoulements.',
        estimate: baseEstimate,
        duration: '4 à 10 semaines',
        confidence: 'Priorité conformité',
        deliverable: 'Schéma réseaux, points de contrôle et fiches d’exécution.',
        strengths: ['Assainissement structuré', 'Pentes vérifiables', 'Contrôle simplifié'],
      },
      {
        id: `${data.referenceNumber}-vrd-chantier`,
        title: 'Préparation complète du site',
        category: 'VRD',
        image: '/images/chantier-1.png',
        description: 'Organisation terrain, base vie, accès fournisseurs et zones de stockage pour lancer les travaux proprement.',
        estimate: baseEstimate,
        duration: '2 à 6 semaines',
        confidence: 'Démarrage rapide',
        deliverable: 'Plan d’installation, zones sensibles et planning de mobilisation.',
        strengths: ['Flux sécurisés', 'Stockage cadré', 'Démarrage maîtrisé'],
      },
    ];
  }

  if (category.includes('immeuble')) {
    return [
      {
        id: `${data.referenceNumber}-rplus-facade`,
        title: 'Façade d’immeuble R+ premium',
        category: 'Immeuble R+',
        image: '/images/immeuble-1.png',
        description: 'Volume vertical sobre, rez-de-chaussée lisible, trame de façade régulière et accès principal valorisé.',
        estimate: baseEstimate,
        duration: '10 à 18 mois',
        confidence: 'Recommandée pour rendement locatif',
        deliverable: 'Vue façade, principe structurel, estimation et planning macro.',
        strengths: ['Façade durable', 'Circulations claires', 'Bonne densité utile'],
      },
      {
        id: `${data.referenceNumber}-rplus-bureaux`,
        title: 'Plateaux mixtes et services',
        category: 'Immeuble R+',
        image: '/images/bureau-1.png',
        description: 'Variante pour intégrer bureaux, commerces ou espaces communs selon les besoins du programme.',
        estimate: baseEstimate,
        duration: '9 à 16 mois',
        confidence: 'Flexible programme mixte',
        deliverable: 'Zoning des plateaux, priorités techniques et arbitrages budget.',
        strengths: ['Espaces modulables', 'Hall valorisé', 'Exploitation facilitée'],
      },
      {
        id: `${data.referenceNumber}-rplus-plan`,
        title: 'Plan technique optimisé',
        category: 'Immeuble R+',
        image: '/images/plan-1.png',
        description: 'Lecture claire des circulations, noyaux, appartements et réservations techniques avant validation finale.',
        estimate: baseEstimate,
        duration: '3 à 6 semaines d’études',
        confidence: 'Priorité exécution',
        deliverable: 'Plans de principe, surfaces utiles et points BET à arbitrer.',
        strengths: ['Noyaux rationnels', 'Surfaces mieux cadrées', 'Études plus rapides'],
      },
    ];
  }

  if (category.includes('duplex')) {
    return [
      {
        id: `${data.referenceNumber}-duplex-facade`,
        title: 'Duplex familial contemporain',
        category: 'Maison basse / duplex',
        image: '/images/duplex-1.png',
        description: 'Façade équilibrée, volumes protégés du soleil et espaces familiaux organisés autour du séjour.',
        estimate: baseEstimate,
        duration: '8 à 12 mois',
        confidence: 'Confort familial',
        deliverable: 'Vue extérieure, intentions matières, estimation et jalons clés.',
        strengths: ['Séjour généreux', 'Façade sobre', 'Circulation familiale'],
      },
      {
        id: `${data.referenceNumber}-duplex-interieur`,
        title: 'Ambiance intérieure finitions',
        category: 'Second œuvre',
        image: '/images/interieur-1.png',
        description: 'Choix de finitions, éclairage, revêtements et menuiseries pour valider le niveau de standing.',
        estimate: baseEstimate,
        duration: '8 à 14 semaines',
        confidence: 'Décision rapide des finitions',
        deliverable: 'Moodboard, lots finition et points de validation client.',
        strengths: ['Finitions cohérentes', 'Budget lisible', 'Choix client cadrés'],
      },
      {
        id: `${data.referenceNumber}-duplex-plan`,
        title: 'Plan de distribution précis',
        category: 'Études',
        image: '/images/plan-1.png',
        description: 'Distribution des pièces, emplacements techniques et optimisation des surfaces selon le terrain.',
        estimate: baseEstimate,
        duration: '2 à 4 semaines d’études',
        confidence: 'Base claire pour devis',
        deliverable: 'Plan, surfaces, hypothèses et points ouverts.',
        strengths: ['Pièces lisibles', 'Technique anticipée', 'Devis plus fiable'],
      },
    ];
  }

  return [
    {
      id: `${data.referenceNumber}-maison-facade`,
      title: 'Maison basse contemporaine',
      category: 'Maison basse',
      image: '/images/villa-1.png',
      description: 'Proposition claire pour une villa basse, avec façade élégante, terrasse protégée et implantation simple à exécuter.',
      estimate: baseEstimate,
      duration: '6 à 10 mois',
      confidence: 'Recommandée pour budget maîtrisé',
      deliverable: 'Vue façade, principes de matériaux, enveloppe budget et phasage.',
      strengths: ['Lecture immédiate', 'Coûts mieux cadrés', 'Entretien simple'],
    },
    {
      id: `${data.referenceNumber}-maison-interieur`,
      title: 'Finitions intérieures premium',
      category: 'Second œuvre',
      image: '/images/interieur-1.png',
      description: 'Ambiance intérieure pour arbitrer les lots peinture, plafonds, revêtements, plomberie et équipements.',
      estimate: baseEstimate,
      duration: '6 à 12 semaines',
      confidence: 'Idéal avant commande',
      deliverable: 'Planche finitions, lots concernés et liste de décisions client.',
      strengths: ['Choix concrets', 'Lots séparés', 'Budget finition lisible'],
    },
    {
      id: `${data.referenceNumber}-maison-plan`,
      title: 'Plan optimisé du logement',
      category: 'Études',
      image: '/images/plan-1.png',
      description: 'Distribution claire des chambres, pièces d’eau, cuisine, terrasse et réservations techniques.',
      estimate: baseEstimate,
      duration: '2 à 4 semaines d’études',
      confidence: 'Base technique solide',
      deliverable: 'Plan de principe, surfaces et options à confirmer.',
      strengths: ['Surfaces utiles', 'Technique anticipée', 'Validation rapide'],
    },
  ];
}

function buildDefaultFinancing(data: ProjectDetailData): ProjectFinancingData {
  const estimatedBudget = data.budgetMax || data.budgetMin || undefined;
  const phases = [
    { id: 'foundation', label: 'Fondations validées', trigger: 'Décaissement après contrôle et photos des fondations.', percent: 10 },
    { id: 'structure', label: 'Élévation / structure', trigger: 'Décaissement après avancement structurel conforme.', percent: 20 },
    { id: 'roofing', label: 'Toiture / clos couvert', trigger: 'Décaissement après toiture, menuiseries ou étape équivalente.', percent: 15 },
    { id: 'secondary', label: 'Second œuvre', trigger: 'Décaissement après réseaux, plomberie, électricité et cloisons.', percent: 25 },
    { id: 'finishes', label: 'Finitions', trigger: 'Décaissement après validation des finitions et équipements.', percent: 20 },
    { id: 'handover', label: 'Réception', trigger: 'Solde à la réception selon contrat.', percent: 10 },
  ];

  return {
    mode: 'progress-payment',
    readiness: 'to_structure',
    paymentPrinciple: 'Aucune avance de démarrage imposée : paiements déclenchés par niveaux d’avancement vérifiés.',
    estimatedBudget,
    documentReadiness: [],
    guarantees: ['notary-contract', 'milestone-payment'],
    commitments: [],
    affordabilityScore: 42,
    financialRiskLevel: 'moderate',
    equityRatioPercent: undefined,
    cashReserveMonths: undefined,
    notaryContract: true,
    escrowRequested: false,
    bankSupportRequested: true,
    landSupportRequested: false,
    milestones: phases.map(phase => ({
      ...phase,
      expectedAmount: estimatedBudget ? Math.round((estimatedBudget * phase.percent) / 100) : undefined,
      status: 'planned' as const,
    })),
    updatedAt: new Date().toISOString(),
  };
}

function financingModeLabel(mode: string) {
  const labels: Record<string, string> = {
    'confirmed-bank': 'Financement confirmé',
    'bank-support': 'Aide avec la banque',
    'progress-payment': 'Paiement par avancement',
    'notary-secured': 'Contrat notarié',
    'land-and-finance': 'Terrain + financement',
    'to-structure': 'À structurer',
  };
  return labels[mode] || 'À structurer';
}

function financingReadinessLabel(readiness: ProjectFinancingData['readiness']) {
  if (readiness === 'confirmed') return 'Financement confirmé';
  if (readiness === 'bank_review') return 'En échange banque';
  if (readiness === 'to_structure') return 'À structurer';
  return 'À confirmer';
}

function financingDetailLabel(value: string | undefined, labels: Record<string, string>, fallback = 'À compléter') {
  if (!value) return fallback;
  return labels[value] || value;
}

function amountOrTodo(value: number | undefined) {
  return value !== undefined ? FORMAT_XOF(value) : 'À compléter';
}

function percentOrTodo(value: number | undefined) {
  return value !== undefined ? `${value}%` : 'À calculer';
}

function percentRatio(part?: number, total?: number) {
  if (part === undefined || total === undefined || total <= 0) return undefined;
  return Math.round((part / total) * 100);
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function proposalDecisionScore(proposal: VisualProposal, data?: ProjectDetailData) {
  const criteriaCount = proposal.decisionCriteria?.length ?? 0;
  const scopeCount = proposal.technicalScope?.length ?? 0;
  const riskCount = proposal.riskControls?.length ?? 0;
  const hasBudget = /\d/.test(proposal.estimate);
  const hasDuration = /\d/.test(proposal.duration);
  const hasLocation = Boolean(data?.city && proposalTechnicalScope(proposal, data).some(item => item.includes(data.city)));
  const confidence = proposal.confidence.toLowerCase();
  const confidenceScore = confidence.includes('solide') || confidence.includes('maîtris')
    ? 12
    : confidence.includes('cadr')
      ? 9
      : confidence.includes('confirmer')
        ? 5
        : 7;

  return clampPercent(
    48
    + Math.min(16, proposal.strengths.length * 4)
    + Math.min(12, criteriaCount * 3)
    + Math.min(10, scopeCount * 2)
    + Math.min(8, riskCount * 2)
    + (hasBudget ? 5 : 0)
    + (hasDuration ? 4 : 0)
    + (hasLocation ? 3 : 0)
    + confidenceScore
  );
}

function proposalDecisionLabel(score: number) {
  if (score >= 86) return 'Très lisible';
  if (score >= 74) return 'Bonne base';
  if (score >= 62) return 'À cadrer';
  return 'À compléter';
}

function paymentMilestoneStatusLabel(status: ProjectPaymentMilestoneData['status']) {
  if (status === 'due') return 'À régler';
  if (status === 'paid') return 'Payé';
  if (status === 'blocked') return 'Bloqué';
  return 'Planifié';
}

function paymentMilestoneStatusVariant(status: ProjectPaymentMilestoneData['status']): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'paid') return 'default';
  if (status === 'blocked') return 'destructive';
  if (status === 'due') return 'secondary';
  return 'outline';
}

const FINANCING_PURPOSE_LABELS: Record<string, string> = {
  'construction-only': 'Construction uniquement',
  'land-and-construction': 'Terrain + construction',
  'works-lot': 'Lot de travaux',
  'vrd-infra': 'VRD / réseaux',
  'studies-permits': 'Études / permis',
  'completion-finishes': 'Achèvement / finitions',
};

const BANK_STAGE_LABELS: Record<string, string> = {
  'not-started': 'Pas encore démarré',
  simulation: 'Simulation reçue',
  'documents-requested': 'Pièces demandées',
  'under-review': 'Dossier en étude',
  'pre-approved': 'Préaccord obtenu',
  'funds-available': 'Fonds disponibles',
};

const DOWN_PAYMENT_SOURCE_LABELS: Record<string, string> = {
  savings: 'Épargne personnelle',
  'salary-business': 'Revenus d’activité',
  'family-support': 'Appui familial / associé',
  'asset-sale': 'Vente d’actif',
  'company-cash': 'Trésorerie entreprise',
  'to-confirm': 'À confirmer',
};

const FINANCING_DOCUMENT_LABELS: Record<string, string> = {
  id: 'Pièce d’identité',
  'income-proof': 'Justificatifs revenus',
  'bank-statements': 'Relevés bancaires',
  'land-document': 'Document terrain',
  'company-documents': 'Documents entreprise',
  'quote-or-plans': 'Plans / devis / métré',
  'none-yet': 'Aucun document prêt',
};

const FINANCING_COMMITMENT_LABELS: Record<string, string> = {
  'truthful-data': 'Données sincères',
  'bank-verification': 'Vérification banque acceptée',
  'progress-payment': 'Paiement par avancement compris',
  'no-hidden-advance': 'Avances non sécurisées évitées',
};

const EMPLOYMENT_STATUS_LABELS: Record<string, string> = {
  'civil-servant': 'Fonctionnaire / agent public',
  'private-salary': 'Salarié du privé',
  'diaspora-salary': 'Salarié hors Côte d’Ivoire',
  entrepreneur: 'Entrepreneur / commerçant',
  'liberal-service': 'Profession libérale',
  'mixed-income': 'Revenus mixtes',
  'family-backed': 'Appui familial structuré',
  'to-confirm': 'À confirmer',
};

const FINANCIAL_SECTOR_LABELS: Record<string, string> = {
  public: 'Secteur public',
  private: 'Entreprise privée',
  construction: 'BTP / immobilier',
  trade: 'Commerce',
  transport: 'Transport / logistique',
  health: 'Santé',
  education: 'Éducation',
  digital: 'Digital / télécoms',
  agriculture: 'Agriculture / agro',
  diaspora: 'Revenus diaspora',
  business: 'Activité indépendante',
  other: 'Autre secteur',
};

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  permanent: 'CDI / contrat permanent',
  fixed: 'CDD / mission longue',
  civil: 'Fonction publique',
  business: 'Activité indépendante',
  company: 'Société porteuse',
  mixed: 'Revenus mixtes',
  informal: 'Revenus à documenter',
  other: 'Autre situation',
};

const INCOME_STABILITY_LABELS: Record<string, string> = {
  'stable-12m': 'Stable depuis 12 mois ou plus',
  'stable-6m': 'Stable depuis 6 mois',
  variable: 'Variable mais documenté',
  seasonal: 'Saisonnier / par contrat',
  'new-income': 'Nouveau revenu à consolider',
  'to-document': 'À documenter',
};

const CO_BORROWER_LABELS: Record<string, string> = {
  none: 'Aucun co-emprunteur',
  spouse: 'Conjoint(e)',
  family: 'Famille',
  associate: 'Associé / partenaire',
  company: 'Société porteuse',
  'to-confirm': 'À confirmer',
};

const FINANCING_OWNER_LABELS: Record<string, string> = {
  'single-client': 'Client seul',
  couple: 'Couple / foyer',
  family: 'Famille',
  company: 'Entreprise',
  'investor-group': 'Groupe d’investisseurs',
};

const FINANCIAL_RISK_LABELS: Record<NonNullable<ProjectFinancingData['financialRiskLevel']>, string> = {
  low: 'Risque maîtrisé',
  moderate: 'Risque à structurer',
  high: 'Risque élevé',
  unknown: 'À analyser',
};

type FinancingDraft = {
  mode: string;
  employmentStatus: string;
  financialSector: string;
  contractType: string;
  employerName: string;
  salaryDomiciliationBank: string;
  incomeCurrency: string;
  incomeStability: string;
  financingOwner: string;
  coBorrowerStatus: string;
  monthlyIncome: number | '';
  baseSalary: number | '';
  variableMonthlyIncome: number | '';
  otherMonthlyIncome: number | '';
  existingMonthlyDebt: number | '';
  monthlyPaymentCapacity: number | '';
  ownContribution: number | '';
  requestedLoanAmount: number | '';
  desiredLoanDurationYears: number | '';
  availableSavings: number | '';
  householdDependents: number | '';
  bankName: string;
  bankContact: string;
  bankAgreementStage: string;
  financingPurpose: string;
  downPaymentSource: string;
  documentReadiness: string[];
  notaryContract: boolean;
  escrowRequested: boolean;
  bankSupportRequested: boolean;
  landSupportRequested: boolean;
  notes: string;
};

type FinancingNumberField =
  | 'monthlyIncome'
  | 'baseSalary'
  | 'variableMonthlyIncome'
  | 'otherMonthlyIncome'
  | 'existingMonthlyDebt'
  | 'monthlyPaymentCapacity'
  | 'ownContribution'
  | 'requestedLoanAmount'
  | 'desiredLoanDurationYears'
  | 'availableSavings'
  | 'householdDependents';

type FinancingBooleanField =
  | 'notaryContract'
  | 'escrowRequested'
  | 'bankSupportRequested'
  | 'landSupportRequested';

const FINANCING_NUMBER_FIELDS: Array<{ key: FinancingNumberField; label: string; placeholder: string }> = [
  { key: 'baseSalary', label: 'Salaire / revenu fixe net', placeholder: '1200000' },
  { key: 'variableMonthlyIncome', label: 'Primes / revenus variables', placeholder: '200000' },
  { key: 'otherMonthlyIncome', label: 'Autres revenus mensuels', placeholder: '100000' },
  { key: 'monthlyIncome', label: 'Revenu net retenu', placeholder: '1500000' },
  { key: 'existingMonthlyDebt', label: 'Charges mensuelles existantes', placeholder: '250000' },
  { key: 'monthlyPaymentCapacity', label: 'Mensualité supportable', placeholder: '500000' },
  { key: 'ownContribution', label: 'Apport disponible sécurisé', placeholder: '5000000' },
  { key: 'requestedLoanAmount', label: 'À financer', placeholder: '35000000' },
  { key: 'desiredLoanDurationYears', label: 'Durée an(s)', placeholder: '10' },
  { key: 'availableSavings', label: 'Épargne de sécurité', placeholder: '3000000' },
  { key: 'householdDependents', label: 'Personnes à charge', placeholder: '2' },
];

const FINANCING_BOOLEAN_FIELDS: Array<{ key: FinancingBooleanField; label: string }> = [
  { key: 'notaryContract', label: 'Contrat notarié' },
  { key: 'escrowRequested', label: 'Séquestre' },
  { key: 'bankSupportRequested', label: 'Aide banque' },
  { key: 'landSupportRequested', label: 'Aide terrain' },
];

const FINANCING_MODE_OPTIONS = [
  { value: 'confirmed-bank', label: 'Financement confirmé' },
  { value: 'bank-support', label: 'Aide banque demandée' },
  { value: 'progress-payment', label: 'Paiement par avancement' },
  { value: 'notary-secured', label: 'Contrat notarié' },
  { value: 'land-and-finance', label: 'Terrain + financement' },
  { value: 'to-structure', label: 'À structurer' },
];

function financingDraftFrom(financing: ProjectFinancingData): FinancingDraft {
  return {
    mode: financing.mode || 'progress-payment',
    employmentStatus: financing.employmentStatus || '',
    financialSector: financing.financialSector || '',
    contractType: financing.contractType || '',
    employerName: financing.employerName || '',
    salaryDomiciliationBank: financing.salaryDomiciliationBank || '',
    incomeCurrency: financing.incomeCurrency || 'XOF',
    incomeStability: financing.incomeStability || '',
    financingOwner: financing.financingOwner || '',
    coBorrowerStatus: financing.coBorrowerStatus || '',
    monthlyIncome: financing.monthlyIncome ?? '',
    baseSalary: financing.baseSalary ?? '',
    variableMonthlyIncome: financing.variableMonthlyIncome ?? '',
    otherMonthlyIncome: financing.otherMonthlyIncome ?? '',
    existingMonthlyDebt: financing.existingMonthlyDebt ?? '',
    monthlyPaymentCapacity: financing.monthlyPaymentCapacity ?? '',
    ownContribution: financing.ownContribution ?? '',
    requestedLoanAmount: financing.requestedLoanAmount ?? '',
    desiredLoanDurationYears: financing.desiredLoanDurationYears ?? '',
    availableSavings: financing.availableSavings ?? '',
    householdDependents: financing.householdDependents ?? '',
    bankName: financing.bankName || '',
    bankContact: financing.bankContact || '',
    bankAgreementStage: financing.bankAgreementStage || '',
    financingPurpose: financing.financingPurpose || '',
    downPaymentSource: financing.downPaymentSource || '',
    documentReadiness: financing.documentReadiness ?? [],
    notaryContract: financing.notaryContract,
    escrowRequested: financing.escrowRequested,
    bankSupportRequested: financing.bankSupportRequested,
    landSupportRequested: financing.landSupportRequested,
    notes: financing.notes || '',
  };
}

function draftNumber(value: number | '') {
  return value === '' || !Number.isFinite(Number(value)) ? undefined : Number(value);
}

function numberInputValue(value: number | '') {
  return value === '' ? '' : String(value);
}

function financingDraftMonthlyIncome(draft: FinancingDraft) {
  const declaredMonthlyIncome = draftNumber(draft.monthlyIncome);
  if (declaredMonthlyIncome !== undefined) return declaredMonthlyIncome;
  const incomeParts = [
    draftNumber(draft.baseSalary),
    draftNumber(draft.variableMonthlyIncome),
    draftNumber(draft.otherMonthlyIncome),
  ].filter((value): value is number => value !== undefined);
  if (incomeParts.length === 0) return undefined;
  return incomeParts.reduce((total, value) => total + value, 0);
}

function defaultMilestonesForBudget(estimatedBudget?: number): ProjectPaymentMilestoneData[] {
  const phases = [
    { id: 'foundation', label: 'Fondations validées', trigger: 'Décaissement après contrôle et photos des fondations.', percent: 10 },
    { id: 'structure', label: 'Élévation / structure', trigger: 'Décaissement après avancement structurel conforme.', percent: 20 },
    { id: 'roofing', label: 'Toiture / clos couvert', trigger: 'Décaissement après toiture, menuiseries ou étape équivalente.', percent: 15 },
    { id: 'secondary', label: 'Second œuvre', trigger: 'Décaissement après réseaux, plomberie, électricité et cloisons.', percent: 25 },
    { id: 'finishes', label: 'Finitions', trigger: 'Décaissement après validation des finitions et équipements.', percent: 20 },
    { id: 'handover', label: 'Réception', trigger: 'Solde à la réception selon contrat.', percent: 10 },
  ];

  return phases.map(phase => ({
    ...phase,
    expectedAmount: estimatedBudget ? Math.round((estimatedBudget * phase.percent) / 100) : undefined,
    status: 'planned' as const,
  }));
}

function buildMilestonesForBudget(existing: ProjectPaymentMilestoneData[], estimatedBudget?: number) {
  if (existing.length === 0) return defaultMilestonesForBudget(estimatedBudget);
  return existing.map(milestone => ({
    ...milestone,
    expectedAmount: estimatedBudget ? Math.round((estimatedBudget * milestone.percent) / 100) : milestone.expectedAmount,
  }));
}

function financingDraftScore(draft: FinancingDraft, estimatedBudget?: number) {
  const monthlyIncome = financingDraftMonthlyIncome(draft);
  const existingDebt = draftNumber(draft.existingMonthlyDebt) ?? 0;
  const monthlyCapacity = draftNumber(draft.monthlyPaymentCapacity) ?? 0;
  const ownContribution = draftNumber(draft.ownContribution);
  const projectedDebtRatio = percentRatio(existingDebt + monthlyCapacity, monthlyIncome);
  const equityRatio = percentRatio(ownContribution, estimatedBudget);
  const bankScore = ['funds-available', 'pre-approved'].includes(draft.bankAgreementStage)
    ? 22
    : draft.bankAgreementStage === 'under-review'
      ? 14
      : draft.bankAgreementStage === 'documents-requested'
        ? 9
        : 3;
  const stabilityScore = ['stable-12m', 'stable-contract'].includes(draft.incomeStability)
    ? 18
    : draft.incomeStability === 'stable-6m'
      ? 12
      : draft.incomeStability
        ? 7
        : 2;
  const debtScore = projectedDebtRatio === undefined
    ? 4
    : projectedDebtRatio <= 35
      ? 22
      : projectedDebtRatio <= 45
        ? 13
        : 5;
  const equityScore = equityRatio === undefined
    ? 4
    : equityRatio >= 30
      ? 18
      : equityRatio >= 15
        ? 11
        : 5;
  const securityScore = [draft.notaryContract, draft.escrowRequested, draft.bankSupportRequested].filter(Boolean).length * 5;

  return clampPercent(bankScore + stabilityScore + debtScore + equityScore + securityScore);
}

function financialRiskLevel(score: number, projectedDebtRatio?: number): ProjectFinancingData['financialRiskLevel'] {
  if (projectedDebtRatio !== undefined && projectedDebtRatio > 50) return 'high';
  if (score >= 75) return 'low';
  if (score >= 45) return 'moderate';
  return 'high';
}

function financingReadinessFromDraft(draft: FinancingDraft): ProjectFinancingData['readiness'] {
  if (draft.mode === 'confirmed-bank' || ['funds-available', 'pre-approved'].includes(draft.bankAgreementStage)) return 'confirmed';
  if (draft.mode === 'bank-support' || ['under-review', 'documents-requested'].includes(draft.bankAgreementStage)) return 'bank_review';
  if (draft.mode === 'to-structure' || draft.mode === 'land-and-finance') return 'to_structure';
  return 'unknown';
}

function buildFinancingFromDraft(
  base: ProjectFinancingData,
  draft: FinancingDraft,
  data: ProjectDetailData
): ProjectFinancingData {
  const estimatedBudget = base.estimatedBudget || data.budgetMax || data.budgetMin || undefined;
  const baseSalary = draftNumber(draft.baseSalary);
  const variableMonthlyIncome = draftNumber(draft.variableMonthlyIncome);
  const otherMonthlyIncome = draftNumber(draft.otherMonthlyIncome);
  const monthlyIncome = financingDraftMonthlyIncome(draft);
  const existingMonthlyDebt = draftNumber(draft.existingMonthlyDebt);
  const monthlyPaymentCapacity = draftNumber(draft.monthlyPaymentCapacity);
  const ownContribution = draftNumber(draft.ownContribution);
  const requestedLoanAmount = draftNumber(draft.requestedLoanAmount);
  const desiredLoanDurationYears = draftNumber(draft.desiredLoanDurationYears);
  const availableSavings = draftNumber(draft.availableSavings);
  const householdDependents = draftNumber(draft.householdDependents);
  const currentDebtRatioPercent = percentRatio(existingMonthlyDebt, monthlyIncome);
  const projectedDebtRatioPercent = percentRatio((existingMonthlyDebt ?? 0) + (monthlyPaymentCapacity ?? 0), monthlyIncome);
  const equityRatioPercent = percentRatio(ownContribution, estimatedBudget);
  const cashReserveMonths = monthlyIncome && availableSavings !== undefined
    ? Math.round((availableSavings / monthlyIncome) * 10) / 10
    : undefined;
  const affordabilityScore = financingDraftScore(draft, estimatedBudget);

  return {
    ...base,
    mode: draft.mode,
    readiness: financingReadinessFromDraft(draft),
    paymentPrinciple: 'Objectif Buildify : structurer un financement lisible, protéger l’apport, éviter les avances non sécurisées et déclencher les paiements uniquement par jalons vérifiés.',
    estimatedBudget,
    monthlyIncome,
    baseSalary,
    variableMonthlyIncome,
    otherMonthlyIncome,
    existingMonthlyDebt,
    monthlyPaymentCapacity,
    ownContribution,
    requestedLoanAmount,
    desiredLoanDurationYears,
    availableSavings,
    employmentStatus: draft.employmentStatus || undefined,
    financialSector: draft.financialSector || undefined,
    contractType: draft.contractType || undefined,
    employerName: draft.employerName.trim() || undefined,
    salaryDomiciliationBank: draft.salaryDomiciliationBank.trim() || undefined,
    incomeCurrency: draft.incomeCurrency || undefined,
    incomeStability: draft.incomeStability || undefined,
    householdDependents,
    coBorrowerStatus: draft.coBorrowerStatus || undefined,
    financingOwner: draft.financingOwner || undefined,
    affordabilityScore,
    financialRiskLevel: financialRiskLevel(affordabilityScore, projectedDebtRatioPercent),
    equityRatioPercent,
    cashReserveMonths,
    bankName: draft.bankName.trim() || undefined,
    bankContact: draft.bankContact.trim() || undefined,
    bankAgreementStage: draft.bankAgreementStage || undefined,
    financingPurpose: draft.financingPurpose || undefined,
    downPaymentSource: draft.downPaymentSource || undefined,
    documentReadiness: draft.documentReadiness.length ? draft.documentReadiness : ['none-yet'],
    currentDebtRatioPercent,
    projectedDebtRatioPercent,
    notaryContract: draft.notaryContract,
    escrowRequested: draft.escrowRequested,
    bankSupportRequested: draft.bankSupportRequested,
    landSupportRequested: draft.landSupportRequested,
    notes: draft.notes.trim() || undefined,
    guarantees: [
      ...(draft.notaryContract ? ['notary-contract'] : []),
      ...(draft.escrowRequested ? ['escrow'] : []),
      ...(draft.bankSupportRequested ? ['bank-support'] : []),
    ],
    commitments: ['truthful-data', 'bank-verification', 'progress-payment', 'no-hidden-advance'],
    milestones: buildMilestonesForBudget(base.milestones, estimatedBudget),
    updatedAt: new Date().toISOString(),
  };
}

// ── Sub-views ──────────────────────────────────────────────

const PROJECT_BRIEF_ICONS: Record<ProjectBriefItemKey, LucideIcon> = {
  category: Building2,
  location: MapPin,
  surface: Ruler,
  scope: ClipboardCheck,
  context: Gauge,
  finance: Wallet,
  timeline: Calendar,
};

type ClientActionTone = 'active' | 'done' | 'pending';

interface ClientProjectAction {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  owner: string;
  statusLabel: string;
  tone: ClientActionTone;
  actionLabel: string;
  onClick?: () => void;
}

function ResumeTab({
  data,
  onOpenProposals,
  onOpenFinancing,
  onOpenPlanning,
  onOpenDocuments,
  onOpenMessages,
  onOpenQuotes,
  onOpenSite,
}: {
  data: ProjectDetailData;
  onOpenProposals?: () => void;
  onOpenFinancing?: () => void;
  onOpenPlanning?: () => void;
  onOpenDocuments?: () => void;
  onOpenMessages?: () => void;
  onOpenQuotes?: () => void;
  onOpenSite?: () => void;
}) {
  const infoItems = [
    { icon: Building2, label: 'Type', value: data.categoryName },
    { icon: MapPin, label: 'Localisation', value: data.city },
    { icon: Layers, label: 'Modèle', value: data.modelName },
    { icon: Wallet, label: 'Budget estimé', value: `${FORMAT_XOF(data.budgetMin)} – ${FORMAT_XOF(data.budgetMax)}` },
    { icon: Calendar, label: 'Début prévu', value: data.startDate },
    { icon: Clock, label: 'Fin estimée', value: data.estimatedEnd },
  ];
  const coordinationItems = [
    { icon: Users, label: 'Présence', value: data.clientPresence },
    { icon: Globe2, label: 'Résidence', value: data.clientResidenceCountry },
    { icon: Clock3, label: 'Fuseau', value: data.clientTimeZone },
    { icon: MessageCircle, label: 'Contact', value: data.clientPreferredContactChannel },
    { icon: Calendar, label: 'Créneau', value: data.clientContactWindow },
    { icon: ShieldCheck, label: 'Validation', value: data.remoteDecisionMode },
    { icon: UserRoundCheck, label: 'Mandataire', value: data.representativeName },
    { icon: MessageSquare, label: 'Téléphone mandataire', value: data.representativePhone },
  ].filter((item): item is { icon: LucideIcon; label: string; value: string } => Boolean(item.value));
  const financing = data.financing ?? buildDefaultFinancing(data);
  const score = financing.affordabilityScore ?? 0;
  const riskLabel = FINANCIAL_RISK_LABELS[financing.financialRiskLevel ?? 'unknown'];
  const nextAction = data.status === 'submitted'
    ? 'Analyse initiale Buildify'
    : data.status === 'info_required'
      ? 'Réponse client attendue'
      : data.status === 'quote_sent'
        ? 'Décision sur devis'
        : data.status === 'planning'
          ? 'Planning chantier'
          : data.status === 'in_progress'
            ? 'Suivi chantier'
            : 'Pilotage dossier';
  const nextScheduleItem = data.scheduleItems.find(item => new Date(item.scheduledAt).getTime() >= Date.now()) ?? data.scheduleItems[0];
  const commandItems = [
    { icon: ClipboardCheck, label: 'Étape prioritaire', value: nextAction },
    { icon: Wallet, label: 'Score finance', value: score ? `${score}% - ${riskLabel}` : riskLabel },
    {
      icon: Calendar,
      label: 'Planning',
      value: nextScheduleItem
        ? `${projectScheduleTypeLabel(nextScheduleItem.type)} · ${formatProjectScheduleDate(nextScheduleItem.scheduledAt, nextScheduleItem.timeZone)}`
        : 'Aucun rendez-vous',
    },
    { icon: FolderArchive, label: 'Pièces dossier', value: `${data.documents.length} pièce(s)` },
    { icon: MessageSquare, label: 'Communication', value: data.messages.length ? `${data.messages.length} échange(s)` : 'Canal ouvert' },
  ];
  const proposals = data.visualProposals?.length
    ? data.visualProposals.map(normalizeVisualProposal)
    : buildVisualProposals(data);
  const proposalPreview = data.visualProposal ? normalizeVisualProposal(data.visualProposal) : proposals[0];
  const technicalBriefItems = data.technicalBrief.items;
  const technicalBriefChips = data.technicalBrief.chips;
  const financeReady = score >= 65 || financing.readiness === 'confirmed';
  const documentsReady = data.documents.length >= 2;
  const hasInfoRequest = data.status === 'info_required';
  const pendingQuote = data.quotes.find(quote => quote.status === 'pending');
  const acceptedQuote = data.quotes.find(quote => quote.status === 'accepted');
  const hasConfirmedSchedule = data.scheduleItems.some(item => item.status === 'confirmed');
  const hasAnySchedule = data.scheduleItems.length > 0;
  const chantierStarted = data.status === 'in_progress' || data.status === 'delivered' || data.siteUpdates.length > 0;
  const clientActionItems: ClientProjectAction[] = [
    {
      id: 'messages',
      icon: MessageSquare,
      title: hasInfoRequest ? 'Répondre à la demande Buildify' : 'Garder le canal projet ouvert',
      description: hasInfoRequest
        ? 'Une information est attendue pour débloquer l’analyse, le devis ou le planning.'
        : 'Tous les échanges utiles restent centralisés dans le dossier Buildify.',
      owner: hasInfoRequest ? 'Client' : 'Client + Buildify',
      statusLabel: hasInfoRequest ? 'Prioritaire' : data.messages.length ? 'Actif' : 'Ouvert',
      tone: hasInfoRequest ? 'active' : 'pending',
      actionLabel: 'Ouvrir échanges',
      onClick: onOpenMessages,
    },
    {
      id: 'finance',
      icon: Wallet,
      title: financeReady ? 'Financement lisible' : 'Renforcer le dossier financier',
      description: financeReady
        ? 'La capacité déclarée permet de préparer les jalons, la banque ou le contrat.'
        : 'Complétez salaire, charges, apport, banque et pièces pour éviter un engagement flou.',
      owner: 'Client',
      statusLabel: financeReady ? 'Cadré' : 'À compléter',
      tone: financeReady ? 'done' : 'active',
      actionLabel: 'Ouvrir finance',
      onClick: onOpenFinancing,
    },
    {
      id: 'documents',
      icon: FolderArchive,
      title: documentsReady ? 'Pièces projet disponibles' : 'Ajouter les pièces du dossier',
      description: documentsReady
        ? 'Les documents transmis permettent de sécuriser l’étude et les décisions.'
        : 'Plans, photos, titre foncier, devis existant ou justificatifs accélèrent la qualification.',
      owner: 'Client',
      statusLabel: documentsReady ? 'Reçu' : `${data.documents.length} pièce(s)`,
      tone: documentsReady ? 'done' : 'active',
      actionLabel: 'Ouvrir pièces',
      onClick: onOpenDocuments,
    },
    {
      id: 'proposal',
      icon: Eye,
      title: data.visualProposal ? 'Proposition visuelle validée' : 'Choisir une proposition visuelle',
      description: data.visualProposal
        ? 'La base visuelle est retenue pour préparer le chiffrage et la suite du dossier.'
        : 'Comparez les images proposées, téléchargez la fiche et validez une orientation.',
      owner: data.visualProposal ? 'Buildify' : 'Client',
      statusLabel: data.visualProposal ? 'Validée' : proposals.length ? `${proposals.length} option(s)` : 'À publier',
      tone: data.visualProposal ? 'done' : proposals.length ? 'active' : 'pending',
      actionLabel: 'Voir visuels',
      onClick: onOpenProposals,
    },
    {
      id: 'quote',
      icon: Receipt,
      title: pendingQuote ? 'Décider sur le devis' : acceptedQuote ? 'Devis accepté' : 'Attendre le devis détaillé',
      description: pendingQuote
        ? 'Le devis est prêt à lire, télécharger, accepter ou refuser depuis l’espace client.'
        : acceptedQuote
          ? 'Le projet peut passer vers contrat, planning et jalons de paiement.'
          : 'Buildify prépare un chiffrage clair avec périmètre, hypothèses et modalités.',
      owner: pendingQuote ? 'Client' : 'Buildify',
      statusLabel: pendingQuote ? 'Décision' : acceptedQuote ? 'Accepté' : 'À venir',
      tone: pendingQuote ? 'active' : acceptedQuote ? 'done' : 'pending',
      actionLabel: 'Ouvrir devis',
      onClick: onOpenQuotes,
    },
    {
      id: 'planning',
      icon: Calendar,
      title: hasAnySchedule ? 'Planning publié' : 'Planifier la prochaine étape',
      description: hasAnySchedule
        ? 'Confirmez le rendez-vous, demandez un report ou vérifiez les préparatifs.'
        : 'Les visites, réunions et validations apparaîtront ici dès publication.',
      owner: hasAnySchedule && !hasConfirmedSchedule ? 'Client' : 'Buildify',
      statusLabel: hasConfirmedSchedule ? 'Confirmé' : hasAnySchedule ? 'À confirmer' : 'À programmer',
      tone: hasConfirmedSchedule ? 'done' : hasAnySchedule ? 'active' : 'pending',
      actionLabel: 'Ouvrir planning',
      onClick: onOpenPlanning,
    },
    {
      id: 'site',
      icon: Camera,
      title: chantierStarted ? 'Suivre le chantier' : 'Préparer le suivi chantier',
      description: chantierStarted
        ? 'Photos, rapports et avancement sont disponibles pour suivre chaque jalon.'
        : 'Le suivi chantier s’activera après contrat, planning et démarrage opérationnel.',
      owner: 'Buildify',
      statusLabel: chantierStarted ? 'En suivi' : 'À venir',
      tone: chantierStarted ? 'active' : 'pending',
      actionLabel: 'Ouvrir chantier',
      onClick: onOpenSite,
    },
  ];
  const remoteSummaryItems = [
    {
      icon: Globe2,
      label: 'Pays / fuseau',
      value: data.clientResidenceCountry || 'À préciser',
      helper: data.clientTimeZone || 'Fuseau à confirmer pour les rendez-vous',
    },
    {
      icon: MessageCircle,
      label: 'Canal officiel',
      value: data.clientPreferredContactChannel || 'E-mail recommandé',
      helper: data.clientContactWindow || 'Téléphone accepté avec indicatif pays',
    },
    {
      icon: UserRoundCheck,
      label: 'Relais terrain',
      value: data.representativeName || 'Mandataire à renseigner',
      helper: data.representativePhone || 'Contact local utile pour visite, photos et contrôle',
    },
    {
      icon: ShieldCheck,
      label: 'Mode de validation',
      value: data.remoteDecisionMode || 'Validation écrite conseillée',
      helper: 'Chaque décision importante reste confirmée avant action',
    },
  ];
  const remoteActionItems = [
    {
      icon: MessageSquare,
      label: 'Coordonnées',
      detail: data.clientPreferredContactChannel ? 'Canal de contact disponible.' : 'Précisez e-mail, téléphone et canal préféré.',
      actionLabel: 'Écrire',
      onClick: onOpenMessages,
      done: Boolean(data.clientPreferredContactChannel),
    },
    {
      icon: Calendar,
      label: 'Rendez-vous',
      detail: nextScheduleItem ? formatProjectScheduleDate(nextScheduleItem.scheduledAt, nextScheduleItem.timeZone) : 'Programmer une visio, un appel ou une visite terrain.',
      actionLabel: 'Planning',
      onClick: onOpenPlanning,
      done: Boolean(nextScheduleItem),
    },
    {
      icon: FolderArchive,
      label: 'Pièces utiles',
      detail: documentsReady ? 'Les premières pièces sont disponibles.' : 'Ajoutez plans, titre, photos et justificatifs financiers.',
      actionLabel: 'Pièces',
      onClick: onOpenDocuments,
      done: documentsReady,
    },
    {
      icon: Wallet,
      label: 'Finance diaspora',
      detail: financeReady ? 'Capacité lisible pour préparer banque et jalons.' : 'Complétez revenus, charges, apport et banque.',
      actionLabel: 'Finance',
      onClick: onOpenFinancing,
      done: financeReady,
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="py-0 gap-0 border-foreground/10">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pilotage projet</p>
              <h3 className="mt-1 text-lg font-bold leading-tight">{nextAction}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {data.referenceNumber} · {PROJECT_STATUS_LABELS[data.status] || data.status}
              </p>
            </div>
            <div className="min-w-48 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Complétude</span>
                <span>{Math.max(data.progress, score || 0)}%</span>
              </div>
              <Progress value={Math.max(data.progress, score || 0)} className="mt-2 h-2" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {commandItems.map(item => (
              <div key={item.label} className="flex min-w-0 items-start gap-2 rounded-lg border p-3">
                <item.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold break-words">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-6">
            <Button variant="outline" className="h-11 gap-2" onClick={onOpenFinancing}>
              <Wallet className="size-4" />
              Finance
            </Button>
            <Button variant="outline" className="h-11 gap-2" onClick={onOpenPlanning}>
              <Calendar className="size-4" />
              Planning
            </Button>
            <Button variant="outline" className="h-11 gap-2" onClick={onOpenDocuments}>
              <FolderArchive className="size-4" />
              Pièces
            </Button>
            <Button variant="outline" className="h-11 gap-2" onClick={onOpenMessages}>
              <MessageSquare className="size-4" />
              Échanges
            </Button>
            <Button variant="outline" className="h-11 gap-2" onClick={onOpenProposals}>
              <Eye className="size-4" />
              Visuels
            </Button>
            <Button variant="outline" className="h-11 gap-2" onClick={onOpenSite}>
              <Camera className="size-4" />
              Chantier
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="py-0 gap-0 border-foreground/10">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plan d’action client</h4>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Les prochaines décisions du dossier, avec le responsable et l’espace à ouvrir.
              </p>
            </div>
            <Badge variant="outline" className="w-fit">
              {clientActionItems.filter(item => item.tone === 'active').length} priorité(s)
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {clientActionItems.map(item => {
              const Icon = item.icon;
              const isActive = item.tone === 'active';
              return (
                <div
                  key={item.id}
                  className={`flex min-h-[172px] flex-col rounded-lg border p-3 ${
                    isActive ? 'border-foreground bg-foreground text-background' : 'bg-background'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${isActive ? 'bg-background/15' : 'bg-muted'}`}>
                      <Icon className={`size-4 ${isActive ? 'text-background' : 'text-muted-foreground'}`} />
                    </span>
                    <Badge variant={item.tone === 'done' ? 'default' : 'outline'} className={`shrink-0 text-[10px] ${isActive ? 'border-background/30 text-background' : ''}`}>
                      {item.statusLabel}
                    </Badge>
                  </div>
                  <div className="mt-3 min-w-0 flex-1">
                    <p className="text-sm font-bold leading-5">{item.title}</p>
                    <p className={`mt-2 text-xs leading-5 ${isActive ? 'text-background/75' : 'text-muted-foreground'}`}>
                      {item.description}
                    </p>
                    <p className={`mt-2 text-[10px] font-semibold uppercase tracking-wider ${isActive ? 'text-background/65' : 'text-muted-foreground'}`}>
                      Responsable · {item.owner}
                    </p>
                  </div>
                  <Button
                    variant={isActive ? 'secondary' : 'outline'}
                    size="sm"
                    className="mt-3 h-9 w-full gap-1.5 text-xs"
                    onClick={item.onClick}
                  >
                    {item.actionLabel}
                    <ArrowLeft className="size-3 rotate-180" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="py-0 gap-0 border-foreground/10">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Coordination multi-pays</h4>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Un dossier peut être suivi depuis l’étranger avec e-mail recommandé, téléphone à indicatif pays, mandataire local et validations écrites.
              </p>
            </div>
            <Badge variant="outline" className="w-fit">
              {remoteActionItems.filter(item => item.done).length}/4 sécurisé
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {remoteSummaryItems.map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-lg border bg-background p-3">
                  <Icon className="size-4 text-muted-foreground" />
                  <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                  <p className="mt-1 break-words text-sm font-bold">{item.value}</p>
                  <p className="mt-2 text-[11px] leading-4 text-muted-foreground">{item.helper}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {remoteActionItems.map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex min-h-[132px] flex-col rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <Badge variant={item.done ? 'default' : 'outline'} className="text-[10px]">
                      {item.done ? 'OK' : 'À compléter'}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm font-semibold">{item.label}</p>
                  <p className="mt-1 flex-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                  <Button type="button" variant="outline" size="sm" className="mt-3 h-9 gap-1.5 text-xs" onClick={item.onClick}>
                    {item.actionLabel}
                    <ArrowLeft className="size-3 rotate-180" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {infoItems.map((item) => (
          <Card key={item.label} className="py-0 gap-0">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="size-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <item.icon className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{item.label}</p>
                <p className="text-sm font-medium mt-0.5 break-words">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="py-0 gap-0 border-foreground/10">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Brief technique</h4>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Surfaces, lots, contraintes et priorités déclarés dans le formulaire.
              </p>
            </div>
            <Badge variant="outline" className="w-fit">{technicalBriefChips.length} point(s)</Badge>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {technicalBriefItems.map(item => {
              const Icon = PROJECT_BRIEF_ICONS[item.key];
              return (
                <div key={item.key} className="flex min-w-0 items-start gap-3 rounded-lg border bg-background p-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold break-words">{item.value}</p>
                    {item.helper && <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{item.helper}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {technicalBriefChips.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {technicalBriefChips.map(chip => (
                <div key={chip} className="min-h-10 rounded-lg border bg-muted/30 px-3 py-2 text-xs font-medium leading-5 break-words">
                  {chip}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Terrain */}
      <Card className="py-0 gap-0">
        <CardContent className="p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Terrain</h4>
          <p className="text-sm font-medium mt-2">{data.terrain}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <div className={`size-2 rounded-full ${data.terrainStatus.includes('Acquis') ? 'bg-foreground' : 'bg-muted-foreground/40'}`} />
            <span className="text-xs text-muted-foreground">{data.terrainStatus}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="py-0 gap-0">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Planning</h4>
              <p className="mt-1 text-sm font-semibold">
                {nextScheduleItem ? nextScheduleItem.title : 'Aucun rendez-vous programmé'}
              </p>
            </div>
            <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={onOpenPlanning}>
              <Calendar className="size-3.5" />
              Ouvrir
            </Button>
          </div>
          {nextScheduleItem ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg border p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Date</p>
                <p className="mt-1 text-xs font-semibold">{formatProjectScheduleDate(nextScheduleItem.scheduledAt, nextScheduleItem.timeZone)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Mode</p>
                <p className="mt-1 text-xs font-semibold">{projectScheduleModeLabel(nextScheduleItem.mode)}</p>
              </div>
            </div>
          ) : (
            <p className="mt-3 rounded-lg border border-dashed p-3 text-sm leading-6 text-muted-foreground">
              Buildify publiera ici les rendez-vous, visites techniques, réunions chantier et validations à distance.
            </p>
          )}
        </CardContent>
      </Card>

      {coordinationItems.length > 0 && (
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Coordination client</h4>
              {data.representativeRelation && (
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  {data.representativeRelation}
                </Badge>
              )}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {coordinationItems.map(item => (
                <div key={item.label} className="flex min-w-0 items-start gap-2 rounded-lg border p-3">
                  <item.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-sm font-medium break-words">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {proposalPreview && (
        <Card className="py-0 gap-0 overflow-hidden border-foreground/10">
          <div className="grid gap-0 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="relative min-h-52 bg-muted md:min-h-full">
              <NextImage
                src={proposalPreview.image}
                alt={proposalPreview.title}
                fill
                className="object-cover"
                loading="eager"
                sizes="(min-width: 768px) 45vw, 100vw"
              />
              <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                <Badge className="bg-white text-black hover:bg-white">Propositions</Badge>
                {data.visualProposal && (
                  <Badge className="gap-1 bg-white text-black hover:bg-white">
                    <CheckCircle2 className="size-3" />
                    Validée
                  </Badge>
                )}
              </div>
            </div>
            <CardContent className="p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Propositions visuelles client</p>
              <h3 className="mt-2 text-lg font-bold leading-tight">{proposalPreview.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Consultez les variantes proposées, téléchargez l’image ou la fiche complète, puis validez le choix à rattacher au dossier.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Variantes</p>
                  <p className="mt-1 font-bold">{proposals.length}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">État</p>
                  <p className="mt-1 font-bold">{data.visualProposal ? 'Validée' : 'À choisir'}</p>
                </div>
              </div>
              <Button className="mt-4 w-full gap-2" onClick={onOpenProposals}>
                <Eye className="size-4" />
                Voir les propositions
              </Button>
            </CardContent>
          </div>
        </Card>
      )}

      {/* Team */}
      {data.team.length > 0 && (
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Users className="size-3.5" />
              Équipe assignée
            </h4>
            <div className="mt-3 space-y-2.5">
              {data.team.map((member) => (
                <div key={member.name} className="flex items-start gap-3 rounded-lg border p-3">
                  {member.photoUrl ? (
                    <img src={member.photoUrl} alt={member.name} className="size-12 shrink-0 rounded-lg object-cover grayscale" />
                  ) : (
                    <div className="size-12 rounded-lg bg-muted flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {member.role}{member.department ? ` · ${member.department}` : ''}
                    </p>
                    {member.bio && <p className="mt-1 text-xs leading-5 text-muted-foreground">{member.bio}</p>}
                    {(member.email || member.phone) && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {member.email && <Badge variant="outline" className="max-w-full truncate text-[10px]">{member.email}</Badge>}
                        {member.phone && <Badge variant="outline" className="text-[10px]">{member.phone}</Badge>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DocumentsTab({ data, onUpload }: { data: ProjectDetailData; onUpload?: (documents: ProjectDocumentData[]) => void }) {
  const [uploadedByProject, setUploadedByProject] = useState<Record<string, ProjectDetailData['documents']>>({});
  const inputId = `document-upload-${data.referenceNumber.replace(/[^a-z0-9]/gi, '-')}`;
  const uploadedDocuments = uploadedByProject[data.referenceNumber] ?? [];
  const documents = [...uploadedDocuments, ...data.documents];

  const docTypeLabels: Record<string, string> = {
    plan: 'Plans',
    photo: 'Photos',
    contrat: 'Contrats',
    facture: 'Factures',
    document: 'Documents importés',
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    if (files.length === 0) return;

    const uploadDate = new Date().toISOString().slice(0, 10);
    const uploadedRecords: ProjectDocumentData[] = files.map((file) => ({
      id: `upload-${data.referenceNumber}-${file.name}-${Date.now()}`,
      type: file.type.startsWith('image/') ? 'photo' : 'document',
      name: file.name,
      date: uploadDate,
      url: URL.createObjectURL(file),
      size: file.size,
    }));
    const uploadedDocs: ProjectDetailData['documents'] = uploadedRecords.map((document) => ({
      id: document.id,
      type: document.type,
      name: document.name,
      date: document.date,
      size: document.size,
      url: document.url,
      icon: getDocumentIcon(document.type, document.name),
    }));

    if (onUpload) {
      onUpload(uploadedRecords);
    } else {
      setUploadedByProject(prev => ({
        ...prev,
        [data.referenceNumber]: [...uploadedDocs, ...(prev[data.referenceNumber] ?? [])],
      }));
    }
    event.currentTarget.value = '';
  };

  const grouped = documents.reduce<Record<string, ProjectDetailData['documents']>>((acc, doc) => {
    const key = doc.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(doc);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <input
        id={inputId}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        className="sr-only"
        onChange={handleUpload}
      />
      <Button variant="outline" className="w-full gap-2 border-dashed cursor-pointer" asChild>
        <label htmlFor={inputId}>
          <Upload className="size-4" />
          Importer un document
        </label>
      </Button>

      {Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <FolderArchive className="size-8 text-muted-foreground/30" />
          <p className="mt-3 text-sm text-muted-foreground">Aucun document pour le moment.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([type, docs]) => (
          <div key={type}>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {docTypeLabels[type] || type} ({docs.length})
            </h4>
            <div className="space-y-2">
              {docs.map((doc, i) => (
                <Card key={`${doc.name}-${doc.date}-${i}`} className="py-0 gap-0">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="size-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <doc.icon className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{doc.name}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                          <span className="rounded-md bg-muted px-2 py-1">{doc.date}</span>
                          <span className="rounded-md bg-muted px-2 py-1">{documentTypeLabel(doc.type)}</span>
                          <span className="rounded-md bg-muted px-2 py-1">{formatDocumentSize(doc.size)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadDocumentReceipt(doc, data)}>
                        <Download className="size-3.5" />
                        Télécharger la fiche
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadOriginalDocument(doc)} disabled={!doc.url}>
                        <FolderArchive className="size-3.5" />
                        Original
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function MessagesTab({ data, onSend }: { data: ProjectDetailData; onSend?: (message: string, mode: 'info' | 'message') => void }) {
  const addToast = useAppStore(state => state.addToast);
  const [newMessage, setNewMessage] = useState('');
  const [localMessages, setLocalMessages] = useState(data.messages);
  const hasActiveInfoRequest = data.status === 'info_required' && data.messages.some(message => !message.isOwn);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const text = newMessage.trim();
    const msg = {
      id: `m-${Date.now()}`,
      sender: 'Vous',
      senderRole: 'Client',
      text,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
    };
    setLocalMessages(prev => [...prev, msg]);
    setNewMessage('');
    onSend?.(text, hasActiveInfoRequest ? 'info' : 'message');
    if (onSend) {
      addToast(hasActiveInfoRequest ? 'Information transmise à Buildify.' : 'Message transmis au dossier.', 'success');
    }
  };

  return (
    <div className="flex flex-col h-[60vh]">
      {/* Messages list */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-3">
        {localMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="size-8 text-muted-foreground/30" />
            <p className="mt-3 text-sm text-muted-foreground">Aucun message pour le moment.</p>
          </div>
        ) : (
          localMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  msg.isOwn
                    ? 'bg-foreground text-background rounded-br-md'
                    : 'bg-muted rounded-bl-md'
                }`}
              >
                {!msg.isOwn && (
                  <p className="text-[10px] font-semibold mb-0.5 opacity-60">{msg.sender} – {msg.senderRole}</p>
                )}
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p className={`text-[10px] mt-1 ${msg.isOwn ? 'text-right opacity-60' : 'opacity-40'}`}>
                  {msg.time}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="border-t pt-3 flex gap-2">
        <Textarea
          placeholder={hasActiveInfoRequest ? 'Répondez avec les informations demandées...' : 'Votre message...'}
          className="min-h-[44px] max-h-24 resize-none text-sm"
          rows={1}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          size="icon"
          className="h-11 w-11 flex-shrink-0"
          onClick={handleSend}
          disabled={!newMessage.trim()}
          aria-label={hasActiveInfoRequest ? 'Compléter le dossier' : 'Envoyer le message'}
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function ProposalsTab({
  data,
  onValidate,
}: {
  data: ProjectDetailData;
  onValidate?: (proposal: Omit<ProjectVisualProposalData, 'validatedAt' | 'validatedBy'>) => void;
}) {
  const addToast = useAppStore(state => state.addToast);
  const proposals = useMemo(
    () => data.visualProposals?.length
      ? data.visualProposals.map(normalizeVisualProposal)
      : buildVisualProposals(data),
    [data]
  );
  const storageKey = getProposalStorageKey(data.referenceNumber);
  const [selectedId, setSelectedId] = useState(proposals[0]?.id ?? '');
  const [localValidatedId, setLocalValidatedId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const savedId = window.localStorage.getItem(storageKey);
    return savedId && proposals.some((proposal) => proposal.id === savedId) ? savedId : null;
  });

  const selectedProposal = proposals.find((proposal) => proposal.id === selectedId) ?? proposals[0];
  const validatedId = data.visualProposal?.id || localValidatedId;
  const validatedProposal = proposals.find((proposal) => proposal.id === validatedId)
    ?? (data.visualProposal ? normalizeVisualProposal(data.visualProposal) : undefined);

  const handleValidate = () => {
    if (!selectedProposal) return;
    window.localStorage.setItem(storageKey, selectedProposal.id);
    setLocalValidatedId(selectedProposal.id);
    onValidate?.(buildStoredVisualProposal(selectedProposal, data));
    addToast('Proposition visuelle validée et rattachée au dossier.', 'success');
  };

  if (!selectedProposal) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <ImageIcon className="size-8 text-muted-foreground/30" />
        <p className="mt-3 text-sm text-muted-foreground">Aucune proposition visuelle disponible.</p>
      </div>
    );
  }

  const selectedCriteria = proposalDecisionCriteria(selectedProposal, data);
  const selectedScope = proposalTechnicalScope(selectedProposal, data);
  const selectedRisks = proposalRiskControls(selectedProposal, data);
  const selectedNextSteps = proposalNextSteps(selectedProposal);
  const selectedCommitment = proposalClientCommitment(selectedProposal, data);
  const selectedDecisionScore = proposalDecisionScore(selectedProposal, data);
  const selectedDecisionLabel = proposalDecisionLabel(selectedDecisionScore);

  return (
    <div className="space-y-4">
      <Card className="py-0 gap-0 overflow-hidden">
        <div className="relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-[21/9] bg-muted">
          <NextImage
            src={selectedProposal.image}
            alt={selectedProposal.title}
            fill
            className="object-cover"
            loading="eager"
            sizes="(min-width: 1024px) 1120px, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge className="bg-white text-black hover:bg-white">{selectedProposal.category}</Badge>
              <span className="rounded-md border border-white/35 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/85">
                {selectedProposal.confidence}
              </span>
              <span className="rounded-md bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-black">
                Score {selectedDecisionScore}% · {selectedDecisionLabel}
              </span>
            </div>
            <h3 className="text-lg sm:text-2xl font-semibold leading-tight">{selectedProposal.title}</h3>
            <p className="mt-2 max-w-3xl text-xs sm:text-sm text-white/82 leading-relaxed">
              {selectedProposal.description}
            </p>
          </div>
        </div>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <div className="rounded-lg border bg-foreground p-3 text-background">
              <div className="flex items-center gap-2">
                <Gauge className="size-4" />
                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Lecture</p>
              </div>
              <p className="mt-2 text-lg font-bold">{selectedDecisionScore}%</p>
              <p className="mt-1 text-xs opacity-80">{selectedDecisionLabel}</p>
            </div>
            {selectedCriteria.map(item => (
              <div key={item.label} className="rounded-lg border bg-muted/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-sm font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <div className="rounded-lg border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Périmètre technique</p>
              <ul className="mt-2 space-y-1.5 text-xs leading-5 text-muted-foreground">
                {selectedScope.map(item => <li key={item}>• {item}</li>)}
              </ul>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Points de vigilance</p>
              <ul className="mt-2 space-y-1.5 text-xs leading-5 text-muted-foreground">
                {selectedRisks.map(item => <li key={item}>• {item}</li>)}
              </ul>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Après validation</p>
              <ul className="mt-2 space-y-1.5 text-xs leading-5 text-muted-foreground">
                {selectedNextSteps.map(item => <li key={item}>• {item}</li>)}
              </ul>
            </div>
          </div>

          <div className="mt-4 rounded-lg border bg-muted/35 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ce que la validation signifie</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{selectedCommitment}</p>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto gap-2" asChild>
              <a href={selectedProposal.image} download={`${selectedProposal.id}.png`}>
                <Download className="size-4" />
                Télécharger l’image
              </a>
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto gap-2"
              onClick={() => downloadProposalSheet(selectedProposal, data)}
            >
              <Receipt className="size-4" />
              Télécharger la fiche
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto gap-2"
              onClick={() => downloadProposalPortfolio(proposals, selectedProposal, data)}
            >
              <FolderArchive className="size-4" />
              Dossier comparatif
            </Button>
            <ConfirmActionDialog
              title="Valider cette proposition visuelle ?"
              description={`Cette validation retient "${selectedProposal.title}" pour le dossier ${data.referenceNumber}. Elle servira de base pour le chiffrage, les arbitrages techniques et la suite du contrat.`}
              confirmLabel="Valider"
              onConfirm={handleValidate}
              trigger={(
                <Button
                  className="w-full sm:w-auto gap-2"
                  disabled={validatedId === selectedProposal.id}
                >
                  {validatedId === selectedProposal.id ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <ShieldCheck className="size-4" />
                  )}
                  {validatedId === selectedProposal.id ? 'Proposition validée' : 'Valider cette proposition'}
                </Button>
              )}
            />
          </div>

          {validatedProposal && (
            <div className="mt-4 rounded-lg border border-foreground/20 bg-muted/40 p-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="size-4 mt-0.5 text-foreground" />
                <div>
                  <p className="text-sm font-semibold">Choix client enregistré pour {data.referenceNumber}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Proposition retenue : {validatedProposal.title}. Cette validation est reliée au dossier pour préparer le chiffrage, le contrat et le planning.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="py-0 gap-0">
        <CardContent className="p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold">Comparatif rapide</h3>
              <p className="mt-1 text-xs text-muted-foreground">Comparez les variantes avant de télécharger ou valider.</p>
            </div>
            <Badge variant="outline">{proposals.length} propositions</Badge>
          </div>
          <div className="mt-4 space-y-2 md:hidden">
            {proposals.map(proposal => (
              <button
                key={proposal.id}
                type="button"
                onClick={() => setSelectedId(proposal.id)}
                className={`grid w-full grid-cols-[96px_minmax(0,1fr)] gap-3 rounded-lg border p-2 text-left ${
                  proposal.id === selectedProposal.id ? 'border-foreground bg-muted/35' : 'bg-background'
                }`}
              >
                <span className="relative aspect-[4/3] overflow-hidden rounded-md bg-muted">
                  <NextImage
                    src={proposal.image}
                    alt={proposal.title}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight">{proposal.title}</span>
                  <span className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">{proposal.estimate}</span>
                    <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">{proposal.duration}</span>
                  </span>
                  <span className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Gauge className="size-3.5" />
                    {proposalDecisionScore(proposal, data)}% · {proposalDecisionLabel(proposalDecisionScore(proposal, data))}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <div className="mt-4 hidden overflow-x-auto md:block">
            <div className="min-w-[760px] rounded-lg border">
              <div className="grid grid-cols-[1.55fr_0.75fr_0.75fr_0.7fr_0.95fr] border-b bg-muted/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Proposition</span>
                <span>Budget</span>
                <span>Délai</span>
                <span>Score</span>
                <span>Décision</span>
              </div>
              {proposals.map(proposal => {
                const proposalScore = proposalDecisionScore(proposal, data);
                return (
                  <button
                    key={proposal.id}
                    type="button"
                    onClick={() => setSelectedId(proposal.id)}
                    className={`grid w-full grid-cols-[1.55fr_0.75fr_0.75fr_0.7fr_0.95fr] items-center gap-3 border-b px-3 py-3 text-left text-xs last:border-b-0 ${
                      proposal.id === selectedProposal.id ? 'bg-muted/40' : 'hover:bg-muted/25'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                        <NextImage
                          src={proposal.image}
                          alt={proposal.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{proposal.title}</span>
                        <span className="mt-1 block truncate text-muted-foreground">{proposal.category}</span>
                      </span>
                    </span>
                    <span className="text-muted-foreground">{proposal.estimate}</span>
                    <span className="text-muted-foreground">{proposal.duration}</span>
                    <span className="font-semibold">{proposalScore}%</span>
                    <span className="text-muted-foreground">{proposalDecisionLabel(proposalScore)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {proposals.map((proposal) => {
          const isSelected = proposal.id === selectedProposal.id;
          const isValidated = proposal.id === validatedId;
          const proposalScore = proposalDecisionScore(proposal, data);

          return (
            <Card
              key={proposal.id}
              className={`py-0 gap-0 overflow-hidden transition ${
                isSelected ? 'border-foreground shadow-md' : 'hover:border-foreground/45'
              }`}
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setSelectedId(proposal.id)}
                aria-pressed={isSelected}
              >
                <div className="relative aspect-[16/10] bg-muted">
                  <NextImage
                    src={proposal.image}
                    alt={proposal.title}
                    fill
                    className="object-cover"
                    loading="eager"
                    sizes="(min-width: 768px) 33vw, 100vw"
                  />
                  <div className="absolute left-2 top-2 flex gap-1.5">
                    {isValidated && (
                      <Badge className="bg-white text-black hover:bg-white">
                        <CheckCircle2 className="size-3" />
                        Validée
                      </Badge>
                    )}
                    {isSelected && !isValidated && (
                      <Badge variant="secondary">
                        <Eye className="size-3" />
                        Consultée
                      </Badge>
                    )}
                  </div>
                  <div className="absolute bottom-2 right-2 rounded-md bg-white px-2 py-1 text-[10px] font-bold text-black shadow-sm">
                    {proposalScore}%
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">{proposal.category}</p>
                  <h4 className="mt-1 text-sm font-semibold leading-tight">{proposal.title}</h4>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                    <span className="rounded-md bg-muted px-2 py-1">{proposal.estimate}</span>
                    <span className="rounded-md bg-muted px-2 py-1">{proposal.duration}</span>
                  </div>
                  <div className="mt-3 hidden flex-wrap gap-1.5 sm:flex">
                    {proposal.strengths.map((strength) => (
                      <span
                        key={strength}
                        className="rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground"
                      >
                        {strength}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function FinancingTab({
  data,
  onUpdate,
}: {
  data: ProjectDetailData;
  onUpdate?: (financing: ProjectFinancingData) => void;
}) {
  const financing = data.financing ?? buildDefaultFinancing(data);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<FinancingDraft>(() => financingDraftFrom(financing));
  const flags = [
    { label: 'Contrat notarié', active: financing.notaryContract },
    { label: 'Compte bloqué / séquestre', active: financing.escrowRequested },
    { label: 'Aide banque', active: financing.bankSupportRequested },
    { label: 'Aide terrain', active: financing.landSupportRequested },
  ];
  const score = financing.affordabilityScore ?? 0;
  const riskLabel = FINANCIAL_RISK_LABELS[financing.financialRiskLevel ?? 'unknown'];
  const profileItems = [
    { label: 'Situation', value: financingDetailLabel(financing.employmentStatus, EMPLOYMENT_STATUS_LABELS) },
    { label: 'Secteur', value: financingDetailLabel(financing.financialSector, FINANCIAL_SECTOR_LABELS) },
    { label: 'Contrat', value: financingDetailLabel(financing.contractType, CONTRACT_TYPE_LABELS) },
    { label: 'Devise revenus', value: financing.incomeCurrency || 'À compléter' },
    { label: 'Stabilité', value: financingDetailLabel(financing.incomeStability, INCOME_STABILITY_LABELS) },
    { label: 'Porteur', value: financingDetailLabel(financing.financingOwner, FINANCING_OWNER_LABELS) },
    { label: 'Co-emprunteur', value: financingDetailLabel(financing.coBorrowerStatus, CO_BORROWER_LABELS) },
    { label: 'Personnes à charge', value: financing.householdDependents !== undefined ? `${financing.householdDependents}` : 'À compléter' },
  ];
  const milestoneTotal = financing.milestones.reduce((total, item) => total + (item.expectedAmount ?? 0), 0);
  const paidAmount = financing.milestones
    .filter(item => item.status === 'paid')
    .reduce((total, item) => total + (item.expectedAmount ?? 0), 0);
  const dueAmount = financing.milestones
    .filter(item => item.status === 'due')
    .reduce((total, item) => total + (item.expectedAmount ?? 0), 0);
  const blockedCount = financing.milestones.filter(item => item.status === 'blocked').length;
  const residualAfterDebt = financing.monthlyIncome !== undefined
    ? financing.monthlyIncome - (financing.existingMonthlyDebt ?? 0)
    : undefined;
  const residualAfterProject = financing.monthlyIncome !== undefined
    ? financing.monthlyIncome - (financing.existingMonthlyDebt ?? 0) - (financing.monthlyPaymentCapacity ?? 0)
    : undefined;
  const fundingGap = financing.estimatedBudget !== undefined
    ? Math.max(0, financing.estimatedBudget - (financing.ownContribution ?? 0) - (financing.requestedLoanAmount ?? 0))
    : undefined;
  const composedIncome = [financing.baseSalary, financing.variableMonthlyIncome, financing.otherMonthlyIncome]
    .filter((value): value is number => value !== undefined)
    .reduce((total, value) => total + value, 0);
  const financeReadinessSteps = [
    {
      label: 'Revenus documentés',
      done: Boolean(financing.monthlyIncome && financing.employmentStatus && financing.incomeStability && financing.contractType),
      detail: financing.monthlyIncome ? amountOrTodo(financing.monthlyIncome) : 'Salaire ou revenu net à saisir',
    },
    {
      label: 'Banque cadrée',
      done: ['under-review', 'pre-approved', 'funds-available'].includes(financing.bankAgreementStage || ''),
      detail: financing.bankName || financingReadinessLabel(financing.readiness),
    },
    {
      label: 'Protection client',
      done: Boolean(financing.notaryContract || financing.escrowRequested),
      detail: financing.notaryContract ? 'Contrat notarié prévu' : financing.escrowRequested ? 'Séquestre demandé' : 'Garantie à confirmer',
    },
    {
      label: 'Paiements par jalons',
      done: financing.milestones.length > 0,
      detail: financing.milestones.length ? `${financing.milestones.length} échéances liées au planning` : 'Échéancier à créer',
    },
  ];
  const financialReadingItems = [
    { label: 'Disponible après charges', value: amountOrTodo(residualAfterDebt), help: 'Revenu moins dettes et charges déjà connues.' },
    { label: 'Reste après projet', value: amountOrTodo(residualAfterProject), help: 'Marge mensuelle après la mensualité cible du projet.' },
    { label: 'Effort projeté', value: percentOrTodo(financing.projectedDebtRatioPercent), help: 'Charges totales projetées par rapport au revenu net.' },
    { label: 'Écart à sécuriser', value: amountOrTodo(fundingGap), help: 'Budget non couvert par l’apport et le financement déclaré.' },
  ];
  const decisionPlan = buildFinancingDecisionPlan(financing, data.budgetMax || data.budgetMin);
  const decisionToneClass = {
    ready: 'border-foreground bg-foreground text-background',
    structure: 'border-foreground/30 bg-muted/40',
    risk: 'border-destructive/40 bg-destructive/5',
    missing: 'border-dashed bg-muted/20',
  }[decisionPlan.tone];
  const decisionMetricIcons: LucideIcon[] = [Calculator, PiggyBank, Gauge, Scale, Wallet, Route];
  const projectedFinancing = buildFinancingFromDraft(financing, draft, data);
  const projectedScore = projectedFinancing.affordabilityScore ?? 0;
  const requiredFinancialFieldsMissing = !draft.employmentStatus
    || !draft.financialSector
    || !draft.contractType
    || !draft.employerName.trim()
    || !draft.incomeCurrency
    || !draft.incomeStability
    || !draft.financingOwner
    || !draft.coBorrowerStatus
    || !draft.bankAgreementStage
    || !draft.financingPurpose
    || !draft.downPaymentSource
    || draftNumber(draft.baseSalary) === undefined
    || financingDraftMonthlyIncome(draft) === undefined
    || draftNumber(draft.existingMonthlyDebt) === undefined
    || draftNumber(draft.monthlyPaymentCapacity) === undefined
    || draftNumber(draft.ownContribution) === undefined
    || draftNumber(draft.requestedLoanAmount) === undefined;

  function setDraftField<K extends keyof FinancingDraft>(key: K, value: FinancingDraft[K]) {
    setDraft(prev => ({ ...prev, [key]: value }));
  }

  function setDraftNumber(key: FinancingNumberField, value: string) {
    setDraft(prev => ({ ...prev, [key]: value === '' ? '' : Number(value) }));
  }

  function toggleDocumentReadiness(value: string) {
    setDraft(prev => {
      const withoutNone = prev.documentReadiness.filter(item => item !== 'none-yet');
      const documentReadiness = withoutNone.includes(value)
        ? withoutNone.filter(item => item !== value)
        : [...withoutNone, value];
      return { ...prev, documentReadiness };
    });
  }

  function handleUpdateFinancing() {
    if (!onUpdate || requiredFinancialFieldsMissing) return;
    onUpdate(projectedFinancing);
    setIsEditing(false);
  }

  return (
    <div className="space-y-4">
      <Card className="py-0 gap-0">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <Badge variant="outline">{financingReadinessLabel(financing.readiness)}</Badge>
              <h3 className="mt-3 text-lg font-semibold">Financement sécurisé par avancement</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{financing.paymentPrinciple}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Mode prévu</p>
              <p className="mt-1 text-sm font-semibold">{financingModeLabel(financing.mode)}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Score financement</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums">{score || '—'}{score ? '%' : ''}</p>
                  <p className="mt-1 text-sm font-semibold">{riskLabel}</p>
                </div>
                <Wallet className="size-5 text-muted-foreground" />
              </div>
              <Progress value={score} className="mt-4 h-2" />
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md border bg-background p-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Apport</p>
                  <p className="mt-1 font-semibold">{percentOrTodo(financing.equityRatioPercent)}</p>
                </div>
                <div className="rounded-md border bg-background p-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Réserve</p>
                  <p className="mt-1 font-semibold">
                    {financing.cashReserveMonths !== undefined ? `${financing.cashReserveMonths} mois` : 'À calculer'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {profileItems.map(item => (
                <div key={item.label} className="rounded-lg border p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold break-words">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Budget base</p>
              <p className="mt-1 text-sm font-semibold">{financing.estimatedBudget ? FORMAT_XOF(financing.estimatedBudget) : 'À estimer'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Revenu déclaré</p>
              <p className="mt-1 text-sm font-semibold">{amountOrTodo(financing.monthlyIncome)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Salaire de base</p>
              <p className="mt-1 text-sm font-semibold">{amountOrTodo(financing.baseSalary)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Revenus variables</p>
              <p className="mt-1 text-sm font-semibold">
                {composedIncome ? FORMAT_XOF((financing.variableMonthlyIncome ?? 0) + (financing.otherMonthlyIncome ?? 0)) : 'À compléter'}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Charges mensuelles</p>
              <p className="mt-1 text-sm font-semibold">{amountOrTodo(financing.existingMonthlyDebt)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Mensualité cible</p>
              <p className="mt-1 text-sm font-semibold">{amountOrTodo(financing.monthlyPaymentCapacity)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Apport</p>
              <p className="mt-1 text-sm font-semibold">{amountOrTodo(financing.ownContribution)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Montant à financer</p>
              <p className="mt-1 text-sm font-semibold">{amountOrTodo(financing.requestedLoanAmount)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Durée souhaitée</p>
              <p className="mt-1 text-sm font-semibold">{financing.desiredLoanDurationYears ? `${financing.desiredLoanDurationYears} an(s)` : 'À compléter'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ratio projeté</p>
              <p className="mt-1 text-sm font-semibold">{percentOrTodo(financing.projectedDebtRatioPercent)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Objet</p>
              <p className="mt-1 text-sm font-semibold">{financingDetailLabel(financing.financingPurpose, FINANCING_PURPOSE_LABELS)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Origine apport</p>
              <p className="mt-1 text-sm font-semibold">{financingDetailLabel(financing.downPaymentSource, DOWN_PAYMENT_SOURCE_LABELS)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Accord banque</p>
              <p className="mt-1 text-sm font-semibold">{financingDetailLabel(financing.bankAgreementStage, BANK_STAGE_LABELS)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Banque</p>
              <p className="mt-1 text-sm font-semibold">{financing.bankName || 'À contacter'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Employeur / activité</p>
              <p className="mt-1 text-sm font-semibold break-words">{financing.employerName || 'À compléter'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Domiciliation salaire</p>
              <p className="mt-1 text-sm font-semibold break-words">{financing.salaryDomiciliationBank || 'À préciser'}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {flags.map(flag => (
              <Badge key={flag.label} variant={flag.active ? 'default' : 'outline'} className="gap-1.5">
                {flag.active ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
                {flag.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className={`py-0 gap-0 border ${decisionToneClass}`}>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <Badge variant={decisionPlan.tone === 'ready' ? 'secondary' : 'outline'} className="w-fit">
                {decisionPlan.label}
              </Badge>
              <h3 className="mt-3 text-lg font-semibold">{decisionPlan.title}</h3>
              <p className={`mt-2 text-sm leading-6 ${decisionPlan.tone === 'ready' ? 'text-background/75' : 'text-muted-foreground'}`}>
                {decisionPlan.summary}
              </p>
            </div>
            <div className={`rounded-lg border p-3 ${decisionPlan.tone === 'ready' ? 'border-background/25 bg-background/10' : 'bg-background'}`}>
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${decisionPlan.tone === 'ready' ? 'text-background/65' : 'text-muted-foreground'}`}>
                Décision Buildify
              </p>
              <p className="mt-1 text-sm font-semibold">{decisionPlan.advisory}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-6">
            {decisionPlan.metrics.map((metric, index) => {
              const MetricIcon = decisionMetricIcons[index] || Calculator;
              return (
                <div key={metric.label} className={`rounded-lg border p-3 ${decisionPlan.tone === 'ready' ? 'border-background/20 bg-background/10' : 'bg-background'}`}>
                  <MetricIcon className={`size-4 ${decisionPlan.tone === 'ready' ? 'text-background/70' : 'text-muted-foreground'}`} />
                  <p className={`mt-3 text-[10px] font-semibold uppercase tracking-wider ${decisionPlan.tone === 'ready' ? 'text-background/65' : 'text-muted-foreground'}`}>
                    {metric.label}
                  </p>
                  <p className="mt-1 text-sm font-bold break-words">{metric.value}</p>
                  <p className={`mt-2 text-[11px] leading-4 ${decisionPlan.tone === 'ready' ? 'text-background/65' : 'text-muted-foreground'}`}>
                    {metric.help}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <div className={`rounded-lg border p-3 ${decisionPlan.tone === 'ready' ? 'border-background/20 bg-background/10' : 'bg-background'}`}>
              <h4 className="text-sm font-semibold">Actions avant engagement</h4>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {decisionPlan.actions.map(action => {
                  const ActionIcon = action.status === 'ok' ? CheckCircle2 : action.status === 'watch' ? Clock3 : AlertCircle;
                  return (
                    <div key={action.label} className={`flex min-w-0 items-start gap-2 rounded-lg border p-3 ${decisionPlan.tone === 'ready' ? 'border-background/20' : ''}`}>
                      <ActionIcon className={`mt-0.5 size-4 shrink-0 ${decisionPlan.tone === 'ready' ? 'text-background/70' : 'text-muted-foreground'}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold">{action.label}</p>
                        <p className={`mt-1 text-[11px] leading-4 ${decisionPlan.tone === 'ready' ? 'text-background/65' : 'text-muted-foreground'}`}>
                          {action.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={`rounded-lg border p-3 ${decisionPlan.tone === 'ready' ? 'border-background/20 bg-background/10' : 'bg-background'}`}>
              <h4 className="text-sm font-semibold">Points de vigilance</h4>
              {decisionPlan.warnings.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {decisionPlan.warnings.slice(0, 4).map(warning => (
                    <div key={warning} className={`rounded-lg border p-3 text-xs leading-5 ${decisionPlan.tone === 'ready' ? 'border-background/20 text-background/75' : 'text-muted-foreground'}`}>
                      {warning}
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`mt-3 rounded-lg border p-3 text-xs leading-5 ${decisionPlan.tone === 'ready' ? 'border-background/20 text-background/75' : 'text-muted-foreground'}`}>
                  Aucun blocage majeur détecté avec les données déclarées. Les montants restent à confirmer par devis, banque et pièces justificatives.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card className="py-0 gap-0">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Lecture financière Buildify</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Le but est de vérifier la capacité réelle avant contrat, sans demander d’avance non sécurisée.
                </p>
              </div>
              <Wallet className="size-4 shrink-0 text-muted-foreground" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {financialReadingItems.map(item => (
                <div key={item.label} className="rounded-lg border p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-sm font-bold">{item.value}</p>
                  <p className="mt-2 text-[11px] leading-4 text-muted-foreground">{item.help}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="py-0 gap-0">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Parcours de sécurisation</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Chaque point prépare le devis, la banque, le notaire et le paiement par niveau d’avancement.
                </p>
              </div>
              <ShieldCheck className="size-4 shrink-0 text-muted-foreground" />
            </div>
            <div className="mt-4 space-y-2">
              {financeReadinessSteps.map((step, index) => (
                <div key={step.label} className="flex gap-3 rounded-lg border p-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-muted/30 text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{step.label}</p>
                      <Badge variant={step.done ? 'default' : 'outline'} className="text-[10px]">
                        {step.done ? 'Prêt' : 'À compléter'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="py-0 gap-0">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold">Profil financier client</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Mettez à jour les revenus, charges, apport, banque et garanties. Ces données servent à sécuriser le devis, le contrat et les jalons.
              </p>
            </div>
            <Button variant={isEditing ? 'secondary' : 'outline'} size="sm" className="h-10" onClick={() => setIsEditing(prev => !prev)}>
              {isEditing ? 'Fermer' : 'Mettre à jour'}
            </Button>
          </div>

          {isEditing && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="finance-mode">Mode</label>
                  <select id="finance-mode" value={draft.mode} onChange={event => setDraftField('mode', event.target.value)} className="h-10 w-full rounded-md border bg-background px-2 text-xs">
                    {FINANCING_MODE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="finance-employment">Situation</label>
                  <select id="finance-employment" value={draft.employmentStatus} onChange={event => setDraftField('employmentStatus', event.target.value)} className="h-10 w-full rounded-md border bg-background px-2 text-xs">
                    <option value="">Choisir</option>
                    {Object.entries(EMPLOYMENT_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="finance-sector">Secteur</label>
                  <select id="finance-sector" value={draft.financialSector} onChange={event => setDraftField('financialSector', event.target.value)} className="h-10 w-full rounded-md border bg-background px-2 text-xs">
                    <option value="">Choisir</option>
                    {Object.entries(FINANCIAL_SECTOR_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="finance-contract-type">Contrat</label>
                  <select id="finance-contract-type" value={draft.contractType} onChange={event => setDraftField('contractType', event.target.value)} className="h-10 w-full rounded-md border bg-background px-2 text-xs">
                    <option value="">Choisir</option>
                    {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="finance-currency">Devise</label>
                  <select id="finance-currency" value={draft.incomeCurrency} onChange={event => setDraftField('incomeCurrency', event.target.value)} className="h-10 w-full rounded-md border bg-background px-2 text-xs">
                    {['XOF', 'EUR', 'USD', 'CAD', 'GBP'].map(currency => <option key={currency} value={currency}>{currency}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="finance-stability">Stabilité</label>
                  <select id="finance-stability" value={draft.incomeStability} onChange={event => setDraftField('incomeStability', event.target.value)} className="h-10 w-full rounded-md border bg-background px-2 text-xs">
                    <option value="">Choisir</option>
                    {Object.entries(INCOME_STABILITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="finance-bank-stage">Banque</label>
                  <select id="finance-bank-stage" value={draft.bankAgreementStage} onChange={event => setDraftField('bankAgreementStage', event.target.value)} className="h-10 w-full rounded-md border bg-background px-2 text-xs">
                    <option value="">Choisir</option>
                    {Object.entries(BANK_STAGE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="finance-owner">Porteur</label>
                  <select id="finance-owner" value={draft.financingOwner} onChange={event => setDraftField('financingOwner', event.target.value)} className="h-10 w-full rounded-md border bg-background px-2 text-xs">
                    <option value="">Choisir</option>
                    {Object.entries(FINANCING_OWNER_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="finance-coborrower">Co-emprunteur</label>
                  <select id="finance-coborrower" value={draft.coBorrowerStatus} onChange={event => setDraftField('coBorrowerStatus', event.target.value)} className="h-10 w-full rounded-md border bg-background px-2 text-xs">
                    <option value="">Choisir</option>
                    {Object.entries(CO_BORROWER_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                {FINANCING_NUMBER_FIELDS.map(({ key, label, placeholder }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor={`finance-${key}`}>{label}</label>
                    <Input
                      id={`finance-${key}`}
                      type="number"
                      min={0}
                      value={numberInputValue(draft[key])}
                      placeholder={placeholder}
                      onChange={event => setDraftNumber(key, event.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>
                ))}
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="finance-employer">Employeur / activité</label>
                  <Input id="finance-employer" value={draft.employerName} onChange={event => setDraftField('employerName', event.target.value)} placeholder="Organisation, entreprise ou activité principale" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="finance-salary-bank">Banque de domiciliation</label>
                  <Input id="finance-salary-bank" value={draft.salaryDomiciliationBank} onChange={event => setDraftField('salaryDomiciliationBank', event.target.value)} placeholder="Banque où arrivent les revenus" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="finance-bank-name">Banque ou organisme</label>
                  <Input id="finance-bank-name" value={draft.bankName} onChange={event => setDraftField('bankName', event.target.value)} placeholder="Ex : Banque partenaire diaspora" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="finance-bank-contact">Contact banque</label>
                  <Input id="finance-bank-contact" value={draft.bankContact} onChange={event => setDraftField('bankContact', event.target.value)} placeholder="Nom, téléphone ou e-mail du conseiller" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="finance-purpose">Objet du financement</label>
                  <select id="finance-purpose" value={draft.financingPurpose} onChange={event => setDraftField('financingPurpose', event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                    <option value="">Choisir</option>
                    {Object.entries(FINANCING_PURPOSE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="finance-down-source">Origine de l’apport</label>
                  <select id="finance-down-source" value={draft.downPaymentSource} onChange={event => setDraftField('downPaymentSource', event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                    <option value="">Choisir</option>
                    {Object.entries(DOWN_PAYMENT_SOURCE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {FINANCING_BOOLEAN_FIELDS.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 rounded-lg border p-3 text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={draft[key]}
                      onChange={event => setDraftField(key, event.target.checked)}
                      className="size-4"
                    />
                    {label}
                  </label>
                ))}
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pièces disponibles</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Cochez uniquement les documents réellement prêts. Buildify s’en sert pour préparer la banque, le notaire et les jalons.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {Object.entries(FINANCING_DOCUMENT_LABELS)
                    .filter(([value]) => value !== 'none-yet')
                    .map(([value, label]) => (
                      <label key={value} className="flex min-h-12 items-center gap-2 rounded-lg border p-3 text-xs font-semibold">
                        <input
                          type="checkbox"
                          checked={draft.documentReadiness.includes(value)}
                          onChange={() => toggleDocumentReadiness(value)}
                          className="size-4 shrink-0"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="finance-notes">Précision financière utile</label>
                <Textarea
                  id="finance-notes"
                  value={draft.notes}
                  onChange={event => setDraftField('notes', event.target.value)}
                  rows={3}
                  placeholder="Préaccord, origine de l’apport, contrainte bancaire, personne à contacter, devise des revenus..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Score prévu</p>
                  <p className="mt-1 text-sm font-bold">{projectedScore}%</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Risque</p>
                  <p className="mt-1 text-xs font-semibold">{FINANCIAL_RISK_LABELS[projectedFinancing.financialRiskLevel ?? 'unknown']}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ratio projeté</p>
                  <p className="mt-1 text-sm font-bold">{percentOrTodo(projectedFinancing.projectedDebtRatioPercent)}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Réserve</p>
                  <p className="mt-1 text-sm font-bold">{projectedFinancing.cashReserveMonths !== undefined ? `${projectedFinancing.cashReserveMonths} mois` : 'À calculer'}</p>
                </div>
              </div>

              {requiredFinancialFieldsMissing && (
                <p className="rounded-lg border border-dashed p-3 text-xs leading-5 text-muted-foreground">
                  Complétez au minimum la situation, le secteur, le contrat, l’employeur ou activité, la devise, la stabilité, le porteur, le co-emprunteur, le salaire ou revenu fixe, les charges, la capacité, l’apport, le montant à financer, l’accord banque, l’objet du financement et l’origine de l’apport.
                </p>
              )}

              <div className="rounded-lg border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
                En envoyant ces données, vous ne payez pas une avance de démarrage. Vous permettez à Buildify de structurer votre capacité, d’échanger avec votre banque si demandé, de préparer le contrat sécurisé et de déclencher les paiements uniquement après contrôle des étapes.
              </div>

              <ConfirmActionDialog
                title="Envoyer ces informations financières ?"
                description={`Buildify recevra votre mise à jour financière avec un score recalculé de ${projectedScore}%, un ratio projeté de ${percentOrTodo(projectedFinancing.projectedDebtRatioPercent)} et les garanties cochées. Ces données servent à préparer le devis, le contrat et les jalons de paiement.`}
                confirmLabel="Envoyer"
                onConfirm={handleUpdateFinancing}
                trigger={(
                  <Button className="w-full gap-2" disabled={!onUpdate || requiredFinancialFieldsMissing}>
                    <Check className="size-4" />
                    Envoyer mes informations
                  </Button>
                )}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="py-0 gap-0">
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold">Pièces financières déclarées</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Ces pièces orientent la préparation du dossier banque ou notaire.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(financing.documentReadiness?.length ? financing.documentReadiness : ['none-yet']).map(item => (
                  <Badge key={item} variant="outline">{financingDetailLabel(item, FINANCING_DOCUMENT_LABELS, item)}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Engagements compris</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Le client sait pourquoi les informations sont demandées et comment les paiements seront sécurisés.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(financing.commitments ?? []).map(item => (
                  <Badge key={item} variant="secondary">{financingDetailLabel(item, FINANCING_COMMITMENT_LABELS, item)}</Badge>
                ))}
                {(financing.commitments ?? []).length === 0 && <Badge variant="outline">À confirmer</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="py-0 gap-0">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold">Échéancier d’exécution et de paiement</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Le paiement se déclenche quand l’étape est réalisée, vérifiée et documentée.
              </p>
            </div>
            <Badge variant="secondary">{financing.milestones.reduce((total, item) => total + item.percent, 0)}% cadré</Badge>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total jalons</p>
              <p className="mt-1 text-xs font-semibold">{milestoneTotal ? FORMAT_XOF(milestoneTotal) : 'À calculer'}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Payé</p>
              <p className="mt-1 text-xs font-semibold">{paidAmount ? FORMAT_XOF(paidAmount) : '0 XOF'}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">À régler</p>
              <p className="mt-1 text-xs font-semibold">{dueAmount ? FORMAT_XOF(dueAmount) : '0 XOF'}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Blocages</p>
              <p className="mt-1 text-xs font-semibold">{blockedCount}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {financing.milestones.map((milestone, index) => (
              <div key={milestone.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{index + 1}. {milestone.label}</p>
                      <Badge variant={paymentMilestoneStatusVariant(milestone.status)} className="text-[10px]">
                        {paymentMilestoneStatusLabel(milestone.status)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{milestone.trigger}</p>
                    {milestone.note && (
                      <p className="mt-2 rounded-md bg-muted/40 p-2 text-xs leading-5 text-muted-foreground">
                        {milestone.note}
                      </p>
                    )}
                    {(milestone.updatedAt || milestone.updatedBy) && (
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Mis à jour {milestone.updatedAt ? new Date(milestone.updatedAt).toLocaleDateString('fr-FR') : ''}
                        {milestone.updatedBy ? ` · ${milestone.updatedBy}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{milestone.percent}%</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {milestone.expectedAmount ? FORMAT_XOF(milestone.expectedAmount) : 'Montant à calculer'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DevisTab({
  data,
  onQuoteAction,
}: {
  data: ProjectDetailData;
  onQuoteAction?: (quoteId: string, action: 'accepted' | 'refused') => void;
}) {
  const [quotes, setQuotes] = useState(data.quotes);
  const activeQuotes = onQuoteAction ? data.quotes : quotes;

  const handleAction = (quoteId: string, action: 'accepted' | 'refused') => {
    if (onQuoteAction) {
      onQuoteAction(quoteId, action);
      return;
    }
    setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status: action as 'accepted' | 'refused' | 'pending' } : q));
  };

  if (activeQuotes.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <Receipt className="size-8 text-muted-foreground/30" />
        <p className="mt-3 text-sm text-muted-foreground">Aucun devis disponible.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeQuotes.map((quote) => {
        const badge = getQuoteStatusBadge(quote.status);
        return (
          <motion.div
            key={quote.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="py-0 gap-0">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold">{quote.label}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{quote.date}</p>
                  </div>
                  <Badge variant={badge.variant} className="text-[10px] flex-shrink-0">
                    {badge.label}
                  </Badge>
                </div>
                <p className="text-lg font-bold mt-3">{FORMAT_XOF(quote.amount)}</p>
                {quote.description && (
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{quote.description}</p>
                )}

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-lg border p-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Validité</p>
                    <p className="mt-1 text-xs font-semibold">{quote.validityDays ? `${quote.validityDays} j` : 'À confirmer'}</p>
                  </div>
                  <div className="rounded-lg border p-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Devise</p>
                    <p className="mt-1 text-xs font-semibold">{quote.currency || 'XOF'}</p>
                  </div>
                  <div className="rounded-lg border p-2.5 sm:col-span-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Préparé par</p>
                    <p className="mt-1 text-xs font-semibold break-words">{publicActorLabel(quote.createdBy)}</p>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Périmètre inclus</p>
                    <ul className="mt-2 space-y-1.5 text-xs leading-5 text-muted-foreground">
                      {quoteScopeItems(quote, data).map(item => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Hypothèses</p>
                    <ul className="mt-2 space-y-1.5 text-xs leading-5 text-muted-foreground">
                      {quoteAssumptionItems(quote, data).map(item => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Hors périmètre</p>
                    <ul className="mt-2 space-y-1.5 text-xs leading-5 text-muted-foreground">
                      {quoteExclusionItems(quote).map(item => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Modalités de paiement</p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">{quotePaymentTerms(quote)}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={() => openQuoteSheet(quote, data)}>
                    <Eye className="size-3.5" />
                    Consulter
                  </Button>
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={() => downloadQuoteSheet(quote, data)}>
                    <Download className="size-3.5" />
                    Télécharger
                  </Button>
                </div>

                {quote.status === 'pending' && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <ConfirmActionDialog
                      title="Accepter ce devis ?"
                      description={`Vous confirmez avoir compris le montant de ${FORMAT_XOF(quote.amount)} pour ${quote.label}. Buildify pourra préparer le contrat, le planning et les prochaines étapes de paiement.`}
                      confirmLabel="Accepter"
                      onConfirm={() => handleAction(quote.id, 'accepted')}
                      trigger={(
                        <Button size="sm" className="w-full gap-1.5 text-xs">
                          <Check className="size-3.5" />
                          Accepter
                        </Button>
                      )}
                    />
                    <ConfirmActionDialog
                      title="Refuser ce devis ?"
                      description={`Vous refusez ${quote.label}. L’équipe Buildify sera informée pour reprendre le chiffrage, clarifier le périmètre ou proposer un ajustement.`}
                      confirmLabel="Refuser"
                      confirmClassName="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onConfirm={() => handleAction(quote.id, 'refused')}
                      trigger={(
                        <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                          <X className="size-3.5" />
                          Refuser
                        </Button>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

function PlanningTab({
  data,
  onScheduleStatus,
}: {
  data: ProjectDetailData;
  onScheduleStatus?: (scheduleId: string, status: ProjectScheduleItemData['status'], note?: string) => void;
}) {
  const [notesBySchedule, setNotesBySchedule] = useState<Record<string, string>>({});
  const upcoming = data.scheduleItems.filter(item => new Date(item.scheduledAt).getTime() >= Date.now());
  const past = data.scheduleItems.filter(item => new Date(item.scheduledAt).getTime() < Date.now());
  const visibleItems = [...upcoming, ...past];
  const setNote = (scheduleId: string, note: string) => {
    setNotesBySchedule(current => ({ ...current, [scheduleId]: note }));
  };

  if (visibleItems.length === 0) {
    return (
      <Card className="border-dashed py-0 gap-0">
        <CardContent className="flex min-h-60 flex-col items-center justify-center p-6 text-center">
          <Calendar className="size-9 text-muted-foreground/40" />
          <h3 className="mt-4 text-base font-semibold">Aucun événement programmé</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Les rendez-vous, visites techniques, réunions chantier et validations à distance apparaîtront ici dès publication par Buildify.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="py-0 gap-0 border-foreground/10">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Planning projet</p>
              <h3 className="mt-1 text-lg font-bold">{upcoming.length ? `${upcoming.length} événement(s) à venir` : 'Historique planning'}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Chaque événement précise l’heure, le canal, ce qu’il faut préparer et la décision attendue.
              </p>
            </div>
            <Badge variant="outline">{visibleItems.length} total</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        {visibleItems.map(item => {
          const isPast = new Date(item.scheduledAt).getTime() < Date.now();
          const canAnswer = Boolean(onScheduleStatus) && !isPast && ['scheduled', 'postponed'].includes(item.status);
          const rescheduleNote = notesBySchedule[item.id] ?? '';

          return (
            <Card key={item.id} className="py-0 gap-0">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={isPast ? 'secondary' : 'default'} className="text-[10px]">
                        {projectScheduleStatusLabel(item.status)}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {projectScheduleTypeLabel(item.type)}
                      </Badge>
                    </div>
                    <h4 className="mt-3 text-sm font-semibold leading-5">{item.title}</h4>
                  </div>
                  <Calendar className="size-5 shrink-0 text-muted-foreground" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Date</p>
                    <p className="mt-1 text-xs font-semibold">{formatProjectScheduleDate(item.scheduledAt, item.timeZone)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Mode</p>
                    <p className="mt-1 text-xs font-semibold">{projectScheduleModeLabel(item.mode)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Durée</p>
                    <p className="mt-1 text-xs font-semibold">{item.durationMinutes} min</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Lieu</p>
                    <p className="mt-1 text-xs font-semibold break-words">{item.location || data.city}</p>
                  </div>
                </div>

                {(item.preparation || item.decisionExpected || item.note) && (
                  <div className="mt-3 space-y-2">
                    {item.preparation && (
                      <div className="rounded-lg border bg-muted/30 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Préparation</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.preparation}</p>
                      </div>
                    )}
                    {item.decisionExpected && (
                      <div className="rounded-lg border bg-muted/30 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Décision attendue</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.decisionExpected}</p>
                      </div>
                    )}
                    {item.note && (
                      <p className="rounded-lg border p-3 text-xs leading-5 text-muted-foreground">{item.note}</p>
                    )}
                  </div>
                )}
                {(item.clientResponseNote || item.clientRespondedAt) && (
                  <div className="mt-3 rounded-lg border bg-muted/30 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Retour client</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {item.clientResponseNote || `${item.clientRespondedBy || 'Client'} a répondu au planning.`}
                    </p>
                    {item.clientRespondedAt && (
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {new Date(item.clientRespondedAt).toLocaleString('fr-FR')}
                      </p>
                    )}
                  </div>
                )}
                {canAnswer && (
                  <div className="mt-3 rounded-lg border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Votre réponse</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Confirmez votre présence ou demandez un report avec une raison claire pour que Buildify reprogramme vite.
                    </p>
                    <Textarea
                      value={rescheduleNote}
                      onChange={event => setNote(item.id, event.target.value)}
                      className="mt-3 min-h-20"
                      placeholder="Ex. Le mandataire est indisponible à cette date, proposer jeudi après-midi."
                    />
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <ConfirmActionDialog
                        title="Confirmer votre présence ?"
                        description={`Buildify sera informé que vous confirmez ${item.title}. Le dossier sera mis à jour et l’équipe pourra préparer la suite.`}
                        confirmLabel="Confirmer"
                        onConfirm={() => onScheduleStatus?.(item.id, 'confirmed')}
                        trigger={(
                          <Button size="sm" className="gap-1.5 text-xs">
                            <Check className="size-3.5" />
                            Confirmer
                          </Button>
                        )}
                      />
                      <ConfirmActionDialog
                        title="Demander un report ?"
                        description="Votre demande sera transmise à Buildify avec la note saisie. L’équipe pourra proposer une nouvelle date."
                        confirmLabel="Demander"
                        onConfirm={() => onScheduleStatus?.(item.id, 'reschedule_requested', rescheduleNote)}
                        trigger={(
                          <Button variant="outline" size="sm" className="gap-1.5 text-xs" disabled={rescheduleNote.trim().length < 8}>
                            <Clock className="size-3.5" />
                            Reporter
                          </Button>
                        )}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ChantierTab({ data }: { data: ProjectDetailData }) {
  return (
    <div className="space-y-6">
      {/* Progress phases */}
      <Card className="py-0 gap-0">
        <CardContent className="p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-4">
            <ClipboardCheck className="size-3.5" />
            Phases du chantier
          </h4>
          <div className="space-y-4">
            {data.phases.map((phase, i) => (
              <div key={phase.name}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        phase.status === 'done'
                          ? 'bg-foreground text-background'
                          : phase.status === 'in_progress'
                          ? 'border-2 border-foreground text-foreground'
                          : 'border-2 border-muted-foreground/30 text-muted-foreground/40'
                      }`}
                    >
                      {phase.status === 'done' ? <Check className="size-3" /> : i + 1}
                    </div>
                    <span className={`font-medium ${phase.status === 'pending' ? 'text-muted-foreground' : ''}`}>
                      {phase.name}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{phase.progress}%</span>
                </div>
                {phase.status !== 'pending' && (
                  <Progress value={phase.progress} className="ml-7 h-1.5 w-[calc(100%-1.75rem)]" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Photo gallery */}
      <Card className="py-0 gap-0">
        <CardContent className="p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-4">
            <Camera className="size-3.5" />
            Photos du chantier
          </h4>
          {data.photos.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Camera className="size-7 text-muted-foreground/30" />
              <p className="mt-2 text-xs text-muted-foreground">Aucune photo disponible.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {data.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="aspect-[4/3] rounded-lg bg-muted flex items-center justify-center overflow-hidden relative group"
                >
                  <img src={photo.imageUrl} alt={photo.caption} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-2">
                    <Badge variant="secondary" className="mb-1 w-fit bg-white/90 text-[9px] text-black">
                      {photo.progress}%
                    </Badge>
                    <p className="text-[10px] text-white font-medium leading-tight">{photo.caption}</p>
                    <p className="text-[9px] text-white/60 mt-0.5">{photo.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reports */}
      <Card className="py-0 gap-0">
        <CardContent className="p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
            <AlertCircle className="size-3.5" />
            Rapports de chantier
          </h4>
          {data.siteUpdates.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Les rapports publiés par l’équipe terrain apparaîtront ici avec les photos, le pourcentage et la phase concernée.
            </div>
          ) : (
            <div className="space-y-2">
              {data.siteUpdates.map(update => (
                <div key={update.id} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                  <ClipboardList className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{update.phase}</p>
                      <Badge variant="outline" className="text-[10px]">{update.progress}%</Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(update.createdAt).toLocaleString('fr-FR')} · {publicActorLabel(update.createdBy)}
                    </p>
                    {update.report && <p className="mt-2 text-xs leading-5 text-muted-foreground">{update.report}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main View ──────────────────────────────────────────────

type TabValue = 'resume' | 'propositions' | 'financement' | 'planning' | 'documents' | 'messages' | 'devis' | 'chantier';

function ClientDecisionCenter({
  project,
  onNavigate,
}: {
  project: ProjectData;
  onNavigate: (target: string) => void;
}) {
  const center = useMemo(() => buildProjectDecisionCenter(project, 'client'), [project]);
  const toneClass: Record<ProjectDecisionTone, string> = {
    good: 'border-foreground/15 bg-muted/30',
    active: 'border-foreground bg-foreground text-background',
    warning: 'border-amber-500/35 bg-amber-500/10 text-amber-950 dark:text-amber-100',
    blocked: 'border-destructive/35 bg-destructive/10 text-destructive',
    muted: 'border-border bg-background',
  };
  const iconMap: Record<string, LucideIcon> = {
    messages: MessageSquare,
    proposal: Eye,
    quote: Receipt,
    finance: Wallet,
    planning: Calendar,
    documents: FolderArchive,
    site: Camera,
  };
  const visibleItems = [
    ...center.items.filter(item => ['blocked', 'active', 'warning'].includes(item.tone)),
    ...center.items.filter(item => !['blocked', 'active', 'warning'].includes(item.tone)),
  ].slice(0, 4);

  return (
    <Card className="mb-4 border-foreground/10 shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Décision projet</p>
            <h2 className="mt-1 break-words text-lg font-bold leading-tight">{center.headline}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{center.summary}</p>
          </div>
          <div className="grid min-w-0 grid-cols-[1fr_auto] items-center gap-3 rounded-xl border bg-muted/25 p-3 sm:min-w-64">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{center.scoreLabel}</p>
              <Progress value={center.score} className="mt-2 h-2" />
            </div>
            <span className="text-xl font-bold tabular-nums">{center.score}%</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {center.metrics.map(metric => (
            <div key={metric.label} className={`min-w-0 rounded-xl border px-3 py-2 ${toneClass[metric.tone]}`}>
              <p className="break-words text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{metric.label}</p>
              <p className="mt-1 break-words text-sm font-bold leading-tight">{metric.value}</p>
              <p className="mt-1 break-words text-[11px] leading-4 text-muted-foreground">{metric.helper}</p>
            </div>
          ))}
        </div>

        {center.blockers.length > 0 && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {center.blockers.slice(0, 2).map(blocker => (
              <div key={blocker} className="flex gap-2 rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                <span className="min-w-0 break-words">{blocker}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {visibleItems.map(item => {
            const Icon = iconMap[item.id] || ClipboardCheck;
            const isInverted = item.tone === 'active';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.target)}
                className={`min-h-[132px] rounded-xl border p-3 text-left transition-colors hover:border-foreground/40 ${toneClass[item.tone]}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${isInverted ? 'bg-background/15' : 'bg-muted'}`}>
                    <Icon className={`size-4 ${isInverted ? 'text-background' : 'text-muted-foreground'}`} />
                  </span>
                  <Badge variant={item.tone === 'good' ? 'default' : 'outline'} className={`shrink-0 text-[10px] ${isInverted ? 'border-background/30 text-background' : ''}`}>
                    {item.status}
                  </Badge>
                </div>
                <p className="mt-3 break-words text-sm font-bold leading-5">{item.title}</p>
                <p className={`mt-2 line-clamp-2 text-xs leading-5 ${isInverted ? 'text-background/75' : 'text-muted-foreground'}`}>{item.description}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <Button className="h-11 rounded-xl" onClick={() => onNavigate(center.primaryTarget)}>
            {center.primaryLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectDetailView() {
  const { goBack, navigate, viewParams, userProjects, teamMembers, addProjectDocuments, updateProjectQuoteStatus, validateProjectVisualProposal, updateProjectFinancing, updateProjectScheduleStatus, respondProjectInfo, sendProjectMessage, addToast } = useAppStore();
  const projectId = viewParams?.id || '';
  const storedProject = userProjects.find(project => project.id === projectId || project.referenceNumber === projectId);
  const data = storedProject ? detailFromStoredProject(storedProject, teamMembers) : null;
  const preferredTab: TabValue = data?.visualProposal || (data && ['proposal_ready', 'proposal_validated'].includes(data.status))
    ? 'propositions'
    : 'resume';
  const [activeTabsByProject, setActiveTabsByProject] = useState<Record<string, TabValue>>({});
  const activeTab = activeTabsByProject[projectId] ?? preferredTab;
  const setActiveTab = (tab: TabValue) => {
    setActiveTabsByProject(prev => ({ ...prev, [projectId]: tab }));
  };
  const openDecisionTarget = (target: string) => {
    const tabByTarget: Record<string, TabValue> = {
      resume: 'resume',
      propositions: 'propositions',
      financement: 'financement',
      planning: 'planning',
      documents: 'documents',
      messages: 'messages',
      devis: 'devis',
      chantier: 'chantier',
    };
    setActiveTab(tabByTarget[target] || 'resume');
  };

  const tabs = [
    { value: 'resume' as const, label: 'Résumé' },
    { value: 'propositions' as const, label: 'Propositions' },
    { value: 'financement' as const, label: 'Financement' },
    { value: 'planning' as const, label: 'Planning' },
    { value: 'documents' as const, label: 'Documents' },
    { value: 'messages' as const, label: 'Messages' },
    { value: 'devis' as const, label: 'Devis' },
    { value: 'chantier' as const, label: 'Chantier' },
  ];

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <Card className="w-full max-w-lg border-dashed">
          <CardContent className="p-8 text-center">
            <FolderArchive className="mx-auto size-10 text-muted-foreground" />
            <h1 className="mt-4 text-lg font-semibold">Dossier client introuvable</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Ce dossier n’est pas rattaché à votre espace client sur cet appareil. Créez une demande ou ouvrez un dossier réel depuis votre liste de projets.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button variant="outline" className="h-11 rounded-lg" onClick={goBack}>
                Retour
              </Button>
              <Button className="h-11 rounded-lg" onClick={() => navigate('projects')}>
                Mes projets
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="size-9" onClick={goBack}>
            <ArrowLeft className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate">{data.referenceNumber}</p>
            <p className="text-sm font-semibold truncate">{data.title}</p>
          </div>
          <Badge variant={getStatusVariant(data.status)} className="text-[10px] flex-shrink-0">
            {PROJECT_STATUS_LABELS[data.status] || data.status}
          </Badge>
        </div>

        {/* Progress */}
        <div className="max-w-6xl mx-auto px-4 pb-3">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-muted-foreground">Avancement global</span>
            <span className="font-medium">{data.progress}%</span>
          </div>
          <Progress value={data.progress} className="h-1.5" />
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 pb-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
            <TabsList className="grid h-auto min-h-10 w-full grid-cols-4 gap-1 bg-muted p-0.5 sm:flex sm:justify-start sm:overflow-x-auto">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="h-9 min-w-0 px-2 text-[11px] sm:flex-1 sm:px-3 sm:text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-6xl mx-auto px-4 pt-4 pb-28 md:pb-6">
        {storedProject && (
          <ClientDecisionCenter project={storedProject} onNavigate={openDecisionTarget} />
        )}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'resume' && (
              <ResumeTab
                data={data}
                onOpenProposals={() => setActiveTab('propositions')}
                onOpenFinancing={() => setActiveTab('financement')}
                onOpenPlanning={() => setActiveTab('planning')}
                onOpenDocuments={() => setActiveTab('documents')}
                onOpenMessages={() => setActiveTab('messages')}
                onOpenQuotes={() => setActiveTab('devis')}
                onOpenSite={() => setActiveTab('chantier')}
              />
            )}
            {activeTab === 'propositions' && (
              <ProposalsTab
                data={data}
                onValidate={storedProject ? (proposal) => validateProjectVisualProposal(storedProject.id, proposal) : undefined}
              />
            )}
            {activeTab === 'financement' && (
              <FinancingTab
                data={data}
                onUpdate={storedProject ? (financing) => {
                  updateProjectFinancing(storedProject.id, financing);
                  addToast('Informations financières envoyées.', 'success');
                } : undefined}
              />
            )}
            {activeTab === 'planning' && (
              <PlanningTab
                data={data}
                onScheduleStatus={storedProject ? (scheduleId, status, note) => {
                  updateProjectScheduleStatus(storedProject.id, scheduleId, status, note);
                  addToast(status === 'confirmed' ? 'Présence confirmée.' : 'Demande de report envoyée.', 'success');
                } : undefined}
              />
            )}
            {activeTab === 'documents' && (
              <DocumentsTab
                data={data}
                onUpload={storedProject ? (documents) => addProjectDocuments(storedProject.id, documents) : undefined}
              />
            )}
            {activeTab === 'messages' && (
              <MessagesTab
                data={data}
                onSend={storedProject ? (message, mode) => {
                  if (mode === 'info') {
                    respondProjectInfo(storedProject.id, message);
                    return;
                  }
                  sendProjectMessage(storedProject.id, { message, senderRole: 'client' });
                } : undefined}
              />
            )}
            {activeTab === 'devis' && (
              <DevisTab
                data={data}
                onQuoteAction={storedProject ? (quoteId, action) => updateProjectQuoteStatus(storedProject.id, quoteId, action) : undefined}
              />
            )}
            {activeTab === 'chantier' && <ChantierTab data={data} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
