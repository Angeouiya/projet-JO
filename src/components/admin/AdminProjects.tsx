'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, ChevronRight, MapPin, Clock, User as UserIcon, MoreHorizontal, Filter
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/stores/app-store';

const TABS = ['Tous', 'En cours', 'Terminés', 'Suspendus', 'Brouillons'];

const mockProjects = [
  { id: '1', ref: 'PRJ-2024-0042', title: 'Villa Kokora', client: 'Kouamé A.', type: 'Villa basse', city: 'Cocody', status: 'in_progress', progress: 45, budget: 85000000, startDate: '2024-01-10' },
  { id: '2', ref: 'PRJ-2024-0041', title: 'Résidence Palmiers', client: 'Société Akwaba', type: 'Immeuble R+4', city: 'Plateau', status: 'in_progress', progress: 30, budget: 350000000, startDate: '2024-01-05' },
  { id: '3', ref: 'PRJ-2024-0040', title: 'Duplex Familial', client: 'Diallo M.', type: 'Duplex', city: 'Riviera', status: 'planning', progress: 10, budget: 55000000, startDate: '2024-01-15' },
  { id: '4', ref: 'PRJ-2024-0039', title: 'Cité Riviera 3', client: 'Promo Côte', type: 'Cité résidentielle', city: 'Bingerville', status: 'in_progress', progress: 65, budget: 1200000000, startDate: '2023-09-01' },
  { id: '5', ref: 'PRJ-2024-0038', title: 'Rénovation Marcory', client: 'Traoré K.', type: 'Rénovation', city: 'Marcory', status: 'delivered', progress: 100, budget: 25000000, startDate: '2023-11-01' },
  { id: '6', ref: 'PRJ-2024-0037', title: 'Bureaux Zone 4', client: 'Entreprise SIFCA', type: 'Bureaux', city: 'Zone 4', status: 'study', progress: 15, budget: 180000000, startDate: '2024-01-12' },
  { id: '7', ref: 'PRJ-2024-0036', title: 'Villa Yopougon', client: 'Koné F.', type: 'Villa basse', city: 'Yopougon', status: 'suspended', progress: 20, budget: 65000000, startDate: '2023-10-15' },
  { id: '8', ref: 'PRJ-2024-0035', title: 'Hôtel Cocody', client: 'Hoteliers CI', type: 'Hôtel', city: 'Cocody', status: 'draft', progress: 0, budget: 500000000, startDate: null },
  { id: '9', ref: 'PRJ-2024-0034', title: 'VRD Songon', client: 'Muni. Songon', type: 'VRD', city: 'Songon', status: 'delivered', progress: 100, budget: 95000000, startDate: '2023-06-01' },
  { id: '10', ref: 'PRJ-2024-0033', title: 'Forage Abobo', client: 'Muni. Abobo', type: 'Hydraulique', city: 'Abobo', status: 'in_progress', progress: 55, budget: 250000000, startDate: '2023-11-20' },
];

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
  const { navigate } = useAppStore();
  const [tab, setTab] = useState('Tous');
  const [search, setSearch] = useState('');

  const filtered = mockProjects.filter(p => {
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
        <p className="text-sm text-muted-foreground">{mockProjects.length} projets au total</p>
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
        {filtered.map(p => (
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