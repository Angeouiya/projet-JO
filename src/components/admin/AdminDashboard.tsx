'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp, Clock, AlertTriangle, ArrowUpRight, Users, FolderKanban,
  HardHat, DollarSign, CalendarDays, ChevronRight, BarChart3, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app-store';
import { FORMAT_SHORT_XOF } from '@/types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

const revenueData = [
  { month: 'Jan', montant: 45000000 },
  { month: 'Fév', montant: 62000000 },
  { month: 'Mar', montant: 58000000 },
  { month: 'Avr', montant: 71000000 },
  { month: 'Mai', montant: 89000000 },
  { month: 'Jun', montant: 76000000 },
];

const statusData = [
  { name: 'En cours', value: 8, color: '#111111' },
  { name: 'Étude', value: 5, color: '#444444' },
  { name: 'Devis', value: 4, color: '#777777' },
  { name: 'Terminés', value: 12, color: '#BBBBBB' },
];

const categoryData = [
  { name: 'Villa', value: 15 },
  { name: 'Duplex', value: 8 },
  { name: 'Immeuble', value: 6 },
  { name: 'Promo', value: 4 },
  { name: 'VRD', value: 3 },
];

const recentActivity = [
  { id: '1', text: 'Nouveau projet soumis — Villa Cocody', time: 'Il y a 12 min', type: 'new' },
  { id: '2', text: 'Devis accepté — DUP-2024-0042', time: 'Il y a 1h', type: 'success' },
  { id: '3', text: 'Rendez-vous planifié — Visite Plateau', time: 'Il y a 2h', type: 'event' },
  { id: '4', text: 'Paiement reçu — 15 000 000 XOF', time: 'Il y a 3h', type: 'success' },
  { id: '5', text: 'Rapport de chantier publié', time: 'Il y a 5h', type: 'info' },
  { id: '6', text: 'Demande d\'info complémentaire', time: 'Il y a 6h', type: 'warning' },
  { id: '7', text: 'Nouveau client inscrit', time: 'Il y a 8h', type: 'new' },
  { id: '8', text: 'Chantier démarré — CITÉ RIVIERA', time: 'Hier', type: 'info' },
];

const stats = [
  { label: 'Nouvelles demandes', value: '12', icon: FileText, change: '+3 cette semaine' },
  { label: 'Projets actifs', value: '8', icon: FolderKanban, change: '2 en urgence' },
  { label: 'Chantiers en cours', value: '5', icon: HardHat, change: '1 retard' },
  { label: 'CA du mois', value: FORMAT_SHORT_XOF(76000000), icon: DollarSign, change: '+18%' },
  { label: 'Taux conversion', value: '67%', icon: TrendingUp, change: '+5% vs mois dernier' },
  { label: 'Rendez-vous', value: '4', icon: CalendarDays, change: 'Cette semaine' },
];

function FileText(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>;
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export function AdminDashboard() {
  const { setAdminTab, navigate } = useAppStore();

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm mt-1">Vue d'ensemble de votre activité</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={item}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="w-4 h-4 text-muted-foreground" />
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1 truncate">{stat.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{stat.change}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Chiffre d'affaires</CardTitle>
                <Badge variant="secondary">6 derniers mois</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueData}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v / 1000000}M`} />
                  <Tooltip
                    formatter={(value: number) => [`${new Intl.NumberFormat('fr-FR').format(value)} XOF`, 'Montant']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '12px' }}
                  />
                  <Bar dataKey="montant" radius={[4, 4, 0, 0]}>
                    {revenueData.map((_, idx) => (
                      <Cell key={idx} fill={['#111', '#333', '#555', '#777', '#999', '#bbb'][idx]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Projects by Status */}
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Projets par statut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {statusData.map(s => (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{s.name}</span>
                      <span className="text-xs font-bold">{s.value}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(s.value / 12) * 100}%`, backgroundColor: s.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Activité récente</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs">Tout voir</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recentActivity.map(a => (
                  <div key={a.id} className="flex items-start gap-3 px-6 py-3 hover:bg-muted/50 transition-colors">
                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                      a.type === 'new' ? 'bg-foreground' :
                      a.type === 'success' ? 'bg-foreground' :
                      a.type === 'warning' ? 'bg-muted-foreground' :
                      'bg-muted-foreground'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-tight">{a.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions + Category Breakdown */}
        <motion.div variants={item} className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => setAdminTab('requests')}>
                <FileText className="w-5 h-5" />
                <span className="text-xs">Nouvelle demande</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => setAdminTab('catalog')}>
                <Package className="w-5 h-5" />
                <span className="text-xs">Ajouter modèle</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => setAdminTab('clients')}>
                <Users className="w-5 h-5" />
                <span className="text-xs">Voir clients</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => setAdminTab('projects')}>
                <BarChart3 className="w-5 h-5" />
                <span className="text-xs">Rapports</span>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Par catégorie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {categoryData.map(c => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="text-xs w-16 text-muted-foreground">{c.name}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-foreground rounded-full" style={{ width: `${(c.value / 15) * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium w-6 text-right">{c.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

function Package(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/></svg>;
}