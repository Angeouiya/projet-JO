'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, ChevronRight, MapPin, Clock, User as UserIcon, FolderKanban,
  Landmark, ReceiptText, FileText, MessageSquare, ShieldCheck,
  AlertCircle, Camera, HandCoins, ClipboardCheck, Gauge,
  CalendarDays, NotebookTabs, UserCheck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/stores/app-store';
import { formatProjectLocation } from '@/lib/project-format';
import { buildProjectDecisionCenter } from '@/lib/project-decision-center';
import { AdminCreateProjectDialog } from './AdminCreateProjectDialog';
import type { ProjectData } from '@/types';
import type { LucideIcon } from 'lucide-react';

const TABS = ['Tous', 'À traiter', 'Finance', 'Documents', 'Devis', 'En cours', 'Terminés', 'Suspendus', 'Brouillons'];

type AdminProjectRow = {
  project: ProjectData;
  id: string;
  ref: string;
  title: string;
  client: string;
  type: string;
  city: string;
  status: string;
  progress: number;
  budget: number;
  startDate: string | null;
  financeScore: number;
  readiness: number;
  documents: number;
  quotes: number;
  messages: number;
  siteUpdates: number;
  nextAction: string;
  nextActionIcon: LucideIcon;
  decisionScore: number;
  scoreLabel: string;
  blockers: string[];
  activeDecisions: number;
  primaryLabel: string;
};

function projectFinanceScore(project: ProjectData): number {
  if (project.financing?.affordabilityScore !== undefined) return project.financing.affordabilityScore;
  if (project.financing?.readiness === 'confirmed') return 80;
  if (project.financing?.readiness === 'bank_review') return 58;
  if (project.budgetMin || project.budgetMax) return 32;
  return 0;
}

