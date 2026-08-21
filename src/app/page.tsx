'use client';

import { useEffect, useState } from 'react';
import { LockKeyhole, ShieldAlert } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { HomeView } from '@/components/public/HomeView';
import { ExploreView } from '@/components/public/ExploreView';
import { ModelDetailView } from '@/components/public/ModelDetailView';
import { ConfiguratorView } from '@/components/public/ConfiguratorView';
import { RealizationsView } from '@/components/public/RealizationsView';
import { ServicesView } from '@/components/public/ServicesView';
import { ProjectsView } from '@/components/client/ProjectsView';
import { ProjectDetailView } from '@/components/client/ProjectDetailView';
import { ProfileView } from '@/components/client/ProfileView';
import { FavoritesView } from '@/components/client/FavoritesView';
import { NotificationsView } from '@/components/client/NotificationsView';
import { AdminView } from '@/components/admin/AdminView';
import { BottomNav } from '@/components/shared/BottomNav';
import { DesktopDashboardShell } from '@/components/shared/DesktopDashboardShell';
import { PublicHeader } from '@/components/shared/PublicHeader';
import { AuthModal } from '@/components/shared/AuthModal';
import { ToastContainer } from '@/components/shared/ToastContainer';
import { InstallPrompt } from '@/components/shared/InstallPrompt';
import { PwaBootstrap } from '@/components/shared/PwaBootstrap';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { ViewName } from '@/types';

function ViewRenderer({ view }: { view: ViewName }) {
  const views: Record<string, React.ReactNode> = {
    home: <HomeView />,
    explore: <ExploreView />,
    create: <ConfiguratorView />,
    'model-detail': <ModelDetailView />,
    configurator: <ConfiguratorView />,
    realizations: <RealizationsView />,
    services: <ServicesView />,
    projects: <ProjectsView />,
    'project-detail': <ProjectDetailView />,
    'project-messages': <ProjectDetailView />,
    profile: <ProfileView />,
    favorites: <FavoritesView />,
    notifications: <NotificationsView />,
    messages: <NotificationsView />,
    search: <ExploreView />,
    admin: <AdminView />,
  };

  return views[view] || <HomeView />;
}

const ADMIN_VIEWS: ViewName[] = ['admin', 'admin-projects', 'admin-project-detail', 'admin-clients', 'admin-catalog', 'admin-requests', 'admin-teams', 'admin-settings', 'admin-notifications'];
const PRIVATE_VIEWS: ViewName[] = ['projects', 'project-detail', 'project-messages', 'profile', 'favorites', 'notifications', 'messages'];
const FULLSCREEN_VIEWS: ViewName[] = ['create', 'configurator'];

function useDesktopViewport() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return isDesktop;
}

function LockedAccessView({ view, adminOnly = false }: { view: ViewName; adminOnly?: boolean }) {
  const { isAuthenticated, requireAuth, navigate } = useAppStore();
  const Icon = adminOnly ? ShieldAlert : LockKeyhole;
  const title = adminOnly ? 'Accès administrateur verrouillé' : 'Espace privé verrouillé';
  const description = adminOnly
    ? "Cette zone est réservée aux comptes habilités. Aucun contenu d'administration n'est chargé sans autorisation."
    : "Connectez-vous pour accéder aux données privées : profil, projets, messages, favoris et notifications.";

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg border-dashed">
        <CardContent className="p-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-muted">
            <Icon className="size-7" />
          </div>
          <h1 className="mt-5 text-xl font-bold">{title}</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            {!isAuthenticated && (
              <Button className="h-11 rounded-lg" onClick={() => requireAuth(view)}>
                Se connecter
              </Button>
            )}
            <Button variant="outline" className="h-11 rounded-lg" onClick={() => navigate('home')}>
              Retour au tableau de bord
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GuardedViewRenderer({ view }: { view: ViewName }) {
  const { isAuthenticated, isAdmin } = useAppStore();

  if (ADMIN_VIEWS.includes(view) && !isAdmin) {
    return <LockedAccessView view={view} adminOnly />;
  }

  if (PRIVATE_VIEWS.includes(view) && !isAuthenticated) {
    return <LockedAccessView view={view} />;
  }

  return <ViewRenderer view={view} />;
}

export default function Page() {
  const { currentView } = useAppStore();
  const isDesktop = useDesktopViewport();
  const isFullscreen = FULLSCREEN_VIEWS.includes(currentView);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {isFullscreen ? (
        <main className="flex-1">
          <GuardedViewRenderer view={currentView} />
        </main>
      ) : isDesktop ? (
        <DesktopDashboardShell currentView={currentView}>
          <GuardedViewRenderer view={currentView} />
        </DesktopDashboardShell>
      ) : (
        <>
          <PublicHeader />

          <main className="flex-1 pb-20">
            <div key={currentView}>
              <GuardedViewRenderer view={currentView} />
            </div>
          </main>

          <BottomNav />
        </>
      )}
      <AuthModal />
      <ToastContainer />
      <InstallPrompt />
      <PwaBootstrap />
    </div>
  );
}
