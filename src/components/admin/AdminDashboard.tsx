'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ClipboardList,
  DollarSign,
  FolderKanban,
  HardHat,
  PackagePlus,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/stores/app-store';
import { FORMAT_SHORT_XOF } from '@/types';
import type { ProjectActivityData, ProjectData } from '@/types';

const CHART_COLORS = ['#111111', '#333333', '#555555', '#777777', '#999999', '#BBBBBB'];
const ACTIVE_STATUSES = ['planning', 'in_progress', 'studying', 'estimating', 'quote_sent', 'proposal_validated'];

const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

function budgetOf(project: ProjectData) {
  return project.budgetMax || project.budgetMin || project.financing?.estimatedBudget || 0;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date).replace('.', '');
}

function buildPortfolioData(projects: ProjectData[]) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return { key: monthKey(date), month: monthLabel(date), montant: 0 };
  });

  projects.forEach(project => {
    const key = monthKey(new Date(project.createdAt));
    const row = months.find(month => month.key === key);
    if (row) row.montant += budgetOf(project);
  });

  return months;
}

function buildStatusData(projects: ProjectData[]) {
  const rows = [
    { name: 'Nouvelles', statuses: ['submitted', 'info_required'], color: '#111111' },
    { name: 'Étude', statuses: ['studying', 'estimating', 'proposal_ready'], color: '#444444' },
    { name: 'Devis', statuses: ['quote_sent', 'proposal_validated', 'accepted'], color: '#777777' },
    { name: 'Chantier', statuses: ['planning', 'in_progress'], color: '#999999' },
    { name: 'Livrés', statuses: ['delivered'], color: '#BBBBBB' },
  ];

  return rows.map(row => ({
    name: row.name,
    value: projects.filter(project => row.statuses.includes(project.status)).length,
    color: row.color,
  }));
}

function buildCategoryData(projects: ProjectData[]) {
  const counts = new Map<string, number>();
  projects.forEach(project => {
    const name = project.categoryName || project.modelName || 'Projet';
    counts.set(name, (counts.get(name) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

function relativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return 'Maintenant';
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

function buildActivity(projects: ProjectData[]) {
  return projects.flatMap(project => (
    (project.activityLog ?? []).map((activity: ProjectActivityData) => ({
      id: `${project.id}-${activity.id}`,
      text: `${activity.label} - ${project.referenceNumber}`,
      time: relativeTime(activity.createdAt),
      type: activity.type,
      createdAt: activity.createdAt,
    }))
  ))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);
}

export function AdminDashboard() {
  const { setAdminTab, userProjects } = useAppStore();

  const dashboard = useMemo(() => {
    const totalBudget = userProjects.reduce((sum, project) => sum + budgetOf(project), 0);
    const submitted = userProjects.filter(project => ['submitted', 'info_required'].includes(project.status)).length;
    const active = userProjects.filter(project => ACTIVE_STATUSES.includes(project.status)).length;
    const sites = userProjects.filter(project => project.status === 'in_progress').length;
    const validated = userProjects.filter(project => ['accepted', 'planning', 'in_progress', 'delivered'].includes(project.status)).length;
    const conversion = userProjects.length ? Math.round((validated / userProjects.length) * 100) : 0;
    const visits = userProjects.filter(project => project.status === 'visit_planned').length;

    return {
      portfolioData: buildPortfolioData(userProjects),
      statusData: buildStatusData(userProjects),
      categoryData: buildCategoryData(userProjects),
      recentActivity: buildActivity(userProjects),
      stats: [
        { label: 'Nouvelles demandes', value: String(submitted), icon: ClipboardList, change: submitted ? 'À traiter' : 'Aucune attente' },
        { label: 'Projets actifs', value: String(active), icon: FolderKanban, change: `${userProjects.length} dossier${userProjects.length > 1 ? 's' : ''} réel${userProjects.length > 1 ? 's' : ''}` },
        { label: 'Chantiers en cours', value: String(sites), icon: HardHat, change: sites ? 'Suivi terrain actif' : 'Aucun chantier' },
        { label: 'Portefeuille', value: FORMAT_SHORT_XOF(totalBudget), icon: DollarSign, change: 'Budget estimé' },
        { label: 'Conversion', value: `${conversion}%`, icon: TrendingUp, change: validated ? 'Dossiers validés' : 'À construire' },
        { label: 'Rendez-vous', value: String(visits), icon: CalendarDays, change: visits ? 'À préparer' : 'Aucun planifié' },
      ],
    };
  }, [userProjects]);

  const maxStatus = Math.max(1, ...dashboard.statusData.map(row => row.value));
  const maxCategory = Math.max(1, ...dashboard.categoryData.map(row => row.value));

  return (
    <motion.div initial={false} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm mt-1">Vue d’ensemble des dossiers réels enregistrés.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {dashboard.stats.map((stat) => (
          <motion.div key={stat.label} variants={item}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <stat.icon className="size-4 text-muted-foreground" />
                  <ArrowUpRight className="size-3.5" />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{stat.label}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div variants={item} className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Portefeuille estimé</CardTitle>
                <Badge variant="secondary">6 derniers mois</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dashboard.portfolioData}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(value) => `${Number(value) / 1000000}M`} />
                  <Tooltip
                    formatter={(value: number) => [`${new Intl.NumberFormat('fr-FR').format(value)} XOF`, 'Montant']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '12px' }}
                  />
                  <Bar dataKey="montant" radius={[4, 4, 0, 0]}>
                    {dashboard.portfolioData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Projets par statut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboard.statusData.map(row => (
                <div key={row.name} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium">{row.name}</span>
                      <span className="text-xs font-bold">{row.value}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(row.value / maxStatus) * 100}%`, backgroundColor: row.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Activité récente</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setAdminTab('reports')}>Tout voir</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {dashboard.recentActivity.length === 0 ? (
                <p className="px-6 py-8 text-sm text-muted-foreground">Aucune activité réelle enregistrée pour le moment.</p>
              ) : (
                <div className="divide-y divide-border">
                  {dashboard.recentActivity.map(activity => (
                    <div key={activity.id} className="flex items-start gap-3 px-6 py-3 hover:bg-muted/50 transition-colors">
                      <div className="mt-0.5 size-2 shrink-0 rounded-full bg-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-tight">{activity.text}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-auto flex-col gap-1 py-3" onClick={() => setAdminTab('requests')}>
                <ClipboardList className="size-5" />
                <span className="text-xs">Demandes</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-1 py-3" onClick={() => setAdminTab('catalog')}>
                <PackagePlus className="size-5" />
                <span className="text-xs">Catalogue</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-1 py-3" onClick={() => setAdminTab('clients')}>
                <Users className="size-5" />
                <span className="text-xs">Clients</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-1 py-3" onClick={() => setAdminTab('projects')}>
                <BarChart3 className="size-5" />
                <span className="text-xs">Projets</span>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Par catégorie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {dashboard.categoryData.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">Aucune catégorie encore alimentée.</p>
              ) : dashboard.categoryData.map(category => (
                <div key={category.name} className="flex items-center gap-3">
                  <span className="w-24 truncate text-xs text-muted-foreground">{category.name}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-foreground" style={{ width: `${(category.value / maxCategory) * 100}%` }} />
                  </div>
                  <span className="w-6 text-right text-xs font-medium">{category.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
