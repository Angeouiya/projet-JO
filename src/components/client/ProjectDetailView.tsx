'use client';

import NextImage from 'next/image';
import { useMemo, useState, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MapPin, Calendar, Wallet, Layers, Users,
  FileText, Upload, Image as ImageIcon, FileCheck, Receipt,
  Send, MessageSquare, Check, X, Clock, Camera,
  ClipboardCheck, AlertCircle, Building2, Eye, Download,
  ShieldCheck, CheckCircle2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/stores/app-store';
import { PROJECT_STATUS_LABELS, FORMAT_XOF } from '@/types';
import type { ProjectData, ProjectDocumentData } from '@/types';

// ── Mock data ──────────────────────────────────────────────

type ProjectDetailData = {
  referenceNumber: string;
  title: string;
  status: string;
  categoryName: string;
  modelName: string;
  city: string;
  budgetMin: number;
  budgetMax: number;
  progress: number;
  projectId?: string;
  terrain: string;
  terrainStatus: string;
  startDate: string;
  estimatedEnd: string;
  team: { name: string; role: string }[];
  documents: { type: string; name: string; date: string; icon: LucideIcon }[];
  messages: { id: string; sender: string; senderRole: string; text: string; time: string; isOwn: boolean }[];
  quotes: { id: string; label: string; amount: number; status: 'pending' | 'accepted' | 'refused'; date: string; }[];
  phases: { name: string; status: 'done' | 'in_progress' | 'pending'; progress: number }[];
  photos: { id: string; caption: string; date: string }[];
};

type VisualProposal = {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  estimate: string;
  duration: string;
  confidence: string;
  deliverable: string;
  strengths: string[];
};

const PROJECT_MAP: Record<string, ProjectDetailData> = {
  'prj-001': {
    referenceNumber: 'BTP-2024-0042',
    title: 'Villa Aurore',
    status: 'in_progress',
    categoryName: 'Villa basse',
    modelName: 'Villa Aurore',
    city: 'Cocody, Abidjan',
    budgetMin: 55_000_000,
    budgetMax: 75_000_000,
    progress: 65,
    terrain: '600 m² – Lot 14, Cocody Riviera Palmeraie',
    terrainStatus: 'Acquis – Titre foncier disponible',
    startDate: '2024-10-01',
    estimatedEnd: '2025-06-30',
    team: [
      { name: 'Kouamé A.', role: 'Chef de projet' },
      { name: 'Traoré M.', role: 'Ingénieur BET' },
      { name: 'Diallo S.', role: 'Conducteur de travaux' },
    ],
    documents: [
      { type: 'plan', name: 'Plan d\'exécution RDC', date: '2024-09-20', icon: FileText },
      { type: 'plan', name: 'Plan d\'exécution Étage', date: '2024-09-20', icon: FileText },
      { type: 'photo', name: 'Photo terrain – État initial', date: '2024-09-25', icon: ImageIcon },
      { type: 'photo', name: 'Fondations – Avancement 100%', date: '2024-11-10', icon: ImageIcon },
      { type: 'contrat', name: 'Contrat de construction', date: '2024-09-30', icon: FileCheck },
      { type: 'facture', name: 'Facture acompte 30%', date: '2024-10-05', icon: Receipt },
    ],
    messages: [
      { id: 'm1', sender: 'Kouamé A.', senderRole: 'Chef de projet', text: 'Bonjour, les fondations sont terminées. Nous passons à l\'élévation cette semaine.', time: '10:30', isOwn: false },
      { id: 'm2', sender: 'Vous', senderRole: 'Client', text: 'Excellent ! Merci pour le suivi. Quand pouvons-nous visiter ?', time: '10:45', isOwn: true },
      { id: 'm3', sender: 'Kouamé A.', senderRole: 'Chef de projet', text: 'Une visite est prévue vendredi à 10h. Je vous enverrai la confirmation.', time: '11:02', isOwn: false },
      { id: 'm4', sender: 'Vous', senderRole: 'Client', text: 'Parfait, je serai présent. Merci !', time: '11:05', isOwn: true },
    ],
    quotes: [
      { id: 'q1', label: 'Devis initial – Construction villa', amount: 62_500_000, status: 'accepted', date: '2024-09-15' },
      { id: 'q2', label: 'Avenant piscine', amount: 8_500_000, status: 'pending', date: '2024-12-01' },
    ],
    phases: [
      { name: 'Études & Permis', status: 'done', progress: 100 },
      { name: 'Fondations', status: 'done', progress: 100 },
      { name: 'Élévation & Maçonnerie', status: 'done', progress: 100 },
      { name: 'Toiture & Charpente', status: 'in_progress', progress: 60 },
      { name: 'Second œuvre', status: 'pending', progress: 0 },
      { name: 'Finitions & Livraison', status: 'pending', progress: 0 },
    ],
    photos: [
      { id: 'p1', caption: 'Terrain brut – Vue sud', date: '2024-09-25' },
      { id: 'p2', caption: 'Fondations terminées', date: '2024-11-10' },
      { id: 'p3', caption: 'Élévation – Mur RDC', date: '2024-12-05' },
      { id: 'p4', caption: 'Élévation – Mur Étage', date: '2025-01-02' },
    ],
  },
  'prj-002': {
    referenceNumber: 'BTP-2024-0058',
    title: 'Duplex Horizon',
    status: 'quote_sent',
    categoryName: 'Duplex',
    modelName: 'Duplex Horizon',
    city: 'Riviera, Abidjan',
    budgetMin: 85_000_000,
    budgetMax: 120_000_000,
    progress: 15,
    terrain: '450 m² – Riviera Golf',
    terrainStatus: 'En cours d\'acquisition',
    startDate: '2025-02-15',
    estimatedEnd: '2026-02-15',
    team: [
      { name: 'Bamba K.', role: 'Chef de projet' },
    ],
    documents: [
      { type: 'plan', name: 'Plan masse', date: '2024-12-01', icon: FileText },
      { type: 'contrat', name: 'Contrat de réservation', date: '2024-11-25', icon: FileCheck },
    ],
    messages: [
      { id: 'm1', sender: 'Bamba K.', senderRole: 'Chef de projet', text: 'Le devis est prêt pour votre duplex. N\'hésitez pas à le consulter.', time: '14:00', isOwn: false },
    ],
    quotes: [
      { id: 'q1', label: 'Devis duplex', amount: 98_000_000, status: 'pending', date: '2025-01-08' },
    ],
    phases: [
      { name: 'Études & Permis', status: 'in_progress', progress: 40 },
      { name: 'Fondations', status: 'pending', progress: 0 },
      { name: 'Élévation & Maçonnerie', status: 'pending', progress: 0 },
      { name: 'Toiture & Charpente', status: 'pending', progress: 0 },
      { name: 'Second œuvre', status: 'pending', progress: 0 },
      { name: 'Finitions & Livraison', status: 'pending', progress: 0 },
    ],
    photos: [],
  },
  'prj-003': {
    referenceNumber: 'BTP-2025-0003',
    title: 'Projet résidentiel Bingerville',
    status: 'draft',
    categoryName: 'Villa basse',
    modelName: 'Villa Émeraude',
    city: 'Bingerville',
    budgetMin: 30_000_000,
    budgetMax: 45_000_000,
    progress: 0,
    terrain: 'Non défini',
    terrainStatus: 'À déterminer',
    startDate: 'Non défini',
    estimatedEnd: 'Non défini',
    team: [],
    documents: [],
    messages: [],
    quotes: [],
    phases: [
      { name: 'Études & Permis', status: 'pending', progress: 0 },
      { name: 'Fondations', status: 'pending', progress: 0 },
      { name: 'Élévation & Maçonnerie', status: 'pending', progress: 0 },
      { name: 'Toiture & Charpente', status: 'pending', progress: 0 },
      { name: 'Second œuvre', status: 'pending', progress: 0 },
      { name: 'Finitions & Livraison', status: 'pending', progress: 0 },
    ],
    photos: [],
  },
  'prj-004': {
    referenceNumber: 'BTP-2023-0018',
    title: 'Immeuble Élysée',
    status: 'delivered',
    categoryName: 'Immeuble R+',
    modelName: 'Immeuble Élysée',
    city: 'Plateau, Abidjan',
    budgetMin: 350_000_000,
    budgetMax: 500_000_000,
    progress: 100,
    terrain: '800 m² – Plateau',
    terrainStatus: 'Acquis',
    startDate: '2023-08-01',
    estimatedEnd: '2024-08-01',
    team: [
      { name: 'Koné M.', role: 'Chef de projet' },
      { name: 'Ouattara F.', role: 'Ingénieur BET' },
    ],
    documents: [
      { type: 'plan', name: 'Plans définitifs', date: '2023-07-15', icon: FileText },
      { type: 'contrat', name: 'Contrat de construction', date: '2023-07-20', icon: FileCheck },
      { type: 'facture', name: 'Facture solde', date: '2024-07-30', icon: Receipt },
      { type: 'photo', name: 'Livraison – Vue extérieure', date: '2024-08-20', icon: ImageIcon },
    ],
    messages: [
      { id: 'm1', sender: 'Koné M.', senderRole: 'Chef de projet', text: 'L\'immeuble est livré ! Tous les contrôles sont conformes.', time: '09:00', isOwn: false },
      { id: 'm2', sender: 'Vous', senderRole: 'Client', text: 'Merci beaucoup pour tout le travail accompli !', time: '09:30', isOwn: true },
    ],
    quotes: [
      { id: 'q1', label: 'Devis immeuble R+', amount: 420_000_000, status: 'accepted', date: '2023-07-10' },
    ],
    phases: [
      { name: 'Études & Permis', status: 'done', progress: 100 },
      { name: 'Fondations', status: 'done', progress: 100 },
      { name: 'Élévation & Maçonnerie', status: 'done', progress: 100 },
      { name: 'Toiture & Charpente', status: 'done', progress: 100 },
      { name: 'Second œuvre', status: 'done', progress: 100 },
      { name: 'Finitions & Livraison', status: 'done', progress: 100 },
    ],
    photos: [
      { id: 'p1', caption: 'Livraison – Façade principale', date: '2024-08-20' },
      { id: 'p2', caption: 'Livraison – Hall d\'entrée', date: '2024-08-20' },
    ],
  },
  'prj-005': {
    referenceNumber: 'BTP-2024-0071',
    title: 'Villa Émeraude',
    status: 'in_progress',
    categoryName: 'Villa basse',
    modelName: 'Villa Émeraude',
    city: 'Yamoussoukro',
    budgetMin: 30_000_000,
    budgetMax: 45_000_000,
    progress: 40,
    terrain: '400 m² – Zone résidentielle',
    terrainStatus: 'Acquis',
    startDate: '2024-11-01',
    estimatedEnd: '2025-07-01',
    team: [
      { name: 'Diarra I.', role: 'Chef de projet' },
      { name: 'Coulibaly A.', role: 'Conducteur de travaux' },
    ],
    documents: [
      { type: 'plan', name: 'Plan villa', date: '2024-10-15', icon: FileText },
      { type: 'photo', name: 'Début des travaux', date: '2024-11-05', icon: ImageIcon },
      { type: 'contrat', name: 'Contrat de construction', date: '2024-10-25', icon: FileCheck },
    ],
    messages: [
      { id: 'm1', sender: 'Diarra I.', senderRole: 'Chef de projet', text: 'Les travaux de fondation sont bien avancés. Tout se passe bien.', time: '16:00', isOwn: false },
    ],
    quotes: [
      { id: 'q1', label: 'Devis villa standard', amount: 35_500_000, status: 'accepted', date: '2024-10-10' },
    ],
    phases: [
      { name: 'Études & Permis', status: 'done', progress: 100 },
      { name: 'Fondations', status: 'done', progress: 100 },
      { name: 'Élévation & Maçonnerie', status: 'in_progress', progress: 50 },
      { name: 'Toiture & Charpente', status: 'pending', progress: 0 },
      { name: 'Second œuvre', status: 'pending', progress: 0 },
      { name: 'Finitions & Livraison', status: 'pending', progress: 0 },
    ],
    photos: [
      { id: 'p1', caption: 'Terrassement', date: '2024-11-05' },
      { id: 'p2', caption: 'Fondations en cours', date: '2024-11-20' },
    ],
  },
};

// ── Helper ─────────────────────────────────────────────────

function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'in_progress' || status === 'accepted') return 'default';
  if (status === 'draft') return 'secondary';
  if (status === 'delivered') return 'outline';
  return 'secondary';
}

