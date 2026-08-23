'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
import { DEFAULT_CATALOG_MODELS } from '@/data/catalog-models';
import { FORMAT_XOF, FORMAT_SHORT_XOF } from '@/types';
import type { CatalogModelData } from '@/types';

const FALLBACK_MODELS_MAP = Object.fromEntries(DEFAULT_CATALOG_MODELS.map(model => [model.id, model]));

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
  const { viewParams, goBack, navigate, requireAuth, userFavorites, toggleFavorite, addToast } = useAppStore();
  const modelId = viewParams?.id || '1';
  const [catalogModels, setCatalogModels] = useState<CatalogModelData[]>(DEFAULT_CATALOG_MODELS);
  const [activeImage, setActiveImage] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);
  const similarRef = useRef(null);
  const isSimilarInView = useInView(similarRef, { once: true, margin: '-40px' });
  const catalogMap = useMemo(
    () => Object.fromEntries(catalogModels.map(item => [item.id, item])),
    [catalogModels]
  );
  const model = catalogMap[modelId] || catalogModels.find(item => item.slug === modelId) || FALLBACK_MODELS_MAP[modelId];

  useEffect(() => {
    let active = true;
    const loadCatalog = async () => {
      try {
        const response = await fetch('/api/models?limit=60', { cache: 'no-store' });
        const payload = await response.json().catch(() => null) as { models?: CatalogModelData[] } | null;
        if (!active) return;
        if (response.ok && payload?.models?.length) setCatalogModels(payload.models);
      } catch {
        if (active) setCatalogModels(DEFAULT_CATALOG_MODELS);
      }
    };
    void loadCatalog();
    return () => { active = false; };
  }, []);

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
  const similarModels = similarIds.map(id => catalogMap[id] || FALLBACK_MODELS_MAP[id]).filter(Boolean);

  const goPrevImage = () => setActiveImage(i => (i - 1 + images.length) % images.length);
  const goNextImage = () => setActiveImage(i => (i + 1) % images.length);
  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `${model.name} - ${model.categoryName || 'Buildify'}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: model.name, text, url });
        addToast('Partage du modèle préparé.', 'success');
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        addToast('Lien du modèle copié.', 'success');
      } else {
        addToast('Partage indisponible sur cet appareil.', 'info');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      addToast('Partage indisponible sur cet appareil.', 'info');
    }
  };

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
          <Button variant="ghost" size="icon" onClick={handleShare} aria-label="Partager ce modèle">
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
