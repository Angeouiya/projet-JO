'use client';

import NextImage from 'next/image';
import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FolderSearch,
  Globe2,
  Image as ImageIcon,
  Landmark,
  MessageCircle,
  MessageSquareText,
  ReceiptText,
  Send,
  ShieldCheck,
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
import type { ProjectData } from '@/types';
import { formatProjectLocation } from '@/lib/project-format';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';

const TEAM_LEADS = ['Awa Kouadio', 'Moussa Traoré', 'Ibrahim Diarra', 'Fatou Koné'];

function formatBudget(min?: number, max?: number) {
  if (min && max) return `${FORMAT_XOF(min)} - ${FORMAT_XOF(max)}`;
  if (max) return FORMAT_XOF(max);
  if (min) return FORMAT_XOF(min);
  return 'À estimer';
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

function labelFrom(labels: Record<string, string>, value?: string) {
  if (!value) return 'À compléter';
  return labels[value] || value;
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

export function AdminProjectDetail() {
  const {
    goBack,
    viewParams,
    userProjects,
    assignProjectLead,
    requestProjectInfo,
    sendProjectMessage,
    sendProjectQuote,
    updateProjectStatus,
    publishProjectSiteUpdate,
    addToast,
  } = useAppStore();
  const projectId = viewParams?.id || '';
  const project = useMemo(
    () => userProjects.find(item => item.id === projectId || item.referenceNumber === projectId),
    [projectId, userProjects]
  );
  const [leadName, setLeadName] = useState(project?.assignedTo || TEAM_LEADS[0]);
  const [infoMessage, setInfoMessage] = useState(project?.missingInfo || 'Merci de compléter les dimensions du terrain et le document foncier disponible.');
  const [quoteAmount, setQuoteAmount] = useState(project?.budgetMax || project?.budgetMin || 0);
  const [adminDirectMessage, setAdminDirectMessage] = useState('Bonjour, votre dossier avance. Vous pouvez nous écrire ici pour toute précision sur le périmètre, le financement ou le planning.');
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
  const quoteDisabled = !Number.isFinite(Number(quoteAmount)) || Number(quoteAmount) <= 0;
  const financing = project.financing || (project.formData?.financing as typeof project.financing);
  const visualProposal = project.visualProposal;
  const locationLabel = formatProjectLocation(project);
  const latestInfoResponse = project.missingInfoResponses?.[0];
  const financingScore = financing?.affordabilityScore ?? 0;
  const financeRisk = labelFrom(FINANCIAL_RISK_LABELS, financing?.financialRiskLevel);
  const missingDocumentCount = (financing?.documentReadiness ?? []).includes('none-yet')
    ? 4
    : Math.max(0, 4 - (financing?.documentReadiness ?? []).filter(item => ['id', 'income-proof', 'bank-statements', 'quote-or-plans'].includes(item)).length);
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
    { icon: Clock3, label: 'Stabilité', value: labelFrom(INCOME_STABILITY_LABELS, financing?.incomeStability) },
  ];
  const checklistItems = [
    { label: 'Contact client', done: Boolean(project.clientEmail || project.clientPhone) },
    { label: 'Coordination', done: Boolean(projectText(project, 'clientPresence')) },
    { label: 'Profil financier', done: Boolean(financing?.employmentStatus && financing?.monthlyIncome !== undefined) },
    { label: 'Pièces banque', done: missingDocumentCount === 0 },
    { label: 'Garanties paiement', done: Boolean(financing?.notaryContract || financing?.escrowRequested || financing?.bankSupportRequested) },
    { label: 'Proposition visuelle', done: Boolean(project.visualProposal) },
  ];
  const recentProjectMessages = (project.projectMessages ?? [])
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

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
    sendProjectQuote(project.id, Number(quoteAmount), `Devis ${project.categoryName || 'BTP'}`);
    addToast('Devis transmis au client.', 'success');
  };

  const handlePlanning = () => {
    updateProjectStatus(project.id, 'planning', 'Projet passé en planification');
    addToast('Projet passé en planification.', 'success');
  };

  const siteUpdateDisabled = !sitePhase.trim()
    || !siteCaption.trim()
    || !siteImageUrl.trim()
    || !Number.isFinite(Number(siteProgress))
    || Number(siteProgress) < 0
    || Number(siteProgress) > 100;

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
            <p className="mt-2 text-sm font-semibold">{formatBudget(project.budgetMin, project.budgetMax)}</p>
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
                    {TEAM_LEADS.map(lead => <option key={lead} value={lead}>{lead}</option>)}
                  </select>
                  <ConfirmActionDialog
                    title="Affecter ce responsable ?"
                    description={`${leadName.trim() || 'Le responsable sélectionné'} deviendra le pilote admin du dossier ${project.referenceNumber}. Cette information restera dans la plateforme administration.`}
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

                <div className="rounded-lg border p-3">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="quoteAmount">
                    Devis
                  </label>
                  <Input
                    id="quoteAmount"
                    type="number"
                    min={1}
                    value={quoteAmount || ''}
                    onChange={(event) => setQuoteAmount(Number(event.target.value))}
                    className="mt-2"
                  />
                  <ConfirmActionDialog
                    title="Transmettre ce devis au client ?"
                    description={`Le client verra un devis de ${FORMAT_XOF(Number(quoteAmount))} pour ${project.referenceNumber}. Il pourra l’accepter ou le refuser depuis sa plateforme client.`}
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
                        {visualProposal.category} · {new Date(visualProposal.validatedAt).toLocaleString('fr-FR')}
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
                    <div key={document.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <FolderSearch className="size-4 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{document.name}</p>
                        <p className="text-xs text-muted-foreground">{document.date}</p>
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
