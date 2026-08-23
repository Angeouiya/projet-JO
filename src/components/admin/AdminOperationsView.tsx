'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Download, Eye, FileSearch, FolderOpen, FolderPlus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { FORMAT_XOF } from '@/types';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { useAppStore } from '@/stores/app-store';
import {
  projectScheduleModeLabel,
  projectScheduleStatusLabel,
  projectScheduleTypeLabel,
} from '@/lib/project-schedule';
import { AdminCreateProjectDialog } from './AdminCreateProjectDialog';
import type { NotificationData, ProjectData } from '@/types';

type OperationRow = {
  id: string;
  title: string;
  reference: string;
  owner: string;
  status: string;
  date: string;
  amount?: number;
  city?: string;
  tags: string[];
  projectId?: string;
  source: 'workflow' | 'reference';
};

type LinkedProjectDefaults = ReturnType<typeof projectDefaultsFromRow>;

type ModuleCopy = {
  title: string;
  eyebrow: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
};

const MODULE_COPY: Record<string, ModuleCopy> = {
  prospects: {
    title: 'Prospects',
    eyebrow: 'Relation commerciale',
    description: 'Suivi des intentions, budgets et clients à qualifier avant ouverture de dossier.',
    emptyTitle: 'Aucun prospect visible',
    emptyDescription: 'Les nouvelles demandes qualifiées apparaîtront ici avec leur origine et leur priorité.',
  },
  forms: {
    title: 'Formulaires',
    eyebrow: 'Cadrage dynamique',
    description: 'Contrôle des formulaires par typologie : maison basse, immeuble R+, VRD et lots de travaux.',
    emptyTitle: 'Aucun formulaire actif',
    emptyDescription: 'Les formulaires publiés sont listés ici avec leur niveau de complétude.',
  },
  studies: {
    title: 'Études',
    eyebrow: 'Bureau technique',
    description: 'Dossiers en analyse technique, relevés, plans, métrés et arbitrages de faisabilité.',
    emptyTitle: 'Aucune étude en cours',
    emptyDescription: 'Les dossiers passés en étude apparaîtront ici avec leur responsable.',
  },
  estimates: {
    title: 'Estimations',
    eyebrow: 'Chiffrage',
    description: 'Budgets préparatoires et plages de coût avant transmission d’un devis client.',
    emptyTitle: 'Aucune estimation',
    emptyDescription: 'Les estimations issues des demandes et projets seront consultables ici.',
  },
  quotes: {
    title: 'Devis',
    eyebrow: 'Validation client',
    description: 'Devis créés, transmis, acceptés ou refusés, reliés aux dossiers client.',
    emptyTitle: 'Aucun devis',
    emptyDescription: 'Les devis envoyés depuis un dossier administrateur seront visibles ici.',
  },
  contracts: {
    title: 'Contrats',
    eyebrow: 'Engagement',
    description: 'Préparation et suivi des contrats après validation du devis par le client.',
    emptyTitle: 'Aucun contrat',
    emptyDescription: 'Les projets acceptés basculeront ici pour contractualisation.',
  },
  documents: {
    title: 'Documents',
    eyebrow: 'GED chantier',
    description: 'Pièces client, plans, devis, contrats et fichiers rattachés aux dossiers.',
    emptyTitle: 'Aucun document',
    emptyDescription: 'Les documents déposés par les clients ou l’équipe sont regroupés ici.',
  },
  appointments: {
    title: 'Rendez-vous',
    eyebrow: 'Planning commercial',
    description: 'Rendez-vous client et jalons de coordination à confirmer ou replanifier.',
    emptyTitle: 'Aucun rendez-vous',
    emptyDescription: 'Les rendez-vous programmés seront affichés avec leur dossier associé.',
  },
  visits: {
    title: 'Visites',
    eyebrow: 'Terrain',
    description: 'Visites techniques, relevés de terrain et contrôles avant démarrage.',
    emptyTitle: 'Aucune visite',
    emptyDescription: 'Les visites planifiées ou terminées apparaîtront dans ce module.',
  },
  sites: {
    title: 'Chantiers',
    eyebrow: 'Production',
    description: 'Suivi des chantiers en planification, exécution, correction et livraison.',
    emptyTitle: 'Aucun chantier actif',
    emptyDescription: 'Les projets acceptés puis planifiés alimenteront cette vue chantier.',
  },
  reports: {
    title: 'Rapports',
    eyebrow: 'Pilotage',
    description: 'Synthèses d’activité, conversion, avancement et points de vigilance.',
    emptyTitle: 'Aucun rapport',
    emptyDescription: 'Les rapports générés à partir du portefeuille seront listés ici.',
  },
  invoices: {
    title: 'Factures',
    eyebrow: 'Facturation',
    description: 'Factures pro forma, acomptes et appels de fonds liés aux contrats.',
    emptyTitle: 'Aucune facture',
    emptyDescription: 'Les factures émises depuis les contrats seront consultables ici.',
  },
  payments: {
    title: 'Paiements',
    eyebrow: 'Encaissement',
    description: 'Suivi des paiements attendus, reçus et à rapprocher.',
    emptyTitle: 'Aucun paiement',
    emptyDescription: 'Les paiements enregistrés apparaîtront avec leur statut de rapprochement.',
  },
  messages: {
    title: 'Messages',
    eyebrow: 'Communication',
    description: 'Conversations client et notes internes reliées aux dossiers.',
    emptyTitle: 'Aucun message',
    emptyDescription: 'Les échanges rattachés aux projets seront centralisés ici.',
  },
  notifications: {
    title: 'Notifications',
    eyebrow: 'Alertes',
    description: 'Notifications envoyées aux clients et alertes internes non lues.',
    emptyTitle: 'Aucune notification',
    emptyDescription: 'Les notifications de workflow seront affichées ici.',
  },
  teams: {
    title: 'Équipe',
    eyebrow: 'Ressources',
    description: 'Responsables, conducteurs de travaux, métreurs et équipes affectables.',
    emptyTitle: 'Aucun membre',
    emptyDescription: 'Les membres configurés seront affichés avec leur rôle opérationnel.',
  },
  roles: {
    title: 'Rôles et permissions',
    eyebrow: 'Sécurité',
    description: 'Matrice des rôles, accès admin et périmètres de modification.',
    emptyTitle: 'Aucun rôle',
    emptyDescription: 'Les rôles disponibles seront listés avec leurs permissions principales.',
  },
  statistics: {
    title: 'Statistiques',
    eyebrow: 'Analyse',
    description: 'Indicateurs consolidés sur demandes, devis, clients et conversion.',
    emptyTitle: 'Aucune statistique',
    emptyDescription: 'Les statistiques seront calculées à partir des dossiers disponibles.',
  },
  audit: {
    title: 'Journal d’activité',
    eyebrow: 'Traçabilité',
    description: 'Historique des actions client, admin, documentaires et statutaires.',
    emptyTitle: 'Aucune activité',
    emptyDescription: 'Les actions enregistrées dans les dossiers apparaîtront ici.',
  },
};

