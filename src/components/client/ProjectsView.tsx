'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, FolderKanban, FileEdit, CheckCircle2, Clock,
  MapPin, ChevronRight, RefreshCw, ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/stores/app-store';
import { PROJECT_STATUS_LABELS, FORMAT_SHORT_XOF } from '@/types';
import type { ProjectData } from '@/types';

const MOCK_PROJECTS: ProjectData[] = [
  {
    id: 'prj-001',
    referenceNumber: 'BTP-2024-0042',
    title: 'Villa Aurore',
    status: 'in_progress',
    categoryId: 'villa',
    categoryName: 'Villa basse',
    modelId: '1',
    modelName: 'Villa Aurore',
    budgetMin: 55_000_000,
    budgetMax: 75_000_000,
    city: 'Cocody, Abidjan',
    progress: 65,
    createdAt: '2024-09-15T10:00:00Z',
    updatedAt: '2025-01-10T14:30:00Z',
  },
  {
    id: 'prj-002',
    referenceNumber: 'BTP-2024-0058',
    title: 'Duplex Horizon',
    status: 'quote_sent',
    categoryId: 'duplex',
    categoryName: 'Duplex',
    modelId: '2',
    modelName: 'Duplex Horizon',
    budgetMin: 85_000_000,
    budgetMax: 120_000_000,
    city: 'Riviera, Abidjan',
    progress: 15,
    createdAt: '2024-11-20T09:00:00Z',
    updatedAt: '2025-01-08T11:15:00Z',
  },
  {
    id: 'prj-003',
    referenceNumber: 'BTP-2025-0003',
    title: 'Projet residentiel Bingerville',
    status: 'draft',
    categoryId: 'villa',
    categoryName: 'Villa basse',
    budgetMin: 30_000_000,
    budgetMax: 45_000_000,
    city: 'Bingerville',
    progress: 0,
    createdAt: '2025-01-05T16:00:00Z',
    updatedAt: '2025-01-05T16:00:00Z',
  },
  {
    id: 'prj-004',
    referenceNumber: 'BTP-2023-0018',
    title: 'Immeuble Elysee',
    status: 'delivered',
    categoryId: 'immeuble',
    categoryName: 'Immeuble',
    modelId: '3',
    modelName: 'Immeuble Elysee',
    budgetMin: 350_000_000,
    budgetMax: 500_000_000,
    city: 'Plateau, Abidjan',
    progress: 100,
    createdAt: '2023-06-01T08:00:00Z',
    updatedAt: '2024-08-20T10:00:00Z',
  },
  {
    id: 'prj-005',
    referenceNumber: 'BTP-2024-0071',
    title: 'Villa Emeraude',
    status: 'in_progress',
    categoryId: 'villa',
    categoryName: 'Villa basse',
    modelId: '4',
    modelName: 'Villa Emeraude',
    budgetMin: 30_000_000,
    budgetMax: 45_000_000,
    city: 'Yamoussoukro',
    progress: 40,
    createdAt: '2024-10-10T12:00:00Z',
    updatedAt: '2025-01-09T09:45:00Z',
  },
];

type FilterTab = 'all' | 'submitted' | 'info_required' | 'quote_sent' | 'in_progress' | 'draft' | 'delivered';

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'submitted', label: 'Demandes' },
  { value: 'info_required', label: 'À compléter' },
  { value: 'quote_sent', label: 'Devis' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'delivered', label: 'Terminés' },
];

function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'in_progress') return 'default';
  if (status === 'info_required') return 'destructive';
  if (status === 'draft') return 'secondary';
  if (status === 'delivered') return 'outline';
  return 'secondary';
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
        Creer un projet
      </Button>
    </motion.div>
  );
}

function ProjectCard({ project, onClick }: { project: ProjectData; onClick: () => void }) {
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

        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="size-3" />
            {project.city || 'Non defini'}
          </span>
          {project.budgetMin != null && project.budgetMax != null && (
            <span className="flex items-center gap-1">
              <ArrowUpDown className="size-3" />
              {FORMAT_SHORT_XOF(project.budgetMin)} &ndash; {FORMAT_SHORT_XOF(project.budgetMax)}
            </span>
          )}
        </div>

        {project.progress > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-muted-foreground">Avancement</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-1.5" />
          </div>
        )}

        <Separator className="my-3" />

        <p className="text-[11px] text-muted-foreground">
          Mis a jour {formatDate(project.updatedAt)}
        </p>
      </CardContent>
    </Card>
  );
}

export function ProjectsView() {
  const { navigate, user, userProjects } = useAppStore();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshY, setRefreshY] = useState(0);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const firstName = user?.name?.split(' ')[0] || 'Client';
  const projects = useMemo(() => {
    const userRefs = new Set(userProjects.map(project => project.referenceNumber));
    return [
      ...userProjects,
      ...MOCK_PROJECTS.filter(project => !userRefs.has(project.referenceNumber)),
    ];
  }, [userProjects]);

  const filteredProjects = activeTab === 'all'
    ? projects
    : projects.filter(p => {
      if (activeTab === 'in_progress') return ['in_progress', 'planning', 'studying', 'verifying'].includes(p.status);
      return p.status === activeTab;
    });

  const stats = {
    submitted: projects.filter(p => p.status === 'submitted').length,
    info_required: projects.filter(p => p.status === 'info_required').length,
    delivered: projects.filter(p => p.status === 'delivered').length,
    quote_sent: projects.filter(p => p.status === 'quote_sent').length,
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
    { label: 'Terminés', value: stats.delivered, icon: CheckCircle2 },
    { label: 'Devis en attente', value: stats.quote_sent, icon: Clock },
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
          {statCards.map((stat, i) => (
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
        {filteredProjects.length > 0 && (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project, i) => (
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

        {filteredProjects.length === 0 && !isRefreshing && (
          <EmptyState activeTab={activeTab} onNavigate={() => navigate('create')} />
        )}
      </div>
    </main>
  );
}
