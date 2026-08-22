'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart, FolderArchive, Settings, HelpCircle, LogOut,
  ChevronRight, Bell, User, Mail, Phone, PenLine,
  Clock3, Globe2, MessageCircle, UserRoundCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { useAppStore } from '@/stores/app-store';
import {
  COUNTRY_CODES,
  countryValue,
  countryValueFromPhone,
  getCountry,
  getDialCode,
  isPhone,
  localPhoneFromStored,
  normalizePhone,
} from '@/lib/country-codes';

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
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Appel téléphonique' },
  { value: 'video', label: 'Visio' },
];

const REPRESENTATIVE_RELATION_OPTIONS = [
  { value: 'family', label: 'Famille' },
  { value: 'trusted-person', label: 'Personne de confiance' },
  { value: 'company', label: 'Entreprise / associé' },
  { value: 'none', label: 'Aucun mandataire' },
];

const MENU_ITEMS = [
  { icon: Bell, label: 'Notifications', action: 'notifications' as const, showArrow: true },
  { icon: Heart, label: 'Mes favoris', action: 'favorites' as const, showArrow: true },
  { icon: FolderArchive, label: 'Mes documents', action: 'projects' as const, showArrow: true },
  { icon: Settings, label: 'Paramètres', action: 'settings' as const, showArrow: true },
  { icon: HelpCircle, label: 'Aide', action: 'help' as const, showArrow: true },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0].toUpperCase())
    .slice(0, 2)
    .join('');
}

