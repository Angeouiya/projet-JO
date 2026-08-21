'use client';

import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Heart, Share2, Maximize2, BedDouble, Bath,
  Layers, Ruler, Clock, ChevronLeft, ChevronRight, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/stores/app-store';
import { FORMAT_XOF, FORMAT_SHORT_XOF } from '@/types';
import type { CatalogModelData } from '@/types';

const MODELS_MAP: Record<string, CatalogModelData> = {
  '1': {
    id: '1', name: 'Villa Aurore', slug: 'villa-aurore', categoryId: 'villa',
    categoryName: 'Villa basse', mainImage: '/images/villa-1.png',
    images: ['/images/villa-1.png', '/images/interieur-1.png', '/images/plan-1.png'],
    plans: ['/images/plan-1.png'], levels: 1, bedrooms: 4, bathrooms: 3, surfaceArea: 220,
    minLandArea: 500, standing: 'Premium', style: 'Moderne',
    equipment: ['Piscine', 'Garage', 'Climatisation', 'Cuisine américaine', 'Jardin paysager', 'Terrasse couverte'],
    budgetMin: 55_000_000, budgetMax: 75_000_000, durationMin: 6, durationMax: 9,
    description: 'Villa contemporaine à toit plat avec piscine, idéale pour les familles. Design moderne avec de grandes ouvertures et un jardin paysager.',
    features: ['Séjour double hauteur', 'Suite parentale avec dressing', 'Cuisine ouverte sur terrasse', 'Piscine à débordement'],
    viewCount: 342, isPublished: true, isFeatured: true,
  },
  '2': {
    id: '2', name: 'Duplex Horizon', slug: 'duplex-horizon', categoryId: 'duplex',
    categoryName: 'Duplex', mainImage: '/images/duplex-1.png',
    images: ['/images/duplex-1.png', '/images/interieur-1.png', '/images/plan-1.png'],
    plans: ['/images/plan-1.png'], levels: 2, bedrooms: 5, bathrooms: 4, surfaceArea: 310,
    minLandArea: 400, standing: 'Luxe', style: 'Contemporain',
    equipment: ['Piscine', 'Garage double', 'Terrasse', 'Climatisation', 'Cave', 'Buanderie'],
    budgetMin: 85_000_000, budgetMax: 120_000_000, durationMin: 8, durationMax: 12,
    description: 'Duplex haut standing avec vue panoramique depuis la terrasse du 2e étage. Finitions luxueuses et équipements modernes.',
    features: ['Terrasse panoramique', 'Garage double', 'Cave privative', 'Suite parentale avec balcon'],
    viewCount: 287, isPublished: true, isFeatured: true,
  },
  '3': {
    id: '3', name: 'Immeuble Élysée', slug: 'immeuble-elysee', categoryId: 'immeuble',
    categoryName: 'Immeuble', mainImage: '/images/immeuble-1.png',
    images: ['/images/immeuble-1.png', '/images/chantier-1.png', '/images/plan-1.png'],
    plans: ['/images/plan-1.png'], levels: 4, bedrooms: 16, bathrooms: 16, surfaceArea: 1800,
    minLandArea: 600, standing: 'Luxe', style: 'Néoclassique',
    equipment: ['Ascenseur', 'Parking sous-sol', 'Gardien', 'Climatisation centrale', 'Générateur', 'Citerne'],
    budgetMin: 350_000_000, budgetMax: 500_000_000, durationMin: 14, durationMax: 20,
    description: 'Immeuble R+4 avec commerces en rez-de-chaussée et appartements de standing. Idéal pour investisseurs.',
    features: ['4 apparts par étage', 'Commerces RDC', 'Parking sous-sol 12 places', 'Ascenseur 8 personnes'],
    viewCount: 198, isPublished: true, isFeatured: true,
  },
  '4': {
    id: '4', name: 'Villa Émeraude', slug: 'villa-emeraude', categoryId: 'villa',
    categoryName: 'Villa basse', mainImage: '/images/villa-1.png',
    images: ['/images/villa-1.png', '/images/interieur-1.png'],
    plans: ['/images/plan-1.png'], levels: 1, bedrooms: 3, bathrooms: 2, surfaceArea: 150,
    minLandArea: 350, standing: 'Standard', style: 'Moderne',
    equipment: ['Garage', 'Cuisine équipée', 'Jardin', 'Débord de toit'],
    budgetMin: 30_000_000, budgetMax: 45_000_000, durationMin: 4, durationMax: 7,
    description: 'Villa familiale compacte et fonctionnelle. Idéale pour un premier achat ou un investissement locatif.',
    features: ['Séjour lumineux', '3 chambres avec rangements', 'Jardin clôturé', 'Garage attenant'],
    viewCount: 456, isPublished: true, isFeatured: false,
  },
  '5': {
    id: '5', name: 'Cité Résidentielle', slug: 'cite-residentielle', categoryId: 'cite',
    categoryName: 'Cité', mainImage: '/images/cite-1.png',
    images: ['/images/cite-1.png', '/images/chantier-1.png'],
    plans: [], levels: 2, bedrooms: 3, bathrooms: 2, surfaceArea: 120,
    minLandArea: 200, standing: 'Économique', style: 'Pratique',
    equipment: ['Garage', 'Espace vert', 'Clôture', 'Fosse septique'],
    budgetMin: 18_000_000, budgetMax: 28_000_000, durationMin: 5, durationMax: 8,
    description: 'Unité résidentielle économique pour programmes de cité. Construction rapide et budget maîtrisé.',
    features: ['2 niveaux compacts', 'Espaces verts communs', 'Assainissement intégré', 'Budget optimisé'],
    viewCount: 521, isPublished: true, isFeatured: false,
  },
  '6': {
    id: '6', name: 'Triplex Prestige', slug: 'triplex-prestige', categoryId: 'triplex',
    categoryName: 'Triplex', mainImage: '/images/triplex-1.png',
    images: ['/images/triplex-1.png', '/images/interieur-1.png', '/images/plan-1.png'],
    plans: ['/images/plan-1.png'], levels: 3, bedrooms: 6, bathrooms: 5, surfaceArea: 420,
    minLandArea: 500, standing: 'Luxe', style: 'Contemporain',
    equipment: ['Piscine', 'Garage triple', 'Rooftop', 'Domotique', 'Climatisation', 'Cave'],
    budgetMin: 120_000_000, budgetMax: 180_000_000, durationMin: 10, durationMax: 14,
    description: 'Triplex d\'exception avec rooftop privatif et domotique intégrée. Le summum du confort urbain.',
    features: ['Rooftop avec vue panoramique', 'Domotique complète', '6 chambres dont 2 suites', 'Cave et buanderie'],
    viewCount: 176, isPublished: true, isFeatured: true,
  },
  '7': {
    id: '7', name: 'Villa Bambou', slug: 'villa-bambou', categoryId: 'villa',
    categoryName: 'Villa basse', mainImage: '/images/villa-1.png',
    images: ['/images/villa-1.png', '/images/interieur-1.png'],
    plans: [], levels: 1, bedrooms: 2, bathrooms: 1, surfaceArea: 95,
    minLandArea: 250, standing: 'Économique', style: 'Tropical',
    equipment: ['Terrasse', 'Jardin'],
    budgetMin: 15_000_000, budgetMax: 22_000_000, durationMin: 3, durationMax: 5,
    description: 'Petite villa tropicale économique, parfaite pour les jeunes ménages ou comme maison de vacances.',
    features: ['2 chambres spacieuses', 'Terrasse ouverte', 'Jardin tropical', 'Construction rapide'],
    viewCount: 634, isPublished: true, isFeatured: false,
  },
  '8': {
    id: '8', name: 'Immeuble Commerce', slug: 'immeuble-commerce', categoryId: 'immeuble',
    categoryName: 'Immeuble', mainImage: '/images/immeuble-1.png',
    images: ['/images/immeuble-1.png', '/images/chantier-1.png', '/images/plan-1.png'],
    plans: ['/images/plan-1.png'], levels: 5, bedrooms: 20, bathrooms: 20, surfaceArea: 2500,
    minLandArea: 800, standing: 'Premium', style: 'Moderne',
    equipment: ['Ascenseur', 'Parking', 'Boutiques RDC', 'Gardien 24/7', 'Générateur'],
    budgetMin: 450_000_000, budgetMax: 700_000_000, durationMin: 18, durationMax: 24,
    description: 'Immeuble mixte R+5 avec commerces en rez-de-chaussée et appartements aux étages. Rentabilité assurée.',
    features: ['5 niveaux habitables', 'Boutiques et bureaux RDC', 'Parking sous-sol', 'Gardien 24h/24'],
    viewCount: 143, isPublished: true, isFeatured: false,
  },
  '9': {
    id: '9', name: 'Duplex Cocody', slug: 'duplex-cocody', categoryId: 'duplex',
    categoryName: 'Duplex', mainImage: '/images/duplex-1.png',
    images: ['/images/duplex-1.png', '/images/interieur-1.png', '/images/plan-1.png'],
    plans: ['/images/plan-1.png'], levels: 2, bedrooms: 4, bathrooms: 3, surfaceArea: 260,
    minLandArea: 350, standing: 'Premium', style: 'Contemporain',
    equipment: ['Piscine', 'Garage', 'Buanderie', 'Climatisation'],
    budgetMin: 65_000_000, budgetMax: 90_000_000, durationMin: 7, durationMax: 10,
    description: 'Duplex premium avec piscine, idéal pour les quartiers résidentiels d\'Abidjan.',
    features: ['4 chambres dont suite parentale', 'Piscine privée', 'Garage indépendant', 'Buanderie'],
    viewCount: 298, isPublished: true, isFeatured: true,
  },
  '10': {
    id: '10', name: 'Villa Palmiers', slug: 'villa-palmiers', categoryId: 'villa',
    categoryName: 'Villa basse', mainImage: '/images/villa-1.png',
    images: ['/images/villa-1.png', '/images/interieur-1.png', '/images/plan-1.png'],
    plans: ['/images/plan-1.png'], levels: 1, bedrooms: 5, bathrooms: 4, surfaceArea: 320,
    minLandArea: 600, standing: 'Luxe', style: 'Balinais',
    equipment: ['Piscine', 'Garage double', 'Jardin paysager', 'Suite parentale', 'Climatisation', 'Pool house'],
    budgetMin: 90_000_000, budgetMax: 130_000_000, durationMin: 8, durationMax: 12,
    description: 'Villa de luxe au style balinais avec piscine à débordement et jardin paysager. Un cadre de vie exceptionnel.',
    features: ['Style balinais authentique', 'Piscine avec pool house', 'Suite parentale VIP', 'Jardin paysager'],
    viewCount: 412, isPublished: true, isFeatured: true,
  },
};