const REFERENCE_ROWS: Record<string, OperationRow[]> = {
  prospects: [
    row('prospect-1', 'Programme locatif R+', 'PRP-2026-014', 'Akwaba Invest', 'À qualifier', '2026-08-20', 240000000, 'Plateau', ['R+', 'Investisseur']),
    row('prospect-2', 'Lot finition villa', 'PRP-2026-013', 'Famille Kouassi', 'Relance', '2026-08-19', 18000000, 'Bingerville', ['Second œuvre']),
  ],
  forms: [
    row('form-1', 'Maison basse', 'FRM-MB', 'Plateforme', 'Publié', '2026-08-21', undefined, undefined, ['Terrain', 'Budget', 'Finitions']),
    row('form-2', 'Immeuble R+', 'FRM-RP', 'Plateforme', 'Publié', '2026-08-21', undefined, undefined, ['Niveaux R+', 'Ascenseur', 'Parking']),
    row('form-3', 'VRD', 'FRM-VRD', 'Plateforme', 'Publié', '2026-08-21', undefined, undefined, ['Voirie', 'Drainage', 'Réseaux']),
    row('form-4', 'Lot de travaux', 'FRM-LOT', 'Plateforme', 'Publié', '2026-08-21', undefined, undefined, ['Gros œuvre', 'Plomberie', 'Finition']),
  ],
  appointments: [
    row('rdv-1', 'Visio cadrage terrain', 'RDV-2026-032', 'Client Buildify', 'À confirmer', '2026-08-23', undefined, 'Abidjan', ['45 min']),
  ],
  visits: [
    row('visit-1', 'Relevé technique avant métré', 'VIS-2026-018', 'Équipe terrain', 'Planifiée', '2026-08-24', undefined, 'Yamoussoukro', ['Topographie']),
  ],
  reports: [
    row('report-1', 'Synthèse hebdomadaire commerciale', 'RPT-2026-W34', 'Direction', 'Disponible', '2026-08-21', undefined, undefined, ['Conversion', 'Devis']),
  ],
  teams: [
    row('team-1', 'Awa Kouadio', 'EQP-001', 'Responsable études', 'Disponible', '2026-08-21', undefined, 'Abidjan', ['Études', 'Devis']),
    row('team-2', 'Moussa Traoré', 'EQP-002', 'Conducteur travaux', 'Affectable', '2026-08-21', undefined, 'Bouaké', ['Chantier']),
  ],
  roles: [
    row('role-1', 'Super administrateur', 'ROLE-SUPER', 'Sécurité', 'Actif', '2026-08-21', undefined, undefined, ['Tous accès']),
    row('role-2', 'Chargé d’études', 'ROLE-ETUDE', 'Sécurité', 'Actif', '2026-08-21', undefined, undefined, ['Études', 'Devis']),
  ],
};

