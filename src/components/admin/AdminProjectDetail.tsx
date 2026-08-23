'use client';

import NextImage from 'next/image';
import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  AlertCircle,
  Camera,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Calculator,
  Download,
  FileText,
  FolderSearch,
  Gauge,
  Globe2,
  HandCoins,
  Image as ImageIcon,
  Landmark,
  MapPinned,
  MessageCircle,
  MessageSquareText,
  NotebookTabs,
  ReceiptText,
  Ruler,
  Send,
  ShieldCheck,
  PiggyBank,
  Route,
  Scale,
  UserCheck,
  UserRoundCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/stores/app-store';
import { FORMAT_XOF, PROJECT_STATUS_LABELS } from '@/types';
import type { ProjectData, ProjectPaymentMilestoneData, ProjectScheduleItemData } from '@/types';
import { formatProjectLocation } from '@/lib/project-format';
import { buildProjectBrief } from '@/lib/project-brief';
import { buildFinancingDecisionPlan } from '@/lib/financing-decision';
import { buildProjectDecisionCenter } from '@/lib/project-decision-center';
import type { ProjectDecisionTone } from '@/lib/project-decision-center';
import type { ProjectBriefItemKey } from '@/lib/project-brief';
import {
  PROJECT_SCHEDULE_MODE_LABELS,
  PROJECT_SCHEDULE_TYPE_LABELS,
  formatProjectScheduleDate,
  projectScheduleModeLabel,
  projectScheduleStatusLabel,
  projectScheduleTypeLabel,
  sortProjectSchedule,
} from '@/lib/project-schedule';
import { DEPARTMENT_LABELS, ROLE_LABELS } from '@/data/team';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';

function formatBudget(min?: number, max?: number) {
  if (min && max) return `${FORMAT_XOF(min)} - ${FORMAT_XOF(max)}`;
  if (max) return FORMAT_XOF(max);
  if (min) return FORMAT_XOF(min);
  return 'À estimer';
}

function formatBudgetSummary(min?: number, max?: number) {
  const compact = (amount: number) => {
    if (amount >= 1_000_000) {
      const value = Math.round((amount / 1_000_000) * 10) / 10;
      return `${new Intl.NumberFormat('fr-FR').format(value)} M`;
    }
    return new Intl.NumberFormat('fr-FR').format(amount);
  };
  if (min && max) return `${compact(min)} - ${compact(max)} XOF`;
  if (max) return `${compact(max)} XOF`;
  if (min) return `${compact(min)} XOF`;
  return 'À estimer';
}

function compactProposalEstimate(value: string) {
  const compactAmount = (amount: number) => {
    if (amount >= 1_000_000) {
      const millions = Math.round((amount / 1_000_000) * 10) / 10;
      return `${new Intl.NumberFormat('fr-FR').format(millions)} M`;
    }
    return new Intl.NumberFormat('fr-FR').format(amount);
  };
  const amounts = Array.from(value.matchAll(/\d[\d\s\u00a0\u202f]*/g))
    .map(match => Number(match[0].replace(/\D/g, '')))
    .filter(Boolean);

  if (amounts.length >= 2) return `${compactAmount(amounts[0])} - ${compactAmount(amounts[1])} XOF`;
  if (amounts.length === 1) return `${compactAmount(amounts[0])} XOF`;

  return value.replace(/\s*XOF\s*-\s*/g, ' - ').replace(/\s*XOF$/g, '').trim() || 'À estimer';
}

function quoteStatusLabel(status: string) {
  if (status === 'sent') return 'Transmis';
  if (status === 'accepted') return 'Accepté';
  if (status === 'refused') return 'Refusé';
  return 'Brouillon';
}

function financingModeLabel(mode?: string) {
  const labels: Record<string, string> = {
    'confirmed-bank': 'Financement confirmé',
    'bank-support': 'Aide banque demandée',
    'progress-payment': 'Paiement par avancement',
    'notary-secured': 'Contrat notarié',
    'land-and-finance': 'Terrain + financement',
    'to-structure': 'À structurer',
  };
  return mode ? labels[mode] || mode : 'À structurer';
}

function financingReadinessLabel(readiness?: string) {
  if (readiness === 'confirmed') return 'Confirmé';
  if (readiness === 'bank_review') return 'Banque à suivre';
  if (readiness === 'to_structure') return 'À structurer';
  return 'À confirmer';
}

function amountOrTodo(value: number | undefined) {
  return value !== undefined ? FORMAT_XOF(value) : 'À compléter';
}

function percentOrTodo(value: number | undefined) {
  return value !== undefined ? `${value}%` : 'À calculer';
}

const BANK_STAGE_LABELS: Record<string, string> = {
  'not-started': 'Pas démarré',
  simulation: 'Simulation reçue',
  'documents-requested': 'Pièces demandées',
  'under-review': 'En étude',
  'pre-approved': 'Préaccord',
  'funds-available': 'Fonds disponibles',
};

const FINANCING_DOCUMENT_LABELS: Record<string, string> = {
  id: 'Identité',
  'income-proof': 'Revenus',
  'bank-statements': 'Relevés',
  'land-document': 'Terrain',
  'company-documents': 'Entreprise',
  'quote-or-plans': 'Plans/devis',
  'none-yet': 'Aucun',
};

const EMPLOYMENT_STATUS_LABELS: Record<string, string> = {
  'civil-servant': 'Fonctionnaire',
  'private-salary': 'Salarié privé',
  'diaspora-salary': 'Salarié diaspora',
  entrepreneur: 'Entrepreneur',
  'liberal-service': 'Profession libérale',
  'mixed-income': 'Revenus mixtes',
  'family-backed': 'Appui familial',
  'to-confirm': 'À confirmer',
};

const FINANCIAL_SECTOR_LABELS: Record<string, string> = {
  public: 'Administration',
  private: 'Privé',
  construction: 'BTP / immobilier',
  trade: 'Commerce',
  transport: 'Transport',
  health: 'Santé',
  education: 'Éducation',
  digital: 'Digital',
  agriculture: 'Agro',
  diaspora: 'Diaspora',
  business: 'Indépendant',
  other: 'Autre',
};

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  permanent: 'CDI / permanent',
  fixed: 'CDD / mission',
  civil: 'Fonction publique',
  business: 'Indépendant',
  company: 'Société',
  mixed: 'Mixte',
  informal: 'À documenter',
  other: 'Autre',
};

const INCOME_STABILITY_LABELS: Record<string, string> = {
  'stable-12m': 'Stable 12 mois+',
  'stable-6m': 'Stable 6 mois',
  variable: 'Variable documenté',
  seasonal: 'Saisonnier',
  'new-income': 'Nouveau revenu',
  'to-document': 'À documenter',
};

const FINANCIAL_RISK_LABELS: Record<string, string> = {
  low: 'Risque maîtrisé',
  moderate: 'Risque à structurer',
  high: 'Risque élevé',
  unknown: 'À analyser',
};

const PAYMENT_MILESTONE_STATUS_OPTIONS: Array<{ value: ProjectPaymentMilestoneData['status']; label: string }> = [
  { value: 'planned', label: 'Planifié' },
  { value: 'due', label: 'À régler' },
  { value: 'paid', label: 'Payé' },
  { value: 'blocked', label: 'Bloqué' },
];

function paymentMilestoneStatusLabel(status?: ProjectPaymentMilestoneData['status']) {
  if (status === 'due') return 'À régler';
  if (status === 'paid') return 'Payé';
  if (status === 'blocked') return 'Bloqué';
  return 'Planifié';
}

