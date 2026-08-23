'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  AirVent,
  Armchair,
  BadgeCheck,
  BadgeDollarSign,
  Banknote,
  BanknoteArrowDown,
  Bath,
  BatteryCharging,
  BedDouble,
  BrickWall,
  BriefcaseBusiness,
  Building,
  Building2,
  Calculator,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  CircleDot,
  CircleDollarSign,
  CircleParking,
  ClipboardList,
  ClipboardCheck,
  Clock,
  Coins,
  CookingPot,
  Crown,
  DoorOpen,
  Droplets,
  DraftingCompass,
  Drill,
  Eye,
  Fence,
  Flag,
  Gauge,
  Gem,
  Globe,
  Hammer,
  Handshake,
  HelpCircle,
  Home,
  Hourglass,
  KeyRound,
  LandPlot,
  Landmark,
  Layers,
  Lightbulb,
  ListChecks,
  MapPin,
  Minus,
  Network,
  NotebookTabs,
  PaintBucket,
  PanelTop,
  Paintbrush,
  PartyPopper,
  Pencil,
  Pickaxe,
  PlugZap,
  Plus,
  RadioTower,
  ReceiptText,
  Route,
  RotateCcw,
  Ruler,
  Search,
  Send,
  Scale,
  ShieldPlus,
  ShieldCheck,
  ShowerHead,
  Signature,
  Siren,
  Sprout,
  Stamp,
  Timer,
  ToolCase,
  TrafficCone,
  UserCheck,
  Users,
  Vault,
  Wallet,
  Warehouse,
  Waves,
  Wrench,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { useAppStore } from '@/stores/app-store';
import { CITIES_CI, COMMUNES_ABIDJAN } from '@/types';
import type { LucideIcon } from 'lucide-react';
import type { ProjectFinancingData, ProjectPaymentMilestoneData } from '@/types';

type ProjectFamily = 'maison' | 'rplus' | 'vrd' | 'lot' | 'hydraulique' | 'etude' | 'promotion';
type FieldType = 'text' | 'number' | 'select' | 'textarea';
type StepType =
  | 'choice-single'
  | 'choice-multi'
  | 'counter'
  | 'field-group'
  | 'select'
  | 'slider'
  | 'textarea'
  | 'summary'
  | 'confirmation';

interface ChoiceOption {
  value: string;
  label: string;
  icon?: LucideIcon;
  description?: string;
}

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: ChoiceOption[];
  unit?: string;
  helper?: string;
  required?: boolean;
  min?: number;
  max?: number;
}

interface StepDef {
  id: string;
  title: string;
  subtitle?: string;
  responseKey: string;
  type: StepType;
  options?: ChoiceOption[];
  fields?: FieldDef[];
  insight?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
  skippable?: boolean;
  skipLabel?: string;
  required?: boolean;
  minSelections?: number;
  requiredMessage?: string;
}

type ControlTone = 'neutral' | 'good' | 'warn' | 'critical';

interface ControlMetric {
  label: string;
  value: string;
  helper?: string;
  tone?: ControlTone;
}

interface OuvrageControlProfile {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  metrics: ControlMetric[];
  checks: string[];
  risks: string[];
  finance: ControlMetric[];
}

interface FinancingAdvisorMetric {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
}

interface FinancingAdvisorPlan {
  title: string;
  summary: string;
  stageLabel: string;
  readinessLabel: string;
  metrics: FinancingAdvisorMetric[];
  safeguards: string[];
  nextActions: string[];
  milestones: ProjectPaymentMilestoneData[];
}

const PROJECT_TYPES: ChoiceOption[] = [
  { value: 'maison-basse', label: 'Maison basse', icon: Home, description: 'Plain-pied, villa ou maison familiale' },
  { value: 'duplex-triplex', label: 'Duplex / Triplex', icon: Building2, description: 'Maison à niveaux privatifs' },
  { value: 'immeuble-rplus', label: 'Immeuble R+', icon: Landmark, description: 'Bâtiment collectif à niveaux' },
  { value: 'promotion', label: 'Promotion', icon: Building, description: 'Programme immobilier complet' },
  { value: 'vrd', label: 'VRD', icon: Route, description: 'Voirie, drainage, réseaux divers' },
  { value: 'hydraulique', label: 'Hydraulique', icon: Droplets, description: 'Forage, eau, assainissement' },
  { value: 'lot-travaux', label: 'Lot de travaux', icon: Hammer, description: 'Gros œuvre, second œuvre, finition' },
  { value: 'renovation', label: 'Rénovation', icon: Paintbrush, description: 'Réhabilitation, extension, reprise' },
  { value: 'etude-suivi', label: 'Étude / suivi', icon: DraftingCompass, description: 'Plans, contrôle, chiffrage' },
  { value: 'autre', label: 'Autre besoin', icon: HelpCircle, description: 'Demande à préciser' },
];

const CATEGORY_SLUG_BY_TYPE: Record<string, string> = {
  'maison-basse': 'villa-basse',
  'duplex-triplex': 'duplex',
  'immeuble-rplus': 'immeuble',
  promotion: 'promotion-immobiliere',
  vrd: 'vrd',
  hydraulique: 'hydraulique',
  'lot-travaux': 'construction',
  renovation: 'renovation',
  'etude-suivi': 'etude',
  autre: 'autre',
};

const COUNTRY_OPTIONS: ChoiceOption[] = [
  { value: "Côte d'Ivoire", label: "Côte d'Ivoire", description: 'Abidjan, Bouaké, Yamoussoukro, San-Pédro...' },
  { value: 'Burkina Faso', label: 'Burkina Faso', description: 'Ouagadougou, Bobo-Dioulasso, Koudougou...' },
  { value: 'Mali', label: 'Mali', description: 'Bamako, Sikasso, Ségou, Kayes...' },
  { value: 'Sénégal', label: 'Sénégal', description: 'Dakar, Thiès, Saint-Louis, Touba...' },
  { value: 'Guinée', label: 'Guinée', description: 'Conakry, Kankan, Kindia, Labé...' },
  { value: 'Togo', label: 'Togo', description: 'Lomé, Sokodé, Kara, Atakpamé...' },
  { value: 'Bénin', label: 'Bénin', description: 'Cotonou, Porto-Novo, Parakou, Abomey-Calavi...' },
  { value: 'Ghana', label: 'Ghana', description: 'Accra, Kumasi, Tamale, Takoradi...' },
  { value: 'Niger', label: 'Niger', description: 'Niamey, Maradi, Zinder, Tahoua...' },
  { value: 'Liberia', label: 'Liberia', description: 'Monrovia, Gbarnga, Buchanan, Kakata...' },
  { value: 'Sierra Leone', label: 'Sierra Leone', description: 'Freetown, Bo, Kenema, Makeni...' },
  { value: 'Cameroun', label: 'Cameroun', description: 'Douala, Yaoundé, Bafoussam, Garoua...' },
  { value: 'Gabon', label: 'Gabon', description: 'Libreville, Port-Gentil, Franceville, Oyem...' },
  { value: 'Congo', label: 'Congo', description: 'Brazzaville, Pointe-Noire, Dolisie, Nkayi...' },
  { value: 'RD Congo', label: 'RD Congo', description: 'Kinshasa, Lubumbashi, Goma, Kisangani...' },
  { value: 'Nigeria', label: 'Nigeria', description: 'Lagos, Abuja, Kano, Ibadan...' },
  { value: 'Afrique du Sud', label: 'Afrique du Sud', description: 'Johannesburg, Cape Town, Durban, Pretoria...' },
  { value: 'Maroc', label: 'Maroc', description: 'Casablanca, Rabat, Marrakech, Tanger...' },
  { value: 'France', label: 'France', description: 'Paris, Lyon, Marseille, Bordeaux...' },
  { value: 'Belgique', label: 'Belgique', description: 'Bruxelles, Anvers, Liège, Charleroi...' },
  { value: 'Suisse', label: 'Suisse', description: 'Genève, Zurich, Lausanne, Bâle...' },
  { value: 'Royaume-Uni', label: 'Royaume-Uni', description: 'Londres, Birmingham, Manchester, Leeds...' },
  { value: 'Allemagne', label: 'Allemagne', description: 'Berlin, Hambourg, Munich, Francfort...' },
  { value: 'Italie', label: 'Italie', description: 'Rome, Milan, Turin, Naples...' },
  { value: 'Espagne', label: 'Espagne', description: 'Madrid, Barcelone, Valence, Séville...' },
  { value: 'Canada', label: 'Canada', description: 'Montréal, Toronto, Ottawa, Québec...' },
  { value: 'États-Unis', label: 'États-Unis', description: 'New York, Washington, Houston, Atlanta...' },
  { value: 'Émirats arabes unis', label: 'Émirats arabes unis', description: 'Dubaï, Abu Dhabi, Sharjah, Ajman...' },
  { value: 'Autre pays', label: 'Autre pays', description: 'Saisie libre du pays et de la ville' },
];

const CITY_OPTIONS_BY_COUNTRY: Record<string, string[]> = {
  "Côte d'Ivoire": CITIES_CI,
  'Burkina Faso': ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Ouahigouya', 'Banfora', 'Kaya', 'Fada N’Gourma', 'Tenkodogo', 'Dédougou', 'Gaoua', 'Dori', 'Ziniaré'],
  Mali: ['Bamako', 'Sikasso', 'Ségou', 'Mopti', 'Kayes', 'Koutiala', 'Gao', 'Tombouctou', 'Kati', 'San', 'Bougouni', 'Koulikoro'],
  Sénégal: ['Dakar', 'Thiès', 'Touba', 'Rufisque', 'Saint-Louis', 'Kaolack', 'Ziguinchor', 'Mbour', 'Diourbel', 'Louga', 'Tambacounda', 'Kolda'],
  Guinée: ['Conakry', 'Kankan', 'Kindia', 'Labé', 'Nzérékoré', 'Mamou', 'Boké', 'Faranah', 'Siguiri', 'Kissidougou', 'Macenta', 'Coyah'],
  Togo: ['Lomé', 'Sokodé', 'Kara', 'Atakpamé', 'Kpalimé', 'Tsévié', 'Aného', 'Mango', 'Dapaong', 'Bassar', 'Notsé', 'Tchamba'],
  Bénin: ['Cotonou', 'Porto-Novo', 'Parakou', 'Abomey-Calavi', 'Djougou', 'Bohicon', 'Natitingou', 'Ouidah', 'Lokossa', 'Abomey', 'Kandi', 'Malanville'],
  Ghana: ['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Tema', 'Cape Coast', 'Sekondi', 'Sunyani', 'Ho', 'Koforidua', 'Wa', 'Bolgatanga'],
  Niger: ['Niamey', 'Maradi', 'Zinder', 'Tahoua', 'Agadez', 'Dosso', 'Tillabéri', 'Diffa', 'Arlit', 'Birni N’Konni', 'Tessaoua', 'Gaya'],
  Liberia: ['Monrovia', 'Gbarnga', 'Buchanan', 'Kakata', 'Voinjama', 'Harper', 'Zwedru', 'Ganta', 'Robertsport', 'Sanniquellie', 'Tubmanburg', 'Greenville'],
  'Sierra Leone': ['Freetown', 'Bo', 'Kenema', 'Makeni', 'Koidu', 'Port Loko', 'Lunsar', 'Kabala', 'Waterloo', 'Moyamba', 'Bonthe', 'Magburaka'],
  Cameroun: ['Douala', 'Yaoundé', 'Bafoussam', 'Garoua', 'Bamenda', 'Maroua', 'Ngaoundéré', 'Bertoua', 'Ebolowa', 'Kribi', 'Limbé', 'Dschang'],
  Gabon: ['Libreville', 'Port-Gentil', 'Franceville', 'Oyem', 'Moanda', 'Mouila', 'Lambaréné', 'Tchibanga', 'Koulamoutou', 'Makokou', 'Bitam', 'Ntoum'],
  Congo: ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Nkayi', 'Owando', 'Ouesso', 'Madingou', 'Gamboma', 'Impfondo', 'Sibiti', 'Mossendjo', 'Kinkala'],
  'RD Congo': ['Kinshasa', 'Lubumbashi', 'Goma', 'Kisangani', 'Bukavu', 'Kananga', 'Mbuji-Mayi', 'Kolwezi', 'Matadi', 'Boma', 'Likasi', 'Bunia'],
  Nigeria: ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Benin City', 'Kaduna', 'Enugu', 'Abeokuta', 'Ilorin', 'Jos', 'Calabar'],
  'Afrique du Sud': ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Polokwane', 'Nelspruit', 'Kimberley', 'Rustenburg', 'Pietermaritzburg'],
  Maroc: ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Meknès', 'Oujda', 'Tétouan', 'Kénitra', 'Salé', 'El Jadida'],
  France: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Montpellier', 'Strasbourg', 'Bordeaux', 'Lille', 'Rennes', 'Grenoble'],
  Belgique: ['Bruxelles', 'Anvers', 'Gand', 'Charleroi', 'Liège', 'Bruges', 'Namur', 'Mons', 'Louvain', 'Malines', 'Ostende', 'Tournai'],
  Suisse: ['Genève', 'Zurich', 'Lausanne', 'Bâle', 'Berne', 'Fribourg', 'Neuchâtel', 'Sion', 'Lucerne', 'Lugano', 'Winterthour', 'Saint-Gall'],
  'Royaume-Uni': ['Londres', 'Birmingham', 'Manchester', 'Leeds', 'Liverpool', 'Bristol', 'Glasgow', 'Édimbourg', 'Cardiff', 'Leicester', 'Coventry', 'Nottingham'],
  Allemagne: ['Berlin', 'Hambourg', 'Munich', 'Francfort', 'Cologne', 'Düsseldorf', 'Stuttgart', 'Dortmund', 'Essen', 'Leipzig', 'Brême', 'Hanovre'],
  Italie: ['Rome', 'Milan', 'Turin', 'Naples', 'Bologne', 'Florence', 'Gênes', 'Bari', 'Palerme', 'Vérone', 'Venise', 'Parme'],
  Espagne: ['Madrid', 'Barcelone', 'Valence', 'Séville', 'Saragosse', 'Malaga', 'Murcie', 'Palma', 'Bilbao', 'Alicante', 'Cordoue', 'Grenade'],
  Canada: ['Montréal', 'Toronto', 'Vancouver', 'Ottawa', 'Québec', 'Calgary', 'Edmonton', 'Winnipeg', 'Hamilton', 'Laval', 'Gatineau', 'Halifax'],
  'États-Unis': ['New York', 'Washington', 'Houston', 'Atlanta', 'Los Angeles', 'Chicago', 'Dallas', 'Miami', 'Philadelphia', 'Phoenix', 'Boston', 'Seattle'],
  'Émirats arabes unis': ['Dubaï', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Al Ain', 'Ras el Khaïmah', 'Fujairah', 'Umm al-Quwain'],
};

function buildCityOptions(country?: string): ChoiceOption[] {
  const baseCities = CITY_OPTIONS_BY_COUNTRY[country || "Côte d'Ivoire"] || [];
  return [
    ...Array.from(new Set(baseCities))
      .sort((a, b) => a.localeCompare(b, 'fr'))
      .map(city => ({ value: city, label: city })),
    { value: 'Autre ville', label: 'Autre ville', icon: LandPlot },
  ];
}

function isAbidjanAreaSelection(value?: unknown): boolean {
  const city = String(value || '').trim();
  if (!city) return false;
  const normalized = city.toLowerCase();
  return normalized === 'abidjan'
    || normalized.startsWith('abidjan -')
    || COMMUNES_ABIDJAN.some(commune => commune.toLowerCase() === normalized);
}

const TERRAIN_OPTIONS: ChoiceOption[] = [
  { value: 'owned', label: 'Terrain disponible', icon: CheckSquare, description: 'Titre, ACD ou attribution disponible' },
  { value: 'acquiring', label: 'Acquisition en cours', icon: CircleDot, description: 'Documents en préparation' },
  { value: 'searching', label: 'Terrain à rechercher', icon: Search, description: 'Besoin d’appui pour trouver' },
  { value: 'existing-site', label: 'Site existant', icon: Building, description: 'Bâtiment ou emprise déjà occupé' },
  { value: 'unknown', label: 'À clarifier', icon: HelpCircle, description: 'Informations à compléter' },
];

const SITE_ACCESS_OPTIONS: ChoiceOption[] = [
  { value: 'facile', label: 'Accès facile' },
  { value: 'moyen', label: 'Accès moyen' },
  { value: 'difficile', label: 'Accès difficile' },
  { value: 'a-ouvrir', label: 'Voie à ouvrir' },
  { value: 'inconnu', label: 'À vérifier' },
];

const CLIENT_PRESENCE_OPTIONS: ChoiceOption[] = [
  { value: 'local', label: 'Je suis sur place', icon: MapPin, description: 'Je peux me déplacer facilement' },
  { value: 'abroad', label: 'Je suis hors du pays', icon: Globe, description: 'Je pilote le projet à distance' },
  { value: 'abroad-representative', label: 'Hors pays avec mandataire', icon: UserCheck, description: 'Une personne de confiance peut suivre sur place' },
  { value: 'representative-only', label: 'Mandataire uniquement', icon: Users, description: 'Le représentant gère les visites et confirmations' },
  { value: 'to-confirm', label: 'À organiser', icon: HelpCircle, description: 'Buildify doit m’aider à structurer le suivi' },
];

const TIME_ZONE_OPTIONS: ChoiceOption[] = [
  { value: 'Africa/Abidjan', label: 'Côte d’Ivoire / GMT' },
  { value: 'Europe/Paris', label: 'France / Europe centrale' },
  { value: 'Europe/Brussels', label: 'Belgique' },
  { value: 'Europe/London', label: 'Royaume-Uni' },
  { value: 'America/Toronto', label: 'Canada Est' },
  { value: 'America/New_York', label: 'États-Unis Est' },
  { value: 'America/Chicago', label: 'États-Unis Centre' },
  { value: 'America/Los_Angeles', label: 'États-Unis Ouest' },
  { value: 'Africa/Dakar', label: 'Sénégal / GMT' },
  { value: 'Africa/Ouagadougou', label: 'Burkina Faso / GMT' },
];

const CONTACT_CHANNEL_OPTIONS: ChoiceOption[] = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Appel téléphonique' },
  { value: 'video', label: 'Visio' },
];

const CONTACT_WINDOW_OPTIONS: ChoiceOption[] = [
  { value: 'morning-ci', label: 'Matin heure Côte d’Ivoire' },
  { value: 'afternoon-ci', label: 'Après-midi heure Côte d’Ivoire' },
  { value: 'evening-ci', label: 'Soir heure Côte d’Ivoire' },
  { value: 'weekend', label: 'Week-end uniquement' },
  { value: 'to-plan', label: 'À planifier selon disponibilité' },
];

const REPRESENTATIVE_RELATION_OPTIONS: ChoiceOption[] = [
  { value: 'family', label: 'Famille' },
  { value: 'trusted-person', label: 'Personne de confiance' },
  { value: 'company', label: 'Entreprise / associé' },
  { value: 'none', label: 'Aucun mandataire' },
];

const REMOTE_DECISION_OPTIONS: ChoiceOption[] = [
  { value: 'written-approval', label: 'Validation écrite avant action' },
  { value: 'video-review', label: 'Réunion visio avant décision' },
  { value: 'representative-approval', label: 'Mandataire autorisé à valider sur place' },
  { value: 'mixed', label: 'Validation mixte client + mandataire' },
];

const TOPOGRAPHY_OPTIONS: ChoiceOption[] = [
  { value: 'plat', label: 'Terrain plat' },
  { value: 'pente-legere', label: 'Pente légère' },
  { value: 'pente-forte', label: 'Pente forte' },
  { value: 'zone-humide', label: 'Zone humide' },
  { value: 'remblai', label: 'Remblai / terrain instable' },
  { value: 'inconnue', label: 'À diagnostiquer' },
];

const BUILDING_USE_OPTIONS: ChoiceOption[] = [
  { value: 'habitation', label: 'Habitation' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'bureaux', label: 'Bureaux' },
  { value: 'mixte', label: 'Mixte' },
  { value: 'hotel', label: 'Hôtel / résidence' },
];

