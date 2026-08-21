'use client';

import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  ArrowLeft, X, Building, Maximize2, Users, MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/app-store';

const CATEGORIES = ['Tout', 'Villa', 'Duplex', 'Immeuble', 'Cité', 'VRD', 'Hydraulique'];

interface Realization {
  id: string;
  title: string;
  category: string;
  image: string;
  images: string[];
  city: string;
  surface: number;
  year: string;
  description: string;
  span?: 'col-span-2' | 'row-span-2';
}

const REALIZATIONS: Realization[] = [
  {
    id: 'r1', title: 'Villa Cocody Palmeraie', category: 'Villa',
    image: '/images/villa-1.png', images: ['/images/villa-1.png', '/images/interieur-1.png'],
    city: 'Abidjan', surface: 280, year: '2024',
    description: 'Villa R+1 avec piscine et jardin paysager. Livrée en 7 mois.',
    span: 'col-span-2',
  },
  {
    id: 'r2', title: 'Résidence Riviera 3', category: 'Duplex',
    image: '/images/duplex-1.png', images: ['/images/duplex-1.png'],
    city: 'Abidjan', surface: 310, year: '2024',
    description: 'Duplex contemporain, 5 chambres, garage double.',
  },
  {
    id: 'r3', title: 'Immeuble Le Plateau', category: 'Immeuble',
    image: '/images/immeuble-1.png', images: ['/images/immeuble-1.png', '/images/chantier-1.png'],
    city: 'Abidjan', surface: 1800, year: '2023',
    description: 'R+4 avec commerces RDC et parking sous-sol.',
  },
  {
    id: 'r4', title: 'Cité Marcory 12', category: 'Cité',
    image: '/images/cite-1.png', images: ['/images/cite-1.png'],
    city: 'Abidjan', surface: 120, year: '2024',
    description: 'Programme de 8 unités résidentielles économiques.',
    span: 'row-span-2',
  },
  {
    id: 'r5', title: 'Chantier VRD Yamoussoukro', category: 'VRD',
    image: '/images/road-1.png', images: ['/images/road-1.png', '/images/chantier-1.png'],
    city: 'Yamoussoukro', surface: 15000, year: '2023',
    description: 'Voirie et assainissement pour lotissement de 50 parcelles.',
  },
  {
    id: 'r6', title: 'Villa Bingerville Mer', category: 'Villa',
    image: '/images/villa-1.png', images: ['/images/villa-1.png'],
    city: 'Bingerville', surface: 200, year: '2024',
    description: 'Villa de plain-pied au style tropical, vue mer.',
  },
  {
    id: 'r7', title: 'Hôtel San-Pédro', category: 'Immeuble',
    image: '/images/hotel-1.png', images: ['/images/hotel-1.png', '/images/interieur-1.png'],
    city: 'San-Pédro', surface: 2200, year: '2023',
    description: 'Hôtel 4 étages avec 40 chambres et piscine.',
    span: 'col-span-2',
  },
  {
    id: 'r8', title: 'Réseau hydraulique Soubré', category: 'Hydraulique',
    image: '/images/hydraulique-1.png', images: ['/images/hydraulique-1.png'],
    city: 'Soubré', surface: 5000, year: '2024',
    description: "Adduction d'eau pour zone rurale, 3 km de réseau.",
  },
  {
    id: 'r9', title: 'Bureaux Plateau', category: 'Immeuble',
    image: '/images/bureau-1.png', images: ['/images/bureau-1.png', '/images/interieur-1.png'],
    city: 'Abidjan', surface: 800, year: '2024',
    description: 'Immeuble de bureaux R+3 avec parking.',
  },
  {
    id: 'r10', title: 'Duplex Bouaké', category: 'Duplex',
    image: '/images/duplex-1.png', images: ['/images/duplex-1.png'],
    city: 'Bouaké', surface: 260, year: '2023',
    description: 'Duplex 4 chambres livré en 8 mois.',
  },
  {
    id: 'r11', title: 'Villa Anyama', category: 'Villa',
    image: '/images/villa-1.png', images: ['/images/villa-1.png'],
    city: 'Anyama', surface: 160, year: '2024',
    description: 'Villa économique 3 chambres, livrée en 5 mois.',
  },
  {
    id: 'r12', title: 'Route Daloa', category: 'VRD',
    image: '/images/road-1.png', images: ['/images/road-1.png', '/images/chantier-1.png'],
    city: 'Daloa', surface: 8000, year: '2023',
    description: 'Aménagement de 2 km de route en terre bitumée.',
    span: 'col-span-2',
  },
];

const STATS = [
  { value: '127', label: 'Projets livrés', icon: Building },
  { value: '48 000 m²', label: 'Construits', icon: Maximize2 },
  { value: '89', label: 'Clients satisfaits', icon: Users },
  { value: '14', label: 'Villes couvertes', icon: MapPin },
];

export function RealizationsView() {
  const goBack = useAppStore(s => s.goBack);
  const [activeCategory, setActiveCategory] = useState('Tout');
  const [selected, setSelected] = useState<Realization | null>(null);
  const gridRef = useRef(null);
  const isInView = useInView(gridRef, { once: true, margin: '-40px' });

  const filtered = activeCategory === 'Tout'
    ? REALIZATIONS
    : REALIZATIONS.filter(r => r.category === activeCategory);

  return (
    <main className="min-h-screen bg-background pb-12">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="font-bold text-lg">Réalisations</h1>
        </div>
        {/* Category pills */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border mx-4 mt-4 rounded-xl overflow-hidden">
        {STATS.map(stat => (
          <div key={stat.label} className="bg-background p-4 md:p-6 text-center">
            <stat.icon className="size-5 mx-auto text-muted-foreground" />
            <p className="mt-2 text-xl md:text-2xl font-bold tracking-tight">{stat.value}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Gallery grid */}
      <motion.div
        ref={gridRef}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5 }}
        className="mt-6 px-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-[200px] md:auto-rows-[240px]"
      >
        {filtered.map(r => (
          <motion.div
            key={r.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`relative overflow-hidden rounded-xl cursor-pointer group ${r.span || ''}`}
            onClick={() => setSelected(r)}
          >
            <img
              src={r.image}
              alt={r.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
              <Badge variant="secondary" className="text-[10px] mb-1.5">{r.category}</Badge>
              <p className="text-white text-sm font-semibold leading-tight line-clamp-1">{r.title}</p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-white/60">
                <span>{r.city}</span>
                <span>·</span>
                <span>{r.year}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building className="size-10 text-muted-foreground/30" />
          <p className="mt-4 text-sm text-muted-foreground">Aucune réalisation dans cette catégorie.</p>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-background w-full md:max-w-2xl md:rounded-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={selected.image}
                alt={selected.title}
                className="w-full aspect-video object-cover md:rounded-t-2xl"
              />
              <button
                onClick={() => setSelected(null)}
                className="absolute top-3 right-3 size-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center md:hidden"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-5 md:p-8">
              <Badge variant="outline" className="text-xs">{selected.category}</Badge>
              <h2 className="mt-3 text-xl md:text-2xl font-bold tracking-tight">{selected.title}</h2>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="size-3.5" />{selected.city}</span>
                <span className="flex items-center gap-1"><Maximize2 className="size-3.5" />{selected.surface.toLocaleString()} m²</span>
                <span>{selected.year}</span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{selected.description}</p>
              <Button variant="outline" className="mt-6 w-full md:hidden" onClick={() => setSelected(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
