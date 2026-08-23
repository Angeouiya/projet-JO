import { FORMAT_XOF } from '@/types';
import type { ProjectData } from '@/types';
import { formatProjectLocation } from '@/lib/project-format';

export type ProjectBriefItemKey =
  | 'category'
  | 'location'
  | 'surface'
  | 'scope'
  | 'context'
  | 'finance'
  | 'timeline';

export interface ProjectBriefItem {
  key: ProjectBriefItemKey;
  label: string;
  value: string;
  helper?: string;
}

export interface ProjectBrief {
  items: ProjectBriefItem[];
  scope: string[];
  context: string[];
  surfaces: string[];
  chips: string[];
}

const CUSTOM_CHOICE_PREFIX = 'custom-choice:';

const VALUE_LABELS: Record<string, string> = {
  'maison-basse': 'Maison basse',
  'duplex-triplex': 'Duplex / Triplex',
  'immeuble-rplus': 'Immeuble R+',
  promotion: 'Promotion immobilière',
  vrd: 'VRD',
  hydraulique: 'Hydraulique',
  'lot-travaux': 'Lot de travaux',
  renovation: 'Rénovation',
  'etude-suivi': 'Étude / suivi',
  owned: 'Terrain disponible',
  acquiring: 'Acquisition en cours',
  searching: 'Terrain à rechercher',
  'existing-site': 'Site existant',
  unknown: 'À clarifier',
  plat: 'Terrain plat',
  'pente-legere': 'Pente légère',
  'pente-forte': 'Pente forte',
  'zone-humide': 'Zone humide',
  remblai: 'Remblai / terrain instable',
  inconnue: 'À diagnostiquer',
  'eau-electricite': 'Eau et électricité disponibles',
  'electricite-seule': 'Électricité seule',
  'eau-seule': 'Eau seule',
  aucun: 'Aucun réseau',
  faite: 'Étude de sol faite',
  'a-faire': 'Étude de sol à faire',
  habitation: 'Habitation',
  commerce: 'Commerce',
  bureaux: 'Bureaux',
  mixte: 'Mixte',
  hotel: 'Hôtel / résidence',
  parking: 'Parking',
  logements: 'Logements',
  'a-definir': 'À définir',
  'terrain-nu': 'Terrain nu',
  'voie-existante': 'Voie existante',
  lotissement: 'Lotissement',
  'site-occupe': 'Site occupé',
  neuf: 'Construction neuve',
  'gros-oeuvre-termine': 'Gros œuvre terminé',
  'second-oeuvre': 'Second œuvre',
  reprise: 'Reprise après malfaçon',
  oui: 'Oui',
  non: 'Non',
  partiellement: 'Partiellement',
  none: 'Aucune extension prévue',
  horizontal: 'Extension horizontale possible',
  vertical: 'Étage futur possible',
  'rental-unit': 'Dépendance ou logement locatif futur',
  'to-study': 'À étudier avec Buildify',
  immediate: 'Immédiatement',
  '1-month': 'Sous 1 mois',
  '3-months': 'Sous 3 mois',
  '6-months': 'Sous 6 mois',
  '1-year': 'Sous 1 an',
  economique: 'Économique',
  standard: 'Standard',
  premium: 'Premium',
  luxe: 'Luxe',
  'footprint-optimized': 'Optimiser l’emprise au sol',
  'family-comfort': 'Confort familial',
  'future-extension': 'Extension future prévue',
  'natural-ventilation': 'Ventilation et lumière naturelle',
  'outdoor-living': 'Vie extérieure / terrasse',
  'privacy-security': 'Intimité et sécurité',
  'rental-yield': 'Rentabilité locative',
  'structural-regularity': 'Structure régulière',
  'vertical-circulation': 'Circulation verticale',
  'fire-safety': 'Sécurité incendie',
  'technical-shafts': 'Gaines techniques',
  'parking-flow': 'Flux parking',
  'stormwater-control': 'Maîtrise eaux pluviales',
  'utility-corridor': 'Couloirs réseaux',
  'road-access': 'Accès et circulation',
  'phased-vrd': 'VRD par phases',
  'maintenance-ready': 'Maintenance prévue',
  'defect-correction': 'Correction malfaçons',
  'occupied-site-control': 'Travaux en site occupé',
  'material-procurement': 'Approvisionnement matériaux',
  'finish-quality': 'Qualité des finitions',
  'technical-compliance': 'Conformité technique',
  'water-autonomy': 'Autonomie en eau',
  'daily-capacity': 'Capacité journalière',
  'energy-continuity': 'Continuité énergétique',
  'water-treatment': 'Traitement de l’eau',
  'handover-documentation': 'Documentation de réception',
  'permit-ready': 'Dossier permis',
  'cost-control': 'Contrôle du coût',
  'execution-ready': 'Prêt pour exécution',
  'site-supervision': 'Suivi chantier',
  'investor-reporting': 'Reporting investisseur',
  'suite-parentale': 'Suite parentale',
  terrasse: 'Terrasse',
  garage: 'Garage',
  'cuisine-exterieure': 'Cuisine extérieure',
  dependance: 'Dépendance',
  cloture: 'Clôture',
  piscine: 'Piscine',
  jardin: 'Jardin',
  ascenseur: 'Ascenseur',
  'sous-sol': 'Sous-sol',
  'groupe-electrogene': 'Groupe électrogène',
  surpresseur: 'Surpresseur',
  'securite-incendie': 'Sécurité incendie',
  'loge-gardien': 'Loge gardien',
  'local-technique': 'Local technique',
  terrassement: 'Terrassement',
  voirie: 'Voirie',
  caniveaux: 'Caniveaux',
  assainissement: 'Assainissement',
  'eau-potable': 'Eau potable',
  electricite: 'Électricité',
  telecom: 'Télécom',
  'eclairage-public': 'Éclairage public',
  signalisation: 'Signalisation',
  'gros-oeuvre': 'Gros œuvre',
  plomberie: 'Plomberie',
  carrelage: 'Carrelage',
  peinture: 'Peinture',
  menuiserie: 'Menuiserie',
  etancheite: 'Étanchéité',
  toiture: 'Charpente / toiture',
  climatisation: 'Climatisation',
  'finition-complete': 'Finition complète',
  forage: 'Forage',
  'chateau-eau': 'Château d’eau',
  adduction: 'Adduction d’eau',
  pompage: 'Pompage',
  drainage: 'Drainage',
  'station-traitement': 'Traitement',
  architecture: 'Architecture',
  structure: 'Structure béton',
  'metre-devis': 'Métré / devis',
  permis: 'Permis de construire',
  planning: 'Planning travaux',
  'controle-chantier': 'Contrôle chantier',
  expertise: 'Expertise technique',
  'etude-architecturale': 'Étude architecturale',
  'plans-execution': 'Plans d’exécution',
  finition: 'Finition',
  'cle-en-main': 'Clé en main',
  'suivi-chantier': 'Suivi de chantier',
  topographie: 'Topographie',
  'etude-vrd': 'Étude VRD',
  'execution-vrd': 'Exécution VRD',
  'controle-qualite': 'Contrôle qualité',
  recolement: 'Plan de récolement',
  diagnostic: 'Diagnostic',
  dimensionnement: 'Dimensionnement',
  execution: 'Exécution',
  essais: 'Essais et réception',
  maintenance: 'Maintenance',
  'voirie-interne': 'Voirie interne',
  'espaces-verts': 'Espaces verts',
  'aire-jeux': 'Aire de jeux',
  gardiennage: 'Gardiennage',
};

