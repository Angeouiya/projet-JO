import { FORMAT_XOF } from '@/types';
import type { ProjectFinancingData, ProjectPaymentMilestoneData } from '@/types';

export type PaymentSecurityTone = 'ready' | 'watch' | 'blocked' | 'missing';
export type PaymentSecurityStatus = 'ok' | 'watch' | 'missing' | 'blocked';

export interface PaymentSecurityMetric {
  label: string;
  value: string;
  help: string;
}

export interface PaymentSecurityControl {
  label: string;
  status: PaymentSecurityStatus;
  detail: string;
}

export interface PaymentSecurityPlan {
  tone: PaymentSecurityTone;
  label: string;
  title: string;
  summary: string;
  releaseRule: string;
  metrics: PaymentSecurityMetric[];
  controls: PaymentSecurityControl[];
  clientPrinciples: string[];
  adminNextActions: string[];
  nextMilestone?: ProjectPaymentMilestoneData;
}

interface PaymentSecurityOptions {
  projectBudget?: number;
  clientIsRemote?: boolean;
  remoteValidationReady?: boolean;
}

const REQUIRED_FINANCE_DOCUMENTS = ['id', 'income-proof', 'bank-statements', 'quote-or-plans'];
const BANK_READY_STAGES = ['under-review', 'pre-approved', 'funds-available'];

function amountOrMissing(value?: number) {
  return value !== undefined ? FORMAT_XOF(value) : 'À calculer';
}

function percentOrMissing(value?: number) {
  return value !== undefined ? `${value}%` : 'À calculer';
}

function safeDocumentList(financing: ProjectFinancingData) {
  return (financing.documentReadiness ?? []).filter(item => item !== 'none-yet');
}

function coveragePercent(financing: ProjectFinancingData, budget?: number) {
  if (!budget || budget <= 0) return undefined;
  return Math.round((((financing.ownContribution ?? 0) + (financing.requestedLoanAmount ?? 0)) / budget) * 100);
}

