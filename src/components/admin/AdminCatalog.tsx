'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Plus, Eye, Pencil, Trash2, EyeOff, Eye as EyeOn, Grid3X3, List, Gem, PackageCheck, Copy,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { DEFAULT_CATALOG_MODELS } from '@/data/catalog-models';
import { useAppStore } from '@/stores/app-store';
import { FORMAT_XOF } from '@/types';
import type { CatalogModelData } from '@/types';

type CatalogAdminModel = {
  id: string;
  name: string;
  category: string;
  standing: string;
  image: string;
  status: 'published' | 'draft';
  views: number;
  selections: number;
  budgetMin: number;
  budgetMax: number;
  description: string;
  source?: CatalogModelData;
};

type CatalogDraft = Pick<CatalogAdminModel, 'name' | 'category' | 'standing' | 'description' | 'budgetMin' | 'budgetMax'>;

const STANDING_LABELS: Record<string, string> = {
  economique: 'Économique',
  standard: 'Standard',
  premium: 'Premium',
  luxe: 'Luxe',
};

const CATEGORIES = ['Maison basse', 'Immeuble R+', 'VRD', 'Lot de travaux', 'Duplex', 'Bureaux', 'Hôtel', 'Cité résidentielle'];
const STANDINGS = ['economique', 'standard', 'premium', 'luxe'];

function normalizeStanding(value?: string) {
  const normalized = value?.trim().toLowerCase() || 'standard';
  if (normalized.includes('éco') || normalized.includes('eco')) return 'economique';
  if (normalized.includes('luxe')) return 'luxe';
  if (normalized.includes('premium')) return 'premium';
  return normalized in STANDING_LABELS ? normalized : 'standard';
}

function adminModelFromCatalog(model: CatalogModelData): CatalogAdminModel {
  return {
    id: model.id,
    name: model.name,
    category: model.categoryName || model.categoryId,
    standing: normalizeStanding(model.standing),
    image: model.mainImage || model.images[0] || '/images/villa-1.png',
    status: model.isPublished ? 'published' : 'draft',
    views: model.viewCount,
    selections: 0,
    budgetMin: model.budgetMin || 0,
    budgetMax: model.budgetMax || model.budgetMin || 0,
    description: model.description || '',
    source: model,
  };
}

function catalogPayloadFromAdmin(model: CatalogAdminModel): Partial<CatalogModelData> & Pick<CatalogModelData, 'name'> {
  const source: Partial<CatalogModelData> = model.source ?? {};
  return {
    ...source,
    id: model.id,
    name: model.name,
    categoryId: model.category.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    categoryName: model.category,
    mainImage: model.image,
    images: source.images?.length ? source.images : [model.image],
    plans: source.plans ?? [],
    levels: source.levels ?? (model.category.toLowerCase().includes('immeuble') ? 4 : model.category.toLowerCase().includes('duplex') ? 2 : 1),
    standing: model.standing,
    budgetMin: model.budgetMin,
    budgetMax: model.budgetMax,
    description: model.description,
    equipment: source.equipment ?? [],
    features: source.features ?? [],
    viewCount: model.views,
    isPublished: model.status === 'published',
    isFeatured: model.status === 'published' && model.views >= 250,
  };
}

const initialCatalogModels = DEFAULT_CATALOG_MODELS.map(adminModelFromCatalog);

function defaultDraft(model?: CatalogAdminModel): CatalogDraft {
  return {
    name: model?.name || 'Nouveau modèle Buildify',
    category: model?.category || CATEGORIES[0],
    standing: model?.standing || 'standard',
    description: model?.description || '',
    budgetMin: model?.budgetMin || 25000000,
    budgetMax: model?.budgetMax || 75000000,
  };
}

function budgetLabel(model: CatalogAdminModel) {
  return `${FORMAT_XOF(model.budgetMin)} - ${FORMAT_XOF(model.budgetMax)}`;
}

