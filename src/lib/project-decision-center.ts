import { PROJECT_STATUS_LABELS } from '@/types';
import type { ProjectData, ProjectFinancingData, ProjectQuoteData, ProjectScheduleItemData } from '@/types';

export type ProjectDecisionAudience = 'client' | 'admin';
export type ProjectDecisionTone = 'good' | 'active' | 'warning' | 'blocked' | 'muted';

export interface ProjectDecisionItem {
  id: string;
  title: string;
  description: string;
  status: string;
  owner: string;
  actionLabel: string;
  target: string;
  tone: ProjectDecisionTone;
}

export interface ProjectDecisionMetric {
  label: string;
  value: string;
  helper: string;
  tone: ProjectDecisionTone;
}

export interface ProjectDecisionCenter {
  headline: string;
  summary: string;
  score: number;
  scoreLabel: string;
  statusLabel: string;
  primaryTarget: string;
  primaryLabel: string;
  blockers: string[];
  items: ProjectDecisionItem[];
  metrics: ProjectDecisionMetric[];
}

function projectFinancing(project: ProjectData): ProjectFinancingData | undefined {
  return project.financing || (project.formData?.financing as ProjectFinancingData | undefined);
}

function quoteIsPending(quote: ProjectQuoteData): boolean {
  return quote.status === 'draft' || quote.status === 'sent';
}

function sortedSchedules(items: ProjectScheduleItemData[] = []): ProjectScheduleItemData[] {
  return [...items].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
}

