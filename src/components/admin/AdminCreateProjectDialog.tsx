'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Clock3, FolderPlus, Globe2, Mail, MessageCircle, Phone, UserRoundCheck, WalletCards } from 'lucide-react';
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
import {
  COUNTRY_CODES,
  countryValue,
  countryValueFromPhone,
  getCountry,
  getDialCode,
  isEmail,
  isPhone,
  localPhoneFromStored,
  normalizePhone,
} from '@/lib/country-codes';

type AdminCreateProjectDefaults = {
  title?: string;
  categoryName?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  country?: string;
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

const TIME_ZONE_OPTIONS = [
  { value: 'Africa/Abidjan', label: 'Côte d’Ivoire / GMT' },
  { value: 'Europe/Paris', label: 'France / Europe centrale' },
  { value: 'Europe/Brussels', label: 'Belgique' },
  { value: 'Europe/London', label: 'Royaume-Uni' },
  { value: 'America/Toronto', label: 'Canada Est' },
  { value: 'America/New_York', label: 'États-Unis Est' },
  { value: 'America/Chicago', label: 'États-Unis Centre' },
  { value: 'America/Los_Angeles', label: 'États-Unis Ouest' },
  { value: 'Africa/Dakar', label: 'Sénégal / GMT' },
  { value: 'Africa/Ouagadougou', label: 'Burkina Faso / GMT' },
];

const CONTACT_CHANNEL_OPTIONS = [
  { value: 'email', label: 'E-mail' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'phone', label: 'Appel téléphonique' },
  { value: 'video', label: 'Visio' },
];

const CONTACT_WINDOW_OPTIONS = [
  { value: 'morning-ci', label: 'Matin heure Côte d’Ivoire' },
  { value: 'afternoon-ci', label: 'Après-midi heure Côte d’Ivoire' },
  { value: 'evening-ci', label: 'Soir heure Côte d’Ivoire' },
  { value: 'weekend', label: 'Week-end uniquement' },
  { value: 'to-plan', label: 'À planifier' },
];

const REPRESENTATIVE_RELATION_OPTIONS = [
  { value: 'family', label: 'Famille' },
  { value: 'trusted-person', label: 'Personne de confiance' },
  { value: 'company', label: 'Entreprise / associé' },
  { value: 'none', label: 'Aucun mandataire' },
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
    clientPhoneCountry: countryValueFromPhone(defaults?.clientPhone),
    clientPhone: localPhoneFromStored(defaults?.clientPhone, countryValueFromPhone(defaults?.clientPhone)),
    projectCountry: defaults?.country || "Côte d'Ivoire",
    city: defaults?.city || '',
    residenceCountry: "Côte d'Ivoire",
    timeZone: 'Africa/Abidjan',
    preferredContactChannel: 'email',
    contactWindow: 'to-plan',
    representativeName: '',
    representativePhoneCountry: countryValue(COUNTRY_CODES[0]),
    representativePhone: '',
    representativeRelation: 'none',
    budgetMin: defaults?.budgetMin || '',
    budgetMax: defaults?.budgetMax || '',
    description: defaults?.description || '',
  });

  const canCreate = useMemo(() => {
    const normalizedPhone = draft.clientPhone.trim()
      ? normalizePhone(draft.clientPhone, getDialCode(draft.clientPhoneCountry))
      : '';
    return Boolean(
      draft.title.trim()
      && draft.clientName.trim()
      && (draft.clientEmail.trim() || normalizedPhone)
      && draft.categoryName.trim()
      && draft.projectCountry.trim()
    );
  }, [draft]);

  const setField = (field: keyof typeof draft, value: string) => {
    setDraft(current => ({ ...current, [field]: value }));
  };

  const handleCreate = () => {
    const clientEmail = draft.clientEmail.trim();
    const clientPhone = draft.clientPhone.trim()
      ? normalizePhone(draft.clientPhone, getDialCode(draft.clientPhoneCountry))
      : '';
    const representativePhone = draft.representativePhone.trim()
      ? normalizePhone(draft.representativePhone, getDialCode(draft.representativePhoneCountry))
      : '';

    if (!canCreate) {
      addToast('Titre, client et e-mail ou téléphone sont nécessaires.', 'error');
      return;
    }
    if (clientEmail && !isEmail(clientEmail)) {
      addToast("L'e-mail client n'est pas valide.", 'error');
      return;
    }
    if (clientPhone && !isPhone(clientPhone)) {
      addToast('Le numéro client doit être valide avec son indicatif pays.', 'error');
      return;
    }
    if (representativePhone && !isPhone(representativePhone)) {
      addToast('Le numéro du mandataire doit être valide avec son indicatif pays.', 'error');
      return;
    }

    const project = createProjectRequest({
      referenceNumber: nextReference(),
      title: draft.title.trim(),
      description: draft.description.trim() || undefined,
      status: 'verifying',
      clientName: draft.clientName.trim(),
      clientEmail: clientEmail || undefined,
      clientPhone: clientPhone || undefined,
      clientResidenceCountry: draft.residenceCountry,
      clientTimeZone: draft.timeZone,
      clientPreferredContactChannel: draft.preferredContactChannel,
      clientContactWindow: draft.contactWindow,
      clientPresence: draft.residenceCountry === "Côte d'Ivoire" ? 'local' : 'abroad-representative',
      representativeName: draft.representativeName.trim() || undefined,
      representativePhone: representativePhone || undefined,
      representativeRelation: draft.representativeRelation,
      remoteDecisionMode: representativePhone || draft.representativeName.trim() ? 'representative-approval' : 'written-approval',
      country: draft.projectCountry,
      city: draft.city.trim() || undefined,
      categoryName: draft.categoryName,
      budgetMin: numericValue(draft.budgetMin),
      budgetMax: numericValue(draft.budgetMax),
      progress: 10,
      formData: {
        source: 'admin-platform',
        adminIntake: true,
        projectCountry: draft.projectCountry,
        clientResidenceCountry: draft.residenceCountry,
        clientTimeZone: draft.timeZone,
        clientPreferredContactChannel: draft.preferredContactChannel,
        clientContactWindow: draft.contactWindow,
        representativeName: draft.representativeName.trim() || undefined,
        representativePhone: representativePhone || undefined,
        representativeRelation: draft.representativeRelation,
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
            <div>
              <Label htmlFor="admin-project-country" className="gap-1">
                <Globe2 className="size-3.5" />
                Pays du projet
              </Label>
              <select
                id="admin-project-country"
                value={draft.projectCountry}
                onChange={event => setField('projectCountry', event.target.value)}
                className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                {[...COUNTRY_CODES.map(country => country.name), 'Autre pays'].map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
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
                <div className="mt-2 grid grid-cols-[minmax(110px,0.48fr)_minmax(0,1fr)] gap-2">
                  <select
                    value={draft.clientPhoneCountry}
                    onChange={event => setField('clientPhoneCountry', event.target.value)}
                    className="h-10 min-w-0 rounded-md border bg-background px-2 text-xs"
                    aria-label="Pays du numéro client"
                  >
                    {COUNTRY_CODES.map(country => (
                      <option key={`${country.code}-${country.dial}`} value={countryValue(country)}>
                        {country.code} {country.dial}
                      </option>
                    ))}
                  </select>
                  <Input
                    id="admin-project-phone"
                    value={draft.clientPhone}
                    onChange={event => setField('clientPhone', event.target.value)}
                    placeholder={getCountry(draft.clientPhoneCountry).example}
                    type="tel"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Coordination hors pays</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Ces informations alimentent l’espace projet admin et évitent de mélanger client et administration.
                </p>
              </div>
              <Badge variant="outline">Multi-pays</Badge>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="admin-client-residence" className="gap-1">
                  <Globe2 className="size-3.5" />
                  Résidence client
                </Label>
                <select
                  id="admin-client-residence"
                  value={draft.residenceCountry}
                  onChange={event => setField('residenceCountry', event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  {[...COUNTRY_CODES.map(country => country.name), 'Autre pays'].map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="admin-client-timezone" className="gap-1">
                  <Clock3 className="size-3.5" />
                  Fuseau horaire
                </Label>
                <select
                  id="admin-client-timezone"
                  value={draft.timeZone}
                  onChange={event => setField('timeZone', event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  {TIME_ZONE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="admin-contact-channel" className="gap-1">
                  <MessageCircle className="size-3.5" />
                  Canal préféré
                </Label>
                <select
                  id="admin-contact-channel"
                  value={draft.preferredContactChannel}
                  onChange={event => setField('preferredContactChannel', event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  {CONTACT_CHANNEL_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="admin-contact-window">Créneau d’appel</Label>
                <select
                  id="admin-contact-window"
                  value={draft.contactWindow}
                  onChange={event => setField('contactWindow', event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  {CONTACT_WINDOW_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="admin-representative-name" className="gap-1">
                  <UserRoundCheck className="size-3.5" />
                  Mandataire local
                </Label>
                <Input
                  id="admin-representative-name"
                  value={draft.representativeName}
                  onChange={event => setField('representativeName', event.target.value)}
                  placeholder="Nom du relais sur place"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="admin-representative-phone">Téléphone mandataire</Label>
                <div className="mt-2 grid grid-cols-[minmax(110px,0.48fr)_minmax(0,1fr)] gap-2">
                  <select
                    value={draft.representativePhoneCountry}
                    onChange={event => setField('representativePhoneCountry', event.target.value)}
                    className="h-10 min-w-0 rounded-md border bg-background px-2 text-xs"
                    aria-label="Pays du numéro mandataire"
                  >
                    {COUNTRY_CODES.map(country => (
                      <option key={`${country.code}-${country.dial}`} value={countryValue(country)}>
                        {country.code} {country.dial}
                      </option>
                    ))}
                  </select>
                  <Input
                    id="admin-representative-phone"
                    value={draft.representativePhone}
                    onChange={event => setField('representativePhone', event.target.value)}
                    placeholder={getCountry(draft.representativePhoneCountry).example}
                    type="tel"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="admin-representative-relation">Lien avec le mandataire</Label>
                <select
                  id="admin-representative-relation"
                  value={draft.representativeRelation}
                  onChange={event => setField('representativeRelation', event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  {REPRESENTATIVE_RELATION_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
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
