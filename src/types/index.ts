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
  scheduleItems?: ProjectScheduleItemData[];
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

export interface ProjectScheduleItemData {
  id: string;
  type: 'appointment' | 'technical_visit' | 'site_meeting' | 'bank_meeting' | 'client_validation';
  title: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'postponed' | 'reschedule_requested' | 'cancelled';
  scheduledAt: string;
  durationMinutes: number;
  mode: 'phone' | 'video' | 'whatsapp' | 'site' | 'office' | 'bank';
  timeZone?: string;
  location?: string;
  preparation?: string;
  decisionExpected?: string;
  clientResponseNote?: string;
  clientRespondedAt?: string;
  clientRespondedBy?: string;
  note?: string;
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
}

export interface ProjectFinancingData {
  mode: string;
  readiness: 'confirmed' | 'bank_review' | 'to_structure' | 'unknown';
  paymentPrinciple: string;
  estimatedBudget?: number;
  monthlyIncome?: number;
  baseSalary?: number;
  variableMonthlyIncome?: number;
  otherMonthlyIncome?: number;
  existingMonthlyDebt?: number;
  monthlyPaymentCapacity?: number;
  ownContribution?: number;
  requestedLoanAmount?: number;
  desiredLoanDurationYears?: number;
  availableSavings?: number;
  employmentStatus?: string;
  financialSector?: string;
  contractType?: string;
  employerName?: string;
  salaryDomiciliationBank?: string;
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
  type: 'system' | 'client' | 'admin' | 'document' | 'quote' | 'status' | 'proposal' | 'site' | 'message' | 'payment' | 'schedule';
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

const CITIES_CI_BASE = [
  'Abengourou', 'Abidjan', 'Abidjan - Abobo', 'Abidjan - Adjamé',
  'Abidjan - Anyama', 'Abidjan - Attécoubé', 'Abidjan - Bingerville',
  'Abidjan - Cocody', 'Abidjan - Koumassi', 'Abidjan - Marcory',
  'Abidjan - Plateau', 'Abidjan - Port-Bouët', 'Abidjan - Songon',
  'Abidjan - Treichville', 'Abidjan - Yopougon', 'Aboisso', 'Abobo',
  'Adiaké', 'Adjamé', 'Adzopé', 'Afféry', 'Agboville',
  'Agnibilékrou', 'Agou', 'Akoupé', 'Alépé', 'Ananda', 'Andé',
  'Anoumaba', 'Anyama', 'Arrah', 'Assinie', 'Assuefry', 'Attécoubé',
  'Ayamé', 'Azaguié', 'Bako', 'Bangolo', 'Bécédi-Brignan', 'Béoumi',
  'Bettié', 'Biankouma', 'Bingerville', 'Bloléquin', 'Bocanda',
  'Bodokro', 'Bondoukou', 'Bongouanou', 'Bonon', 'Bonoua', 'Botro',
  'Bouaflé', 'Bouaké', 'Bouandougou', 'Bouna', 'Boundiali', 'Brobo',
  'Brofodoumé', 'Buyo', 'Cocody', 'Dabakala', 'Dabou', 'Daloa',
  'Danané', 'Daoukro', 'Dianra', 'Diawala', 'Didiévi', 'Dikodougou',
  'Dimbokro', 'Divo', 'Djékanou', 'Djibrosso', 'Dogué', 'Doropo',
  'Duékoué', 'Facobly', 'Ferkessédougou', 'Fresco', 'Fronan',
  'Gagnoa', 'Gbon', 'Gbonné', 'Grand-Bassam', 'Grand-Béréby',
  'Grand-Lahou', 'Grabo', 'Guéyo', 'Guibéroua', 'Guiglo', 'Guitry',
  'Hiré', 'Issia', 'Jacqueville', 'Kani', 'Kaniasso', 'Katiola',
  'Kokoumbo', 'Kong', 'Korhogo', 'Koro', 'Kouassi-Datékro',
  'Kouibly', 'Koumassi', 'Kounahiri', 'Koun-Fao', 'Kouto', 'Lakota',
  'Logoualé', 'Madinani', 'Mankono', 'Marcory', 'Mayo', 'M’Bahiakro',
  'M’Batto', 'M’Bengué', 'Méagui', 'Minignan', 'Nassian', 'Niablé',
  'Niakaramandougou', 'Niellé', 'Odienné', 'Oumé', 'Ouangolodougou',
  'Ouaninou', 'Ouellé', 'Plateau', 'Port-Bouët', 'Prikro', 'Rubino',
  'Sakassou', 'Samatiguila', 'San-Pédro', 'Sandégué', 'Sassandra',
  'Séguéla', 'Seydougou', 'Sinfra', 'Sinématiali', 'Sipilou',
  'Songon', 'Soubré', 'Tabou', 'Taabo', 'Tafiré', 'Taï', 'Tanda',
  'Tengréla', 'Tiassalé', 'Tiapoum', 'Tiébissou', 'Tingréla',
  'Tioroniaradougou', 'Touba', 'Toulepleu', 'Toumodi', 'Transua',
  'Treichville', 'Vavoua', 'Yamoussoukro', 'Yopougon', 'Zikisso',
  'Zouan-Hounien', 'Zoukougbeu', 'Zuénoula'
];

const CITIES_CI_COMPLEMENTS = [
  'Abié', 'Abigui', 'Abolikro', 'Abongoua', 'Aboudé', 'Abradinou',
  'Abronamoué', 'Aby', 'Aby-Adjouan-Mohoua', 'Adaou', 'Addah',
  'Adessé', 'Adjaméné', 'Adjouan', 'Adouakouakro', 'Adoukro',
  'Affalikro', 'Affiénou', 'Afotobo', 'Agbaou-Ahéoua', 'Agnia',
  'Ahigbé-Koffikro', 'Ahouabo-Bouapé', 'Ahouakro', 'Ahouanou',
  'Ahougnanssou', 'Akoboissué', 'Akoi N’denou', 'Akounougbé',
  'Akoupé-Zeudji', 'Akouré', 'Akradio', 'Akridou-Laddé',
  'Allangouassou', 'Allosso 2', 'Amanvi', 'Amélékia',
  'Amian Kouassikro', 'Amoriakro', 'Ananguié', 'Ancien Prozi',
  'Angoda', 'Anianou', 'Aniassué', 'Annépé', 'Anno', 'Appimandoum',
  'Appoisso', 'Appouasso', 'Apprompron-Afêwa', 'Apprompronou',
  'Arikokaha', 'Arokpa', 'Assahara', 'Assalé-Kouassikro',
  'Assandrè', 'Assié-Koumassi', 'Assikoi', 'Assinie-Mafia',
  'Attiégouakro', 'Attiékoi', 'Attiguéhi', 'Attinguié', 'Attobrou',
  'Attokro', 'Attoutou A', 'Ayaou-Sran', 'Ayénouan', 'Babakro',
  'Bacanda', 'Bacon', 'Badikaha', 'Bagohouo', 'Bakandesso-Sogbeni',
  'Bakanou', 'Bakoubli', 'Baléko', 'Bambalouma', 'Bamoro',
  'Bandakagni Tomora', 'Bandakagni-Sokoura', 'Bangoua', 'Banneu',
  'Baonfla', 'Bassawa', 'Bayota', 'Bazra-Nattis', 'Bazré',
  'Bédiala', 'Bédy-Goazon', 'Bégbessou', 'Bengassou',
  'Béoué-Zibiao', 'Béréni Dialla', 'Bériaboukro', 'Bianouan',
  'Biasso', 'Biéby', 'Bilimono', 'Bin-Houyé', 'Binao-Boussoué',
  'Binzra', 'Bla', 'Blanfla', 'Blapleu', 'Bléniméouin',
  'Boahia', 'Bobi', 'Bodo', 'Bogofa', 'Bogouiné', 'Boguédia',
  'Bohobli', 'Bokala-Niampondougou', 'Boli', 'Bolona',
  'Bonahouin', 'Bondo', 'Bongo', 'Bonguéra', 'Boniérédougou',
  'Bonikro', 'Bonoufla', 'Booko', 'Borotou', 'Borotou-Koro',
  'Botindé', 'Bouadikro', 'Bouboury', 'Boudépé', 'Bougou',
  'Bougousso', 'Bouko', 'Boyaokro', 'Bozi', 'Bricolo', 'Brihiri',
  'Brima', 'Broma', 'Brou Ahoussoukro', 'Brou Akpaoussou',
  'Broubrou', 'Broudoukou-Penda', 'Céchi', 'Chiépo', 'Cosrou',
  'Dabadougou-Mafélé', 'Dabouyo', 'Dadiassé', 'Dagba',
  'Dahiépa-Kéhi', 'Dahiri', 'Dairo-Didizo', 'Dakouritrohoin',
  'Dakpadou', 'Daleu', 'Damé', 'Dananon', 'Dandougou', 'Danguira',
  'Dania', 'Danoa', 'Dantogo', 'Dapéoua', 'Dapo-Iboké',
  'Dassioko', 'Dassoungboho', 'Débété', 'Dèdègbeu', 'Détroya',
  'Diabo', 'Diahouin', 'Dialakoro', 'Diamakani', 'Diamarakro',
  'Diamba', 'Diangobo', 'Dikodougou', 'Dogué', 'Ebikro-N’dakro',
  'Ebilassokro', 'Ebonou', 'Eboué', 'Ehuasso', 'Eloka',
  'Ettrokro', 'Etuéboué', 'Etuessika', 'Gabia', 'Gabiadji',
  'Gadago', 'Gagny', 'Galébou', 'Ganaoni', 'Ganhoué', 'Ganleu',
  'Gaoté', 'Gbablasso', 'Gbadjié', 'Gbagbam', 'Gbamélédougo',
  'Gbangbégouiné', 'Gbangbégouiné-Yati', 'Gbapleu',
  'Gbatongouin', 'Gbazoa', 'Gbékékro', 'Gbéléban', 'Gbétogo',
  'Gbliglo', 'Gbofesso-Sama', 'Gbogolo', 'Gboguhé',
  'Gbon-Houyé', 'Gbongaha', 'Gligbeuadji', 'Gloplou',
  'Gnagbodougnoa', 'Gnagboya', 'Gnago', 'Gnakouboué', 'Kaadé',
  'Kadéko', 'Kadioha', 'Kafoudougou-Bambarasso', 'Kagbolodougou',
  'Kahin-Zarabaon', 'Kakpi', 'Kalaha', 'Kalamon', 'Kaloa',
  'Kamala', 'Kamalo', 'Kamoro', 'Kanagonon', 'Kanakono',
  'Kanawolo', 'Kanoroba', 'Kanzra', 'Kaouara', 'Karakoro',
  'Kasséré', 'Katchiré-Essékro', 'Katiali', 'Katimassou',
  'Katogo', 'Kawolo-Sobara', 'Ké-Bouébo', 'Kébi', 'Kéibly',
  'Kétesso', 'Kétro-Bassam', 'Kibouo', 'Kiélé', 'Kiémou',
  'Kimbirila Nord', 'Kimbirila Sud', 'Kolia', 'Komborodougou',
  'Koni', 'Kouadioblékro', 'Kouakro', 'Kouaméfla', 'Kouassia-Niaguini',
  'Kouétinfla', 'Kpata', 'Kpouèbo', 'Kpouèbo Bonou',
  'Krakro', 'Krofoinsou', 'Lataha', 'Liliyo', 'Lobo-Akoudzin',
  'Lopou', 'Maféré', 'Mahandougou', 'Man', 'Mbatto', 'Miadzin',
  'Moapé', 'Molonou', 'Morokro', 'N’Douci', 'Nafana', 'Napié',
  'N’Gattakro', 'Niakara', 'Niambézaria', 'Niando', 'Niofoin',
  'Noé', 'Nofou', 'N’Zianouan', 'Oghlwapo', 'Okrouyo', 'Ony-Tabré',
  'Oress-Krobou', 'Ottopé', 'Pacobo', 'Pakouabo', 'Péhé',
  'Petit-Bondoukou', 'Petit-Yapo', 'Pogo', 'Ponondougou',
  'Poungbè', 'Prano', 'Saïoua', 'Samatiguila', 'Sangouiné',
  'Satama-Sokoro', 'Satama-Sokoura', 'Séguelon', 'Sérihio',
  'Seydougou', 'Sifié', 'Sikensi', 'Sokoro', 'Sokorodougou',
  'Sominassé', 'Tafiré', 'Takikro', 'Tankessé', 'Téhini',
  'Tienkoikro', 'Tiémélékro', 'Tieningboué', 'Tortiya',
  'Totrodrou', 'Vavoua', 'Worofla', 'Yacolidabouo',
  'Yakassé-Attobrou', 'Yakassé-Mé', 'Yocoboué', 'Zaliohouan',
  'Zaranou', 'Zéaglo', 'Zéo', 'Zikisso'
];

export const CITIES_CI = Array.from(new Set([...CITIES_CI_BASE, ...CITIES_CI_COMPLEMENTS]));

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
