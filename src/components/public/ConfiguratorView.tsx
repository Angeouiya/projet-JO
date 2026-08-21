'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building,
  Building2,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  CircleDot,
  ClipboardList,
  Crown,
  Droplets,
  Eye,
  FileText,
  Flag,
  Gem,
  Hammer,
  HelpCircle,
  Home,
  KeyRound,
  Landmark,
  Layers,
  ListChecks,
  MapPin,
  Minus,
  Paintbrush,
  PartyPopper,
  Pencil,
  Plus,
  Route,
  RotateCcw,
  Ruler,
  Search,
  Send,
  ShieldCheck,
  Star,
  Truck,
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
import { Checkbox } from '@/components/ui/checkbox';
import { useAppStore } from '@/stores/app-store';
import { CITIES_CI, COMMUNES_ABIDJAN } from '@/types';
import type { LucideIcon } from 'lucide-react';

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
  { value: 'etude-suivi', label: 'Étude / suivi', icon: FileText, description: 'Plans, contrôle, chiffrage' },
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

const CITY_OPTIONS: ChoiceOption[] = [
  ...Array.from(new Set(CITIES_CI))
    .sort((a, b) => a.localeCompare(b, 'fr'))
    .map(city => ({ value: city, label: city, icon: MapPin })),
  { value: 'Autre ville', label: 'Autre ville', icon: MapPin },
];

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
  { value: 'economique', label: 'Économique', icon: Star, description: 'Essentiel et maîtrisé' },
  { value: 'standard', label: 'Standard', icon: Star, description: 'Bon rapport qualité-prix' },
  { value: 'premium', label: 'Premium', icon: Crown, description: 'Matériaux et détails soignés' },
  { value: 'luxe', label: 'Luxe', icon: Gem, description: 'Haut standing' },
  { value: 'a-definir', label: 'À définir', icon: HelpCircle, description: 'À cadrer avec l’équipe' },
];

const BUDGET_OPTIONS: ChoiceOption[] = [
  { value: 'less-10m', label: 'Moins de 10 M', icon: Banknote, description: '< 10 000 000 F' },
  { value: '10-30m', label: '10 - 30 M', icon: Banknote, description: '10 à 30 M F' },
  { value: '30-75m', label: '30 - 75 M', icon: Banknote, description: '30 à 75 M F' },
  { value: '75-150m', label: '75 - 150 M', icon: Banknote, description: '75 à 150 M F' },
  { value: '150-300m', label: '150 - 300 M', icon: Banknote, description: '150 à 300 M F' },
  { value: 'more-300m', label: 'Plus de 300 M', icon: Banknote, description: '> 300 000 000 F' },
  { value: 'unknown', label: 'À estimer', icon: HelpCircle, description: 'Budget à chiffrer' },
];

const TIMELINE_OPTIONS: ChoiceOption[] = [
  { value: 'immediate', label: 'Immédiatement', icon: Flag, description: 'Démarrage urgent' },
  { value: '1-month', label: 'Sous 1 mois', icon: Calendar, description: 'Préparation rapide' },
  { value: '3-months', label: 'Sous 3 mois', icon: Calendar, description: 'Études à finaliser' },
  { value: '6-months', label: 'Sous 6 mois', icon: Calendar, description: 'Projet en préparation' },
  { value: '1-year', label: 'Sous 1 an', icon: Calendar, description: 'Projet à moyen terme' },
  { value: 'unknown', label: 'À définir', icon: HelpCircle, description: 'Calendrier ouvert' },
];

const MAISON_SPACES: ChoiceOption[] = [
  { value: 'suite-parentale', label: 'Suite parentale', icon: Home },
  { value: 'terrasse', label: 'Terrasse', icon: Home },
  { value: 'garage', label: 'Garage', icon: Truck },
  { value: 'cuisine-exterieure', label: 'Cuisine extérieure', icon: Home },
  { value: 'dependance', label: 'Dépendance', icon: Building2 },
  { value: 'cloture', label: 'Clôture', icon: ShieldCheck },
  { value: 'piscine', label: 'Piscine', icon: Droplets },
  { value: 'jardin', label: 'Jardin', icon: Home },
];

