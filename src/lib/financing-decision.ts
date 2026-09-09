import { FORMAT_XOF } from '@/types';
import type { ProjectFinancingData } from '@/types';

export type FinancingDecisionTone = 'ready' | 'structure' | 'risk' | 'missing';
export type FinancingDecisionStatus = 'ok' | 'watch' | 'missing';

export interface FinancingDecisionMetric {
  label: string;
  value: string;
  help: string;
}

export interface FinancingDecisionAction {
  label: string;
  status: FinancingDecisionStatus;
  detail: string;
}

export interface FinancingDecisionPlan {
  tone: FinancingDecisionTone;
  label: string;
  title: string;
  summary: string;
  advisory: string;
  metrics: FinancingDecisionMetric[];
  actions: FinancingDecisionAction[];
  warnings: string[];
}

function amountOrMissing(value?: number) {
  return value !== undefined ? FORMAT_XOF(value) : 'À calculer';
}

function percentOrMissing(value?: number) {
  return value !== undefined ? `${value}%` : 'À calculer';
}

function ratio(part?: number, total?: number) {
  if (part === undefined || total === undefined || total <= 0) return undefined;
  return Math.round((part / total) * 100);
}

function hasBankStage(stage?: string) {
  return ['under-review', 'pre-approved', 'funds-available'].includes(stage || '');
}

function bankStageLabel(stage?: string) {
  if (stage === 'funds-available') return 'Fonds disponibles';
  if (stage === 'pre-approved') return 'Préaccord obtenu';
  if (stage === 'under-review') return 'Dossier en étude';
  if (stage === 'documents-requested') return 'Pièces demandées';
  if (stage === 'simulation') return 'Simulation reçue';
  if (stage === 'not-started') return 'Pas encore démarré';
  return 'À confirmer';
}