const FINITION_OPTIONS: ChoiceOption[] = [
  { value: 'economique', label: 'Économique', icon: Wallet, description: 'Essentiel et maîtrisé' },
  { value: 'standard', label: 'Standard', icon: Scale, description: 'Bon rapport qualité-prix' },
  { value: 'premium', label: 'Premium', icon: Crown, description: 'Matériaux et détails soignés' },
  { value: 'luxe', label: 'Luxe', icon: Gem, description: 'Haut standing' },
  { value: 'a-definir', label: 'À définir', icon: HelpCircle, description: 'À cadrer avec l’équipe' },
];

const BUDGET_OPTIONS: ChoiceOption[] = [
  { value: 'less-10m', label: 'Moins de 10 M', icon: Coins, description: '< 10 000 000 F' },
  { value: '10-30m', label: '10 - 30 M', icon: Wallet, description: '10 à 30 M F' },
  { value: '30-75m', label: '30 - 75 M', icon: Banknote, description: '30 à 75 M F' },
  { value: '75-150m', label: '75 - 150 M', icon: CircleDollarSign, description: '75 à 150 M F' },
  { value: '150-300m', label: '150 - 300 M', icon: BadgeDollarSign, description: '150 à 300 M F' },
  { value: 'more-300m', label: 'Plus de 300 M', icon: Vault, description: '> 300 000 000 F' },
  { value: 'unknown', label: 'À estimer', icon: Calculator, description: 'Budget à chiffrer' },
];

const TIMELINE_OPTIONS: ChoiceOption[] = [
  { value: 'immediate', label: 'Immédiatement', icon: Flag, description: 'Démarrage urgent' },
  { value: '1-month', label: 'Sous 1 mois', icon: Timer, description: 'Préparation rapide' },
  { value: '3-months', label: 'Sous 3 mois', icon: CalendarClock, description: 'Études à finaliser' },
  { value: '6-months', label: 'Sous 6 mois', icon: CalendarCheck, description: 'Projet en préparation' },
  { value: '1-year', label: 'Sous 1 an', icon: Calendar, description: 'Projet à moyen terme' },
  { value: 'unknown', label: 'À définir', icon: Hourglass, description: 'Calendrier ouvert' },
];

const FINANCING_OPTIONS: ChoiceOption[] = [
  { value: 'confirmed-bank', label: 'Financement confirmé', icon: BadgeCheck, description: 'Banque, fonds propres ou enveloppe déjà disponible' },
  { value: 'bank-support', label: 'Aide avec ma banque', icon: Landmark, description: 'Structurer le dossier et discuter avec la banque' },
  { value: 'progress-payment', label: 'Paiement par avancement', icon: Calendar, description: 'Paiement à chaque étape réalisée du chantier' },
  { value: 'notary-secured', label: 'Contrat notarié', icon: ShieldCheck, description: 'Sécuriser les engagements avant démarrage' },
  { value: 'land-and-finance', label: 'Terrain + financement', icon: MapPin, description: 'Besoin d’appui terrain, banque et budget global' },
  { value: 'to-structure', label: 'À structurer', icon: HelpCircle, description: 'Besoin d’évaluer la capacité et le montage' },
];

const PAYMENT_SECURITY_OPTIONS: ChoiceOption[] = [
  { value: 'notary-contract', label: 'Contrat notarié', icon: Signature, description: 'Engagements formalisés avant démarrage' },
  { value: 'bank-disbursement', label: 'Décaissement banque', icon: BanknoteArrowDown, description: 'Versements déclenchés par la banque' },
  { value: 'escrow', label: 'Blocage / séquestre', icon: Vault, description: 'Fonds sécurisés avant libération' },
  { value: 'progress-photos', label: 'Photos par étape', icon: Eye, description: 'Preuves visuelles avant paiement' },
  { value: 'milestone-payment', label: 'Paiement par jalons', icon: ClipboardCheck, description: 'Paiement par niveau d’avancement validé' },
  { value: 'bank-support', label: 'Accompagnement banque', icon: Handshake, description: 'Aide au montage et au suivi banque' },
];

const FINANCING_PURPOSE_OPTIONS: ChoiceOption[] = [
  { value: 'construction-only', label: 'Construction uniquement', icon: BrickWall },
  { value: 'land-and-construction', label: 'Terrain + construction', icon: LandPlot },
  { value: 'works-lot', label: 'Lot de travaux', icon: Hammer },
  { value: 'vrd-infra', label: 'VRD / réseaux', icon: Network },
  { value: 'studies-permits', label: 'Études / permis', icon: DraftingCompass },
  { value: 'completion-finishes', label: 'Achèvement / finitions', icon: PaintBucket },
];

const EMPLOYMENT_STATUS_OPTIONS: ChoiceOption[] = [
  { value: 'civil-servant', label: 'Fonctionnaire / agent public', icon: ShieldCheck },
  { value: 'private-salary', label: 'Salarié du privé', icon: BriefcaseBusiness },
  { value: 'diaspora-salary', label: 'Salarié hors Côte d’Ivoire', icon: Globe },
  { value: 'entrepreneur', label: 'Entrepreneur / commerçant', icon: Warehouse },
  { value: 'liberal-service', label: 'Profession libérale', icon: ToolCase },
  { value: 'mixed-income', label: 'Revenus mixtes', icon: Layers },
  { value: 'family-backed', label: 'Appui familial structuré', icon: Users },
  { value: 'to-confirm', label: 'À confirmer', icon: HelpCircle },
];

const FINANCIAL_SECTOR_OPTIONS: ChoiceOption[] = [
  { value: 'public', label: 'Administration publique', icon: ShieldCheck },
  { value: 'private', label: 'Entreprise privée', icon: BriefcaseBusiness },
  { value: 'construction', label: 'BTP / immobilier', icon: BrickWall },
  { value: 'trade', label: 'Commerce', icon: Warehouse },
  { value: 'transport', label: 'Transport / logistique', icon: Route },
  { value: 'health', label: 'Santé', icon: ShieldPlus },
  { value: 'education', label: 'Éducation', icon: NotebookTabs },
  { value: 'digital', label: 'Digital / télécoms', icon: RadioTower },
  { value: 'agriculture', label: 'Agriculture / agro', icon: Sprout },
  { value: 'diaspora', label: 'Revenus diaspora', icon: Globe },
  { value: 'business', label: 'Activité indépendante', icon: ToolCase },
  { value: 'other', label: 'Autre secteur', icon: HelpCircle },
];

const CONTRACT_TYPE_OPTIONS: ChoiceOption[] = [
  { value: 'permanent', label: 'CDI / contrat permanent', icon: BadgeCheck },
  { value: 'fixed', label: 'CDD / mission longue', icon: CalendarClock },
  { value: 'civil', label: 'Fonction publique', icon: Stamp },
  { value: 'business', label: 'Activité indépendante', icon: Hammer },
  { value: 'company', label: 'Société porteuse', icon: Building },
  { value: 'mixed', label: 'Revenus mixtes', icon: Layers },
  { value: 'informal', label: 'Revenus à documenter', icon: ReceiptText },
  { value: 'other', label: 'Autre situation', icon: HelpCircle },
];

const INCOME_CURRENCY_OPTIONS: ChoiceOption[] = [
  { value: 'XOF', label: 'F CFA (XOF)', icon: Banknote },
  { value: 'EUR', label: 'Euro (EUR)', icon: CircleDollarSign },
  { value: 'USD', label: 'Dollar US (USD)', icon: BadgeDollarSign },
  { value: 'CAD', label: 'Dollar canadien (CAD)', icon: Wallet },
  { value: 'GBP', label: 'Livre sterling (GBP)', icon: Vault },
  { value: 'other', label: 'Autre devise', icon: HelpCircle },
];

const INCOME_STABILITY_OPTIONS: ChoiceOption[] = [
  { value: 'stable-12m', label: 'Stable depuis 12 mois ou plus', icon: BadgeCheck },
  { value: 'stable-6m', label: 'Stable depuis 6 mois', icon: CalendarCheck },
  { value: 'variable', label: 'Variable mais documenté', icon: Gauge },
  { value: 'seasonal', label: 'Saisonnier / par contrat', icon: CalendarClock },
  { value: 'new-income', label: 'Nouveau revenu à consolider', icon: Clock },
  { value: 'to-document', label: 'À documenter', icon: NotebookTabs },
];

const CO_BORROWER_OPTIONS: ChoiceOption[] = [
  { value: 'none', label: 'Aucun co-emprunteur', icon: UserCheck },
  { value: 'spouse', label: 'Conjoint(e)', icon: Users },
  { value: 'family', label: 'Famille', icon: Handshake },
  { value: 'associate', label: 'Associé / partenaire', icon: BriefcaseBusiness },
  { value: 'company', label: 'Société porteuse', icon: Warehouse },
  { value: 'to-confirm', label: 'À confirmer', icon: HelpCircle },
];

const FINANCING_OWNER_OPTIONS: ChoiceOption[] = [
  { value: 'single-client', label: 'Client seul', icon: UserCheck },
  { value: 'couple', label: 'Couple / foyer', icon: Users },
  { value: 'family', label: 'Famille', icon: Handshake },
  { value: 'company', label: 'Entreprise', icon: BriefcaseBusiness },
  { value: 'investor-group', label: 'Groupe d’investisseurs', icon: Building },
];

const BANK_AGREEMENT_STAGE_OPTIONS: ChoiceOption[] = [
  { value: 'not-started', label: 'Pas encore démarré', icon: CircleDot },
  { value: 'simulation', label: 'Simulation reçue', icon: Calculator },
  { value: 'documents-requested', label: 'Pièces demandées', icon: NotebookTabs },
  { value: 'under-review', label: 'Dossier en étude', icon: Clock },
  { value: 'pre-approved', label: 'Préaccord obtenu', icon: BadgeCheck },
  { value: 'funds-available', label: 'Fonds disponibles', icon: Vault },
];

const DOWN_PAYMENT_SOURCE_OPTIONS: ChoiceOption[] = [
  { value: 'savings', label: 'Épargne personnelle', icon: Banknote },
  { value: 'salary-business', label: 'Revenus d’activité', icon: BriefcaseBusiness },
  { value: 'family-support', label: 'Appui familial / associé', icon: Users },
  { value: 'asset-sale', label: 'Vente d’actif', icon: Landmark },
  { value: 'company-cash', label: 'Trésorerie entreprise', icon: Warehouse },
  { value: 'to-confirm', label: 'À confirmer', icon: HelpCircle },
];

const FINANCING_DOCUMENT_OPTIONS: ChoiceOption[] = [
  { value: 'id', label: 'Pièce d’identité', icon: UserCheck },
  { value: 'income-proof', label: 'Justificatifs de revenus', icon: ReceiptText },
  { value: 'bank-statements', label: 'Relevés bancaires', icon: Landmark },
  { value: 'land-document', label: 'Document terrain', icon: LandPlot },
  { value: 'company-documents', label: 'Documents entreprise', icon: BriefcaseBusiness },
  { value: 'quote-or-plans', label: 'Plans / devis / métré', icon: ClipboardList },
  { value: 'none-yet', label: 'Aucun document pour le moment', icon: HelpCircle },
];

const FINANCING_COMMITMENT_OPTIONS: ChoiceOption[] = [
  { value: 'truthful-data', label: 'Je fournis des données sincères', icon: BadgeCheck },
  { value: 'bank-verification', label: 'J’accepte la vérification banque', icon: Landmark },
  { value: 'progress-payment', label: 'Je comprends le paiement par avancement', icon: CalendarClock },
  { value: 'no-hidden-advance', label: 'Je veux éviter les avances non sécurisées', icon: ShieldPlus },
];

const MAISON_SPACES: ChoiceOption[] = [
  { value: 'suite-parentale', label: 'Suite parentale', icon: BedDouble },
  { value: 'terrasse', label: 'Terrasse', icon: Armchair },
  { value: 'garage', label: 'Garage', icon: CircleParking },
  { value: 'cuisine-exterieure', label: 'Cuisine extérieure', icon: CookingPot },
  { value: 'dependance', label: 'Dépendance', icon: DoorOpen },
  { value: 'cloture', label: 'Clôture', icon: Fence },
  { value: 'piscine', label: 'Piscine', icon: Waves },
  { value: 'jardin', label: 'Jardin', icon: Sprout },
];

const RPLUS_OPTIONS: ChoiceOption[] = [
  { value: 'ascenseur', label: 'Ascenseur', icon: Layers },
  { value: 'parking', label: 'Parking', icon: CircleParking },
  { value: 'sous-sol', label: 'Sous-sol', icon: Warehouse },
  { value: 'groupe-electrogene', label: 'Groupe électrogène', icon: BatteryCharging },
  { value: 'surpresseur', label: 'Surpresseur', icon: Gauge },
  { value: 'securite-incendie', label: 'Sécurité incendie', icon: Siren },
  { value: 'loge-gardien', label: 'Loge gardien', icon: DoorOpen },
  { value: 'local-technique', label: 'Local technique', icon: ToolCase },
];

const VRD_LOTS: ChoiceOption[] = [
  { value: 'terrassement', label: 'Terrassement', icon: Pickaxe },
  { value: 'voirie', label: 'Voirie', icon: Route },
  { value: 'caniveaux', label: 'Caniveaux', icon: Waves },
  { value: 'assainissement', label: 'Assainissement', icon: ShowerHead },
  { value: 'eau-potable', label: 'Eau potable', icon: Droplets },
  { value: 'electricite', label: 'Électricité', icon: PlugZap },
  { value: 'telecom', label: 'Télécom', icon: RadioTower },
  { value: 'eclairage-public', label: 'Éclairage public', icon: Lightbulb },
  { value: 'signalisation', label: 'Signalisation', icon: TrafficCone },
];

const LOT_TRAVAUX_OPTIONS: ChoiceOption[] = [
  { value: 'gros-oeuvre', label: 'Gros œuvre', icon: BrickWall },
  { value: 'second-oeuvre', label: 'Second œuvre', icon: Layers },
  { value: 'plomberie', label: 'Plomberie', icon: Bath },
  { value: 'electricite', label: 'Électricité', icon: PlugZap },
  { value: 'carrelage', label: 'Carrelage', icon: PanelTop },
  { value: 'peinture', label: 'Peinture', icon: Paintbrush },
  { value: 'menuiserie', label: 'Menuiserie', icon: Drill },
  { value: 'etancheite', label: 'Étanchéité', icon: Droplets },
  { value: 'toiture', label: 'Charpente / toiture', icon: Home },
  { value: 'climatisation', label: 'Climatisation', icon: AirVent },
  { value: 'finition-complete', label: 'Finition complète', icon: Gem },
];

const HYDRAULIC_WORKS: ChoiceOption[] = [
  { value: 'forage', label: 'Forage', icon: Droplets },
  { value: 'chateau-eau', label: 'Château d’eau', icon: Landmark },
  { value: 'adduction', label: 'Adduction d’eau', icon: Route },
  { value: 'pompage', label: 'Pompage', icon: Gauge },
  { value: 'drainage', label: 'Drainage', icon: Waves },
  { value: 'station-traitement', label: 'Traitement', icon: ShieldCheck },
];

const STUDY_SCOPES: ChoiceOption[] = [
  { value: 'architecture', label: 'Architecture', icon: DraftingCompass },
  { value: 'structure', label: 'Structure béton', icon: Building2 },
  { value: 'metre-devis', label: 'Métré / devis', icon: Ruler },
  { value: 'permis', label: 'Permis de construire', icon: Stamp },
  { value: 'planning', label: 'Planning travaux', icon: Calendar },
  { value: 'controle-chantier', label: 'Contrôle chantier', icon: ClipboardList },
  { value: 'expertise', label: 'Expertise technique', icon: ShieldCheck },
];

const TECHNICAL_INTENT_OPTIONS_BY_FAMILY: Record<ProjectFamily, ChoiceOption[]> = {
  maison: [
    { value: 'footprint-optimized', label: 'Optimiser l’emprise au sol', icon: Ruler, description: 'Construire juste sans saturer le terrain' },
    { value: 'family-comfort', label: 'Confort familial', icon: Home, description: 'Circulation simple, pièces lisibles, usage quotidien' },
    { value: 'future-extension', label: 'Extension future prévue', icon: Layers, description: 'Prévoir une évolution sans casser l’existant' },
    { value: 'natural-ventilation', label: 'Ventilation et lumière naturelle', icon: AirVent, description: 'Orientation, ouvertures et confort thermique' },
    { value: 'outdoor-living', label: 'Vie extérieure / terrasse', icon: Armchair, description: 'Cour, terrasse, jardin ou cuisine extérieure' },
    { value: 'privacy-security', label: 'Intimité et sécurité', icon: ShieldCheck, description: 'Reculs, clôture, accès et zones privées' },
  ],
  rplus: [
    { value: 'rental-yield', label: 'Rentabilité locative', icon: BadgeDollarSign, description: 'Typologies faciles à louer ou vendre' },
    { value: 'structural-regularity', label: 'Structure régulière', icon: Building2, description: 'Trame claire pour maîtriser le gros œuvre' },
    { value: 'vertical-circulation', label: 'Circulation verticale', icon: Route, description: 'Escalier, ascenseur et accès lisibles' },
    { value: 'fire-safety', label: 'Sécurité incendie', icon: Siren, description: 'Issues, désenfumage et contrôle réglementaire' },
    { value: 'technical-shafts', label: 'Gaines techniques', icon: ToolCase, description: 'Réseaux empilés, maintenance facilitée' },
    { value: 'parking-flow', label: 'Flux parking', icon: CircleParking, description: 'Entrées, sorties et stationnement cohérents' },
  ],
  vrd: [
    { value: 'stormwater-control', label: 'Maîtrise eaux pluviales', icon: Waves, description: 'Caniveaux, exutoires, drainage et pentes' },
    { value: 'utility-corridor', label: 'Couloirs réseaux', icon: Network, description: 'Eau, électricité, télécoms et réservations' },
    { value: 'road-access', label: 'Accès et circulation', icon: Route, description: 'Largeurs, girations, raccordements et usage' },
    { value: 'phased-vrd', label: 'VRD par phases', icon: TrafficCone, description: 'Séparer urgence, réseaux et finition de voirie' },
    { value: 'maintenance-ready', label: 'Maintenance prévue', icon: Wrench, description: 'Regards, curage, accès et exploitation future' },
  ],
  lot: [
    { value: 'defect-correction', label: 'Correction malfaçons', icon: ShieldPlus, description: 'Reprise ciblée avant finition ou livraison' },
    { value: 'occupied-site-control', label: 'Travaux en site occupé', icon: DoorOpen, description: 'Phasage propre, sécurité et nuisance réduite' },
    { value: 'material-procurement', label: 'Approvisionnement matériaux', icon: Warehouse, description: 'Choix, disponibilité, quantités et délais' },
    { value: 'finish-quality', label: 'Qualité des finitions', icon: Gem, description: 'Niveau esthétique et contrôle de réception' },
    { value: 'technical-compliance', label: 'Conformité technique', icon: ClipboardCheck, description: 'Plomberie, électricité, étanchéité et essais' },
  ],
  hydraulique: [
    { value: 'water-autonomy', label: 'Autonomie en eau', icon: Droplets, description: 'Forage, stockage et continuité de service' },
    { value: 'daily-capacity', label: 'Capacité journalière', icon: Gauge, description: 'Besoin réel selon usage ou population' },
    { value: 'energy-continuity', label: 'Continuité énergétique', icon: BatteryCharging, description: 'Réseau, solaire, groupe ou solution hybride' },
    { value: 'water-treatment', label: 'Traitement de l’eau', icon: ShieldCheck, description: 'Qualité, filtration et contrôle sanitaire' },
    { value: 'handover-documentation', label: 'Documentation de réception', icon: NotebookTabs, description: 'Essais, fiches techniques et maintenance' },
  ],
  etude: [
    { value: 'permit-ready', label: 'Dossier permis', icon: Stamp, description: 'Pièces administratives et plans cohérents' },
    { value: 'cost-control', label: 'Contrôle du coût', icon: Calculator, description: 'Métrés, DQE et arbitrages budgétaires' },
    { value: 'execution-ready', label: 'Prêt pour exécution', icon: ClipboardList, description: 'Plans, détails et coordination technique' },
    { value: 'site-supervision', label: 'Suivi chantier', icon: Eye, description: 'Contrôles, visites, rapports et réserves' },
  ],
  promotion: [
    { value: 'investor-reporting', label: 'Reporting investisseur', icon: ReceiptText, description: 'Suivi coût, délai, ventes et décisions' },
    { value: 'rental-yield', label: 'Rentabilité locative', icon: BadgeDollarSign, description: 'Produit adapté au marché ciblé' },
    { value: 'phased-vrd', label: 'Phasage programme', icon: Layers, description: 'Études, VRD, lots bâtis et commercialisation' },
    { value: 'parking-flow', label: 'Flux et parking', icon: CircleParking, description: 'Circulation interne et accès visiteurs' },
    { value: 'cost-control', label: 'Contrôle du coût', icon: Calculator, description: 'Budget promoteur, marges et risques' },
  ],
};

