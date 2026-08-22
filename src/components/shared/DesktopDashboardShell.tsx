'use client';

import {
  Bell,
  ChevronRight,
  ClipboardList,
  FolderKanban,
  Home,
  LockKeyhole,
  MapPin,
  Search,
  Settings,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/stores/app-store';
import { BrandLogo } from './BrandLogo';
import type { ViewName } from '@/types';

type NavItem = {
  id: ViewName;
  label: string;
  icon: typeof Home;
  private?: boolean;
  admin?: boolean;
};

const DASHBOARD_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Accueil', icon: Home, private: true },
  { id: 'explore', label: 'Explorer', icon: Search },
  { id: 'projects', label: 'Projets', icon: FolderKanban, private: true },
  { id: 'profile', label: 'Profil', icon: User, private: true },
];

const ADMIN_NAV: NavItem = { id: 'admin', label: 'Administration', icon: Settings, private: true, admin: true };

function getActiveId(view: ViewName): ViewName {
  if (['model-detail', 'search'].includes(view)) return 'explore';
  if (['configurator'].includes(view)) return 'create';
  if (['project-detail', 'project-messages', 'favorites'].includes(view)) return 'projects';
  if (['notifications', 'messages'].includes(view)) return 'profile';
  return view;
}

export function ClientDashboardHome() {
  const { navigate, isAuthenticated, requireAuth, user } = useAppStore();

  const goPrivate = (view: ViewName) => {
    if (!isAuthenticated) {
      requireAuth(view);
      return;
    }
    navigate(view);
  };

  const quickTabs: Array<NavItem & { description: string }> = [
    { id: 'home', label: 'Accueil public', icon: Home, description: 'Revenir à la page d’accueil du site.' },
    { id: 'explore', label: 'Explorer', icon: Search, description: 'Voir les modèles, réalisations et idées de projet.' },
    { id: 'projects', label: 'Projets', icon: FolderKanban, private: true, description: 'Suivre vos demandes et dossiers transmis.' },
    { id: 'profile', label: 'Profil', icon: User, private: true, description: 'Gérer vos informations de contact.' },
  ];

  const projectShortcuts = [
    'Maison basse',
    'Immeuble R+',
    'VRD',
    'Lot de travaux',
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-xl border bg-card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-muted-foreground">
              {isAuthenticated ? `Bonjour ${user?.name || 'client'}` : 'Espace client'}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Un espace simple pour lancer, retrouver et suivre vos projets.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Choisissez un ouvrage, ajoutez les surfaces, les lots et les documents disponibles, puis retrouvez le dossier dans vos projets.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="h-11 justify-between rounded-lg" onClick={() => navigate('create')}>
              Nouveau dossier
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="outline" className="h-11 justify-between rounded-lg" onClick={() => goPrivate('projects')}>
              Mes projets
              <LockKeyhole className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {quickTabs.map(item => {
          const Icon = item.icon;
          const locked = item.private && !isAuthenticated;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => (item.private ? goPrivate(item.id) : navigate(item.id))}
              className="rounded-xl border bg-card p-4 text-left transition-colors hover:border-foreground/30 hover:bg-muted/30"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-5" />
              </span>
              <span className="mt-4 flex items-center gap-2 text-sm font-semibold">
                {item.label}
                {locked && <LockKeyhole className="size-3.5 text-muted-foreground" />}
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.description}</span>
            </button>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm font-semibold">Démarrer rapidement</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {projectShortcuts.map(label => (
              <button
                key={label}
                type="button"
                onClick={() => navigate('create')}
                className="min-h-[72px] rounded-lg border bg-background px-3 py-2 text-left text-sm font-medium leading-tight transition-colors hover:border-foreground/30 hover:bg-muted/30"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Villes et pays</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Côte d’Ivoire par défaut, avec saisie possible pour les autres pays et villes.
              </p>
            </div>
            <MapPin className="size-5 shrink-0 text-muted-foreground" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {['Abidjan', 'Bouaké', 'Yamoussoukro', 'San-Pédro', 'Korhogo', 'Daloa'].map(city => (
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
              <BrandLogo size="lg" subtitle="Console de projet" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Navigation</p>
            <div className="space-y-1">{DASHBOARD_NAV.map(renderNavItem)}</div>
            <Button className="mt-5 h-11 w-full justify-between rounded-lg" onClick={() => navigate('create')}>
              Nouveau dossier
              <ClipboardList className="size-4" />
            </Button>
            {isAdmin && (
              <div className="mt-4 border-t pt-4">
                {renderNavItem(ADMIN_NAV)}
              </div>
            )}
          </nav>

          <div className="border-t p-4">
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs font-semibold">Compte</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Email recommandé. Téléphone accepté avec indicatif pays et mot de passe.
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
                  Multi-pays
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
            {currentView === 'dashboard' ? <ClientDashboardHome /> : children}
          </main>
        </div>
      </div>
    </div>
  );
}
