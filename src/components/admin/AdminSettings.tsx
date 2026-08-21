'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Users, Bell, CreditCard, Plus, Shield, Trash2, Pencil, User as UserIcon } from 'lucide-react';

const teamMembers = [
  { id: '1', name: 'Diabaté Ibrahim', role: 'super_admin', email: 'diabate@bati.ci', active: true },
  { id: '2', name: 'Coulibaly Awa', role: 'commercial', email: 'coulibaly@bati.ci', active: true },
  { id: '3', name: 'Konan Yao', role: 'architecte', email: 'konan@bati.ci', active: true },
  { id: '4', name: 'Yao Koffi', role: 'ingenieur', email: 'yao@bati.ci', active: true },
  { id: '5', name: 'Brou Éric', role: 'economiste', email: 'brou@bati.ci', active: true },
  { id: '6', name: 'Nguessan Mariam', role: 'conducteur', email: 'nguessan@bati.ci', active: true },
  { id: '7', name: 'Touré Moussa', role: 'comptable', email: 'toure@bati.ci', active: false },
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
  { id: 'email', label: 'E-mail', enabled: true },
  { id: 'sms', label: 'SMS', enabled: true },
  { id: 'push', label: 'Push PWA', enabled: true },
  { id: 'whatsapp', label: 'WhatsApp', enabled: false },
];

const paymentMethods = [
  { id: 'wave', name: 'Wave', enabled: true, icon: 'W' },
  { id: 'orange_money', name: 'Orange Money', enabled: true, icon: 'OM' },
  { id: 'mtn', name: 'MTN Mobile Money', enabled: false, icon: 'MTN' },
  { id: 'card', name: 'Carte bancaire', enabled: false, icon: 'CB' },
  { id: 'bank', name: 'Virement bancaire', enabled: true, icon: 'VB' },
];

export function AdminSettings() {
  const [notifState, setNotifState] = useState(notifChannels);
  const [payState, setPayState] = useState(paymentMethods);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Paramètres</h1>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="general" className="text-xs sm:text-sm"><Building2 className="w-4 h-4 mr-1.5 hidden sm:block" />Général</TabsTrigger>
          <TabsTrigger value="team" className="text-xs sm:text-sm"><Users className="w-4 h-4 mr-1.5 hidden sm:block" />Équipe</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs sm:text-sm"><Bell className="w-4 h-4 mr-1.5 hidden sm:block" />Notifications</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs sm:text-sm"><CreditCard className="w-4 h-4 mr-1.5 hidden sm:block" />Paiements</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader><CardTitle className="text-sm">Informations de l'entreprise</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-xs">Nom de l'entreprise</Label><Input defaultValue="BÂTI·CI" /></div>
                <div className="space-y-1.5"><Label className="text-xs">Slogan</Label><Input defaultValue="Votre projet. Bien construit." /></div>
                <div className="space-y-1.5"><Label className="text-xs">Téléphone</Label><Input defaultValue="+225 01 02 03 04" /></div>
                <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input defaultValue="contact@bati.ci" /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label className="text-xs">Adresse</Label><Input defaultValue="Zone 4, Abidjan, Côte d'Ivoire" /></div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Textarea defaultValue="Entreprise de BTP spécialisée en construction de villas, duplex, immeubles, promotion immobilière, VRD et hydraulique en Côte d'Ivoire." rows={3} />
              </div>
              <Button size="sm">Enregistrer</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Membres de l'équipe ({teamMembers.length})</CardTitle>
              <Button size="sm"><Plus className="w-3.5 h-3.5 mr-1" /> Inviter</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {teamMembers.map(m => (
                  <div key={m.id} className="flex items-center gap-3 px-6 py-3">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{ROLES[m.role]}</Badge>
                    {!m.active && <Badge variant="outline" className="text-[10px] shrink-0">Inactif</Badge>}
                    <button className="p-1.5 hover:bg-muted rounded"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader><CardTitle className="text-sm">Canaux de notification</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {notifState.map(n => (
                <div key={n.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{n.label}</p>
                  </div>
                  <Switch checked={n.enabled} onCheckedChange={c => setNotifState(prev => prev.map(x => x.id === n.id ? { ...x, enabled: c } : x))} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader><CardTitle className="text-sm">Méthodes de paiement</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {payState.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xs font-bold">{p.icon}</div>
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                    </div>
                  </div>
                  <Switch checked={p.enabled} onCheckedChange={c => setPayState(prev => prev.map(x => x.id === p.id ? { ...x, enabled: c } : x))} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}