function row(
  id: string,
  title: string,
  reference: string,
  owner: string,
  status: string,
  date: string,
  amount?: number,
  city?: string,
  tags: string[] = [],
  projectId?: string,
  source: OperationRow['source'] = 'reference'
): OperationRow {
  return { id, title, reference, owner, status, date, amount, city, tags, projectId, source };
}

function formatDate(value?: string) {
  if (!value) return 'Non daté';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('fr-FR');
}

function projectTitle(project: ProjectData) {
  return project.title || project.modelName || project.categoryName || 'Projet BTP';
}

function paymentStatusLabel(status: string) {
  if (status === 'due') return 'À régler';
  if (status === 'paid') return 'Payé';
  if (status === 'blocked') return 'Bloqué';
  return 'Planifié';
}

function workflowRows(tab: string, projects: ProjectData[], notifications: NotificationData[]): OperationRow[] {
  if (tab === 'studies') {
    return projects
      .filter(project => ['submitted', 'verifying', 'studying', 'estimating', 'info_required'].includes(project.status))
      .map(project => row(
        `study-${project.id}`,
        projectTitle(project),
        project.referenceNumber,
        project.assignedTo || 'Bureau technique',
        project.status === 'info_required' ? 'À compléter' : 'En étude',
        project.updatedAt,
        project.budgetMax || project.budgetMin,
        project.city,
        [project.categoryName || 'BTP', project.clientName || 'Client'],
        project.id,
        'workflow'
      ));
  }

  if (tab === 'estimates') {
    return projects.map(project => row(
      `estimate-${project.id}`,
      projectTitle(project),
      project.referenceNumber,
      project.assignedTo || 'Estimation',
      project.budgetMax || project.budgetMin ? 'Chiffré' : 'À estimer',
      project.updatedAt,
      project.budgetMax || project.budgetMin,
      project.city,
      [project.categoryName || 'BTP'],
      project.id,
      'workflow'
    ));
  }

  if (tab === 'quotes') {
    return projects.flatMap(project => (project.quotes ?? []).map(quote => row(
      quote.id,
      quote.label,
      project.referenceNumber,
      project.clientName || 'Client Buildify',
      quote.status === 'sent' ? 'Transmis' : quote.status === 'accepted' ? 'Accepté' : quote.status === 'refused' ? 'Refusé' : 'Brouillon',
      quote.date,
      quote.amount,
      project.city,
      [project.categoryName || 'BTP'],
      project.id,
      'workflow'
    )));
  }

  if (tab === 'contracts') {
    return projects
      .filter(project => ['accepted', 'contract_prep', 'payment_pending', 'planning', 'in_progress'].includes(project.status))
      .map(project => row(
        `contract-${project.id}`,
        `Contrat ${projectTitle(project)}`,
        project.referenceNumber,
        project.clientName || 'Client Buildify',
        project.status === 'accepted' ? 'À préparer' : 'En cours',
        project.updatedAt,
        project.budgetMax || project.budgetMin,
        project.city,
        [project.categoryName || 'BTP'],
        project.id,
        'workflow'
      ));
  }

  if (tab === 'documents') {
    return projects.flatMap(project => (project.documents ?? []).map(document => row(
      document.id,
      document.name,
      project.referenceNumber,
      project.clientName || 'Client Buildify',
      document.type || 'Document',
      document.date,
      document.size,
      project.city,
      [project.categoryName || 'BTP'],
      project.id,
      'workflow'
    )));
  }

  if (tab === 'appointments' || tab === 'visits') {
    const allowedTypes = tab === 'visits'
      ? ['technical_visit', 'site_meeting']
      : ['appointment', 'bank_meeting', 'client_validation'];

    return projects.flatMap(project => (project.scheduleItems ?? [])
      .filter(item => allowedTypes.includes(item.type))
      .map(item => row(
        item.id,
        item.title,
        project.referenceNumber,
        item.createdBy || project.assignedTo || 'Administration Buildify',
        projectScheduleStatusLabel(item.status),
        item.scheduledAt,
        undefined,
        item.location || project.city,
        [
          projectScheduleTypeLabel(item.type),
          projectScheduleModeLabel(item.mode),
          item.durationMinutes ? `${item.durationMinutes} min` : 'Durée à confirmer',
          project.categoryName || 'BTP',
        ],
        project.id,
        'workflow'
      )));
  }

  if (tab === 'sites') {
    return projects
      .filter(project => ['planning', 'in_progress', 'suspended', 'provisional_acceptance', 'corrections', 'final_acceptance', 'delivered'].includes(project.status))
      .map(project => row(
        `site-${project.id}`,
        projectTitle(project),
        project.referenceNumber,
        project.assignedTo || 'Conducteur travaux',
        project.status === 'planning' ? 'Planification' : project.status === 'delivered' ? 'Livré' : 'En suivi',
        project.updatedAt,
        project.budgetMax || project.budgetMin,
        project.city,
        [`${project.progress}%`, project.categoryName || 'BTP'],
        project.id,
        'workflow'
      ));
  }

  if (tab === 'invoices') {
    return projects
      .filter(project => ['accepted', 'payment_pending', 'planning', 'in_progress', 'delivered'].includes(project.status))
      .map(project => row(
        `invoice-${project.id}`,
        `Facture ${project.referenceNumber}`,
        `FAC-${project.referenceNumber.replace(/\D/g, '').slice(-6) || project.id.slice(-4)}`,
        project.clientName || 'Client Buildify',
        project.status === 'payment_pending' ? 'Paiement attendu' : 'À émettre',
        project.updatedAt,
        project.budgetMax || project.budgetMin,
        project.city,
        [project.categoryName || 'BTP'],
        project.id,
        'workflow'
      ));
  }

  if (tab === 'payments') {
    return projects.flatMap(project => {
      const milestones = project.financing?.milestones ?? [];
      if (milestones.length === 0) return [];
      return milestones.map((milestone, index) => row(
        `payment-${project.id}-${milestone.id}`,
        `${index + 1}. ${milestone.label}`,
        `PAY-${project.referenceNumber.replace(/\D/g, '').slice(-6) || project.id.slice(-4)}-${index + 1}`,
        project.clientName || 'Client Buildify',
        paymentStatusLabel(milestone.status),
        milestone.updatedAt || project.updatedAt,
        milestone.expectedAmount,
        project.city,
        [project.referenceNumber, `${milestone.percent}%`, project.categoryName || 'BTP'],
        project.id,
        'workflow'
      ));
    });
  }

  if (tab === 'messages') {
    return projects.flatMap(project => {
      const directMessages = (project.projectMessages ?? []).map(message => row(
        `message-${message.id}`,
        message.message,
        project.referenceNumber,
        message.senderName,
        message.senderRole === 'client' ? 'Message client' : 'Message admin',
        message.createdAt,
        undefined,
        project.city,
        [project.categoryName || 'BTP', message.senderRole === 'client' ? 'À traiter' : 'Envoyé'],
        project.id,
        'workflow'
      ));

      const infoRequests = project.missingInfo ? [
        row(
          `message-info-${project.id}`,
          project.missingInfo,
          project.referenceNumber,
          project.clientName || 'Client Buildify',
          'Information demandée',
          project.missingInfoRequestedAt || project.updatedAt,
          undefined,
          project.city,
          [project.categoryName || 'BTP', 'Action requise'],
          project.id,
          'workflow'
        ),
      ] : [];

      return [...directMessages, ...infoRequests];
    });
  }

  if (tab === 'notifications') {
    return notifications.map(notification => row(
      notification.id,
      notification.title,
      notification.projectId || notification.link || 'NOTIFICATION',
      notification.type,
      notification.isRead ? 'Lue' : 'Non lue',
      notification.createdAt,
      undefined,
      undefined,
      [notification.actionLabel || 'Alerte'],
      notification.projectId,
      'workflow'
    ));
  }

  if (tab === 'statistics') {
    const accepted = projects.filter(project => project.status === 'accepted').length;
    const quoteCount = projects.reduce((count, project) => count + (project.quotes?.length ?? 0), 0);
    return [
      row('stat-requests', 'Demandes enregistrées', 'STAT-DEM', 'Portefeuille', String(projects.length), new Date().toISOString(), projects.length, undefined, ['Dossiers'], undefined, 'workflow'),
      row('stat-quotes', 'Devis transmis', 'STAT-DEV', 'Commercial', String(quoteCount), new Date().toISOString(), quoteCount, undefined, ['Devis'], undefined, 'workflow'),
      row('stat-accepted', 'Projets acceptés', 'STAT-ACC', 'Direction', String(accepted), new Date().toISOString(), accepted, undefined, ['Conversion'], undefined, 'workflow'),
    ];
  }

  if (tab === 'audit') {
    return projects.flatMap(project => (project.activityLog ?? []).map(item => row(
      item.id,
      item.label,
      project.referenceNumber,
      item.actor,
      item.type,
      item.createdAt,
      undefined,
      project.city,
      [project.categoryName || 'BTP'],
      project.id,
      'workflow'
    )));
  }

  return [];
}

