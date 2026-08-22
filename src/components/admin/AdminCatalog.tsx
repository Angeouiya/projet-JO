'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Plus, Eye, Pencil, Trash2, EyeOff, Eye as EyeOn, MoreVertical, Grid3X3, List, Gem
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const STANDING_LABELS: Record<string, string> = { economique: 'Économique', standard: 'Standard', premium: 'Premium', luxe: 'Luxe' };

const mockModels = [
  { id: '1', name: 'Villa Émeraude', category: 'Villa basse', standing: 'luxe', image: '/images/villa-1.png', status: 'published', views: 234, selections: 12 },
  { id: '2', name: 'Duplex Horizon', category: 'Duplex', standing: 'premium', image: '/images/duplex-1.png', status: 'published', views: 189, selections: 8 },
  { id: '3', name: 'Immeuble Skyline', category: 'Immeuble', standing: 'premium', image: '/images/immeuble-1.png', status: 'published', views: 156, selections: 5 },
  { id: '4', name: 'Cité Palmiers', category: 'Cité résidentielle', standing: 'luxe', image: '/images/cite-1.png', status: 'published', views: 312, selections: 18 },
  { id: '5', name: 'Bureau Modern', category: 'Bureaux', standing: 'standard', image: '/images/bureau-1.png', status: 'published', views: 98, selections: 3 },
  { id: '6', name: 'Hôtel Prestige', category: 'Hôtel', standing: 'luxe', image: '/images/hotel-1.png', status: 'draft', views: 0, selections: 0 },
  { id: '7', name: 'Triplex Zenith', category: 'Triplex', standing: 'premium', image: '/images/villa-1.png', status: 'published', views: 145, selections: 7 },
  { id: '8', name: 'Villa Éco', category: 'Villa basse', standing: 'economique', image: '/images/villa-1.png', status: 'published', views: 267, selections: 15 },
];

export function AdminCatalog() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filtered = mockModels.filter(m =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Catalogue</h1>
          <p className="text-sm text-muted-foreground">{mockModels.length} modèles</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Ajouter</Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Modèle, catégorie..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex bg-muted rounded-lg p-0.5">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm' : ''}`}><Grid3X3 className="w-4 h-4" /></button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-background shadow-sm' : ''}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <motion.div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {filtered.map(m => (
            <Card key={m.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative aspect-[4/3] bg-muted">
                {m.image && <img src={m.image} alt={m.name} className="w-full h-full object-cover" />}
                <div className="absolute top-2 left-2 flex gap-1">
                  <Badge variant={m.status === 'published' ? 'default' : 'secondary'} className="text-[10px]">
                    {m.status === 'published' ? 'Publié' : 'Brouillon'}
                  </Badge>
                  {m.standing === 'luxe' && <Badge variant="secondary" className="text-[10px]"><Gem className="w-2.5 h-2.5 mr-0.5" />Luxe</Badge>}
                </div>
              </div>
              <CardContent className="p-3">
                <p className="text-sm font-medium truncate">{m.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{m.category}</p>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>{m.views} vues</span>
                  <span>{m.selections} sélections</span>
                </div>
                <div className="flex gap-1.5 mt-3">
                  <Button size="sm" variant="outline" className="flex-1 text-xs h-7"><Eye className="w-3 h-3 mr-1" />Voir</Button>
                  <Button size="sm" variant="outline" className="h-7 w-7 p-0"><Pencil className="w-3 h-3" /></Button>
                  <Button size="sm" variant="outline" className="h-7 w-7 p-0">
                    {m.status === 'published' ? <EyeOff className="w-3 h-3" /> : <EyeOn className="w-3 h-3" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      ) : (
        <motion.div className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {filtered.map(m => (
            <Card key={m.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 flex items-center gap-4">
                <div className="w-16 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
                  {m.image && <img src={m.image} alt={m.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <Badge variant={m.status === 'published' ? 'default' : 'secondary'} className="text-[10px]">{m.status === 'published' ? 'Publié' : 'Brouillon'}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{m.category} · {STANDING_LABELS[m.standing]}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground shrink-0 hidden sm:block">
                  <p>{m.views} vues</p>
                  <p>{m.selections} sélections</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="outline" className="h-7 w-7 p-0"><Pencil className="w-3 h-3" /></Button>
                  <Button size="sm" variant="outline" className="h-7 w-7 p-0"><Trash2 className="w-3 h-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}
    </div>
  );
}
