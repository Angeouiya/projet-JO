'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { FolderPlus, Mail, Phone, WalletCards } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/app-store';

type AdminCreateProjectDefaults = {
  title?: string;
  categoryName?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  city?: string;
  budgetMin?: string;
  budgetMax?: string;
  description?: string;
};

type AdminCreateProjectDialogProps = {
  trigger?: ReactNode;
  defaults?: AdminCreateProjectDefaults;
  onCreated?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const PROJECT_CATEGORIES = [
  'Maison basse',
  'Immeuble R+',
  'VRD',
  'Lot de travaux',
  'Gros oeuvre',
  'Second oeuvre',
  'Finition',
  'Plomberie',
  'Etude technique',
];

function nextReference() {
  const year = new Date().getFullYear();
  const suffix = String(Date.now()).slice(-6);
  return `BTP-${year}-${suffix}`;
}

function numericValue(value: string) {
  const parsed = Number(value.replace(/\s/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function AdminCreateProjectDialog({
  trigger,
  defaults,
  onCreated,
  open,
  onOpenChange,
}: AdminCreateProjectDialogProps) {
  const { createProjectRequest, navigate, addToast } = useAppStore();
  const [internalOpen, setInternalOpen] = useState(false);
  const dialogOpen = open ?? internalOpen;
  const setDialogOpen = (nextOpen: boolean) => {
    if (open === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };
  const [draft, setDraft] = useState({
    title: defaults?.title || '',
    categoryName: defaults?.categoryName || PROJECT_CATEGORIES[0],
    clientName: defaults?.clientName || '',
    clientEmail: defaults?.clientEmail || '',
    clientPhone: defaults?.clientPhone || '',
    city: defaults?.city || '',
    budgetMin: defaults?.budgetMin || '',
    budgetMax: defaults?.budgetMax || '',
    description: defaults?.description || '',
  });

  const canCreate = useMemo(() => {
    return Boolean(
      draft.title.trim()
      && draft.clientName.trim()
      && (draft.clientEmail.trim() || draft.clientPhone.trim())
      && draft.categoryName.trim()
    );
  }, [draft]);

  const setField = (field: keyof typeof draft, value: string) => {
    setDraft(current => ({ ...current, [field]: value }));
  };

  const handleCreate = () => {
    if (!canCreate) {
      addToast('Titre, client et e-mail ou téléphone sont nécessaires.', 'error');
      return;
    }

    const project = createProjectRequest({
      referenceNumber: nextReference(),
      title: draft.title.trim(),
      description: draft.description.trim() || undefined,
      status: 'verifying',
      clientName: draft.clientName.trim(),
      clientEmail: draft.clientEmail.trim() || undefined,
      clientPhone: draft.clientPhone.trim() || undefined,
      country: "Côte d'Ivoire",
      city: draft.city.trim() || undefined,
      categoryName: draft.categoryName,
      budgetMin: numericValue(draft.budgetMin),
      budgetMax: numericValue(draft.budgetMax),
      progress: 10,
      formData: {
        source: 'admin-platform',
        adminIntake: true,
      },
    });

    addToast('Dossier créé dans la plateforme admin.', 'success');
    setDialogOpen(false);
    onCreated?.();
    navigate('admin-project-detail', { id: project.id });
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="size-5" />
            Créer un dossier admin
          </DialogTitle>
          <DialogDescription>
            Création interne réservée à l’administration. Le client reste dans sa plateforme séparée et verra le dossier quand il sera rattaché à son contact.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="admin-project-title">Titre du dossier</Label>
              <Input
                id="admin-project-title"
                value={draft.title}
                onChange={event => setField('title', event.target.value)}
                placeholder="Ex. Extension villa Riviera"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="admin-project-category">Catégorie</Label>
              <select
                id="admin-project-category"
                value={draft.categoryName}
                onChange={event => setField('categoryName', event.target.value)}
                className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                {PROJECT_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="admin-project-city">Ville / commune</Label>
              <Input
                id="admin-project-city"
                value={draft.city}
                onChange={event => setField('city', event.target.value)}
                placeholder="Abidjan, Bouaké, San Pedro..."
                className="mt-2"
              />
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Client rattaché</p>
                <p className="mt-1 text-xs text-muted-foreground">E-mail recommandé, téléphone possible.</p>
              </div>
              <Badge variant="outline">Admin</Badge>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="admin-project-client">Nom du client</Label>
                <Input
                  id="admin-project-client"
                  value={draft.clientName}
                  onChange={event => setField('clientName', event.target.value)}
                  placeholder="Nom complet ou société"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="admin-project-email" className="gap-1">
                  <Mail className="size-3.5" />
                  E-mail
                </Label>
                <Input
                  id="admin-project-email"
                  type="email"
                  value={draft.clientEmail}
                  onChange={event => setField('clientEmail', event.target.value)}
                  placeholder="client@email.com"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="admin-project-phone" className="gap-1">
                  <Phone className="size-3.5" />
                  Téléphone
                </Label>
                <Input
                  id="admin-project-phone"
                  value={draft.clientPhone}
                  onChange={event => setField('clientPhone', event.target.value)}
                  placeholder="+225 ..."
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="admin-project-budget-min" className="gap-1">
                <WalletCards className="size-3.5" />
                Budget minimum
              </Label>
              <Input
                id="admin-project-budget-min"
                inputMode="numeric"
                value={draft.budgetMin}
                onChange={event => setField('budgetMin', event.target.value)}
                placeholder="25000000"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="admin-project-budget-max">Budget maximum</Label>
              <Input
                id="admin-project-budget-max"
                inputMode="numeric"
                value={draft.budgetMax}
                onChange={event => setField('budgetMax', event.target.value)}
                placeholder="45000000"
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="admin-project-description">Description courte</Label>
            <Textarea
              id="admin-project-description"
              value={draft.description}
              onChange={event => setField('description', event.target.value)}
              rows={3}
              placeholder="Contexte, besoin, contraintes connues, prochaines informations à demander..."
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleCreate} disabled={!canCreate}>Créer le dossier</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
