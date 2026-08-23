'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, FolderKanban, FileEdit, CheckCircle2,
  MapPin, ChevronRight, RefreshCw, ArrowUpDown,
  Landmark, ReceiptText, MessageSquare, FileText,
  Camera, ShieldCheck, HandCoins, AlertCircle,
  Search, ClipboardList, Gauge, CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/stores/app-store';
import { PROJECT_STATUS_LABELS, FORMAT_SHORT_XOF } from '@/types';
import { formatProjectLocation } from '@/lib/project-format';
import { buildProjectDecisionCenter } from '@/lib/project-decision-center';
import type { ProjectDecisionTone } from '@/lib/project-decision-center';
import type { ProjectData } from '@/types';

type FilterTab = 'all' | 'submitted' | 'info_required' | 'proposal_validated' | 'quote_sent' | 'in_progress' | 'draft' | 'delivered';

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'submitted', label: 'Demandes' },
  { value: 'info_required', label: 'À compléter' },
  { value: 'proposal_validated', label: 'Propositions' },
  { value: 'quote_sent', label: 'Devis' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'delivered', label: 'Terminés' },
];

function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'in_progress') return 'default';
  if (status === 'proposal_validated') return 'outline';
  if (status === 'info_required') return 'destructive';
  if (status === 'draft') return 'secondary';
  if (status === 'delivered') return 'outline';
  return 'secondary';
}

function projectFinanceScore(project: ProjectData): number {
  if (project.financing?.affordabilityScore !== undefined) return project.financing.affordabilityScore;
  if (project.financing?.readiness === 'confirmed') return 80;
  if (project.financing?.readiness === 'bank_review') return 58;
  if (project.budgetMin || project.budgetMax) return 32;
  return 0;
}

function projectNextAction(project: ProjectData) {
  if (project.status === 'info_required') return { label: 'Compléter les informations', icon: FileEdit };
  if ((project.visualProposals?.length ?? 0) > 0 && !project.visualProposal) return { label: 'Valider une proposition', icon: ShieldCheck };
  if ((project.quotes ?? []).some(quote => quote.status === 'sent' || quote.status === 'draft')) return { label: 'Lire le devis transmis', icon: ReceiptText };
  if (!project.financing || projectFinanceScore(project) < 50) return { label: 'Renforcer le financement', icon: Landmark };
  if ((project.documents ?? []).length === 0) return { label: 'Ajouter les pièces du dossier', icon: FileText };
  if ((project.projectMessages ?? []).length === 0) return { label: 'Envoyer une précision', icon: MessageSquare };
  if (project.status === 'in_progress') return { label: 'Suivre le chantier', icon: Camera };
  return { label: 'Suivre le dossier', icon: FolderKanban };
}

