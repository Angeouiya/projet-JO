'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { useAppStore } from '@/stores/app-store';
import { isEmail } from '@/lib/country-codes';
import { DEPARTMENT_LABELS, ROLE_LABELS } from '@/data/team';
import type { TeamMemberData } from '@/types';
import {
  Bell,
  Building2,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
  UserRoundCheck,
  Users,
} from 'lucide-react';

type GeneralSettings = {
  companyName: string;
  slogan: string;
  phone: string;
  email: string;
  address: string;
  description: string;
};

type MemberDraft = Omit<TeamMemberData, 'id' | 'createdAt' | 'updatedAt'>;

const EMPTY_MEMBER: MemberDraft = {
  name: '',
  role: 'commercial',
  department: 'commercial',
  email: '',
  phone: '',
  photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=640&q=80',
  bio: '',
  publicVisible: true,
  active: true,
};

const notifChannels = [
  { id: 'email', label: 'E-mail', description: 'Devis, contrats, factures et mot de passe oublié.', enabled: true },
  { id: 'sms', label: 'SMS', description: 'Alertes courtes pour demandes urgentes et rendez-vous terrain.', enabled: true },
  { id: 'push', label: 'Push PWA', description: 'Rappels dans l’application installée sur mobile.', enabled: true },
  { id: 'whatsapp', label: 'WhatsApp', description: 'Canal commercial à activer seulement si l’équipe le suit.', enabled: false },
];

const paymentMethods = [
  { id: 'wave', name: 'Wave', description: 'Acomptes rapides et petits règlements client.', enabled: true, icon: 'W' },
  { id: 'orange_money', name: 'Orange Money', description: "Paiements mobiles Côte d'Ivoire avec justificatif.", enabled: true, icon: 'OM' },
  { id: 'mtn', name: 'MTN Mobile Money', description: 'Option multi-opérateur pour clients régionaux.', enabled: false, icon: 'MTN' },
  { id: 'card', name: 'Carte bancaire', description: 'À activer avec un prestataire de paiement vérifié.', enabled: false, icon: 'CB' },
  { id: 'bank', name: 'Virement bancaire', description: 'Recommandé pour appels de fonds, marchés et gros montants.', enabled: true, icon: 'VB' },
];

