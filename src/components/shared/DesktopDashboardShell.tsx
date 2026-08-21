'use client';

import {
  BarChart3,
  Bell,
  Building2,
  ChevronRight,
  ClipboardList,
  FileText,
  FolderKanban,
  Home,
  LayoutDashboard,
  LockKeyhole,
  MapPin,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/stores/app-store';
import type { ViewName } from '@/types';

type NavItem = {
  id: ViewName;
  label: string;
  icon: typeof Home;
  private?: boolean;
  admin?: boolean;
};

const PRIMARY_NAV: NavItem[] = [
  { id: 'home', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'explore', label: 'Catalogue', icon: Building2 },
  { id: 'create', label: 'Nouveau dossier', icon: ClipboardList },
  { id: 'realizations', label: 'Réalisations', icon: BarChart3 },
  { id: 'services', label: 'Services & lots', icon: FileText },
];

const PRIVATE_NAV: NavItem[] = [
  { id: 'projects', label: 'Mes projets', icon: FolderKanban, private: true },
  { id: 'messages', label: 'Messages', icon: MessageSquare, private: true },
  { id: 'notifications', label: 'Notifications', icon: Bell, private: true },
  { id: 'profile', label: 'Profil client', icon: User, private: true },
  { id: 'admin', label: 'Administration', icon: Settings, private: true, admin: true },
];

const DESKTOP_STATS = [
  { label: 'Catégories cadrées', value: '10', hint: 'Maison, R+, VRD, lots' },
  { label: 'Villes disponibles', value: '100+', hint: 'Côte d’Ivoire' },
  { label: 'Lots techniques', value: '30+', hint: 'Gros œuvre, finition, réseaux' },
  { label: 'Délai de retour', value: '48h', hint: 'Première analyse' },
];

const PIPELINE = [
  { label: 'Besoin cadré', value: 100 },
  { label: 'Étude technique', value: 74 },
  { label: 'Métré & devis', value: 46 },
  { label: 'Planification', value: 28 },
];

function getActiveId(view: ViewName): ViewName {
  if (['model-detail', 'search'].includes(view)) return 'explore';
  if (['configurator'].includes(view)) return 'create';
  if (['project-detail', 'project-messages', 'favorites'].includes(view)) return 'projects';
  return view;
}

function DashboardHome() {
  const { navigate, isAuthenticated, requireAuth } = useAppStore();

  const goPrivate = (view: ViewName) => {
    if (!isAuthenticated) {
      requireAuth(view);
      return;
    }
    navigate(view);
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="grid min-h-[330px] lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="flex flex-col justify-between p-6">
              <div>
                <Badge variant="outline" className="mb-4 gap-2">
                  <Sparkles className="size-3.5" />
                  Bureau de pilotage BTP
                </Badge>
                <h2 className="max-w-xl text-3xl font-bold tracking-tight">
                  Cadrage, chiffrage et suivi des projets dans une vue desktop professionnelle.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Le tableau de bord sert de poste de travail : lancement de dossier, typologie de l’ouvrage,
                  ville, accès chantier, lots techniques, documents et suivi client.
                </p>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <Button className="h-12 justify-between rounded-lg" onClick={() => navigate('create')}>
                  Ouvrir le formulaire avancé
                  <ChevronRight className="size-4" />
                </Button>
                <Button variant="outline" className="h-12 justify-between rounded-lg" onClick={() => goPrivate('projects')}>
                  Voir mes projets
                  <LockKeyhole className="size-4" />
                </Button>
              </div>
            </div>
            <div
              className="relative min-h-[260px] border-l bg-muted bg-cover bg-center"
              style={{ backgroundImage: "url('/images/chantier-1.png')" }}
              role="img"
              aria-label="Suivi de chantier BTP"
            >
              <div className="absolute inset-0 bg-black/10" />
            </div>
          </div>
        </div>

        <aside className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Pipeline technique</p>
              <p className="text-xs text-muted-foreground">Lecture rapide du dossier type</p>
            </div>
            <ShieldCheck className="size-5 text-muted-foreground" />
          </div>
          <div className="mt-5 space-y-5">
            {PIPELINE.map(item => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.value}%</span>
                </div>
                <Progress value={item.value} className="h-2" />
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {DESKTOP_STATS.map(stat => (
          <div key={stat.label} className="rounded-xl border bg-card p-5">
            <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm font-semibold">Accès rapides</p>
          <div className="mt-4 grid gap-3">
            {[
              { label: 'Immeuble R+', view: 'create' as ViewName, hint: 'Hauteur R+, programme, équipements' },
              { label: 'VRD', view: 'create' as ViewName, hint: 'Voirie, drainage, réseaux divers' },
              { label: 'Lot de travaux', view: 'create' as ViewName, hint: 'Plomberie, finition, gros œuvre' },
            ].map(item => (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.view)}
                className="flex items-center justify-between rounded-lg border p-4 text-left transition-colors hover:border-foreground/30 hover:bg-muted/40"
              >
                <span>
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{item.hint}</span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Couverture opérationnelle</p>
              <p className="text-xs text-muted-foreground">Sélection de ville intégrée au formulaire</p>
            </div>
            <MapPin className="size-5 text-muted-foreground" />
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {['Abidjan', 'Bouaké', 'Yamoussoukro', 'San-Pédro', 'Korhogo', 'Daloa', 'Bingerville', 'Soubré', 'Man'].map(city => (
              <div key={city} className="rounded-lg border bg-background px-3 py-2 text-sm font-medium">
                {city}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function DesktopDashboardShell({
  currentView,
  children,
}: {
  currentView: ViewName;
  children: React.ReactNode;
}) {
  const { isAuthenticated, isAdmin, user, navigate, requireAuth, notifications } = useAppStore();
  const activeId = getActiveId(currentView);
  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  const handleNav = (item: NavItem) => {
    if (item.admin && !isAdmin) {
      requireAuth(item.id);
      return;
    }
    if (item.private && !isAuthenticated) {
      requireAuth(item.id);
      return;
    }
    navigate(item.id);
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = activeId === item.id;
    const locked = (item.private && !isAuthenticated) || (item.admin && !isAdmin);

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => handleNav(item)}
        className={`flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors ${
          active
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
      >
        <Icon className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
        {locked && <LockKeyhole className="size-3.5 shrink-0 opacity-70" />}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <div className="grid min-h-screen grid-cols-[280px_minmax(0,1fr)]">
        <aside className="sticky top-0 flex h-screen flex-col border-r bg-card">
          <div className="border-b p-5">
            <button type="button" onClick={() => navigate('home')} className="flex items-center gap-3 text-left">
              <span className="flex size-10 items-center justify-center rounded-lg bg-foreground text-sm font-bold text-background">B</span>
              <span>
                <span className="block text-sm font-bold">BÂTI·CI</span>
                <span className="block text-xs text-muted-foreground">Console de projet</span>
              </span>
            </button>
          </div>

          <nav className="flex-1 space-y-6 overflow-y-auto p-4">
            <div>
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Pilotage</p>
              <div className="space-y-1">{PRIMARY_NAV.map(renderNavItem)}</div>
            </div>
            <div>
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Espace privé</p>
              <div className="space-y-1">{PRIVATE_NAV.map(renderNavItem)}</div>
            </div>
          </nav>

          <div className="border-t p-4">
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs font-semibold">Sécurité</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Les projets, messages, notifications et profils sont verrouillés sans connexion.
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
            <div className="flex h-16 items-center gap-4 px-6">
              <div className="relative w-full max-w-xl">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un modèle, un projet, une ville..."
                  className="h-10 border-0 bg-muted pl-9"
                  onFocus={() => navigate('search')}
                />
              </div>

              <div className="ml-auto flex items-center gap-3">
                <Badge variant="outline" className="h-9 gap-2 px-3">
                  <MapPin className="size-3.5" />
                  Côte d’Ivoire
                </Badge>
                {isAuthenticated ? (
                  <>
                    <button
                      type="button"
                      onClick={() => navigate('notifications')}
                      className="relative flex size-10 items-center justify-center rounded-lg border bg-card hover:bg-muted"
                      aria-label="Notifications"
                    >
                      <Bell className="size-4" />
                      {unreadCount > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-foreground" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('profile')}
                      className="flex h-10 items-center gap-2 rounded-lg border bg-card px-3 hover:bg-muted"
                    >
                      <span className="flex size-6 items-center justify-center rounded-md bg-foreground text-[10px] font-bold text-background">
                        {user?.name?.charAt(0) || 'U'}
                      </span>
                      <span className="max-w-32 truncate text-sm font-medium">{user?.name || 'Utilisateur'}</span>
                    </button>
                  </>
                ) : (
                  <Button variant="outline" className="h-10 rounded-lg" onClick={() => requireAuth()}>
                    Connexion
                  </Button>
                )}
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 overflow-y-auto p-6">
            {currentView === 'home' ? <DashboardHome /> : children}
          </main>
        </div>
      </div>
    </div>
  );
}
