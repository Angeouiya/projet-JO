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
  HandCoins,
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
import type { ProjectData, ProjectPaymentMilestoneData } from '@/types';
import { formatProjectLocation } from '@/lib/project-format';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';

const TEAM_LEADS = ['Awa Kouadio', 'Moussa Traoré', 'Ibrahim Diarra', 'Fatou Koné'];

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
    updateProjectPaymentMilestoneStatus,
    publishProjectVisualProposal,
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
    'Le démarrage dépend de la validation du devis, du financement, des pièces administratives et du calendrier chantier.',
  ].join('\n'));
  const [quoteExclusionsText, setQuoteExclusionsText] = useState([
    'Taxes, frais administratifs, études réglementaires ou prestations non explicitement incluses restent à confirmer.',
    'Toute modification de surface, de matériaux, de délai ou de périmètre pourra entraîner un avenant.',
  ].join('\n'));
  const [quotePaymentTerms, setQuotePaymentTerms] = useState('Paiement par jalons vérifiés : acompte de sécurisation, lancement, avancements documentés, réception et solde après contrôle.');
  const [quoteValidityDays, setQuoteValidityDays] = useState(15);
  const [paymentMilestoneId, setPaymentMilestoneId] = useState(project?.financing?.milestones?.[0]?.id || '');
  const [paymentMilestoneStatus, setPaymentMilestoneStatus] = useState<ProjectPaymentMilestoneData['status']>('due');
  const [paymentMilestoneNote, setPaymentMilestoneNote] = useState('Jalon contrôlé par l’administration Buildify. Le client peut suivre le statut dans son espace projet.');
  const [proposalTitle, setProposalTitle] = useState(`${project?.categoryName || 'Projet BTP'} - proposition visuelle Buildify`);
  const [proposalImage, setProposalImage] = useState(project?.visualProposals?.[0]?.image || '/images/maison-basse-1.png');
  const [proposalDescription, setProposalDescription] = useState('Proposition visuelle publiée par Buildify pour aider le client à comparer, télécharger et valider une orientation claire avant devis définitif.');
  const [proposalEstimate, setProposalEstimate] = useState(formatBudget(project?.budgetMin, project?.budgetMax));
  const [proposalDuration, setProposalDuration] = useState('6 à 8 mois');
  const [proposalConfidence, setProposalConfidence] = useState('Base professionnelle à valider');
  const [proposalDeliverable, setProposalDeliverable] = useState('Image de référence, périmètre, points de décision et prochaines étapes du dossier.');
  const [proposalStrengthsText, setProposalStrengthsText] = useState('Image claire pour décision\nBudget lisible\nSuivi possible à distance');
  const [proposalCriteriaText, setProposalCriteriaText] = useState(`Budget cible: ${formatBudget(project?.budgetMin, project?.budgetMax)}\nDélai cible: 6 à 8 mois\nUsage: ${project?.categoryName || 'Projet BTP'}\nDécision: Validation visuelle client`);
  const [proposalScopeText, setProposalScopeText] = useState(`Ouvrage : ${project?.categoryName || 'Projet BTP'}\nLocalisation : ${project?.city || 'À confirmer'}\nBase : image publiée, hypothèses et arbitrages techniques`);
  const [proposalRisksText, setProposalRisksText] = useState('Surfaces et limites de prestation à confirmer\nDocuments administratifs à contrôler\nBudget final après métrés et choix matériaux');
  const [proposalNextText, setProposalNextText] = useState('Client valide la proposition visuelle\nBuildify prépare le chiffrage détaillé\nAdmin transmet devis, planning et jalons');
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
  const visualProposal = project.visualProposal;
  const locationLabel = formatProjectLocation(project);
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
  const projectWorkstreams = [
    {
      icon: UserCheck,
      label: 'Client',
      status: project.clientEmail || project.clientPhone ? 'Contactable' : 'Contact incomplet',
      detail: optionalLabel(CLIENT_PRESENCE_LABELS, projectText(project, 'clientPresence')) || 'Présence à qualifier',
      done: Boolean(project.clientEmail || project.clientPhone),
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
    sendProjectQuote(project.id, Number(quoteAmount), quoteLabel.trim(), {
      description: quoteDescription.trim(),
      scope: quoteScopeItems,
      assumptions: quoteAssumptionItems,
      exclusions: quoteExclusionItems,
      paymentTerms: quotePaymentTerms.trim(),
      validityDays: Number(quoteValidityDays),
      currency: 'XOF',
      createdBy: 'Administration Buildify',
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
      publishedBy: 'Administration Buildify',
    });
    addToast('Proposition visuelle publiée au client.', 'success');
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

              <div className="mt-4 grid gap-2 md:grid-cols-5">
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