const SIMILAR_IDS: Record<string, string[]> = {
  '1': ['4', '7', '10', '9'],
  '2': ['9', '6', '1'],
  '3': ['8'],
  '4': ['7', '1', '5'],
  '5': ['7', '4'],
  '6': ['2', '9', '10'],
  '7': ['4', '5', '1'],
  '8': ['3'],
  '9': ['2', '6', '1'],
  '10': ['1', '6', '2'],
};

export function ModelDetailView() {
  const { viewParams, goBack, navigate, requireAuth, userFavorites, toggleFavorite } = useAppStore();
  const modelId = viewParams?.id || '1';
  const model = MODELS_MAP[modelId];
  const [activeImage, setActiveImage] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);
  const similarRef = useRef(null);
  const isSimilarInView = useInView(similarRef, { once: true, margin: '-40px' });

  if (!model) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Modèle introuvable.</p>
          <Button variant="outline" className="mt-4" onClick={goBack}>Retour</Button>
        </div>
      </main>
    );
  }

  const images = model.images.length > 0 ? model.images : [model.mainImage || ''];
  const isFav = userFavorites.includes(model.id);
  const similarIds = SIMILAR_IDS[model.id] || [];
  const similarModels = similarIds.map(id => MODELS_MAP[id]).filter(Boolean);

  const goPrevImage = () => setActiveImage(i => (i - 1 + images.length) % images.length);
  const goNextImage = () => setActiveImage(i => (i + 1) % images.length);

  const standingClass = model.standing === 'Luxe'
    ? 'bg-foreground text-background'
    : model.standing === 'Premium'
      ? 'bg-foreground/80 text-background'
      : 'bg-secondary text-secondary-foreground';

  return (
    <main className="min-h-screen bg-background pb-12">
      {/* Top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => toggleFavorite(model.id)}>
            <Heart className={`size-5 ${isFav ? 'fill-foreground' : ''}`} />
          </Button>
          <Button variant="ghost" size="icon">
            <Share2 className="size-5" />
          </Button>
        </div>
      </div>

      {/* Image gallery */}
      <div className="relative">
        <div
          ref={galleryRef}
          className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
          onTouchEnd={(e) => {
            if (!galleryRef.current) return;
            const scrollLeft = galleryRef.current.scrollLeft;
            const itemWidth = galleryRef.current.clientWidth;
            const newIndex = Math.round(scrollLeft / itemWidth);
            if (newIndex !== activeImage) setActiveImage(newIndex);
          }}
        >
          {images.map((img, i) => (
            <div key={i} className="w-full flex-shrink-0 snap-center aspect-[4/3] md:aspect-[16/9]">
              <img src={img} alt={`${model.name} - ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <>
            <button
              onClick={goPrevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={goNextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
            >
              <ChevronRight className="size-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all ${
                    i === activeImage ? 'w-6 bg-background' : 'w-1.5 bg-background/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 lg:px-16 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mt-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Badge className={standingClass}>{model.standing}</Badge>
              <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight">{model.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{model.categoryName} · {model.style}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Eye className="size-3.5" />
              {model.viewCount}
            </div>
          </div>
          {model.description && (
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{model.description}</p>
          )}
        </div>

        <Separator className="my-6" />

        {/* Key specs */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <SpecCard icon={Maximize2} label="Surface" value={`${model.surfaceArea} m²`} />
          <SpecCard icon={Layers} label="Niveaux" value={`${model.levels}`} />
          <SpecCard icon={BedDouble} label="Chambres" value={`${model.bedrooms ?? '-'}`} />
          <SpecCard icon={Bath} label="Salles de bain" value={`${model.bathrooms ?? '-'}`} />
          <SpecCard icon={Ruler} label="Terrain min" value={`${model.minLandArea} m²`} />
          <SpecCard icon={Clock} label="Durée" value={`${model.durationMin}–${model.durationMax} mois`} />
        </div>

        <Separator className="my-6" />

        {/* Budget */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Budget estimé</h2>
          <p className="mt-2 text-xl md:text-2xl font-bold">
            {FORMAT_XOF(model.budgetMin!)} — {FORMAT_XOF(model.budgetMax!)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            soit environ {FORMAT_SHORT_XOF(model.budgetMin!)} — {FORMAT_SHORT_XOF(model.budgetMax!)}
          </p>
        </div>

        <Separator className="my-6" />

        {/* Equipment */}
        {model.equipment.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Équipements</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {model.equipment.map(eq => (
                <Badge key={eq} variant="outline" className="py-1 px-3 text-xs font-normal">
                  {eq}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        {model.features && model.features.length > 0 && (
          <>
            <Separator className="my-6" />
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Points forts</h2>
              <ul className="mt-3 space-y-2">
                {model.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 size-1.5 rounded-full bg-foreground flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Action buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-background pt-4 pb-4 -mx-4 px-4 border-t md:static md:bg-transparent md:border-0 md:pt-0 md:pb-0">
          <Button
            size="lg"
            className="h-12 text-sm font-semibold"
            onClick={() => requireAuth('configurator', { modelId: model.id })}
          >
            Choisir ce modèle
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-12 text-sm font-semibold"
            onClick={() => navigate('configurator', { modelId: model.id })}
          >
            Personnaliser
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-12 text-sm font-semibold"
            onClick={() => requireAuth('create', { modelId: model.id })}
          >
            Demander une estimation
          </Button>
        </div>

        {/* Similar models */}
        {similarModels.length > 0 && (
          <motion.div
            ref={similarRef}
            initial={{ opacity: 0, y: 30 }}
            animate={isSimilarInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="mt-12"
          >
            <h2 className="text-lg font-bold">Modèles similaires</h2>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {similarModels.map(m => (
                <div
                  key={m.id}
                  className="cursor-pointer group"
                  onClick={() => { navigate('model-detail', { id: m.id }); setActiveImage(0); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                    <img
                      src={m.mainImage || m.images[0]}
                      alt={m.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <Badge variant="secondary" className="absolute top-2 left-2 text-[10px]">{m.standing}</Badge>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold line-clamp-1">{m.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{m.surfaceArea} m² · {m.bedrooms} ch.</p>
                  <p className="text-xs font-medium mt-0.5">{FORMAT_SHORT_XOF(m.budgetMin!)} — {FORMAT_SHORT_XOF(m.budgetMax!)}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}

function SpecCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Card className="py-0 gap-0 border-border/50">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="size-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold mt-0.5">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
