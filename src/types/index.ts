export type ViewName =
  | 'home'
  | 'dashboard'
  | 'explore'
  | 'create'
  | 'projects'
  | 'profile'
  | 'model-detail'
  | 'configurator'
  | 'auth-login'
  | 'auth-register'
  | 'admin'
  | 'admin-projects'
  | 'admin-project-detail'
  | 'admin-clients'
  | 'admin-catalog'
  | 'admin-requests'
  | 'admin-teams'
  | 'admin-settings'
  | 'admin-notifications'
  | 'project-detail'
  | 'realizations'
  | 'services'
  | 'notifications'
  | 'messages'
  | 'favorites'
  | 'project-messages'
  | 'search';

export interface AppUser {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  type: 'client' | 'admin' | 'employee';
  role: string;
  avatar?: string;
  residenceCountry?: string;
  timeZone?: string;
  preferredContactChannel?: string;
  representativeName?: string;
  representativePhone?: string;
  representativeRelation?: string;
}

export interface TeamMemberData {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone?: string;
  photoUrl: string;
  bio: string;
  publicVisible: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogModelData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  categoryId: string;
  categoryName?: string;
  mainImage?: string;
  images: string[];
  plans: string[];
  levels: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  surfaceArea?: number;
  minLandArea?: number;
  standing: string;
  style?: string;
  equipment: string[];
  budgetMin?: number;
  budgetMax?: number;
  durationMin?: number;
  durationMax?: number;
  features: string[];
  viewCount: number;
  isPublished: boolean;
  isFeatured: boolean;
}

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  modelCount?: number;
}