const DOCUMENT_OPTIONS: ChoiceOption[] = [
  { value: 'titre-foncier', label: 'Titre foncier / ACD', icon: Stamp },
  { value: 'attestation', label: 'Attestation villageoise', icon: Signature },
  { value: 'plan-topo', label: 'Plan topographique', icon: Ruler },
  { value: 'plan-archi', label: 'Plan architectural', icon: DraftingCompass },
  { value: 'etude-sol', label: 'Étude de sol', icon: Layers },
  { value: 'photos-site', label: 'Photos du site', icon: Eye },
  { value: 'devis-existant', label: 'Devis existant', icon: Banknote },
  { value: 'cctp', label: 'CCTP / descriptif', icon: ClipboardList },
  { value: 'aucun', label: 'Aucun document', icon: HelpCircle },
];

const CUSTOM_CHOICE_PREFIX = 'custom-choice:';

function getProjectFamily(projectType?: string): ProjectFamily {
  if (projectType === 'immeuble-rplus') return 'rplus';
  if (projectType === 'vrd') return 'vrd';
  if (projectType === 'hydraulique') return 'hydraulique';
  if (projectType === 'lot-travaux' || projectType === 'renovation') return 'lot';
  if (projectType === 'etude-suivi') return 'etude';
  if (projectType === 'promotion') return 'promotion';
  return 'maison';
}

function makeCustomChoiceValue(label: string): string {
  return `${CUSTOM_CHOICE_PREFIX}${label.trim()}`;
}

function isCustomChoiceValue(value: string): boolean {
  return value.startsWith(CUSTOM_CHOICE_PREFIX);
}

function getCustomChoiceLabel(value: string): string {
  return isCustomChoiceValue(value) ? value.slice(CUSTOM_CHOICE_PREFIX.length).trim() : value;
}

function getLabel(options: ChoiceOption[] | undefined, value: string): string {
  if (isCustomChoiceValue(value)) return getCustomChoiceLabel(value);
  if (!options) return value;
  return options.find(option => option.value === value)?.label || value;
}

function formatSurface(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value) + ' m²';
}

function optionInitials(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[\s/-]+/)
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '•';
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getBudgetLabel(value: string): string {
  return getLabel(BUDGET_OPTIONS, value);
}

function getBudgetRange(value?: string): [number | null, number | null] {
  const ranges: Record<string, [number | null, number | null]> = {
    'less-10m': [0, 10_000_000],
    '10-30m': [10_000_000, 30_000_000],
    '30-75m': [30_000_000, 75_000_000],
    '75-150m': [75_000_000, 150_000_000],
    '150-300m': [150_000_000, 300_000_000],
    'more-300m': [300_000_000, null],
    unknown: [null, null],
  };
  return value ? ranges[value] || [null, null] : [null, null];
}

function getTimelineLabel(value: string): string {
  return getLabel(TIMELINE_OPTIONS, value);
}

function getTerrainLabel(value: string): string {
  return getLabel(TERRAIN_OPTIONS, value);
}

function generateReference(): string {
  return 'BTP-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
}

function getPrestationsOptions(family: ProjectFamily): ChoiceOption[] {
  if (family === 'vrd') {
    return [
      { value: 'topographie', label: 'Topographie', icon: Ruler },
      { value: 'etude-vrd', label: 'Étude VRD', icon: DraftingCompass },
      { value: 'terrassement', label: 'Terrassement', icon: Hammer },
      { value: 'execution-vrd', label: 'Exécution VRD', icon: Route },
      { value: 'controle-qualite', label: 'Contrôle qualité', icon: ShieldCheck },
      { value: 'recolement', label: 'Plan de récolement', icon: ClipboardList },
    ];
  }
  if (family === 'hydraulique') {
    return [
      { value: 'diagnostic', label: 'Diagnostic', icon: Search },
      { value: 'dimensionnement', label: 'Dimensionnement', icon: Ruler },
      { value: 'execution', label: 'Exécution', icon: Wrench },
      { value: 'essais', label: 'Essais et réception', icon: BadgeCheck },
      { value: 'maintenance', label: 'Maintenance', icon: ClipboardList },
    ];
  }
  if (family === 'etude') {
    return STUDY_SCOPES;
  }
  return [
    { value: 'etude-architecturale', label: 'Étude architecturale', icon: DraftingCompass },
    { value: 'plans-execution', label: 'Plans d’exécution', icon: Ruler },
    { value: 'permis', label: 'Permis de construire', icon: Stamp },
    { value: 'gros-oeuvre', label: 'Gros œuvre', icon: Hammer },
    { value: 'second-oeuvre', label: 'Second œuvre', icon: Layers },
    { value: 'finition', label: 'Finition', icon: Paintbrush },
    { value: 'cle-en-main', label: 'Clé en main', icon: KeyRound },
    { value: 'suivi-chantier', label: 'Suivi de chantier', icon: ClipboardList },
  ];
}

function getTechnicalIntentOptions(family: ProjectFamily): ChoiceOption[] {
  return TECHNICAL_INTENT_OPTIONS_BY_FAMILY[family] || TECHNICAL_INTENT_OPTIONS_BY_FAMILY.maison;
}