function csvEscape(value: string | number | boolean | undefined) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadTeamCsv(members: TeamMemberData[]) {
  const header = ['Nom', 'Role', 'Departement', 'Email', 'Telephone', 'Actif', 'Public'];
  const rows = members.map(member => [
    member.name,
    ROLE_LABELS[member.role] || member.role,
    DEPARTMENT_LABELS[member.department] || member.department,
    member.email,
    member.phone || '',
    member.active,
    member.publicVisible,
  ]);
  const csv = [header, ...rows].map(row => row.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `buildify-equipe-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AdminSettings({ defaultTab = 'general' }: { defaultTab?: 'general' | 'team' | 'notifications' | 'payments' }) {
  const {
    addToast,
    teamMembers,
    setTeamMembers,
    addTeamMember,
    updateTeamMember,
    removeTeamMember,
  } = useAppStore();
  const [general, setGeneral] = useState<GeneralSettings>({
    companyName: 'Buildify',
    slogan: 'Votre projet. Bien construit.',
    phone: '+225 01 02 03 04',
    email: 'contact@buildify.ci',
    address: "Zone 4, Abidjan, Côte d'Ivoire",
    description: "Entreprise de BTP spécialisée en construction de villas, duplex, immeubles, promotion immobilière, VRD et hydraulique en Côte d'Ivoire.",
  });
  const [notifState, setNotifState] = useState(notifChannels);
  const [payState, setPayState] = useState(paymentMethods);
  const [notificationsSavedAt, setNotificationsSavedAt] = useState('Configuration initiale');
  const [paymentsSavedAt, setPaymentsSavedAt] = useState('Configuration initiale');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMemberData | null>(null);
  const [memberDraft, setMemberDraft] = useState<MemberDraft>(EMPTY_MEMBER);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamSavingId, setTeamSavingId] = useState<string | null>(null);
  const [teamStoreLabel, setTeamStoreLabel] = useState('Local');

  const activeMembers = teamMembers.filter(member => member.active);
  const publicMembers = teamMembers.filter(member => member.active && member.publicVisible);
  const activeNotificationCount = notifState.filter(channel => channel.enabled).length;
  const activePaymentCount = payState.filter(method => method.enabled).length;

  const setGeneralField = (key: keyof GeneralSettings, value: string) => {
    setGeneral(prev => ({ ...prev, [key]: value }));
  };

  const saveGeneral = () => {
    if (!general.companyName.trim() || !general.email.trim()) {
      addToast("Le nom de l'entreprise et l'e-mail sont obligatoires.", 'error');
      return;
    }
    addToast('Paramètres entreprise enregistrés.', 'success');
  };

  const openInvite = () => {
    setEditingMember(null);
    setMemberDraft(EMPTY_MEMBER);
    setInviteOpen(true);
  };

  const openMemberEdit = (member: TeamMemberData) => {
    setEditingMember(member);
    setMemberDraft({
      name: member.name,
      role: member.role,
      department: member.department,
      email: member.email,
      phone: member.phone || '',
      photoUrl: member.photoUrl,
      bio: member.bio,
      publicVisible: member.publicVisible,
      active: member.active,
    });
    setInviteOpen(true);
  };

  useEffect(() => {
    let active = true;
    const loadTeam = async () => {
      setTeamLoading(true);
      try {
        const response = await fetch('/api/team?admin=true&limit=80', { cache: 'no-store' });
        const payload = await response.json().catch(() => null) as { members?: TeamMemberData[]; store?: string; message?: string; error?: string } | null;
        if (!active) return;
        if (!response.ok || !payload?.members) throw new Error(payload?.message || payload?.error || 'Chargement équipe impossible');
        setTeamMembers(payload.members);
        setTeamStoreLabel(payload.store === 'external' ? 'Synchronisé serveur' : 'Démo locale');
      } catch {
        if (active) setTeamStoreLabel('Local navigateur');
      } finally {
        if (active) setTeamLoading(false);
      }
    };
    void loadTeam();
    return () => { active = false; };
  }, [setTeamMembers]);

  const saveRemoteMember = async (member: TeamMemberData | MemberDraft, mode: 'create' | 'update') => {
    const memberId = 'id' in member && member.id ? member.id : 'new';
    setTeamSavingId(memberId);
    try {
      const response = await fetch('/api/team', {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member),
      });
      const payload = await response.json().catch(() => null) as { member?: TeamMemberData; message?: string; error?: string } | null;
      if (!response.ok || !payload?.member) throw new Error(payload?.message || payload?.error || 'Sauvegarde équipe impossible');
      updateTeamMember(payload.member.id, payload.member);
      if (mode === 'create') addTeamMember(payload.member);
      setTeamStoreLabel('Synchronisé serveur');
      return payload.member;
    } finally {
      setTeamSavingId(null);
    }
  };

  const saveMember = async () => {
    const email = memberDraft.email.trim().toLowerCase();
    const name = memberDraft.name.trim();
    if (!name || !email) {
      addToast('Le nom et l’e-mail du membre sont obligatoires.', 'error');
      return;
    }
    if (!isEmail(email)) {
      addToast("L'e-mail professionnel du membre n'est pas valide.", 'error');
      return;
    }
    const duplicate = teamMembers.some(member => member.email.toLowerCase() === email && member.id !== editingMember?.id);
    if (duplicate) {
      addToast('Un membre utilise déjà cet e-mail.', 'error');
      return;
    }

    const payload: MemberDraft = {
      ...memberDraft,
      name,
      email,
      phone: memberDraft.phone?.trim() || undefined,
      photoUrl: memberDraft.photoUrl.trim() || EMPTY_MEMBER.photoUrl,
      bio: memberDraft.bio.trim() || 'Membre de l’équipe Buildify.',
    };

    try {
      if (editingMember) {
        await saveRemoteMember({ ...editingMember, ...payload }, 'update');
        addToast('Membre mis à jour et synchronisé.', 'success');
      } else {
        await saveRemoteMember(payload, 'create');
        addToast('Membre ajouté à l’équipe et publié côté serveur.', 'success');
      }
      setInviteOpen(false);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Impossible de synchroniser ce membre.', 'error');
    }
  };

  const deleteMember = async (memberId: string) => {
    const target = teamMembers.find(member => member.id === memberId);
    if (!target) return;
    const activeSuperAdmins = teamMembers.filter(member => member.role === 'super_admin' && member.active).length;
    if (target.role === 'super_admin' && target.active && activeSuperAdmins <= 1) {
      addToast('Impossible de retirer le dernier super admin actif.', 'error');
      return;
    }
    setTeamSavingId(memberId);
    try {
      const response = await fetch(`/api/team?id=${encodeURIComponent(memberId)}`, { method: 'DELETE' });
      const payload = await response.json().catch(() => null) as { message?: string; error?: string } | null;
      if (!response.ok) throw new Error(payload?.message || payload?.error || 'Suppression équipe impossible');
      removeTeamMember(memberId);
      setTeamStoreLabel('Synchronisé serveur');
      addToast('Membre retiré de l’équipe serveur.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Impossible de retirer ce membre.', 'error');
    } finally {
      setTeamSavingId(null);
    }
  };

  const patchMember = async (member: TeamMemberData, patch: Partial<Omit<TeamMemberData, 'id' | 'createdAt'>>, successMessage: string) => {
    try {
      const saved = await saveRemoteMember({ ...member, ...patch }, 'update');
      updateTeamMember(saved.id, saved);
      addToast(successMessage, 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Impossible de synchroniser ce changement.', 'error');
    }
  };

  const toggleMemberActive = (member: TeamMemberData, active: boolean) => {
    const activeSuperAdmins = teamMembers.filter(item => item.role === 'super_admin' && item.active).length;
    if (!active && member.role === 'super_admin' && member.active && activeSuperAdmins <= 1) {
      addToast('Gardez au moins un super admin actif.', 'error');
      return;
    }
    void patchMember(member, { active }, `${member.name} ${active ? 'activé' : 'désactivé'} et synchronisé.`);
  };

  const toggleMemberPublic = (member: TeamMemberData) => {
    const publicVisible = !member.publicVisible;
    void patchMember(member, { publicVisible }, `${member.name} ${publicVisible ? 'visible sur l’accueil' : 'retiré de l’accueil public'}.`);
  };

  const updateNotificationChannel = (channelId: string, enabled: boolean) => {
    if (!enabled && activeNotificationCount <= 1 && notifState.find(channel => channel.id === channelId)?.enabled) {
      addToast('Gardez au moins un canal de notification actif.', 'error');
      return;
    }
    setNotifState(prev => prev.map(channel => channel.id === channelId ? { ...channel, enabled } : channel));
    const channel = notifState.find(item => item.id === channelId);
    addToast(`${channel?.label || 'Canal'} ${enabled ? 'activé' : 'désactivé'}.`, 'success');
  };

  const saveNotificationSettings = () => {
    const activeLabels = notifState.filter(channel => channel.enabled).map(channel => channel.label).join(', ');
    setNotificationsSavedAt(new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }));
    addToast(`Canaux admin enregistrés : ${activeLabels}.`, 'success');
  };

  const updatePaymentMethod = (methodId: string, enabled: boolean) => {
    if (!enabled && activePaymentCount <= 1 && payState.find(method => method.id === methodId)?.enabled) {
      addToast('Gardez au moins une méthode de paiement active.', 'error');
      return;
    }
    setPayState(prev => prev.map(method => method.id === methodId ? { ...method, enabled } : method));
    const method = payState.find(item => item.id === methodId);
    addToast(`${method?.name || 'Paiement'} ${enabled ? 'activé' : 'désactivé'}.`, 'success');
  };

  const savePaymentSettings = () => {
    const activeLabels = payState.filter(method => method.enabled).map(method => method.name).join(', ');
    setPaymentsSavedAt(new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }));
    addToast(`Méthodes de paiement enregistrées : ${activeLabels}.`, 'success');
  };

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">Paramètres admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">Entreprise, équipe, notifications et paiements.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{teamLoading ? 'Synchronisation...' : teamStoreLabel}</Badge>
          <Badge variant="outline">{activeMembers.length} actif{activeMembers.length > 1 ? 's' : ''}</Badge>
          <Badge variant="outline">{publicMembers.length} public{publicMembers.length > 1 ? 's' : ''}</Badge>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <div className="-mx-1 overflow-x-auto px-1 pb-1 no-scrollbar">
          <TabsList className="min-w-max bg-muted">
            <TabsTrigger value="general" className="text-xs sm:text-sm"><Building2 className="hidden size-4 sm:block" />Général</TabsTrigger>
            <TabsTrigger value="team" className="text-xs sm:text-sm"><Users className="hidden size-4 sm:block" />Équipe</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs sm:text-sm"><Bell className="hidden size-4 sm:block" />Notifications</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs sm:text-sm"><CreditCard className="hidden size-4 sm:block" />Paiements</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="general">
          <Card>
            <CardHeader><CardTitle className="text-sm">Informations de l'entreprise</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label className="text-xs">Nom de l'entreprise</Label><Input value={general.companyName} onChange={event => setGeneralField('companyName', event.target.value)} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Slogan</Label><Input value={general.slogan} onChange={event => setGeneralField('slogan', event.target.value)} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Téléphone</Label><Input value={general.phone} onChange={event => setGeneralField('phone', event.target.value)} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input value={general.email} onChange={event => setGeneralField('email', event.target.value)} /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label className="text-xs">Adresse</Label><Input value={general.address} onChange={event => setGeneralField('address', event.target.value)} /></div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Textarea value={general.description} onChange={event => setGeneralField('description', event.target.value)} rows={3} />
              </div>
              <Button size="sm" onClick={saveGeneral}>Enregistrer</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader className="gap-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-sm">Équipe Buildify</CardTitle>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Les membres publics apparaissent sur la page d’accueil hors connexion.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => downloadTeamCsv(teamMembers)}>
                    <Download className="size-4" />
                    Exporter
                  </Button>
                  <Button size="sm" className="gap-2" onClick={openInvite}>
                    <Plus className="size-4" />
                    Ajouter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 xl:grid-cols-2">
                {teamMembers.map(member => (
                  <div key={member.id} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[72px_minmax(0,1fr)_auto]">
                    <div className="relative size-20 overflow-hidden rounded-lg bg-muted">
                      <img src={member.photoUrl} alt={member.name} className="h-full w-full object-cover grayscale" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{member.name}</p>
                        {!member.active && <Badge variant="outline" className="text-[10px]">Inactif</Badge>}
                        {member.publicVisible ? (
                          <Badge variant="secondary" className="gap-1 text-[10px]"><Eye className="size-3" />Public</Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-[10px]"><EyeOff className="size-3" />Privé</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{ROLE_LABELS[member.role] || member.role} · {DEPARTMENT_LABELS[member.department] || member.department}</p>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{member.bio}</p>
                      <p className="mt-2 truncate text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-1 sm:flex-col sm:items-end">
                      <Switch checked={member.active} onCheckedChange={checked => toggleMemberActive(member, checked)} disabled={teamSavingId === member.id} aria-label={`Activer ${member.name}`} />
                      <button type="button" onClick={() => toggleMemberPublic(member)} disabled={teamSavingId === member.id} className="rounded p-2 hover:bg-muted disabled:pointer-events-none disabled:opacity-50" aria-label={`Visibilité publique ${member.name}`}>
                        {member.publicVisible ? <Eye className="size-4 text-muted-foreground" /> : <EyeOff className="size-4 text-muted-foreground" />}
                      </button>
                      <button type="button" onClick={() => openMemberEdit(member)} disabled={teamSavingId === member.id} className="rounded p-2 hover:bg-muted disabled:pointer-events-none disabled:opacity-50" aria-label={`Modifier ${member.name}`}>
                        <Pencil className="size-4 text-muted-foreground" />
                      </button>
                      <ConfirmActionDialog
                        title="Retirer ce membre ?"
                        description={`${member.name} sera retiré de l’équipe Buildify et de la vitrine publique si visible.`}
                        confirmLabel="Retirer"
                        confirmClassName="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onConfirm={() => { void deleteMember(member.id); }}
                        trigger={(
                          <button type="button" disabled={teamSavingId === member.id} className="rounded p-2 hover:bg-muted disabled:pointer-events-none disabled:opacity-50" aria-label={`Retirer ${member.name}`}>
                            <Trash2 className="size-4 text-muted-foreground" />
                          </button>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader className="gap-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-sm">Canaux de notification</CardTitle>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Séparez les alertes administratives des messages client.</p>
                </div>
                <Badge variant="outline">{activeNotificationCount} actif{activeNotificationCount > 1 ? 's' : ''}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {notifState.map(n => (
                <div key={n.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{n.label}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{n.description}</p>
                  </div>
                  <Switch checked={n.enabled} onCheckedChange={checked => updateNotificationChannel(n.id, checked)} />
                </div>
              ))}
              <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-muted-foreground">Dernière sauvegarde : <span className="font-medium text-foreground">{notificationsSavedAt}</span></p>
                <Button size="sm" className="w-full sm:w-auto" onClick={saveNotificationSettings}>Enregistrer les canaux</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader className="gap-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-sm">Méthodes de paiement</CardTitle>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Activez uniquement les moyens que l’équipe peut rapprocher comptablement.</p>
                </div>
                <Badge variant="outline">{activePaymentCount} active{activePaymentCount > 1 ? 's' : ''}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {payState.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold">{p.icon}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{p.description}</p>
                    </div>
                  </div>
                  <Switch checked={p.enabled} onCheckedChange={checked => updatePaymentMethod(p.id, checked)} />
                </div>
              ))}
              <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-muted-foreground">Dernière sauvegarde : <span className="font-medium text-foreground">{paymentsSavedAt}</span></p>
                <Button size="sm" className="w-full sm:w-auto" onClick={savePaymentSettings}>Enregistrer les paiements</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingMember ? 'Modifier un membre' : 'Ajouter un membre'}</DialogTitle>
            <DialogDescription>Rôle admin, photo publique et spécialité opérationnelle.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="member-name">Nom complet</Label>
              <Input id="member-name" value={memberDraft.name} onChange={event => setMemberDraft(prev => ({ ...prev, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-email">E-mail professionnel</Label>
              <Input id="member-email" type="email" value={memberDraft.email} onChange={event => setMemberDraft(prev => ({ ...prev, email: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-phone">Téléphone</Label>
              <Input id="member-phone" value={memberDraft.phone || ''} onChange={event => setMemberDraft(prev => ({ ...prev, phone: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-role">Rôle</Label>
              <select id="member-role" value={memberDraft.role} onChange={event => setMemberDraft(prev => ({ ...prev, role: event.target.value }))} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-department">Département</Label>
              <select id="member-department" value={memberDraft.department} onChange={event => setMemberDraft(prev => ({ ...prev, department: event.target.value }))} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                {Object.entries(DEPARTMENT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="member-photo">Photo</Label>
              <Input id="member-photo" value={memberDraft.photoUrl} onChange={event => setMemberDraft(prev => ({ ...prev, photoUrl: event.target.value }))} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="member-bio">Mission</Label>
              <Textarea id="member-bio" value={memberDraft.bio} onChange={event => setMemberDraft(prev => ({ ...prev, bio: event.target.value }))} rows={3} />
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Compte actif</p>
                <p className="text-xs text-muted-foreground">Autorise l’accès admin.</p>
              </div>
              <Switch checked={memberDraft.active} onCheckedChange={checked => setMemberDraft(prev => ({ ...prev, active: checked }))} />
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Visible public</p>
                <p className="text-xs text-muted-foreground">Affiché sur l’accueil.</p>
              </div>
              <Switch checked={memberDraft.publicVisible} onCheckedChange={checked => setMemberDraft(prev => ({ ...prev, publicVisible: checked }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Annuler</Button>
            <Button onClick={() => { void saveMember(); }} disabled={teamSavingId !== null}>
              <UserRoundCheck className="size-4" />
              {teamSavingId ? 'Synchronisation...' : editingMember ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
