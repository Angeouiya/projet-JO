'use client';

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
import { PublicHeader } from '@/components/shared/PublicHeader';
import { AuthModal } from '@/components/shared/AuthModal';
import { ToastContainer } from '@/components/shared/ToastContainer';
import { InstallPrompt } from '@/components/shared/InstallPrompt';
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
const FULLSCREEN_VIEWS: ViewName[] = ['create', 'configurator'];

export default function Page() {
  const { currentView, isAdmin } = useAppStore();
  const isAdminView = isAdmin && ADMIN_VIEWS.includes(currentView);
  const isFullscreen = FULLSCREEN_VIEWS.includes(currentView);
  const showBottomNav = !isAdminView && !isFullscreen;
  const showPublicHeader = !isAdminView && !isFullscreen;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {showPublicHeader && <PublicHeader />}

      <main className={`flex-1 ${showBottomNav ? 'pb-20' : ''} ${showPublicHeader ? '' : ''}`}>
        <div key={currentView}>
          <ViewRenderer view={currentView} />
        </div>
      </main>

      {showBottomNav && <BottomNav />}
      <AuthModal />
      <ToastContainer />
      <InstallPrompt />
    </div>
  );
}