export function AdminCatalog() {
  const addToast = useAppStore(state => state.addToast);
  const [models, setModels] = useState(initialCatalogModels);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedId, setSelectedId] = useState(initialCatalogModels[0]?.id || '');
  const [editingModel, setEditingModel] = useState<CatalogAdminModel | null>(null);
  const [draft, setDraft] = useState<CatalogDraft>(defaultDraft());
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadCatalog = async () => {
      try {
        const response = await fetch('/api/models?admin=true&limit=60', { cache: 'no-store' });
        const payload = await response.json().catch(() => null) as { models?: CatalogModelData[]; message?: string; error?: string } | null;
        if (!active) return;
        if (!response.ok) {
          addToast(payload?.message || payload?.error || 'Catalogue serveur indisponible.', 'info');
          return;
        }
        const nextModels = (payload?.models ?? []).map(adminModelFromCatalog);
        if (nextModels.length) {
          setModels(nextModels);
          setSelectedId(nextModels[0].id);
        }
      } catch {
        if (active) addToast('Catalogue serveur indisponible. Données de secours affichées.', 'info');
      } finally {
        if (active) setLoadingCatalog(false);
      }
    };
    void loadCatalog();
    return () => { active = false; };
  }, [addToast]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return models;
    return models.filter(model => [
      model.name,
      model.category,
      STANDING_LABELS[model.standing],
      model.description,
    ].some(value => value?.toLowerCase().includes(query)));
  }, [models, search]);

  const selectedModel = models.find(model => model.id === selectedId) || filtered[0];

  const openEditor = (model: CatalogAdminModel) => {
    setEditingModel(model);
    setDraft(defaultDraft(model));
  };

  const handleAdd = () => {
    const model: CatalogAdminModel = {
      id: `catalog-${Date.now()}`,
      ...defaultDraft(),
      image: '/images/villa-1.png',
      status: 'draft',
      views: 0,
      selections: 0,
    };
    setModels(prev => [model, ...prev]);
    setSelectedId(model.id);
    openEditor(model);
    addToast('Brouillon catalogue créé.', 'success');
  };

  const persistModel = async (model: CatalogAdminModel, method: 'POST' | 'PATCH') => {
    const response = await fetch('/api/models', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(catalogPayloadFromAdmin(model)),
    });
    const payload = await response.json().catch(() => null) as { model?: CatalogModelData; message?: string; error?: string } | null;
    if (!response.ok || !payload?.model) {
      throw new Error(payload?.message || payload?.error || 'Sauvegarde catalogue impossible.');
    }
    return adminModelFromCatalog(payload.model);
  };

  const handleSave = async () => {
    if (!editingModel) return;
    if (!draft.name.trim()) {
      addToast('Le nom du modèle est obligatoire.', 'error');
      return;
    }
    if (Number(draft.budgetMax) < Number(draft.budgetMin)) {
      addToast('Le budget maximum doit être supérieur au minimum.', 'error');
      return;
    }

    const nextModel: CatalogAdminModel = {
      ...editingModel,
      name: draft.name.trim(),
      category: draft.category,
      standing: draft.standing,
      description: draft.description.trim(),
      budgetMin: Number(draft.budgetMin),
      budgetMax: Number(draft.budgetMax),
    };

    setSavingId(editingModel.id);
    try {
      const saved = await persistModel(nextModel, editingModel.id.startsWith('catalog-') ? 'POST' : 'PATCH');
      setModels(prev => [saved, ...prev.filter(model => model.id !== editingModel.id && model.id !== saved.id)]);
      setSelectedId(saved.id);
      setEditingModel(null);
      addToast('Modèle catalogue enregistré sur le serveur.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Sauvegarde catalogue impossible.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const toggleVisibility = async (model: CatalogAdminModel) => {
    const nextStatus: CatalogAdminModel['status'] = model.status === 'published' ? 'draft' : 'published';
    const nextModel: CatalogAdminModel = { ...model, status: nextStatus };
    setModels(prev => prev.map(item => (
      item.id === model.id ? nextModel : item
    )));
    setSavingId(model.id);
    try {
      const saved = await persistModel(nextModel, 'PATCH');
      setModels(prev => prev.map(item => item.id === model.id ? saved : item));
      addToast(nextStatus === 'published' ? 'Modèle publié.' : 'Modèle repassé en brouillon.', 'success');
    } catch (error) {
      setModels(prev => prev.map(item => item.id === model.id ? model : item));
      addToast(error instanceof Error ? error.message : 'Publication impossible.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const duplicateModel = async (model: CatalogAdminModel) => {
    const copy: CatalogAdminModel = {
      ...model,
      id: `catalog-copy-${Date.now()}`,
      name: `${model.name} copie`,
      status: 'draft',
      views: 0,
      selections: 0,
      source: undefined,
    };
    setSavingId(model.id);
    try {
      const saved = await persistModel(copy, 'POST');
      setModels(prev => [saved, ...prev]);
      setSelectedId(saved.id);
      setEditingModel(saved);
      setDraft(defaultDraft(saved));
      addToast('Copie créée en brouillon. Ajustez-la avant publication.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Duplication impossible.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const deleteModel = async (model: CatalogAdminModel) => {
    setSavingId(model.id);
    try {
      const response = await fetch(`/api/models?id=${encodeURIComponent(model.id)}`, { method: 'DELETE' });
      const payload = await response.json().catch(() => null) as { message?: string; error?: string } | null;
      if (!response.ok) throw new Error(payload?.message || payload?.error || 'Suppression impossible.');
      setModels(prev => prev.filter(item => item.id !== model.id));
      if (selectedId === model.id) setSelectedId('');
      addToast('Modèle supprimé du catalogue serveur.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Suppression impossible.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const renderActions = (model: CatalogAdminModel, compact = false) => (
    <div className={compact ? 'flex gap-1 shrink-0' : 'grid grid-cols-[1fr_32px_32px] gap-1.5'}>
      <Button
        size="sm"
        variant="outline"
        className={compact ? 'h-8 w-8 p-0' : 'h-8 min-w-0 text-xs'}
        onClick={() => setSelectedId(model.id)}
        disabled={savingId === model.id}
        aria-label={`Voir ${model.name}`}
      >
        <Eye className="size-3.5" />
        {!compact && <span className="ml-1 truncate">Voir</span>}
      </Button>
      <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => openEditor(model)} disabled={savingId === model.id} aria-label={`Modifier ${model.name}`}>
        <Pencil className="size-3.5" />
      </Button>
      <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => toggleVisibility(model)} disabled={savingId === model.id} aria-label={model.status === 'published' ? 'Dépublier' : 'Publier'}>
        {model.status === 'published' ? <EyeOff className="size-3.5" /> : <EyeOn className="size-3.5" />}
      </Button>
    </div>
  );

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold">Catalogue admin</h1>
          <p className="text-sm text-muted-foreground">
            {loadingCatalog ? 'Synchronisation du catalogue...' : `${models.length} modèles gérés dans la plateforme admin`}
          </p>
        </div>
        <Button size="sm" className="w-full gap-2 sm:w-auto" onClick={handleAdd} disabled={loadingCatalog}>
          <Plus className="size-4" />
          Ajouter
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher modèle, catégorie, standing..." value={search} onChange={e => setSearch(e.target.value)} className="h-11 pl-9" />
        </div>
        <div className="flex w-fit shrink-0 rounded-lg bg-muted p-0.5">
          <button type="button" onClick={() => setViewMode('grid')} className={`rounded-md p-2 transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm' : ''}`} aria-label="Vue grille">
            <Grid3X3 className="size-4" />
          </button>
          <button type="button" onClick={() => setViewMode('list')} className={`rounded-md p-2 transition-all ${viewMode === 'list' ? 'bg-background shadow-sm' : ''}`} aria-label="Vue liste">
            <List className="size-4" />
          </button>
        </div>
      </div>

      {selectedModel && (
        <Card className="overflow-hidden border-foreground/10 py-0">
          <CardContent className="grid gap-4 p-4 md:grid-cols-[180px_minmax(0,1fr)_auto] md:items-center">
            <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted">
              <img src={selectedModel.image} alt={selectedModel.name} className="size-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={selectedModel.status === 'published' ? 'default' : 'secondary'}>
                  {selectedModel.status === 'published' ? 'Publié' : 'Brouillon'}
                </Badge>
                <Badge variant="outline">{selectedModel.category}</Badge>
                <Badge variant="outline">{STANDING_LABELS[selectedModel.standing]}</Badge>
              </div>
              <h2 className="mt-3 text-lg font-bold">{selectedModel.name}</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{selectedModel.description}</p>
              <p className="mt-2 text-sm font-semibold">{budgetLabel(selectedModel)}</p>
            </div>
            <div className="flex flex-wrap gap-2 md:flex-col">
              <Button size="sm" variant="outline" className="gap-2" onClick={() => openEditor(selectedModel)} disabled={savingId === selectedModel.id}>
                <Pencil className="size-4" />
                Modifier
              </Button>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => toggleVisibility(selectedModel)} disabled={savingId === selectedModel.id}>
                {selectedModel.status === 'published' ? <EyeOff className="size-4" /> : <EyeOn className="size-4" />}
                {selectedModel.status === 'published' ? 'Dépublier' : 'Publier'}
              </Button>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => duplicateModel(selectedModel)} disabled={savingId === selectedModel.id}>
                <Copy className="size-4" />
                Dupliquer
              </Button>
              <ConfirmActionDialog
                title="Supprimer ce modèle ?"
                description={`Le modèle ${selectedModel.name} sera retiré du catalogue admin local. Cette action est importante et demande confirmation.`}
                confirmLabel="Supprimer"
                confirmClassName="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onConfirm={() => deleteModel(selectedModel)}
                trigger={(
                  <Button size="sm" variant="outline" className="gap-2" disabled={savingId === selectedModel.id}>
                    <Trash2 className="size-4" />
                    Supprimer
                  </Button>
                )}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 ? (
        <Card className="border-dashed py-0">
          <CardContent className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
            <PackageCheck className="size-10 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">Aucun modèle trouvé</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Ajoutez un modèle ou modifiez la recherche pour retrouver un élément du catalogue.</p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <motion.div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4" initial={false} animate={{ opacity: 1 }}>
          {filtered.map(model => (
            <Card key={model.id} className={`overflow-hidden py-0 transition-shadow hover:shadow-md ${selectedId === model.id ? 'ring-2 ring-foreground' : ''}`}>
              <div className="relative aspect-[4/3] bg-muted">
                <img src={model.image} alt={model.name} className="size-full object-cover" />
                <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                  <Badge variant={model.status === 'published' ? 'default' : 'secondary'} className="text-[10px]">
                    {model.status === 'published' ? 'Publié' : 'Brouillon'}
                  </Badge>
                  {model.standing === 'luxe' && <Badge variant="secondary" className="gap-0.5 text-[10px]"><Gem className="size-2.5" />Luxe</Badge>}
                </div>
              </div>
              <CardContent className="p-3">
                <p className="truncate text-sm font-medium">{model.name}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{model.category}</p>
                <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <span>{model.views} vues</span>
                  <span className="text-right">{model.selections} choix</span>
                </div>
                <div className="mt-3">{renderActions(model)}</div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      ) : (
        <motion.div className="space-y-2" initial={false} animate={{ opacity: 1 }}>
          {filtered.map(model => (
            <Card key={model.id} className={`py-0 transition-shadow hover:shadow-md ${selectedId === model.id ? 'ring-2 ring-foreground' : ''}`}>
              <CardContent className="grid gap-3 p-3 sm:grid-cols-[64px_minmax(0,1fr)_auto_auto] sm:items-center">
                <div className="size-16 overflow-hidden rounded-lg bg-muted">
                  <img src={model.image} alt={model.name} className="size-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">{model.name}</p>
                    <Badge variant={model.status === 'published' ? 'default' : 'secondary'} className="text-[10px]">
                      {model.status === 'published' ? 'Publié' : 'Brouillon'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{model.category} · {STANDING_LABELS[model.standing]}</p>
                  <p className="mt-1 truncate text-xs font-medium">{budgetLabel(model)}</p>
                </div>
                <div className="hidden text-right text-xs text-muted-foreground sm:block">
                  <p>{model.views} vues</p>
                  <p>{model.selections} sélections</p>
                </div>
                <div className="flex items-center gap-2">
                  {renderActions(model, true)}
                  <ConfirmActionDialog
                    title="Supprimer ce modèle ?"
                    description={`Confirmez la suppression de ${model.name}.`}
                    confirmLabel="Supprimer"
                    confirmClassName="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onConfirm={() => deleteModel(model)}
                    trigger={(
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0" disabled={savingId === model.id} aria-label={`Supprimer ${model.name}`}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      <Dialog open={!!editingModel} onOpenChange={open => !open && setEditingModel(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Modifier le modèle</DialogTitle>
            <DialogDescription>Les changements restent dans la plateforme admin et mettent à jour les actions visibles.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="catalog-name">Nom du modèle</Label>
              <Input id="catalog-name" value={draft.name} onChange={event => setDraft(prev => ({ ...prev, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catalog-category">Catégorie</Label>
              <select
                id="catalog-category"
                value={draft.category}
                onChange={event => setDraft(prev => ({ ...prev, category: event.target.value }))}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                {CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="catalog-standing">Standing</Label>
              <select
                id="catalog-standing"
                value={draft.standing}
                onChange={event => setDraft(prev => ({ ...prev, standing: event.target.value }))}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                {STANDINGS.map(standing => <option key={standing} value={standing}>{STANDING_LABELS[standing]}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="catalog-budget-min">Budget minimum</Label>
              <Input id="catalog-budget-min" type="number" min={0} value={draft.budgetMin} onChange={event => setDraft(prev => ({ ...prev, budgetMin: Number(event.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catalog-budget-max">Budget maximum</Label>
              <Input id="catalog-budget-max" type="number" min={0} value={draft.budgetMax} onChange={event => setDraft(prev => ({ ...prev, budgetMax: Number(event.target.value) }))} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="catalog-description">Description</Label>
              <Textarea id="catalog-description" rows={4} value={draft.description} onChange={event => setDraft(prev => ({ ...prev, description: event.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingModel(null)} disabled={Boolean(savingId)}>Annuler</Button>
            <Button onClick={handleSave} disabled={Boolean(savingId)}>
              {savingId ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
