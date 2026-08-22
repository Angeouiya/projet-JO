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
  { value: 'Cameroun', label: 'Cameroun', description: 'Douala, Yaoundé, Bafoussam, Garoua...' },
  { value: 'Nigeria', label: 'Nigeria', description: 'Lagos, Abuja, Kano, Ibadan...' },
  { value: 'Maroc', label: 'Maroc', description: 'Casablanca, Rabat, Marrakech, Tanger...' },
  { value: 'France', label: 'France', description: 'Paris, Lyon, Marseille, Bordeaux...' },
  { value: 'Belgique', label: 'Belgique', description: 'Bruxelles, Anvers, Liège, Charleroi...' },
  { value: 'Canada', label: 'Canada', description: 'Montréal, Toronto, Ottawa, Québec...' },
  { value: 'États-Unis', label: 'États-Unis', description: 'New York, Washington, Houston, Atlanta...' },
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
  Cameroun: ['Douala', 'Yaoundé', 'Bafoussam', 'Garoua', 'Bamenda', 'Maroua', 'Ngaoundéré', 'Bertoua', 'Ebolowa', 'Kribi', 'Limbé', 'Dschang'],
  Nigeria: ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Benin City', 'Kaduna', 'Enugu', 'Abeokuta', 'Ilorin', 'Jos', 'Calabar'],
  Maroc: ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Meknès', 'Oujda', 'Tétouan', 'Kénitra', 'Salé', 'El Jadida'],
  France: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Montpellier', 'Strasbourg', 'Bordeaux', 'Lille', 'Rennes', 'Grenoble'],
  Belgique: ['Bruxelles', 'Anvers', 'Gand', 'Charleroi', 'Liège', 'Bruges', 'Namur', 'Mons', 'Louvain', 'Malines', 'Ostende', 'Tournai'],
  Canada: ['Montréal', 'Toronto', 'Vancouver', 'Ottawa', 'Québec', 'Calgary', 'Edmonton', 'Winnipeg', 'Hamilton', 'Laval', 'Gatineau', 'Halifax'],
  'États-Unis': ['New York', 'Washington', 'Houston', 'Atlanta', 'Los Angeles', 'Chicago', 'Dallas', 'Miami', 'Philadelphia', 'Phoenix', 'Boston', 'Seattle'],
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

function getProjectFamily(projectType?: string): ProjectFamily {
  if (projectType === 'immeuble-rplus') return 'rplus';
  if (projectType === 'vrd') return 'vrd';
  if (projectType === 'hydraulique') return 'hydraulique';
  if (projectType === 'lot-travaux' || projectType === 'renovation') return 'lot';
  if (projectType === 'etude-suivi') return 'etude';
  if (projectType === 'promotion') return 'promotion';
  return 'maison';
}

