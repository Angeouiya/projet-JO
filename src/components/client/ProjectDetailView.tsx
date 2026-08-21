'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MapPin, Calendar, Wallet, Layers, Users,
  FileText, Upload, Image, FileCheck, Receipt,
  Send, MessageSquare, Check, X, Clock, Camera,
  ClipboardCheck, AlertCircle, Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/stores/app-store';
import { PROJECT_STATUS_LABELS, FORMAT_XOF } from '@/types';

// ── Mock data ──────────────────────────────────────────────

const PROJECT_MAP: Record<string, {
  referenceNumber: string;
  title: string;
  status: string;
  categoryName: string;
  modelName: string;
  city: string;
  budgetMin: number;
  budgetMax: number;
  progress: number;
  terrain: string;
  terrainStatus: string;
  startDate: string;
  estimatedEnd: string;
  team: { name: string; role: string }[];
  documents: { type: string; name: string; date: string; icon: typeof FileText }[];
  messages: { id: string; sender: string; senderRole: string; text: string; time: string; isOwn: boolean }[];
  quotes: { id: string; label: string; amount: number; status: 'pending' | 'accepted' | 'refused'; date: string; }[];
  phases: { name: string; status: 'done' | 'in_progress' | 'pending'; progress: number }[];
  photos: { id: string; caption: string; date: string }[];
}> = {
  'prj-001': {
    referenceNumber: 'BTP-2024-0042',
    title: 'Villa Aurore',
    status: 'in_progress',
    categoryName: 'Villa basse',
    modelName: 'Villa Aurore',
    city: 'Cocody, Abidjan',
    budgetMin: 55_000_000,
    budgetMax: 75_000_000,
    progress: 65,
    terrain: '600 m² – Lot 14, Cocody Riviera Palmeraie',
    terrainStatus: 'Acquis – Titre foncier disponible',
    startDate: '2024-10-01',
    estimatedEnd: '2025-06-30',
    team: [
      { name: 'Kouamé A.', role: 'Chef de projet' },
      { name: 'Traoré M.', role: 'Ingénieur BET' },
      { name: 'Diallo S.', role: 'Conducteur de travaux' },
    ],
    documents: [
      { type: 'plan', name: 'Plan d\'exécution RDC', date: '2024-09-20', icon: FileText },
      { type: 'plan', name: 'Plan d\'exécution Étage', date: '2024-09-20', icon: FileText },
      { type: 'photo', name: 'Photo terrain – État initial', date: '2024-09-25', icon: Image },
      { type: 'photo', name: 'Fondations – Avancement 100%', date: '2024-11-10', icon: Image },
      { type: 'contrat', name: 'Contrat de construction', date: '2024-09-30', icon: FileCheck },
      { type: 'facture', name: 'Facture acompte 30%', date: '2024-10-05', icon: Receipt },
    ],
    messages: [
      { id: 'm1', sender: 'Kouamé A.', senderRole: 'Chef de projet', text: 'Bonjour, les fondations sont terminées. Nous passons à l\'élévation cette semaine.', time: '10:30', isOwn: false },
      { id: 'm2', sender: 'Vous', senderRole: 'Client', text: 'Excellent ! Merci pour le suivi. Quand pouvons-nous visiter ?', time: '10:45', isOwn: true },
      { id: 'm3', sender: 'Kouamé A.', senderRole: 'Chef de projet', text: 'Une visite est prévue vendredi à 10h. Je vous enverrai la confirmation.', time: '11:02', isOwn: false },
      { id: 'm4', sender: 'Vous', senderRole: 'Client', text: 'Parfait, je serai présent. Merci !', time: '11:05', isOwn: true },
    ],
    quotes: [
      { id: 'q1', label: 'Devis initial – Construction villa', amount: 62_500_000, status: 'accepted', date: '2024-09-15' },
      { id: 'q2', label: 'Avenant piscine', amount: 8_500_000, status: 'pending', date: '2024-12-01' },
    ],
    phases: [
      { name: 'Études & Permis', status: 'done', progress: 100 },
      { name: 'Fondations', status: 'done', progress: 100 },
      { name: 'Élévation & Maçonnerie', status: 'done', progress: 100 },
      { name: 'Toiture & Charpente', status: 'in_progress', progress: 60 },
      { name: 'Second œuvre', status: 'pending', progress: 0 },
      { name: 'Finitions & Livraison', status: 'pending', progress: 0 },
    ],
    photos: [
      { id: 'p1', caption: 'Terrain brut – Vue sud', date: '2024-09-25' },
      { id: 'p2', caption: 'Fondations terminées', date: '2024-11-10' },
      { id: 'p3', caption: 'Élévation – Mur RDC', date: '2024-12-05' },
      { id: 'p4', caption: 'Élévation – Mur Étage', date: '2025-01-02' },
    ],
  },
  'prj-002': {
    referenceNumber: 'BTP-2024-0058',
    title: 'Duplex Horizon',
    status: 'quote_sent',
    categoryName: 'Duplex',
    modelName: 'Duplex Horizon',
    city: 'Riviera, Abidjan',
    budgetMin: 85_000_000,
    budgetMax: 120_000_000,
    progress: 15,
    terrain: '450 m² – Riviera Golf',
    terrainStatus: 'En cours d\'acquisition',
    startDate: '2025-02-15',
    estimatedEnd: '2026-02-15',
    team: [
      { name: 'Bamba K.', role: 'Chef de projet' },
    ],
    documents: [
      { type: 'plan', name: 'Plan masse', date: '2024-12-01', icon: FileText },
      { type: 'contrat', name: 'Contrat de réservation', date: '2024-11-25', icon: FileCheck },
    ],
    messages: [
      { id: 'm1', sender: 'Bamba K.', senderRole: 'Chef de projet', text: 'Le devis est prêt pour votre duplex. N\'hésitez pas à le consulter.', time: '14:00', isOwn: false },
    ],
    quotes: [
      { id: 'q1', label: 'Devis duplex R+1', amount: 98_000_000, status: 'pending', date: '2025-01-08' },
    ],
    phases: [
      { name: 'Études & Permis', status: 'in_progress', progress: 40 },
      { name: 'Fondations', status: 'pending', progress: 0 },
      { name: 'Élévation & Maçonnerie', status: 'pending', progress: 0 },
      { name: 'Toiture & Charpente', status: 'pending', progress: 0 },
      { name: 'Second œuvre', status: 'pending', progress: 0 },
      { name: 'Finitions & Livraison', status: 'pending', progress: 0 },
    ],
    photos: [],
  },
  'prj-003': {
    referenceNumber: 'BTP-2025-0003',
    title: 'Projet résidentiel Bingerville',
    status: 'draft',
    categoryName: 'Villa basse',
    modelName: 'Villa Émeraude',
    city: 'Bingerville',
    budgetMin: 30_000_000,
    budgetMax: 45_000_000,
    progress: 0,
    terrain: 'Non défini',
    terrainStatus: 'À déterminer',
    startDate: 'Non défini',
    estimatedEnd: 'Non défini',
    team: [],
    documents: [],
    messages: [],
    quotes: [],
    phases: [
      { name: 'Études & Permis', status: 'pending', progress: 0 },
      { name: 'Fondations', status: 'pending', progress: 0 },
      { name: 'Élévation & Maçonnerie', status: 'pending', progress: 0 },
      { name: 'Toiture & Charpente', status: 'pending', progress: 0 },
      { name: 'Second œuvre', status: 'pending', progress: 0 },
      { name: 'Finitions & Livraison', status: 'pending', progress: 0 },
    ],
    photos: [],
  },
  'prj-004': {
    referenceNumber: 'BTP-2023-0018',
    title: 'Immeuble Élysée',
    status: 'delivered',
    categoryName: 'Immeuble',
    modelName: 'Immeuble Élysée',
    city: 'Plateau, Abidjan',
    budgetMin: 350_000_000,
    budgetMax: 500_000_000,
    progress: 100,
    terrain: '800 m² – Plateau',
    terrainStatus: 'Acquis',
    startDate: '2023-08-01',
    estimatedEnd: '2024-08-01',
    team: [
      { name: 'Koné M.', role: 'Chef de projet' },
      { name: 'Ouattara F.', role: 'Ingénieur BET' },
    ],
    documents: [
      { type: 'plan', name: 'Plans définitifs', date: '2023-07-15', icon: FileText },
      { type: 'contrat', name: 'Contrat de construction', date: '2023-07-20', icon: FileCheck },
      { type: 'facture', name: 'Facture solde', date: '2024-07-30', icon: Receipt },
      { type: 'photo', name: 'Livraison – Vue extérieure', date: '2024-08-20', icon: Image },
    ],
    messages: [
      { id: 'm1', sender: 'Koné M.', senderRole: 'Chef de projet', text: 'L\'immeuble est livré ! Tous les contrôles sont conformes.', time: '09:00', isOwn: false },
      { id: 'm2', sender: 'Vous', senderRole: 'Client', text: 'Merci beaucoup pour tout le travail accompli !', time: '09:30', isOwn: true },
    ],
    quotes: [
      { id: 'q1', label: 'Devis immeuble R+4', amount: 420_000_000, status: 'accepted', date: '2023-07-10' },
    ],
    phases: [
      { name: 'Études & Permis', status: 'done', progress: 100 },
      { name: 'Fondations', status: 'done', progress: 100 },
      { name: 'Élévation & Maçonnerie', status: 'done', progress: 100 },
      { name: 'Toiture & Charpente', status: 'done', progress: 100 },
      { name: 'Second œuvre', status: 'done', progress: 100 },
      { name: 'Finitions & Livraison', status: 'done', progress: 100 },
    ],
    photos: [
      { id: 'p1', caption: 'Livraison – Façade principale', date: '2024-08-20' },
      { id: 'p2', caption: 'Livraison – Hall d\'entrée', date: '2024-08-20' },
    ],
  },
  'prj-005': {
    referenceNumber: 'BTP-2024-0071',
    title: 'Villa Émeraude',
    status: 'in_progress',
    categoryName: 'Villa basse',
    modelName: 'Villa Émeraude',
    city: 'Yamoussoukro',
    budgetMin: 30_000_000,
    budgetMax: 45_000_000,
    progress: 40,
    terrain: '400 m² – Zone résidentielle',
    terrainStatus: 'Acquis',
    startDate: '2024-11-01',
    estimatedEnd: '2025-07-01',
    team: [
      { name: 'Diarra I.', role: 'Chef de projet' },
      { name: 'Coulibaly A.', role: 'Conducteur de travaux' },
    ],
    documents: [
      { type: 'plan', name: 'Plan villa', date: '2024-10-15', icon: FileText },
      { type: 'photo', name: 'Début des travaux', date: '2024-11-05', icon: Image },
      { type: 'contrat', name: 'Contrat de construction', date: '2024-10-25', icon: FileCheck },
    ],
    messages: [
      { id: 'm1', sender: 'Diarra I.', senderRole: 'Chef de projet', text: 'Les travaux de fondation sont bien avancés. Tout se passe bien.', time: '16:00', isOwn: false },
    ],
    quotes: [
      { id: 'q1', label: 'Devis villa standard', amount: 35_500_000, status: 'accepted', date: '2024-10-10' },
    ],
    phases: [
      { name: 'Études & Permis', status: 'done', progress: 100 },
      { name: 'Fondations', status: 'done', progress: 100 },
      { name: 'Élévation & Maçonnerie', status: 'in_progress', progress: 50 },
      { name: 'Toiture & Charpente', status: 'pending', progress: 0 },
      { name: 'Second œuvre', status: 'pending', progress: 0 },
      { name: 'Finitions & Livraison', status: 'pending', progress: 0 },
    ],
    photos: [
      { id: 'p1', caption: 'Terrassement', date: '2024-11-05' },
      { id: 'p2', caption: 'Fondations en cours', date: '2024-11-20' },
    ],
  },
};