function formatScheduleDate(item?: ProjectScheduleItemData): string {
  if (!item) return 'À programmer';
  const date = new Date(item.scheduledAt);
  if (Number.isNaN(date.getTime())) return 'Date à confirmer';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function financeDocumentGap(financing?: ProjectFinancingData): number {
  const docs = financing?.documentReadiness ?? [];
  if (docs.includes('none-yet')) return 4;
  const coreDocs = ['id', 'income-proof', 'bank-statements', 'quote-or-plans'];
  return Math.max(0, coreDocs.length - docs.filter(item => coreDocs.includes(item)).length);
}

function computeScore(project: ProjectData, financing?: ProjectFinancingData): number {
  const financeScore = financing?.affordabilityScore ?? 0;
  const documentScore = Math.min(20, ((project.documents ?? []).length + (financeDocumentGap(financing) === 0 ? 2 : 0)) * 5);
  const communicationScore = Math.min(15, (project.projectMessages ?? []).length * 3 + (project.clientEmail || project.clientPhone ? 6 : 0));
  const operationScore = Math.min(20, (project.scheduleItems ?? []).length * 6 + (project.siteUpdates ?? []).length * 4);
  const hasValidatedProposal = Boolean(project.visualProposal || project.visualProposals?.some(proposal => proposal.validatedAt));
  const decisionScore = Math.min(20, (hasValidatedProposal ? 8 : 0) + ((project.quotes ?? []).some(q => q.status === 'accepted') ? 12 : 0));
  return Math.max(project.progress ?? 0, Math.min(100, Math.round((financeScore * 0.25) + documentScore + communicationScore + operationScore + decisionScore)));
}

function firstActiveItem(items: ProjectDecisionItem[]): ProjectDecisionItem {
  return items.find(item => item.tone === 'blocked')
    || items.find(item => item.tone === 'active')
    || items.find(item => item.tone === 'warning')
    || items[0];
}

function toneFromFinance(financing?: ProjectFinancingData): ProjectDecisionTone {
  if (!financing) return 'warning';
  if (financing.financialRiskLevel === 'high') return 'blocked';
  if ((financing.affordabilityScore ?? 0) >= 70 || financing.readiness === 'confirmed') return 'good';
  return 'warning';
}

export function buildProjectDecisionCenter(project: ProjectData, audience: ProjectDecisionAudience): ProjectDecisionCenter {
  const financing = projectFinancing(project);
  const schedules = sortedSchedules(project.scheduleItems ?? []);
  const upcomingSchedule = schedules.find(item => new Date(item.scheduledAt).getTime() >= Date.now()) ?? schedules[0];
  const unconfirmedSchedule = schedules.find(item => ['scheduled', 'reschedule_requested'].includes(item.status));
  const pendingQuote = (project.quotes ?? []).find(quoteIsPending);
  const acceptedQuote = (project.quotes ?? []).find(quote => quote.status === 'accepted');
  const visualProposalCount = (project.visualProposals ?? []).length;
  const selectedProposal = project.visualProposal || project.visualProposals?.find(proposal => proposal.validatedAt);
  const hasPublishedProposal = Boolean(project.visualProposal || visualProposalCount);
  const latestInfoResponse = project.missingInfoResponses?.[0];
  const documentCount = (project.documents ?? []).length;
  const missingFinanceDocs = financeDocumentGap(financing);
  const paymentBlocked = (financing?.milestones ?? []).some(item => item.status === 'blocked');
  const paymentDue = (financing?.milestones ?? []).some(item => item.status === 'due');
  const score = computeScore(project, financing);
  const statusLabel = PROJECT_STATUS_LABELS[project.status] || project.status || 'Dossier';
  const financeTone = toneFromFinance(financing);

  const clientItems: ProjectDecisionItem[] = [
    {
      id: 'messages',
      title: project.missingInfo ? 'Répondre à la demande Buildify' : 'Canal projet centralisé',
      description: project.missingInfo
        ? 'Une précision est attendue pour débloquer l’analyse, le devis ou le planning.'
        : 'Tous les échanges du dossier restent regroupés dans l’espace client.',
      status: project.missingInfo ? 'Prioritaire' : (project.projectMessages ?? []).length ? 'Actif' : 'Ouvert',
      owner: project.missingInfo ? 'Client' : 'Client + Buildify',
      actionLabel: 'Ouvrir messages',
      target: 'messages',
      tone: project.missingInfo ? 'active' : 'muted',
    },
    {
      id: 'proposal',
      title: selectedProposal ? 'Proposition visuelle validée' : hasPublishedProposal ? 'Choisir une proposition visuelle' : 'Proposition visuelle à venir',
      description: selectedProposal
        ? 'L’orientation retenue sert de base au chiffrage et à la suite du projet.'
        : hasPublishedProposal
          ? 'Comparez les images, téléchargez la fiche et validez l’option retenue.'
          : 'Buildify publiera ici des images professionnelles adaptées au dossier.',
      status: selectedProposal ? 'Validée' : hasPublishedProposal ? `${visualProposalCount} option(s)` : 'À publier',
      owner: selectedProposal ? 'Buildify' : 'Client',
      actionLabel: 'Voir propositions',
      target: 'propositions',
      tone: selectedProposal ? 'good' : hasPublishedProposal ? 'active' : 'muted',
    },
    {
      id: 'quote',
      title: pendingQuote ? 'Décider sur le devis' : acceptedQuote ? 'Devis accepté' : 'Devis détaillé à venir',
      description: pendingQuote
        ? 'Le devis peut être lu, téléchargé, accepté ou refusé depuis le dossier.'
        : acceptedQuote
          ? 'Le dossier peut avancer vers contrat, planning et jalons.'
          : 'Le chiffrage doit arriver avec périmètre, hypothèses et modalités.',
      status: pendingQuote ? 'Décision client' : acceptedQuote ? 'Accepté' : 'À venir',
      owner: pendingQuote ? 'Client' : 'Buildify',
      actionLabel: 'Ouvrir devis',
      target: 'devis',
      tone: pendingQuote ? 'active' : acceptedQuote ? 'good' : 'muted',
    },
    {
      id: 'finance',
      title: financeTone === 'good' ? 'Financement lisible' : 'Renforcer le financement',
      description: financeTone === 'good'
        ? 'Les revenus, charges, apport, banque et garanties sont assez lisibles pour avancer.'
        : 'Complétez les revenus, charges, apport, banque et pièces avant engagement.',
      status: financing?.affordabilityScore ? `${financing.affordabilityScore}/100` : 'À compléter',
      owner: 'Client',
      actionLabel: 'Ouvrir finance',
      target: 'financement',
      tone: financeTone === 'blocked' ? 'active' : financeTone,
    },
    {
      id: 'planning',
      title: unconfirmedSchedule ? 'Confirmer le planning' : upcomingSchedule ? 'Prochaine étape planifiée' : 'Planning à programmer',
      description: unconfirmedSchedule
        ? 'Confirmez la date ou demandez un report avec une note claire.'
        : upcomingSchedule
          ? 'Le prochain rendez-vous ou jalon est visible dans le planning.'
          : 'Les visites, réunions et validations seront publiées ici.',
      status: unconfirmedSchedule ? 'À confirmer' : formatScheduleDate(upcomingSchedule),
      owner: unconfirmedSchedule ? 'Client' : 'Buildify',
      actionLabel: 'Ouvrir planning',
      target: 'planning',
      tone: unconfirmedSchedule ? 'active' : upcomingSchedule ? 'good' : 'muted',
    },
    {
      id: 'documents',
      title: documentCount >= 2 && missingFinanceDocs === 0 ? 'Pièces dossier suffisantes' : 'Ajouter les pièces utiles',
      description: 'Plans, photos, titre foncier, devis existant et pièces financières réduisent les allers-retours.',
      status: `${documentCount} pièce(s) · ${missingFinanceDocs} finance`,
      owner: 'Client',
      actionLabel: 'Ouvrir documents',
      target: 'documents',
      tone: documentCount >= 2 && missingFinanceDocs === 0 ? 'good' : 'warning',
    },
    {
      id: 'site',
      title: (project.siteUpdates ?? []).length ? 'Suivre le chantier' : 'Suivi chantier à venir',
      description: (project.siteUpdates ?? []).length
        ? 'Photos, rapports et progression sont disponibles par jalon.'
        : 'Le suivi s’activera après contrat, planning et démarrage opérationnel.',
      status: (project.siteUpdates ?? []).length ? `${project.siteUpdates?.length} publication(s)` : 'Non démarré',
      owner: 'Buildify',
      actionLabel: 'Ouvrir chantier',
      target: 'chantier',
      tone: (project.siteUpdates ?? []).length ? 'active' : 'muted',
    },
  ];

  const adminItems: ProjectDecisionItem[] = [
    {
      id: 'lead',
      title: project.assignedTo ? 'Responsable affecté' : 'Affecter un responsable',
      description: project.assignedTo ? `${project.assignedTo} pilote le dossier.` : 'Un dossier sans pilote ralentit le client et les relances.',
      status: project.assignedTo ? 'OK' : 'Prioritaire',
      owner: 'Administration',
      actionLabel: project.assignedTo ? 'Changer' : 'Affecter',
      target: 'leadName',
      tone: project.assignedTo ? 'good' : 'active',
    },
    {
      id: 'info',
      title: latestInfoResponse ? 'Analyser la réponse client' : project.missingInfo ? 'Relancer les informations' : 'Question manquante à cadrer',
      description: latestInfoResponse
        ? 'Une réponse client peut débloquer devis, planning ou documents.'
        : project.missingInfo
          ? 'Une demande existe déjà : relancer ou reformuler si le dossier dort.'
          : 'Posez une demande précise depuis la plateforme admin.',
      status: latestInfoResponse ? 'À traiter' : project.missingInfo ? 'En attente' : 'À cadrer',
      owner: 'Chargé dossier',
      actionLabel: 'Ouvrir demande',
      target: 'infoMessage',
      tone: latestInfoResponse || !project.missingInfo ? 'active' : 'warning',
    },
    {
      id: 'proposal',
      title: hasPublishedProposal ? 'Visuels publiés côté client' : 'Publier une proposition visuelle',
      description: hasPublishedProposal ? 'Le client peut consulter, télécharger et valider une image.' : 'Ajoutez une image professionnelle avec critères, risques et engagement.',
      status: hasPublishedProposal ? `${visualProposalCount || 1} visible(s)` : 'À publier',
      owner: 'Études',
      actionLabel: 'Préparer visuel',
      target: 'proposalTitle',
      tone: hasPublishedProposal ? 'good' : 'active',
    },
    {
      id: 'quote',
      title: acceptedQuote ? 'Devis accepté' : pendingQuote ? 'Suivre décision devis' : 'Préparer un devis détaillé',
      description: acceptedQuote ? 'Passer au contrat, planning et jalons.' : pendingQuote ? 'Le client doit trancher ou demander un ajustement.' : 'Le devis doit reprendre périmètre, hypothèses, exclusions et paiements.',
      status: acceptedQuote ? 'Accepté' : pendingQuote ? 'En décision' : 'À créer',
      owner: 'Administration',
      actionLabel: 'Ouvrir devis',
      target: 'quoteLabel',
      tone: acceptedQuote ? 'good' : 'active',
    },
    {
      id: 'finance',
      title: financeTone === 'good' ? 'Finance exploitable' : 'Analyse financière à sécuriser',
      description: paymentBlocked ? 'Un jalon est bloqué : clarifier avant nouvel appel de fonds.' : 'Contrôler revenus, charges, apport, banque, garanties et documents.',
      status: paymentBlocked ? 'Jalon bloqué' : paymentDue ? 'Paiement dû' : financing?.affordabilityScore ? `${financing.affordabilityScore}/100` : 'À compléter',
      owner: 'Finance',
      actionLabel: 'Ouvrir jalons',
      target: 'paymentMilestone',
      tone: paymentBlocked ? 'blocked' : paymentDue ? 'active' : financeTone,
    },
    {
      id: 'planning',
      title: upcomingSchedule ? 'Planning publié' : 'Planifier la prochaine étape',
      description: upcomingSchedule ? 'Vérifier confirmation client et préparation.' : 'Publier visite, réunion visio, validation ou rendez-vous banque.',
      status: formatScheduleDate(upcomingSchedule),
      owner: 'Opérations',
      actionLabel: 'Ouvrir planning',
      target: 'scheduleTitle',
      tone: upcomingSchedule ? 'good' : 'active',
    },
    {
      id: 'site',
      title: (project.siteUpdates ?? []).length ? 'Suivi chantier actif' : 'Préparer le suivi chantier',
      description: 'Photos, rapports et progression doivent alimenter l’espace client dès démarrage.',
      status: (project.siteUpdates ?? []).length ? `${project.siteUpdates?.length} publication(s)` : 'À venir',
      owner: 'Terrain',
      actionLabel: 'Ouvrir chantier',
      target: 'sitePhase',
      tone: (project.siteUpdates ?? []).length ? 'good' : 'muted',
    },
  ];

  const items = audience === 'client' ? clientItems : adminItems;
  const primary = firstActiveItem(items);
  const blockers = [
    !project.clientEmail && !project.clientPhone ? 'Contact client incomplet.' : undefined,
    project.missingInfo && audience === 'client' ? 'Information demandée par Buildify.' : undefined,
    latestInfoResponse && audience === 'admin' ? 'Réponse client à traiter.' : undefined,
    financeTone === 'blocked' ? 'Risque financier élevé.' : undefined,
    paymentBlocked ? 'Jalon financier bloqué.' : undefined,
    missingFinanceDocs > 0 ? `${missingFinanceDocs} pièce(s) financière(s) à compléter.` : undefined,
  ].filter(Boolean) as string[];

  return {
    headline: audience === 'client' ? primary.title : `Admin · ${primary.title}`,
    summary: audience === 'client'
      ? 'Vue claire des décisions qui font avancer votre projet, sans exposer les outils internes.'
      : 'Registre admin des décisions, blocages et prochaines actions à traiter côté interne.',
    score,
    scoreLabel: score >= 80 ? 'Dossier solide' : score >= 55 ? 'Dossier en progression' : 'Dossier à renforcer',
    statusLabel,
    primaryTarget: primary.target,
    primaryLabel: primary.actionLabel,
    blockers,
    items,
    metrics: [
      {
        label: 'Finance',
        value: financing?.affordabilityScore ? `${financing.affordabilityScore}/100` : 'À compléter',
        helper: financing?.financialRiskLevel === 'low' ? 'Risque faible' : financing?.financialRiskLevel === 'moderate' ? 'Risque modéré' : 'À sécuriser',
        tone: financeTone,
      },
      {
        label: 'Documents',
        value: `${documentCount} pièce(s)`,
        helper: missingFinanceDocs ? `${missingFinanceDocs} pièce(s) finance` : 'Pièces clés reçues',
        tone: documentCount >= 2 && missingFinanceDocs === 0 ? 'good' : 'warning',
      },
      {
        label: 'Planning',
        value: formatScheduleDate(upcomingSchedule),
        helper: unconfirmedSchedule ? 'Réponse attendue' : schedules.length ? `${schedules.length} événement(s)` : 'Aucune date',
        tone: unconfirmedSchedule ? 'active' : schedules.length ? 'good' : 'muted',
      },
      {
        label: 'Décision',
        value: statusLabel,
        helper: pendingQuote ? 'Devis en attente' : selectedProposal ? 'Visuel validé' : 'À piloter',
        tone: pendingQuote || project.missingInfo ? 'active' : acceptedQuote || selectedProposal ? 'good' : 'muted',
      },
    ],
  };
}
