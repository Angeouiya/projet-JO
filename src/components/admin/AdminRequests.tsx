'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, List, LayoutGrid,
  ChevronRight, Eye, ArrowRight, Clock, MapPin, User as UserIcon
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/stores/app-store';
import { PROJECT_STATUS_LABELS } from '@/types';
import type { ProjectData } from '@/types';

const STATUS_LIST = ['Nouvelles', 'Vérification', 'À compléter', 'Devis', 'Acceptées', 'Refusées'];
const STATUS_COLORS: Record<string, string> = {
  'Demande soumise': 'bg-foreground text-background',
  'Vérification': 'bg-secondary text-foreground',
  'Infos requises': 'bg-foreground text-background',
  'Étude en cours': 'bg-muted text-foreground',
  'En attente': 'bg-muted text-foreground',
  'Devis transmis': 'bg-muted text-foreground',
  'Proposition validée': 'bg-foreground text-background',
  'Accepté': 'bg-foreground text-background',
  'Refusé': 'bg-secondary text-muted-foreground',
};

type AdminRequestRow = {
  id: string;
  ref: string;
  client: string;
  type: string;
  city: string;
  date: string;
  status: string;
  statusKey: string;
  group: string;
  budget: number;
  urgent: boolean;
  source: 'workflow' | 'demo';
};

const mockRequests = [
  { id: 'demo-1', ref: 'DMD-2024-0089', client: 'Kouamé A.', type: 'Villa basse', city: 'Cocody', date: '2024-01-15', status: 'Demande soumise', statusKey: 'submitted', group: 'Nouvelles', budget: 80000000, urgent: true, source: 'demo' as const },
  { id: 'demo-2', ref: 'DMD-2024-0088', client: 'Société Akwaba', type: 'Immeuble R+', city: 'Plateau', date: '2024-01-14', status: 'Étude en cours', statusKey: 'studying', group: 'Vérification', budget: 350000000, urgent: false, source: 'demo' as const },
  { id: 'demo-3', ref: 'DMD-2024-0087', client: 'Diallo M.', type: 'Duplex', city: 'Riviera', date: '2024-01-14', status: 'En attente', statusKey: 'awaiting_validation', group: 'À compléter', budget: 55000000, urgent: false, source: 'demo' as const },
  { id: 'demo-4', ref: 'DMD-2024-0086', client: 'Promo Côte', type: 'Cité résidentielle', city: 'Bingerville', date: '2024-01-13', status: 'Demande soumise', statusKey: 'submitted', group: 'Nouvelles', budget: 1200000000, urgent: true, source: 'demo' as const },
  { id: 'demo-5', ref: 'DMD-2024-0085', client: 'Traoré K.', type: 'Rénovation', city: 'Marcory', date: '2024-01-13', status: 'Accepté', statusKey: 'accepted', group: 'Acceptées', budget: 25000000, urgent: false, source: 'demo' as const },
] satisfies AdminRequestRow[];

function groupFromStatus(status: string) {
  if (status === 'submitted') return 'Nouvelles';
  if (status === 'verifying' || status === 'studying' || status === 'estimating') return 'Vérification';
  if (status === 'info_required' || status === 'awaiting_validation') return 'À compléter';
  if (status === 'quote_sent' || status === 'proposal_ready' || status === 'proposal_validated') return 'Devis';
  if (status === 'accepted') return 'Acceptées';
  if (status === 'refused') return 'Refusées';
  return 'Vérification';
}

function requestFromProject(project: ProjectData): AdminRequestRow {
  const status = PROJECT_STATUS_LABELS[project.status] || project.status;
  return {
    id: project.id,
    ref: project.referenceNumber,
    client: project.clientName || 'Client BÂTI·CI',
    type: project.categoryName || project.modelName || 'Projet BTP',
    city: project.city || 'Non défini',
    date: project.createdAt.slice(0, 10),
    status,
    statusKey: project.status,
    group: groupFromStatus(project.status),
    budget: project.budgetMax || project.budgetMin || 0,
    urgent: project.status === 'info_required' || project.status === 'submitted',
    source: 'workflow',
  };
}

export function AdminRequests() {
  const { navigate, userProjects } = useAppStore();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const requests = useMemo(() => {
    const workflow = userProjects.map(requestFromProject);
    const refs = new Set(workflow.map(request => request.ref));
    return [...workflow, ...mockRequests.filter(request => !refs.has(request.ref))];
  }, [userProjects]);

  const filtered = requests.filter(r => {
    if (statusFilter !== 'all' && r.group !== statusFilter) return false;
    if (search && !r.ref.toLowerCase().includes(search.toLowerCase()) && !r.client.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusGroups = STATUS_LIST.reduce<Record<string, AdminRequestRow[]>>((acc, s) => {
    acc[s] = filtered.filter(r => r.group === s);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Demandes</h1>
          <p className="text-sm text-muted-foreground">{requests.length} demandes au total</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Référence, client..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex bg-muted rounded-lg p-0.5">
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-background shadow-sm' : ''}`}><List className="w-4 h-4" /></button>
          <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-background shadow-sm' : ''}`}><LayoutGrid className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <button onClick={() => setStatusFilter('all')} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${statusFilter === 'all' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'}`}>Tous ({requests.length})</button>
        {STATUS_LIST.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${statusFilter === s ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'}`}>{s} ({statusGroups[s]?.length || 0})</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {filtered.map(r => (
              <Card key={r.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('admin-project-detail', { id: r.id })}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {r.urgent && <div className="w-1 h-10 bg-foreground rounded-full shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{r.ref}</span>
                        {r.urgent && <Badge variant="secondary" className="text-[10px]">Urgent</Badge>}
                      </div>
                      <p className="text-sm font-medium truncate">{r.type}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" />{r.client}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.city}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.date}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 hidden sm:block">
                      <p className="text-sm font-medium">{(r.budget / 1000000).toFixed(0)} M</p>
                      <p className="text-xs text-muted-foreground">XOF</p>
                    </div>
                    <Badge className={STATUS_COLORS[r.status] || ''}>{r.status}</Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        ) : (
          <motion.div key="kanban" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
            {STATUS_LIST.map(s => (
              <div key={s} className="shrink-0 w-72">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">{s}</h3>
                  <Badge variant="secondary">{statusGroups[s]?.length || 0}</Badge>
                </div>
                <div className="space-y-2">
                  {(statusGroups[s] || []).map(r => (
                    <Card key={r.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('admin-project-detail', { id: r.id })}>
                      <CardContent className="p-3">
                        <p className="text-xs font-mono text-muted-foreground">{r.ref}</p>
                        <p className="text-sm font-medium mt-1">{r.type}</p>
                        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                          <span>{r.client}</span>
                          <span>{(r.budget / 1000000).toFixed(0)}M</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
