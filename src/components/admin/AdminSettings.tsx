'use client';

import { useState } from 'react';
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
import { Building2, Users, Bell, CreditCard, Plus, Trash2, Pencil, User as UserIcon } from 'lucide-react';

type TeamMember = {
  id: string;
  name: string;
  role: string;
  email: string;
  active: boolean;
};

type GeneralSettings = {
  companyName: string;
  slogan: string;
  phone: string;
  email: string;
  address: string;
  description: string;
};

const initialTeamMembers: TeamMember[] = [
  { id: '1', name: 'Diabaté Ibrahim', role: 'super_admin', email: 'diabate@buildify.ci', active: true },
  { id: '2', name: 'Coulibaly Awa', role: 'commercial', email: 'coulibaly@buildify.ci', active: true },
  { id: '3', name: 'Konan Yao', role: 'architecte', email: 'konan@buildify.ci', active: true },
  { id: '4', name: 'Yao Koffi', role: 'ingenieur', email: 'yao@buildify.ci', active: true },
  { id: '5', name: 'Brou Éric', role: 'economiste', email: 'brou@buildify.ci', active: true },
  { id: '6', name: 'Nguessan Mariam', role: 'conducteur', email: 'nguessan@buildify.ci', active: true },
  { id: '7', name: 'Touré Moussa', role: 'comptable', email: 'toure@buildify.ci', active: false },
];

const ROLES: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  direction: 'Direction',
  commercial: 'Commercial',
  architecte: 'Architecte',
  ingenieur: 'Ingénieur',
  economiste: 'Économiste',
  metreur: 'Métreur',
  conducteur: 'Conducteur de travaux',
  chef_projet: 'Chef de projet',
  comptable: 'Comptable',
  support: 'Support',
  lecteur: 'Lecteur',
};

