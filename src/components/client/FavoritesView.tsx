'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Heart, Maximize2, BedDouble, Bath, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/app-store';
import { FORMAT_SHORT_XOF } from '@/types';
import type { CatalogModelData } from '@/types';

const MOCK_FAVORITE_MODELS: (CatalogModelData & { image: string })[] = [
  {
    id: '1', name: 'Villa Aurore', slug: 'villa-aurore', categoryId: 'villa',
    categoryName: 'Villa basse', mainImage: '/images/villa-1.png', images: ['/images/villa-1.png'],
    plans: [], levels: 1, bedrooms: 4, bathrooms: 3, surfaceArea: 220,
    minLandArea: 500, standing: 'Premium', style: 'Moderne',
    equipment: ['Piscine', 'Garage', 'Climatisation', 'Cuisine américaine'],
    budgetMin: 55_000_000, budgetMax: 75_000_000, durationMin: 6, durationMax: 9,
    features: [], viewCount: 342, isPublished: true, isFeatured: true, image: '/images/villa-1.png',
  },
  {
    id: '2', name: 'Duplex Horizon', slug: 'duplex-horizon', categoryId: 'duplex',
    categoryName: 'Duplex', mainImage: '/images/duplex-1.png', images: ['/images/duplex-1.png'],
    plans: [], levels: 2, bedrooms: 5, bathrooms: 4, surfaceArea: 310,
    minLandArea: 400, standing: 'Luxe', style: 'Contemporain',
    equipment: ['Piscine', 'Garage double', 'Terrasse', 'Climatisation'],
    budgetMin: 85_000_000, budgetMax: 120_000_000, durationMin: 8, durationMax: 12,
    features: [], viewCount: 287, isPublished: true, isFeatured: true, image: '/images/duplex-1.png',
  },
  {
    id: '4', name: 'Villa Émeraude', slug: 'villa-emeraude', categoryId: 'villa',
    categoryName: 'Villa basse', mainImage: '/images/villa-1.png', images: ['/images/villa-1.png'],
    plans: [], levels: 1, bedrooms: 3, bathrooms: 2, surfaceArea: 150,
    minLandArea: 350, standing: 'Standard', style: 'Moderne',
    equipment: ['Garage', 'Cuisine équipée', 'Jardin'],
    budgetMin: 30_000_000, budgetMax: 45_000_000, durationMin: 4, durationMax: 7,
    features: [], viewCount: 456, isPublished: true, isFeatured: false, image: '/images/villa-1.png',
  },
];

export function FavoritesView() {
  const { goBack, navigate, userFavorites, toggleFavorite } = useAppStore();

  // Filter mock models to only show those in favorites
  const favoriteModels = MOCK_FAVORITE_MODELS.filter(m => userFavorites.includes(m.id));

  return (
    <main className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="size-9" onClick={goBack}>
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="font-bold text-lg">Mes favoris</h1>
          {favoriteModels.length > 0 && (
            <span className="text-sm text-muted-foreground">({favoriteModels.length})</span>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 mt-4">
        <AnimatePresence mode="popLayout">
          {favoriteModels.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {favoriteModels.map((model, i) => (
                <motion.div
                  key={model.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="group cursor-pointer relative">
                    {/* Image */}
                    <div
                      className="aspect-[4/3] overflow-hidden rounded-lg bg-muted"
                      onClick={() => navigate('model-detail', { id: model.id })}
                    >
                      <img
                        src={model.image || model.mainImage || model.images[0]}
                        alt={model.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <Badge variant="secondary" className="absolute top-2 left-2 text-[10px] font-medium">
                        {model.standing}
                      </Badge>
                    </div>

                    {/* Remove button */}
                    <button
                      className="absolute top-2 right-2 size-8 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors shadow-sm"
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(model.id); }}
                      aria-label="Retirer des favoris"
                    >
                      <Heart className="size-4 fill-foreground" />
                    </button>

                    {/* Info */}
                    <div
                      className="mt-2.5"
                      onClick={() => navigate('model-detail', { id: model.id })}
                    >
                      <h3 className="text-sm font-semibold leading-tight line-clamp-1">{model.name}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{model.categoryName}</p>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Maximize2 className="size-3" />{model.surfaceArea} m²
                        </span>
                        <span className="flex items-center gap-0.5">
                          <BedDouble className="size-3" />{model.bedrooms}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Bath className="size-3" />{model.bathrooms}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs font-semibold">
                        {FORMAT_SHORT_XOF(model.budgetMin!)} – {FORMAT_SHORT_XOF(model.budgetMax!)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="size-16 rounded-full bg-muted flex items-center justify-center">
                <Heart className="size-7 text-muted-foreground/40" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Vous n'avez pas encore de favoris.
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">
                Explorez nos modèles et ajoutez ceux qui vous plaisent en favoris.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-5 gap-1.5"
                onClick={() => navigate('explore')}
              >
                Explorer les modèles
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