const FINANCE_MODE_LABELS: Record<string, string> = {
  'confirmed-bank': 'Financement confirmé',
  'bank-support': 'Aide banque demandée',
  'progress-payment': 'Paiement par avancement',
  'notary-secured': 'Contrat notarié',
  'land-and-finance': 'Terrain + financement',
  'to-structure': 'À structurer',
};

const FINANCE_RISK_LABELS: Record<string, string> = {
  low: 'Risque faible',
  moderate: 'Risque modéré',
  high: 'Risque élevé',
  unknown: 'Risque à qualifier',
};

function compact<T>(items: Array<T | undefined | null | false | ''>): T[] {
  return items.filter(Boolean) as T[];
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.map(item => item.trim()).filter(Boolean)));
}

function humanizeToken(value: string): string {
  const clean = value.replace(/[-_]+/g, ' ').trim();
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : value;
}

export function projectBriefLabel(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  if (!text) return undefined;
  if (text.startsWith(CUSTOM_CHOICE_PREFIX)) return text.slice(CUSTOM_CHOICE_PREFIX.length).trim();
  return VALUE_LABELS[text] || humanizeToken(text);
}

function numberValue(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function listValue(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(projectBriefLabel).filter((item): item is string => Boolean(item));
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value);
}

function area(label: string, value?: number): string | undefined {
  return value !== undefined ? `${label} ${formatNumber(value)} m²` : undefined;
}

function metric(label: string, value: unknown, unit: string): string | undefined {
  const parsed = numberValue(value);
  return parsed !== undefined ? `${label} ${formatNumber(parsed)} ${unit}` : undefined;
}