function getLabel(options: ChoiceOption[] | undefined, value: string): string {
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

function buildSteps(responses: Record<string, unknown>): StepDef[] {
  const projectType = responses.projectType as string | undefined;
  const family = getProjectFamily(projectType);
  const terrainStatus = responses.terrainStatus as string | undefined;
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
      subtitle: 'Sélectionnez la ville ou la commune concernée',
      responseKey: 'city',
      type: 'select',
      options: buildCityOptions(String(responses.country || "Côte d'Ivoire")),
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

    if (terrainStatus === 'searching' && responses.country === "Côte d'Ivoire" && responses.city === 'Abidjan') {
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
        id: 'built-surface',
        title: projectType === 'duplex-triplex' ? 'Surface bâtie estimée' : 'Surface de la maison',
        subtitle: 'Surface construite souhaitée',
        responseKey: 'builtSurface',
        type: 'slider',
        min: 40,
        max: projectType === 'duplex-triplex' ? 900 : 600,
        step: 10,
        unit: 'm²',
        required: true,
        requiredMessage: 'Saisissez la surface bâtie ou l’emprise souhaitée de la maison.',
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
      id: 'financing-profile',
      title: 'Capacité financière',
      subtitle: 'Renseignez les montants clés pour mesurer une mensualité réaliste',
      responseKey: '__financing_profile__',
      type: 'field-group',
      fields: [
        { key: 'monthlyIncome', label: 'Revenu mensuel net', type: 'number', placeholder: 'Ex : 1500000', unit: 'F CFA', min: 0, required: true, helper: 'Revenu stable disponible chaque mois : salaire, activité, loyers ou revenus d’entreprise.' },
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
  return city;
}

function getSubmittedCountry(responses: Record<string, unknown>): string {
  const country = String(responses.country || '').trim();
  if (!country) return "Côte d'Ivoire";
  if (country === 'Autre pays') {
    return String(responses.otherCountry || '').trim() || country;
  }
  return country;
}

function buildAutoDescription(responses: Record<string, unknown>): string {
  const type = getLabel(PROJECT_TYPES, String(responses.projectType || 'autre'));
  const country = getSubmittedCountry(responses);
  const cityName = getSubmittedCity(responses);
  const city = cityName ? ` à ${cityName}, ${country}` : ` en ${country}`;
  const lots = [
    ...(Array.isArray(responses.workLots) ? responses.workLots : []),
    ...(Array.isArray(responses.vrdLots) ? responses.vrdLots : []),
    ...(Array.isArray(responses.prestations) ? responses.prestations : []),
  ];
  const lotText = lots.length ? ` - lots: ${lots.join(', ')}` : '';
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

function percentRatio(numerator?: number, denominator?: number): number | undefined {
  if (!denominator || denominator <= 0 || numerator === undefined) return undefined;
  return Math.round((numerator / denominator) * 100);
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
  const monthlyIncome = numberResponse(responses.monthlyIncome, true);
  const existingMonthlyDebt = numberResponse(responses.existingMonthlyDebt, true);
  const monthlyPaymentCapacity = numberResponse(responses.monthlyPaymentCapacity, true);
  const ownContribution = numberResponse(responses.ownContribution, true);
  const requestedLoanAmount = numberResponse(responses.requestedLoanAmount, true);
  const desiredLoanDurationYears = numberResponse(responses.desiredLoanDurationYears);
  const availableSavings = numberResponse(responses.availableSavings, true);
  const bankAgreementStage = String(responses.bankAgreementStage || '').trim() || undefined;
  const estimatedBudget = budgetMax || budgetMin || undefined;
  const readiness: ProjectFinancingData['readiness'] =
    mode === 'confirmed-bank' || bankAgreementStage === 'funds-available' || bankAgreementStage === 'pre-approved' ? 'confirmed'
      : mode === 'bank-support' || bankAgreementStage === 'under-review' || bankAgreementStage === 'documents-requested' ? 'bank_review'
        : mode === 'to-structure' || mode === 'land-and-finance' ? 'to_structure'
          : 'unknown';
  const currentDebtRatioPercent = percentRatio(existingMonthlyDebt, monthlyIncome);
  const projectedDebtRatioPercent = percentRatio((existingMonthlyDebt ?? 0) + (monthlyPaymentCapacity ?? 0), monthlyIncome);

  return {
    mode,
    readiness,
    paymentPrinciple: 'Objectif Buildify : structurer un financement lisible, protéger l’apport, éviter les avances non sécurisées et déclencher les paiements uniquement par jalons vérifiés.',
    estimatedBudget,
    monthlyIncome,
    existingMonthlyDebt,
    monthlyPaymentCapacity,
    ownContribution,
    requestedLoanAmount,
    desiredLoanDurationYears,
    availableSavings,
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
      const declaredDocuments = Array.isArray(responses.documents) ? responses.documents as string[] : [];
      setReferenceNumber(ref);

      const payload = {
        referenceNumber: ref,
        userId: user?.id,
        clientName: user?.name,
        clientEmail: user?.email,
        clientPhone: user?.phone,
        categorySlug: CATEGORY_SLUG_BY_TYPE[projectTypeValue] || projectTypeValue,
        modelId: configurator.modelId,
        title: `${getLabel(PROJECT_TYPES, projectTypeValue)}${city ? ` - ${city}` : ''}`,
        description: (responses.description as string | undefined) || buildAutoDescription(responses),
        country,
        city: city || null,
        budgetMin: localBudgetMin,
        budgetMax: localBudgetMax,
        formData: {
          ...responses,
          country,
          city,
          financing,
          referenceNumber: ref,
          formVersion: 'advanced-construction-v2',
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
        documents: declaredDocuments.map((documentId) => ({
          id: `doc-${ref}-${documentId}`,
          name: getLabel(DOCUMENT_OPTIONS, documentId),
          type: documentId,
          date: new Date().toISOString().slice(0, 10),
        })),
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
      addToast('Demande soumise et visible dans l’administration.', 'success');
    } catch (error) {
      const ref = generateReference();
      const projectTypeValue = String(responses.projectType || 'autre');
      const [budgetMin, budgetMax] = getBudgetRange(responses.budget as string | undefined);
      const localBudgetMin = budgetMin ?? undefined;
      const localBudgetMax = budgetMax ?? undefined;
      const financing = buildProjectFinancing(responses, localBudgetMin, localBudgetMax);
      const city = getSubmittedCity(responses);
      const country = getSubmittedCountry(responses);
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
        formData: {
          ...responses,
          country,
          city,
          financing,
          referenceNumber: ref,
          formVersion: 'advanced-construction-v2',
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
              placeholder="Saisir pour trouver un choix"
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
              placeholder="Saisir pour trouver un choix"
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
        </div>
      </div>
    );
  };

  const renderSelect = (step: StepDef) => {
    const value = (responses[step.responseKey] as string) || '';
    const options = step.options || [];
    const filteredOptions = getFilteredOptions(step.id, options);
    const searchValue = getSearchValue(step.id);
    return (
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={event => setSearchValue(step.id, event.target.value)}
            placeholder="Tapez une ville ou une commune"
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

  const renderFieldGroup = (step: StepDef) => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {step.fields?.map(field => {
        const value = responses[field.key] === undefined || responses[field.key] === null ? '' : String(responses[field.key]);
        const fieldOptions = field.options || [];
        const fieldSearchKey = `${step.id}:${field.key}`;
        const filteredFieldOptions = getFilteredOptions(fieldSearchKey, fieldOptions);
        const selectedFieldOption = value ? fieldOptions.find(option => option.value === value) : undefined;
        const visibleFieldOptions = selectedFieldOption && !filteredFieldOptions.some(option => option.value === selectedFieldOption.value)
          ? [selectedFieldOption, ...filteredFieldOptions]
          : filteredFieldOptions;
        const showFieldSearch = fieldOptions.length >= 5;
        return (
          <div key={field.key} className={field.type === 'textarea' ? 'space-y-2 sm:col-span-2' : 'space-y-2'}>
            <Label className="text-xs font-semibold">
              {field.label}
              {field.required && <span className="ml-1 text-destructive">*</span>}
            </Label>
            {field.type === 'select' ? (
              <div className="space-y-2">
                {showFieldSearch && (
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={getSearchValue(fieldSearchKey)}
                      onChange={event => setSearchValue(fieldSearchKey, event.target.value)}
                      placeholder="Saisir pour filtrer"
                      className="h-10 rounded-xl pl-9 text-sm"
                    />
                  </div>
                )}
                <div className="relative">
                  <select
                    value={value}
                    onChange={event => setConfiguratorResponse(field.key, event.target.value)}
                    className="h-12 w-full appearance-none rounded-xl border border-border bg-background px-4 pr-10 text-sm outline-none transition-colors focus:border-foreground"
                  >
                    <option value="">Choisissez</option>
                    {visibleFieldOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <ChevronRight className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 rotate-90 text-muted-foreground" />
                </div>
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
    { label: 'Ville', value: String(responses.city || 'À sélectionner') },
    { label: 'Accès', value: String(responses.siteAccess || 'À renseigner') },
    { label: 'Éléments saisis', value: `${answeredCount}` },
  ];

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

                <Card className="border-border/70 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-4" />
                      <p className="text-sm font-semibold">Contrôle professionnel</p>
                    </div>
                    <div className="mt-4 space-y-3 text-xs leading-5 text-muted-foreground">
                      <p>Chaque famille d’ouvrage active ses propres champs : maison, immeuble R+, VRD, lots, hydraulique ou étude.</p>
                      <p>Les données privées ne sont transmises qu’après connexion par e-mail/téléphone et mot de passe.</p>
                    </div>
                  </CardContent>
                </Card>
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