export function ProfileView() {
  const { user, navigate, logout, updateUserProfile, addToast } = useAppStore();
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editCountryDialCode, setEditCountryDialCode] = useState(countryValueFromPhone(user?.phone));
  const [editPhone, setEditPhone] = useState(localPhoneFromStored(user?.phone, countryValueFromPhone(user?.phone)));
  const [editResidenceCountry, setEditResidenceCountry] = useState(user?.residenceCountry || 'Côte d’Ivoire');
  const [editTimeZone, setEditTimeZone] = useState(user?.timeZone || 'Africa/Abidjan');
  const [editPreferredContactChannel, setEditPreferredContactChannel] = useState(user?.preferredContactChannel || 'whatsapp');
  const [editRepresentativeName, setEditRepresentativeName] = useState(user?.representativeName || '');
  const [editRepresentativePhone, setEditRepresentativePhone] = useState(user?.representativePhone || '');
  const [editRepresentativeRelation, setEditRepresentativeRelation] = useState(user?.representativeRelation || 'none');

  const displayName = user?.name || 'Utilisateur';
  const displayEmail = user?.email || 'email@exemple.com';
  const displayPhone = user?.phone || '+225 00 00 00 00';
  const displayResidenceCountry = user?.residenceCountry || 'Côte d’Ivoire';
  const displayTimeZone = TIME_ZONE_OPTIONS.find(option => option.value === user?.timeZone)?.label || user?.timeZone || 'Côte d’Ivoire / GMT';
  const displayContactChannel = CONTACT_CHANNEL_OPTIONS.find(option => option.value === user?.preferredContactChannel)?.label || 'WhatsApp';
  const displayRepresentative = user?.representativeName || 'À renseigner';
  const initials = getInitials(displayName);

  const openEditProfile = () => {
    const nextCountry = countryValueFromPhone(user?.phone);
    setEditName(user?.name || '');
    setEditCountryDialCode(nextCountry);
    setEditPhone(localPhoneFromStored(user?.phone, nextCountry));
    setEditResidenceCountry(user?.residenceCountry || 'Côte d’Ivoire');
    setEditTimeZone(user?.timeZone || 'Africa/Abidjan');
    setEditPreferredContactChannel(user?.preferredContactChannel || 'whatsapp');
    setEditRepresentativeName(user?.representativeName || '');
    setEditRepresentativePhone(user?.representativePhone || '');
    setEditRepresentativeRelation(user?.representativeRelation || 'none');
    setEditOpen(true);
  };

  const handleSaveProfile = () => {
    if (!editName.trim()) {
      addToast('Le nom complet est obligatoire.', 'error');
      return;
    }

    const normalizedPhone = editPhone.trim() ? normalizePhone(editPhone, getDialCode(editCountryDialCode)) : '';
    if (normalizedPhone && !isPhone(normalizedPhone)) {
      addToast('Le numéro de téléphone doit être valide avec son indicatif pays.', 'error');
      return;
    }

    if (editRepresentativePhone.trim() && !isPhone(editRepresentativePhone.trim())) {
      addToast('Le numéro du mandataire doit inclure son indicatif pays.', 'error');
      return;
    }

    updateUserProfile({
      name: editName,
      phone: normalizedPhone,
      residenceCountry: editResidenceCountry,
      timeZone: editTimeZone,
      preferredContactChannel: editPreferredContactChannel,
      representativeName: editRepresentativeName,
      representativePhone: editRepresentativePhone,
      representativeRelation: editRepresentativeRelation,
    });
    setEditOpen(false);
    addToast('Profil client mis à jour.', 'success');
  };

  const handleMenuAction = (action: (typeof MENU_ITEMS)[number]['action']) => {
    if (action === 'settings') {
      openEditProfile();
      return;
    }
    if (action === 'help') {
      navigate('services');
      return;
    }
    navigate(action);
  };

  const menuVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.3 },
    }),
  };

  return (
    <main className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold tracking-tight"
        >
          Mon profil
        </motion.h1>
      </div>

      {/* Avatar + Info Card */}
      <div className="px-4 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="py-0 gap-0">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="size-20 rounded-full bg-foreground flex items-center justify-center">
                <span className="text-2xl font-bold text-background">{initials}</span>
              </div>
              <h2 className="mt-4 text-lg font-bold">{displayName}</h2>
              <p className="text-sm text-muted-foreground mt-1">{user?.role || 'Client'}</p>

              <Separator className="my-4" />

              <div className="w-full space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">Nom complet</p>
                    <p className="text-sm font-medium truncate">{displayName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Mail className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">E-mail</p>
                    <p className="text-sm font-medium truncate">{displayEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Phone className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">Téléphone</p>
                    <p className="text-sm font-medium truncate">{displayPhone}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 w-full rounded-xl border bg-muted/25 p-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="size-9 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
                    <Globe2 className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Profil international</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">Résidence, contact et relais local.</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <div className="rounded-lg border bg-background p-3">
                    <p className="text-[11px] text-muted-foreground">Résidence</p>
                    <p className="mt-1 font-medium">{displayResidenceCountry}</p>
                  </div>
                  <div className="rounded-lg border bg-background p-3">
                    <p className="text-[11px] text-muted-foreground">Fuseau horaire</p>
                    <p className="mt-1 font-medium">{displayTimeZone}</p>
                  </div>
                  <div className="rounded-lg border bg-background p-3">
                    <p className="text-[11px] text-muted-foreground">Canal préféré</p>
                    <p className="mt-1 font-medium">{displayContactChannel}</p>
                  </div>
                  <div className="rounded-lg border bg-background p-3">
                    <p className="text-[11px] text-muted-foreground">Mandataire local</p>
                    <p className="mt-1 font-medium">{displayRepresentative}</p>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="mt-5 gap-2 w-full"
                onClick={openEditProfile}
              >
                <PenLine className="size-4" />
                Modifier le profil
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Menu items */}
      <div className="px-4 mt-6">
        <Card className="py-0 gap-0 overflow-hidden">
          {MENU_ITEMS.map((item, i) => (
            <motion.button
              key={item.label}
              custom={i}
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              className="w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors text-left"
              onClick={() => handleMenuAction(item.action)}
            >
              <item.icon className="size-5 text-muted-foreground" />
              <span className="text-sm font-medium flex-1">{item.label}</span>
              {item.showArrow && <ChevronRight className="size-4 text-muted-foreground/50" />}
            </motion.button>
          ))}

          <Separator />

          <ConfirmActionDialog
            title="Se déconnecter ?"
            description="Votre session Buildify sera fermée sur cet appareil. Vous pourrez vous reconnecter avec votre e-mail ou numéro de téléphone et votre mot de passe."
            confirmLabel="Se déconnecter"
            onConfirm={logout}
            trigger={(
              <button
                type="button"
                className="w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors text-left"
              >
                <LogOut className="size-5 text-muted-foreground" />
                <span className="text-sm font-medium flex-1">Déconnexion</span>
              </button>
            )}
          />
        </Card>
      </div>

      {/* Version info */}
      <div className="mt-8 text-center">
        <p className="text-[11px] text-muted-foreground/50">Buildify v1.0.0</p>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenLine className="size-4" />
              Modifier le profil
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom complet</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Votre nom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Téléphone</Label>
              <div className="grid grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)] gap-2">
                <select
                  id="edit-phone-country"
                  value={editCountryDialCode}
                  onChange={event => setEditCountryDialCode(event.target.value)}
                  className="h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  aria-label="Pays du numéro"
                >
                  {COUNTRY_CODES.map(country => (
                    <option key={`${country.code}-${country.dial}`} value={countryValue(country)}>
                      {country.code} {country.dial}
                    </option>
                  ))}
                </select>
                <Input
                  id="edit-phone"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder={getCountry(editCountryDialCode).example}
                  type="tel"
                  autoComplete="tel"
                />
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                Côte d'Ivoire : +225 par défaut. Pour un autre pays, choisissez l’indicatif puis saisissez le numéro local.
              </p>
            </div>
            <div className="rounded-xl border bg-muted/25 p-4">
              <div className="flex items-start gap-2">
                <Globe2 className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold">Coordination hors du pays</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Appels, validations et visites terrain.</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-residence-country">Pays de résidence</Label>
                  <select
                    id="edit-residence-country"
                    value={editResidenceCountry}
                    onChange={event => setEditResidenceCountry(event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {[...COUNTRY_CODES.map(country => country.name), 'Autre pays'].map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-time-zone" className="flex items-center gap-1.5">
                      <Clock3 className="size-3.5" />
                      Fuseau
                    </Label>
                    <select
                      id="edit-time-zone"
                      value={editTimeZone}
                      onChange={event => setEditTimeZone(event.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      {TIME_ZONE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-contact-channel" className="flex items-center gap-1.5">
                      <MessageCircle className="size-3.5" />
                      Contact
                    </Label>
                    <select
                      id="edit-contact-channel"
                      value={editPreferredContactChannel}
                      onChange={event => setEditPreferredContactChannel(event.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      {CONTACT_CHANNEL_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-xl border p-4">
              <Label className="flex items-center gap-1.5 text-sm font-semibold">
                <UserRoundCheck className="size-4" />
                Mandataire local
              </Label>
              <div className="mt-3 space-y-3">
                <Input
                  value={editRepresentativeName}
                  onChange={event => setEditRepresentativeName(event.target.value)}
                  placeholder="Nom du parent, associé ou représentant"
                />
                <Input
                  value={editRepresentativePhone}
                  onChange={event => setEditRepresentativePhone(event.target.value)}
                  placeholder="+225 07 00 00 00 00"
                  type="tel"
                />
                <select
                  value={editRepresentativeRelation}
                  onChange={event => setEditRepresentativeRelation(event.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  aria-label="Lien avec le mandataire"
                >
                  {REPRESENTATIVE_RELATION_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveProfile}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