function amountLabel(rowItem: OperationRow, tab: string) {
  if (rowItem.amount === undefined) return rowItem.city || '—';
  if (tab === 'documents') return `${Math.max(1, Math.round(rowItem.amount / 1024))} Ko`;
  if (['statistics'].includes(tab)) return String(rowItem.amount);
  return FORMAT_XOF(rowItem.amount);
}

function rowMatches(rowItem: OperationRow, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [
    rowItem.title,
    rowItem.reference,
    rowItem.owner,
    rowItem.status,
    rowItem.city,
    ...rowItem.tags,
  ].some(value => value?.toLowerCase().includes(needle));
}

function escapeCsv(value: string | number | undefined) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function exportRows(tab: string, rows: OperationRow[]) {
  const header = ['Référence', 'Titre', 'Responsable', 'Statut', 'Date', 'Montant', 'Source'];
  const body = rows.map(item => [
    item.reference,
    item.title,
    item.owner,
    item.status,
    formatDate(item.date),
    item.amount,
    item.source,
  ]);
  const csv = [header, ...body].map(line => line.map(escapeCsv).join(';')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `buildify-admin-${tab}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function categoryFromRow(rowItem: OperationRow, tab: string) {
  const text = [rowItem.title, rowItem.reference, tab, ...rowItem.tags].join(' ').toLowerCase();
  if (text.includes('vrd')) return 'VRD';
  if (text.includes('r+')) return 'Immeuble R+';
  if (text.includes('finition')) return 'Finition';
  if (text.includes('plomberie')) return 'Plomberie';
  if (text.includes('second')) return 'Second oeuvre';
  if (text.includes('gros')) return 'Gros oeuvre';
  if (text.includes('étude') || text.includes('etude')) return 'Etude technique';
  if (text.includes('lot')) return 'Lot de travaux';
  return 'Maison basse';
}

function projectDefaultsFromRow(rowItem: OperationRow, tab: string) {
  const amount = rowItem.amount ? String(rowItem.amount) : '';
  return {
    title: rowItem.title,
    categoryName: categoryFromRow(rowItem, tab),
    clientName: rowItem.owner === 'Plateforme' || rowItem.owner === 'Sécurité' || rowItem.owner === 'Direction'
      ? ''
      : rowItem.owner,
    city: rowItem.city,
    budgetMin: amount,
    budgetMax: amount,
    description: `${rowItem.reference} · ${rowItem.status}. Origine : module admin ${tab}.`,
  };
}

export function AdminOperationsView({
  tab,
  searchQuery,
  projects,
  notifications,
  onOpenProject,
}: {
  tab: string;
  searchQuery: string;
  projects: ProjectData[];
  notifications: NotificationData[];
  onOpenProject: (projectId: string) => void;
}) {
  const { addToast } = useAppStore();
  const [statusFilter, setStatusFilter] = useState('all');
  const [localSearch, setLocalSearch] = useState('');
  const [selectedRow, setSelectedRow] = useState<OperationRow | null>(null);
  const [linkedProjectDefaults, setLinkedProjectDefaults] = useState<LinkedProjectDefaults | null>(null);
  const [treatedRows, setTreatedRows] = useState<Record<string, boolean>>({});
  const copy = MODULE_COPY[tab] ?? MODULE_COPY.prospects;

  const rows = useMemo(() => {
    const workflow = workflowRows(tab, projects, notifications);
    const references = REFERENCE_ROWS[tab] ?? [];
    return [...workflow, ...references].map(item => {
      if (!treatedRows[item.id]) return item;
      return {
        ...item,
        status: 'Traité',
        tags: item.tags.includes('Traité admin') ? item.tags : [...item.tags, 'Traité admin'],
      };
    });
  }, [tab, projects, notifications, treatedRows]);

  const query = [searchQuery, localSearch].filter(Boolean).join(' ');
  const statuses = useMemo(() => ['all', ...Array.from(new Set(rows.map(item => item.status)))], [rows]);
  const filteredRows = rows
    .filter(item => rowMatches(item, query))
    .filter(item => statusFilter === 'all' || item.status === statusFilter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalAmount = filteredRows.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const workflowCount = filteredRows.filter(item => item.source === 'workflow').length;
  const handleExportSelected = (rowItem: OperationRow) => {
    exportRows(tab, [rowItem]);
    addToast('Fiche admin exportée.', 'success');
  };
  const handleMarkTreated = (rowItem: OperationRow) => {
    setTreatedRows(current => ({ ...current, [rowItem.id]: true }));
    setSelectedRow(null);
    addToast('Ligne marquée comme traitée dans ce module admin.', 'success');
  };
  const openLinkedProjectDialog = (rowItem: OperationRow) => {
    setLinkedProjectDefaults(projectDefaultsFromRow(rowItem, tab));
    setSelectedRow(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{copy.eyebrow}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{copy.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{copy.description}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={localSearch}
              onChange={event => setLocalSearch(event.target.value)}
              className="h-11 pl-9"
              placeholder="Filtrer ce module"
            />
          </div>
          <Button className="h-11 gap-2" onClick={() => exportRows(tab, filteredRows)} disabled={filteredRows.length === 0}>
            <Download className="size-4" />
            Exporter
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="py-0">
          <CardContent className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Éléments</p>
            <p className="mt-2 text-2xl font-bold">{filteredRows.length}</p>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Reliés aux dossiers</p>
            <p className="mt-2 text-2xl font-bold">{workflowCount}</p>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Volume</p>
            <p className="mt-2 text-2xl font-bold">{totalAmount > 0 ? FORMAT_XOF(totalAmount) : '—'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {statuses.map(status => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === status ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {status === 'all' ? 'Tous' : status}
          </button>
        ))}
      </div>

      {filteredRows.length === 0 ? (
        <Card className="border-dashed py-0">
          <CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <FileSearch className="size-10 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">{copy.emptyTitle}</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{copy.emptyDescription}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="hidden grid-cols-[1fr_160px_150px_140px_140px] gap-4 border-b bg-muted/50 px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground lg:grid">
            <span>Dossier</span>
            <span>Responsable</span>
            <span>Statut</span>
            <span>Volume</span>
            <span className="text-right">Action</span>
          </div>
          <div className="divide-y">
            {filteredRows.map(item => (
              <div key={item.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_160px_150px_140px_140px] lg:items-center lg:gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{item.reference}</span>
                    <Badge variant={item.source === 'workflow' ? 'default' : 'secondary'} className="text-[10px]">
                      {item.source === 'workflow' ? 'Workflow' : 'Référence'}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold">{item.title}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.tags.map(tag => (
                      <span key={tag} className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">{item.owner}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
                </div>
                <Badge variant="outline" className="w-fit">{item.status}</Badge>
                <p className="text-sm font-semibold">{amountLabel(item, tab)}</p>
                <div className="flex justify-start lg:justify-end">
                  {item.projectId ? (
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => onOpenProject(item.projectId!)}>
                      <FolderOpen className="size-4" />
                      Ouvrir
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => setSelectedRow(item)}>
                      <Eye className="size-4" />
                      Consulter
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!selectedRow} onOpenChange={open => !open && setSelectedRow(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedRow?.title}</DialogTitle>
            <DialogDescription>{copy.title} · {selectedRow?.reference}</DialogDescription>
          </DialogHeader>
          {selectedRow && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Responsable</p>
                  <p className="mt-1 font-medium">{selectedRow.owner}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Statut</p>
                  <p className="mt-1 font-medium">{selectedRow.status}</p>
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Volume</p>
                <p className="mt-1 font-semibold">{amountLabel(selectedRow, tab)}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedRow.tags.map(tag => <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>)}
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
                Cette fiche appartient à la plateforme admin. Elle peut être exportée, traitée ou convertie en dossier sans envoyer l’utilisateur vers l’espace client.
              </div>
            </div>
          )}
          <DialogFooter className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {selectedRow && (
              <>
                <Button variant="outline" className="gap-2" onClick={() => handleExportSelected(selectedRow)}>
                  <Download className="size-4" />
                  Exporter fiche
                </Button>
                <ConfirmActionDialog
                  title="Marquer cette ligne comme traitée ?"
                  description={`La ligne ${selectedRow.reference} sera indiquée comme traitée dans ce module admin local. Les dossiers réels restent inchangés.`}
                  confirmLabel="Marquer traité"
                  onConfirm={() => handleMarkTreated(selectedRow)}
                  trigger={(
                    <Button variant="outline" className="gap-2" disabled={treatedRows[selectedRow.id]}>
                      <CheckCircle2 className="size-4" />
                      {treatedRows[selectedRow.id] ? 'Déjà traité' : 'Marquer traité'}
                    </Button>
                  )}
                />
                <Button className="gap-2 sm:col-span-2" onClick={() => openLinkedProjectDialog(selectedRow)}>
                  <FolderPlus className="size-4" />
                  Créer un dossier lié
                </Button>
              </>
            )}
            <Button variant="ghost" className="sm:col-span-2" onClick={() => setSelectedRow(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {linkedProjectDefaults && (
        <AdminCreateProjectDialog
          defaults={linkedProjectDefaults}
          open={!!linkedProjectDefaults}
          onOpenChange={open => {
            if (!open) setLinkedProjectDefaults(null);
          }}
          onCreated={() => setLinkedProjectDefaults(null)}
        />
      )}
    </div>
  );
}