const RPLUS_OPTIONS: ChoiceOption[] = [
  { value: 'ascenseur', label: 'Ascenseur', icon: Layers },
  { value: 'parking', label: 'Parking', icon: Truck },
  { value: 'sous-sol', label: 'Sous-sol', icon: Building },
  { value: 'groupe-electrogene', label: 'Groupe électrogène', icon: Wrench },
  { value: 'surpresseur', label: 'Surpresseur', icon: Droplets },
  { value: 'securite-incendie', label: 'Sécurité incendie', icon: ShieldCheck },
  { value: 'loge-gardien', label: 'Loge gardien', icon: Home },
  { value: 'local-technique', label: 'Local technique', icon: Wrench },
];

const VRD_LOTS: ChoiceOption[] = [
  { value: 'terrassement', label: 'Terrassement', icon: Hammer },
  { value: 'voirie', label: 'Voirie', icon: Route },
  { value: 'caniveaux', label: 'Caniveaux', icon: Droplets },
  { value: 'assainissement', label: 'Assainissement', icon: Droplets },
  { value: 'eau-potable', label: 'Eau potable', icon: Droplets },
  { value: 'electricite', label: 'Électricité', icon: Wrench },
  { value: 'telecom', label: 'Télécom', icon: Wrench },
  { value: 'eclairage-public', label: 'Éclairage public', icon: Eye },
  { value: 'signalisation', label: 'Signalisation', icon: Flag },
];

const LOT_TRAVAUX_OPTIONS: ChoiceOption[] = [
  { value: 'gros-oeuvre', label: 'Gros œuvre', icon: Hammer },
  { value: 'second-oeuvre', label: 'Second œuvre', icon: Layers },
  { value: 'plomberie', label: 'Plomberie', icon: Wrench },
  { value: 'electricite', label: 'Électricité', icon: Wrench },
  { value: 'carrelage', label: 'Carrelage', icon: Layers },
  { value: 'peinture', label: 'Peinture', icon: Paintbrush },
  { value: 'menuiserie', label: 'Menuiserie', icon: Wrench },
  { value: 'etancheite', label: 'Étanchéité', icon: Droplets },
  { value: 'toiture', label: 'Charpente / toiture', icon: Home },
  { value: 'climatisation', label: 'Climatisation', icon: Wrench },
  { value: 'finition-complete', label: 'Finition complète', icon: Gem },
];

const HYDRAULIC_WORKS: ChoiceOption[] = [
  { value: 'forage', label: 'Forage', icon: Droplets },
  { value: 'chateau-eau', label: 'Château d’eau', icon: Landmark },
  { value: 'adduction', label: 'Adduction d’eau', icon: Route },
  { value: 'pompage', label: 'Pompage', icon: Wrench },
  { value: 'drainage', label: 'Drainage', icon: Droplets },
  { value: 'station-traitement', label: 'Traitement', icon: ShieldCheck },
];

const STUDY_SCOPES: ChoiceOption[] = [
  { value: 'architecture', label: 'Architecture', icon: Home },
  { value: 'structure', label: 'Structure béton', icon: Building2 },
  { value: 'metre-devis', label: 'Métré / devis', icon: Ruler },
  { value: 'permis', label: 'Permis de construire', icon: FileText },
  { value: 'planning', label: 'Planning travaux', icon: Calendar },
  { value: 'controle-chantier', label: 'Contrôle chantier', icon: ClipboardList },
  { value: 'expertise', label: 'Expertise technique', icon: ShieldCheck },
];