export interface ProjectData {
  id: string;
  referenceNumber: string;
  title?: string;
  description?: string;
  status: string;
  userId?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientResidenceCountry?: string;
  clientTimeZone?: string;
  clientPreferredContactChannel?: string;
  clientContactWindow?: string;
  clientPresence?: string;
  remoteDecisionMode?: string;
  representativeName?: string;
  representativePhone?: string;
  representativeRelation?: string;
  country?: string;
  categoryId?: string;
  categoryName?: string;
  modelId?: string;
  modelName?: string;
  budgetMin?: number;
  budgetMax?: number;
  city?: string;
  progress: number;
  assignedTo?: string;
  missingInfo?: string;
  missingInfoRequestedAt?: string;
  missingInfoResponses?: ProjectInfoResponseData[];
  projectMessages?: ProjectMessageData[];
  formData?: Record<string, unknown>;
  documents?: ProjectDocumentData[];
  quotes?: ProjectQuoteData[];
  visualProposals?: ProjectVisualProposalData[];
  visualProposal?: ProjectVisualProposalData;
  financing?: ProjectFinancingData;
  siteUpdates?: ProjectSiteUpdateData[];
  activityLog?: ProjectActivityData[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDocumentData {
  id: string;
  name: string;
  type: string;
  date: string;
  url?: string;
  size?: number;
}

export interface ProjectQuoteData {
  id: string;
  label: string;
  amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'refused';
  date: string;
  description?: string;
  scope?: string[];
  assumptions?: string[];
  exclusions?: string[];
  paymentTerms?: string;
  validityDays?: number;
  currency?: string;
  createdBy?: string;
  updatedAt?: string;
  documentUrl?: string;
}

export interface ProjectVisualProposalData {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  estimate: string;
  duration: string;
  confidence: string;
  deliverable: string;
  strengths?: string[];
  decisionCriteria?: { label: string; value: string }[];
  technicalScope?: string[];
  riskControls?: string[];
  nextSteps?: string[];
  clientCommitment?: string;
  publishedAt?: string;
  publishedBy?: string;
  validatedAt?: string;
  validatedBy?: string;
}

export interface ProjectPaymentMilestoneData {
  id: string;
  label: string;
  trigger: string;
  percent: number;
  expectedAmount?: number;
  status: 'planned' | 'due' | 'paid' | 'blocked';
  note?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ProjectSiteUpdateData {
  id: string;
  phase: string;
  caption: string;
  report?: string;
  imageUrl: string;
  progress: number;
  createdAt: string;
  createdBy?: string;
}

export interface ProjectFinancingData {
  mode: string;
  readiness: 'confirmed' | 'bank_review' | 'to_structure' | 'unknown';
  paymentPrinciple: string;
  estimatedBudget?: number;
  monthlyIncome?: number;
  existingMonthlyDebt?: number;
  monthlyPaymentCapacity?: number;
  ownContribution?: number;
  requestedLoanAmount?: number;
  desiredLoanDurationYears?: number;
  availableSavings?: number;
  employmentStatus?: string;
  incomeCurrency?: string;
  incomeStability?: string;
  householdDependents?: number;
  coBorrowerStatus?: string;
  financingOwner?: string;
  affordabilityScore?: number;
  financialRiskLevel?: 'low' | 'moderate' | 'high' | 'unknown';
  equityRatioPercent?: number;
  cashReserveMonths?: number;
  bankName?: string;
  bankContact?: string;
  bankAgreementStage?: string;
  financingPurpose?: string;
  downPaymentSource?: string;
  documentReadiness?: string[];
  guarantees?: string[];
  commitments?: string[];
  currentDebtRatioPercent?: number;
  projectedDebtRatioPercent?: number;
  notaryContract: boolean;
  escrowRequested: boolean;
  bankSupportRequested: boolean;
  landSupportRequested: boolean;
  notes?: string;
  milestones: ProjectPaymentMilestoneData[];
  updatedAt: string;
}

export interface ProjectInfoResponseData {
  id: string;
  message: string;
  requestMessage?: string;
  respondedAt: string;
  respondedBy?: string;
}

export interface ProjectMessageData {
  id: string;
  senderName: string;
  senderRole: 'client' | 'admin';
  message: string;
  createdAt: string;
}

export interface ProjectActivityData {
  id: string;
  label: string;
  actor: string;
  type: 'system' | 'client' | 'admin' | 'document' | 'quote' | 'status' | 'proposal' | 'site' | 'message' | 'payment';
  createdAt: string;
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: string;
  audience?: 'client' | 'admin' | 'both';
  link?: string;
  projectId?: string;
  actionLabel?: string;
  isRead: boolean;
  createdAt: string;
}

export interface FilterState {
  type?: string;
  city?: string;
  budgetMin?: number;
  budgetMax?: number;
  surfaceMin?: number;
  surfaceMax?: number;
  bedrooms?: number;
  levels?: number;
  standing?: string;
  hasPool?: boolean;
  hasGarage?: boolean;
}

export interface ConfiguratorState {
  currentStep: number;
  categoryId?: string;
  categoryName?: string;
  modelId?: string;
  responses: Record<string, unknown>;
}

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  submitted: 'Demande soumise',
  verifying: 'Vérification',
  info_required: 'Infos requises',
  visit_planned: 'Visite planifiée',
  studying: 'Étude en cours',
  estimating: 'Estimation',
  proposal_ready: 'Proposition disponible',
  proposal_validated: 'Proposition validée',
  quote_sent: 'Devis transmis',
  modification_requested: 'Modification demandée',
  awaiting_validation: 'En attente',
  accepted: 'Accepté',
  contract_prep: 'Contrat en préparation',
  payment_pending: 'Paiement attendu',
  planning: 'Planification',
  in_progress: 'En cours',
  suspended: 'Suspendu',
  provisional_acceptance: 'Réception provisoire',
  corrections: 'Corrections',
  final_acceptance: 'Réception définitive',
  delivered: 'Livré',
  archived: 'Archivé',
  refused: 'Refusé',
};

export const CITIES_CI = [
  'Abengourou', 'Abidjan', 'Aboisso', 'Abobo', 'Adiaké', 'Adjamé',
  'Adzopé', 'Agboville', 'Agnibilékrou', 'Akoupé', 'Alépé', 'Anyama',
  'Arrah', 'Assinie', 'Attécoubé', 'Ayamé', 'Azaguié', 'Bangolo',
  'Béoumi', 'Bettié', 'Bingerville', 'Biankouma', 'Blolequin', 'Bocanda',
  'Bondoukou', 'Bongouanou', 'Bonon', 'Bonoua', 'Bouaflé', 'Bouaké',
  'Bouna', 'Boundiali', 'Brobo', 'Brofodoumé', 'Buyo', 'Cocody',
  'Dabakala', 'Dabou', 'Daloa', 'Danané', 'Daoukro', 'Dianra',
  'Didiévi', 'Dimbokro', 'Divo', 'Doropo', 'Duékoué', 'Facobly',
  'Ferkessédougou', 'Fresco', 'Gagnoa', 'Grand-Bassam', 'Grand-Béréby',
  'Grand-Lahou', 'Guéyo', 'Guiglo', 'Guitry', 'Issia', 'Jacqueville',
  'Kani', 'Katiola', 'Kong', 'Korhogo', 'Koro', 'Koumassi',
  'Koun-Fao', 'Kouto', 'Lakota', 'Logoualé', 'Madinani', 'Man',
  'Mankono', 'Marcory', 'Méagui', 'Minignan', 'Nassian', 'Niablé',
  'Odienné', 'Oumé', 'Plateau', 'Port-Bouët', 'Prikro', 'Riviera',
  'Sakassou', 'San-Pédro', 'Sandégué', 'Sassandra', 'Séguéla',
  'Sinfra', 'Songon', 'Soubré', 'Tabou', 'Tanda', 'Tengréla',
  'Tiassalé', 'Tiapoum', 'Tiébissou', 'Tingréla', 'Toulepleu',
  'Toumodi', 'Treichville', 'Vavoua', 'Yamoussoukro', 'Yopougon',
  'Zouan-Hounien', 'Zuenoula'
];

export const COMMUNES_ABIDJAN = [
  'Abobo', 'Adjamé', 'Anyama', 'Attécoubé', 'Bingerville', 'Brofodoumé',
  'Cocody', 'Koumassi', 'Marcory', 'Plateau', 'Port-Bouët', 'Riviera',
  'Songon', 'Treichville', 'Yopougon'
];

export const STANDING_OPTIONS = [
  { value: 'economique', label: 'Économique' },
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'luxe', label: 'Luxe' },
];

export const FORMAT_XOF = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' XOF';
};

export const FORMAT_SHORT_XOF = (amount: number): string => {
  if (amount >= 1_000_000_000) return (amount / 1_000_000_000).toFixed(1) + ' Mrd';
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1) + ' M';
  if (amount >= 1_000) return (amount / 1_000).toFixed(0) + ' K';
  return new Intl.NumberFormat('fr-FR').format(amount);
};