const notifChannels = [
  { id: 'email', label: 'E-mail', description: 'Recommandé pour devis, contrats, factures et mot de passe oublié.', enabled: true },
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

export function AdminSettings() {
  const addToast = useAppStore(state => state.addToast);
  const [general, setGeneral] = useState<GeneralSettings>({
    companyName: 'Buildify',
    slogan: 'Votre projet. Bien construit.',
    phone: '+225 01 02 03 04',
    email: 'contact@buildify.ci',
    address: "Zone 4, Abidjan, Côte d'Ivoire",
    description: "Entreprise de BTP spécialisée en construction de villas, duplex, immeubles, promotion immobilière, VRD et hydraulique en Côte d'Ivoire.",
  });
  const [members, setMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [notifState, setNotifState] = useState(notifChannels);
  const [payState, setPayState] = useState(paymentMethods);
  const [notificationsSavedAt, setNotificationsSavedAt] = useState('Configuration initiale');
  const [paymentsSavedAt, setPaymentsSavedAt] = useState('Configuration initiale');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [memberDraft, setMemberDraft] = useState<Omit<TeamMember, 'id'>>({
    name: '',
    role: 'commercial',
    email: '',
    active: true,
  });

  const setGeneralField = (key: keyof GeneralSettings, value: string) => {
    setGeneral(prev => ({ ...prev, [key]: value }));
  };

  const activeNotificationCount = notifState.filter(channel => channel.enabled).length;
  const activePaymentCount = payState.filter(method => method.enabled).length;

  const saveGeneral = () => {
    if (!general.companyName.trim() || !general.email.trim()) {
      addToast("Le nom de l'entreprise et l'e-mail sont obligatoires.", 'error');
      return;
    }
    addToast('Paramètres entreprise enregistrés.', 'success');
  };

  const openInvite = () => {
    setEditingMember(null);
    setMemberDraft({ name: '', role: 'commercial', email: '', active: true });
    setInviteOpen(true);
  };

  const openMemberEdit = (member: TeamMember) => {
    setEditingMember(member);
    setMemberDraft({
      name: member.name,
      role: member.role,
      email: member.email,
      active: member.active,
    });
    setInviteOpen(true);
  };

  const saveMember = () => {
    if (!memberDraft.name.trim() || !memberDraft.email.trim()) {
      addToast('Le nom et l’e-mail du membre sont obligatoires.', 'error');
      return;
    }
    if (!isEmail(memberDraft.email.trim())) {
      addToast("L'e-mail professionnel du membre n'est pas valide.", 'error');
      return;
    }

    if (editingMember) {
      setMembers(prev => prev.map(member => (
        member.id === editingMember.id ? { ...member, ...memberDraft, name: memberDraft.name.trim(), email: memberDraft.email.trim() } : member
      )));
      addToast('Membre mis à jour.', 'success');
    } else {
      setMembers(prev => [{
        id: `team-${Date.now()}`,
        ...memberDraft,
        name: memberDraft.name.trim(),
        email: memberDraft.email.trim(),
      }, ...prev]);
      addToast('Invitation ajoutée à l’équipe.', 'success');
    }
    setInviteOpen(false);
  };

  const deleteMember = (memberId: string) => {
    const target = members.find(member => member.id === memberId);
    if (!target) return;
    const activeSuperAdmins = members.filter(member => member.role === 'super_admin' && member.active).length;
    if (target.role === 'super_admin' && target.active && activeSuperAdmins <= 1) {
      addToast('Impossible de retirer le dernier super admin actif.', 'error');
      return;
    }
    setMembers(prev => prev.filter(member => member.id !== memberId));
    addToast('Membre retiré de l’équipe.', 'success');
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
      <h1 className="text-xl font-bold">Paramètres admin</h1>

      <Tabs defaultValue="general" className="space-y-4">
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
              <div className="grid sm:grid-cols-2 gap-4">
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

        <TabsContent value="team">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Membres de l'équipe ({members.length})</CardTitle>
              <Button size="sm" className="gap-1" onClick={openInvite}><Plus className="size-3.5" /> Inviter</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {members.map(m => (
                  <div key={m.id} className="grid gap-3 px-4 py-3 sm:grid-cols-[36px_minmax(0,1fr)_auto_auto] sm:items-center sm:px-6">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-[10px] shrink-0">{ROLES[m.role]}</Badge>
                      {!m.active && <Badge variant="outline" className="text-[10px] shrink-0">Inactif</Badge>}
                    </div>
                    <div className="flex gap-1 sm:justify-end">
                      <button type="button" onClick={() => openMemberEdit(m)} className="rounded p-1.5 hover:bg-muted" aria-label={`Modifier ${m.name}`}>
                        <Pencil className="size-3.5 text-muted-foreground" />
                      </button>
                      <ConfirmActionDialog
                        title="Retirer ce membre ?"
                        description={`${m.name} n’aura plus accès à cette équipe admin locale.`}
                        confirmLabel="Retirer"
                        confirmClassName="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onConfirm={() => deleteMember(m.id)}
                        trigger={(
                          <button type="button" className="rounded p-1.5 hover:bg-muted" aria-label={`Retirer ${m.name}`}>
                            <Trash2 className="size-3.5 text-muted-foreground" />
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
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Séparez les alertes administratives des messages client et gardez au moins un canal actif.
                  </p>
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
                <p className="text-xs leading-5 text-muted-foreground">
                  Dernière sauvegarde : <span className="font-medium text-foreground">{notificationsSavedAt}</span>
                </p>
                <Button size="sm" className="w-full sm:w-auto" onClick={saveNotificationSettings}>
                  Enregistrer les canaux
                </Button>
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
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Activez uniquement les moyens que l’équipe peut rapprocher comptablement et justifier au client.
                  </p>
                </div>
                <Badge variant="outline">{activePaymentCount} active{activePaymentCount > 1 ? 's' : ''}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {payState.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xs font-bold">{p.icon}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{p.description}</p>
                    </div>
                  </div>
                  <Switch checked={p.enabled} onCheckedChange={checked => updatePaymentMethod(p.id, checked)} />
                </div>
              ))}
              <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-muted-foreground">
                  Dernière sauvegarde : <span className="font-medium text-foreground">{paymentsSavedAt}</span>
                </p>
                <Button size="sm" className="w-full sm:w-auto" onClick={savePaymentSettings}>
                  Enregistrer les paiements
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingMember ? 'Modifier un membre' : 'Inviter un membre'}</DialogTitle>
            <DialogDescription>Gérez l’équipe admin séparément de l’espace client.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="member-name">Nom complet</Label>
              <Input id="member-name" value={memberDraft.name} onChange={event => setMemberDraft(prev => ({ ...prev, name: event.target.value }))} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="member-email">E-mail professionnel</Label>
              <Input id="member-email" type="email" value={memberDraft.email} onChange={event => setMemberDraft(prev => ({ ...prev, email: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-role">Rôle</Label>
              <select id="member-role" value={memberDraft.role} onChange={event => setMemberDraft(prev => ({ ...prev, role: event.target.value }))} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                {Object.entries(ROLES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Compte actif</p>
                <p className="text-xs text-muted-foreground">Autorise l’accès admin.</p>
              </div>
              <Switch checked={memberDraft.active} onCheckedChange={checked => setMemberDraft(prev => ({ ...prev, active: checked }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Annuler</Button>
            <Button onClick={saveMember}>{editingMember ? 'Enregistrer' : 'Inviter'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
