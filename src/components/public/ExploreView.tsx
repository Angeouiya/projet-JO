'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Search, SlidersHorizontal, Heart, Maximize2, BedDouble, Bath,
  Layers, ArrowUpDown, X, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/stores/app-store';
import { DEFAULT_CATALOG_MODELS } from '@/data/catalog-models';
import { FORMAT_SHORT_XOF } from '@/types';
import type { CatalogModelData, FilterState } from '@/types';

const FALLBACK_MODELS = DEFAULT_CATALOG_MODELS;

const CATEGORY_PILLS = [
  { value: 'all', label: 'Tout' },
  { value: 'villa', label: 'Villa' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'triplex', label: 'Triplex' },
  { value: 'immeuble', label: 'Immeuble' },
  { value: 'cite', label: 'Cité' },
];

const SORT_OPTIONS = [
  { value: 'popular', label: 'Populaires' },
  { value: 'recent', label: 'Récents' },
  { value: 'price-asc', label: 'Prix croissant' },
  { value: 'price-desc', label: 'Prix décroissant' },
];

type SortValue = 'popular' | 'recent' | 'price-asc' | 'price-desc';

export function ExploreView() {
  const { navigate, filters, setFilters, resetFilters, userFavorites, toggleFavorite } = useAppStore();
  const [catalogModels, setCatalogModels] = useState<CatalogModelData[]>(FALLBACK_MODELS);
  const [catalogReady, setCatalogReady] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortValue>('popular');
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  const [localFilters, setLocalFilters] = useState<FilterState>({ ...filters });

  useEffect(() => {
    let active = true;
    const loadCatalog = async () => {
      try {
        const response = await fetch('/api/models?limit=60', { cache: 'no-store' });
        const payload = await response.json().catch(() => null) as { models?: CatalogModelData[] } | null;
        if (!active) return;
        const nextModels = response.ok && payload?.models?.length ? payload.models : FALLBACK_MODELS;
        setCatalogModels(nextModels);
      } catch {
        if (active) setCatalogModels(FALLBACK_MODELS);
      } finally {
        if (active) setCatalogReady(true);
      }
    };
    void loadCatalog();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    let result = [...catalogModels];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.categoryName?.toLowerCase().includes(q) ||
        m.standing?.toLowerCase().includes(q)
      );
    }

    if (activeCategory !== 'all') {
      result = result.filter(m => m.categoryId === activeCategory);
    }

    if (filters.standing) {
      result = result.filter(m => m.standing?.toLowerCase() === filters.standing?.toLowerCase());
    }
    if (filters.bedrooms) {
      result = result.filter(m => (m.bedrooms ?? 0) >= (filters.bedrooms ?? 0));
    }
    if (filters.surfaceMin) {
      result = result.filter(m => (m.surfaceArea ?? 0) >= (filters.surfaceMin ?? 0));
    }
    if (filters.surfaceMax) {
      result = result.filter(m => (m.surfaceArea ?? 0) <= (filters.surfaceMax ?? Infinity));
    }
    if (filters.budgetMin) {
      result = result.filter(m => (m.budgetMin ?? 0) >= (filters.budgetMin ?? 0));
    }
    if (filters.budgetMax) {
      result = result.filter(m => (m.budgetMax ?? Infinity) <= (filters.budgetMax ?? Infinity));
    }
    if (filters.levels) {
      result = result.filter(m => m.levels >= (filters.levels ?? 0));
    }
    if (filters.hasPool) {
      result = result.filter(m => m.equipment?.some(e => e.toLowerCase().includes('piscine')));
    }
    if (filters.hasGarage) {
      result = result.filter(m => m.equipment?.some(e => e.toLowerCase().includes('garage')));
    }

    switch (sort) {
      case 'popular': result.sort((a, b) => b.viewCount - a.viewCount); break;
      case 'recent': result.sort((a, b) => b.id.localeCompare(a.id)); break;
      case 'price-asc': result.sort((a, b) => (a.budgetMin ?? 0) - (b.budgetMin ?? 0)); break;
      case 'price-desc': result.sort((a, b) => (b.budgetMax ?? 0) - (a.budgetMax ?? 0)); break;
    }

    return result;
  }, [catalogModels, search, activeCategory, filters, sort]);

  const activeFilterCount = Object.entries(filters).filter(([, v]) => v !== undefined && v !== false).length;

  const applyFilters = () => {
    setFilters(localFilters);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setLocalFilters({});
    resetFilters();
  };

  return (
    <main className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
        <div className="px-4 py-3 flex items-center gap-3">
          <h1 className="font-bold text-lg">Explorer</h1>
          <div className="flex-1" />
          <Button variant="ghost" size="icon" onClick={() => navigate('home')}>
            <X className="size-5" />
          </Button>
        </div>
        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un modèle..."
              className="pl-9 h-10 bg-muted/50 border-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        {/* Category pills + sort + filter button */}
        <div className="px-4 pb-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {CATEGORY_PILLS.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeCategory === cat.value
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat.label}
            </button>
          ))}
          <div className="flex-1" />
          <Select value={sort} onValueChange={(v) => setSort(v as SortValue)}>
            <SelectTrigger className="w-auto h-8 text-xs border-0 bg-muted/50 gap-1">
              <ArrowUpDown className="size-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs relative"
            onClick={() => { setLocalFilters({ ...filters }); setFilterOpen(true); }}
          >
            <SlidersHorizontal className="size-3.5" />
            Filtres
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 size-4 rounded-full bg-foreground text-background text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Results count */}
      <div className="px-4 py-3 text-xs text-muted-foreground">
        {catalogReady ? `${filtered.length} modèle${filtered.length > 1 ? 's' : ''}` : 'Chargement du catalogue...'}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-4">
        {filtered.map(model => {
          const isFav = userFavorites.includes(model.id);
          return (
            <div
              key={model.id}
              className="group cursor-pointer"
              onClick={() => navigate('model-detail', { id: model.id })}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                <img
                  src={model.mainImage || model.images[0]}
                  alt={model.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <Badge variant="secondary" className="absolute top-2 left-2 text-[10px] font-medium">
                  {model.standing}
                </Badge>
                <button
                  className="absolute top-2 right-2 size-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(model.id); }}
                >
                  <Heart className={`size-4 ${isFav ? 'fill-foreground' : ''}`} />
                </button>
              </div>
              <div className="mt-2.5">
                <h3 className="text-sm font-semibold leading-tight line-clamp-1">{model.name}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">{model.categoryName}</p>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Maximize2 className="size-3" />{model.surfaceArea} m²</span>
                  <span className="flex items-center gap-0.5"><BedDouble className="size-3" />{model.bedrooms}</span>
                  <span className="flex items-center gap-0.5"><Bath className="size-3" />{model.bathrooms}</span>
                </div>
                <p className="mt-1.5 text-xs font-semibold">
                  {FORMAT_SHORT_XOF(model.budgetMin!)} — {FORMAT_SHORT_XOF(model.budgetMax!)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="size-10 text-muted-foreground/30" />
          <p className="mt-4 text-sm text-muted-foreground">Aucun modèle trouvé.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
            Réinitialiser les filtres
          </Button>
        </div>
      )}

      {/* Filter Sheet */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="text-base">Filtres</SheetTitle>
          </SheetHeader>

          <div className="p-4 space-y-6">
            {/* Type / Standing */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Standing</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['Économique', 'Standard', 'Premium', 'Luxe'].map(s => (
                  <button
                    key={s}
                    onClick={() => setLocalFilters(f => ({
                      ...f,
                      standing: f.standing === s.toLowerCase() ? undefined : s.toLowerCase(),
                    }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      localFilters.standing === s.toLowerCase()
                        ? 'bg-foreground text-background border-foreground'
                        : 'border-border hover:border-foreground/30'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Budget max
              </Label>
              <p className="text-sm font-medium">
                {localFilters.budgetMax ? FORMAT_SHORT_XOF(localFilters.budgetMax) : '∞'}
              </p>
              <Slider
                min={0}
                max={800_000_000}
                step={10_000_000}
                value={[localFilters.budgetMax ?? 800_000_000]}
                onValueChange={([v]) => setLocalFilters(f => ({
                  ...f,
                  budgetMax: v >= 800_000_000 ? undefined : v,
                }))}
              />
            </div>

            {/* Surface */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Surface min (m²)
              </Label>
              <p className="text-sm font-medium">
                {localFilters.surfaceMin ?? '0'} m²
              </p>
              <Slider
                min={0}
                max={500}
                step={10}
                value={[localFilters.surfaceMin ?? 0]}
                onValueChange={([v]) => setLocalFilters(f => ({
                  ...f,
                  surfaceMin: v === 0 ? undefined : v,
                }))}
              />
            </div>

            {/* Bedrooms */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Chambres min
              </Label>
              <div className="flex gap-2 mt-1">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <button
                    key={n}
                    onClick={() => setLocalFilters(f => ({
                      ...f,
                      bedrooms: f.bedrooms === n ? undefined : n,
                    }))}
                    className={`size-9 rounded-full text-xs font-medium border flex items-center justify-center transition-colors ${
                      localFilters.bedrooms === n
                        ? 'bg-foreground text-background border-foreground'
                        : 'border-border hover:border-foreground/30'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Levels */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Niveaux min
              </Label>
              <div className="flex gap-2 mt-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setLocalFilters(f => ({
                      ...f,
                      levels: f.levels === n ? undefined : n,
                    }))}
                    className={`size-9 rounded-full text-xs font-medium border flex items-center justify-center transition-colors ${
                      localFilters.levels === n
                        ? 'bg-foreground text-background border-foreground'
                        : 'border-border hover:border-foreground/30'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Équipements
              </Label>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="pool"
                  checked={localFilters.hasPool ?? false}
                  onCheckedChange={(c) => setLocalFilters(f => ({ ...f, hasPool: c === true ? true : undefined }))}
                />
                <Label htmlFor="pool" className="text-sm font-normal cursor-pointer">Piscine</Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="garage"
                  checked={localFilters.hasGarage ?? false}
                  onCheckedChange={(c) => setLocalFilters(f => ({ ...f, hasGarage: c === true ? true : undefined }))}
                />
                <Label htmlFor="garage" className="text-sm font-normal cursor-pointer">Garage</Label>
              </div>
            </div>
          </div>

          <SheetFooter className="border-t pt-4 gap-2">
            <Button variant="outline" className="flex-1" onClick={clearFilters}>
              Effacer
            </Button>
            <Button className="flex-1" onClick={applyFilters}>
              Appliquer
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </main>
  );
}