function buildSteps(responses: Record<string, unknown>): StepDef[] {
  const projectType = responses.projectType as string | undefined;
  const family = getProjectFamily(projectType);
  const terrainStatus = responses.terrainStatus as string | undefined;
  const clientPresence = responses.clientPresence as string | undefined;
  const selectedCountry = String(responses.country || "Côte d'Ivoire");
  const cityOptions = buildCityOptions(selectedCountry);
  const steps: StepDef[] = [
    {
      id: 'project-type',
      title: 'Catégorie de l’ouvrage',
      subtitle: 'Choisissez le type de projet à cadrer',
      responseKey: 'projectType',
      type: 'choice-single',
      options: PROJECT_TYPES,
      required: true,
      insight: 'Le formulaire s’adapte ensuite à la catégorie sélectionnée.',
    },
  ];

  if (!projectType) return steps;

  steps.push(
    {
      id: 'country',
      title: 'Pays du projet',
      subtitle: 'Choisissez le pays avant la ville',
      responseKey: 'country',
      type: 'choice-single',
      options: COUNTRY_OPTIONS,
      required: true,
      requiredMessage: 'Choisissez le pays du projet avant de continuer.',
      insight: 'Buildify garde la Côte d’Ivoire comme base, mais le dossier peut être cadré pour plusieurs pays.',
    },
    {
      id: 'city',
      title: 'Ville du projet',
      subtitle: `${cityOptions.length - 1} ville(s) et localité(s) disponibles. Vous pouvez aussi saisir une localité absente.`,
      responseKey: 'city',
      type: 'select',
      options: cityOptions,
      required: true,
    },
    {
      id: 'site-location',
      title: 'Localisation précise',
      subtitle: 'Ajoutez les repères utiles pour situer le chantier',
      responseKey: '__site_location__',
      type: 'field-group',
      fields: [
        { key: 'district', label: 'Commune / quartier / village', type: 'text', placeholder: 'Ex : Cocody Riviera 3, Angré, quartier résidentiel', required: true },
        { key: 'landmark', label: 'Repère proche', type: 'text', placeholder: 'Ex : près du carrefour, école, voie principale' },
        { key: 'siteAccess', label: 'Accès au site', type: 'select', options: SITE_ACCESS_OPTIONS, required: true },
      ],
      required: true,
    }
  );

  steps.push({
    id: 'client-presence',
    title: 'Client sur place ou à distance',
    subtitle: 'Précisez qui peut décider, visiter et valider les étapes',
    responseKey: 'clientPresence',
    type: 'choice-single',
    options: CLIENT_PRESENCE_OPTIONS,
    required: true,
    requiredMessage: 'Indiquez si le projet sera suivi sur place, à distance ou par un mandataire.',
    insight: 'Ce cadrage est essentiel pour les clients hors du pays : il évite les blocages sur les visites, documents, paiements et validations.',
  });

  if (clientPresence && clientPresence !== 'local') {
    steps.push({
      id: 'remote-coordination',
      title: 'Coordination internationale',
      subtitle: 'Organisez les échanges, validations et visites terrain à distance',
      responseKey: '__remote_coordination__',
      type: 'field-group',
      fields: [
        { key: 'clientResidenceCountry', label: 'Pays de résidence du client', type: 'select', options: COUNTRY_OPTIONS, required: true },
        { key: 'clientTimeZone', label: 'Fuseau horaire', type: 'select', options: TIME_ZONE_OPTIONS, required: true },
        { key: 'clientPreferredContactChannel', label: 'Canal de contact préféré', type: 'select', options: CONTACT_CHANNEL_OPTIONS, required: true },
        { key: 'clientContactWindow', label: 'Créneau d’appel souhaité', type: 'select', options: CONTACT_WINDOW_OPTIONS, required: true },
        { key: 'remoteDecisionMode', label: 'Mode de validation', type: 'select', options: REMOTE_DECISION_OPTIONS, required: true },
        { key: 'representativeName', label: 'Nom du mandataire local', type: 'text', placeholder: 'Ex : frère, sœur, associé, représentant' },
        { key: 'representativePhone', label: 'Téléphone du mandataire', type: 'text', placeholder: '+225 07 00 00 00 00' },
        { key: 'representativeRelation', label: 'Lien avec le mandataire', type: 'select', options: REPRESENTATIVE_RELATION_OPTIONS },
      ],
      required: true,
      requiredMessage: 'Complétez les informations de coordination à distance avant de continuer.',
    });
  }

  steps.push({
    id: 'technical-intent',
    title: 'Priorités techniques',
    subtitle: 'Sélectionnez les objectifs qui guideront le cadrage du dossier',
    responseKey: 'technicalIntent',
    type: 'choice-multi',
    options: getTechnicalIntentOptions(family),
    required: true,
    minSelections: 1,
    requiredMessage: 'Choisissez au moins une priorité technique pour orienter le projet.',
    insight: 'Cette étape transforme le formulaire en brief métier : elle aide Buildify à proposer les bons lots, les bons documents et la bonne lecture budget.',
  });

  if (family === 'maison' || family === 'rplus' || family === 'promotion') {
    steps.push({
      id: 'terrain',
      title: 'Situation du terrain',
      subtitle: 'Précisez le statut foncier et opérationnel',
      responseKey: 'terrainStatus',
      type: 'choice-single',
      options: TERRAIN_OPTIONS,
      required: true,
      requiredMessage: 'Indiquez si le terrain est disponible, en acquisition ou encore à rechercher.',
    });

    if (terrainStatus === 'owned' || terrainStatus === 'acquiring') {
      steps.push({
        id: 'surface',
        title: 'Superficie du terrain',
        subtitle: 'Indiquez la surface approximative',
        responseKey: 'surfaceArea',
        type: 'slider',
        min: 100,
        max: family === 'promotion' ? 20000 : 5000,
        step: 50,
        unit: 'm²',
        required: true,
        requiredMessage: 'Saisissez ou ajustez la superficie du terrain avant de continuer.',
      });
    }

    if (terrainStatus === 'searching' && selectedCountry === "Côte d'Ivoire" && isAbidjanAreaSelection(responses.city)) {
      steps.push({
        id: 'zones',
        title: 'Zones recherchées',
        subtitle: 'Sélectionnez les communes souhaitées',
        responseKey: 'zones',
        type: 'choice-multi',
        options: COMMUNES_ABIDJAN.map(commune => ({ value: commune, label: commune })),
        skippable: true,
        skipLabel: 'À définir plus tard',
      });
    }

    steps.push({
      id: 'terrain-details',
      title: 'Contraintes du terrain',
      subtitle: 'Ces éléments orientent les études et le chiffrage',
      responseKey: '__terrain_details__',
      type: 'field-group',
      fields: [
        { key: 'topography', label: 'Topographie', type: 'select', options: TOPOGRAPHY_OPTIONS, required: true },
        { key: 'existingUtilities', label: 'Réseaux disponibles', type: 'select', options: [
          { value: 'eau-electricite', label: 'Eau et électricité' },
          { value: 'electricite-seule', label: 'Électricité seule' },
          { value: 'eau-seule', label: 'Eau seule' },
          { value: 'aucun', label: 'Aucun réseau' },
          { value: 'inconnu', label: 'À vérifier' },
        ], required: true },
        { key: 'soilKnown', label: 'Étude de sol', type: 'select', options: [
          { value: 'faite', label: 'Déjà faite' },
          { value: 'a-faire', label: 'À faire' },
          { value: 'inconnue', label: 'Je ne sais pas' },
        ], required: true },
      ],
      required: true,
      requiredMessage: 'Renseignez les contraintes minimales du terrain pour fiabiliser l’étude.',
    });
  }

  if (family === 'maison') {
    steps.push(
      {
        id: 'maison-surfaces',
        title: projectType === 'duplex-triplex' ? 'Emprise et surfaces par niveau' : 'Emprise de la maison',
        subtitle: 'Saisissez les surfaces clés pour éviter les ambiguïtés de chiffrage',
        responseKey: '__maison_surfaces__',
        type: 'field-group',
        fields: [
          {
            key: 'builtSurface',
            label: projectType === 'duplex-triplex' ? 'Surface construite totale' : 'Surface construite souhaitée',
            type: 'number',
            placeholder: projectType === 'duplex-triplex' ? 'Ex : 360' : 'Ex : 150',
            unit: 'm²',
            min: 1,
            required: true,
            helper: 'Surface totale à construire ou à aménager, tous espaces principaux inclus.',
          },
          {
            key: 'houseFootprint',
            label: 'Emprise au sol souhaitée',
            type: 'number',
            placeholder: projectType === 'duplex-triplex' ? 'Ex : 160' : 'Ex : 120',
            unit: 'm²',
            min: 1,
            required: true,
            helper: 'Surface réellement occupée au sol par la maison, hors cour, jardin ou terrasse ouverte.',
          },
          {
            key: 'usableOutdoorArea',
            label: 'Extérieur à préserver',
            type: 'number',
            placeholder: 'Ex : 80',
            unit: 'm²',
            min: 0,
            helper: 'Cour, terrasse, jardin, parking ou zone libre que vous souhaitez garder.',
          },
          {
            key: 'futureExtensionPlan',
            label: 'Extension future',
            type: 'select',
            options: [
              { value: 'none', label: 'Aucune extension prévue' },
              { value: 'horizontal', label: 'Extension horizontale possible' },
              { value: 'vertical', label: 'Étage futur possible' },
              { value: 'rental-unit', label: 'Dépendance ou logement locatif futur' },
              { value: 'to-study', label: 'À étudier avec Buildify' },
            ],
          },
        ],
        required: true,
        requiredMessage: 'Saisissez la surface construite et l’emprise au sol souhaitée avant de continuer.',
      },
      {
        id: 'bedrooms',
        title: 'Nombre de chambres',
        subtitle: 'Indiquez le programme principal',
        responseKey: 'bedrooms',
        type: 'counter',
        min: 1,
        max: 12,
        unit: 'chambre(s)',
        required: true,
      },
      {
        id: 'maison-spaces',
        title: 'Espaces souhaités',
        subtitle: 'Ajoutez les éléments importants du projet',
        responseKey: 'maisonSpaces',
        type: 'choice-multi',
        options: MAISON_SPACES,
        skippable: true,
        skipLabel: 'Aucun pour l’instant',
      }
    );
  }

  if (family === 'rplus') {
    steps.push(
      {
        id: 'rplus-level',
        title: 'Hauteur de l’immeuble',
        subtitle: 'Choisissez simplement le niveau R+ souhaité',
        responseKey: 'rPlusLevel',
        type: 'counter',
        min: 1,
        max: 20,
        unit: 'R+',
        required: true,
      },
      {
        id: 'rplus-use',
        title: 'Usage de l’immeuble',
        subtitle: 'Précisez la vocation principale',
        responseKey: 'buildingUse',
        type: 'choice-single',
        options: BUILDING_USE_OPTIONS,
        required: true,
        requiredMessage: 'Précisez l’usage principal de l’immeuble R+.',
      },
      {
        id: 'rplus-program',
        title: 'Programme R+',
        subtitle: 'Renseignez les volumes clés',
        responseKey: '__rplus_program__',
        type: 'field-group',
        fields: [
          { key: 'unitsPerFloor', label: 'Logements / locaux par étage', type: 'number', placeholder: 'Ex : 2', min: 1, unit: 'unité(s)', required: true },
          { key: 'groundFloorUse', label: 'Rez-de-chaussée', type: 'select', options: [
            { value: 'parking', label: 'Parking' },
            { value: 'commerce', label: 'Commerces' },
            { value: 'logements', label: 'Logements' },
            { value: 'mixte', label: 'Mixte' },
            { value: 'a-definir', label: 'À définir' },
          ], required: true },
          { key: 'estimatedFootprint', label: 'Emprise au sol estimée', type: 'number', placeholder: 'Ex : 450', unit: 'm²', min: 1, required: true },
        ],
        required: true,
        requiredMessage: 'Renseignez le programme minimum de l’immeuble R+.',
      },
      {
        id: 'rplus-options',
        title: 'Équipements techniques',
        subtitle: 'Sélectionnez les éléments prévus',
        responseKey: 'rplusOptions',
        type: 'choice-multi',
        options: RPLUS_OPTIONS,
        skippable: true,
        skipLabel: 'À définir',
      }
    );
  }

  if (family === 'vrd') {
    steps.push(
      {
        id: 'vrd-lots',
        title: 'Lots VRD concernés',
        subtitle: 'Sélectionnez les travaux à chiffrer',
        responseKey: 'vrdLots',
        type: 'choice-multi',
        options: VRD_LOTS,
        required: true,
      },
      {
        id: 'vrd-dimensions',
        title: 'Dimensions principales',
        subtitle: 'Donnez les ordres de grandeur du site',
        responseKey: '__vrd_dimensions__',
        type: 'field-group',
        fields: [
          { key: 'roadLength', label: 'Linéaire estimé', type: 'number', placeholder: 'Ex : 750', unit: 'm', min: 1, required: true },
          { key: 'roadWidth', label: 'Largeur moyenne', type: 'number', placeholder: 'Ex : 7', unit: 'm', min: 1, required: true },
          { key: 'plotCount', label: 'Nombre de lots desservis', type: 'number', placeholder: 'Ex : 45', unit: 'lot(s)', min: 0 },
          { key: 'outfallPoint', label: 'Exutoire / raccordement', type: 'text', placeholder: 'Ex : caniveau existant, bassin, réseau public', required: true },
        ],
        required: true,
        requiredMessage: 'Renseignez les dimensions VRD minimales avant de continuer.',
      },
      {
        id: 'vrd-context',
        title: 'État de l’emprise',
        subtitle: 'Précisez le contexte de réalisation',
        responseKey: 'vrdContext',
        type: 'choice-single',
        options: [
          { value: 'terrain-nu', label: 'Terrain nu', icon: MapPin, description: 'Aucune voie réalisée' },
          { value: 'voie-existante', label: 'Voie existante', icon: Route, description: 'Reprise ou renforcement' },
          { value: 'lotissement', label: 'Lotissement', icon: ListChecks, description: 'Voiries et réseaux à créer' },
          { value: 'site-occupe', label: 'Site occupé', icon: Building, description: 'Travaux sous contraintes' },
        ],
        required: true,
        requiredMessage: 'Indiquez l’état de l’emprise VRD.',
      }
    );
  }

  if (family === 'hydraulique') {
    steps.push(
      {
        id: 'hydraulic-works',
        title: 'Travaux hydrauliques',
        subtitle: 'Sélectionnez les ouvrages concernés',
        responseKey: 'hydraulicWorks',
        type: 'choice-multi',
        options: HYDRAULIC_WORKS,
        required: true,
      },
      {
        id: 'hydraulic-data',
        title: 'Données de besoin',
        subtitle: 'Indiquez les informations disponibles',
        responseKey: '__hydraulic_data__',
        type: 'field-group',
        fields: [
          { key: 'beneficiaries', label: 'Bénéficiaires estimés', type: 'number', placeholder: 'Ex : 250', unit: 'pers.', min: 1, required: true },
          { key: 'dailyNeed', label: 'Besoin journalier', type: 'number', placeholder: 'Ex : 15', unit: 'm³/j', min: 1, required: true },
          { key: 'waterSource', label: 'Source actuelle', type: 'text', placeholder: 'Ex : puits, SODECI, forage existant', required: true },
          { key: 'energySource', label: 'Énergie disponible', type: 'select', options: [
            { value: 'reseau', label: 'Réseau électrique' },
            { value: 'solaire', label: 'Solaire' },
            { value: 'groupe', label: 'Groupe électrogène' },
            { value: 'aucune', label: 'Aucune' },
            { value: 'inconnue', label: 'À vérifier' },
          ], required: true },
        ],
        required: true,
        requiredMessage: 'Renseignez les données hydrauliques minimales.',
      }
    );
  }

  if (family === 'lot') {
    steps.push(
      {
        id: 'work-lots',
        title: 'Lots concernés',
        subtitle: 'Choisissez les travaux à proposer',
        responseKey: 'workLots',
        type: 'choice-multi',
        options: LOT_TRAVAUX_OPTIONS,
        required: true,
      },
      {
        id: 'lot-context',
        title: 'Contexte des travaux',
        subtitle: 'Précisez l’état du bâtiment et la zone touchée',
        responseKey: '__lot_context__',
        type: 'field-group',
        fields: [
          { key: 'interventionStage', label: 'Étape actuelle', type: 'select', options: [
            { value: 'neuf', label: 'Construction neuve' },
            { value: 'gros-oeuvre-termine', label: 'Gros œuvre terminé' },
            { value: 'second-oeuvre', label: 'Second œuvre en cours' },
            { value: 'renovation', label: 'Rénovation' },
            { value: 'reprise', label: 'Reprise après malfaçon' },
          ], required: true },
          { key: 'affectedArea', label: 'Surface concernée', type: 'number', placeholder: 'Ex : 120', unit: 'm²', min: 1, required: true },
          { key: 'occupiedSite', label: 'Site occupé ?', type: 'select', options: [
            { value: 'oui', label: 'Oui' },
            { value: 'non', label: 'Non' },
            { value: 'partiellement', label: 'Partiellement' },
          ], required: true },
          { key: 'qualityTarget', label: 'Objectif qualité', type: 'text', placeholder: 'Ex : finition premium, reprise complète plomberie' },
        ],
        required: true,
      }
    );
  }

  if (family === 'etude') {
    steps.push(
      {
        id: 'study-scope',
        title: 'Mission souhaitée',
        subtitle: 'Sélectionnez les prestations d’étude ou de suivi',
        responseKey: 'studyScope',
        type: 'choice-multi',
        options: STUDY_SCOPES,
        required: true,
      },
      {
        id: 'study-data',
        title: 'Base de travail',
        subtitle: 'Dites ce que vous avez déjà',
        responseKey: '__study_data__',
        type: 'field-group',
        fields: [
          { key: 'availableBrief', label: 'Programme déjà rédigé ?', type: 'select', options: [
            { value: 'oui', label: 'Oui' },
            { value: 'partiel', label: 'Partiel' },
            { value: 'non', label: 'Non' },
          ] },
          { key: 'expectedDeliverable', label: 'Livrable attendu', type: 'text', placeholder: 'Ex : plans APS/APD, DQE, planning, rapport' },
          { key: 'reviewDeadline', label: 'Délai souhaité', type: 'text', placeholder: 'Ex : 10 jours, 3 semaines' },
        ],
        skippable: true,
        skipLabel: 'À définir',
      }
    );
  }

  if (family === 'promotion') {
    steps.push(
      {
        id: 'promotion-data',
        title: 'Programme immobilier',
        subtitle: 'Renseignez les volumes attendus',
        responseKey: '__promotion_data__',
        type: 'field-group',
        fields: [
          { key: 'unitCount', label: 'Nombre d’unités', type: 'number', placeholder: 'Ex : 24', unit: 'unité(s)' },
          { key: 'targetTypology', label: 'Typologies visées', type: 'text', placeholder: 'Ex : studios, 3 pièces, villas basses' },
          { key: 'salesTarget', label: 'Objectif', type: 'select', options: [
            { value: 'vente', label: 'Vente' },
            { value: 'location', label: 'Location' },
            { value: 'mixte', label: 'Mixte' },
          ] },
        ],
        skippable: true,
        skipLabel: 'À cadrer',
      },
      {
        id: 'promotion-amenities',
        title: 'Aménagements communs',
        subtitle: 'Sélectionnez les équipements envisagés',
        responseKey: 'promotionAmenities',
        type: 'choice-multi',
        options: [
          { value: 'voirie-interne', label: 'Voirie interne', icon: Route },
          { value: 'espaces-verts', label: 'Espaces verts', icon: Sprout },
          { value: 'parking', label: 'Parking', icon: CircleParking },
          { value: 'aire-jeux', label: 'Aire de jeux', icon: Armchair },
          { value: 'gardiennage', label: 'Gardiennage', icon: ShieldCheck },
          { value: 'local-technique', label: 'Local technique', icon: ToolCase },
        ],
        skippable: true,
        skipLabel: 'Aucun pour l’instant',
      }
    );
  }

  if (family !== 'vrd' && family !== 'hydraulique' && family !== 'etude') {
    steps.push({
      id: 'finition',
      title: 'Niveau de finition',
      subtitle: 'Choisissez le niveau attendu',
      responseKey: 'finition',
      type: 'choice-single',
      options: FINITION_OPTIONS,
      skippable: true,
      skipLabel: 'À définir',
    });
  }

  steps.push(
    {
      id: 'prestations',
      title: 'Prestations attendues',
      subtitle: 'Choisissez ce que vous voulez confier',
      responseKey: 'prestations',
      type: 'choice-multi',
      options: getPrestationsOptions(family),
      required: true,
      minSelections: 1,
      requiredMessage: 'Choisissez au moins une prestation attendue.',
    },
    {
      id: 'documents',
      title: 'Documents disponibles',
      subtitle: 'Cochez les pièces déjà en votre possession',
      responseKey: 'documents',
      type: 'choice-multi',
      options: DOCUMENT_OPTIONS,
      skippable: true,
      skipLabel: 'Aucun document',
    },
    {
      id: 'budget',
      title: 'Budget indicatif',
      subtitle: 'Indiquez l’enveloppe prévue',
      responseKey: 'budget',
      type: 'choice-single',
      options: BUDGET_OPTIONS,
      required: true,
      requiredMessage: 'Choisissez une enveloppe, même “À estimer”, pour cadrer le financement.',
    },
    {
      id: 'financing',
      title: 'Financement du projet',
      subtitle: 'Choisissez le montage qui correspond à votre situation actuelle',
      responseKey: 'financingMode',
      type: 'choice-single',
      options: FINANCING_OPTIONS,
      required: true,
      requiredMessage: 'Choisissez un mode de financement pour clarifier l’engagement.',
      insight: 'Cette étape ne valide pas un crédit : elle sert à comprendre votre capacité, les fonds disponibles et la façon de payer sans avance non sécurisée.',
    },
    {
      id: 'financing-purpose',
      title: 'Objet du financement',
      subtitle: 'Précisez ce que l’argent doit réellement couvrir',
      responseKey: 'financingPurpose',
      type: 'choice-single',
      options: FINANCING_PURPOSE_OPTIONS,
      required: true,
      requiredMessage: 'Indiquez l’objet précis du financement.',
    },
    {
      id: 'financial-identity',
      title: 'Profil financier',
      subtitle: 'Structurez le dossier comme pour une analyse banque',
      responseKey: '__financial_identity__',
      type: 'field-group',
      fields: [
        { key: 'employmentStatus', label: 'Situation économique', type: 'select', options: EMPLOYMENT_STATUS_OPTIONS, required: true },
        { key: 'financialSector', label: 'Domaine / secteur financier', type: 'select', options: FINANCIAL_SECTOR_OPTIONS, required: true },
        { key: 'contractType', label: 'Type de contrat ou statut', type: 'select', options: CONTRACT_TYPE_OPTIONS, required: true },
        { key: 'employerName', label: 'Employeur / activité principale', type: 'text', placeholder: 'Ex : Ministère, société, commerce, activité diaspora', required: true },
        { key: 'salaryDomiciliationBank', label: 'Banque de domiciliation', type: 'text', placeholder: 'Banque où arrivent les revenus ou épargne principale' },
        { key: 'incomeCurrency', label: 'Devise principale des revenus', type: 'select', options: INCOME_CURRENCY_OPTIONS, required: true },
        { key: 'incomeStability', label: 'Stabilité des revenus', type: 'select', options: INCOME_STABILITY_OPTIONS, required: true },
        { key: 'financingOwner', label: 'Porteur du financement', type: 'select', options: FINANCING_OWNER_OPTIONS, required: true },
        { key: 'coBorrowerStatus', label: 'Co-emprunteur / garant', type: 'select', options: CO_BORROWER_OPTIONS, required: true },
        { key: 'householdDependents', label: 'Personnes à charge', type: 'number', placeholder: 'Ex : 3', min: 0, unit: 'personne(s)' },
      ],
      required: true,
      requiredMessage: 'Complétez le profil financier avant de passer aux montants.',
      insight: 'Situation, secteur, contrat, employeur, devise, stabilité, porteur, garant et capacité réelle avant engagement.',
    },
    {
      id: 'financing-profile',
      title: 'Capacité financière',
      subtitle: 'Renseignez les montants clés pour mesurer une mensualité réaliste',
      responseKey: '__financing_profile__',
      type: 'field-group',
      fields: [
        { key: 'baseSalary', label: 'Salaire de base / revenu fixe', type: 'number', placeholder: 'Ex : 1200000', unit: 'F CFA', min: 0, required: true, helper: 'Montant fixe réellement disponible avant primes, loyers, transferts ou revenus variables.' },
        { key: 'variableMonthlyIncome', label: 'Primes / revenus variables', type: 'number', placeholder: 'Ex : 200000', unit: 'F CFA', min: 0, helper: 'Moyenne mensuelle prudente : primes régulières, commissions, missions ou activité complémentaire.' },
        { key: 'otherMonthlyIncome', label: 'Autres revenus mensuels', type: 'number', placeholder: 'Ex : 100000', unit: 'F CFA', min: 0, helper: 'Loyers, transferts familiaux stables, dividendes ou autre revenu documentable.' },
        { key: 'monthlyIncome', label: 'Revenu net retenu', type: 'number', placeholder: 'Ex : 1500000', unit: 'F CFA', min: 0, required: true, helper: 'Montant total que vous acceptez de retenir pour l’analyse. Il doit rester prudent et justifiable.' },
        { key: 'existingMonthlyDebt', label: 'Charges ou crédits mensuels', type: 'number', placeholder: 'Ex : 250000', unit: 'F CFA', min: 0, required: true, helper: 'Indiquez 0 si vous n’avez pas de crédit ou charge fixe importante.' },
        { key: 'monthlyPaymentCapacity', label: 'Mensualité acceptable', type: 'number', placeholder: 'Ex : 450000', unit: 'F CFA', min: 0, required: true, helper: 'Montant maximum que vous pensez pouvoir payer sans mettre votre foyer ou activité sous tension.' },
        { key: 'ownContribution', label: 'Apport disponible immédiatement', type: 'number', placeholder: 'Ex : 5000000', unit: 'F CFA', min: 0, required: true },
        { key: 'availableSavings', label: 'Épargne de sécurité restante', type: 'number', placeholder: 'Ex : 1000000', unit: 'F CFA', min: 0, helper: 'Montant que vous souhaitez garder après apport pour les imprévus.' },
        { key: 'requestedLoanAmount', label: 'Montant à financer', type: 'number', placeholder: 'Ex : 35000000', unit: 'F CFA', min: 0, required: true },
        { key: 'desiredLoanDurationYears', label: 'Durée souhaitée', type: 'number', placeholder: 'Ex : 10', unit: 'an(s)', min: 1, max: 30, required: true },
      ],
      required: true,
      requiredMessage: 'Complétez les montants financiers de base avant de continuer.',
      insight: 'Ces informations permettent d’estimer le taux d’endettement et de préparer un échange sérieux avec une banque ou un notaire.',
    },
    {
      id: 'financing-bank',
      title: 'Banque et origine de l’apport',
      subtitle: 'Expliquez où en est le dossier financier',
      responseKey: '__financing_bank__',
      type: 'field-group',
      fields: [
        { key: 'bankAgreementStage', label: 'Niveau d’accord banque', type: 'select', options: BANK_AGREEMENT_STAGE_OPTIONS, required: true },
        { key: 'bankName', label: 'Banque ou institution envisagée', type: 'text', placeholder: 'Ex : BNI, SGCI, NSIA, aucune pour le moment' },
        { key: 'bankContact', label: 'Contact banque', type: 'text', placeholder: 'Nom, agence, téléphone ou e-mail si disponible' },
        { key: 'downPaymentSource', label: 'Origine de l’apport', type: 'select', options: DOWN_PAYMENT_SOURCE_OPTIONS, required: true },
        { key: 'financingNotes', label: 'Précision financière utile', type: 'textarea', placeholder: 'Ex : préaccord oral, apport détenu sur compte, financement familial, dossier employeur, besoin d’accompagnement banque...' },
      ],
      required: true,
      requiredMessage: 'Indiquez le niveau banque et l’origine de l’apport.',
    },
    {
      id: 'payment-security',
      title: 'Sécurisation des paiements',
      subtitle: 'Choisissez les garanties souhaitées avant tout décaissement',
      responseKey: 'paymentSecurity',
      type: 'choice-multi',
      options: PAYMENT_SECURITY_OPTIONS,
      required: true,
      minSelections: 1,
      requiredMessage: 'Sélectionnez au moins une règle de sécurisation des paiements.',
      insight: 'Le principe recommandé : aucun paiement important sans étape contrôlée, preuve d’avancement et cadre contractuel clair.',
    },
    {
      id: 'financing-documents',
      title: 'Pièces financières disponibles',
      subtitle: 'Cochez les pièces que vous pouvez fournir ou dites si rien n’est prêt',
      responseKey: 'documentReadiness',
      type: 'choice-multi',
      options: FINANCING_DOCUMENT_OPTIONS,
      required: true,
      minSelections: 1,
      requiredMessage: 'Indiquez au moins l’état des pièces financières disponibles.',
    },
    {
      id: 'financing-commitments',
      title: 'Engagements de compréhension',
      subtitle: 'Validez les points clés avant transmission du dossier',
      responseKey: 'commitments',
      type: 'choice-multi',
      options: FINANCING_COMMITMENT_OPTIONS,
      required: true,
      minSelections: FINANCING_COMMITMENT_OPTIONS.length,
      requiredMessage: 'Validez tous les engagements pour confirmer que le financement est bien compris.',
    },
    {
      id: 'timeline',
      title: 'Démarrage souhaité',
      subtitle: 'Quand souhaitez-vous lancer les travaux ?',
      responseKey: 'timeline',
      type: 'choice-single',
      options: TIMELINE_OPTIONS,
      required: true,
      requiredMessage: 'Choisissez un délai de démarrage, même approximatif.',
    },
    {
      id: 'description',
      title: 'Précision libre',
      subtitle: 'Ajoutez contraintes, priorités, attentes ou détails techniques',
      responseKey: 'description',
      type: 'textarea',
      placeholder: 'Ex : terrain accessible par voie secondaire, besoin de gros œuvre + plomberie, préférence pour une finition premium, délai serré...',
      skippable: true,
      skipLabel: 'Passer',
    },
    {
      id: 'summary',
      title: 'Récapitulatif',
      subtitle: 'Vérifiez les informations avant soumission',
      responseKey: '__summary__',
      type: 'summary',
    },
    {
      id: 'confirmation',
      title: 'Projet soumis',
      responseKey: '__confirmation__',
      type: 'confirmation',
    }
  );

  return steps;
}

function fieldValueToString(field: FieldDef, value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  const raw = String(value);
  if (field.type === 'select') return getLabel(field.options, raw);
  return field.unit ? `${raw} ${field.unit}` : raw;
}

function stepValueToString(step: StepDef, value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  if (step.type === 'choice-single' || step.type === 'select') return getLabel(step.options, String(value));
  if (step.type === 'choice-multi') {
    const selected = Array.isArray(value) ? value : [];
    return selected.map(item => getLabel(step.options, String(item))).join(', ');
  }
  if (step.type === 'counter') {
    if (step.responseKey === 'rPlusLevel') return `R+${value}`;
    return step.unit ? `${value} ${step.unit}` : String(value);
  }
  if (step.type === 'slider') return formatSurface(Number(value));
  if (step.type === 'textarea') {
    const text = String(value).trim();
    return text.length > 120 ? `${text.slice(0, 120)}...` : text;
  }
  return String(value);
}

function getSubmittedCity(responses: Record<string, unknown>): string | undefined {
  const city = String(responses.city || '').trim();
  if (!city) return undefined;
  if (city === 'Autre ville') {
    return String(responses.otherCity || '').trim() || city;
  }
  if (isCustomChoiceValue(city)) return getCustomChoiceLabel(city);
  return city;
}

function getSubmittedCountry(responses: Record<string, unknown>): string {
  const country = String(responses.country || '').trim();
  if (!country) return "Côte d'Ivoire";
  if (country === 'Autre pays') {
    return String(responses.otherCountry || '').trim() || country;
  }
  if (isCustomChoiceValue(country)) return getCustomChoiceLabel(country);
  return country;
}

function buildAutoDescription(responses: Record<string, unknown>): string {
  const type = getLabel(PROJECT_TYPES, String(responses.projectType || 'autre'));
  const country = getSubmittedCountry(responses);
  const cityName = getSubmittedCity(responses);
  const city = cityName ? ` à ${cityName}, ${country}` : ` en ${country}`;
  const family = getProjectFamily(String(responses.projectType || 'autre'));
  const lots = [
    ...(Array.isArray(responses.technicalIntent) ? responses.technicalIntent : []),
    ...(Array.isArray(responses.workLots) ? responses.workLots : []),
    ...(Array.isArray(responses.vrdLots) ? responses.vrdLots : []),
    ...(Array.isArray(responses.hydraulicWorks) ? responses.hydraulicWorks : []),
    ...(Array.isArray(responses.studyScope) ? responses.studyScope : []),
    ...(Array.isArray(responses.prestations) ? responses.prestations : []),
  ];
  const labelOptions = [
    ...getTechnicalIntentOptions(family),
    ...LOT_TRAVAUX_OPTIONS,
    ...VRD_LOTS,
    ...HYDRAULIC_WORKS,
    ...STUDY_SCOPES,
    ...getPrestationsOptions(family),
  ];
  const lotText = lots.length ? ` - périmètre: ${lots.map(item => getLabel(labelOptions, String(item))).join(', ')}` : '';
  return `${type}${city}${lotText}`;
}

function numberResponse(value: unknown, allowZero = false): number | undefined {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return allowZero ? (parsed >= 0 ? parsed : undefined) : (parsed > 0 ? parsed : undefined);
}

