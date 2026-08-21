'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Phone, Mail, MapPin, ChevronDown, ChevronUp, Plus, User as UserIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const mockClients = [
  { id: '1', name: 'Kouamé Adama', type: 'particulier', phone: '+225 07 08 09 10', email: 'kouame@email.ci', projects: 2, totalSpent: 120000000, city: 'Cocody', lastActivity: 'Il y a 2h', tags: ['VIP', 'Récurrent'] },
  { id: '2', name: 'Société Akwaba SARL', type: 'entreprise', phone: '+225 01 02 03 04', email: 'contact@akwaba.ci', projects: 3, totalSpent: 850000000, city: 'Plateau', lastActivity: 'Il y a 1h', tags: ['Entreprise', 'Promoteur'] },
  { id: '3', name: 'Diallo Moussa', type: 'particulier', phone: '+225 05 06 07 08', email: 'diallo.m@email.ci', projects: 1, totalSpent: 55000000, city: 'Riviera', lastActivity: 'Il y a 1 jour', tags: ['Nouveau'] },
  { id: '4', name: 'Promo Côte SA', type: 'promoteur', phone: '+225 01 12 13 14', email: 'info@promocote.ci', projects: 5, totalSpent: 2400000000, city: 'Bingerville', lastActivity: 'Il y a 30 min', tags: ['VIP', 'Promoteur'] },
  { id: '5', name: 'Traoré Koné', type: 'particulier', phone: '+225 07 98 76 54', email: 'traore.k@email.ci', projects: 1, totalSpent: 25000000, city: 'Marcory', lastActivity: 'Il y a 3 jours', tags: [] },
  { id: '6', name: 'Entreprise SIFCA', type: 'entreprise', phone: '+225 01 20 30 40', email: 'btp@sifca.ci', projects: 2, totalSpent: 430000000, city: 'Zone 4', lastActivity: 'Il y a 5h', tags: ['Entreprise'] },
  { id: '7', name: 'Koné Fatou', type: 'particulier', phone: '+225 05 11 22 33', email: 'kone.f@email.ci', projects: 1, totalSpent: 65000000, city: 'Yopougon', lastActivity: 'Il y a 1 semaine', tags: ['Récurrent'] },
  { id: '8', name: 'Mairie d\'Abobo', type: 'institution', phone: '+225 01 55 66 77', email: 'mairie@abobo.ci', projects: 3, totalSpent: 580000000, city: 'Abobo', lastActivity: 'Hier', tags: ['Institution'] },
];

const TYPE_LABELS: Record<string, string> = { particulier: 'Particulier', entreprise: 'Entreprise', promoteur: 'Promoteur', institution: 'Institution' };

export function AdminClients() {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = mockClients.filter(c => {
    if (!search) return true;
    return c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Clients</h1>
          <p className="text-sm text-muted-foreground">{mockClients.length} clients enregistrés</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Ajouter</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Nom, email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="space-y-2">
        {filtered.map(c => (
          <Card key={c.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{TYPE_LABELS[c.type]}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                    <span>{c.projects} projet{c.projects > 1 ? 's' : ''}</span>
                    <span>{(c.totalSpent / 1000000).toFixed(0)} M XOF</span>
                    <span>{c.lastActivity}</span>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>
                </div>
                {expandedId === c.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>

              <AnimatePresence>
                {expandedId === c.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div><p className="text-muted-foreground text-xs">Téléphone</p><p className="mt-0.5">{c.phone}</p></div>
                        <div><p className="text-muted-foreground text-xs">Email</p><p className="mt-0.5 truncate">{c.email}</p></div>
                        <div><p className="text-muted-foreground text-xs">Ville</p><p className="mt-0.5">{c.city}</p></div>
                        <div><p className="text-muted-foreground text-xs">Type</p><p className="mt-0.5">{TYPE_LABELS[c.type]}</p></div>
                      </div>
                      {c.tags.length > 0 && (
                        <div className="flex gap-1.5 mt-3">
                          {c.tags.map(t => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                        </div>
                      )}
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline">Voir les projets</Button>
                        <Button size="sm" variant="outline">Envoyer un message</Button>
                        <Button size="sm" variant="outline">Notes</Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}