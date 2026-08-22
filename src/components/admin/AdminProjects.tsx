'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, ChevronRight, MapPin, Clock, User as UserIcon, FolderKanban
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/stores/app-store';
import { formatProjectLocation } from '@/lib/project-format';
import type { ProjectData } from '@/types';

const TABS = ['Tous', 'En cours', 'Terminés', 'Suspendus', 'Brouillons'];

type AdminProjectRow = {
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
};

function rowFromProject(project: ProjectData): AdminProjectRow {
  return {
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
  };
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' }> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  submitted: { label: 'Soumis', variant: 'secondary' },
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

  const projects = useMemo(() => {
    return userProjects.map(rowFromProject);
  }, [userProjects]);

  const filtered = projects.filter(p => {
    if (tab === 'En cours' && p.status !== 'in_progress' && p.status !== 'planning' && p.status !== 'study') return false;
    if (tab === 'Terminés' && p.status !== 'delivered') return false;
    if (tab === 'Suspendus' && p.status !== 'suspended') return false;
    if (tab === 'Brouillons' && p.status !== 'draft') return false;
    if (search && !p.ref.toLowerCase().includes(search.toLowerCase()) && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.client.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Projets</h1>
        <p className="text-sm text-muted-foreground">{projects.length} projets au total</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Référence, titre, client..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
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
              <Button className="mt-5 h-11 rounded-lg" onClick={() => navigate('create')}>
                Nouveau dossier
              </Button>
            </CardContent>
          </Card>
        ) : filtered.map(p => (
          <Card key={p.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('admin-project-detail', { id: p.id })}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{p.ref}</span>
                    <Badge variant={STATUS_MAP[p.status]?.variant || 'secondary'}>{STATUS_MAP[p.status]?.label || p.status}</Badge>
                  </div>
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.type}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" />{p.client}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.city}</span>
                    {p.startDate && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{p.startDate}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0 w-28">
                  <p className="text-sm font-medium">{(p.budget / 1000000).toFixed(0)} M</p>
                  <p className="text-xs text-muted-foreground">XOF</p>
                </div>
                <div className="shrink-0 w-20 hidden sm:block">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Avancement</span>
                    <span className="font-medium">{p.progress}%</span>
                  </div>
                  <Progress value={p.progress} className="h-1.5" />
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </div>
  );
}