export function buildPaymentSecurityPlan(
  financing: ProjectFinancingData,
  options: PaymentSecurityOptions = {}
): PaymentSecurityPlan {
  const milestones = financing.milestones ?? [];
  const budget = financing.estimatedBudget || options.projectBudget;
  const milestonePercent = milestones.reduce((total, item) => total + item.percent, 0);
  const milestoneTotal = milestones.reduce((total, item) => total + (item.expectedAmount ?? 0), 0);
  const paidAmount = milestones
    .filter(item => item.status === 'paid')
    .reduce((total, item) => total + (item.expectedAmount ?? 0), 0);
  const dueAmount = milestones
    .filter(item => item.status === 'due')
    .reduce((total, item) => total + (item.expectedAmount ?? 0), 0);
  const blockedCount = milestones.filter(item => item.status === 'blocked').length;
  const nextMilestone = milestones.find(item => item.status === 'due') ?? milestones.find(item => item.status === 'planned');
  const documents = safeDocumentList(financing);
  const missingDocumentCount = REQUIRED_FINANCE_DOCUMENTS.filter(item => !documents.includes(item)).length;
  const bankReady = BANK_READY_STAGES.includes(financing.bankAgreementStage || '');
  const contractProtected = Boolean(financing.notaryContract || financing.escrowRequested);
  const bankOrFundsProtected = bankReady || financing.bankSupportRequested;
  const hasMilestones = milestones.length > 0;
  const fullMilestoneCoverage = hasMilestones && milestonePercent === 100;
  const fundingGap = budget !== undefined
    ? Math.max(0, budget - (financing.ownContribution ?? 0) - (financing.requestedLoanAmount ?? 0))
    : undefined;
  const coveredPercent = coveragePercent(financing, budget);

  let tone: PaymentSecurityTone = 'missing';
  if (blockedCount > 0) {
    tone = 'blocked';
  } else if (!hasMilestones || missingDocumentCount >= 3 || !budget) {
    tone = 'missing';
  } else if (!fullMilestoneCoverage || !contractProtected || !bankOrFundsProtected || missingDocumentCount > 0 || (fundingGap ?? 0) > 0) {
    tone = 'watch';
  } else {
    tone = 'ready';
  }

  const labelByTone: Record<PaymentSecurityTone, string> = {
    ready: 'Paiement sécurisé',
    watch: 'Sécurité à renforcer',
    blocked: 'Paiement bloqué',
    missing: 'Plan incomplet',
  };

  const titleByTone: Record<PaymentSecurityTone, string> = {
    ready: 'Les paiements peuvent suivre les étapes vérifiées.',
    watch: 'Le paiement par avancement existe, mais des garanties restent à verrouiller.',
    blocked: 'Un jalon bloque le prochain décaissement.',
    missing: 'Le plan de paiement doit être structuré avant engagement.',
  };

  const releaseRule = nextMilestone
    ? `Prochain repère : ${nextMilestone.label}. Paiement uniquement après preuve d’avancement, contrôle Buildify et validation écrite.`
    : 'Aucun appel de fonds ne doit être lancé sans jalon, preuve d’avancement et validation écrite.';

  const controls: PaymentSecurityControl[] = [
    {
      label: 'Échéancier complet',
      status: fullMilestoneCoverage ? 'ok' : hasMilestones ? 'watch' : 'missing',
      detail: fullMilestoneCoverage
        ? `${milestonePercent}% du budget est réparti par jalons.`
        : hasMilestones
          ? `${milestonePercent}% réparti : ajuster pour couvrir 100% du plan.`
          : 'Créer les jalons avant devis ferme ou appel de paiement.',
    },
    {
      label: 'Contrat / séquestre',
      status: contractProtected ? 'ok' : 'watch',
      detail: contractProtected
        ? 'Protection contractuelle ou compte bloqué prévu.'
        : 'Prévoir notaire, séquestre ou clauses de libération avant avance significative.',
    },
    {
      label: 'Banque ou fonds',
      status: bankOrFundsProtected ? 'ok' : financing.bankAgreementStage ? 'watch' : 'missing',
      detail: bankReady
        ? 'Banque, préaccord ou fonds disponibles à suivre.'
        : financing.bankSupportRequested
          ? 'Accompagnement banque demandé : obtenir la preuve formelle.'
          : 'Confirmer preuve de fonds, accord banque ou mode de paiement.',
    },
    {
      label: 'Pièces finance',
      status: missingDocumentCount === 0 ? 'ok' : missingDocumentCount <= 2 ? 'watch' : 'missing',
      detail: missingDocumentCount === 0
        ? 'Les pièces clés sont déclarées disponibles.'
        : `${missingDocumentCount} pièce(s) clé(s) à obtenir avant engagement financier.`,
    },
    {
      label: 'Client hors pays',
      status: !options.clientIsRemote || options.remoteValidationReady || contractProtected ? 'ok' : 'watch',
      detail: options.clientIsRemote
        ? 'Prévoir validation écrite, mandataire ou réunion visio avant paiement.'
        : 'Validation client locale ou à distance à tracer selon le dossier.',
    },
  ];

  const adminNextActions = [
    !hasMilestones ? 'Créer un échéancier en 5 à 6 jalons vérifiables.' : undefined,
    hasMilestones && !fullMilestoneCoverage ? 'Rééquilibrer les pourcentages pour atteindre 100%.' : undefined,
    !contractProtected ? 'Proposer contrat notarié, séquestre ou clauses de libération.' : undefined,
    !bankOrFundsProtected ? 'Demander preuve de fonds, préaccord banque ou contact conseiller.' : undefined,
    missingDocumentCount > 0 ? 'Relancer les pièces financières manquantes.' : undefined,
    blockedCount > 0 ? 'Clarifier le jalon bloqué avant tout nouvel appel.' : undefined,
  ].filter((item): item is string => Boolean(item));

  return {
    tone,
    label: labelByTone[tone],
    title: titleByTone[tone],
    summary: `${milestones.length} jalon(s), ${percentOrMissing(milestonePercent)} réparti, ${amountOrMissing(dueAmount)} en appel ouvert, couverture budget ${percentOrMissing(coveredPercent)}.`,
    releaseRule,
    metrics: [
      {
        label: 'Jalons cadrés',
        value: `${milestonePercent}%`,
        help: milestoneTotal ? `${amountOrMissing(milestoneTotal)} réparti par avancement.` : 'Montants à calculer sur budget définitif.',
      },
      {
        label: 'Appels ouverts',
        value: amountOrMissing(dueAmount),
        help: 'Somme actuellement due, à payer seulement si le jalon est vérifié.',
      },
      {
        label: 'Déjà réglé',
        value: amountOrMissing(paidAmount),
        help: 'Montant marqué payé dans le suivi financier.',
      },
      {
        label: 'Écart à couvrir',
        value: amountOrMissing(fundingGap),
        help: 'Budget non couvert par apport et financement déclaré.',
      },
      {
        label: 'Blocages',
        value: `${blockedCount}`,
        help: blockedCount ? 'Suspendre le décaissement suivant.' : 'Aucun jalon bloqué.',
      },
      {
        label: 'Pièces clés',
        value: `${REQUIRED_FINANCE_DOCUMENTS.length - missingDocumentCount}/${REQUIRED_FINANCE_DOCUMENTS.length}`,
        help: 'Identité, revenus, relevés et base devis/plans.',
      },
    ],
    controls,
    clientPrinciples: [
      'Aucun paiement important sans étape réalisée, photo ou rapport, et validation écrite.',
      'L’apport doit rester traçable et protégé par contrat, séquestre ou notaire quand le risque l’exige.',
      'Les décaissements banque suivent l’échéancier validé, pas une avance globale floue.',
      'Tout jalon bloqué suspend le paiement suivant jusqu’à clarification.',
    ],
    adminNextActions: adminNextActions.length ? adminNextActions : ['Maintenir le suivi : preuve d’avancement, validation client, rapprochement paiement et archivage.'],
    nextMilestone,
  };
}
