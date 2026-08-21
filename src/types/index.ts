export type ViewName =
  | 'home'
  | 'explore'
  | 'create'
  | 'projects'
  | 'profile'
  | 'model-detail'
  | 'configurator'
  | 'auth-login'
  | 'auth-register'
  | 'auth-otp'
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
  status: string;
  categoryId?: string;
  categoryName?: string;
  modelId?: string;
  modelName?: string;
  budgetMin?: number;
  budgetMax?: number;
  city?: string;
  progress: number;
  createdAt: string;
 updatedAt: string;
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
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
  'Abidjan', 'Bouaké', 'Daloa', 'Korhogo', 'San-Pédro',
  'Yamoussoukro', 'Soubré', 'Divo', 'Anyama', 'Abengourou',
  'Adzopé', 'Agboville', 'Agnibilékrou', 'Akoupé', 'Alépé',
  'Bingerville', 'Bondoukou', 'Bouaflé', 'Bouna', 'Dabou',
  'Danané', 'Daoukro', 'Dimbokro', 'Duékoué', 'Ferkessédougou',
  'Gagnoa', 'Grand-Béréby', 'Guiglo', 'Issia', 'Jacqueville',
  'Katiola', 'Lakota', 'Man', 'Mankono', 'Odienné', 'Sinfra',
  'Tanda', 'Toumodi', 'Vavoua', 'Zuenoula'
];

export const COMMUNES_ABIDJAN = [
  'Cocody', 'Plateau', 'Riviera', 'Marcory', 'Treichville',
  'Adjamé', 'Attécoubé', 'Yopougon', 'Abobo', 'Koumassi',
  'Bingerville', 'Brofot', 'Songon', 'Anyama'
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
