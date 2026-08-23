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
  const monthlyIncome = financing.monthlyIncome;
  const existingDebt = financing.existingMonthlyDebt ?? 0;
  const monthlyCapacity = financing.monthlyPaymentCapacity;
  const ownContribution = financing.ownContribution ?? 0;
  const requestedLoan = financing.requestedLoanAmount ?? 0;
  const desiredYears = financing.desiredLoanDurationYears;
  const currentDebtRatio = ratio(existingDebt, monthlyIncome);
  const projectedDebtRatio = financing.projectedDebtRatioPercent ?? ratio(existingDebt + (monthlyCapacity ?? 0), monthlyIncome);
  const equityRatio = financing.equityRatioPercent ?? ratio(ownContribution, estimatedBudget);
  const monthlyCeiling = monthlyIncome !== undefined ? Math.max(0, Math.round(monthlyIncome * 0.35 - existingDebt)) : undefined;
  const livingMargin = monthlyIncome !== undefined && monthlyCapacity !== undefined
    ? monthlyIncome - existingDebt - monthlyCapacity
    : undefined;
  const fundingGap = estimatedBudget !== undefined
    ? Math.max(0, estimatedBudget - ownContribution - requestedLoan)
    : undefined;
  const grossLoanCapacity = monthlyCapacity !== undefined && desiredYears !== undefined
    ? Math.round(monthlyCapacity * desiredYears * 12)
    : undefined;
  const bankReady = hasBankStage(financing.bankAgreementStage);
  const hasRevenueProfile = Boolean(monthlyIncome && financing.employmentStatus && financing.contractType && financing.incomeStability);
  const hasSecurity = Boolean(financing.notaryContract || financing.escrowRequested);
  const hasMilestones = (financing.milestones ?? []).length > 0;

  const warnings = [
    projectedDebtRatio !== undefined && projectedDebtRatio > 45
      ? 'Effort projeté au-dessus du seuil prudentiel : réduire la mensualité, augmenter l’apport ou allonger la durée.'
      : undefined,
    livingMargin !== undefined && livingMargin < 0
      ? 'Reste mensuel négatif après projet : le dossier ne doit pas avancer sans restructuration.'
      : undefined,
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
  if (!monthlyIncome || !estimatedBudget) {
    tone = 'missing';
  } else if ((projectedDebtRatio ?? 100) > 50 || (livingMargin !== undefined && livingMargin < 0)) {
    tone = 'risk';
  } else if ((projectedDebtRatio ?? 100) <= 35 && (fundingGap ?? 0) === 0 && (bankReady || (equityRatio ?? 0) >= 25)) {
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
    structure: 'Priorité : renforcer les preuves de revenus, confirmer la banque, protéger l’apport et publier un échéancier par jalons.',
    risk: 'Priorité : baisser le budget, augmenter l’apport, réduire les charges ou obtenir un accord bancaire plus solide.',
    missing: 'Priorité : renseigner revenus, charges, apport, montant à financer, banque, durée et garanties.',
  };

  return {
    tone,
    label: labelByTone[tone],
    title: titleByTone[tone],
    summary: `Lecture calculée avec un budget de ${amountOrMissing(estimatedBudget)}, un revenu retenu de ${amountOrMissing(monthlyIncome)} et une mensualité cible de ${amountOrMissing(monthlyCapacity)}.`,
    advisory: advisoryByTone[tone],
    metrics: [
      {
        label: 'Plafond prudent',
        value: amountOrMissing(monthlyCeiling),
        help: 'Mensualité projet conseillée autour de 35% des revenus, après charges existantes.',
      },
      {
        label: 'Reste mensuel',
        value: amountOrMissing(livingMargin),
        help: 'Marge restante après charges existantes et mensualité cible du projet.',
      },
      {
        label: 'Ratio projete',
        value: percentOrMissing(projectedDebtRatio),
        help: `Ratio actuel: ${percentOrMissing(currentDebtRatio)}. Zone confortable sous 35%.`,
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
        label: 'Capacité brute',
        value: amountOrMissing(grossLoanCapacity),
        help: 'Mensualité cible multipliée par la durée souhaitée, hors intérêts et frais.',
      },
    ],
    actions: [
      {
        label: 'Revenus documentés',
        status: hasRevenueProfile ? 'ok' : 'missing',
        detail: hasRevenueProfile ? 'Profil revenu exploitable.' : 'Ajouter situation, contrat, stabilité et revenu net.',
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
