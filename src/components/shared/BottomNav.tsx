'use client';

import { motion } from 'framer-motion';
import {
  Home, Search, FolderKanban, User
} from 'lucide-react';
import { unreadNotificationsForRole } from '@/lib/notification-audience';
import { useAppStore } from '@/stores/app-store';
import type { ViewName } from '@/types';
import { ConfirmActionDialog } from './ConfirmActionDialog';

const NAV_ITEMS: { id: ViewName; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Accueil', icon: Home },
  { id: 'explore', label: 'Explorer', icon: Search },
  { id: 'projects', label: 'Projets', icon: FolderKanban },
  { id: 'profile', label: 'Profil', icon: User },
];

const PRIVATE_NAV_ITEMS: ViewName[] = ['projects', 'profile'];
const FORM_VIEWS: ViewName[] = ['create', 'configurator'];

export function BottomNav() {
  const { currentView, navigate, isAuthenticated, notifications, requireAuth, showAuthModal } = useAppStore();
  const unreadCount = unreadNotificationsForRole(notifications, false).length;
  const isFormView = FORM_VIEWS.includes(currentView);

  if (showAuthModal) return null;

  const resolveTarget = (id: ViewName): ViewName => {
    if (id === 'home' && isAuthenticated) return 'dashboard';
    return id;
  };

  const handleNav = (id: ViewName) => {
    const target = resolveTarget(id);
    if (PRIVATE_NAV_ITEMS.includes(id) && !isAuthenticated) {
      requireAuth(target);
      return;
    }
    navigate(target);
  };

  const getActiveId = () => {
    if (['dashboard', 'home'].includes(currentView)) return 'home';
    if (['model-detail', 'realizations', 'services', 'search'].includes(currentView)) return 'explore';
    if (['project-detail', 'project-messages', 'favorites'].includes(currentView)) return 'projects';
    if (['notifications', 'messages'].includes(currentView)) return 'profile';
    if (NAV_ITEMS.some(n => n.id === currentView)) return currentView;
    return null;
  };

  const activeId = getActiveId();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur safe-bottom lg:hidden">
      <div className="mx-auto grid h-16 max-w-lg grid-cols-4 items-center px-2">
        {NAV_ITEMS.map(item => {
          const isActive = activeId === item.id;
          const Icon = item.icon;
          const trigger = (
            <button
              key={item.id}
              type="button"
              onClick={() => (!isFormView ? handleNav(item.id) : undefined)}
              className="relative flex h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1"
            >
              <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground'}`} />
              <span className={`max-w-full truncate text-[10px] transition-colors ${isActive ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 h-0.5 w-8 rounded-full bg-foreground"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              {item.id === 'profile' && unreadCount > 0 && (
                <span className="absolute right-3 top-1 size-2 rounded-full bg-foreground" />
              )}
            </button>
          );

          if (!isFormView) return trigger;

          return (
            <ConfirmActionDialog
              key={item.id}
              title="Quitter le formulaire ?"
              description="Vous allez changer d’espace. Les informations non soumises dans ce formulaire ne seront pas transmises à l’équipe Buildify."
              confirmLabel={`Ouvrir ${item.label}`}
              onConfirm={() => handleNav(item.id)}
              trigger={trigger}
            />
          );
        })}
      </div>
    </nav>
  );
}