// ── Helper ─────────────────────────────────────────────────

function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'in_progress' || status === 'accepted') return 'default';
  if (status === 'draft') return 'secondary';
  if (status === 'delivered') return 'outline';
  return 'secondary';
}

function getQuoteStatusBadge(status: string) {
  if (status === 'accepted') return { label: 'Accepté', variant: 'outline' as const };
  if (status === 'refused') return { label: 'Refusé', variant: 'destructive' as const };
  return { label: 'En attente', variant: 'secondary' as const };
}

// ── Sub-views ──────────────────────────────────────────────

function ResumeTab({ data }: { data: NonNullable<ReturnType<typeof PROJECT_MAP[string]>> }) {
  const infoItems = [
    { icon: Building2, label: 'Type', value: data.categoryName },
    { icon: MapPin, label: 'Localisation', value: data.city },
    { icon: Layers, label: 'Modèle', value: data.modelName },
    { icon: Wallet, label: 'Budget estimé', value: `${FORMAT_XOF(data.budgetMin)} – ${FORMAT_XOF(data.budgetMax)}` },
    { icon: Calendar, label: 'Début prévu', value: data.startDate },
    { icon: Calendar, label: 'Fin estimée', value: data.estimatedEnd },
  ];

  return (
    <div className="space-y-4">
      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {infoItems.map((item) => (
          <Card key={item.label} className="py-0 gap-0">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="size-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <item.icon className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{item.label}</p>
                <p className="text-sm font-medium mt-0.5 break-words">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Terrain */}
      <Card className="py-0 gap-0">
        <CardContent className="p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Terrain</h4>
          <p className="text-sm font-medium mt-2">{data.terrain}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <div className={`size-2 rounded-full ${data.terrainStatus.includes('Acquis') ? 'bg-foreground' : 'bg-muted-foreground/40'}`} />
            <span className="text-xs text-muted-foreground">{data.terrainStatus}</span>
          </div>
        </CardContent>
      </Card>

      {/* Team */}
      {data.team.length > 0 && (
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Users className="size-3.5" />
              Équipe assignée
            </h4>
            <div className="mt-3 space-y-2.5">
              {data.team.map((member) => (
                <div key={member.name} className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-[11px] text-muted-foreground">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DocumentsTab({ data }: { data: NonNullable<ReturnType<typeof PROJECT_MAP[string]>> }) {
  const docTypeLabels: Record<string, string> = {
    plan: 'Plans',
    photo: 'Photos',
    contrat: 'Contrats',
    facture: 'Factures',
  };

  const grouped = data.documents.reduce<Record<string, typeof data.documents>>((acc, doc) => {
    const key = doc.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(doc);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <Button variant="outline" className="w-full gap-2 border-dashed">
        <Upload className="size-4" />
        Importer un document
      </Button>

      {Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <FileText className="size-8 text-muted-foreground/30" />
          <p className="mt-3 text-sm text-muted-foreground">Aucun document pour le moment.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([type, docs]) => (
          <div key={type}>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {docTypeLabels[type] || type} ({docs.length})
            </h4>
            <div className="space-y-2">
              {docs.map((doc, i) => (
                <Card key={i} className="py-0 gap-0">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <doc.icon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-[11px] text-muted-foreground">{doc.date}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function MessagesTab({ data }: { data: NonNullable<ReturnType<typeof PROJECT_MAP[string]>> }) {
  const [newMessage, setNewMessage] = useState('');
  const [localMessages, setLocalMessages] = useState(data.messages);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const msg = {
      id: `m-${Date.now()}`,
      sender: 'Vous',
      senderRole: 'Client',
      text: newMessage.trim(),
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
    };
    setLocalMessages(prev => [...prev, msg]);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-[60vh]">
      {/* Messages list */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-3">
        {localMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="size-8 text-muted-foreground/30" />
            <p className="mt-3 text-sm text-muted-foreground">Aucun message pour le moment.</p>
          </div>
        ) : (
          localMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  msg.isOwn
                    ? 'bg-foreground text-background rounded-br-md'
                    : 'bg-muted rounded-bl-md'
                }`}
              >
                {!msg.isOwn && (
                  <p className="text-[10px] font-semibold mb-0.5 opacity-60">{msg.sender} – {msg.senderRole}</p>
                )}
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p className={`text-[10px] mt-1 ${msg.isOwn ? 'text-right opacity-60' : 'opacity-40'}`}>
                  {msg.time}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="border-t pt-3 flex gap-2">
        <Textarea
          placeholder="Votre message..."
          className="min-h-[44px] max-h-24 resize-none text-sm"
          rows={1}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          size="icon"
          className="h-11 w-11 flex-shrink-0"
          onClick={handleSend}
          disabled={!newMessage.trim()}
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function DevisTab({ data }: { data: NonNullable<ReturnType<typeof PROJECT_MAP[string]>> }) {
  const [quotes, setQuotes] = useState(data.quotes);

  const handleAction = (quoteId: string, action: 'accepted' | 'refused') => {
    setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status: action as 'accepted' | 'refused' | 'pending' } : q));
  };

  if (quotes.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <Receipt className="size-8 text-muted-foreground/30" />
        <p className="mt-3 text-sm text-muted-foreground">Aucun devis disponible.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {quotes.map((quote) => {
        const badge = getQuoteStatusBadge(quote.status);
        return (
          <motion.div
            key={quote.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="py-0 gap-0">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold">{quote.label}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{quote.date}</p>
                  </div>
                  <Badge variant={badge.variant} className="text-[10px] flex-shrink-0">
                    {badge.label}
                  </Badge>
                </div>
                <p className="text-lg font-bold mt-3">{FORMAT_XOF(quote.amount)}</p>

                {quote.status === 'pending' && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5 text-xs"
                      onClick={() => handleAction(quote.id, 'accepted')}
                    >
                      <Check className="size-3.5" />
                      Accepter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 text-xs"
                      onClick={() => handleAction(quote.id, 'refused')}
                    >
                      <X className="size-3.5" />
                      Refuser
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

function ChantierTab({ data }: { data: NonNullable<ReturnType<typeof PROJECT_MAP[string]>> }) {
  return (
    <div className="space-y-6">
      {/* Progress phases */}
      <Card className="py-0 gap-0">
        <CardContent className="p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-4">
            <ClipboardCheck className="size-3.5" />
            Phases du chantier
          </h4>
          <div className="space-y-4">
            {data.phases.map((phase, i) => (
              <div key={phase.name}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        phase.status === 'done'
                          ? 'bg-foreground text-background'
                          : phase.status === 'in_progress'
                          ? 'border-2 border-foreground text-foreground'
                          : 'border-2 border-muted-foreground/30 text-muted-foreground/40'
                      }`}
                    >
                      {phase.status === 'done' ? <Check className="size-3" /> : i + 1}
                    </div>
                    <span className={`font-medium ${phase.status === 'pending' ? 'text-muted-foreground' : ''}`}>
                      {phase.name}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{phase.progress}%</span>
                </div>
                {phase.status !== 'pending' && (
                  <Progress value={phase.progress} className="h-1.5 ml-7" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Photo gallery */}
      <Card className="py-0 gap-0">
        <CardContent className="p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-4">
            <Camera className="size-3.5" />
            Photos du chantier
          </h4>
          {data.photos.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Camera className="size-7 text-muted-foreground/30" />
              <p className="mt-2 text-xs text-muted-foreground">Aucune photo disponible.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {data.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="aspect-[4/3] rounded-lg bg-muted flex items-center justify-center overflow-hidden relative group"
                >
                  <Camera className="size-6 text-muted-foreground/20" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-2">
                    <p className="text-[10px] text-white font-medium leading-tight">{photo.caption}</p>
                    <p className="text-[9px] text-white/60 mt-0.5">{photo.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reports */}
      <Card className="py-0 gap-0">
        <CardContent className="p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
            <AlertCircle className="size-3.5" />
            Rapports de chantier
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <FileText className="size-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Rapport hebdomadaire S02</p>
                <p className="text-[11px] text-muted-foreground">2025-01-06 – 2025-01-10</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <FileText className="size-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Rapport hebdomadaire S01</p>
                <p className="text-[11px] text-muted-foreground">2024-12-30 – 2025-01-03</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main View ──────────────────────────────────────────────

type TabValue = 'resume' | 'documents' | 'messages' | 'devis' | 'chantier';

export function ProjectDetailView() {
  const { goBack, viewParams } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabValue>('resume');

  const projectId = viewParams?.id || 'prj-001';
  const data = PROJECT_MAP[projectId] || PROJECT_MAP['prj-001'];

  const tabs = [
    { value: 'resume' as const, label: 'Résumé' },
    { value: 'documents' as const, label: 'Documents' },
    { value: 'messages' as const, label: 'Messages' },
    { value: 'devis' as const, label: 'Devis' },
    { value: 'chantier' as const, label: 'Chantier' },
  ];

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="size-9" onClick={goBack}>
            <ArrowLeft className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate">{data.referenceNumber}</p>
            <p className="text-sm font-semibold truncate">{data.title}</p>
          </div>
          <Badge variant={getStatusVariant(data.status)} className="text-[10px] flex-shrink-0">
            {PROJECT_STATUS_LABELS[data.status] || data.status}
          </Badge>
        </div>

        {/* Progress */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-muted-foreground">Avancement global</span>
            <span className="font-medium">{data.progress}%</span>
          </div>
          <Progress value={data.progress} className="h-1.5" />
        </div>

        {/* Tabs */}
        <div className="px-4 pb-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
            <TabsList className="w-full h-10 p-0.5 bg-muted">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 h-9 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'resume' && <ResumeTab data={data} />}
            {activeTab === 'documents' && <DocumentsTab data={data} />}
            {activeTab === 'messages' && <MessagesTab data={data} />}
            {activeTab === 'devis' && <DevisTab data={data} />}
            {activeTab === 'chantier' && <ChantierTab data={data} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