function labelFrom(labels: Record<string, string>, value?: string) {
  if (!value) return 'À compléter';
  return labels[value] || value;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDocumentSize(size?: number) {
  if (!size) return 'Taille non renseignée';
  if (size >= 1024 * 1024) return `${Math.round((size / (1024 * 1024)) * 10) / 10} Mo`;
  return `${Math.max(1, Math.round(size / 1024))} Ko`;
}

function documentTypeLabel(type?: string) {
  const labels: Record<string, string> = {
    plan: 'Plan',
    photo: 'Photo',
    contrat: 'Contrat',
    facture: 'Facture',
    document: 'Document',
  };
  return type ? labels[type] || type : 'Document';
}

function buildAdminDocumentReceiptHtml(document: NonNullable<ProjectData['documents']>[number], project: ProjectData) {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(document.name)} - ${escapeHtml(project.referenceNumber)}</title>
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
      <div><div class="brand">Buildify</div><div>Registre documentaire admin</div></div>
      <div class="ref">
        <div>Dossier ${escapeHtml(project.referenceNumber)}</div>
        <div>${escapeHtml(project.title || project.categoryName || 'Projet BTP')}</div>
        <div>${escapeHtml(formatProjectLocation(project))}</div>
      </div>
    </header>
    <h1>${escapeHtml(document.name)}</h1>
    <p>Fiche de contrôle générée depuis l’espace administrateur Buildify.</p>
    <section class="grid">
      <div class="box"><div class="label">Client</div><div class="value">${escapeHtml(project.clientName || 'À rattacher')}</div></div>
      <div class="box"><div class="label">Type</div><div class="value">${escapeHtml(documentTypeLabel(document.type))}</div></div>
      <div class="box"><div class="label">Date</div><div class="value">${escapeHtml(document.date)}</div></div>
      <div class="box"><div class="label">Taille</div><div class="value">${escapeHtml(formatDocumentSize(document.size))}</div></div>
    </section>
    <section class="note">
      Cette fiche permet à l’administration de tracer la pièce, demander des compléments si nécessaire, et relier le document au devis, à la banque, au contrat et au suivi chantier.
      ${document.url ? `<br /><br />Lien déclaré : ${escapeHtml(document.url)}` : ''}
    </section>
    <footer>Document rattaché au dossier ${escapeHtml(project.referenceNumber)} · Buildify</footer>
  </main>
</body>
</html>`;
}

function downloadAdminDocumentReceipt(document: NonNullable<ProjectData['documents']>[number], project: ProjectData) {
  const blob = new Blob([buildAdminDocumentReceiptHtml(document, project)], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement('a');
  anchor.href = url;
  anchor.download = `${project.referenceNumber}-${document.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'document'}-registre-admin-buildify.html`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function openAdminOriginalDocument(document: NonNullable<ProjectData['documents']>[number]) {
  if (!document.url) return;
  window.open(document.url, '_blank', 'noopener,noreferrer');
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

function optionalLabel(labels: Record<string, string>, value?: string): string | undefined {
  if (!value) return undefined;
  return labels[value] || value;
}

const PROJECT_BRIEF_ICONS: Record<ProjectBriefItemKey, LucideIcon> = {
  category: FileText,
  location: MapPinned,
  surface: Ruler,
  scope: ClipboardCheck,
  context: FolderSearch,
  finance: Landmark,
  timeline: CalendarDays,
};

type AdminActionTone = 'active' | 'done' | 'pending';

interface AdminProjectAction {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  statusLabel: string;
  owner: string;
  tone: AdminActionTone;
  targetId: string;
  actionLabel: string;
}

function AdminDecisionRegister({
  project,
  onFocus,
}: {
  project: ProjectData;
  onFocus: (targetId: string) => void;
}) {
  const center = useMemo(() => buildProjectDecisionCenter(project, 'admin'), [project]);
  const toneClass: Record<ProjectDecisionTone, string> = {
    good: 'border-foreground/15 bg-muted/30',
    active: 'border-foreground bg-foreground text-background',
    warning: 'border-amber-500/35 bg-amber-500/10 text-amber-950 dark:text-amber-100',
    blocked: 'border-destructive/35 bg-destructive/10 text-destructive',
    muted: 'border-border bg-background',
  };
  const iconMap: Record<string, LucideIcon> = {
    lead: UserCheck,
    info: MessageSquareText,
    proposal: ImageIcon,
    quote: ReceiptText,
    finance: HandCoins,
    planning: CalendarDays,
    site: Camera,
  };
  const visibleItems = [
    ...center.items.filter(item => ['blocked', 'active', 'warning'].includes(item.tone)),
    ...center.items.filter(item => !['blocked', 'active', 'warning'].includes(item.tone)),
  ].slice(0, 6);

  return (
    <Card className="py-0 gap-0 border-foreground/10 shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Registre de décision admin</p>
            <h2 className="mt-1 break-words text-lg font-bold leading-tight">{center.headline}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{center.summary}</p>
          </div>
          <div className="grid min-w-0 grid-cols-[1fr_auto] items-center gap-3 rounded-xl border bg-muted/25 p-3 xl:min-w-72">
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
          <div className="mt-4 grid gap-2 md:grid-cols-3">
            {center.blockers.slice(0, 3).map(blocker => (
              <div key={blocker} className="flex gap-2 rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                <span className="min-w-0 break-words">{blocker}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {visibleItems.map(item => {
            const Icon = iconMap[item.id] || ClipboardCheck;
            const isInverted = item.tone === 'active';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onFocus(item.target)}
                className={`min-h-[138px] rounded-xl border p-3 text-left transition-colors hover:border-foreground/40 ${toneClass[item.tone]}`}
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
                <p className={`mt-2 text-[10px] font-semibold uppercase tracking-wider ${isInverted ? 'text-background/65' : 'text-muted-foreground'}`}>Responsable · {item.owner}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <Button className="h-10 rounded-xl" onClick={() => onFocus(center.primaryTarget)}>
            {center.primaryLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface ProposalVariantTemplate {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  estimate: string;
  duration: string;
  confidence: string;
  deliverable: string;
  strengths: string[];
  decisionCriteria: { label: string; value: string }[];
  technicalScope: string[];
  riskControls: string[];
  nextSteps: string[];
}

function splitQuoteText(value: string) {
  return value
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
}

function criteriaFromText(value: string) {
  return splitQuoteText(value).map(line => {
    const [label, ...rest] = line.split(':');
    return {
      label: label.trim(),
      value: rest.join(':').trim() || 'À préciser',
    };
  });
}

function criteriaToText(criteria: { label: string; value: string }[]) {
  return criteria.map(item => `${item.label}: ${item.value}`).join('\n');
}

function linesToText(lines: string[]) {
  return lines.join('\n');
}

function getProposalVariantTemplates(project?: ProjectData): ProposalVariantTemplate[] {
  const categoryName = project?.categoryName || 'Projet BTP';
  const category = categoryName.toLowerCase();
  const estimate = formatBudget(project?.budgetMin, project?.budgetMax);
  const location = project ? formatProjectLocation(project, 'Localisation à confirmer') : 'Localisation à confirmer';
  const scopeBase = [
    `Ouvrage : ${categoryName}`,
    `Localisation : ${location}`,
    'Lecture du brief client, des surfaces, du budget et des documents disponibles.',
  ];
  const baseRisks = [
    'Surfaces, emprise et limites de prestation à confirmer avant devis définitif.',
    'Documents administratifs, terrain et contraintes techniques à contrôler.',
    'Budget final à verrouiller après métrés, choix de matériaux et visite technique.',
  ];
  const baseNext = [
    'Client consulte et compare la proposition visuelle.',
    'Client valide une orientation dans son espace projet.',
    'Buildify prépare le devis détaillé, le planning et les jalons sécurisés.',
  ];
  const decisionBase = [
    { label: 'Budget cible', value: estimate },
    { label: 'Zone', value: location },
    { label: 'Décision attendue', value: 'Validation visuelle client avant devis final' },
  ];

  if (category.includes('vrd') || category.includes('voirie') || category.includes('route')) {
    return [
      {
        id: 'vrd-voirie-drainage',
        title: 'VRD - voirie et drainage maîtrisés',
        category: 'VRD',
        image: '/images/road-1.png',
        description: 'Variante orientée voirie, accès, caniveaux, drainage et circulation des engins pour un chantier exploitable par phases.',
        estimate,
        duration: '6 à 12 semaines',
        confidence: 'Priorité exploitation du site',
        deliverable: 'Image de référence VRD, phasage, ouvrages à contrôler et points de validation terrain.',
        strengths: ['Accès lisibles', 'Drainage anticipé', 'Phasage exploitable'],
        decisionCriteria: [...decisionBase, { label: 'Priorité', value: 'Accès, pentes, exutoires et maintenance' }],
        technicalScope: [...scopeBase, 'Voirie, bordures, caniveaux, assainissement, exutoires et accès chantier.'],
        riskControls: [...baseRisks, 'Contrôle des pentes, raccordements et points bas avant exécution.'],
        nextSteps: baseNext,
      },
      {
        id: 'vrd-reseaux',
        title: 'VRD - réseaux et raccordements',
        category: 'VRD',
        image: '/images/hydraulique-1.png',
        description: 'Variante centrée sur eau, assainissement, regards, réservations, raccordements et coordination des réseaux.',
        estimate,
        duration: '4 à 10 semaines',
        confidence: 'Priorité conformité réseaux',
        deliverable: 'Schéma réseaux, points de contrôle, fiches d’exécution et séquence de raccordement.',
        strengths: ['Réseaux coordonnés', 'Regards accessibles', 'Maintenance prévue'],
        decisionCriteria: [...decisionBase, { label: 'Priorité', value: 'Raccordements et conformité des réseaux' }],
        technicalScope: [...scopeBase, 'Réseaux humides, réservations, regards, raccordements publics et essais.'],
        riskControls: [...baseRisks, 'Risque de raccordement ou d’exutoire non disponible à lever avant chantier.'],
        nextSteps: baseNext,
      },
    ];
  }

  if (category.includes('immeuble')) {
    return [
      {
        id: 'rplus-facade-premium',
        title: 'Immeuble R+ - façade premium',
        category: 'Immeuble R+',
        image: '/images/immeuble-1.png',
        description: 'Variante verticale sobre avec façade régulière, accès principal lisible et lecture promoteur pour arbitrer coût, image et rendement.',
        estimate,
        duration: '10 à 18 mois',
        confidence: 'Recommandée pour rendement locatif',
        deliverable: 'Vue façade, principes de trame, contraintes structurelles et planning macro.',
        strengths: ['Façade valorisante', 'Trame rationnelle', 'Densité utile'],
        decisionCriteria: [...decisionBase, { label: 'Priorité', value: 'Image, rendement, structure et circulation verticale' }],
        technicalScope: [...scopeBase, 'Façade, circulations verticales, rez-de-chaussée, parkings, gaines et sécurité incendie.'],
        riskControls: [...baseRisks, 'Études structure, sol, sécurité incendie et stationnement à confirmer.'],
        nextSteps: baseNext,
      },
      {
        id: 'rplus-plan-technique',
        title: 'Immeuble R+ - plan technique optimisé',
        category: 'Études R+',
        image: '/images/plan-1.png',
        description: 'Variante de cadrage par plans pour fixer les noyaux, appartements, circulations, gaines et surfaces avant chiffrage.',
        estimate,
        duration: '3 à 6 semaines d’études',
        confidence: 'Priorité exécution',
        deliverable: 'Plan de principe, surfaces utiles, points BET et arbitrages de programme.',
        strengths: ['Noyaux rationnels', 'Surfaces maîtrisées', 'Études plus fiables'],
        decisionCriteria: [...decisionBase, { label: 'Priorité', value: 'Plans, surfaces et faisabilité technique' }],
        technicalScope: [...scopeBase, 'Distribution, noyaux, gaines techniques, typologies, parkings et surfaces utiles.'],
        riskControls: [...baseRisks, 'Risques liés aux normes, à la structure et aux circulations à lever avec les BET.'],
        nextSteps: baseNext,
      },
    ];
  }

  if (category.includes('duplex') || category.includes('triplex')) {
    return [
      {
        id: 'duplex-contemporain',
        title: 'Duplex / Triplex - façade familiale',
        category: 'Duplex / Triplex',
        image: '/images/duplex-1.png',
        description: 'Variante familiale contemporaine avec volumes lisibles, terrasse protégée, stationnement et circulation intérieure maîtrisée.',
        estimate,
        duration: '8 à 12 mois',
        confidence: 'Confort familial',
        deliverable: 'Vue extérieure, intentions matériaux, périmètre lots et jalons clés.',
        strengths: ['Façade sobre', 'Espaces familiaux', 'Circulation claire'],
        decisionCriteria: [...decisionBase, { label: 'Priorité', value: 'Confort, façade, stationnement et extension possible' }],
        technicalScope: [...scopeBase, 'Façade, distribution, gros œuvre, second œuvre, finitions et espaces extérieurs.'],
        riskControls: baseRisks,
        nextSteps: baseNext,
      },
      {
        id: 'duplex-finitions',
        title: 'Duplex / Triplex - finitions premium',
        category: 'Second œuvre',
        image: '/images/interieur-1.png',
        description: 'Variante dédiée aux finitions: revêtements, éclairage, menuiseries, plomberie, équipements et ambiance intérieure.',
        estimate,
        duration: '8 à 14 semaines',
        confidence: 'Décision rapide des finitions',
        deliverable: 'Planche finitions, lots concernés, options client et points de contrôle qualité.',
        strengths: ['Choix concrets', 'Lots séparés', 'Standing lisible'],
        decisionCriteria: [...decisionBase, { label: 'Priorité', value: 'Finitions, niveau de standing et réception qualité' }],
        technicalScope: [...scopeBase, 'Peinture, carrelage, sanitaires, plafonds, menuiseries, luminaires et équipements.'],
        riskControls: [...baseRisks, 'Disponibilité matériaux, équivalences et tolérances de finition à valider.'],
        nextSteps: baseNext,
      },
    ];
  }

  if (category.includes('hydraulique')) {
    return [
      {
        id: 'hydraulique-autonomie',
        title: 'Hydraulique - autonomie et stockage',
        category: 'Hydraulique',
        image: '/images/hydraulique-1.png',
        description: 'Variante orientée forage, adduction, stockage, énergie et continuité de service pour sécuriser l’accès à l’eau.',
        estimate,
        duration: '4 à 10 semaines',
        confidence: 'Priorité continuité d’eau',
        deliverable: 'Schéma de principe, dimensionnement, points d’essai et plan de maintenance.',
        strengths: ['Autonomie cadrée', 'Stockage lisible', 'Maintenance anticipée'],
        decisionCriteria: [...decisionBase, { label: 'Priorité', value: 'Débit, stockage, énergie et maintenance' }],
        technicalScope: [...scopeBase, 'Forage, pompage, château d’eau, traitement, réseau, essais et réception.'],
        riskControls: [...baseRisks, 'Débit réel, qualité d’eau et énergie disponible à vérifier avant engagement.'],
        nextSteps: baseNext,
      },
    ];
  }

  if (category.includes('lot') || category.includes('rénovation') || category.includes('renovation')) {
    return [
      {
        id: 'lot-finitions-premium',
        title: 'Lots de travaux - finition premium',
        category: 'Lots travaux',
        image: '/images/interieur-1.png',
        description: 'Variante dédiée aux lots de finition, reprise qualité, coordination second œuvre et réception propre par zones.',
        estimate,
        duration: '4 à 12 semaines',
        confidence: 'Priorité contrôle qualité',
        deliverable: 'Image finition, lots concernés, points de validation et réserves à surveiller.',
        strengths: ['Qualité visible', 'Lots cadrés', 'Réception plus simple'],
        decisionCriteria: [...decisionBase, { label: 'Priorité', value: 'Finitions, reprises et réception qualité' }],
        technicalScope: [...scopeBase, 'Peinture, carrelage, plomberie, électricité, menuiserie, étanchéité et reprises.'],
        riskControls: [...baseRisks, 'État existant, malfaçons et contraintes de site occupé à confirmer.'],
        nextSteps: baseNext,
      },
      {
        id: 'lot-chantier-phasage',
        title: 'Lots de travaux - phasage chantier',
        category: 'Lots travaux',
        image: '/images/chantier-1.png',
        description: 'Variante chantier pour organiser approvisionnement, zones d’intervention, sécurité et séquence des corps d’état.',
        estimate,
        duration: '2 à 8 semaines',
        confidence: 'Priorité exécution rapide',
        deliverable: 'Plan d’intervention, planning court, zones sensibles et contrôles par lot.',
        strengths: ['Phasage clair', 'Approvisionnement suivi', 'Nuisances réduites'],
        decisionCriteria: [...decisionBase, { label: 'Priorité', value: 'Délai, phasage et coordination des équipes' }],
        technicalScope: [...scopeBase, 'Organisation chantier, lots prioritaires, contrôles intermédiaires et réception.'],
        riskControls: [...baseRisks, 'Occupation du site, accès fournisseurs et reprises cachées à vérifier.'],
        nextSteps: baseNext,
      },
    ];
  }

  return [
    {
      id: 'maison-basse-contemporaine',
      title: 'Maison basse contemporaine',
      category: 'Maison basse',
      image: '/images/villa-1.png',
      description: 'Variante claire pour villa basse avec façade élégante, terrasse protégée, emprise maîtrisée et exécution simple.',
      estimate,
      duration: '6 à 10 mois',
      confidence: 'Recommandée pour budget maîtrisé',
      deliverable: 'Vue façade, principes matériaux, enveloppe budget et phasage du dossier.',
      strengths: ['Lecture immédiate', 'Coûts mieux cadrés', 'Entretien simple'],
      decisionCriteria: [...decisionBase, { label: 'Priorité', value: 'Emprise, confort familial, budget et délai' }],
      technicalScope: [...scopeBase, 'Implantation, gros œuvre, second œuvre, finitions, terrasse et espaces extérieurs.'],
      riskControls: baseRisks,
      nextSteps: baseNext,
    },
    {
      id: 'maison-plan-optimise',
      title: 'Maison basse - plan optimisé',
      category: 'Études',
      image: '/images/plan-1.png',
      description: 'Variante de décision par plan pour valider distribution, chambres, pièces d’eau, cuisine, terrasse et réservations techniques.',
      estimate,
      duration: '2 à 4 semaines d’études',
      confidence: 'Base technique solide',
      deliverable: 'Plan de principe, surfaces, hypothèses et points ouverts avant devis.',
      strengths: ['Surfaces utiles', 'Technique anticipée', 'Validation rapide'],
      decisionCriteria: [...decisionBase, { label: 'Priorité', value: 'Plans, surfaces et faisabilité avant devis' }],
      technicalScope: [...scopeBase, 'Distribution, surfaces, pièces techniques, circulations et emprise au sol.'],
      riskControls: [...baseRisks, 'Cohérence entre terrain, emprise souhaitée et documents à confirmer.'],
      nextSteps: baseNext,
    },
    {
      id: 'maison-finitions-premium',
      title: 'Maison basse - finitions premium',
      category: 'Second œuvre',
      image: '/images/interieur-1.png',
      description: 'Variante intérieure pour arbitrer standing, revêtements, luminaires, équipements et contrôle qualité des finitions.',
      estimate,
      duration: '6 à 12 semaines',
      confidence: 'Idéal avant commande',
      deliverable: 'Planche finitions, lots concernés et décisions client à valider.',
      strengths: ['Choix concrets', 'Lots séparés', 'Budget finition lisible'],
      decisionCriteria: [...decisionBase, { label: 'Priorité', value: 'Standing, finitions et qualité de réception' }],
      technicalScope: [...scopeBase, 'Peinture, plafonds, sols, sanitaires, menuiseries, éclairage et équipements.'],
      riskControls: [...baseRisks, 'Disponibilité matériaux, équivalences et délai fournisseurs à valider.'],
      nextSteps: baseNext,
    },
  ];
}

function dateTimeLocalAfter(days: number, hour = 9, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function AdminProjectDetail() {
  const {
    goBack,
    viewParams,
    userProjects,
    teamMembers,
    assignProjectLead,
    requestProjectInfo,
    sendProjectMessage,
    sendProjectQuote,
    updateProjectStatus,
    updateProjectPaymentMilestoneStatus,
    publishProjectVisualProposal,
    publishProjectSiteUpdate,
    scheduleProjectEvent,
    addToast,
  } = useAppStore();
  const projectId = viewParams?.id || '';
  const project = useMemo(
    () => userProjects.find(item => item.id === projectId || item.referenceNumber === projectId),
    [projectId, userProjects]
  );
  const activeTeamMembers = teamMembers.filter(member => member.active);
  const [leadName, setLeadName] = useState(project?.assignedTo || activeTeamMembers[0]?.name || '');
  const [infoMessage, setInfoMessage] = useState(project?.missingInfo || 'Merci de compléter les dimensions du terrain et le document foncier disponible.');
  const [quoteAmount, setQuoteAmount] = useState(project?.budgetMax || project?.budgetMin || 0);
  const [quoteLabel, setQuoteLabel] = useState(`Devis ${project?.categoryName || project?.title || 'BTP'}`);
  const [quoteDescription, setQuoteDescription] = useState('Chiffrage structuré pour cadrer le périmètre, les hypothèses, les exclusions, les modalités de paiement et les prochaines décisions du dossier.');
  const [quoteScopeText, setQuoteScopeText] = useState([
    `Ouvrage : ${project?.categoryName || project?.title || 'Projet BTP'}`,
    project?.city ? `Zone d’intervention : ${project.city}` : 'Zone d’intervention à confirmer',
    'Étude du besoin, métrés estimatifs, coordination technique et suivi administratif',
    'Préparation du planning, des jalons de paiement et du suivi projet Buildify',
  ].join('\n'));
  const [quoteAssumptionsText, setQuoteAssumptionsText] = useState([
    'Montant établi sur les informations transmises par le client avant visite ou métrés définitifs.',
    'Le prix final dépend des surfaces validées, des documents disponibles, du standing et des contraintes du terrain.',
    'Le démarrage dépend de la validation du devis, du financement, des pièces de dossier et du calendrier chantier.',
  ].join('\n'));
  const [quoteExclusionsText, setQuoteExclusionsText] = useState([
    'Taxes, frais de dossier, études réglementaires ou prestations non explicitement incluses restent à confirmer.',
    'Toute modification de surface, de matériaux, de délai ou de périmètre pourra entraîner un avenant.',
  ].join('\n'));
  const [quotePaymentTerms, setQuotePaymentTerms] = useState('Paiement par jalons vérifiés : acompte de sécurisation, lancement, avancements documentés, réception et solde après contrôle.');
  const [quoteValidityDays, setQuoteValidityDays] = useState(15);
  const [paymentMilestoneId, setPaymentMilestoneId] = useState(project?.financing?.milestones?.[0]?.id || '');
  const [paymentMilestoneStatus, setPaymentMilestoneStatus] = useState<ProjectPaymentMilestoneData['status']>('due');
  const [paymentMilestoneNote, setPaymentMilestoneNote] = useState('Jalon contrôlé par l’administration Buildify. Le client peut suivre le statut dans son espace projet.');
  const proposalTemplates = getProposalVariantTemplates(project);
  const initialProposalTemplate = proposalTemplates[0];
  const [selectedProposalTemplateId, setSelectedProposalTemplateId] = useState(initialProposalTemplate.id);
  const [proposalTitle, setProposalTitle] = useState(initialProposalTemplate.title);
  const [proposalImage, setProposalImage] = useState(project?.visualProposals?.[0]?.image || initialProposalTemplate.image);
  const [proposalDescription, setProposalDescription] = useState(initialProposalTemplate.description);
  const [proposalEstimate, setProposalEstimate] = useState(initialProposalTemplate.estimate);
  const [proposalDuration, setProposalDuration] = useState(initialProposalTemplate.duration);
  const [proposalConfidence, setProposalConfidence] = useState(initialProposalTemplate.confidence);
  const [proposalDeliverable, setProposalDeliverable] = useState(initialProposalTemplate.deliverable);
  const [proposalStrengthsText, setProposalStrengthsText] = useState(linesToText(initialProposalTemplate.strengths));
  const [proposalCriteriaText, setProposalCriteriaText] = useState(criteriaToText(initialProposalTemplate.decisionCriteria));
  const [proposalScopeText, setProposalScopeText] = useState(linesToText(initialProposalTemplate.technicalScope));
  const [proposalRisksText, setProposalRisksText] = useState(linesToText(initialProposalTemplate.riskControls));
  const [proposalNextText, setProposalNextText] = useState(linesToText(initialProposalTemplate.nextSteps));
  const [adminDirectMessage, setAdminDirectMessage] = useState('Bonjour, votre dossier avance. Vous pouvez nous écrire ici pour toute précision sur le périmètre, le financement ou le planning.');
  const [scheduleType, setScheduleType] = useState<ProjectScheduleItemData['type']>('technical_visit');
  const [scheduleTitle, setScheduleTitle] = useState('Visite technique et cadrage du dossier');
  const [scheduleAt, setScheduleAt] = useState(dateTimeLocalAfter(1, 9, 30));
  const [scheduleDuration, setScheduleDuration] = useState(60);
  const [scheduleMode, setScheduleMode] = useState<ProjectScheduleItemData['mode']>('site');
  const [scheduleTimeZone, setScheduleTimeZone] = useState(project ? projectText(project, 'clientTimeZone') || 'Africa/Abidjan' : 'Africa/Abidjan');
  const [scheduleLocation, setScheduleLocation] = useState(project?.city || '');
  const [schedulePreparation, setSchedulePreparation] = useState('Prévoir plan de situation, document foncier disponible, photos du terrain et contraintes connues.');
  const [scheduleDecisionExpected, setScheduleDecisionExpected] = useState('Valider les prochaines informations nécessaires pour finaliser étude, devis et jalons.');
  const [sitePhase, setSitePhase] = useState(project?.siteUpdates?.[0]?.phase || 'Fondations et implantation');
  const [siteProgress, setSiteProgress] = useState(project?.siteUpdates?.[0]?.progress || Math.max(project?.progress || 25, 25));
  const [siteImageUrl, setSiteImageUrl] = useState(project?.siteUpdates?.[0]?.imageUrl || '/images/chantier-1.png');
  const [siteCaption, setSiteCaption] = useState(project?.siteUpdates?.[0]?.caption || 'Contrôle terrain documenté par l’équipe Buildify.');
  const [siteReport, setSiteReport] = useState(project?.siteUpdates?.[0]?.report || 'Point de contrôle réalisé, photos publiées et prochaine étape à coordonner avec le responsable dossier.');

  if (!project) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-lg border-dashed">
          <CardContent className="p-8 text-center">
            <FolderSearch className="mx-auto size-10 text-muted-foreground" />
            <h1 className="mt-4 text-lg font-semibold">Dossier non synchronisé</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Ce dossier n’existe pas dans le workflow persistant de ce navigateur.
            </p>
            <Button className="mt-5" variant="outline" onClick={goBack}>
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusLabel = PROJECT_STATUS_LABELS[project.status] || project.status;
  const quoteScopeItems = splitQuoteText(quoteScopeText);
  const quoteAssumptionItems = splitQuoteText(quoteAssumptionsText);
  const quoteExclusionItems = splitQuoteText(quoteExclusionsText);
  const quoteDisabled = !Number.isFinite(Number(quoteAmount))
    || Number(quoteAmount) <= 0
    || !quoteLabel.trim()
    || !quoteDescription.trim()
    || quoteScopeItems.length === 0
    || !quotePaymentTerms.trim()
    || !Number.isFinite(Number(quoteValidityDays))
    || Number(quoteValidityDays) < 1;
  const proposalDisabled = !proposalTitle.trim()
    || !proposalImage.trim()
    || !proposalDescription.trim()
    || !proposalEstimate.trim()
    || !proposalDuration.trim()
    || !proposalDeliverable.trim();
  const financing = project.financing || (project.formData?.financing as typeof project.financing);
  const financingDecisionPlan = financing ? buildFinancingDecisionPlan(financing, project.budgetMax || project.budgetMin) : undefined;
  const adminDecisionIcons: LucideIcon[] = [Calculator, PiggyBank, Gauge, Scale, Landmark, Route];
  const selectedLead = activeTeamMembers.find(member => member.name === leadName);
  const assignedMember = activeTeamMembers.find(member => member.name === project.assignedTo);
  const leadRoleLabel = selectedLead ? ROLE_LABELS[selectedLead.role] || selectedLead.role : 'Rôle à définir';
  const leadDepartmentLabel = selectedLead ? DEPARTMENT_LABELS[selectedLead.department] || selectedLead.department : 'Équipe Buildify';
  const visualProposal = project.visualProposal;
  const locationLabel = formatProjectLocation(project);
  const technicalBrief = buildProjectBrief(project);
  const paymentMilestones = financing?.milestones ?? [];
  const selectedPaymentMilestone = paymentMilestones.find(item => item.id === paymentMilestoneId) ?? paymentMilestones[0];
  const latestInfoResponse = project.missingInfoResponses?.[0];
  const financingScore = financing?.affordabilityScore ?? 0;
  const financeRisk = labelFrom(FINANCIAL_RISK_LABELS, financing?.financialRiskLevel);
  const milestoneTotal = paymentMilestones.reduce((total, item) => total + (item.expectedAmount ?? 0), 0);
  const paidAmount = paymentMilestones
    .filter(item => item.status === 'paid')
    .reduce((total, item) => total + (item.expectedAmount ?? 0), 0);
  const dueAmount = paymentMilestones
    .filter(item => item.status === 'due')
    .reduce((total, item) => total + (item.expectedAmount ?? 0), 0);
  const blockedCount = paymentMilestones.filter(item => item.status === 'blocked').length;
  const residualAfterDebt = financing?.monthlyIncome !== undefined
    ? financing.monthlyIncome - (financing.existingMonthlyDebt ?? 0)
    : undefined;
  const residualAfterProject = financing?.monthlyIncome !== undefined
    ? financing.monthlyIncome - (financing.existingMonthlyDebt ?? 0) - (financing.monthlyPaymentCapacity ?? 0)
    : undefined;
  const fundingGap = financing?.estimatedBudget !== undefined
    ? Math.max(0, financing.estimatedBudget - (financing.ownContribution ?? 0) - (financing.requestedLoanAmount ?? 0))
    : undefined;
  const composedIncome = [financing?.baseSalary, financing?.variableMonthlyIncome, financing?.otherMonthlyIncome]
    .filter((value): value is number => value !== undefined)
    .reduce((total, value) => total + value, 0);
  const missingDocumentCount = (financing?.documentReadiness ?? []).includes('none-yet')
    ? 4
    : Math.max(0, 4 - (financing?.documentReadiness ?? []).filter(item => ['id', 'income-proof', 'bank-statements', 'quote-or-plans'].includes(item)).length);
  const paymentMilestoneDisabled = !selectedPaymentMilestone || !paymentMilestoneStatus;
  const nextAdminAction = project.status === 'submitted'
    ? 'Qualifier le dossier'
    : project.status === 'info_required'
      ? 'Relancer les informations'
      : project.status === 'quote_sent'
        ? 'Suivre la décision devis'
        : project.status === 'planning'
          ? 'Structurer le planning'
          : project.status === 'in_progress'
            ? 'Contrôler les jalons'
            : 'Piloter le dossier';
  const representativeRelation = optionalLabel(REPRESENTATIVE_RELATION_LABELS, projectText(project, 'representativeRelation'));
  const coordinationItems = [
    { icon: UserCheck, label: 'Présence', value: optionalLabel(CLIENT_PRESENCE_LABELS, projectText(project, 'clientPresence')) },
    { icon: Globe2, label: 'Résidence', value: projectText(project, 'clientResidenceCountry') },
    { icon: Clock3, label: 'Fuseau', value: optionalLabel(TIME_ZONE_LABELS, projectText(project, 'clientTimeZone')) },
    { icon: MessageCircle, label: 'Canal', value: optionalLabel(CONTACT_CHANNEL_LABELS, projectText(project, 'clientPreferredContactChannel')) },
    { icon: MessageSquareText, label: 'Créneau', value: optionalLabel(CONTACT_WINDOW_LABELS, projectText(project, 'clientContactWindow')) },
    { icon: ShieldCheck, label: 'Validation', value: optionalLabel(REMOTE_DECISION_LABELS, projectText(project, 'remoteDecisionMode')) },
    { icon: UserRoundCheck, label: 'Mandataire', value: projectText(project, 'representativeName') },
    { icon: Send, label: 'Téléphone relais', value: projectText(project, 'representativePhone') },
  ].filter((item): item is { icon: LucideIcon; label: string; value: string } => Boolean(item.value));
  const pilotageItems = [
    { icon: ClipboardCheck, label: 'Action prioritaire', value: nextAdminAction },
    { icon: Landmark, label: 'Finance', value: financingScore ? `${financingScore}% - ${financeRisk}` : financeRisk },
    { icon: ShieldCheck, label: 'Revenu', value: labelFrom(EMPLOYMENT_STATUS_LABELS, financing?.employmentStatus) },
    { icon: FolderSearch, label: 'Secteur', value: labelFrom(FINANCIAL_SECTOR_LABELS, financing?.financialSector) },
    { icon: Clock3, label: 'Contrat', value: labelFrom(CONTRACT_TYPE_LABELS, financing?.contractType) },
  ];
  const checklistItems = [
    { label: 'Contact client', done: Boolean(project.clientEmail || project.clientPhone) },
    { label: 'Coordination', done: Boolean(projectText(project, 'clientPresence')) },
    { label: 'Profil financier', done: Boolean(financing?.employmentStatus && financing?.contractType && financing?.monthlyIncome !== undefined) },
    { label: 'Pièces banque', done: missingDocumentCount === 0 },
    { label: 'Garanties paiement', done: Boolean(financing?.notaryContract || financing?.escrowRequested || financing?.bankSupportRequested) },
    { label: 'Proposition visuelle', done: Boolean(project.visualProposal) },
  ];
  const projectScheduleItems = sortProjectSchedule(project.scheduleItems ?? []);
  const nextScheduleItem = projectScheduleItems.find(item => new Date(item.scheduledAt).getTime() >= Date.now()) ?? projectScheduleItems[0];
  const projectWorkstreams = [
    {
      icon: UserCheck,
      label: 'Client',
      status: project.clientEmail || project.clientPhone ? 'Contactable' : 'Contact incomplet',
      detail: optionalLabel(CLIENT_PRESENCE_LABELS, projectText(project, 'clientPresence')) || 'Présence à qualifier',
      done: Boolean(project.clientEmail || project.clientPhone),
    },
    {
      icon: CalendarDays,
      label: 'Planning',
      status: projectScheduleItems.length ? `${projectScheduleItems.length} événement(s)` : 'À programmer',
      detail: nextScheduleItem ? formatProjectScheduleDate(nextScheduleItem.scheduledAt, nextScheduleItem.timeZone) : 'Rendez-vous ou visite à créer',
      done: projectScheduleItems.length > 0,
    },
    {
      icon: Landmark,
      label: 'Finance',
      status: financingReadinessLabel(financing?.readiness),
      detail: financingScore ? `${financingScore}% · ${financeRisk}` : financeRisk,
      done: financingScore >= 70 || financing?.readiness === 'confirmed',
    },
    {
      icon: ReceiptText,
      label: 'Devis',
      status: (project.quotes ?? []).length ? `${project.quotes?.length} transmis` : 'À préparer',
      detail: project.visualProposal ? 'Proposition validée' : 'Base visuelle à valider',
      done: ['quote_sent', 'accepted', 'contract_prep', 'planning', 'in_progress', 'delivered'].includes(project.status),
    },
    {
      icon: HandCoins,
      label: 'Jalons',
      status: paymentMilestones.length ? `${paymentMilestones.length} échéances` : 'À cadrer',
      detail: dueAmount ? `${FORMAT_XOF(dueAmount)} à régler` : blockedCount ? `${blockedCount} blocage(s)` : 'Aucun appel ouvert',
      done: paymentMilestones.length > 0 && blockedCount === 0,
    },
    {
      icon: Camera,
      label: 'Chantier',
      status: (project.siteUpdates ?? []).length ? `${project.siteUpdates?.length} publication(s)` : 'Non démarré',
      detail: project.progress ? `${project.progress}% global` : 'Planning à construire',
      done: ['in_progress', 'delivered'].includes(project.status),
    },
  ];
  const adminFinancialReadings = [
    { label: 'Après charges', value: amountOrTodo(residualAfterDebt), help: 'Revenu disponible avant la mensualité projet.' },
    { label: 'Après projet', value: amountOrTodo(residualAfterProject), help: 'Marge client après mensualité cible.' },
    { label: 'Écart à couvrir', value: amountOrTodo(fundingGap), help: 'Budget non couvert par apport + financement déclaré.' },
    { label: 'Jalons cadrés', value: milestoneTotal ? FORMAT_XOF(milestoneTotal) : 'À calculer', help: `${paymentMilestones.length} échéance(s), ${blockedCount} blocage(s).` },
  ];
  const prudentMonthlyLimit = financing?.monthlyIncome !== undefined
    ? Math.max(0, Math.round(financing.monthlyIncome * 0.35 - (financing.existingMonthlyDebt ?? 0)))
    : undefined;
  const financingCoveragePercent = financing?.estimatedBudget
    ? Math.round((((financing.ownContribution ?? 0) + (financing.requestedLoanAmount ?? 0)) / financing.estimatedBudget) * 100)
    : undefined;
  const adminFinanceControlItems = [
    {
      icon: Calculator,
      label: 'Mensualité prudente',
      value: amountOrTodo(prudentMonthlyLimit),
      detail: 'Repère à comparer avec la mensualité cible avant devis et contrat.',
      done: financing?.monthlyPaymentCapacity !== undefined && prudentMonthlyLimit !== undefined && financing.monthlyPaymentCapacity <= prudentMonthlyLimit,
    },
    {
      icon: Scale,
      label: 'Effort projeté',
      value: percentOrTodo(financing?.projectedDebtRatioPercent),
      detail: 'Zone confortable sous 35%, vigilance entre 35% et 45%.',
      done: financing?.projectedDebtRatioPercent !== undefined && financing.projectedDebtRatioPercent <= 45,
    },
    {
      icon: PiggyBank,
      label: 'Couverture budget',
      value: percentOrTodo(financingCoveragePercent),
      detail: 'Apport + financement déclaré comparés au budget estimé.',
      done: financingCoveragePercent !== undefined && financingCoveragePercent >= 100,
    },
    {
      icon: Landmark,
      label: 'Banque / fonds',
      value: labelFrom(BANK_STAGE_LABELS, financing?.bankAgreementStage),
      detail: financing?.bankName || 'Banque, conseiller ou preuve de fonds à confirmer.',
      done: ['under-review', 'pre-approved', 'funds-available'].includes(financing?.bankAgreementStage || ''),
    },
  ];
  const adminFinanceEngagementChecks = [
    {
      icon: FileText,
      label: 'Pièces financières',
      detail: missingDocumentCount === 0 ? 'Identité, revenus, relevés et base devis/plans disponibles.' : `${missingDocumentCount} pièce(s) finance à demander au client.`,
      done: missingDocumentCount === 0,
      targetId: 'infoMessage',
    },
    {
      icon: ShieldCheck,
      label: 'Garantie de paiement',
      detail: financing?.notaryContract || financing?.escrowRequested ? 'Protection prévue avant décaissement majeur.' : 'Proposer notaire, séquestre ou cadre contractuel renforcé.',
      done: Boolean(financing?.notaryContract || financing?.escrowRequested),
      targetId: 'infoMessage',
    },
    {
      icon: HandCoins,
      label: 'Jalons publiables',
      detail: paymentMilestones.length ? `${paymentMilestones.length} jalon(s), ${dueAmount ? FORMAT_XOF(dueAmount) : 'aucun paiement dû'}.` : 'Créer un échéancier par étapes vérifiables.',
      done: paymentMilestones.length > 0 && blockedCount === 0,
      targetId: 'paymentMilestone',
    },
    {
      icon: MessageSquareText,
      label: 'Compréhension client',
      detail: financing?.notes ? 'Le client a ajouté une précision financière.' : 'Envoyer une explication si salaire, charges, apport ou banque restent flous.',
      done: Boolean(financing?.notes || financingScore >= 70),
      targetId: 'adminDirectMessage',
    },
  ];
  const hasPendingQuote = (project.quotes ?? []).some(quote => quote.status === 'sent' || quote.status === 'draft');
  const hasAcceptedQuote = (project.quotes ?? []).some(quote => quote.status === 'accepted');
  const hasVisualProposal = Boolean(project.visualProposal || (project.visualProposals ?? []).length);
  const hasUpcomingSchedule = Boolean(nextScheduleItem);
  const hasSiteUpdate = Boolean((project.siteUpdates ?? []).length);
  const adminActionItems: AdminProjectAction[] = [
    {
      id: 'assign',
      icon: UserCheck,
      title: project.assignedTo ? 'Responsable dossier affecté' : 'Affecter un responsable',
      description: project.assignedTo
        ? `${project.assignedTo} pilote ce dossier et apparaît côté client.`
        : 'Le client doit voir un interlocuteur clair pour éviter un espace projet anonyme.',
      statusLabel: project.assignedTo ? 'OK' : 'Prioritaire',
      owner: 'Administration',
      tone: project.assignedTo ? 'done' : 'active',
      targetId: 'leadName',
      actionLabel: project.assignedTo ? 'Changer' : 'Affecter',
    },
    {
      id: 'info',
      icon: MessageSquareText,
      title: latestInfoResponse ? 'Réponse client à analyser' : project.missingInfo ? 'Relancer les informations' : 'Demander les infos manquantes',
      description: latestInfoResponse
        ? 'Une réponse client est disponible : elle peut débloquer le devis, les pièces ou le planning.'
        : project.missingInfo
          ? 'Une demande existe déjà. Relancez ou reformulez si le dossier reste incomplet.'
          : 'Posez une question précise depuis l’administration pour éviter les échanges dispersés.',
      statusLabel: latestInfoResponse ? 'À traiter' : project.missingInfo ? 'En attente' : 'À cadrer',
      owner: 'Chargé dossier',
      tone: latestInfoResponse || !project.missingInfo ? 'active' : 'pending',
      targetId: 'infoMessage',
      actionLabel: 'Ouvrir message',
    },
    {
      id: 'proposal',
      icon: ImageIcon,
      title: hasVisualProposal ? 'Visuel client publié' : 'Publier une proposition visuelle',
      description: hasVisualProposal
        ? 'Le client dispose d’une image consultable, téléchargeable ou validable.'
        : 'Ajoutez une image professionnelle avec critères, risques et prochaines étapes.',
      statusLabel: hasVisualProposal ? 'Publié' : 'À publier',
      owner: 'Études / commercial',
      tone: hasVisualProposal ? 'done' : 'active',
      targetId: 'proposalTitle',
      actionLabel: hasVisualProposal ? 'Publier autre' : 'Préparer',
    },
    {
      id: 'quote',
      icon: ReceiptText,
      title: hasAcceptedQuote ? 'Devis accepté' : hasPendingQuote ? 'Devis à suivre' : 'Préparer un devis clair',
      description: hasAcceptedQuote
        ? 'Le dossier peut avancer vers contrat, planning, jalons et chantier.'
        : hasPendingQuote
          ? 'Un devis est transmis ou en brouillon. Suivez la décision client.'
          : 'Le devis doit reprendre périmètre, hypothèses, exclusions, validité et paiement.',
      statusLabel: hasAcceptedQuote ? 'Accepté' : hasPendingQuote ? 'En cours' : 'À créer',
      owner: 'Administration',
      tone: hasAcceptedQuote ? 'done' : 'active',
      targetId: 'quoteLabel',
      actionLabel: 'Ouvrir devis',
    },
    {
      id: 'schedule',
      icon: CalendarDays,
      title: hasUpcomingSchedule ? 'Rendez-vous publié' : 'Planifier la prochaine étape',
      description: hasUpcomingSchedule
        ? 'Le client peut confirmer, demander un report et lire les préparatifs.'
        : 'Programmez une visite, une réunion visio ou une validation technique.',
      statusLabel: hasUpcomingSchedule ? 'Planifié' : 'À planifier',
      owner: 'Opérations',
      tone: hasUpcomingSchedule ? 'done' : 'active',
      targetId: 'scheduleTitle',
      actionLabel: 'Ouvrir planning',
    },
    {
      id: 'milestones',
      icon: HandCoins,
      title: paymentMilestones.length ? 'Jalons financiers prêts' : 'Créer les jalons financiers',
      description: paymentMilestones.length
        ? 'Les échéances peuvent être suivies, bloquées ou marquées comme dues/payées.'
        : 'Structurez les paiements par étapes vérifiées avant tout décaissement important.',
      statusLabel: paymentMilestones.length ? `${paymentMilestones.length} jalon(s)` : 'À cadrer',
      owner: 'Finance',
      tone: paymentMilestones.length ? 'done' : 'pending',
      targetId: 'paymentMilestone',
      actionLabel: 'Ouvrir jalons',
    },
    {
      id: 'site',
      icon: Camera,
      title: hasSiteUpdate ? 'Suivi chantier publié' : 'Préparer le suivi chantier',
      description: hasSiteUpdate
        ? 'Le client voit les photos, rapports et pourcentages depuis son espace.'
        : 'Publiez les phases, photos et rapports dès que le chantier démarre.',
      statusLabel: hasSiteUpdate ? 'Actif' : 'À venir',
      owner: 'Terrain',
      tone: hasSiteUpdate ? 'done' : 'pending',
      targetId: 'sitePhase',
      actionLabel: 'Ouvrir chantier',
    },
  ];
  const remoteAdminSummaryItems = [
    {
      icon: Globe2,
      label: 'Pays / fuseau',
      value: projectText(project, 'clientResidenceCountry') || project.country || 'À qualifier',
      detail: optionalLabel(TIME_ZONE_LABELS, projectText(project, 'clientTimeZone')) || 'Fuseau à demander avant rendez-vous',
    },
    {
      icon: MessageCircle,
      label: 'Canal officiel',
      value: optionalLabel(CONTACT_CHANNEL_LABELS, projectText(project, 'clientPreferredContactChannel')) || 'E-mail recommandé',
      detail: optionalLabel(CONTACT_WINDOW_LABELS, projectText(project, 'clientContactWindow')) || 'Téléphone accepté avec indicatif pays',
    },
    {
      icon: UserRoundCheck,
      label: 'Mandataire terrain',
      value: projectText(project, 'representativeName') || 'À renseigner',
      detail: projectText(project, 'representativePhone') || 'Contact local utile pour visite, photos et contrôle',
    },
    {
      icon: ShieldCheck,
      label: 'Validation',
      value: optionalLabel(REMOTE_DECISION_LABELS, projectText(project, 'remoteDecisionMode')) || 'Validation écrite conseillée',
      detail: 'Toujours confirmer avant devis, contrat, jalon ou chantier',
    },
  ];
  const remoteAdminChecks = [
    {
      icon: MessageSquareText,
      label: 'Contact client complet',
      detail: project.clientEmail && project.clientPhone ? 'E-mail et téléphone disponibles.' : 'Demander e-mail, téléphone et indicatif pays.',
      done: Boolean(project.clientEmail && project.clientPhone),
      targetId: 'infoMessage',
      actionLabel: 'Demander contact',
    },
    {
      icon: UserRoundCheck,
      label: 'Relais local identifié',
      detail: projectText(project, 'representativeName') ? 'Mandataire ou relais terrain disponible.' : 'Identifier une personne locale avant visite ou démarrage.',
      done: Boolean(projectText(project, 'representativeName')),
      targetId: 'infoMessage',
      actionLabel: 'Demander relais',
    },
    {
      icon: CalendarDays,
      label: 'Rendez-vous adapté au fuseau',
      detail: nextScheduleItem ? formatProjectScheduleDate(nextScheduleItem.scheduledAt, nextScheduleItem.timeZone) : 'Planifier visio, appel, banque ou visite technique.',
      done: Boolean(nextScheduleItem),
      targetId: 'scheduleTitle',
      actionLabel: 'Planifier',
    },
    {
      icon: Landmark,
      label: 'Finance exploitable',
      detail: financingScore ? `${financingScore}% · ${financeRisk}` : 'Compléter revenus, charges, apport, banque et pièces.',
      done: financingScore >= 70 || financing?.readiness === 'confirmed',
      targetId: 'paymentMilestone',
      actionLabel: 'Ouvrir finance',
    },
  ];
  const recentProjectMessages = (project.projectMessages ?? [])
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);
  const scheduleDisabled = !scheduleTitle.trim()
    || !scheduleAt
    || Number.isNaN(new Date(scheduleAt).getTime())
    || !Number.isFinite(Number(scheduleDuration))
    || Number(scheduleDuration) < 15
    || !scheduleMode
    || !scheduleType;

  const handleAssign = () => {
    if (!leadName.trim()) return;
    assignProjectLead(project.id, leadName.trim());
    addToast('Responsable affecté au dossier.', 'success');
  };

  const handleInfoRequest = () => {
    if (!infoMessage.trim()) return;
    requestProjectInfo(project.id, infoMessage.trim());
    addToast('Demande d’information envoyée au client.', 'success');
  };

  const handleDirectMessage = () => {
    const message = adminDirectMessage.trim();
    if (!message) return;
    sendProjectMessage(project.id, { message, senderRole: 'admin' });
    setAdminDirectMessage('');
    addToast('Message envoyé au client.', 'success');
  };

  const handleQuote = () => {
    if (quoteDisabled) return;
    sendProjectQuote(project.id, Number(quoteAmount), quoteLabel.trim(), {
      description: quoteDescription.trim(),
      scope: quoteScopeItems,
      assumptions: quoteAssumptionItems,
      exclusions: quoteExclusionItems,
      paymentTerms: quotePaymentTerms.trim(),
      validityDays: Number(quoteValidityDays),
      currency: 'XOF',
      createdBy: 'Équipe Buildify',
    });
    addToast('Devis transmis au client.', 'success');
  };

  const handlePaymentMilestone = () => {
    if (!selectedPaymentMilestone) return;
    updateProjectPaymentMilestoneStatus(
      project.id,
      selectedPaymentMilestone.id,
      paymentMilestoneStatus,
      paymentMilestoneNote
    );
    addToast('Jalon financier mis à jour.', 'success');
  };

  const applyProposalTemplate = (template: ProposalVariantTemplate) => {
    setSelectedProposalTemplateId(template.id);
    setProposalTitle(template.title);
    setProposalImage(template.image);
    setProposalDescription(template.description);
    setProposalEstimate(template.estimate);
    setProposalDuration(template.duration);
    setProposalConfidence(template.confidence);
    setProposalDeliverable(template.deliverable);
    setProposalStrengthsText(linesToText(template.strengths));
    setProposalCriteriaText(criteriaToText(template.decisionCriteria));
    setProposalScopeText(linesToText(template.technicalScope));
    setProposalRisksText(linesToText(template.riskControls));
    setProposalNextText(linesToText(template.nextSteps));
    addToast('Variante visuelle appliquée au formulaire.', 'success');
  };

  const handlePublishProposal = () => {
    if (proposalDisabled) return;
    publishProjectVisualProposal(project.id, {
      title: proposalTitle.trim(),
      category: project.categoryName || 'Projet BTP',
      image: proposalImage.trim(),
      description: proposalDescription.trim(),
      estimate: proposalEstimate.trim(),
      duration: proposalDuration.trim(),
      confidence: proposalConfidence.trim() || 'À valider',
      deliverable: proposalDeliverable.trim(),
      strengths: splitQuoteText(proposalStrengthsText),
      decisionCriteria: criteriaFromText(proposalCriteriaText),
      technicalScope: splitQuoteText(proposalScopeText),
      riskControls: splitQuoteText(proposalRisksText),
      nextSteps: splitQuoteText(proposalNextText),
      clientCommitment: `La validation retient "${proposalTitle.trim()}" comme orientation visuelle et technique du dossier ${project.referenceNumber}. Elle prépare le chiffrage, le contrat et le planning sans remplacer les validations réglementaires.`,
      publishedBy: 'Équipe Buildify',
    });
    addToast('Proposition visuelle publiée au client.', 'success');
  };

  const handlePlanning = () => {
    updateProjectStatus(project.id, 'planning', 'Projet passé en planification');
    addToast('Projet passé en planification.', 'success');
  };

  const handleScheduleProjectEvent = () => {
    if (scheduleDisabled) return;
    scheduleProjectEvent(project.id, {
      type: scheduleType,
      title: scheduleTitle.trim(),
      scheduledAt: new Date(scheduleAt).toISOString(),
      durationMinutes: Number(scheduleDuration),
      mode: scheduleMode,
      timeZone: scheduleTimeZone || undefined,
      location: scheduleLocation,
      preparation: schedulePreparation,
      decisionExpected: scheduleDecisionExpected,
      createdBy: 'Équipe Buildify',
    });
    addToast('Planning publié dans l’espace projet client.', 'success');
  };

  const siteUpdateDisabled = !sitePhase.trim()
    || !siteCaption.trim()
    || !siteImageUrl.trim()
    || !Number.isFinite(Number(siteProgress))
    || Number(siteProgress) < 0
    || Number(siteProgress) > 100;

  const focusAdminAction = (targetId: string) => {
    const element = document.getElementById(targetId);
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => {
      if (element instanceof HTMLElement) element.focus();
    }, 250);
  };

  const handleSiteUpdate = () => {
    if (siteUpdateDisabled) return;
    publishProjectSiteUpdate(project.id, {
      phase: sitePhase,
      caption: siteCaption,
      report: siteReport,
      imageUrl: siteImageUrl,
      progress: Number(siteProgress),
    });
    addToast('Avancement chantier publié côté client.', 'success');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Button variant="ghost" size="sm" className="mb-2 gap-2 px-0 hover:bg-transparent" onClick={goBack}>
            <ArrowLeft className="size-4" />
            Retour
          </Button>
          <p className="text-xs font-mono text-muted-foreground">{project.referenceNumber}</p>
          <h1 className="mt-1 truncate text-2xl font-bold">{project.title || project.modelName || 'Dossier BTP'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{project.clientName || 'Client Buildify'} · {locationLabel}</p>
        </div>
        <Badge className="w-fit">{statusLabel}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Budget</p>
            <p className="mt-2 text-sm font-semibold">{formatBudgetSummary(project.budgetMin, project.budgetMax)}</p>
          </CardContent>
        </Card>
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Type</p>
            <p className="mt-2 text-sm font-semibold">{project.categoryName || 'Projet BTP'}</p>
          </CardContent>
        </Card>
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Responsable</p>
            <p className="mt-2 text-sm font-semibold">{project.assignedTo || 'À affecter'}</p>
            {assignedMember && (
              <p className="mt-1 text-xs text-muted-foreground">
                {ROLE_LABELS[assignedMember.role] || assignedMember.role} · {DEPARTMENT_LABELS[assignedMember.department] || assignedMember.department}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Avancement</span>
              <span>{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="mt-3 h-1.5" />
          </CardContent>
        </Card>
      </div>

      <AdminDecisionRegister project={project} onFocus={focusAdminAction} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Card className="py-0 gap-0 border-foreground/10">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pilotage admin</p>
                  <h2 className="mt-1 text-lg font-bold">{nextAdminAction}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{project.referenceNumber} · {statusLabel}</p>
                </div>
                <div className="min-w-48 rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>Score dossier</span>
                    <span>{Math.max(project.progress, financingScore)}%</span>
                  </div>
                  <Progress value={Math.max(project.progress, financingScore)} className="mt-2 h-2" />
                </div>
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-4">
                {pilotageItems.map(item => (
                  <div key={item.label} className="flex min-w-0 items-start gap-2 rounded-lg border p-3">
                    <item.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                      <p className="mt-1 text-sm font-semibold break-words">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {checklistItems.map(item => (
                  <div key={item.label} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                    {item.done ? (
                      <CheckCircle2 className="size-4 shrink-0 text-foreground" />
                    ) : (
                      <Clock3 className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="py-0 gap-0 border-foreground/10">
            <CardContent className="p-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Finance approfondie</p>
                  <h2 className="mt-1 text-lg font-bold">Capacité, preuves, protection et engagement client</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Lecture interne pour sécuriser le dossier avant devis ferme, contrat, banque, appels de paiement et lancement chantier.
                  </p>
                </div>
                <Badge variant={financingScore >= 70 ? 'default' : 'outline'}>{financingScore || 0}% finance</Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4">
                {adminFinanceControlItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-lg border bg-background p-3">
                      <div className="flex items-start justify-between gap-2">
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <Badge variant={item.done ? 'default' : 'outline'} className="text-[10px]">
                          {item.done ? 'OK' : 'À suivre'}
                        </Badge>
                      </div>
                      <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                      <p className="mt-1 break-words text-sm font-bold">{item.value}</p>
                      <p className="mt-2 text-[11px] leading-4 text-muted-foreground">{item.detail}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {adminFinanceEngagementChecks.map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex min-h-[148px] flex-col rounded-lg border bg-muted/20 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <Badge variant={item.done ? 'default' : 'outline'} className="text-[10px]">
                          {item.done ? 'Sécurisé' : 'Action'}
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm font-semibold">{item.label}</p>
                      <p className="mt-1 flex-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3 h-9 gap-1.5 text-xs"
                        onClick={() => focusAdminAction(item.targetId)}
                      >
                        Traiter
                        <ArrowLeft className="size-3 rotate-180" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="py-0 gap-0 border-foreground/10">
            <CardContent className="p-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Brief technique client</p>
                  <h2 className="mt-1 text-lg font-bold">Périmètre, surfaces et contraintes exploitables</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Synthèse automatique du formulaire pour préparer les questions, le devis, les visuels et le planning.
                  </p>
                </div>
                <Badge variant="outline">{technicalBrief.chips.length} point(s) cadré(s)</Badge>
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                {technicalBrief.items.map(item => {
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

              {technicalBrief.chips.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
                  {technicalBrief.chips.map(chip => (
                    <div key={chip} className="min-h-10 rounded-lg border bg-muted/30 px-3 py-2 text-xs font-medium leading-5 break-words">
                      {chip}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="py-0 gap-0">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Espace projet avancé</p>
                  <h2 className="mt-1 text-lg font-bold">Dossier, finance, devis et jalons liés</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Lecture opérationnelle pour décider quoi faire avant de lancer un contrat ou un appel de paiement.
                  </p>
                </div>
                <Badge variant="outline">{missingDocumentCount} pièce{missingDocumentCount > 1 ? 's' : ''} à sécuriser</Badge>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {projectWorkstreams.map(stream => (
                  <div key={stream.label} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <stream.icon className="size-4 shrink-0 text-muted-foreground" />
                      <Badge variant={stream.done ? 'default' : 'outline'} className="text-[10px]">
                        {stream.done ? 'OK' : 'À suivre'}
                      </Badge>
                    </div>
                    <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{stream.label}</p>
                    <p className="mt-1 text-sm font-semibold break-words">{stream.status}</p>
                    <p className="mt-2 text-[11px] leading-4 text-muted-foreground">{stream.detail}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
                {adminFinancialReadings.map(item => (
                  <div key={item.label} className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-sm font-bold">{item.value}</p>
                    <p className="mt-2 text-[11px] leading-4 text-muted-foreground">{item.help}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="py-0 gap-0 border-foreground/10">
            <CardContent className="p-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Coordination multi-pays</p>
                  <h2 className="mt-1 text-lg font-bold">Client à distance, mandataire, banque et validations</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    L’administration doit sécuriser le bon canal, le fuseau, le relais terrain et la preuve écrite avant toute décision importante.
                  </p>
                </div>
                <Badge variant="outline">{remoteAdminChecks.filter(item => item.done).length}/4 point(s) sécurisé(s)</Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4">
                {remoteAdminSummaryItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-lg border bg-background p-3">
                      <Icon className="size-4 text-muted-foreground" />
                      <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                      <p className="mt-1 break-words text-sm font-bold">{item.value}</p>
                      <p className="mt-2 text-[11px] leading-4 text-muted-foreground">{item.detail}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                {remoteAdminChecks.map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex min-h-[148px] flex-col rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <Badge variant={item.done ? 'default' : 'outline'} className="text-[10px]">
                          {item.done ? 'OK' : 'À compléter'}
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm font-semibold">{item.label}</p>
                      <p className="mt-1 flex-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3 h-9 gap-1.5 text-xs"
                        onClick={() => focusAdminAction(item.targetId)}
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
            <CardContent className="p-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Plan d’exécution admin</p>
                  <h2 className="mt-1 text-lg font-bold">Actions prioritaires, responsables et accès rapide</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Chaque carte mène au bon formulaire de la plateforme administratrice, sans exposer ces actions côté client.
                  </p>
                </div>
                <Badge variant="outline">{adminActionItems.filter(item => item.tone === 'active').length} priorité(s)</Badge>
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {adminActionItems.map(item => {
                  const Icon = item.icon;
                  const isActive = item.tone === 'active';
                  return (
                    <div
                      key={item.id}
                      className={`flex min-h-[170px] flex-col rounded-lg border p-3 ${
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
                        onClick={() => focusAdminAction(item.targetId)}
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

          <Card className="py-0 gap-0">
            <CardContent className="p-4">
              <h2 className="text-sm font-semibold">Actions dossier</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="leadName">
                    Responsable
                  </label>
                  <select
                    id="leadName"
                    value={leadName}
                    onChange={(event) => setLeadName(event.target.value)}
                    className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    {activeTeamMembers.length === 0 ? (
                      <option value="">Aucun membre actif</option>
                    ) : activeTeamMembers.map(member => (
                      <option key={member.id} value={member.name}>
                        {member.name} · {ROLE_LABELS[member.role] || member.role}
                      </option>
                    ))}
                  </select>
                  {selectedLead && (
                    <div className="mt-3 flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                      <img src={selectedLead.photoUrl} alt={selectedLead.name} className="size-10 shrink-0 rounded-lg object-cover grayscale" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{selectedLead.name}</p>
                        <p className="text-xs text-muted-foreground">{leadRoleLabel} · {leadDepartmentLabel}</p>
                        <p className="mt-1 break-words text-[11px] text-muted-foreground">{selectedLead.email}</p>
                      </div>
                    </div>
                  )}
                  <ConfirmActionDialog
                    title="Affecter ce responsable ?"
                    description={`${leadName.trim() || 'Le responsable sélectionné'} deviendra le pilote du dossier ${project.referenceNumber}. Le client verra le responsable dans son espace projet et recevra une notification.`}
                    confirmLabel="Affecter"
                    onConfirm={handleAssign}
                    trigger={(
                      <Button className="mt-3 w-full gap-2" disabled={!leadName.trim()}>
                        <UserCheck className="size-4" />
                        Affecter
                      </Button>
                    )}
                  />
                </div>

                <div className="rounded-lg border p-3 md:col-span-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">Devis professionnel</h3>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Le client reçoit un document clair avec montant, périmètre, hypothèses, exclusions et modalités de paiement.
                      </p>
                    </div>
                    <Badge variant="outline">Décision client</Badge>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="quoteLabel">
                        Objet du devis
                      </label>
                      <Input
                        id="quoteLabel"
                        value={quoteLabel}
                        onChange={(event) => setQuoteLabel(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="quoteAmount">
                        Montant XOF
                      </label>
                      <Input
                        id="quoteAmount"
                        type="number"
                        min={1}
                        value={quoteAmount || ''}
                        onChange={(event) => setQuoteAmount(Number(event.target.value))}
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="quoteDescription">
                        Lecture client
                      </label>
                      <Textarea
                        id="quoteDescription"
                        value={quoteDescription}
                        onChange={(event) => setQuoteDescription(event.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="quoteValidity">
                        Validité
                      </label>
                      <Input
                        id="quoteValidity"
                        type="number"
                        min={1}
                        value={quoteValidityDays || ''}
                        onChange={(event) => setQuoteValidityDays(Number(event.target.value))}
                      />
                      <p className="text-[11px] text-muted-foreground">Nombre de jours calendaires.</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="quoteScope">
                        Périmètre inclus
                      </label>
                      <Textarea
                        id="quoteScope"
                        value={quoteScopeText}
                        onChange={(event) => setQuoteScopeText(event.target.value)}
                        rows={5}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="quoteAssumptions">
                        Hypothèses
                      </label>
                      <Textarea
                        id="quoteAssumptions"
                        value={quoteAssumptionsText}
                        onChange={(event) => setQuoteAssumptionsText(event.target.value)}
                        rows={5}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="quoteExclusions">
                        Hors périmètre
                      </label>
                      <Textarea
                        id="quoteExclusions"
                        value={quoteExclusionsText}
                        onChange={(event) => setQuoteExclusionsText(event.target.value)}
                        rows={5}
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-3">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="quotePaymentTerms">
                        Modalités de paiement
                      </label>
                      <Textarea
                        id="quotePaymentTerms"
                        value={quotePaymentTerms}
                        onChange={(event) => setQuotePaymentTerms(event.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                  <ConfirmActionDialog
                    title="Transmettre ce devis au client ?"
                    description={`Le client verra ${quoteLabel.trim() || 'ce devis'} de ${FORMAT_XOF(Number(quoteAmount))} pour ${project.referenceNumber}, avec périmètre, hypothèses, validité de ${quoteValidityDays || 0} jour(s) et modalités de paiement. Il pourra le télécharger, l’accepter ou le refuser.`}
                    confirmLabel="Transmettre"
                    onConfirm={handleQuote}
                    trigger={(
                      <Button className="mt-3 w-full gap-2" disabled={quoteDisabled}>
                        <ReceiptText className="size-4" />
                        Transmettre
                      </Button>
                    )}
                  />
                </div>

                <div className="rounded-lg border p-3 md:col-span-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">Proposition visuelle client</h3>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Publiez une image professionnelle consultable, téléchargeable et validable dans l’espace projet client.
                      </p>
                    </div>
                    <Badge variant="outline">{project.visualProposals?.length ?? 0} publiée{(project.visualProposals?.length ?? 0) > 1 ? 's' : ''}</Badge>
                  </div>

                  <div className="mt-3 rounded-lg border bg-muted/20 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold">Bibliothèque de variantes professionnelles</p>
                        <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                          Sélectionnez une proposition adaptée au type d’ouvrage. Les champs image, périmètre, critères et prochaines étapes sont remplis automatiquement.
                        </p>
                      </div>
                      <Badge variant="outline" className="w-fit">{proposalTemplates.length} variante{proposalTemplates.length > 1 ? 's' : ''}</Badge>
                    </div>

                    <div className="mt-3 grid gap-2 lg:grid-cols-3">
                      {proposalTemplates.map(template => {
                        const selected = selectedProposalTemplateId === template.id;
                        return (
                          <div
                            key={template.id}
                            className={`overflow-hidden rounded-lg border bg-background ${selected ? 'border-foreground shadow-sm' : ''}`}
                          >
                            <div className="relative aspect-[16/10] bg-muted">
                              <NextImage
                                src={template.image}
                                alt={template.title}
                                fill
                                className="object-cover grayscale"
                                sizes="(min-width: 1024px) 20vw, 90vw"
                              />
                              <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
                                <Badge className="bg-white text-black hover:bg-white">{template.category}</Badge>
                                {selected && <Badge className="bg-black text-white hover:bg-black">Sélectionnée</Badge>}
                              </div>
                            </div>
                            <div className="p-3">
                              <p className="text-sm font-semibold leading-5">{template.title}</p>
                              <p className="mt-1 line-clamp-3 text-xs leading-5 text-muted-foreground">{template.description}</p>
                              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                                <div className="rounded-md border px-2 py-1.5">
                                  <p className="text-muted-foreground">Budget</p>
                                  <p className="mt-0.5 text-[10px] font-semibold leading-4 break-words">
                                    {compactProposalEstimate(template.estimate)}
                                  </p>
                                </div>
                                <div className="rounded-md border px-2 py-1.5">
                                  <p className="text-muted-foreground">Délai</p>
                                  <p className="mt-0.5 font-semibold">{template.duration}</p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant={selected ? 'default' : 'outline'}
                                size="sm"
                                className="mt-3 h-9 w-full gap-1.5 text-xs"
                                onClick={() => applyProposalTemplate(template)}
                              >
                                <ImageIcon className="size-3.5" />
                                Appliquer cette variante
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="proposalTitle">
                        Titre
                      </label>
                      <Input id="proposalTitle" value={proposalTitle} onChange={event => setProposalTitle(event.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="proposalEstimate">
                        Budget indicatif
                      </label>
                      <Input id="proposalEstimate" value={proposalEstimate} onChange={event => setProposalEstimate(event.target.value)} />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="proposalImage">
                        Image
                      </label>
                      <Input id="proposalImage" value={proposalImage} onChange={event => setProposalImage(event.target.value)} placeholder="/images/maison-basse-1.png" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="proposalDuration">
                        Délai
                      </label>
                      <Input id="proposalDuration" value={proposalDuration} onChange={event => setProposalDuration(event.target.value)} />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="proposalDescription">
                        Description client
                      </label>
                      <Textarea id="proposalDescription" value={proposalDescription} onChange={event => setProposalDescription(event.target.value)} rows={3} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="proposalConfidence">
                        Niveau de décision
                      </label>
                      <Input id="proposalConfidence" value={proposalConfidence} onChange={event => setProposalConfidence(event.target.value)} />
                    </div>
                    <div className="space-y-1.5 md:col-span-3">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="proposalDeliverable">
                        Livrable
                      </label>
                      <Input id="proposalDeliverable" value={proposalDeliverable} onChange={event => setProposalDeliverable(event.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="proposalStrengths">
                        Points forts
                      </label>
                      <Textarea id="proposalStrengths" value={proposalStrengthsText} onChange={event => setProposalStrengthsText(event.target.value)} rows={4} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="proposalScope">
                        Périmètre
                      </label>
                      <Textarea id="proposalScope" value={proposalScopeText} onChange={event => setProposalScopeText(event.target.value)} rows={4} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="proposalRisks">
                        Vigilances
                      </label>
                      <Textarea id="proposalRisks" value={proposalRisksText} onChange={event => setProposalRisksText(event.target.value)} rows={4} />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="proposalCriteria">
                        Critères décisionnels
                      </label>
                      <Textarea id="proposalCriteria" value={proposalCriteriaText} onChange={event => setProposalCriteriaText(event.target.value)} rows={4} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="proposalNext">
                        Prochaines étapes
                      </label>
                      <Textarea id="proposalNext" value={proposalNextText} onChange={event => setProposalNextText(event.target.value)} rows={4} />
                    </div>
                  </div>

                  <ConfirmActionDialog
                    title="Publier cette proposition visuelle ?"
                    description={`Le client verra "${proposalTitle.trim() || 'cette proposition'}" avec l’image, la fiche téléchargeable, le comparatif et le bouton de validation.`}
                    confirmLabel="Publier"
                    onConfirm={handlePublishProposal}
                    trigger={(
                      <Button className="mt-3 w-full gap-2" disabled={proposalDisabled}>
                        <ImageIcon className="size-4" />
                        Publier au client
                      </Button>
                    )}
                  />
                </div>
              </div>

              <Separator className="my-4" />

              <div className="rounded-lg border p-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Programmer rendez-vous ou visite</h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      L’événement apparaît dans l’onglet Planning du client, dans le fil de messages et dans les modules admin.
                    </p>
                  </div>
                  <Badge variant="outline">{projectScheduleItems.length} événement{projectScheduleItems.length > 1 ? 's' : ''}</Badge>
                </div>

                {nextScheduleItem && (
                  <div className="mt-3 space-y-2">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-start gap-2">
                          <CalendarCheck2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Prochain événement</p>
                            <p className="mt-1 text-sm font-semibold break-words">{nextScheduleItem.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatProjectScheduleDate(nextScheduleItem.scheduledAt, nextScheduleItem.timeZone)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-start gap-2">
                          <MapPinned className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Mode et statut</p>
                            <p className="mt-1 text-sm font-semibold break-words">
                              {projectScheduleTypeLabel(nextScheduleItem.type)} · {projectScheduleModeLabel(nextScheduleItem.mode)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">{projectScheduleStatusLabel(nextScheduleItem.status)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {(nextScheduleItem.clientResponseNote || nextScheduleItem.clientRespondedAt) && (
                      <div className="rounded-lg border bg-background p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Retour client</p>
                        <p className="mt-1 text-sm font-semibold break-words">
                          {nextScheduleItem.clientResponseNote || `${nextScheduleItem.clientRespondedBy || 'Client'} a répondu au planning.`}
                        </p>
                        {nextScheduleItem.clientRespondedAt && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {new Date(nextScheduleItem.clientRespondedAt).toLocaleString('fr-FR')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="scheduleType">
                      Type
                    </label>
                    <select
                      id="scheduleType"
                      value={scheduleType}
                      onChange={event => setScheduleType(event.target.value as ProjectScheduleItemData['type'])}
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    >
                      {Object.entries(PROJECT_SCHEDULE_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="scheduleMode">
                      Mode
                    </label>
                    <select
                      id="scheduleMode"
                      value={scheduleMode}
                      onChange={event => setScheduleMode(event.target.value as ProjectScheduleItemData['mode'])}
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    >
                      {Object.entries(PROJECT_SCHEDULE_MODE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="scheduleTitle">
                      Objet clair
                    </label>
                    <Input id="scheduleTitle" value={scheduleTitle} onChange={event => setScheduleTitle(event.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="scheduleAt">
                      Date et heure
                    </label>
                    <Input id="scheduleAt" type="datetime-local" value={scheduleAt} onChange={event => setScheduleAt(event.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="scheduleDuration">
                      Durée minutes
                    </label>
                    <Input
                      id="scheduleDuration"
                      type="number"
                      min={15}
                      step={15}
                      value={scheduleDuration}
                      onChange={event => setScheduleDuration(Number(event.target.value || 0))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="scheduleTimeZone">
                      Fuseau client
                    </label>
                    <select
                      id="scheduleTimeZone"
                      value={scheduleTimeZone}
                      onChange={event => setScheduleTimeZone(event.target.value)}
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    >
                      {Object.entries(TIME_ZONE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="scheduleLocation">
                      Lieu ou lien
                    </label>
                    <Input id="scheduleLocation" value={scheduleLocation} onChange={event => setScheduleLocation(event.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="schedulePreparation">
                      Préparation attendue
                    </label>
                    <Textarea id="schedulePreparation" value={schedulePreparation} onChange={event => setSchedulePreparation(event.target.value)} rows={4} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="scheduleDecision">
                      Décision attendue
                    </label>
                    <Textarea id="scheduleDecision" value={scheduleDecisionExpected} onChange={event => setScheduleDecisionExpected(event.target.value)} rows={4} />
                  </div>
                </div>
                <ConfirmActionDialog
                  title="Publier cet événement au client ?"
                  description={`${projectScheduleTypeLabel(scheduleType)} : ${scheduleTitle.trim() || 'événement'} sera visible dans le Planning, les Messages et les Notifications du dossier ${project.referenceNumber}.`}
                  confirmLabel="Programmer"
                  onConfirm={handleScheduleProjectEvent}
                  trigger={(
                    <Button className="mt-3 w-full gap-2 sm:w-auto" disabled={scheduleDisabled}>
                      <NotebookTabs className="size-4" />
                      Programmer
                    </Button>
                  )}
                />
              </div>

              <Separator className="my-4" />

              <div className="rounded-lg border p-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Publier un avancement chantier</h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      La photo, le rapport et la progression apparaissent dans l’espace projet client.
                    </p>
                  </div>
                  <Badge variant="outline">{(project.siteUpdates ?? []).length} publication{(project.siteUpdates ?? []).length > 1 ? 's' : ''}</Badge>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="sitePhase">
                      Phase
                    </label>
                    <Input id="sitePhase" value={sitePhase} onChange={event => setSitePhase(event.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="siteProgress">
                      Progression
                    </label>
                    <Input
                      id="siteProgress"
                      type="number"
                      min={0}
                      max={100}
                      value={siteProgress}
                      onChange={event => setSiteProgress(Number(event.target.value || 0))}
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="siteImageUrl">
                      Photo
                    </label>
                    <Input id="siteImageUrl" value={siteImageUrl} onChange={event => setSiteImageUrl(event.target.value)} />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="siteCaption">
                      Légende client
                    </label>
                    <Input id="siteCaption" value={siteCaption} onChange={event => setSiteCaption(event.target.value)} />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="siteReport">
                      Rapport court
                    </label>
                    <Textarea id="siteReport" value={siteReport} onChange={event => setSiteReport(event.target.value)} className="min-h-20" />
                  </div>
                </div>
                <ConfirmActionDialog
                  title="Publier cet avancement au client ?"
                  description={`Le client verra la phase "${sitePhase.trim() || 'chantier'}", la photo et le rapport dans son onglet chantier. Une notification sera créée.`}
                  confirmLabel="Publier"
                  onConfirm={handleSiteUpdate}
                  trigger={(
                    <Button className="mt-3 w-full gap-2 sm:w-auto" disabled={siteUpdateDisabled}>
                      <Camera className="size-4" />
                      Publier l’avancement
                    </Button>
                  )}
                />
              </div>

              <Separator className="my-4" />

              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="infoMessage">
                Information complémentaire
              </label>
              <Textarea
                id="infoMessage"
                value={infoMessage}
                onChange={(event) => setInfoMessage(event.target.value)}
                className="mt-2 min-h-24"
              />
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <ConfirmActionDialog
                  title="Envoyer cette demande au client ?"
                  description={`Cette demande sera visible dans la plateforme client du dossier ${project.referenceNumber}. Le client devra compléter l’information avant la suite du traitement.`}
                  confirmLabel="Envoyer"
                  onConfirm={handleInfoRequest}
                  trigger={(
                    <Button className="gap-2" disabled={!infoMessage.trim()}>
                      <MessageSquareText className="size-4" />
                      Demander au client
                    </Button>
                  )}
                />
                <ConfirmActionDialog
                  title="Passer le dossier en planification ?"
                  description={`Le statut du dossier ${project.referenceNumber} changera en planification. Utilisez cette action lorsque le périmètre, le devis et les prochaines étapes sont suffisamment cadrés.`}
                  confirmLabel="Planifier"
                  onConfirm={handlePlanning}
                  trigger={(
                    <Button variant="outline" className="gap-2">
                      <ClipboardCheck className="size-4" />
                      Passer en planification
                    </Button>
                  )}
                />
              </div>

              <Separator className="my-4" />

              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="adminDirectMessage">
                Message direct au client
              </label>
              <Textarea
                id="adminDirectMessage"
                value={adminDirectMessage}
                onChange={(event) => setAdminDirectMessage(event.target.value)}
                className="mt-2 min-h-24"
              />
              <ConfirmActionDialog
                title="Envoyer ce message au client ?"
                description={`Le message sera ajouté au fil de discussion du dossier ${project.referenceNumber} et une notification client sera créée.`}
                confirmLabel="Envoyer"
                onConfirm={handleDirectMessage}
                trigger={(
                  <Button className="mt-3 gap-2" disabled={!adminDirectMessage.trim()}>
                    <MessageSquareText className="size-4" />
                    Envoyer au client
                  </Button>
                )}
              />
            </CardContent>
          </Card>

          <Card className="py-0 gap-0">
            <CardContent className="p-4">
              <h2 className="text-sm font-semibold">Journal d’activité</h2>
              <div className="mt-3 divide-y">
                {(project.activityLog ?? []).length === 0 ? (
                  <p className="py-6 text-sm text-muted-foreground">Aucune activité enregistrée.</p>
                ) : (
                  (project.activityLog ?? []).map(item => (
                    <div key={item.id} className="flex items-start gap-3 py-3">
                      <span className="mt-1 size-2 rounded-full bg-foreground" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.actor} · {new Date(item.createdAt).toLocaleString('fr-FR')}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {coordinationItems.length > 0 && (
            <Card className="py-0 gap-0">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold">Coordination hors pays</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{representativeRelation || 'Suivi direct client'}</p>
                  </div>
                  <Globe2 className="size-4 shrink-0 text-muted-foreground" />
                </div>
                <div className="mt-3 grid gap-2">
                  {coordinationItems.map(item => (
                    <div key={item.label} className="flex min-w-0 items-start gap-2 rounded-lg border p-3">
                      <item.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                        <p className="mt-1 text-sm font-semibold break-words">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="py-0 gap-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Camera className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Suivi chantier publié</h2>
              </div>
              {(project.siteUpdates ?? []).length === 0 ? (
                <p className="mt-3 rounded-lg border border-dashed p-4 text-sm leading-6 text-muted-foreground">
                  Aucun avancement chantier publié. Utilisez l’action de publication pour alimenter l’espace client.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {(project.siteUpdates ?? []).slice(0, 3).map(update => (
                    <div key={update.id} className="overflow-hidden rounded-lg border">
                      <div className="grid grid-cols-[88px_minmax(0,1fr)]">
                        <div className="h-full min-h-24 bg-muted">
                          <img src={update.imageUrl} alt={update.caption} className="h-full w-full object-cover grayscale" />
                        </div>
                        <div className="min-w-0 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold">{update.phase}</p>
                            <Badge variant="outline" className="text-[10px]">{update.progress}%</Badge>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">{update.caption}</p>
                          <p className="mt-2 text-[11px] text-muted-foreground">
                            {new Date(update.createdAt).toLocaleDateString('fr-FR')} · {update.createdBy || 'Équipe'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="py-0 gap-0">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">Financement</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{financingReadinessLabel(financing?.readiness)}</p>
                </div>
                <Landmark className="size-4 text-muted-foreground" />
              </div>
              <div className="mt-3 grid gap-2">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>Score financement</span>
                    <span>{financingScore || 0}%</span>
                  </div>
                  <Progress value={financingScore} className="mt-2 h-2" />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-[10px]">{financeRisk}</Badge>
                    <Badge variant="outline" className="text-[10px]">{labelFrom(EMPLOYMENT_STATUS_LABELS, financing?.employmentStatus)}</Badge>
                  </div>
                </div>
                {financingDecisionPlan && (
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Badge variant={financingDecisionPlan.tone === 'ready' ? 'default' : 'outline'} className="text-[10px]">
                          {financingDecisionPlan.label}
                        </Badge>
                        <h3 className="mt-2 text-sm font-semibold leading-5">{financingDecisionPlan.title}</h3>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{financingDecisionPlan.advisory}</p>
                      </div>
                      <Calculator className="size-4 shrink-0 text-muted-foreground" />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {financingDecisionPlan.metrics.slice(0, 4).map((metric, index) => {
                        const MetricIcon = adminDecisionIcons[index] || Calculator;
                        return (
                          <div key={metric.label} className="rounded-lg border bg-background p-2">
                            <MetricIcon className="size-3.5 text-muted-foreground" />
                            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{metric.label}</p>
                            <p className="mt-1 text-xs font-bold break-words">{metric.value}</p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 space-y-2">
                      {financingDecisionPlan.actions.slice(0, 4).map(action => {
                        const ActionIcon = action.status === 'ok' ? CheckCircle2 : action.status === 'watch' ? Clock3 : AlertCircle;
                        return (
                          <div key={action.label} className="flex items-start gap-2 rounded-lg border bg-background p-2">
                            <ActionIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold">{action.label}</p>
                              <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{action.detail}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {financingDecisionPlan.warnings.length > 0 && (
                      <div className="mt-3 rounded-lg border border-dashed bg-background p-2 text-[11px] leading-4 text-muted-foreground">
                        {financingDecisionPlan.warnings[0]}
                      </div>
                    )}
                  </div>
                )}
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Mode</p>
                  <p className="mt-1 text-sm font-semibold">{financingModeLabel(financing?.mode)}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Revenu</p>
                    <p className="mt-1 text-xs font-semibold">{amountOrTodo(financing?.monthlyIncome)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Salaire base</p>
                    <p className="mt-1 text-xs font-semibold">{amountOrTodo(financing?.baseSalary)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Variables</p>
                    <p className="mt-1 text-xs font-semibold">
                      {composedIncome ? FORMAT_XOF((financing?.variableMonthlyIncome ?? 0) + (financing?.otherMonthlyIncome ?? 0)) : 'À compléter'}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Secteur</p>
                    <p className="mt-1 text-xs font-semibold">{labelFrom(FINANCIAL_SECTOR_LABELS, financing?.financialSector)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Contrat</p>
                    <p className="mt-1 text-xs font-semibold">{labelFrom(CONTRACT_TYPE_LABELS, financing?.contractType)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Apport</p>
                    <p className="mt-1 text-xs font-semibold">{amountOrTodo(financing?.ownContribution)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Mensualité</p>
                    <p className="mt-1 text-xs font-semibold">{amountOrTodo(financing?.monthlyPaymentCapacity)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ratio projeté</p>
                    <p className="mt-1 text-xs font-semibold">{percentOrTodo(financing?.projectedDebtRatioPercent)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Apport %</p>
                    <p className="mt-1 text-xs font-semibold">{percentOrTodo(financing?.equityRatioPercent)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Réserve</p>
                    <p className="mt-1 text-xs font-semibold">
                      {financing?.cashReserveMonths !== undefined ? `${financing.cashReserveMonths} mois` : 'À calculer'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Prêt demandé</p>
                    <p className="mt-1 text-xs font-semibold">{amountOrTodo(financing?.requestedLoanAmount)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Accord banque</p>
                    <p className="mt-1 text-xs font-semibold">{labelFrom(BANK_STAGE_LABELS, financing?.bankAgreementStage)}</p>
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Banque</p>
                  <p className="mt-1 text-sm font-semibold">{financing?.bankName || 'À contacter'}</p>
                  {financing?.bankContact && <p className="mt-1 text-xs text-muted-foreground">{financing.bankContact}</p>}
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Employeur / activité</p>
                  <p className="mt-1 text-sm font-semibold break-words">{financing?.employerName || 'À compléter'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Domiciliation : {financing?.salaryDomiciliationBank || 'à préciser'}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pièces déclarées</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(financing?.documentReadiness?.length ? financing.documentReadiness : ['none-yet']).map(item => (
                      <Badge key={item} variant="outline" className="text-[10px]">
                        {labelFrom(FINANCING_DOCUMENT_LABELS, item)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={financing?.notaryContract ? 'default' : 'outline'} className="gap-1">
                    <ShieldCheck className="size-3" />
                    Notaire
                  </Badge>
                  <Badge variant={financing?.bankSupportRequested ? 'default' : 'outline'} className="gap-1">
                    <Landmark className="size-3" />
                    Banque
                  </Badge>
                  <Badge variant={financing?.escrowRequested ? 'default' : 'outline'} className="gap-1">
                    <CheckCircle2 className="size-3" />
                    Séquestre
                  </Badge>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-start gap-2">
                    <HandCoins className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <h3 className="text-sm font-semibold">Pilotage des jalons</h3>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Publiez un statut financier clair dans l’espace client.
                      </p>
                    </div>
                  </div>
                  {paymentMilestones.length === 0 ? (
                    <p className="mt-3 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                      Aucun échéancier financier défini.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="paymentMilestone">
                          Jalon
                        </label>
                        <select
                          id="paymentMilestone"
                          value={selectedPaymentMilestone?.id || ''}
                          onChange={(event) => setPaymentMilestoneId(event.target.value)}
                          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        >
                          {paymentMilestones.map(milestone => (
                            <option key={milestone.id} value={milestone.id}>
                              {milestone.label} · {milestone.expectedAmount ? FORMAT_XOF(milestone.expectedAmount) : `${milestone.percent}%`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="paymentStatus">
                            Statut
                          </label>
                          <select
                            id="paymentStatus"
                            value={paymentMilestoneStatus}
                            onChange={(event) => setPaymentMilestoneStatus(event.target.value as ProjectPaymentMilestoneData['status'])}
                            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                          >
                            {PAYMENT_MILESTONE_STATUS_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Actuel</p>
                          <p className="mt-1 text-xs font-semibold">
                            {paymentMilestoneStatusLabel(selectedPaymentMilestone?.status)}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="paymentNote">
                          Note client
                        </label>
                        <Textarea
                          id="paymentNote"
                          value={paymentMilestoneNote}
                          onChange={(event) => setPaymentMilestoneNote(event.target.value)}
                          rows={3}
                        />
                      </div>
                      <ConfirmActionDialog
                        title="Mettre à jour ce jalon financier ?"
                        description={`${selectedPaymentMilestone?.label || 'Ce jalon'} passera au statut ${paymentMilestoneStatusLabel(paymentMilestoneStatus).toLowerCase()} dans l’espace client. Une notification sera envoyée au client.`}
                        confirmLabel="Mettre à jour"
                        onConfirm={handlePaymentMilestone}
                        trigger={(
                          <Button className="w-full gap-2" disabled={paymentMilestoneDisabled}>
                            <HandCoins className="size-4" />
                            Mettre à jour
                          </Button>
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-0 gap-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Proposition visuelle retenue</h2>
              </div>
              {visualProposal ? (
                <div className="mt-3 overflow-hidden rounded-lg border">
                  <div className="relative aspect-[16/10] bg-muted">
                    <NextImage
                      src={visualProposal.image}
                      alt={visualProposal.title}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 360px, 100vw"
                    />
                  </div>
                  <div className="space-y-3 p-3">
                    <div>
                      <p className="text-sm font-semibold">{visualProposal.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {visualProposal.category}
                        {visualProposal.validatedAt ? ` · ${new Date(visualProposal.validatedAt).toLocaleString('fr-FR')}` : ''}
                      </p>
                    </div>
                    <p className="text-xs leading-5 text-muted-foreground">{visualProposal.deliverable}</p>
                    {(visualProposal.decisionCriteria ?? []).length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {(visualProposal.decisionCriteria ?? []).slice(0, 4).map(item => (
                          <div key={item.label} className="rounded-lg border bg-muted/30 p-2">
                            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                            <p className="mt-1 text-xs font-semibold">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {(visualProposal.strengths ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {(visualProposal.strengths ?? []).map(strength => (
                          <Badge key={strength} variant="outline" className="text-[10px]">{strength}</Badge>
                        ))}
                      </div>
                    )}
                    {visualProposal.clientCommitment && (
                      <p className="rounded-lg border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
                        {visualProposal.clientCommitment}
                      </p>
                    )}
                    {(visualProposal.nextSteps ?? []).length > 0 && (
                      <div className="rounded-lg border p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Suite admin</p>
                        <ul className="mt-2 space-y-1.5 text-xs leading-5 text-muted-foreground">
                          {(visualProposal.nextSteps ?? []).map(step => <li key={step}>• {step}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Le client n’a pas encore validé de proposition visuelle.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="py-0 gap-0">
            <CardContent className="p-4">
              <h2 className="text-sm font-semibold">Documents</h2>
              <div className="mt-3 space-y-2">
                {(project.documents ?? []).length === 0 ? (
                  <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Aucun document déclaré.</p>
                ) : (
                  (project.documents ?? []).map(document => (
                    <div key={document.id} className="rounded-lg border p-3">
                      <div className="flex items-start gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <FileText className="size-4 text-muted-foreground" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{document.name}</p>
                          <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                            <span className="rounded-md bg-muted px-2 py-1">{document.date}</span>
                            <span className="rounded-md bg-muted px-2 py-1">{documentTypeLabel(document.type)}</span>
                            <span className="rounded-md bg-muted px-2 py-1">{formatDocumentSize(document.size)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadAdminDocumentReceipt(document, project)}>
                          <Download className="size-3.5" />
                          Fiche admin
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => openAdminOriginalDocument(document)} disabled={!document.url}>
                          <FolderSearch className="size-3.5" />
                          Original
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="py-0 gap-0">
            <CardContent className="p-4">
              <h2 className="text-sm font-semibold">Devis transmis</h2>
              <div className="mt-3 space-y-2">
                {(project.quotes ?? []).length === 0 ? (
                  <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Aucun devis transmis.</p>
                ) : (
                  (project.quotes ?? []).map(quote => (
                    <div key={quote.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{quote.label}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{quote.date}</p>
                        </div>
                        <Badge variant="secondary">{quoteStatusLabel(quote.status)}</Badge>
                      </div>
                      <p className="mt-3 text-sm font-bold">{FORMAT_XOF(quote.amount)}</p>
                      {quote.description && (
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">{quote.description}</p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {quote.validityDays ? <Badge variant="outline" className="text-[10px]">{quote.validityDays} j de validité</Badge> : null}
                        {quote.createdBy ? <Badge variant="outline" className="text-[10px]">{quote.createdBy}</Badge> : null}
                        {quote.scope?.length ? <Badge variant="outline" className="text-[10px]">{quote.scope.length} poste{quote.scope.length > 1 ? 's' : ''}</Badge> : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="py-0 gap-0">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <MessageSquareText className="mt-0.5 size-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold">Conversation projet</h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Messages directs visibles dans l’espace client et dans le module Messages admin.
                  </p>
                  {recentProjectMessages.length === 0 ? (
                    <p className="mt-3 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                      Aucun message direct pour ce dossier.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {recentProjectMessages.map(message => (
                        <div key={message.id} className="rounded-lg border bg-muted/30 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-semibold">{message.senderName}</p>
                            <Badge variant={message.senderRole === 'admin' ? 'secondary' : 'outline'} className="text-[10px]">
                              {message.senderRole === 'admin' ? 'Admin' : 'Client'}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm leading-6">{message.message}</p>
                          <p className="mt-2 text-[11px] text-muted-foreground">
                            {new Date(message.createdAt).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {project.missingInfo && (
            <Card className="py-0 gap-0">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Send className="mt-0.5 size-4 text-muted-foreground" />
                  <div>
                    <h2 className="text-sm font-semibold">Info demandée</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{project.missingInfo}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {latestInfoResponse && (
            <Card className="py-0 gap-0">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <MessageSquareText className="mt-0.5 size-4 text-muted-foreground" />
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold">Réponse client reçue</h2>
                    {latestInfoResponse.requestMessage && (
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Demande : {latestInfoResponse.requestMessage}
                      </p>
                    )}
                    <p className="mt-2 rounded-lg border bg-muted/30 p-3 text-sm leading-6">
                      {latestInfoResponse.message}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {latestInfoResponse.respondedBy || 'Client'} · {new Date(latestInfoResponse.respondedAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