function getQuoteStatusBadge(status: string) {
  if (status === 'accepted') return { label: 'Accepté', variant: 'outline' as const };
  if (status === 'refused') return { label: 'Refusé', variant: 'destructive' as const };
  return { label: 'En attente', variant: 'secondary' as const };
}

function detailFromStoredProject(project: ProjectData): ProjectDetailData {
  const startDate = project.createdAt?.slice(0, 10) || 'Non défini';
  const missingInfoDate = project.missingInfoRequestedAt
    ? new Date(project.missingInfoRequestedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : 'Maintenant';

  return {
    projectId: project.id,
    referenceNumber: project.referenceNumber,
    title: project.title || project.modelName || 'Projet BTP',
    status: project.status,
    categoryName: project.categoryName || 'Projet BTP',
    modelName: project.modelName || project.categoryName || 'À définir',
    city: project.city || 'Non défini',
    budgetMin: project.budgetMin || project.budgetMax || 0,
    budgetMax: project.budgetMax || project.budgetMin || 0,
    progress: project.progress ?? 0,
    terrain: String(project.formData?.landSurface || project.formData?.surface || 'À préciser'),
    terrainStatus: String(project.formData?.landStatus || 'À confirmer'),
    startDate,
    estimatedEnd: String(project.formData?.timeline || 'À planifier'),
    team: project.assignedTo ? [{ name: project.assignedTo, role: 'Responsable dossier' }] : [],
    documents: (project.documents ?? []).map(document => ({
      type: document.type,
      name: document.name,
      date: document.date,
      icon: document.type.includes('photo') || document.type.includes('image') ? ImageIcon : FileText,
    })),
    messages: project.missingInfo ? [
      {
        id: `info-${project.id}`,
        sender: 'Administration',
        senderRole: 'Chargé de dossier',
        text: project.missingInfo,
        time: missingInfoDate,
        isOwn: false,
      },
    ] : [],
    quotes: (project.quotes ?? []).map(quote => ({
      id: quote.id,
      label: quote.label,
      amount: quote.amount,
      status: quote.status === 'accepted' || quote.status === 'refused' ? quote.status : 'pending',
      date: quote.date,
    })),
    phases: [
      { name: 'Demande reçue', status: 'done', progress: 100 },
      { name: 'Vérification', status: project.status === 'submitted' ? 'in_progress' : 'done', progress: project.status === 'submitted' ? 40 : 100 },
      { name: 'Étude & devis', status: ['quote_sent', 'accepted', 'planning', 'in_progress', 'delivered'].includes(project.status) ? 'done' : 'pending', progress: ['quote_sent', 'accepted', 'planning', 'in_progress', 'delivered'].includes(project.status) ? 100 : 0 },
      { name: 'Planification', status: project.status === 'planning' ? 'in_progress' : ['in_progress', 'delivered'].includes(project.status) ? 'done' : 'pending', progress: project.status === 'planning' ? 50 : ['in_progress', 'delivered'].includes(project.status) ? 100 : 0 },
      { name: 'Chantier', status: project.status === 'in_progress' ? 'in_progress' : project.status === 'delivered' ? 'done' : 'pending', progress: project.status === 'in_progress' ? Math.max(project.progress, 25) : project.status === 'delivered' ? 100 : 0 },
      { name: 'Livraison', status: project.status === 'delivered' ? 'done' : 'pending', progress: project.status === 'delivered' ? 100 : 0 },
    ],
    photos: [],
  };
}

const PROPOSAL_STORAGE_PREFIX = 'bati-ci-validated-proposal';

function getProposalStorageKey(referenceNumber: string) {
  return `${PROPOSAL_STORAGE_PREFIX}:${referenceNumber}`;
}

function buildVisualProposals(data: ProjectDetailData): VisualProposal[] {
  const baseEstimate = `${FORMAT_XOF(data.budgetMin)} – ${FORMAT_XOF(data.budgetMax)}`;
  const category = data.categoryName.toLowerCase();

  if (category.includes('vrd') || category.includes('voirie') || category.includes('route')) {
    return [
      {
        id: `${data.referenceNumber}-vrd-voirie`,
        title: 'Voirie et accès opérationnels',
        category: 'VRD',
        image: '/images/road-1.png',
        description: 'Tracé de voirie, circulation chantier, bordures, caniveaux et accès livrables par phase.',
        estimate: baseEstimate,
        duration: '6 à 12 semaines',
        confidence: 'Optimisé pour sites actifs',
        deliverable: 'Plan VRD, phasage, liste des ouvrages et repères terrain.',
        strengths: ['Accès chantier lisible', 'Drainage intégré', 'Maintenance anticipée'],
      },
      {
        id: `${data.referenceNumber}-vrd-hydraulique`,
        title: 'Réseaux hydrauliques maîtrisés',
        category: 'VRD',
        image: '/images/hydraulique-1.png',
        description: 'Proposition centrée sur l’assainissement, les regards, les pentes et la continuité des écoulements.',
        estimate: baseEstimate,
        duration: '4 à 10 semaines',
        confidence: 'Priorité conformité',
        deliverable: 'Schéma réseaux, points de contrôle et fiches d’exécution.',
        strengths: ['Assainissement structuré', 'Pentes vérifiables', 'Contrôle simplifié'],
      },
      {
        id: `${data.referenceNumber}-vrd-chantier`,
        title: 'Préparation complète du site',
        category: 'VRD',
        image: '/images/chantier-1.png',
        description: 'Organisation terrain, base vie, accès fournisseurs et zones de stockage pour lancer les travaux proprement.',
        estimate: baseEstimate,
        duration: '2 à 6 semaines',
        confidence: 'Démarrage rapide',
        deliverable: 'Plan d’installation, zones sensibles et planning de mobilisation.',
        strengths: ['Flux sécurisés', 'Stockage cadré', 'Démarrage maîtrisé'],
      },
    ];
  }

  if (category.includes('immeuble')) {
    return [
      {
        id: `${data.referenceNumber}-rplus-facade`,
        title: 'Façade d’immeuble R+ premium',
        category: 'Immeuble R+',
        image: '/images/immeuble-1.png',
        description: 'Volume vertical sobre, rez-de-chaussée lisible, trame de façade régulière et accès principal valorisé.',
        estimate: baseEstimate,
        duration: '10 à 18 mois',
        confidence: 'Recommandée pour rendement locatif',
        deliverable: 'Vue façade, principe structurel, estimation et planning macro.',
        strengths: ['Façade durable', 'Circulations claires', 'Bonne densité utile'],
      },
      {
        id: `${data.referenceNumber}-rplus-bureaux`,
        title: 'Plateaux mixtes et services',
        category: 'Immeuble R+',
        image: '/images/bureau-1.png',
        description: 'Variante pour intégrer bureaux, commerces ou espaces communs selon les besoins du programme.',
        estimate: baseEstimate,
        duration: '9 à 16 mois',
        confidence: 'Flexible programme mixte',
        deliverable: 'Zoning des plateaux, priorités techniques et arbitrages budget.',
        strengths: ['Espaces modulables', 'Hall valorisé', 'Exploitation facilitée'],
      },
      {
        id: `${data.referenceNumber}-rplus-plan`,
        title: 'Plan technique optimisé',
        category: 'Immeuble R+',
        image: '/images/plan-1.png',
        description: 'Lecture claire des circulations, noyaux, appartements et réservations techniques avant validation finale.',
        estimate: baseEstimate,
        duration: '3 à 6 semaines d’études',
        confidence: 'Priorité exécution',
        deliverable: 'Plans de principe, surfaces utiles et points BET à arbitrer.',
        strengths: ['Noyaux rationnels', 'Surfaces mieux cadrées', 'Études plus rapides'],
      },
    ];
  }

  if (category.includes('duplex')) {
    return [
      {
        id: `${data.referenceNumber}-duplex-facade`,
        title: 'Duplex familial contemporain',
        category: 'Maison basse / duplex',
        image: '/images/duplex-1.png',
        description: 'Façade équilibrée, volumes protégés du soleil et espaces familiaux organisés autour du séjour.',
        estimate: baseEstimate,
        duration: '8 à 12 mois',
        confidence: 'Confort familial',
        deliverable: 'Vue extérieure, intentions matières, estimation et jalons clés.',
        strengths: ['Séjour généreux', 'Façade sobre', 'Circulation familiale'],
      },
      {
        id: `${data.referenceNumber}-duplex-interieur`,
        title: 'Ambiance intérieure finitions',
        category: 'Second œuvre',
        image: '/images/interieur-1.png',
        description: 'Choix de finitions, éclairage, revêtements et menuiseries pour valider le niveau de standing.',
        estimate: baseEstimate,
        duration: '8 à 14 semaines',
        confidence: 'Décision rapide des finitions',
        deliverable: 'Moodboard, lots finition et points de validation client.',
        strengths: ['Finitions cohérentes', 'Budget lisible', 'Choix client cadrés'],
      },
      {
        id: `${data.referenceNumber}-duplex-plan`,
        title: 'Plan de distribution précis',
        category: 'Études',
        image: '/images/plan-1.png',
        description: 'Distribution des pièces, emplacements techniques et optimisation des surfaces selon le terrain.',
        estimate: baseEstimate,
        duration: '2 à 4 semaines d’études',
        confidence: 'Base claire pour devis',
        deliverable: 'Plan, surfaces, hypothèses et points ouverts.',
        strengths: ['Pièces lisibles', 'Technique anticipée', 'Devis plus fiable'],
      },
    ];
  }

  return [
    {
      id: `${data.referenceNumber}-maison-facade`,
      title: 'Maison basse contemporaine',
      category: 'Maison basse',
      image: '/images/villa-1.png',
      description: 'Proposition claire pour une villa basse, avec façade élégante, terrasse protégée et implantation simple à exécuter.',
      estimate: baseEstimate,
      duration: '6 à 10 mois',
      confidence: 'Recommandée pour budget maîtrisé',
      deliverable: 'Vue façade, principes de matériaux, enveloppe budget et phasage.',
      strengths: ['Lecture immédiate', 'Coûts mieux cadrés', 'Entretien simple'],
    },
    {
      id: `${data.referenceNumber}-maison-interieur`,
      title: 'Finitions intérieures premium',
      category: 'Second œuvre',
      image: '/images/interieur-1.png',
      description: 'Ambiance intérieure pour arbitrer les lots peinture, plafonds, revêtements, plomberie et équipements.',
      estimate: baseEstimate,
      duration: '6 à 12 semaines',
      confidence: 'Idéal avant commande',
      deliverable: 'Planche finitions, lots concernés et liste de décisions client.',
      strengths: ['Choix concrets', 'Lots séparés', 'Budget finition lisible'],
    },
    {
      id: `${data.referenceNumber}-maison-plan`,
      title: 'Plan optimisé du logement',
      category: 'Études',
      image: '/images/plan-1.png',
      description: 'Distribution claire des chambres, pièces d’eau, cuisine, terrasse et réservations techniques.',
      estimate: baseEstimate,
      duration: '2 à 4 semaines d’études',
      confidence: 'Base technique solide',
      deliverable: 'Plan de principe, surfaces et options à confirmer.',
      strengths: ['Surfaces utiles', 'Technique anticipée', 'Validation rapide'],
    },
  ];
}

// ── Sub-views ──────────────────────────────────────────────

function ResumeTab({ data }: { data: ProjectDetailData }) {
  const infoItems = [
    { icon: Building2, label: 'Type', value: data.categoryName },
    { icon: MapPin, label: 'Localisation', value: data.city },
    { icon: Layers, label: 'Modèle', value: data.modelName },
    { icon: Wallet, label: 'Budget estimé', value: `${FORMAT_XOF(data.budgetMin)} – ${FORMAT_XOF(data.budgetMax)}` },
    { icon: Calendar, label: 'Début prévu', value: data.startDate },
    { icon: Calendar, label: 'Fin estimée', value: data.estimatedEnd },
  ];

  return (
    <div className="space-y-4">
      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {infoItems.map((item) => (
          <Card key={item.label} className="py-0 gap-0">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="size-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <item.icon className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{item.label}</p>
                <p className="text-sm font-medium mt-0.5 break-words">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Terrain */}
      <Card className="py-0 gap-0">
        <CardContent className="p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Terrain</h4>
          <p className="text-sm font-medium mt-2">{data.terrain}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <div className={`size-2 rounded-full ${data.terrainStatus.includes('Acquis') ? 'bg-foreground' : 'bg-muted-foreground/40'}`} />
            <span className="text-xs text-muted-foreground">{data.terrainStatus}</span>
          </div>
        </CardContent>
      </Card>

      {/* Team */}
      {data.team.length > 0 && (
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Users className="size-3.5" />
              Équipe assignée
            </h4>
            <div className="mt-3 space-y-2.5">
              {data.team.map((member) => (
                <div key={member.name} className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-[11px] text-muted-foreground">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DocumentsTab({ data, onUpload }: { data: ProjectDetailData; onUpload?: (documents: ProjectDocumentData[]) => void }) {
  const [uploadedByProject, setUploadedByProject] = useState<Record<string, ProjectDetailData['documents']>>({});
  const inputId = `document-upload-${data.referenceNumber.replace(/[^a-z0-9]/gi, '-')}`;
  const uploadedDocuments = uploadedByProject[data.referenceNumber] ?? [];
  const documents = [...uploadedDocuments, ...data.documents];

  const docTypeLabels: Record<string, string> = {
    plan: 'Plans',
    photo: 'Photos',
    contrat: 'Contrats',
    facture: 'Factures',
    document: 'Documents importés',
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    if (files.length === 0) return;

    const uploadDate = new Date().toISOString().slice(0, 10);
    const uploadedRecords: ProjectDocumentData[] = files.map((file) => ({
      id: `upload-${data.referenceNumber}-${file.name}-${Date.now()}`,
      type: file.type.startsWith('image/') ? 'photo' : 'document',
      name: file.name,
      date: uploadDate,
      size: file.size,
    }));
    const uploadedDocs: ProjectDetailData['documents'] = uploadedRecords.map((document) => ({
      type: document.type,
      name: document.name,
      date: document.date,
      icon: document.type === 'photo' ? ImageIcon : FileText,
    }));

    if (onUpload) {
      onUpload(uploadedRecords);
    } else {
      setUploadedByProject(prev => ({
        ...prev,
        [data.referenceNumber]: [...uploadedDocs, ...(prev[data.referenceNumber] ?? [])],
      }));
    }
    event.currentTarget.value = '';
  };

  const grouped = documents.reduce<Record<string, ProjectDetailData['documents']>>((acc, doc) => {
    const key = doc.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(doc);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <input
        id={inputId}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        className="sr-only"
        onChange={handleUpload}
      />
      <Button variant="outline" className="w-full gap-2 border-dashed cursor-pointer" asChild>
        <label htmlFor={inputId}>
          <Upload className="size-4" />
          Importer un document
        </label>
      </Button>

      {Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <FileText className="size-8 text-muted-foreground/30" />
          <p className="mt-3 text-sm text-muted-foreground">Aucun document pour le moment.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([type, docs]) => (
          <div key={type}>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {docTypeLabels[type] || type} ({docs.length})
            </h4>
            <div className="space-y-2">
              {docs.map((doc, i) => (
                <Card key={`${doc.name}-${doc.date}-${i}`} className="py-0 gap-0">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <doc.icon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-[11px] text-muted-foreground">{doc.date}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function MessagesTab({ data }: { data: ProjectDetailData }) {
  const [newMessage, setNewMessage] = useState('');
  const [localMessages, setLocalMessages] = useState(data.messages);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const msg = {
      id: `m-${Date.now()}`,
      sender: 'Vous',
      senderRole: 'Client',
      text: newMessage.trim(),
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
    };
    setLocalMessages(prev => [...prev, msg]);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-[60vh]">
      {/* Messages list */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-3">
        {localMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="size-8 text-muted-foreground/30" />
            <p className="mt-3 text-sm text-muted-foreground">Aucun message pour le moment.</p>
          </div>
        ) : (
          localMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  msg.isOwn
                    ? 'bg-foreground text-background rounded-br-md'
                    : 'bg-muted rounded-bl-md'
                }`}
              >
                {!msg.isOwn && (
                  <p className="text-[10px] font-semibold mb-0.5 opacity-60">{msg.sender} – {msg.senderRole}</p>
                )}
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p className={`text-[10px] mt-1 ${msg.isOwn ? 'text-right opacity-60' : 'opacity-40'}`}>
                  {msg.time}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="border-t pt-3 flex gap-2">
        <Textarea
          placeholder="Votre message..."
          className="min-h-[44px] max-h-24 resize-none text-sm"
          rows={1}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          size="icon"
          className="h-11 w-11 flex-shrink-0"
          onClick={handleSend}
          disabled={!newMessage.trim()}
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function ProposalsTab({ data }: { data: ProjectDetailData }) {
  const proposals = useMemo(() => buildVisualProposals(data), [data]);
  const storageKey = getProposalStorageKey(data.referenceNumber);
  const [selectedId, setSelectedId] = useState(proposals[0]?.id ?? '');
  const [validatedId, setValidatedId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const savedId = window.localStorage.getItem(storageKey);
    return savedId && proposals.some((proposal) => proposal.id === savedId) ? savedId : null;
  });

  const selectedProposal = proposals.find((proposal) => proposal.id === selectedId) ?? proposals[0];
  const validatedProposal = proposals.find((proposal) => proposal.id === validatedId);

  const handleValidate = () => {
    if (!selectedProposal) return;
    window.localStorage.setItem(storageKey, selectedProposal.id);
    setValidatedId(selectedProposal.id);
  };

  if (!selectedProposal) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <ImageIcon className="size-8 text-muted-foreground/30" />
        <p className="mt-3 text-sm text-muted-foreground">Aucune proposition visuelle disponible.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="py-0 gap-0 overflow-hidden">
        <div className="relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-[21/9] bg-muted">
          <NextImage
            src={selectedProposal.image}
            alt={selectedProposal.title}
            fill
            className="object-cover grayscale"
            sizes="(min-width: 1024px) 1120px, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge className="bg-white text-black hover:bg-white">{selectedProposal.category}</Badge>
              <span className="rounded-md border border-white/35 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/85">
                {selectedProposal.confidence}
              </span>
            </div>
            <h3 className="text-lg sm:text-2xl font-semibold leading-tight">{selectedProposal.title}</h3>
            <p className="mt-2 max-w-3xl text-xs sm:text-sm text-white/82 leading-relaxed">
              {selectedProposal.description}
            </p>
          </div>
        </div>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Budget indicatif</p>
              <p className="mt-1 text-sm font-semibold">{selectedProposal.estimate}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Délai prévu</p>
              <p className="mt-1 text-sm font-semibold">{selectedProposal.duration}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Livrable client</p>
              <p className="mt-1 text-sm font-semibold">{selectedProposal.deliverable}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto gap-2" asChild>
              <a href={selectedProposal.image} download={`${selectedProposal.id}.png`}>
                <Download className="size-4" />
                Télécharger l’image
              </a>
            </Button>
            <Button
              className="w-full sm:w-auto gap-2"
              onClick={handleValidate}
              disabled={validatedId === selectedProposal.id}
            >
              {validatedId === selectedProposal.id ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
              {validatedId === selectedProposal.id ? 'Proposition validée' : 'Valider cette proposition'}
            </Button>
          </div>

          {validatedProposal && (
            <div className="mt-4 rounded-lg border border-foreground/20 bg-muted/40 p-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="size-4 mt-0.5 text-foreground" />
                <div>
                  <p className="text-sm font-semibold">Choix client enregistré pour {data.referenceNumber}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Proposition retenue : {validatedProposal.title}. Cette validation reste disponible sur cet appareil pour poursuivre l’échange avec l’équipe projet.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {proposals.map((proposal) => {
          const isSelected = proposal.id === selectedProposal.id;
          const isValidated = proposal.id === validatedId;

          return (
            <Card
              key={proposal.id}
              className={`py-0 gap-0 overflow-hidden transition ${
                isSelected ? 'border-foreground shadow-md' : 'hover:border-foreground/45'
              }`}
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setSelectedId(proposal.id)}
                aria-pressed={isSelected}
              >
                <div className="relative aspect-[16/10] bg-muted">
                  <NextImage
                    src={proposal.image}
                    alt={proposal.title}
                    fill
                    className="object-cover grayscale"
                    sizes="(min-width: 768px) 33vw, 100vw"
                  />
                  <div className="absolute left-2 top-2 flex gap-1.5">
                    {isValidated && (
                      <Badge className="bg-white text-black hover:bg-white">
                        <CheckCircle2 className="size-3" />
                        Validée
                      </Badge>
                    )}
                    {isSelected && !isValidated && (
                      <Badge variant="secondary">
                        <Eye className="size-3" />
                        Consultée
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">{proposal.category}</p>
                  <h4 className="mt-1 text-sm font-semibold leading-tight">{proposal.title}</h4>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {proposal.strengths.map((strength) => (
                      <span
                        key={strength}
                        className="rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground"
                      >
                        {strength}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function DevisTab({
  data,
  onQuoteAction,
}: {
  data: ProjectDetailData;
  onQuoteAction?: (quoteId: string, action: 'accepted' | 'refused') => void;
}) {
  const [quotes, setQuotes] = useState(data.quotes);
  const activeQuotes = onQuoteAction ? data.quotes : quotes;

  const handleAction = (quoteId: string, action: 'accepted' | 'refused') => {
    if (onQuoteAction) {
      onQuoteAction(quoteId, action);
      return;
    }
    setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status: action as 'accepted' | 'refused' | 'pending' } : q));
  };

  if (activeQuotes.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <Receipt className="size-8 text-muted-foreground/30" />
        <p className="mt-3 text-sm text-muted-foreground">Aucun devis disponible.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeQuotes.map((quote) => {
        const badge = getQuoteStatusBadge(quote.status);
        return (
          <motion.div
            key={quote.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="py-0 gap-0">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold">{quote.label}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{quote.date}</p>
                  </div>
                  <Badge variant={badge.variant} className="text-[10px] flex-shrink-0">
                    {badge.label}
                  </Badge>
                </div>
                <p className="text-lg font-bold mt-3">{FORMAT_XOF(quote.amount)}</p>

                {quote.status === 'pending' && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5 text-xs"
                      onClick={() => handleAction(quote.id, 'accepted')}
                    >
                      <Check className="size-3.5" />
                      Accepter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 text-xs"
                      onClick={() => handleAction(quote.id, 'refused')}
                    >
                      <X className="size-3.5" />
                      Refuser
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

function ChantierTab({ data }: { data: ProjectDetailData }) {
  return (
    <div className="space-y-6">
      {/* Progress phases */}
      <Card className="py-0 gap-0">
        <CardContent className="p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-4">
            <ClipboardCheck className="size-3.5" />
            Phases du chantier
          </h4>
          <div className="space-y-4">
            {data.phases.map((phase, i) => (
              <div key={phase.name}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        phase.status === 'done'
                          ? 'bg-foreground text-background'
                          : phase.status === 'in_progress'
                          ? 'border-2 border-foreground text-foreground'
                          : 'border-2 border-muted-foreground/30 text-muted-foreground/40'
                      }`}
                    >
                      {phase.status === 'done' ? <Check className="size-3" /> : i + 1}
                    </div>
                    <span className={`font-medium ${phase.status === 'pending' ? 'text-muted-foreground' : ''}`}>
                      {phase.name}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{phase.progress}%</span>
                </div>
                {phase.status !== 'pending' && (
                  <Progress value={phase.progress} className="h-1.5 ml-7" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Photo gallery */}
      <Card className="py-0 gap-0">
        <CardContent className="p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-4">
            <Camera className="size-3.5" />
            Photos du chantier
          </h4>
          {data.photos.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Camera className="size-7 text-muted-foreground/30" />
              <p className="mt-2 text-xs text-muted-foreground">Aucune photo disponible.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {data.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="aspect-[4/3] rounded-lg bg-muted flex items-center justify-center overflow-hidden relative group"
                >
                  <Camera className="size-6 text-muted-foreground/20" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-2">
                    <p className="text-[10px] text-white font-medium leading-tight">{photo.caption}</p>
                    <p className="text-[9px] text-white/60 mt-0.5">{photo.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reports */}
      <Card className="py-0 gap-0">
        <CardContent className="p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
            <AlertCircle className="size-3.5" />
            Rapports de chantier
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <FileText className="size-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Rapport hebdomadaire S02</p>
                <p className="text-[11px] text-muted-foreground">2025-01-06 – 2025-01-10</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <FileText className="size-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Rapport hebdomadaire S01</p>
                <p className="text-[11px] text-muted-foreground">2024-12-30 – 2025-01-03</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main View ──────────────────────────────────────────────

type TabValue = 'resume' | 'propositions' | 'documents' | 'messages' | 'devis' | 'chantier';

export function ProjectDetailView() {
  const { goBack, viewParams, userProjects, addProjectDocuments, updateProjectQuoteStatus } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabValue>('resume');

  const projectId = viewParams?.id || 'prj-001';
  const storedProject = userProjects.find(project => project.id === projectId || project.referenceNumber === projectId);
  const data = storedProject ? detailFromStoredProject(storedProject) : PROJECT_MAP[projectId] || PROJECT_MAP['prj-001'];

  const tabs = [
    { value: 'resume' as const, label: 'Résumé' },
    { value: 'propositions' as const, label: 'Propositions' },
    { value: 'documents' as const, label: 'Documents' },
    { value: 'messages' as const, label: 'Messages' },
    { value: 'devis' as const, label: 'Devis' },
    { value: 'chantier' as const, label: 'Chantier' },
  ];

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="size-9" onClick={goBack}>
            <ArrowLeft className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate">{data.referenceNumber}</p>
            <p className="text-sm font-semibold truncate">{data.title}</p>
          </div>
          <Badge variant={getStatusVariant(data.status)} className="text-[10px] flex-shrink-0">
            {PROJECT_STATUS_LABELS[data.status] || data.status}
          </Badge>
        </div>

        {/* Progress */}
        <div className="max-w-6xl mx-auto px-4 pb-3">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-muted-foreground">Avancement global</span>
            <span className="font-medium">{data.progress}%</span>
          </div>
          <Progress value={data.progress} className="h-1.5" />
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 pb-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
            <TabsList className="w-full h-auto min-h-10 justify-start overflow-x-auto p-0.5 bg-muted">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="h-9 min-w-[92px] flex-none px-3 text-xs sm:min-w-0 sm:flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-6xl mx-auto px-4 pt-4 pb-28 md:pb-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'resume' && <ResumeTab data={data} />}
            {activeTab === 'propositions' && <ProposalsTab data={data} />}
            {activeTab === 'documents' && (
              <DocumentsTab
                data={data}
                onUpload={storedProject ? (documents) => addProjectDocuments(storedProject.id, documents) : undefined}
              />
            )}
            {activeTab === 'messages' && <MessagesTab data={data} />}
            {activeTab === 'devis' && (
              <DevisTab
                data={data}
                onQuoteAction={storedProject ? (quoteId, action) => updateProjectQuoteStatus(storedProject.id, quoteId, action) : undefined}
              />
            )}
            {activeTab === 'chantier' && <ChantierTab data={data} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