function textValue(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

export function buildProjectBrief(project: ProjectData): ProjectBrief {
  const form = project.formData ?? {};
  const financing = project.financing || (form.financing as ProjectData['financing'] | undefined);

  const terrainSurface = numberValue(form.surfaceArea ?? form.landSurface ?? form.surface);
  const builtSurface = numberValue(form.builtSurface ?? form.grossFloorArea);
  const houseFootprint = numberValue(form.houseFootprint ?? form.estimatedFootprint);
  const outdoorArea = numberValue(form.usableOutdoorArea ?? form.outdoorSurfaceTarget);
  const affectedArea = numberValue(form.affectedArea);
  const roadLength = numberValue(form.roadLength);
  const roadWidth = numberValue(form.roadWidth);
  const plotCount = numberValue(form.plotCount);

  const surfaces = compact([
    area('Terrain', terrainSurface),
    area('Emprise', houseFootprint),
    area('Surface construite', builtSurface),
    area('Extérieur à préserver', outdoorArea),
    area('Zone travaux', affectedArea),
    roadLength !== undefined && roadWidth !== undefined
      ? `Voirie ${formatNumber(roadLength)} m x ${formatNumber(roadWidth)} m`
      : metric('Linéaire', roadLength, 'm'),
    metric('Lots desservis', plotCount, 'lot(s)'),
  ]);

  const scope = unique([
    ...listValue(form.technicalIntent),
    ...listValue(form.maisonSpaces),
    ...listValue(form.rplusOptions),
    ...listValue(form.vrdLots),
    ...listValue(form.workLots),
    ...listValue(form.hydraulicWorks),
    ...listValue(form.studyScope),
    ...listValue(form.promotionAmenities),
    ...listValue(form.prestations),
  ]);

  const context = unique(compact([
    projectBriefLabel(form.terrainStatus),
    projectBriefLabel(form.topography),
    projectBriefLabel(form.existingUtilities),
    projectBriefLabel(form.soilKnown),
    projectBriefLabel(form.buildingUse),
    projectBriefLabel(form.groundFloorUse),
    projectBriefLabel(form.vrdContext),
    projectBriefLabel(form.interventionStage),
    form.occupiedSite ? `Site occupé : ${projectBriefLabel(form.occupiedSite)}` : undefined,
    form.futureExtensionPlan ? `Extension : ${projectBriefLabel(form.futureExtensionPlan)}` : undefined,
    textValue(form.outfallPoint) ? `Exutoire : ${textValue(form.outfallPoint)}` : undefined,
    textValue(form.qualityTarget) ? `Objectif : ${textValue(form.qualityTarget)}` : undefined,
    textValue(form.waterSource) ? `Source eau : ${textValue(form.waterSource)}` : undefined,
    textValue(form.energySource) ? `Énergie : ${projectBriefLabel(form.energySource)}` : undefined,
    metric('Bénéficiaires', form.beneficiaries, 'pers.'),
    metric('Besoin', form.dailyNeed, 'm³/j'),
    metric('Unités par étage', form.unitsPerFloor, 'unité(s)'),
  ]));

  const financeMode = financing?.mode ? FINANCE_MODE_LABELS[financing.mode] || projectBriefLabel(financing.mode) : undefined;
  const financeRisk = financing?.financialRiskLevel
    ? FINANCE_RISK_LABELS[financing.financialRiskLevel] || financing.financialRiskLevel
    : undefined;
  const financeValue = financing?.affordabilityScore !== undefined
    ? `${financing.affordabilityScore}% - ${financeRisk || 'Risque à qualifier'}`
    : financeMode || 'À structurer';
  const financeHelper = compact([
    financeMode,
    financing?.estimatedBudget ? `Budget ${FORMAT_XOF(financing.estimatedBudget)}` : undefined,
    financing?.monthlyPaymentCapacity ? `Mensualité cible ${FORMAT_XOF(financing.monthlyPaymentCapacity)}` : undefined,
  ]).join(' · ') || undefined;

  const items: ProjectBriefItem[] = [
    {
      key: 'category',
      label: 'Ouvrage',
      value: project.categoryName || projectBriefLabel(form.projectType) || 'Projet BTP',
      helper: project.modelName || undefined,
    },
    {
      key: 'location',
      label: 'Localisation',
      value: formatProjectLocation(project, 'À préciser'),
      helper: textValue(form.district) || textValue(form.landmark),
    },
    {
      key: 'surface',
      label: 'Surfaces',
      value: surfaces[0] || 'À préciser',
      helper: surfaces.slice(1).join(' · ') || undefined,
    },
    {
      key: 'scope',
      label: 'Périmètre',
      value: scope.slice(0, 2).join(' · ') || 'À cadrer',
      helper: scope.length > 2 ? scope.slice(2, 7).join(' · ') : undefined,
    },
    {
      key: 'context',
      label: 'Contraintes',
      value: context[0] || 'À diagnostiquer',
      helper: context.slice(1, 6).join(' · ') || undefined,
    },
    {
      key: 'finance',
      label: 'Lecture finance',
      value: financeValue,
      helper: financeHelper,
    },
    {
      key: 'timeline',
      label: 'Démarrage',
      value: projectBriefLabel(form.timeline) || 'À planifier',
      helper: textValue(form.description),
    },
  ];

  return {
    items,
    scope,
    context,
    surfaces,
    chips: unique([...scope, ...context]).slice(0, 18),
  };
}