function projectReadiness(project: ProjectData): number {
  const checks = [
    Boolean(project.clientEmail || project.clientPhone),
    Boolean(project.financing && projectFinanceScore(project) >= 50),
    Boolean((project.documents ?? []).length),
    Boolean((project.quotes ?? []).length),
    Boolean((project.visualProposals ?? []).length || project.visualProposal),
    Boolean((project.projectMessages ?? []).length || project.missingInfoResponses?.length),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function nextAdminAction(project: ProjectData) {
  if (!project.assignedTo) return { label: 'Affecter un responsable', icon: ShieldCheck };
  if (!project.financing || projectFinanceScore(project) < 50) return { label: 'Qualifier la finance', icon: Landmark };
  if ((project.documents ?? []).length === 0) return { label: 'Demander les pièces', icon: FileText };
  if ((project.visualProposals ?? []).length === 0 && !project.visualProposal) return { label: 'Publier une proposition', icon: Camera };
  if ((project.quotes ?? []).length === 0) return { label: 'Préparer le devis', icon: ReceiptText };
  if ((project.projectMessages ?? []).length === 0) return { label: 'Envoyer un message', icon: MessageSquare };
  if (project.status === 'quote_sent') return { label: 'Suivre la décision client', icon: ClipboardCheck };
  if (project.status === 'in_progress') return { label: 'Publier le chantier', icon: HandCoins };
  return { label: 'Piloter le dossier', icon: FolderKanban };
}

function rowFromProject(project: ProjectData): AdminProjectRow {
  const action = nextAdminAction(project);
  const decisionCenter = buildProjectDecisionCenter(project, 'admin');
  return {
    project,
    id: project.id,
    ref: project.referenceNumber,
    title: project.title || project.modelName || 'Projet BTP',
    client: project.clientName || 'Client Buildify',
    type: project.categoryName || project.modelName || 'Projet',
    city: formatProjectLocation(project, 'Non défini'),
    status: project.status,
    progress: project.progress ?? 0,
    budget: project.budgetMax || project.budgetMin || 0,
    startDate: project.createdAt.slice(0, 10),
    financeScore: projectFinanceScore(project),
    readiness: projectReadiness(project),
    documents: project.documents?.length ?? 0,
    quotes: project.quotes?.length ?? 0,
    messages: project.projectMessages?.length ?? 0,
    siteUpdates: project.siteUpdates?.length ?? 0,
    nextAction: action.label,
    nextActionIcon: action.icon,
    decisionScore: decisionCenter.score,
    scoreLabel: decisionCenter.scoreLabel,
    blockers: decisionCenter.blockers,
    activeDecisions: decisionCenter.items.filter(item => item.tone === 'active' || item.tone === 'blocked').length,
    primaryLabel: decisionCenter.primaryLabel,
  };
}

function formatCompactBudget(amount: number) {
  if (!amount) return 'À cadrer';
  if (amount >= 1_000_000) return `${new Intl.NumberFormat('fr-FR').format(Math.round(amount / 1_000_000))} M XOF`;
  return `${new Intl.NumberFormat('fr-FR').format(amount)} XOF`;
}

function searchAdminProject(row: AdminProjectRow, query: string): boolean {
  if (!query) return true;
  const haystack = [
    row.ref,
    row.title,
    row.client,
    row.type,
    row.city,
    row.nextAction,
    row.scoreLabel,
    row.project.clientEmail,
    row.project.clientPhone,
    row.project.financing?.bankName,
    row.project.financing?.financingPurpose,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

function AdminOperationsCenter({
  projects,
  onOpenProject,
}: {
  projects: AdminProjectRow[];
  onOpenProject: (projectId: string) => void;
}) {
  if (projects.length === 0) return null;

  const priorityRows = [...projects]
    .sort((a, b) => {
      const aWeight = a.blockers.length * 40 + a.activeDecisions * 12 + (100 - a.decisionScore);
      const bWeight = b.blockers.length * 40 + b.activeDecisions * 12 + (100 - b.decisionScore);
      return bWeight - aWeight;
    })
    .slice(0, 3);
  const adminSignals = [
    { label: 'Décisions actives', value: projects.reduce((total, project) => total + project.activeDecisions, 0), icon: NotebookTabs },
    { label: 'Blocages', value: projects.reduce((total, project) => total + project.blockers.length, 0), icon: AlertCircle },
    { label: 'Planning', value: projects.reduce((total, project) => total + (project.project.scheduleItems?.length ?? 0), 0), icon: CalendarDays },
    { label: 'Responsables', value: projects.filter(project => Boolean(project.project.assignedTo)).length, icon: UserCheck },
  ];
  const averageScore = Math.round(projects.reduce((total, project) => total + project.decisionScore, 0) / projects.length);

  return (
    <Card className="py-0 gap-0 border-foreground/10">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Centre d’opérations</p>
            <h2 className="mt-1 text-lg font-bold">Priorités admin, finance, documents et décisions client</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Vue portefeuille pour traiter les dossiers critiques sans ouvrir chaque fiche une par une.
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 px-4 py-3">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Gauge className="size-3.5" />
              Score moyen
            </p>
            <p className="mt-1 text-xl font-bold">{averageScore}%</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {adminSignals.map(item => (
            <div key={item.label} className="rounded-lg border bg-background p-3">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <item.icon className="size-3.5" />
                {item.label}
              </p>
              <p className="mt-1 text-lg font-bold">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-2 xl:grid-cols-3">
          {priorityRows.map(row => (
            <button
              key={row.id}
              type="button"
              onClick={() => onOpenProject(row.id)}
              className="min-w-0 rounded-lg border bg-muted/20 p-3 text-left transition-colors hover:bg-muted/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-mono text-muted-foreground">{row.ref}</p>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5">{row.title}</p>
                </div>
                <Badge variant={row.blockers.length ? 'destructive' : 'outline'} className="shrink-0 text-[10px]">
                  {row.decisionScore}%
                </Badge>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{row.primaryLabel} · {row.client}</p>
              {row.blockers.length > 0 && (
                <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-muted-foreground">
                  {row.blockers.slice(0, 2).join(' · ')}
                </p>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  submitted: { label: 'Soumis', variant: 'secondary' },
  info_required: { label: 'À compléter', variant: 'destructive' },
  proposal_ready: { label: 'Proposition', variant: 'outline' },
  proposal_validated: { label: 'Validé client', variant: 'outline' },
  quote_sent: { label: 'Devis transmis', variant: 'outline' },
  studying: { label: 'En étude', variant: 'secondary' },
  planning: { label: 'Planification', variant: 'secondary' },
  in_progress: { label: 'En cours', variant: 'default' },
  suspended: { label: 'Suspendu', variant: 'secondary' },
  delivered: { label: 'Livré', variant: 'secondary' },
  study: { label: 'Étude', variant: 'secondary' },
};

export function AdminProjects() {
  const { navigate, userProjects } = useAppStore();
  const [tab, setTab] = useState('Tous');
  const [search, setSearch] = useState('');
  const normalizedSearch = search.trim().toLowerCase();

  const projects = useMemo(() => {
    return userProjects.map(rowFromProject);
  }, [userProjects]);

  const filtered = projects.filter(p => {
    if (tab === 'À traiter' && p.readiness >= 80) return false;
    if (tab === 'Finance' && p.financeScore >= 70) return false;
    if (tab === 'Documents' && p.documents > 0) return false;
    if (tab === 'Devis' && p.quotes > 0) return false;
    if (tab === 'En cours' && p.status !== 'in_progress' && p.status !== 'planning' && p.status !== 'study') return false;
    if (tab === 'Terminés' && p.status !== 'delivered') return false;
    if (tab === 'Suspendus' && p.status !== 'suspended') return false;
    if (tab === 'Brouillons' && p.status !== 'draft') return false;
    if (!searchAdminProject(p, normalizedSearch)) return false;
    return true;
  });
  const portfolio = {
    active: projects.filter(p => !['draft', 'delivered', 'suspended'].includes(p.status)).length,
    toTreat: projects.filter(p => p.readiness < 80).length,
    financeWeak: projects.filter(p => p.financeScore < 70).length,
    missingDocs: projects.filter(p => p.documents === 0).length,
  };
  const portfolioCards = [
    { label: 'Actifs', value: portfolio.active, icon: FolderKanban },
    { label: 'À traiter', value: portfolio.toTreat, icon: AlertCircle },
    { label: 'Finance faible', value: portfolio.financeWeak, icon: Landmark },
    { label: 'Sans pièces', value: portfolio.missingDocs, icon: FileText },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">Projets</h1>
          <p className="text-sm text-muted-foreground">{projects.length} projets au total</p>
        </div>
        <AdminCreateProjectDialog
          trigger={(
            <Button className="h-11 rounded-lg">
              Nouveau dossier
            </Button>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {portfolioCards.map(item => (
          <Card key={item.label} className="py-0 gap-0">
            <CardContent className="p-3">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <item.icon className="size-3.5" />
                {item.label}
              </p>
              <p className="mt-2 text-xl font-bold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <AdminOperationsCenter
        projects={projects}
        onOpenProject={(projectId) => navigate('admin-project-detail', { id: projectId })}
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Référence, client, ville, ouvrage, banque..." value={search} onChange={e => setSearch(e.target.value)} className="h-11 rounded-lg pl-9" />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${tab === t ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'}`}>{t}</button>
        ))}
      </div>

      <motion.div className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center px-6 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
                <FolderKanban className="size-6" />
              </div>
              <h2 className="mt-4 text-base font-semibold">Aucun projet réel</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                Les projets créés depuis le configurateur ou soumis par les clients seront listés ici.
              </p>
              <AdminCreateProjectDialog
                trigger={(
                  <Button className="mt-5 h-11 rounded-lg">
                    Nouveau dossier
                  </Button>
                )}
              />
            </CardContent>
          </Card>
        ) : filtered.map(p => {
          const NextIcon = p.nextActionIcon;
          const globalScore = Math.max(p.progress, p.readiness, p.financeScore, p.decisionScore);

          return (
          <Card key={p.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('admin-project-detail', { id: p.id })}>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{p.ref}</span>
                    <Badge variant={STATUS_MAP[p.status]?.variant || 'secondary'}>{STATUS_MAP[p.status]?.label || p.status}</Badge>
                  </div>
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.type}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" />{p.client}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.city}</span>
                    {p.startDate && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{p.startDate}</span>}
                  </div>

                  <div className="mt-3 rounded-lg border bg-muted/30 p-3">
                    <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <NextIcon className="size-3.5" />
                      Prochaine action
                    </p>
                    <p className="mt-1 text-sm font-semibold">{p.nextAction}</p>
                    <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                      {p.activeDecisions} décision{p.activeDecisions > 1 ? 's' : ''} active{p.activeDecisions > 1 ? 's' : ''} · {p.scoreLabel}
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-lg border p-2.5">
                      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><Landmark className="size-3" />Finance</p>
                      <p className="mt-1 text-sm font-bold">{p.financeScore}%</p>
                    </div>
                    <div className="rounded-lg border p-2.5">
                      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><FileText className="size-3" />Pièces</p>
                      <p className="mt-1 text-sm font-bold">{p.documents}</p>
                    </div>
                    <div className="rounded-lg border p-2.5">
                      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><ReceiptText className="size-3" />Devis</p>
                      <p className="mt-1 text-sm font-bold">{p.quotes}</p>
                    </div>
                    <div className="rounded-lg border p-2.5">
                      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><MessageSquare className="size-3" />Suivi</p>
                      <p className="mt-1 text-sm font-bold">{p.messages + p.siteUpdates}</p>
                    </div>
                  </div>

                  {p.blockers.length > 0 && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {p.blockers.slice(0, 2).map(blocker => (
                        <div key={blocker} className="rounded-lg border border-dashed bg-background px-3 py-2 text-xs leading-5 text-muted-foreground">
                          {blocker}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 lg:w-52 lg:grid-cols-1">
                  <div className="rounded-lg border p-3 text-left lg:text-right">
                    <p className="text-sm font-semibold">{formatCompactBudget(p.budget)}</p>
                    <p className="text-xs text-muted-foreground">Budget XOF</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Score dossier</span>
                      <span className="font-medium">{globalScore}%</span>
                    </div>
                    <Progress value={globalScore} className="h-1.5" />
                  </div>
                </div>
                <ChevronRight className="hidden w-4 h-4 text-muted-foreground shrink-0 lg:block" />
              </div>
            </CardContent>
          </Card>
          );
        })}
      </motion.div>
    </div>
  );
}