const DOCUMENT_OPTIONS: ChoiceOption[] = [
  { value: 'titre-foncier', label: 'Titre foncier / ACD', icon: FileText },
  { value: 'attestation', label: 'Attestation villageoise', icon: FileText },
  { value: 'plan-topo', label: 'Plan topographique', icon: Ruler },
  { value: 'plan-archi', label: 'Plan architectural', icon: Home },
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
      { value: 'etude-vrd', label: 'Étude VRD', icon: FileText },
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
    { value: 'etude-architecturale', label: 'Étude architecturale', icon: FileText },
    { value: 'plans-execution', label: 'Plans d’exécution', icon: Ruler },
    { value: 'permis', label: 'Permis de construire', icon: FileText },
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
      id: 'city',
      title: 'Ville du projet',
      subtitle: 'Sélectionnez la ville ou la commune concernée',
      responseKey: 'city',
      type: 'select',
      options: CITY_OPTIONS,
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
      skippable: true,
      skipLabel: 'À clarifier plus tard',
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
        skippable: true,
        skipLabel: 'Je ne sais pas',
      });
    }

    if (terrainStatus === 'searching' && responses.city === 'Abidjan') {
      steps.push({
        id: 'zones',
        title: 'Zones recherchées',
        subtitle: 'Sélectionnez les communes souhaitées',
        responseKey: 'zones',
        type: 'choice-multi',
        options: COMMUNES_ABIDJAN.map(commune => ({ value: commune, label: commune, icon: MapPin })),
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
        { key: 'topography', label: 'Topographie', type: 'select', options: TOPOGRAPHY_OPTIONS },
        { key: 'existingUtilities', label: 'Réseaux disponibles', type: 'select', options: [
          { value: 'eau-electricite', label: 'Eau et électricité' },
          { value: 'electricite-seule', label: 'Électricité seule' },
          { value: 'eau-seule', label: 'Eau seule' },
          { value: 'aucun', label: 'Aucun réseau' },
          { value: 'inconnu', label: 'À vérifier' },
        ] },
        { key: 'soilKnown', label: 'Étude de sol', type: 'select', options: [
          { value: 'faite', label: 'Déjà faite' },
          { value: 'a-faire', label: 'À faire' },
          { value: 'inconnue', label: 'Je ne sais pas' },
        ] },
      ],
      skippable: true,
      skipLabel: 'Passer',
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
        skippable: true,
        skipLabel: 'À estimer',
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
        skippable: true,
        skipLabel: 'À définir',
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
        skippable: true,
        skipLabel: 'À définir',
      },
      {
        id: 'rplus-program',
        title: 'Programme R+',
        subtitle: 'Renseignez les volumes clés',
        responseKey: '__rplus_program__',
        type: 'field-group',
        fields: [
          { key: 'unitsPerFloor', label: 'Logements / locaux par étage', type: 'number', placeholder: 'Ex : 2', min: 1, unit: 'unité(s)' },
          { key: 'groundFloorUse', label: 'Rez-de-chaussée', type: 'select', options: [
            { value: 'parking', label: 'Parking' },
            { value: 'commerce', label: 'Commerces' },
            { value: 'logements', label: 'Logements' },
            { value: 'mixte', label: 'Mixte' },
            { value: 'a-definir', label: 'À définir' },
          ] },
          { key: 'estimatedFootprint', label: 'Emprise au sol estimée', type: 'number', placeholder: 'Ex : 450', unit: 'm²' },
        ],
        skippable: true,
        skipLabel: 'À préciser plus tard',
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
          { key: 'roadLength', label: 'Linéaire estimé', type: 'number', placeholder: 'Ex : 750', unit: 'm' },
          { key: 'roadWidth', label: 'Largeur moyenne', type: 'number', placeholder: 'Ex : 7', unit: 'm' },
          { key: 'plotCount', label: 'Nombre de lots desservis', type: 'number', placeholder: 'Ex : 45', unit: 'lot(s)' },
          { key: 'outfallPoint', label: 'Exutoire / raccordement', type: 'text', placeholder: 'Ex : caniveau existant, bassin, réseau public' },
        ],
        skippable: true,
        skipLabel: 'À relever sur site',
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
        skippable: true,
        skipLabel: 'À confirmer',
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
          { key: 'beneficiaries', label: 'Bénéficiaires estimés', type: 'number', placeholder: 'Ex : 250', unit: 'pers.' },
          { key: 'dailyNeed', label: 'Besoin journalier', type: 'number', placeholder: 'Ex : 15', unit: 'm³/j' },
          { key: 'waterSource', label: 'Source actuelle', type: 'text', placeholder: 'Ex : puits, SODECI, forage existant' },
          { key: 'energySource', label: 'Énergie disponible', type: 'select', options: [
            { value: 'reseau', label: 'Réseau électrique' },
            { value: 'solaire', label: 'Solaire' },
            { value: 'groupe', label: 'Groupe électrogène' },
            { value: 'aucune', label: 'Aucune' },
            { value: 'inconnue', label: 'À vérifier' },
          ] },
        ],
        skippable: true,
        skipLabel: 'À diagnostiquer',
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
          { key: 'affectedArea', label: 'Surface concernée', type: 'number', placeholder: 'Ex : 120', unit: 'm²' },
          { key: 'occupiedSite', label: 'Site occupé ?', type: 'select', options: [
            { value: 'oui', label: 'Oui' },
            { value: 'non', label: 'Non' },
            { value: 'partiellement', label: 'Partiellement' },
          ] },
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
          { value: 'espaces-verts', label: 'Espaces verts', icon: Home },
          { value: 'parking', label: 'Parking', icon: Truck },
          { value: 'aire-jeux', label: 'Aire de jeux', icon: Home },
          { value: 'gardiennage', label: 'Gardiennage', icon: ShieldCheck },
          { value: 'local-technique', label: 'Local technique', icon: Wrench },
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
      skippable: true,
      skipLabel: 'À cadrer avec l’équipe',
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
      skippable: true,
      skipLabel: 'À estimer',
    },
    {
      id: 'timeline',
      title: 'Démarrage souhaité',
      subtitle: 'Quand souhaitez-vous lancer les travaux ?',
      responseKey: 'timeline',
      type: 'choice-single',
      options: TIMELINE_OPTIONS,
      skippable: true,
      skipLabel: 'À définir',
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

function buildAutoDescription(responses: Record<string, unknown>): string {
  const type = getLabel(PROJECT_TYPES, String(responses.projectType || 'autre'));
  const city = responses.city ? ` à ${responses.city}` : '';
  const lots = [
    ...(Array.isArray(responses.workLots) ? responses.workLots : []),
    ...(Array.isArray(responses.vrdLots) ? responses.vrdLots : []),
    ...(Array.isArray(responses.prestations) ? responses.prestations : []),
  ];
  const lotText = lots.length ? ` - lots: ${lots.join(', ')}` : '';
  return `${type}${city}${lotText}`;
}

export function ConfiguratorView() {
  const {
    configurator,
    viewParams,
    user,
    isAuthenticated,
    setConfiguratorStep,
    setConfiguratorResponse,
    setConfiguratorData,
    resetConfigurator,
    requireAuth,
    navigate,
    addToast,
    createProjectRequest,
  } = useAppStore();

  const responses = configurator.responses;
  const [localStepId, setLocalStepId] = useState<string>('project-type');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const isInitialized = useRef(false);

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
    const nextIdx = currentIdx + 1;
    if (nextIdx < steps.length) {
      setLocalStepId(steps[nextIdx].id);
    }
  }, [currentIdx, steps]);

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
      const city = responses.city as string | undefined;
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
        city: city || null,
        budgetMin: localBudgetMin,
        budgetMax: localBudgetMax,
        formData: {
          ...responses,
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
        country: "Côte d'Ivoire",
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

      if (!res.ok) throw new Error('Erreur serveur');
      const created = await res.json().catch(() => null);

      createProjectRequest({
        ...localProjectInput,
        id: created?.project?.id || `local-${ref}`,
      });

      goNext();
      addToast('Demande soumise et visible dans l’administration.', 'success');
    } catch {
      const ref = generateReference();
      const projectTypeValue = String(responses.projectType || 'autre');
      const [budgetMin, budgetMax] = getBudgetRange(responses.budget as string | undefined);
      const localBudgetMin = budgetMin ?? undefined;
      const localBudgetMax = budgetMax ?? undefined;
      const city = responses.city as string | undefined;
      createProjectRequest({
        id: `local-${ref}`,
        referenceNumber: ref,
        userId: user?.id,
        clientName: user?.name,
        clientEmail: user?.email,
        clientPhone: user?.phone,
        country: "Côte d'Ivoire",
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
          referenceNumber: ref,
          formVersion: 'advanced-construction-v2',
          submittedAt: new Date().toISOString(),
          serverStatus: 'service-non-configure-ou-indisponible',
        },
      });
      setReferenceNumber(ref);
      goNext();
      addToast('Service serveur non configuré ou indisponible : copie locale créée.', 'info');
    } finally {
      setIsSubmitting(false);
    }
  }, [addToast, configurator.modelId, createProjectRequest, goNext, responses, user]);

  const handleSummarySubmit = useCallback(() => {
    if (!isAuthenticated) {
      requireAuth('configurator');
      addToast('Connectez-vous avec e-mail/téléphone et mot de passe pour soumettre.', 'info');
      return;
    }
    handleSubmit();
  }, [addToast, handleSubmit, isAuthenticated, requireAuth]);

  const handleFinalAction = useCallback(() => {
    resetConfigurator();
    navigate('projects');
  }, [navigate, resetConfigurator]);

  const canProceed = useMemo(() => {
    if (!activeStep) return false;
    if (activeStep.type === 'summary' || activeStep.type === 'confirmation') return true;
    if (activeStep.skippable) return true;
    if (activeStep.type === 'choice-multi') {
      const selected = responses[activeStep.responseKey];
      return !activeStep.required || (Array.isArray(selected) && selected.length > 0);
    }
    if (activeStep.type === 'field-group') {
      const requiredFields = activeStep.fields?.filter(field => field.required) || [];
      return requiredFields.every(field => String(responses[field.key] ?? '').trim() !== '');
    }
    if (activeStep.type === 'textarea' || activeStep.type === 'slider' || activeStep.type === 'counter') return true;
    const val = responses[activeStep.responseKey];
    return val !== undefined && val !== null && val !== '';
  }, [activeStep, responses]);

  const renderChoiceSingle = (step: StepDef) => {
    const selected = responses[step.responseKey] as string | undefined;
    const isProjectType = step.id === 'project-type';

    return (
      <div className={isProjectType ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-3'}>
        {step.options?.map(option => {
          const isSelected = selected === option.value;
          const Icon = option.icon;
          return (
            <motion.button
              key={option.value}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => setConfiguratorResponse(step.responseKey, option.value)}
              className={`relative flex min-h-[94px] items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                isSelected
                  ? 'border-foreground bg-foreground text-background shadow-md'
                  : 'border-border bg-background text-foreground hover:border-foreground/40 hover:bg-muted/40'
              }`}
              aria-pressed={isSelected}
            >
              {Icon && (
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${isSelected ? 'bg-background/15' : 'bg-muted'}`}>
                  <Icon className={`size-5 ${isSelected ? 'text-background' : 'text-foreground'}`} />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold leading-tight">{option.label}</span>
                {option.description && (
                  <span className={`mt-1 block text-xs leading-snug ${isSelected ? 'text-background/75' : 'text-muted-foreground'}`}>
                    {option.description}
                  </span>
                )}
              </span>
              {isSelected && (
                <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-background">
                  <CheckCircle2 className="size-3.5 text-foreground" />
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    );
  };

  const renderChoiceMulti = (step: StepDef) => {
    const selected = (responses[step.responseKey] as string[]) || [];
    const toggle = (value: string) => {
      const next = selected.includes(value)
        ? selected.filter(item => item !== value)
        : [...selected, value];
      setConfiguratorResponse(step.responseKey, next);
    };

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {step.options?.map(option => {
          const isChecked = selected.includes(option.value);
          const Icon = option.icon;
          return (
            <motion.button
              key={option.value}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => toggle(option.value)}
              className={`relative flex min-h-[58px] items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                isChecked
                  ? 'border-foreground bg-foreground text-background shadow-md'
                  : 'border-border bg-background text-foreground hover:border-foreground/40'
              }`}
              aria-pressed={isChecked}
            >
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${isChecked ? 'bg-background/15' : 'bg-muted'}`}>
                {Icon ? (
                  <Icon className={`size-4 ${isChecked ? 'text-background' : 'text-foreground'}`} />
                ) : (
                  <Checkbox checked={isChecked} className="pointer-events-none" aria-hidden />
                )}
              </span>
              <span className="text-sm font-medium leading-tight">{option.label}</span>
              {isChecked && (
                <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-background">
                  <CheckCircle2 className="size-3.5 text-foreground" />
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    );
  };

  const renderSelect = (step: StepDef) => {
    const value = (responses[step.responseKey] as string) || '';
    return (
      <div className="space-y-3">
        <div className="relative">
          <select
            value={value}
            onChange={event => setConfiguratorResponse(step.responseKey, event.target.value)}
            className="h-12 w-full appearance-none rounded-xl border border-border bg-background px-4 pr-10 text-sm outline-none transition-colors focus:border-foreground"
          >
            <option value="">Sélectionnez une ville</option>
            {step.options?.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <ChevronRight className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 rotate-90 text-muted-foreground" />
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
    <div className="grid grid-cols-1 gap-4">
      {step.fields?.map(field => {
        const value = responses[field.key] === undefined || responses[field.key] === null ? '' : String(responses[field.key]);
        return (
          <div key={field.key} className="space-y-2">
            <Label className="text-xs font-semibold">
              {field.label}
              {field.required && <span className="ml-1 text-destructive">*</span>}
            </Label>
            {field.type === 'select' ? (
              <div className="relative">
                <select
                  value={value}
                  onChange={event => setConfiguratorResponse(field.key, event.target.value)}
                  className="h-12 w-full appearance-none rounded-xl border border-border bg-background px-4 pr-10 text-sm outline-none transition-colors focus:border-foreground"
                >
                  <option value="">Choisissez</option>
                  {field.options?.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ChevronRight className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 rotate-90 text-muted-foreground" />
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
    const value = Math.min(max, Math.max(min, (responses[step.responseKey] as number) || min));
    const marks = [min, Math.round((min + max) / 3), Math.round((min + max) / 2), max];

    return (
      <div className="flex flex-col gap-8 py-6">
        <div className="text-center">
          <motion.span
            key={value}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="block text-4xl font-bold tabular-nums sm:text-5xl"
          >
            {formatSurface(value)}
          </motion.span>
        </div>
        <Slider
          value={[value]}
          min={min}
          max={max}
          step={stepValue}
          onValueChange={([nextValue]) => setConfiguratorResponse(step.responseKey, nextValue)}
          className="w-full"
        />
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
        <Button
          variant="outline"
          onClick={() => {
            resetConfigurator();
            navigate('home');
          }}
          className="h-12 w-full rounded-xl text-sm"
          size="lg"
        >
          <RotateCcw className="mr-1 size-4" />
          Nouveau projet
        </Button>
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
          <Button
            variant="ghost"
            size="icon"
            className="size-10 rounded-xl"
            onClick={() => {
              if (isFirstStep) {
                resetConfigurator();
                useAppStore.getState().goBack();
              } else {
                goBack();
              }
            }}
            aria-label="Retour"
          >
            <ArrowLeft className="size-5" />
          </Button>

          <h1 className="truncate text-sm font-bold">Configurer mon projet</h1>

          <div className="ml-auto flex items-center gap-2">
            {!isConfirmation && (
              <Badge variant="outline" className="text-xs font-medium tabular-nums">
                {Math.min(currentIdx + 1, progressSteps.length)} / {progressSteps.length}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-10 rounded-xl"
              onClick={() => {
                resetConfigurator();
                useAppStore.getState().goBack();
              }}
              aria-label="Fermer"
            >
              <X className="size-4" />
            </Button>
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
                      <FileText className="size-5 text-muted-foreground" />
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

            {activeStep.skippable && !isSummary && (
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