function arrayResponse(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function stringResponse(responses: Record<string, unknown>, key: string): string | undefined {
  const value = responses[key];
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  if (!text) return undefined;
  return isCustomChoiceValue(text) ? getCustomChoiceLabel(text) : text;
}

function percentRatio(numerator?: number, denominator?: number): number | undefined {
  if (!denominator || denominator <= 0 || numerator === undefined) return undefined;
  return Math.round((numerator / denominator) * 100);
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function bankStageScore(stage?: string): number {
  const scores: Record<string, number> = {
    'not-started': 0,
    simulation: 8,
    'documents-requested': 12,
    'under-review': 16,
    'pre-approved': 24,
    'funds-available': 30,
  };
  return stage ? scores[stage] ?? 0 : 0;
}

function stabilityScore(stability?: string): number {
  const scores: Record<string, number> = {
    'stable-12m': 15,
    'stable-6m': 12,
    variable: 9,
    seasonal: 6,
    'new-income': 4,
    'to-document': 2,
  };
  return stability ? scores[stability] ?? 0 : 0;
}

function debtRatioScore(projectedDebtRatioPercent?: number): number {
  if (projectedDebtRatioPercent === undefined) return 6;
  if (projectedDebtRatioPercent <= 33) return 20;
  if (projectedDebtRatioPercent <= 40) return 16;
  if (projectedDebtRatioPercent <= 45) return 11;
  if (projectedDebtRatioPercent <= 55) return 5;
  return 0;
}

function equityScore(equityRatioPercent?: number): number {
  if (equityRatioPercent === undefined) return 4;
  if (equityRatioPercent >= 30) return 15;
  if (equityRatioPercent >= 20) return 12;
  if (equityRatioPercent >= 10) return 8;
  if (equityRatioPercent > 0) return 4;
  return 0;
}

function documentScore(documentReadiness: string[]): number {
  if (documentReadiness.includes('none-yet')) return 0;
  const coreDocs = ['id', 'income-proof', 'bank-statements', 'quote-or-plans'];
  return Math.min(12, coreDocs.filter(doc => documentReadiness.includes(doc)).length * 3);
}

function securityScore(paymentSecurity: string[], commitments: string[]): number {
  const secured = ['notary-contract', 'bank-disbursement', 'escrow', 'milestone-payment']
    .filter(item => paymentSecurity.includes(item)).length;
  const commitmentRatio = FINANCING_COMMITMENT_OPTIONS.length
    ? commitments.length / FINANCING_COMMITMENT_OPTIONS.length
    : 0;
  return Math.min(18, secured * 3 + Math.round(commitmentRatio * 6));
}

function financialRiskLevel(score: number, projectedDebtRatioPercent?: number): ProjectFinancingData['financialRiskLevel'] {
  if (projectedDebtRatioPercent !== undefined && projectedDebtRatioPercent > 55) return 'high';
  if (score >= 75) return 'low';
  if (score >= 50) return 'moderate';
  return 'high';
}

function buildPaymentMilestones(estimatedBudget?: number): ProjectPaymentMilestoneData[] {
  const phases = [
    { id: 'foundation', label: 'Fondations validées', trigger: 'Paiement après contrôle des fondations et photos chantier.', percent: 10 },
    { id: 'structure', label: 'Élévation / structure', trigger: 'Paiement après élévation conforme au planning d’exécution.', percent: 20 },
    { id: 'roofing', label: 'Toiture / clos couvert', trigger: 'Paiement après couverture, menuiseries ou étape équivalente.', percent: 15 },
    { id: 'secondary', label: 'Second œuvre', trigger: 'Paiement après réseaux, plomberie, électricité et cloisons principales.', percent: 25 },
    { id: 'finishes', label: 'Finitions', trigger: 'Paiement après validation des finitions, équipements et réserves mineures.', percent: 20 },
    { id: 'handover', label: 'Réception', trigger: 'Solde à la réception provisoire ou définitive selon contrat.', percent: 10 },
  ];

  return phases.map(phase => ({
    ...phase,
    expectedAmount: estimatedBudget ? Math.round((estimatedBudget * phase.percent) / 100) : undefined,
    status: 'planned' as const,
  }));
}

function buildProjectFinancing(responses: Record<string, unknown>, budgetMin?: number, budgetMax?: number): ProjectFinancingData {
  const mode = String(responses.financingMode || 'to-structure');
  const paymentSecurity = arrayResponse(responses.paymentSecurity);
  const documentReadiness = arrayResponse(responses.documentReadiness);
  const commitments = arrayResponse(responses.commitments);
  const baseSalary = numberResponse(responses.baseSalary, true);
  const variableMonthlyIncome = numberResponse(responses.variableMonthlyIncome, true);
  const otherMonthlyIncome = numberResponse(responses.otherMonthlyIncome, true);
  const composedMonthlyIncome = [baseSalary, variableMonthlyIncome, otherMonthlyIncome]
    .filter((value): value is number => value !== undefined)
    .reduce((total, value) => total + value, 0);
  const declaredMonthlyIncome = numberResponse(responses.monthlyIncome, true);
  const monthlyIncome = declaredMonthlyIncome !== undefined
    ? declaredMonthlyIncome
    : composedMonthlyIncome > 0 ? composedMonthlyIncome : undefined;
  const existingMonthlyDebt = numberResponse(responses.existingMonthlyDebt, true);
  const monthlyPaymentCapacity = numberResponse(responses.monthlyPaymentCapacity, true);
  const ownContribution = numberResponse(responses.ownContribution, true);
  const requestedLoanAmount = numberResponse(responses.requestedLoanAmount, true);
  const desiredLoanDurationYears = numberResponse(responses.desiredLoanDurationYears);
  const availableSavings = numberResponse(responses.availableSavings, true);
  const householdDependents = numberResponse(responses.householdDependents, true);
  const bankAgreementStage = String(responses.bankAgreementStage || '').trim() || undefined;
  const estimatedBudget = budgetMax || budgetMin || undefined;
  const readiness: ProjectFinancingData['readiness'] =
    mode === 'confirmed-bank' || bankAgreementStage === 'funds-available' || bankAgreementStage === 'pre-approved' ? 'confirmed'
      : mode === 'bank-support' || bankAgreementStage === 'under-review' || bankAgreementStage === 'documents-requested' ? 'bank_review'
        : mode === 'to-structure' || mode === 'land-and-finance' ? 'to_structure'
          : 'unknown';
  const currentDebtRatioPercent = percentRatio(existingMonthlyDebt, monthlyIncome);
  const projectedDebtRatioPercent = percentRatio((existingMonthlyDebt ?? 0) + (monthlyPaymentCapacity ?? 0), monthlyIncome);
  const equityRatioPercent = percentRatio(ownContribution, estimatedBudget);
  const cashReserveMonths = monthlyIncome && availableSavings !== undefined
    ? Math.round((availableSavings / monthlyIncome) * 10) / 10
    : undefined;
  const incomeStability = String(responses.incomeStability || '').trim() || undefined;
  const affordabilityScore = clampPercent(
    15
      + bankStageScore(bankAgreementStage)
      + stabilityScore(incomeStability)
      + debtRatioScore(projectedDebtRatioPercent)
      + equityScore(equityRatioPercent)
      + documentScore(documentReadiness)
      + securityScore(paymentSecurity, commitments)
  );

  return {
    mode,
    readiness,
    paymentPrinciple: 'Objectif Buildify : lire les revenus, charges, apport, banque et garanties avant engagement, protéger l’apport, éviter les avances non sécurisées et déclencher les paiements uniquement par jalons vérifiés.',
    estimatedBudget,
    monthlyIncome,
    baseSalary,
    variableMonthlyIncome,
    otherMonthlyIncome,
    existingMonthlyDebt,
    monthlyPaymentCapacity,
    ownContribution,
    requestedLoanAmount,
    desiredLoanDurationYears,
    availableSavings,
    employmentStatus: String(responses.employmentStatus || '').trim() || undefined,
    financialSector: String(responses.financialSector || '').trim() || undefined,
    contractType: String(responses.contractType || '').trim() || undefined,
    employerName: String(responses.employerName || '').trim() || undefined,
    salaryDomiciliationBank: String(responses.salaryDomiciliationBank || '').trim() || undefined,
    incomeCurrency: String(responses.incomeCurrency || '').trim() || undefined,
    incomeStability,
    householdDependents,
    coBorrowerStatus: String(responses.coBorrowerStatus || '').trim() || undefined,
    financingOwner: String(responses.financingOwner || '').trim() || undefined,
    affordabilityScore,
    financialRiskLevel: financialRiskLevel(affordabilityScore, projectedDebtRatioPercent),
    equityRatioPercent,
    cashReserveMonths,
    bankName: String(responses.bankName || '').trim() || undefined,
    bankContact: String(responses.bankContact || '').trim() || undefined,
    bankAgreementStage,
    financingPurpose: String(responses.financingPurpose || '').trim() || undefined,
    downPaymentSource: String(responses.downPaymentSource || '').trim() || undefined,
    documentReadiness,
    guarantees: paymentSecurity,
    commitments,
    currentDebtRatioPercent,
    projectedDebtRatioPercent,
    notaryContract: mode === 'notary-secured' || paymentSecurity.includes('notary-contract'),
    escrowRequested: paymentSecurity.includes('escrow'),
    bankSupportRequested: mode === 'bank-support' || paymentSecurity.includes('bank-support'),
    landSupportRequested: mode === 'land-and-finance' || responses.terrainStatus === 'searching',
    notes: String(responses.financingNotes || '').trim() || undefined,
    milestones: buildPaymentMilestones(estimatedBudget),
    updatedAt: new Date().toISOString(),
  };
}

const FINANCE_ADVISOR_STEP_IDS = new Set([
  'financing',
  'financing-purpose',
  'financial-identity',
  'financing-profile',
  'financing-bank',
  'payment-security',
  'financing-documents',
  'financing-commitments',
]);

function estimateLoanPrincipal(monthlyPayment?: number, durationYears?: number): number | undefined {
  if (!monthlyPayment || !durationYears) return undefined;
  const rawCapacity = monthlyPayment * durationYears * 12;
  return Math.round(rawCapacity * 0.78);
}

function financingReadinessText(readiness: ProjectFinancingData['readiness']): string {
  if (readiness === 'confirmed') return 'Financement lisible';
  if (readiness === 'bank_review') return 'Banque à suivre';
  if (readiness === 'to_structure') return 'À structurer';
  return 'À qualifier';
}

function financingStageText(financing: ProjectFinancingData, coveragePercent?: number): string {
  if (financing.financialRiskLevel === 'high') return 'Restructurer avant engagement';
  if ((coveragePercent ?? 0) >= 100 && (financing.affordabilityScore ?? 0) >= 70) return 'Projet finançable à sécuriser';
  if ((coveragePercent ?? 0) >= 80) return 'Projet possible avec ajustements';
  if ((coveragePercent ?? 0) >= 55) return 'Projet à phaser ou à réduire';
  return 'Montage à reprendre';
}

function buildFinancingAdvisorPlan(responses: Record<string, unknown>, budgetMin?: number, budgetMax?: number): FinancingAdvisorPlan {
  const financing = buildProjectFinancing(responses, budgetMin, budgetMax);
  const budget = budgetMax || budgetMin || financing.estimatedBudget;
  const maxPrudentMonthly = financing.monthlyIncome !== undefined
    ? Math.max(0, Math.round((financing.monthlyIncome * 0.35) - (financing.existingMonthlyDebt ?? 0)))
    : undefined;
  const declaredCapacity = financing.monthlyPaymentCapacity;
  const retainedMonthly = declaredCapacity !== undefined && maxPrudentMonthly !== undefined
    ? Math.min(declaredCapacity, maxPrudentMonthly)
    : declaredCapacity ?? maxPrudentMonthly;
  const loanCapacity = estimateLoanPrincipal(retainedMonthly, financing.desiredLoanDurationYears);
  const totalCapacity = (loanCapacity ?? 0) + (financing.ownContribution ?? 0);
  const hasAnyCapacity = loanCapacity !== undefined || financing.ownContribution !== undefined;
  const coveragePercent = budget && hasAnyCapacity ? clampPercent((totalCapacity / budget) * 100) : undefined;
  const gap = budget && hasAnyCapacity ? Math.max(0, budget - totalCapacity) : undefined;
  const firstMilestoneAmount = budget ? Math.round(budget * 0.1) : undefined;
  const requiredMonthlyGap = gap && financing.desiredLoanDurationYears
    ? Math.round((gap / (financing.desiredLoanDurationYears * 12)) / 0.78)
    : undefined;
  const documentCount = financing.documentReadiness?.filter(item => item !== 'none-yet').length ?? 0;
  const stageLabel = financingStageText(financing, coveragePercent);
  const safeguards = compactStrings([
    'Aucun paiement important avant étape contrôlée, preuve d’avancement et validation écrite.',
    firstMilestoneAmount ? `Premier jalon indicatif : ${formatMetricMoney(firstMilestoneAmount)} après contrôle de fondations ou étape équivalente.` : 'Les montants de jalons seront calculés après budget définitif.',
    financing.escrowRequested || financing.notaryContract ? 'Contrat notarié, compte séquestre ou paiement bancaire peuvent sécuriser les décaissements.' : 'Ajoutez contrat notarié, séquestre ou décaissement bancaire si vous voulez plus de protection.',
  ]);
  const nextActions = compactStrings([
    financing.monthlyIncome === undefined && 'Saisir le revenu net retenu pour mesurer la mensualité prudente.',
    financing.existingMonthlyDebt === undefined && 'Déclarer les charges ou crédits mensuels, même si le montant est 0.',
    financing.ownContribution === undefined && 'Indiquer l’apport réellement disponible avant d’engager le dossier.',
    financing.desiredLoanDurationYears === undefined && 'Choisir une durée de financement pour estimer la capacité.',
    documentCount < 3 && 'Préparer pièce d’identité, justificatifs de revenus et relevés bancaires.',
    gap !== undefined && gap > 0 && requiredMonthlyGap !== undefined && `Écart à couvrir : ${formatMetricMoney(gap)} ou environ ${formatMetricMoney(requiredMonthlyGap)} de mensualité supplémentaire prudente.`,
    coveragePercent !== undefined && coveragePercent >= 100 && 'Passer à la sécurisation banque, contrat et planning de paiement par jalons.',
  ]).slice(0, 5);

  return {
    title: stageLabel,
    summary: 'Lecture indicative pour savoir si le projet peut avancer, doit être phasé ou nécessite un échange banque avant engagement.',
    stageLabel,
    readinessLabel: financingReadinessText(financing.readiness),
    metrics: [
      {
        label: 'Mensualité prudente',
        value: retainedMonthly === undefined ? 'À saisir' : formatMetricMoney(retainedMonthly),
        helper: maxPrudentMonthly === undefined ? 'Calculée après revenu et charges.' : `Plafond prudent estimé : ${formatMetricMoney(maxPrudentMonthly)}.`,
        icon: Wallet,
      },
      {
        label: 'Capacité financement',
        value: loanCapacity === undefined ? 'À calculer' : formatMetricMoney(loanCapacity),
        helper: financing.desiredLoanDurationYears ? `Sur ${financing.desiredLoanDurationYears} an(s), lecture volontairement prudente.` : 'Ajoutez la durée souhaitée.',
        icon: Landmark,
      },
      {
        label: 'Couverture budget',
        value: coveragePercent === undefined ? 'À calculer' : `${coveragePercent}%`,
        helper: budget ? `Budget retenu : ${formatMetricMoney(budget)} avec apport + capacité.` : 'Choisissez un budget indicatif.',
        icon: Gauge,
      },
      {
        label: 'Reste à structurer',
        value: gap === undefined ? 'À calculer' : gap > 0 ? formatMetricMoney(gap) : '0 F CFA',
        helper: gap && gap > 0 ? 'À couvrir par apport, banque, phasage ou réduction de périmètre.' : 'Montage théorique couvert, à sécuriser par documents.',
        icon: BanknoteArrowDown,
      },
    ],
    safeguards,
    nextActions: nextActions.length ? nextActions : ['Continuer vers les pièces, garanties et engagements de compréhension.'],
    milestones: financing.milestones.slice(0, 4),
  };
}

function compactStrings(items: Array<string | undefined | null | false>): string[] {
  return items.filter(Boolean) as string[];
}

function formatMetricNumber(value: number | undefined, unit: string): string {
  if (value === undefined) return 'À saisir';
  return `${new Intl.NumberFormat('fr-FR').format(value)} ${unit}`;
}

function formatMetricMoney(value: number | undefined): string {
  if (value === undefined) return 'À saisir';
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: millions < 10 ? 1 : 0 }).format(millions)} M F CFA`;
  }
  return `${new Intl.NumberFormat('fr-FR').format(value)} F CFA`;
}

function formatMetricPercent(value: number | undefined, emptyLabel = 'À calculer'): string {
  return value === undefined ? emptyLabel : `${value}%`;
}

function ratioTone(value: number | undefined, warnAt: number, criticalAt: number): ControlTone {
  if (value === undefined) return 'neutral';
  if (value >= criticalAt) return 'critical';
  if (value >= warnAt) return 'warn';
  return 'good';
}

function financeRiskTone(value: ProjectFinancingData['financialRiskLevel'] | undefined): ControlTone {
  if (value === 'low') return 'good';
  if (value === 'moderate') return 'warn';
  if (value === 'high') return 'critical';
  return 'neutral';
}

function labelsToPreview(values: unknown, options: ChoiceOption[], fallback: string): string {
  const labels = arrayResponse(values).map(value => getLabel(options, value));
  if (!labels.length) return fallback;
  const visible = labels.slice(0, 3).join(', ');
  return labels.length > 3 ? `${visible} +${labels.length - 3}` : visible;
}

function buildFinanceMetrics(responses: Record<string, unknown>, budgetMin?: number, budgetMax?: number): ControlMetric[] {
  const financing = buildProjectFinancing(responses, budgetMin, budgetMax);
  const score = financing.affordabilityScore;
  const riskLabels: Record<string, string> = {
    low: 'Faible',
    moderate: 'Modéré',
    high: 'Élevé',
    unknown: 'À qualifier',
  };

  return [
    {
      label: 'Score finance',
      value: score === undefined ? 'À compléter' : `${score}/100`,
      helper: `Lecture risque : ${riskLabels[financing.financialRiskLevel || 'unknown']}`,
      tone: financeRiskTone(financing.financialRiskLevel),
    },
    {
      label: 'Endettement projeté',
      value: formatMetricPercent(financing.projectedDebtRatioPercent),
      helper: 'Charges existantes + mensualité acceptable',
      tone: ratioTone(financing.projectedDebtRatioPercent, 40, 55),
    },
    {
      label: 'Apport / budget',
      value: formatMetricPercent(financing.equityRatioPercent),
      helper: `Apport déclaré : ${formatMetricMoney(financing.ownContribution)}`,
      tone: financing.equityRatioPercent === undefined ? 'neutral' : financing.equityRatioPercent >= 20 ? 'good' : 'warn',
    },
    {
      label: 'Réserve après apport',
      value: financing.cashReserveMonths === undefined ? 'À saisir' : `${financing.cashReserveMonths} mois`,
      helper: 'Épargne restante rapportée au revenu net',
      tone: financing.cashReserveMonths === undefined ? 'neutral' : financing.cashReserveMonths >= 3 ? 'good' : 'warn',
    },
  ];
}

function buildOuvrageControlProfile(responses: Record<string, unknown>): OuvrageControlProfile {
  const projectType = stringResponse(responses, 'projectType');
  const family = getProjectFamily(projectType);
  const selectedProjectLabel = projectType ? getLabel(PROJECT_TYPES, projectType) : 'Projet Buildify';
  const budgetValue = stringResponse(responses, 'budget');
  const [budgetMinRaw, budgetMaxRaw] = getBudgetRange(budgetValue);
  const budgetMin = budgetMinRaw ?? undefined;
  const budgetMax = budgetMaxRaw ?? undefined;
  const finance = buildFinanceMetrics(responses, budgetMin, budgetMax);
  const financeStress = finance.find(item => item.label === 'Endettement projeté')?.tone;
  const terrainSurface = numberResponse(responses.surfaceArea);
  const siteAccess = stringResponse(responses, 'siteAccess');
  const soilKnown = stringResponse(responses, 'soilKnown');
  const country = getSubmittedCountry(responses);
  const city = getSubmittedCity(responses);
  const locationLabel = city ? `${city}, ${country}` : country;

  if (!projectType) {
    return {
      title: 'Contrôle professionnel',
      subtitle: 'Le tableau devient précis dès que la catégorie est choisie.',
      icon: ShieldCheck,
      metrics: [
        { label: 'Catégorie', value: 'À choisir' },
        { label: 'Pays', value: country },
        { label: 'Ville', value: city || 'À sélectionner' },
        { label: 'Budget', value: budgetValue ? getBudgetLabel(budgetValue) : 'À choisir' },
      ],
      checks: [
        'Choisir la famille d’ouvrage pour charger les bons champs.',
        'Renseigner localisation, accès et pièces disponibles.',
        'Structurer le financement avant transmission du dossier.',
      ],
      risks: ['Aucun engagement technique sans catégorie, lieu et budget minimum.'],
      finance,
    };
  }

  if (family === 'maison') {
    const builtSurface = numberResponse(responses.builtSurface);
    const houseFootprint = numberResponse(responses.houseFootprint);
    const outdoorArea = numberResponse(responses.usableOutdoorArea, true);
    const footprintRatio = percentRatio(houseFootprint, terrainSurface);
    const extension = stringResponse(responses, 'futureExtensionPlan');
    const bedrooms = numberResponse(responses.bedrooms);

    return {
      title: `${selectedProjectLabel} - contrôle maison`,
      subtitle: 'Surface, emprise, confort familial et marge d’évolution.',
      icon: Home,
      metrics: [
        { label: 'Terrain', value: formatMetricNumber(terrainSurface, 'm²'), helper: locationLabel },
        { label: 'Emprise au sol', value: formatMetricNumber(houseFootprint, 'm²'), helper: 'Occupation réelle du bâti', tone: ratioTone(footprintRatio, 45, 60) },
        { label: 'Taux d’emprise', value: formatMetricPercent(footprintRatio), helper: 'À vérifier avec les règles locales', tone: ratioTone(footprintRatio, 45, 60) },
        { label: 'Surface construite', value: formatMetricNumber(builtSurface, 'm²'), helper: bedrooms ? `${bedrooms} chambre(s) demandée(s)` : 'Programme intérieur à compléter' },
        { label: 'Extérieur préservé', value: formatMetricNumber(outdoorArea, 'm²'), helper: extension ? getLabel([{ value: 'none', label: 'Aucune extension prévue' }, { value: 'horizontal', label: 'Extension horizontale possible' }, { value: 'vertical', label: 'Étage futur possible' }, { value: 'rental-unit', label: 'Dépendance ou logement locatif futur' }, { value: 'to-study', label: 'À étudier avec Buildify' }], extension) : 'Cour, parking, terrasse ou jardin' },
      ],
      checks: compactStrings([
        terrainSurface && houseFootprint ? `Valider ${formatMetricPercent(footprintRatio)} d’emprise avant esquisse.` : 'Saisir terrain + emprise pour calculer l’occupation.',
        builtSurface ? 'Cadrer le programme pièce par pièce avant métré.' : 'Renseigner la surface construite souhaitée.',
        siteAccess ? `Accès chantier : ${getLabel(SITE_ACCESS_OPTIONS, siteAccess)}.` : 'Préciser l’accès au site pour les livraisons.',
        soilKnown === 'faite' ? 'Exploiter l’étude de sol existante.' : 'Prévoir une étude de sol avant chiffrage gros œuvre.',
      ]),
      risks: compactStrings([
        footprintRatio !== undefined && footprintRatio >= 60 && 'Emprise élevée : risque de cour, parking ou recul insuffisant.',
        soilKnown !== 'faite' && 'Fondations et structure à sécuriser par étude de sol.',
        financeStress === 'critical' && 'Capacité financière à revoir avant engagement chantier.',
        !budgetValue && 'Budget indicatif encore absent : devis peu fiable.',
      ]),
      finance,
    };
  }

  if (family === 'rplus') {
    const rPlusLevel = numberResponse(responses.rPlusLevel);
    const unitsPerFloor = numberResponse(responses.unitsPerFloor);
    const estimatedFootprint = numberResponse(responses.estimatedFootprint);
    const upperUnits = rPlusLevel && unitsPerFloor ? rPlusLevel * unitsPerFloor : undefined;
    const totalLevels = rPlusLevel ? rPlusLevel + 1 : undefined;
    const floorArea = totalLevels && estimatedFootprint ? totalLevels * estimatedFootprint : undefined;
    const groundFloorLabels: ChoiceOption[] = [
      { value: 'parking', label: 'Parking' },
      { value: 'commerce', label: 'Commerces' },
      { value: 'logements', label: 'Logements' },
      { value: 'mixte', label: 'Mixte' },
      { value: 'a-definir', label: 'À définir' },
    ];

    return {
      title: 'Immeuble R+ - contrôle structure',
      subtitle: 'Niveaux, lots, emprise, circulation et sécurité.',
      icon: Landmark,
      metrics: [
        { label: 'Hauteur', value: rPlusLevel ? `R+${rPlusLevel}` : 'À choisir', helper: totalLevels ? `${totalLevels} niveau(x) avec RDC` : 'Compteur simple R+' },
        { label: 'Lots estimés', value: formatMetricNumber(upperUnits, 'unité(s)'), helper: 'Hors ajustement rez-de-chaussée' },
        { label: 'Emprise estimée', value: formatMetricNumber(estimatedFootprint, 'm²'), helper: locationLabel },
        { label: 'Surface plancher indicative', value: formatMetricNumber(floorArea, 'm²'), helper: 'Base très préliminaire à confirmer' },
        { label: 'Rez-de-chaussée', value: stringResponse(responses, 'groundFloorUse') ? getLabel(groundFloorLabels, String(responses.groundFloorUse)) : 'À préciser', helper: getLabel(BUILDING_USE_OPTIONS, String(responses.buildingUse || 'a-definir')) },
      ],
      checks: compactStrings([
        rPlusLevel && rPlusLevel >= 4 ? 'Anticiper ascenseur, sécurité incendie et contrôle structure.' : 'Valider escalier, accès et évacuation dès l’esquisse.',
        unitsPerFloor ? 'Contrôler les typologies par étage et les gaines techniques.' : 'Renseigner le nombre de logements ou locaux par étage.',
        siteAccess ? `Accès chantier : ${getLabel(SITE_ACCESS_OPTIONS, siteAccess)}.` : 'Préciser accès engins, stockage et stationnement chantier.',
        soilKnown === 'faite' ? 'Analyser la portance selon le niveau R+.' : 'Étude de sol obligatoire avant toute structure R+.',
      ]),
      risks: compactStrings([
        rPlusLevel !== undefined && rPlusLevel >= 6 && 'R+ élevé : vigilance ascenseur, incendie, parking et surpresseur.',
        !estimatedFootprint && 'Emprise manquante : impossible d’estimer correctement la trame.',
        soilKnown !== 'faite' && 'Risque structurel si le sol n’est pas confirmé.',
        financeStress === 'critical' && 'Montage financier sensible pour un immeuble collectif.',
      ]),
      finance,
    };
  }

  if (family === 'vrd') {
    const roadLength = numberResponse(responses.roadLength);
    const roadWidth = numberResponse(responses.roadWidth);
    const roadArea = roadLength && roadWidth ? Math.round(roadLength * roadWidth) : undefined;
    const plotCount = numberResponse(responses.plotCount, true);
    const outfallPoint = stringResponse(responses, 'outfallPoint');
    const vrdLotsText = labelsToPreview(responses.vrdLots, VRD_LOTS, 'Lots VRD à choisir');
    const density = roadLength && plotCount ? Math.round((plotCount / roadLength) * 1000) : undefined;

    return {
      title: 'VRD - contrôle réseaux',
      subtitle: 'Linéaire, largeur, exutoire, lots desservis et maintenance.',
      icon: Route,
      metrics: [
        { label: 'Linéaire', value: formatMetricNumber(roadLength, 'm'), helper: locationLabel },
        { label: 'Largeur moyenne', value: formatMetricNumber(roadWidth, 'm'), helper: 'Voirie, accotements et réseaux', tone: roadWidth === undefined ? 'neutral' : roadWidth < 5 ? 'warn' : 'good' },
        { label: 'Surface voirie indicative', value: formatMetricNumber(roadArea, 'm²'), helper: 'Linéaire x largeur moyenne' },
        { label: 'Lots desservis', value: formatMetricNumber(plotCount, 'lot(s)'), helper: density ? `${density} lots / km indicatif` : 'Lotissement ou site à raccorder' },
        { label: 'Lots techniques', value: vrdLotsText, helper: outfallPoint ? `Exutoire : ${outfallPoint}` : 'Exutoire à renseigner' },
      ],
      checks: compactStrings([
        roadLength && roadWidth ? `Pré-métré voirie : environ ${formatMetricNumber(roadArea, 'm²')}.` : 'Saisir linéaire + largeur pour obtenir une base de métré.',
        outfallPoint ? 'Vérifier altimétrie, pente et capacité de l’exutoire.' : 'Indiquer l’exutoire ou le raccordement prévu.',
        'Prévoir plans de récolement, regards accessibles et maintenance.',
        labelsToPreview(responses.vrdLots, VRD_LOTS, '') ? 'Coordonner voirie, eau, électricité, télécoms et drainage.' : 'Sélectionner les lots VRD concernés.',
      ]),
      risks: compactStrings([
        roadWidth !== undefined && roadWidth < 5 && 'Largeur faible : circulation, drainage et croisements à vérifier.',
        !outfallPoint && 'Exutoire absent : risque majeur sur eaux pluviales.',
        !plotCount && 'Nombre de lots absent : raccordements et charge réseaux à affiner.',
        financeStress === 'critical' && 'Financement à sécuriser avant phasage VRD.',
      ]),
      finance,
    };
  }

  return {
    title: `${selectedProjectLabel} - contrôle dossier`,
    subtitle: 'Lots, documents, budget et responsabilités à verrouiller.',
    icon: ClipboardCheck,
    metrics: [
      { label: 'Catégorie', value: selectedProjectLabel },
      { label: 'Localisation', value: locationLabel },
      { label: 'Périmètre', value: labelsToPreview(responses.prestations, getPrestationsOptions(family), 'Prestation à choisir') },
      { label: 'Budget', value: budgetValue ? getBudgetLabel(budgetValue) : 'À choisir' },
    ],
    checks: [
      'Limiter le périmètre exact des lots avant devis.',
      'Joindre photos, plans, devis existants ou descriptif technique.',
      'Valider finance, délais et mode de réception.',
    ],
    risks: compactStrings([
      !budgetValue && 'Budget non déclaré : arbitrages difficiles.',
      financeStress === 'critical' && 'Capacité financière à sécuriser avant engagement.',
      'Tout lot technique doit prévoir essais et réception.',
    ]),
    finance,
  };
}

function hasStoredValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  return String(value).trim() !== '';
}

function isFieldComplete(field: FieldDef, value: unknown): boolean {
  if (!hasStoredValue(value)) return false;
  if (field.type !== 'number') return true;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return false;
  if (field.min !== undefined && parsed < field.min) return false;
  if (field.max !== undefined && parsed > field.max) return false;
  return true;
}

function stepRequirementMessage(step: StepDef | undefined, responses: Record<string, unknown>): string | null {
  if (!step || step.type === 'summary' || step.type === 'confirmation') return null;

  if (step.type === 'field-group') {
    const requiredFields = step.fields?.filter(field => field.required) || [];
    const missingField = requiredFields.find(field => !isFieldComplete(field, responses[field.key]));
    if (missingField) return step.requiredMessage || `Complétez le champ “${missingField.label}” avant de continuer.`;
    if (step.required && requiredFields.length === 0) {
      const hasAnyField = (step.fields || []).some(field => hasStoredValue(responses[field.key]));
      if (!hasAnyField) return step.requiredMessage || 'Complétez au moins une information avant de continuer.';
    }
    return null;
  }

  if (!step.required) return null;

  if (step.type === 'choice-multi') {
    const selected = arrayResponse(responses[step.responseKey]);
    const minSelections = step.minSelections ?? 1;
    return selected.length >= minSelections ? null : step.requiredMessage || `Sélectionnez au moins ${minSelections} élément(s).`;
  }

  if (step.type === 'slider') {
    const value = responses[step.responseKey];
    return isFieldComplete({ key: step.responseKey, label: step.title, type: 'number', min: step.min, max: step.max }, value)
      ? null
      : step.requiredMessage || `Saisissez “${step.title}” avant de continuer.`;
  }

  if (step.type === 'counter') return null;

  if (!hasStoredValue(responses[step.responseKey])) {
    return step.requiredMessage || `Renseignez “${step.title}” avant de continuer.`;
  }

  if (step.id === 'country' && responses.country === 'Autre pays' && !hasStoredValue(responses.otherCountry)) {
    return 'Précisez le pays avant de continuer.';
  }

  if (step.id === 'city' && responses.city === 'Autre ville' && !hasStoredValue(responses.otherCity)) {
    return 'Précisez la ville avant de continuer.';
  }

  return null;
}

export function ConfiguratorView() {
  const {
    configurator,
    viewParams,
    user,
    isAuthenticated,
    authResumeAction,
    setConfiguratorStep,
    setConfiguratorResponse,
    setConfiguratorData,
    resetConfigurator,
    requireAuth,
    setAuthResumeAction,
    clearAuthResumeAction,
    navigate,
    addToast,
    createProjectRequest,
  } = useAppStore();

  const responses = configurator.responses;
  const [localStepId, setLocalStepId] = useState<string>('project-type');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [choiceSearch, setChoiceSearch] = useState<Record<string, string>>({});
  const isInitialized = useRef(false);
  const resumeSubmitTriggered = useRef(false);

  const steps = useMemo(() => buildSteps(responses), [responses]);
  const currentIdx = useMemo(
    () => Math.max(0, steps.findIndex(step => step.id === localStepId)),
    [steps, localStepId]
  );
  const activeStep = steps[currentIdx] || steps[0];
  const projectType = responses.projectType as string | undefined;
  const family = getProjectFamily(projectType);
  const progressSteps = steps.filter(step => step.type !== 'confirmation');
  const progressIdx = progressSteps.findIndex(step => step.id === localStepId);
  const progressPercent = progressSteps.length > 1
    ? ((Math.max(0, progressIdx) + 1) / progressSteps.length) * 100
    : 0;
  const controlProfile = useMemo(() => buildOuvrageControlProfile(responses), [responses]);

  const setSearchValue = useCallback((key: string, value: string) => {
    setChoiceSearch(prev => ({ ...prev, [key]: value }));
  }, []);

  const getSearchValue = useCallback((key: string) => choiceSearch[key] || '', [choiceSearch]);

  const getFilteredOptions = useCallback((key: string, options: ChoiceOption[] = []) => {
    const query = normalizeSearchText(choiceSearch[key] || '');
    if (!query) return options;
    return options.filter(option => {
      const haystack = normalizeSearchText(`${option.label} ${option.description || ''} ${option.value}`);
      return haystack.includes(query);
    });
  }, [choiceSearch]);

  useEffect(() => {
    setConfiguratorStep(currentIdx);
  }, [currentIdx, setConfiguratorStep]);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    if (viewParams.modelId && !responses.projectType) {
      const model = useAppStore.getState().selectedModel;
      if (model) {
        const cat = model.categoryName?.toLowerCase() || '';
        const typeMap: Record<string, string> = {
          villa: 'maison-basse',
          duplex: 'duplex-triplex',
          triplex: 'duplex-triplex',
          immeuble: 'immeuble-rplus',
          vrd: 'vrd',
        };
        const mapped = Object.entries(typeMap).find(([key]) => cat.includes(key))?.[1] || 'maison-basse';
        setConfiguratorResponse('projectType', mapped);
        setConfiguratorData({ modelId: model.id, categoryName: model.categoryName });
      }
    }
  }, [responses.projectType, setConfiguratorData, setConfiguratorResponse, viewParams.modelId]);

  const goToStepId = useCallback((stepId: string) => {
    if (!steps.some(step => step.id === stepId)) return;
    setLocalStepId(stepId);
  }, [steps]);

  const goNext = useCallback(() => {
    if (activeStep?.type === 'counter' && !hasStoredValue(responses[activeStep.responseKey])) {
      setConfiguratorResponse(activeStep.responseKey, activeStep.min ?? 1);
    }
    const nextIdx = currentIdx + 1;
    if (nextIdx < steps.length) {
      setLocalStepId(steps[nextIdx].id);
    }
  }, [activeStep, currentIdx, responses, setConfiguratorResponse, steps]);

  const goBack = useCallback(() => {
    const prevIdx = currentIdx - 1;
    if (prevIdx >= 0) {
      setLocalStepId(steps[prevIdx].id);
    }
  }, [currentIdx, steps]);

  const handleSkip = useCallback(() => goNext(), [goNext]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const ref = generateReference();
      const projectTypeValue = String(responses.projectType || 'autre');
      const [budgetMin, budgetMax] = getBudgetRange(responses.budget as string | undefined);
      const localBudgetMin = budgetMin ?? undefined;
      const localBudgetMax = budgetMax ?? undefined;
      const financing = buildProjectFinancing(responses, localBudgetMin, localBudgetMax);
      const city = getSubmittedCity(responses);
      const country = getSubmittedCountry(responses);
      const clientPresence = stringResponse(responses, 'clientPresence');
      const clientResidenceCountry = stringResponse(responses, 'clientResidenceCountry') || user?.residenceCountry;
      const clientTimeZone = stringResponse(responses, 'clientTimeZone') || user?.timeZone;
      const clientPreferredContactChannel = stringResponse(responses, 'clientPreferredContactChannel') || user?.preferredContactChannel;
      const clientContactWindow = stringResponse(responses, 'clientContactWindow');
      const remoteDecisionMode = stringResponse(responses, 'remoteDecisionMode');
      const representativeName = stringResponse(responses, 'representativeName') || user?.representativeName;
      const representativePhone = stringResponse(responses, 'representativePhone') || user?.representativePhone;
      const representativeRelation = stringResponse(responses, 'representativeRelation') || user?.representativeRelation;
      const declaredDocuments = Array.isArray(responses.documents) ? responses.documents as string[] : [];
      const declaredProjectDocuments = declaredDocuments.map((documentId) => ({
        id: `doc-${ref}-${documentId}`,
        name: getLabel(DOCUMENT_OPTIONS, documentId),
        type: documentId,
        date: new Date().toISOString().slice(0, 10),
      }));
      setReferenceNumber(ref);

      const payload = {
        referenceNumber: ref,
        userId: user?.id,
        clientName: user?.name,
        clientEmail: user?.email,
        clientPhone: user?.phone,
        categorySlug: CATEGORY_SLUG_BY_TYPE[projectTypeValue] || projectTypeValue,
        categoryName: getLabel(PROJECT_TYPES, projectTypeValue),
        modelId: configurator.modelId,
        title: `${getLabel(PROJECT_TYPES, projectTypeValue)}${city ? ` - ${city}` : ''}`,
        description: (responses.description as string | undefined) || buildAutoDescription(responses),
        country,
        city: city || null,
        budgetMin: localBudgetMin,
        budgetMax: localBudgetMax,
        progress: 5,
        status: 'submitted',
        financing,
        clientPresence,
        clientResidenceCountry,
        clientTimeZone,
        clientPreferredContactChannel,
        clientContactWindow,
        remoteDecisionMode,
        representativeName,
        representativePhone,
        representativeRelation,
        documents: declaredProjectDocuments,
        formData: {
          ...responses,
          country,
          city,
          financing,
          clientPresence,
          clientResidenceCountry,
          clientTimeZone,
          clientPreferredContactChannel,
          clientContactWindow,
          remoteDecisionMode,
          representativeName,
          representativePhone,
          representativeRelation,
          referenceNumber: ref,
          formVersion: 'advanced-construction-v3',
          submittedAt: new Date().toISOString(),
        },
      };

      const localProjectInput = {
        referenceNumber: ref,
        userId: user?.id,
        clientName: user?.name,
        clientEmail: user?.email,
        clientPhone: user?.phone,
        country,
        categoryId: CATEGORY_SLUG_BY_TYPE[projectTypeValue] || projectTypeValue,
        categoryName: getLabel(PROJECT_TYPES, projectTypeValue),
        modelId: configurator.modelId,
        title: payload.title,
        description: payload.description,
        city: city || undefined,
        budgetMin: localBudgetMin,
        budgetMax: localBudgetMax,
        progress: 5,
        status: 'submitted',
        formData: payload.formData,
        financing,
        clientPresence,
        clientResidenceCountry,
        clientTimeZone,
        clientPreferredContactChannel,
        clientContactWindow,
        remoteDecisionMode,
        representativeName,
        representativePhone,
        representativeRelation,
        documents: declaredProjectDocuments,
      };

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        throw new Error(errorBody?.error || 'Erreur serveur');
      }
      const created = await res.json().catch(() => null);

      createProjectRequest({
        ...localProjectInput,
        id: created?.project?.id || `local-${ref}`,
      });

      goNext();
      addToast('Demande soumise et visible par l’équipe Buildify.', 'success');
    } catch (error) {
      const ref = generateReference();
      const projectTypeValue = String(responses.projectType || 'autre');
      const [budgetMin, budgetMax] = getBudgetRange(responses.budget as string | undefined);
      const localBudgetMin = budgetMin ?? undefined;
      const localBudgetMax = budgetMax ?? undefined;
      const financing = buildProjectFinancing(responses, localBudgetMin, localBudgetMax);
      const city = getSubmittedCity(responses);
      const country = getSubmittedCountry(responses);
      const clientPresence = stringResponse(responses, 'clientPresence');
      const clientResidenceCountry = stringResponse(responses, 'clientResidenceCountry') || user?.residenceCountry;
      const clientTimeZone = stringResponse(responses, 'clientTimeZone') || user?.timeZone;
      const clientPreferredContactChannel = stringResponse(responses, 'clientPreferredContactChannel') || user?.preferredContactChannel;
      const clientContactWindow = stringResponse(responses, 'clientContactWindow');
      const remoteDecisionMode = stringResponse(responses, 'remoteDecisionMode');
      const representativeName = stringResponse(responses, 'representativeName') || user?.representativeName;
      const representativePhone = stringResponse(responses, 'representativePhone') || user?.representativePhone;
      const representativeRelation = stringResponse(responses, 'representativeRelation') || user?.representativeRelation;
      createProjectRequest({
        id: `local-${ref}`,
        referenceNumber: ref,
        userId: user?.id,
        clientName: user?.name,
        clientEmail: user?.email,
        clientPhone: user?.phone,
        country,
        categoryId: CATEGORY_SLUG_BY_TYPE[projectTypeValue] || projectTypeValue,
        categoryName: getLabel(PROJECT_TYPES, projectTypeValue),
        modelId: configurator.modelId,
        title: `${getLabel(PROJECT_TYPES, projectTypeValue)}${city ? ` - ${city}` : ''}`,
        description: (responses.description as string | undefined) || buildAutoDescription(responses),
        city: city || undefined,
        budgetMin: localBudgetMin,
        budgetMax: localBudgetMax,
        progress: 5,
        status: 'submitted',
        clientPresence,
        clientResidenceCountry,
        clientTimeZone,
        clientPreferredContactChannel,
        clientContactWindow,
        remoteDecisionMode,
        representativeName,
        representativePhone,
        representativeRelation,
        formData: {
          ...responses,
          country,
          city,
          financing,
          clientPresence,
          clientResidenceCountry,
          clientTimeZone,
          clientPreferredContactChannel,
          clientContactWindow,
          remoteDecisionMode,
          representativeName,
          representativePhone,
          representativeRelation,
          referenceNumber: ref,
          formVersion: 'advanced-construction-v3',
          submittedAt: new Date().toISOString(),
          serverStatus: 'service-non-configure-ou-indisponible',
        },
        financing,
      });
      setReferenceNumber(ref);
      goNext();
      const message = error instanceof Error ? error.message : 'Service serveur non configuré ou indisponible';
      addToast(`${message} : copie locale créée.`, 'info');
    } finally {
      setIsSubmitting(false);
    }
  }, [addToast, configurator.modelId, createProjectRequest, goNext, responses, user]);

  const handleSummarySubmit = useCallback(() => {
    if (!isAuthenticated) {
      setAuthResumeAction('submit-configurator');
      requireAuth('configurator');
      addToast('Connectez-vous avec e-mail/téléphone et mot de passe pour soumettre.', 'info');
      return;
    }
    handleSubmit();
  }, [addToast, handleSubmit, isAuthenticated, requireAuth, setAuthResumeAction]);

  useEffect(() => {
    if (authResumeAction !== 'submit-configurator') return;
    if (!isAuthenticated || activeStep?.type !== 'summary' || isSubmitting || resumeSubmitTriggered.current) return;
    resumeSubmitTriggered.current = true;
    clearAuthResumeAction();
    addToast('Connexion confirmée : soumission reprise automatiquement.', 'success');
    handleSubmit();
  }, [activeStep?.type, addToast, authResumeAction, clearAuthResumeAction, handleSubmit, isAuthenticated, isSubmitting]);

  const handleFinalAction = useCallback(() => {
    resetConfigurator();
    navigate('projects');
  }, [navigate, resetConfigurator]);

  const handleCloseConfigurator = useCallback(() => {
    resetConfigurator();
    useAppStore.getState().goBack();
  }, [resetConfigurator]);

  const handleNewProject = useCallback(() => {
    resetConfigurator();
    navigate('home');
  }, [navigate, resetConfigurator]);

  const requirementMessage = useMemo(() => stepRequirementMessage(activeStep, responses), [activeStep, responses]);
  const canProceed = !requirementMessage;

  const renderChoiceSingle = (step: StepDef) => {
    const selected = responses[step.responseKey] as string | undefined;
    const options = step.options || [];
    const filteredOptions = getFilteredOptions(step.id, options);
    const searchValue = getSearchValue(step.id);
    const customLabel = searchValue.trim();
    const customValue = customLabel.length >= 2 ? makeCustomChoiceValue(customLabel) : '';
    const customExists = customLabel
      ? options.some(option => normalizeSearchText(option.label) === normalizeSearchText(customLabel))
      : true;
    const canUseCustom = customLabel.length >= 2 && !customExists;
    const selectedCustomLabel = selected && isCustomChoiceValue(selected) ? getCustomChoiceLabel(selected) : '';
    const showSearch = options.length >= 5;
    const selectOption = (value: string) => {
      setConfiguratorResponse(step.responseKey, value);
      if (step.responseKey === 'country') {
        setConfiguratorResponse('city', '');
        setConfiguratorResponse('otherCity', '');
      }
    };

    return (
      <div className="space-y-3">
        {showSearch && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={event => setSearchValue(step.id, event.target.value)}
              placeholder="Saisir pour chercher ou ajouter"
              className="h-11 rounded-xl pl-9 text-sm"
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {filteredOptions.map(option => {
            const isSelected = selected === option.value;
            const Icon = option.icon;
            return (
              <motion.button
                key={option.value}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => selectOption(option.value)}
                className={`relative flex min-h-[112px] flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors sm:min-h-[94px] sm:flex-row sm:gap-3 sm:p-4 ${
                  isSelected
                    ? 'border-foreground bg-foreground text-background shadow-md'
                    : 'border-border bg-background text-foreground hover:border-foreground/40 hover:bg-muted/40'
                }`}
                aria-pressed={isSelected}
              >
                {(Icon || !option.icon) && (
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg sm:size-10 ${isSelected ? 'bg-background/15' : 'bg-muted'}`}>
                    {Icon ? (
                    <Icon className={`size-4 sm:size-5 ${isSelected ? 'text-background' : 'text-foreground'}`} />
                    ) : (
                      <span className={`text-[11px] font-bold ${isSelected ? 'text-background' : 'text-foreground'}`}>{optionInitials(option.label)}</span>
                    )}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold leading-tight sm:text-sm">{option.label}</span>
                  {option.description && (
                    <span className={`mt-1 block text-[11px] leading-snug sm:text-xs ${isSelected ? 'text-background/75' : 'text-muted-foreground'}`}>
                      {option.description}
                    </span>
                  )}
                </span>
                {isSelected && (
                  <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-background sm:right-3 sm:top-3">
                    <CheckCircle2 className="size-3.5 text-foreground" />
                  </span>
                )}
              </motion.button>
            );
          })}
          {filteredOptions.length === 0 && (
            <div className="col-span-2 rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
              Aucun choix trouvé.
            </div>
          )}
          {selectedCustomLabel && selected !== customValue && (
            <button
              type="button"
              onClick={() => selected && selectOption(selected)}
              className="col-span-2 flex min-h-[58px] items-center gap-3 rounded-xl border border-foreground bg-foreground px-3 py-3 text-left text-sm text-background shadow-md"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background/15 text-[11px] font-bold text-background">
                +
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{selectedCustomLabel}</span>
                <span className="mt-0.5 block text-xs text-background/75">Réponse saisie par l’utilisateur</span>
              </span>
            </button>
          )}
          {canUseCustom && (
            <button
              type="button"
              onClick={() => selectOption(customValue)}
              className={`col-span-2 flex min-h-[58px] items-center gap-3 rounded-xl border border-dashed px-3 py-3 text-left text-sm transition-colors ${
                selected === customValue ? 'border-foreground bg-foreground text-background' : 'border-border bg-muted/30 hover:border-foreground/45'
              }`}
            >
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
                selected === customValue ? 'bg-background/15 text-background' : 'bg-background text-foreground'
              }`}>
                +
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">Utiliser “{customLabel}”</span>
                <span className={`mt-0.5 block text-xs ${selected === customValue ? 'text-background/75' : 'text-muted-foreground'}`}>
                  Ajouter cette réponse au dossier.
                </span>
              </span>
            </button>
          )}
        </div>
        {step.responseKey === 'country' && selected === 'Autre pays' && (
          <Input
            value={(responses.otherCountry as string) || ''}
            onChange={event => setConfiguratorResponse('otherCountry', event.target.value)}
            placeholder="Précisez le pays"
            className="h-12 rounded-xl"
          />
        )}
      </div>
    );
  };

  const renderChoiceMulti = (step: StepDef) => {
    const selected = (responses[step.responseKey] as string[]) || [];
    const options = step.options || [];
    const filteredOptions = getFilteredOptions(step.id, options);
    const searchValue = getSearchValue(step.id);
    const customLabel = searchValue.trim();
    const customValue = customLabel.length >= 2 ? makeCustomChoiceValue(customLabel) : '';
    const customExists = customLabel
      ? options.some(option => normalizeSearchText(option.label) === normalizeSearchText(customLabel))
      : true;
    const canUseCustom = customLabel.length >= 2 && !customExists;
    const selectedCustomValues = selected.filter(value => isCustomChoiceValue(value) && value !== customValue);
    const showSearch = options.length >= 5;
    const toggle = (value: string) => {
      const next = selected.includes(value)
        ? selected.filter(item => item !== value)
        : [...selected, value];
      setConfiguratorResponse(step.responseKey, next);
    };

    return (
      <div className="space-y-3">
        {showSearch && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={event => setSearchValue(step.id, event.target.value)}
              placeholder="Saisir pour chercher ou ajouter"
              className="h-11 rounded-xl pl-9 text-sm"
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {filteredOptions.map(option => {
            const isChecked = selected.includes(option.value);
            const Icon = option.icon;
            return (
              <motion.button
                key={option.value}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => toggle(option.value)}
                className={`relative flex min-h-[86px] flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors sm:min-h-[58px] sm:flex-row sm:items-center sm:gap-3 ${
                  isChecked
                    ? 'border-foreground bg-foreground text-background shadow-md'
                    : 'border-border bg-background text-foreground hover:border-foreground/40 hover:bg-muted/40'
                }`}
                aria-pressed={isChecked}
              >
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${isChecked ? 'bg-background/15' : 'bg-muted'}`}>
                  {Icon ? (
                    <Icon className={`size-4 ${isChecked ? 'text-background' : 'text-foreground'}`} />
                  ) : (
                    <span className={`text-[11px] font-bold ${isChecked ? 'text-background' : 'text-foreground'}`}>{optionInitials(option.label)}</span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium leading-tight sm:text-sm">{option.label}</span>
                  {option.description && (
                    <span className={`mt-1 block text-[11px] leading-snug ${isChecked ? 'text-background/75' : 'text-muted-foreground'}`}>
                      {option.description}
                    </span>
                  )}
                </span>
                {isChecked && (
                  <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-background">
                    <CheckCircle2 className="size-3.5 text-foreground" />
                  </span>
                )}
              </motion.button>
            );
          })}
          {filteredOptions.length === 0 && (
            <div className="col-span-2 rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
              Aucun choix trouvé.
            </div>
          )}
          {selectedCustomValues.map(value => (
            <button
              key={value}
              type="button"
              onClick={() => toggle(value)}
              className="col-span-2 flex min-h-[58px] items-center gap-3 rounded-xl border border-foreground bg-foreground px-3 py-3 text-left text-sm text-background shadow-md"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background/15 text-[11px] font-bold text-background">
                +
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{getCustomChoiceLabel(value)}</span>
                <span className="mt-0.5 block text-xs text-background/75">Toucher pour retirer cette précision</span>
              </span>
            </button>
          ))}
          {canUseCustom && (
            <button
              type="button"
              onClick={() => toggle(customValue)}
              className={`col-span-2 flex min-h-[58px] items-center gap-3 rounded-xl border border-dashed px-3 py-3 text-left text-sm transition-colors ${
                selected.includes(customValue) ? 'border-foreground bg-foreground text-background' : 'border-border bg-muted/30 hover:border-foreground/45'
              }`}
            >
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
                selected.includes(customValue) ? 'bg-background/15 text-background' : 'bg-background text-foreground'
              }`}>
                +
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">Ajouter “{customLabel}”</span>
                <span className={`mt-0.5 block text-xs ${selected.includes(customValue) ? 'text-background/75' : 'text-muted-foreground'}`}>
                  Cette précision sera transmise à l’équipe Buildify.
                </span>
              </span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderSelect = (step: StepDef) => {
    const value = (responses[step.responseKey] as string) || '';
    const options = step.options || [];
    const filteredOptions = getFilteredOptions(step.id, options);
    const searchValue = getSearchValue(step.id);
    const customLabel = searchValue.trim();
    const customValue = customLabel.length >= 2 ? makeCustomChoiceValue(customLabel) : '';
    const customExists = customLabel
      ? options.some(option => normalizeSearchText(option.label) === normalizeSearchText(customLabel))
      : true;
    const canUseCustom = customLabel.length >= 2 && !customExists;
    const selectedCustomLabel = isCustomChoiceValue(value) ? getCustomChoiceLabel(value) : '';
    return (
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={event => setSearchValue(step.id, event.target.value)}
            placeholder="Tapez une ville, commune ou localité"
            className="h-12 rounded-xl pl-9 text-sm"
          />
        </div>
        <div className="max-h-[44vh] overflow-y-auto rounded-xl border bg-background p-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {filteredOptions.map(option => {
              const isSelected = value === option.value;
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setConfiguratorResponse(step.responseKey, option.value)}
                  className={`flex min-h-[44px] items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-medium leading-tight transition-colors sm:text-sm ${
                    isSelected
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-card text-foreground hover:border-foreground/40 hover:bg-muted/40'
                  }`}
                >
                  {Icon ? (
                    <Icon className="size-3.5 shrink-0" />
                  ) : (
                    <span className={`flex size-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
                      isSelected ? 'bg-background/15 text-background' : 'bg-muted text-foreground'
                    }`}>
                      {optionInitials(option.label)}
                    </span>
                  )}
                  <span className="min-w-0">{option.label}</span>
                </button>
              );
            })}
            {filteredOptions.length === 0 && (
              <div className="col-span-2 rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground sm:col-span-3">
                Aucune ville trouvée.
              </div>
            )}
            {selectedCustomLabel && value !== customValue && (
              <button
                type="button"
                onClick={() => setConfiguratorResponse(step.responseKey, value)}
                className="col-span-2 flex min-h-[44px] items-center gap-2 rounded-lg border border-foreground bg-foreground px-3 py-2 text-left text-xs font-medium text-background sm:col-span-3 sm:text-sm"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-background/15 text-[10px] font-bold text-background">
                  +
                </span>
                <span>{selectedCustomLabel}</span>
              </button>
            )}
            {canUseCustom && (
              <button
                type="button"
                onClick={() => setConfiguratorResponse(step.responseKey, customValue)}
                className={`col-span-2 flex min-h-[44px] items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-left text-xs font-medium sm:col-span-3 sm:text-sm ${
                  value === customValue ? 'border-foreground bg-foreground text-background' : 'border-border bg-muted/30 hover:border-foreground/45'
                }`}
              >
                <span className={`flex size-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
                  value === customValue ? 'bg-background/15 text-background' : 'bg-background text-foreground'
                }`}>
                  +
                </span>
                <span>Utiliser “{customLabel}”</span>
              </button>
            )}
          </div>
        </div>
        {value === 'Autre ville' && (
          <Input
            value={(responses.otherCity as string) || ''}
            onChange={event => setConfiguratorResponse('otherCity', event.target.value)}
            placeholder="Précisez la ville"
            className="h-12 rounded-xl"
          />
        )}
      </div>
    );
  };

  const renderFinanceAdvisor = (step: StepDef) => {
    if (!FINANCE_ADVISOR_STEP_IDS.has(step.id)) return null;
    const [budgetMinRaw, budgetMaxRaw] = getBudgetRange(responses.budget as string | undefined);
    const plan = buildFinancingAdvisorPlan(responses, budgetMinRaw ?? undefined, budgetMaxRaw ?? undefined);

    return (
      <Card className="border-foreground/10 bg-muted/20">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Assistant financier</p>
              <h3 className="mt-1 text-base font-bold leading-6 sm:text-lg">{plan.title}</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{plan.summary}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Badge variant="outline" className="text-[10px]">{plan.readinessLabel}</Badge>
              <Badge variant="secondary" className="text-[10px]">Indicatif</Badge>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {plan.metrics.map(metric => (
              <div key={metric.label} className="min-w-0 rounded-xl border bg-background p-3">
                <div className="flex items-start justify-between gap-2">
                  <metric.icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="rounded-md bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">Live</span>
                </div>
                <p className="mt-3 break-words text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{metric.label}</p>
                <p className="mt-1 break-words text-sm font-bold leading-tight">{metric.value}</p>
                <p className="mt-2 break-words text-[11px] leading-4 text-muted-foreground">{metric.helper}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="rounded-xl border bg-background p-3">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <ShieldCheck className="size-3.5" />
                Protection des paiements
              </p>
              <div className="mt-3 space-y-2">
                {plan.safeguards.map(item => (
                  <p key={item} className="rounded-lg bg-muted/45 px-3 py-2 text-xs leading-5 text-muted-foreground">
                    {item}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-xl border bg-background p-3">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <ClipboardCheck className="size-3.5" />
                Prochaines actions
              </p>
              <div className="mt-3 space-y-2">
                {plan.nextActions.map(item => (
                  <p key={item} className="rounded-lg bg-muted/45 px-3 py-2 text-xs leading-5 text-muted-foreground">
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border bg-background p-3">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <CalendarCheck className="size-3.5" />
              Paiement par niveau d’avancement
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
              {plan.milestones.map(milestone => (
                <div key={milestone.id} className="min-w-0 rounded-lg border bg-muted/25 p-3">
                  <p className="text-sm font-bold">{milestone.percent}%</p>
                  <p className="mt-1 break-words text-xs font-semibold leading-4">{milestone.label}</p>
                  <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
                    {milestone.expectedAmount ? formatMetricMoney(milestone.expectedAmount) : 'Montant après budget'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderFieldGroup = (step: StepDef) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {step.fields?.map(field => {
        const value = responses[field.key] === undefined || responses[field.key] === null ? '' : String(responses[field.key]);
        const fieldOptions = field.options || [];
        const fieldSearchKey = `${step.id}:${field.key}`;
        const fieldSearchValue = getSearchValue(fieldSearchKey);
        const filteredFieldOptions = getFilteredOptions(fieldSearchKey, fieldOptions);
        const selectedFieldOption = value ? fieldOptions.find(option => option.value === value) : undefined;
        const selectedCustomFieldOption = value && isCustomChoiceValue(value)
          ? { value, label: getCustomChoiceLabel(value) }
          : undefined;
        const customFieldLabel = fieldSearchValue.trim();
        const customFieldValue = customFieldLabel.length >= 2 ? makeCustomChoiceValue(customFieldLabel) : '';
        const customFieldExists = customFieldLabel
          ? fieldOptions.some(option => normalizeSearchText(option.label) === normalizeSearchText(customFieldLabel))
          : true;
        const selectedVisibleOption = selectedFieldOption || selectedCustomFieldOption;
        const visibleFieldOptionsBase = selectedVisibleOption && !filteredFieldOptions.some(option => option.value === selectedVisibleOption.value)
          ? [selectedVisibleOption, ...filteredFieldOptions]
          : filteredFieldOptions;
        const customFieldAlreadyVisible = Boolean(customFieldValue)
          && visibleFieldOptionsBase.some(option => option.value === customFieldValue);
        const visibleFieldOptions = customFieldLabel.length >= 2 && !customFieldExists && !customFieldAlreadyVisible
          ? [...visibleFieldOptionsBase, { value: customFieldValue, label: `Utiliser “${customFieldLabel}”` }]
          : visibleFieldOptionsBase;
        const showFieldSearch = fieldOptions.length >= 5;
        const fieldOptionsPreview = showFieldSearch && !fieldSearchValue.trim()
          ? visibleFieldOptions.slice(0, 8)
          : visibleFieldOptions;
        const hiddenFieldOptionsCount = Math.max(0, visibleFieldOptions.length - fieldOptionsPreview.length);
        return (
          <div key={field.key} className={field.type === 'textarea' ? 'space-y-2 sm:col-span-2' : 'space-y-2'}>
            <Label className="text-xs font-semibold">
              {field.label}
              {field.required && <span className="ml-1 text-destructive">*</span>}
            </Label>
            {field.type === 'select' ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={getSearchValue(fieldSearchKey)}
                    onChange={event => setSearchValue(fieldSearchKey, event.target.value)}
                    placeholder={showFieldSearch ? 'Rechercher ou saisir une valeur' : 'Saisir pour ajouter un autre choix'}
                    className="h-11 rounded-xl pl-9 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {fieldOptionsPreview.map(option => {
                    const selected = value === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setConfiguratorResponse(field.key, option.value)}
                        className={`flex min-h-[54px] items-start justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs leading-4 transition-colors ${
                          selected
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-border bg-background hover:border-foreground/40 hover:bg-muted/40'
                        }`}
                      >
                        <span className="min-w-0 break-words font-semibold">{option.label}</span>
                        {selected && <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {fieldOptionsPreview.length === 0 && (
                  <div className="rounded-xl border border-dashed px-3 py-3 text-xs leading-5 text-muted-foreground">
                    Aucun choix trouvé. Saisissez au moins deux caractères pour créer une valeur personnalisée.
                  </div>
                )}

                {hiddenFieldOptionsCount > 0 && (
                  <p className="text-[11px] leading-5 text-muted-foreground">
                    {hiddenFieldOptionsCount} autre{hiddenFieldOptionsCount > 1 ? 's' : ''} choix disponible{hiddenFieldOptionsCount > 1 ? 's' : ''}. Saisissez quelques lettres pour filtrer.
                  </p>
                )}

                {value && (
                  <button
                    type="button"
                    onClick={() => setConfiguratorResponse(field.key, '')}
                    className="text-[11px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Effacer ce choix
                  </button>
                )}
              </div>
            ) : field.type === 'textarea' ? (
              <Textarea
                value={value}
                onChange={event => setConfiguratorResponse(field.key, event.target.value)}
                placeholder={field.placeholder}
                className="min-h-[110px] rounded-xl text-sm"
              />
            ) : (
              <div className="relative">
                <Input
                  value={value}
                  onChange={event => setConfiguratorResponse(field.key, event.target.value)}
                  placeholder={field.placeholder}
                  type={field.type}
                  min={field.min}
                  max={field.max}
                  className="h-12 rounded-xl pr-16"
                />
                {field.unit && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                    {field.unit}
                  </span>
                )}
              </div>
            )}
            {field.helper && <p className="text-xs text-muted-foreground">{field.helper}</p>}
          </div>
        );
      })}
      </div>
      {renderFinanceAdvisor(step)}
    </div>
  );

  const renderCounter = (step: StepDef) => {
    const min = step.min ?? 1;
    const max = step.max ?? 10;
    const value = Math.min(max, Math.max(min, (responses[step.responseKey] as number) || min));
    const pct = ((value - min) / (max - min)) * 100;
    const display = step.responseKey === 'rPlusLevel' ? `R+${value}` : String(value);

    return (
      <div className="flex flex-col items-center gap-8 py-6">
        <div className="flex items-center gap-6 sm:gap-8">
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => setConfiguratorResponse(step.responseKey, Math.max(min, value - 1))}
            disabled={value <= min}
            className="flex size-14 sm:size-16 items-center justify-center rounded-full border-2 border-border transition-colors hover:border-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-25"
            aria-label="Diminuer"
          >
            <Minus className="size-6" />
          </motion.button>
          <div className="w-32 text-center">
            <motion.span
              key={display}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="block text-5xl font-bold tabular-nums sm:text-6xl"
            >
              {display}
            </motion.span>
            {step.unit && step.responseKey !== 'rPlusLevel' && (
              <span className="mt-2 block text-xs text-muted-foreground uppercase">
                {step.unit}
              </span>
            )}
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => setConfiguratorResponse(step.responseKey, Math.min(max, value + 1))}
            disabled={value >= max}
            className="flex size-14 sm:size-16 items-center justify-center rounded-full border-2 border-border transition-colors hover:border-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-25"
            aria-label="Augmenter"
          >
            <Plus className="size-6" />
          </motion.button>
        </div>
        <div className="w-full max-w-xs">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-foreground"
              animate={{ width: `${pct}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{step.responseKey === 'rPlusLevel' ? `R+${min}` : min}</span>
            <span>{step.responseKey === 'rPlusLevel' ? `R+${max}` : max}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderSlider = (step: StepDef) => {
    const min = step.min ?? 100;
    const max = step.max ?? 5000;
    const stepValue = step.step ?? 50;
    const hasValue = hasStoredValue(responses[step.responseKey]);
    const value = Math.min(max, Math.max(min, (responses[step.responseKey] as number) || min));
    const marks = [min, Math.round((min + max) / 3), Math.round((min + max) / 2), max];
    const setSurfaceValue = (rawValue: string) => {
      if (!rawValue.trim()) {
        setConfiguratorResponse(step.responseKey, '');
        return;
      }
      const nextValue = Number(rawValue);
      if (Number.isNaN(nextValue)) return;
      setConfiguratorResponse(step.responseKey, Math.min(max, Math.max(min, nextValue)));
    };

    return (
      <div className="flex flex-col gap-6 py-6">
        <div className="text-center">
          <motion.span
            key={value}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="block text-4xl font-bold tabular-nums sm:text-5xl"
          >
            {hasValue ? formatSurface(value) : 'À saisir'}
          </motion.span>
        </div>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
          <Slider
            value={[value]}
            min={min}
            max={max}
            step={stepValue}
            onValueChange={([nextValue]) => setConfiguratorResponse(step.responseKey, nextValue)}
            className="w-full"
          />
          <div className="relative">
            <Input
              value={hasValue ? value : ''}
              onChange={event => setSurfaceValue(event.target.value)}
              type="number"
              inputMode="numeric"
              min={min}
              max={max}
              step={stepValue}
              aria-label={`Saisir ${step.title}`}
              className="h-12 rounded-xl pr-12 text-base font-semibold tabular-nums"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
              {step.unit || 'm²'}
            </span>
          </div>
        </div>
        <div className="flex justify-between px-1 text-xs text-muted-foreground tabular-nums">
          {marks.map(mark => (
            <span key={mark}>{formatSurface(mark)}</span>
          ))}
        </div>
      </div>
    );
  };

  const renderTextarea = (step: StepDef) => (
    <Textarea
      value={(responses[step.responseKey] as string) || ''}
      onChange={event => setConfiguratorResponse(step.responseKey, event.target.value)}
      placeholder={step.placeholder}
      className="min-h-[180px] resize-none rounded-xl text-sm"
      aria-label={step.title}
    />
  );

  const renderSummary = () => {
    const rows: { label: string; value: string; stepId: string }[] = [];

    steps
      .filter(step => !['summary', 'confirmation'].includes(step.type))
      .forEach(step => {
        if (step.type === 'field-group') {
          step.fields?.forEach(field => {
            const value = fieldValueToString(field, responses[field.key]);
            if (value) rows.push({ label: field.label, value, stepId: step.id });
          });
          return;
        }
        const value = stepValueToString(step, responses[step.responseKey]);
        if (value) rows.push({ label: step.title, value, stepId: step.id });
      });

    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
          <p className="text-sm font-semibold text-foreground">Dossier prêt à être transmis</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Les réponses ci-dessous donnent à l’équipe technique une première base claire pour l’étude, le métré et le devis.
          </p>
        </div>
        <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
          {rows.map((row, index) => (
            <motion.button
              key={`${row.stepId}-${index}`}
              type="button"
              whileTap={{ scale: 0.99 }}
              onClick={() => goToStepId(row.stepId)}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:border-foreground/30 hover:bg-muted/40"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium text-muted-foreground">{row.label}</span>
                <span className="mt-0.5 block text-sm font-semibold leading-snug">{row.value}</span>
              </span>
              <Pencil className="size-4 shrink-0 text-muted-foreground" />
            </motion.button>
          ))}
        </div>
        {rows.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Aucune information renseignée.
          </div>
        )}
      </div>
    );
  };

  const renderConfirmation = () => (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -120 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="flex size-24 items-center justify-center rounded-full bg-foreground"
      >
        <PartyPopper className="size-12 text-background" />
      </motion.div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Votre projet a été enregistré</h2>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
          L’équipe technique peut maintenant analyser le besoin et préparer la suite du dossier.
        </p>
      </div>
      {referenceNumber && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl bg-muted px-8 py-5"
        >
          <div className="text-xs font-medium text-muted-foreground">Référence</div>
          <div className="mt-1.5 font-mono text-xl font-bold">{referenceNumber}</div>
        </motion.div>
      )}
      <div className="w-full max-w-xs space-y-3 pt-4">
        <Button onClick={handleFinalAction} className="h-14 w-full rounded-xl text-sm font-semibold" size="lg">
          Voir mes projets
          <ChevronRight className="ml-1 size-4" />
        </Button>
        <ConfirmActionDialog
          title="Démarrer un nouveau projet ?"
          description="La demande actuelle est déjà enregistrée. Cette action réinitialise le formulaire pour préparer un autre dossier."
          confirmLabel="Nouveau projet"
          onConfirm={handleNewProject}
          trigger={(
            <Button variant="outline" className="h-12 w-full rounded-xl text-sm" size="lg">
              <RotateCcw className="mr-1 size-4" />
              Nouveau projet
            </Button>
          )}
        />
      </div>
    </div>
  );

  const isFirstStep = currentIdx === 0;
  const isConfirmation = activeStep?.type === 'confirmation';
  const isSummary = activeStep?.type === 'summary';
  const selectedProjectLabel = projectType ? getLabel(PROJECT_TYPES, projectType) : '';
  const showNav = !isConfirmation;
  const answeredCount = Object.values(responses).filter(value => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && String(value).trim() !== '';
  }).length;
  const requiredStepCount = steps.filter(step => step.required).length;
  const technicalReadiness = Math.min(100, Math.round(((currentIdx + answeredCount) / Math.max(1, steps.length + requiredStepCount)) * 100));
  const dossierHighlights = [
    { label: 'Catégorie', value: selectedProjectLabel || 'À choisir' },
    { label: 'Ville', value: getSubmittedCity(responses) || 'À sélectionner' },
    { label: 'Accès', value: fieldValueToString({ key: 'siteAccess', label: 'Accès', type: 'select', options: SITE_ACCESS_OPTIONS }, responses.siteAccess) || 'À renseigner' },
    { label: 'Éléments saisis', value: `${answeredCount}` },
  ];
  const renderControlProfileCard = (variant: 'mobile' | 'desktop') => {
    const compact = variant === 'mobile';
    const ControlIcon = controlProfile.icon;
    const metricToneClass: Record<ControlTone, string> = {
      neutral: 'border-border bg-background',
      good: 'border-foreground/15 bg-muted/30',
      warn: 'border-amber-500/35 bg-amber-500/10 text-amber-950 dark:text-amber-100',
      critical: 'border-destructive/35 bg-destructive/10 text-destructive',
    };
    const metrics = compact ? controlProfile.metrics.slice(0, 4) : controlProfile.metrics;
    const checks = compact ? controlProfile.checks.slice(0, 2) : controlProfile.checks;
    const risks = compact ? controlProfile.risks.slice(0, 2) : controlProfile.risks;
    const finance = compact ? controlProfile.finance.slice(0, 2) : controlProfile.finance;

    return (
      <Card className="border-border/70 shadow-sm">
        <CardContent className={compact ? 'p-4' : 'p-5'}>
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
              <ControlIcon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold">{controlProfile.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{controlProfile.subtitle}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {metrics.map(item => (
              <div key={item.label} className={`min-w-0 rounded-xl border px-3 py-2 ${metricToneClass[item.tone || 'neutral']}`}>
                <p className="break-words text-[11px] font-medium text-muted-foreground">{item.label}</p>
                <p className="mt-1 break-words text-sm font-bold leading-tight">{item.value}</p>
                {item.helper && !compact && (
                  <p className="mt-1 break-words text-[11px] leading-4 text-muted-foreground">{item.helper}</p>
                )}
              </div>
            ))}
          </div>

          {checks.length > 0 && (
            <div className="mt-4 rounded-xl border border-border bg-muted/25 p-3">
              <p className="text-xs font-semibold">Points de contrôle</p>
              <div className="mt-2 space-y-2">
                {checks.map(item => (
                  <div key={item} className="flex gap-2 text-xs leading-5 text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-foreground" />
                    <span className="min-w-0 break-words">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {finance.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {finance.map(item => (
                <div key={item.label} className={`min-w-0 rounded-xl border px-3 py-2 ${metricToneClass[item.tone || 'neutral']}`}>
                  <p className="break-words text-[11px] font-medium text-muted-foreground">{item.label}</p>
                  <p className="mt-1 break-words text-sm font-bold leading-tight">{item.value}</p>
                  {item.helper && !compact && (
                    <p className="mt-1 break-words text-[11px] leading-4 text-muted-foreground">{item.helper}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {risks.length > 0 && (
            <div className="mt-4 space-y-2">
              {risks.map(item => (
                <div key={item} className="flex gap-2 rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive">
                  <ShieldPlus className="mt-0.5 size-3.5 shrink-0" />
                  <span className="min-w-0 break-words">{item}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-md">
        <div className="flex h-14 items-center gap-3 px-4">
          {isFirstStep ? (
            <ConfirmActionDialog
              title="Quitter le formulaire ?"
              description="Les informations non soumises de ce formulaire seront retirées de l’écran. Vous pourrez recommencer un dossier ensuite."
              confirmLabel="Quitter"
              onConfirm={handleCloseConfigurator}
              trigger={(
                <Button variant="ghost" size="icon" className="size-10 rounded-xl" aria-label="Retour">
                  <ArrowLeft className="size-5" />
                </Button>
              )}
            />
          ) : (
            <Button variant="ghost" size="icon" className="size-10 rounded-xl" onClick={goBack} aria-label="Retour">
              <ArrowLeft className="size-5" />
            </Button>
          )}

          <h1 className="truncate text-sm font-bold">Configurer mon projet</h1>

          <div className="ml-auto flex items-center gap-2">
            {!isConfirmation && (
              <Badge variant="outline" className="text-xs font-medium tabular-nums">
                {Math.min(currentIdx + 1, progressSteps.length)} / {progressSteps.length}
              </Badge>
            )}
            <ConfirmActionDialog
              title="Fermer le formulaire ?"
              description="Vous allez quitter la configuration du projet. Les données non soumises ne seront pas envoyées à l’équipe Buildify."
              confirmLabel="Fermer"
              onConfirm={handleCloseConfigurator}
              trigger={(
                <Button variant="ghost" size="icon" className="size-10 rounded-xl" aria-label="Fermer">
                  <X className="size-4" />
                </Button>
              )}
            />
          </div>
        </div>

        {!isConfirmation && <Progress value={progressPercent} className="h-1 rounded-none" />}
      </header>

      <main className="flex flex-1 flex-col items-center justify-start overflow-y-auto px-4 py-6 md:py-10">
        <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,760px)_minmax(300px,1fr)]">
          <div key={activeStep.id} className="w-full">
              {!isConfirmation && (
                <div className="mb-6 text-center">
                  <h2 className="text-xl font-bold md:text-2xl">{activeStep.title}</h2>
                  {activeStep.subtitle && (
                    <p className="mt-1.5 text-sm text-muted-foreground">{activeStep.subtitle}</p>
                  )}
                  {selectedProjectLabel && activeStep.id !== 'project-type' && (
                    <div className="mx-auto mt-4 flex max-w-xl flex-wrap items-center justify-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                      <ListChecks className="size-4 text-foreground" />
                      <span className="font-semibold text-foreground">{selectedProjectLabel}</span>
                      <span>Formulaire {family === 'rplus' ? 'immeuble R+' : family}</span>
                    </div>
                  )}
                  {activeStep.insight && (
                    <p className="mx-auto mt-3 max-w-xl text-xs leading-relaxed text-muted-foreground">
                      {activeStep.insight}
                    </p>
                  )}
                </div>
              )}

              {selectedProjectLabel && activeStep.id !== 'project-type' && !isConfirmation && (
                <div className="mb-4 lg:hidden">
                  {renderControlProfileCard('mobile')}
                </div>
              )}

              {isConfirmation ? (
                renderConfirmation()
              ) : (
                <Card className="border-border/60 shadow-sm">
                  <CardContent className="p-4 md:p-6">
                    {activeStep.type === 'choice-single' && renderChoiceSingle(activeStep)}
                    {activeStep.type === 'choice-multi' && renderChoiceMulti(activeStep)}
                    {activeStep.type === 'select' && renderSelect(activeStep)}
                    {activeStep.type === 'field-group' && renderFieldGroup(activeStep)}
                    {activeStep.type === 'counter' && renderCounter(activeStep)}
                    {activeStep.type === 'slider' && renderSlider(activeStep)}
                    {activeStep.type === 'textarea' && renderTextarea(activeStep)}
                    {activeStep.type === 'summary' && renderSummary()}
                    {requirementMessage && (
                      <div role="alert" className="mt-4 rounded-xl border border-foreground/20 bg-muted/50 px-4 py-3 text-xs font-medium leading-5 text-foreground">
                        {requirementMessage}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
          </div>

          {!isConfirmation && (
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-4">
                <Card className="border-border/70 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">Dossier technique</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          Vue desktop dédiée au suivi du remplissage, avant transmission à l’équipe BTP.
                        </p>
                      </div>
                      <NotebookTabs className="size-5 text-muted-foreground" />
                    </div>

                    <div className="mt-5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">Complétude</span>
                        <span className="tabular-nums text-muted-foreground">{technicalReadiness}%</span>
                      </div>
                      <Progress value={technicalReadiness} className="h-2" />
                    </div>

                    <div className="mt-5 grid gap-2">
                      {dossierHighlights.map(item => (
                        <div key={item.label} className="rounded-lg border bg-background px-3 py-2">
                          <p className="text-[11px] font-medium text-muted-foreground">{item.label}</p>
                          <p className="mt-0.5 truncate text-sm font-semibold">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {renderControlProfileCard('desktop')}
              </div>
            </aside>
          )}
        </div>
      </main>

      {showNav && (
        <footer className="sticky bottom-0 z-30 border-t bg-background/95 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-4 py-3">
            {!isFirstStep && (
              <Button variant="outline" onClick={goBack} className="h-12 shrink-0 rounded-xl px-4">
                <ArrowLeft className="size-4" />
                <span className="ml-1 hidden sm:inline">Précédent</span>
              </Button>
            )}

            <div className="flex-1" />

            {activeStep.skippable && !activeStep.required && !isSummary && (
              <Button variant="ghost" onClick={handleSkip} className="h-12 shrink-0 rounded-xl px-3 text-xs text-muted-foreground sm:text-sm">
                {activeStep.skipLabel || 'Passer'}
              </Button>
            )}

            {isSummary ? (
              <Button onClick={handleSummarySubmit} disabled={isSubmitting} className="h-12 shrink-0 rounded-xl px-5 font-semibold" size="lg">
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    Envoi...
                  </span>
                ) : (
                  <>
                    <Send className="size-4" />
                    <span className="ml-1">Soumettre</span>
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={goNext} disabled={!canProceed} className="h-12 shrink-0 rounded-xl px-5 font-semibold">
                Suivant
                <ArrowRight className="ml-1 size-4" />
              </Button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