export function buildFinancingDecisionPlan(
  financing: ProjectFinancingData,
  projectBudget?: number
): FinancingDecisionPlan {
  const estimatedBudget = financing.estimatedBudget || projectBudget;
  const ownContribution = financing.ownContribution ?? 0;
  const requestedLoan = financing.requestedLoanAmount ?? 0;
  const declaredFunding = ownContribution + requestedLoan;
  const hasFundingFrame = financing.ownContribution !== undefined || financing.requestedLoanAmount !== undefined;
  const coverageRatio = financing.declaredFundingCoveragePercent ?? (
    hasFundingFrame ? ratio(declaredFunding, estimatedBudget) : undefined
  );
  const equityRatio = financing.equityRatioPercent ?? ratio(ownContribution, estimatedBudget);
  const fundingGap = estimatedBudget !== undefined
    ? Math.max(0, estimatedBudget - declaredFunding)
    : undefined;
  const bankReady = hasBankStage(financing.bankAgreementStage);
  const hasBudgetFrame = Boolean(estimatedBudget && financing.budgetConfidence && hasFundingFrame);
  const hasSecurity = Boolean(financing.notaryContract || financing.escrowRequested);
  const hasMilestones = (financing.milestones ?? []).length > 0;

  const warnings = [
    fundingGap !== undefined && fundingGap > 0
      ? `Écart de financement à sécuriser : ${FORMAT_XOF(fundingGap)}.`
      : undefined,
    !bankReady
      ? 'Accord banque ou preuve de fonds à confirmer avant engagement contractuel.'
      : undefined,
    !hasSecurity
      ? 'Protection recommandée : contrat notarié ou compte séquestre avant avances significatives.'
      : undefined,
  ].filter((item): item is string => Boolean(item));

  let tone: FinancingDecisionTone = 'missing';
  if (!estimatedBudget || !hasFundingFrame) {
    tone = 'missing';
  } else if ((coverageRatio ?? 0) < 45 || (fundingGap ?? 0) > (estimatedBudget * 0.45)) {
    tone = 'risk';
  } else if ((coverageRatio ?? 0) >= 100 && (bankReady || (equityRatio ?? 0) >= 25)) {
    tone = 'ready';
  } else {
    tone = 'structure';
  }

  const labelByTone: Record<FinancingDecisionTone, string> = {
    ready: 'Feu vert encadré',
    structure: 'À structurer',
    risk: 'Risque fort',
    missing: 'Données manquantes',
  };

  const titleByTone: Record<FinancingDecisionTone, string> = {
    ready: 'Le financement peut avancer vers devis, contrat et jalons.',
    structure: 'Le projet est possible, mais des points financiers doivent être verrouillés.',
    risk: 'Le projet doit être recalibré avant engagement.',
    missing: 'Le dossier financier doit être complété pour une décision fiable.',
  };

  const advisoryByTone: Record<FinancingDecisionTone, string> = {
    ready: 'Buildify peut préparer la séquence devis, contrat, planning et paiements par avancement documenté.',
    structure: 'Priorité : confirmer le budget, sécuriser les preuves de financement, protéger l’apport et publier un échéancier par jalons.',
    risk: 'Priorité : recalibrer le périmètre, augmenter l’apport, phaser les travaux ou obtenir un accord bancaire plus solide.',
    missing: 'Priorité : renseigner budget, apport, montant à compléter, banque, durée et garanties.',
  };

  return {
    tone,
    label: labelByTone[tone],
    title: titleByTone[tone],
    summary: `Lecture calculée avec un budget de ${amountOrMissing(estimatedBudget)}, des fonds déclarés de ${amountOrMissing(hasFundingFrame ? declaredFunding : undefined)} et une couverture de ${percentOrMissing(coverageRatio)}.`,
    advisory: advisoryByTone[tone],
    metrics: [
      {
        label: 'Budget retenu',
        value: amountOrMissing(estimatedBudget),
        help: 'Enveloppe utilisée pour l’analyse technique et financière gratuite.',
      },
      {
        label: 'Fonds déclarés',
        value: amountOrMissing(hasFundingFrame ? declaredFunding : undefined),
        help: 'Apport mobilisable + montant à compléter déclaré.',
      },
      {
        label: 'Couverture budget',
        value: percentOrMissing(coverageRatio),
        help: 'Part du budget couverte par les fonds déclarés.',
      },
      {
        label: 'Écart à sécuriser',
        value: amountOrMissing(fundingGap),
        help: 'Budget non couvert par apport et financement déclaré.',
      },
      {
        label: 'Apport',
        value: percentOrMissing(equityRatio),
        help: `Montant déclaré : ${amountOrMissing(ownContribution)}.`,
      },
      {
        label: 'Marge travaux',
        value: amountOrMissing(financing.contingencyReserve),
        help: 'Réserve dédiée aux imprévus du chantier.',
      },
    ],
    actions: [
      {
        label: 'Budget cadré',
        status: hasBudgetFrame ? 'ok' : 'missing',
        detail: hasBudgetFrame ? 'Budget, apport et niveau de certitude lisibles.' : 'Ajouter budget, apport, montant à compléter et certitude.',
      },
      {
        label: 'Banque ou fonds',
        status: bankReady ? 'ok' : financing.bankAgreementStage ? 'watch' : 'missing',
        detail: bankStageLabel(financing.bankAgreementStage),
      },
      {
        label: 'Apport cohérent',
        status: (equityRatio ?? 0) >= 20 ? 'ok' : (equityRatio ?? 0) >= 10 ? 'watch' : 'missing',
        detail: equityRatio !== undefined ? `${equityRatio}% du budget déclaré.` : 'Apport à renseigner.',
      },
      {
        label: 'Protection client',
        status: hasSecurity ? 'ok' : 'watch',
        detail: hasSecurity ? 'Garantie active ou demandée.' : 'Prévoir notaire ou séquestre.',
      },
      {
        label: 'Jalons de paiement',
        status: hasMilestones ? 'ok' : 'missing',
        detail: hasMilestones ? `${financing.milestones.length} jalon(s) disponibles.` : 'Créer un échéancier par avancement.',
      },
    ],
    warnings,
  };
}