function projectReadiness(project: ProjectData): number {
  const checks = [
    Boolean(project.city && project.country),
    Boolean(project.financing && projectFinanceScore(project) >= 50),
    Boolean((project.documents ?? []).length),
    Boolean((project.quotes ?? []).length || (project.visualProposals ?? []).length),
    Boolean((project.projectMessages ?? []).length || project.missingInfoResponses?.length),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function projectBudgetLabel(project: ProjectData) {
  if (project.budgetMin != null && project.budgetMax != null) return `${FORMAT_SHORT_XOF(project.budgetMin)} - ${FORMAT_SHORT_XOF(project.budgetMax)}`;
  if (project.budgetMax != null) return FORMAT_SHORT_XOF(project.budgetMax);
  if (project.budgetMin != null) return FORMAT_SHORT_XOF(project.budgetMin);
  return 'À cadrer';
}

function toneBadgeClass(tone: ProjectDecisionTone): string {
  if (tone === 'good') return 'border-foreground bg-foreground text-background';
  if (tone === 'active') return 'border-foreground/35 bg-muted/50 text-foreground';
  if (tone === 'warning') return 'border-dashed border-foreground/35 bg-background text-foreground';
  if (tone === 'blocked') return 'border-destructive/40 bg-destructive/10 text-destructive';
  return 'border-border bg-muted/30 text-muted-foreground';
}

function searchProject(project: ProjectData, query: string): boolean {
  if (!query) return true;
  const haystack = [
    project.referenceNumber,
    project.title,
    project.modelName,
    project.categoryName,
    project.city,
    project.country,
    project.clientPresence,
    project.financing?.bankName,
    project.financing?.financingPurpose,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem.`;
  if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
  return `Il y a ${Math.floor(diffDays / 365)} an${Math.floor(diffDays / 365) > 1 ? 's' : ''}`;
}

function EmptyState({ activeTab, onNavigate }: { activeTab: FilterTab; onNavigate: () => void }) {
  const tabLabel = FILTER_TABS.find(t => t.value === activeTab)?.label;
  const message = activeTab === 'all'
    ? "Vous n'avez encore aucun projet."
    : `Aucun projet ${tabLabel ? `\u00AB ${tabLabel} \u00BB` : ''}.`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="size-16 rounded-full bg-muted flex items-center justify-center">
        <FolderKanban className="size-7 text-muted-foreground/50" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={onNavigate}>
        <Plus className="size-3.5" />
        Créer un projet
      </Button>
    </motion.div>
  );
}

function ClientProjectCommandCenter({
  projects,
  onOpenProject,
}: {
  projects: ProjectData[];
  onOpenProject: (project: ProjectData) => void;
}) {
  if (projects.length === 0) return null;

  const projectCenters = projects.map(project => ({
    project,
    center: buildProjectDecisionCenter(project, 'client'),
  }));
  const priority = [...projectCenters].sort((a, b) => {
    const aWeight = a.center.blockers.length * 35 + (100 - a.center.score);
    const bWeight = b.center.blockers.length * 35 + (100 - b.center.score);
    return bWeight - aWeight;
  })[0];
  const decisionCount = projectCenters.reduce(
    (total, item) => total + item.center.items.filter(decision => decision.tone === 'active' || decision.tone === 'blocked').length,
    0
  );
  const unreadOperationalSignals = projects.reduce(
    (total, project) => total + (project.projectMessages?.length ?? 0) + (project.siteUpdates?.length ?? 0),
    0
  );
  const upcomingSchedules = projects.reduce(
    (total, project) => total + (project.scheduleItems ?? []).filter(item => ['scheduled', 'confirmed', 'reschedule_requested'].includes(item.status)).length,
    0
  );
  const publishedProposals = projects.reduce(
    (total, project) => total + (project.visualProposals?.length ?? 0) + (project.visualProposal ? 1 : 0),
    0
  );
  const commandStats = [
    { label: 'Décisions', value: decisionCount, icon: ClipboardList },
    { label: 'Planning', value: upcomingSchedules, icon: CalendarDays },
    { label: 'Visuels', value: publishedProposals, icon: Camera },
    { label: 'Échanges', value: unreadOperationalSignals, icon: MessageSquare },
  ];
  const visibleItems = priority.center.items.slice(0, 4);

  return (
    <Card className="py-0 gap-0 border-foreground/10">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Centre de décision</p>
            <h2 className="mt-1 break-words text-lg font-bold">{priority.center.headline}</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {priority.project.referenceNumber} · {priority.center.scoreLabel} · {PROJECT_STATUS_LABELS[priority.project.status] || priority.project.status}
            </p>
          </div>
          <Button size="sm" className="h-10 shrink-0 rounded-lg gap-2" onClick={() => onOpenProject(priority.project)}>
            {priority.center.primaryLabel}
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {commandStats.map(item => (
            <div key={item.label} className="rounded-lg border bg-muted/20 px-3 py-2">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <item.icon className="size-3.5" />
                {item.label}
              </p>
              <p className="mt-1 text-base font-bold">{item.value}</p>
            </div>
          ))}
        </div>

        {priority.center.blockers.length > 0 && (
          <div className="mt-4 rounded-lg border border-dashed bg-background p-3">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <AlertCircle className="size-3.5" />
              À sécuriser maintenant
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {priority.center.blockers.slice(0, 4).map(item => (
                <p key={item} className="rounded-md bg-muted/40 px-2.5 py-2 text-xs leading-5 text-muted-foreground">
                  {item}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {visibleItems.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpenProject(priority.project)}
              className="min-w-0 rounded-lg border bg-background p-3 text-left transition-colors hover:bg-muted/40"
            >
              <span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${toneBadgeClass(item.tone)}`}>
                {item.status}
              </span>
              <span className="mt-2 block text-sm font-semibold leading-5">{item.title}</span>
              <span className="mt-1 block text-[11px] leading-4 text-muted-foreground">{item.owner}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectCard({ project, onClick }: { project: ProjectData; onClick: () => void }) {
  const nextAction = projectNextAction(project);
  const NextIcon = nextAction.icon;
  const financeScore = projectFinanceScore(project);
  const readiness = projectReadiness(project);
  const decisionCenter = buildProjectDecisionCenter(project, 'client');
  const docs = project.documents?.length ?? 0;
  const quotes = project.quotes?.length ?? 0;
  const messages = project.projectMessages?.length ?? 0;
  const siteUpdates = project.siteUpdates?.length ?? 0;

  return (
    <Card
      className="cursor-pointer py-0 gap-0 hover:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Badge variant={getStatusVariant(project.status)} className="text-[10px] font-medium">
              {PROJECT_STATUS_LABELS[project.status] || project.status}
            </Badge>
            <h3 className="text-sm font-semibold mt-2 truncate">
              {project.title || project.modelName || 'Sans titre'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {project.categoryName} &middot; {project.referenceNumber}
            </p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground mt-1 flex-shrink-0" />
        </div>

        <div className="mt-3 rounded-lg border bg-muted/30 p-3">
          <div className="flex items-start gap-2">
            <NextIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Prochaine action</p>
              <p className="mt-1 text-sm font-semibold leading-5">{nextAction.label}</p>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-lg border bg-background p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Gauge className="size-3.5" />
              Santé dossier
            </p>
            <span className="text-sm font-bold">{decisionCenter.score}%</span>
          </div>
          <Progress value={decisionCenter.score} className="mt-2 h-1.5" />
          {decisionCenter.blockers.length > 0 ? (
            <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-muted-foreground">
              {decisionCenter.blockers.slice(0, 2).join(' · ')}
            </p>
          ) : (
            <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
              {decisionCenter.scoreLabel}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="size-3" />
            {formatProjectLocation(project, 'Non défini')}
          </span>
          <span className="flex items-center gap-1">
            <ArrowUpDown className="size-3" />
            {projectBudgetLabel(project)}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg border p-2.5">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Landmark className="size-3" />
              Finance
            </p>
            <p className="mt-1 text-sm font-bold">{financeScore || 0}%</p>
          </div>
          <div className="rounded-lg border p-2.5">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <FileText className="size-3" />
              Pièces
            </p>
            <p className="mt-1 text-sm font-bold">{docs}</p>
          </div>
          <div className="rounded-lg border p-2.5">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <ReceiptText className="size-3" />
              Devis
            </p>
            <p className="mt-1 text-sm font-bold">{quotes}</p>
          </div>
          <div className="rounded-lg border p-2.5">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <MessageSquare className="size-3" />
              Suivi
            </p>
            <p className="mt-1 text-sm font-bold">{messages + siteUpdates}</p>
          </div>
        </div>

        {project.progress > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-muted-foreground">Préparation dossier</span>
              <span className="font-medium">{Math.max(project.progress, readiness)}%</span>
            </div>
            <Progress value={Math.max(project.progress, readiness)} className="h-1.5" />
          </div>
        )}

        <Separator className="my-3" />

        <p className="text-[11px] text-muted-foreground">
          Mis à jour {formatDate(project.updatedAt)}
        </p>
      </CardContent>
    </Card>
  );
}

export function ProjectsView() {
  const { navigate, user, userProjects } = useAppStore();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshY, setRefreshY] = useState(0);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const firstName = user?.name?.split(' ')[0] || 'Client';
  const projects = useMemo(() => userProjects, [userProjects]);
  const normalizedSearch = search.trim().toLowerCase();

  const filteredProjects = activeTab === 'all'
    ? projects
    : projects.filter(p => {
      if (activeTab === 'in_progress') return ['in_progress', 'planning', 'studying', 'verifying'].includes(p.status);
      if (activeTab === 'quote_sent') return ['quote_sent', 'proposal_ready'].includes(p.status);
      if (activeTab === 'proposal_validated') return ['proposal_ready', 'proposal_validated'].includes(p.status);
      return p.status === activeTab;
    });
  const visibleProjects = filteredProjects.filter(project => searchProject(project, normalizedSearch));

  const stats = {
    submitted: projects.filter(p => p.status === 'submitted').length,
    info_required: projects.filter(p => p.status === 'info_required').length,
    delivered: projects.filter(p => p.status === 'delivered').length,
    proposal_validated: projects.filter(p => ['proposal_ready', 'proposal_validated'].includes(p.status)).length,
    quote_sent: projects.filter(p => p.status === 'quote_sent').length,
  };
  const portfolio = {
    active: projects.filter(p => !['draft', 'delivered', 'suspended'].includes(p.status)).length,
    financeReady: projects.filter(p => projectFinanceScore(p) >= 70).length,
    needsAction: projects.filter(p => projectReadiness(p) < 80).length,
    documents: projects.reduce((total, project) => total + (project.documents?.length ?? 0), 0),
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1200);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0 && touchStartY.current > 0) {
      const diff = Math.max(0, e.touches[0].clientY - touchStartY.current);
      setRefreshY(Math.min(diff * 0.5, 80));
    }
  };

  const handleTouchEnd = () => {
    if (refreshY > 50) {
      handleRefresh();
    }
    setRefreshY(0);
    touchStartY.current = 0;
  };

  const statCards = [
    { label: 'Demandes', value: stats.submitted, icon: FolderKanban },
    { label: 'À compléter', value: stats.info_required, icon: FileEdit },
    { label: 'Propositions', value: stats.proposal_validated, icon: ShieldCheck },
    { label: 'Terminés', value: stats.delivered, icon: CheckCircle2 },
    { label: 'Devis en attente', value: stats.quote_sent, icon: ReceiptText },
  ];
  const commandCards = [
    { label: 'Actifs', value: portfolio.active, icon: HandCoins },
    { label: 'Finance prête', value: portfolio.financeReady, icon: Landmark },
    { label: 'À renforcer', value: portfolio.needsAction, icon: AlertCircle },
    { label: 'Documents', value: portfolio.documents, icon: FileText },
  ];

  return (
    <main
      ref={containerRef}
      className="min-h-screen bg-background pb-8"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex items-center justify-center h-0 overflow-hidden transition-all duration-300"
        style={{ height: refreshY }}
      >
        <motion.div
          animate={{ rotate: isRefreshing ? 360 : 0 }}
          transition={isRefreshing ? { repeat: Infinity, duration: 0.8 } : { duration: 0.3 }}
        >
          <RefreshCw className={`size-5 ${isRefreshing ? 'text-foreground' : 'text-muted-foreground'}`} />
        </motion.div>
      </div>

      <div className="px-4 pt-6 pb-2">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-muted-foreground"
        >
          Bonjour, {firstName}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-xl font-bold tracking-tight mt-0.5"
        >
          Mes projets
        </motion.h1>
      </div>

      <div className="px-4 mt-4">
        <div className="grid grid-cols-2 gap-3">
          {commandCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <Card className="py-0 gap-0">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <stat.icon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold leading-none">{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 truncate">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="px-4 mt-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {statCards.map((stat) => (
            <div key={stat.label} className="rounded-lg border bg-muted/20 px-3 py-2">
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <stat.icon className="size-3" />
                {stat.label}
              </p>
              <p className="mt-1 text-sm font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 mt-5">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            className="w-full h-12 text-sm font-semibold gap-2"
            onClick={() => navigate('create')}
          >
            <Plus className="size-4" />
            Nouveau projet
          </Button>
        </motion.div>
      </div>

      <div className="px-4 mt-4">
        <ClientProjectCommandCenter
          projects={projects}
          onOpenProject={(project) => navigate('project-detail', { id: project.id })}
        />
      </div>

      <div className="px-4 mt-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher référence, ville, ouvrage, finance..."
            className="h-11 rounded-lg pl-9"
          />
        </div>
      </div>

      <div className="px-4 mt-6">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                activeTab === tab.value
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4">
        {visibleProjects.length > 0 && (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {visibleProjects.map((project, i) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ProjectCard project={project} onClick={() => navigate('project-detail', { id: project.id })} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {visibleProjects.length === 0 && !isRefreshing && (
          <EmptyState activeTab={activeTab} onNavigate={() => navigate('create')} />
        )}
      </div>
    </main>
  );
}
