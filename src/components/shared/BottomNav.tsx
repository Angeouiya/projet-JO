'use client';

import { motion } from 'framer-motion';
import {
  Home, Search, PlusCircle, FolderKanban, User, Plus
} from 'lucide-react';
import { unreadNotificationsForRole } from '@/lib/notification-audience';
import { useAppStore } from '@/stores/app-store';
import type { ViewName } from '@/types';

const NAV_ITEMS: { id: ViewName; label: string; icon: typeof Home; isCenter?: boolean }[] = [
  { id: 'home', label: 'Accueil', icon: Home },
  { id: 'explore', label: 'Explorer', icon: Search },
  { id: 'create', label: 'Créer', icon: PlusCircle, isCenter: true },
  { id: 'projects', label: 'Projets', icon: FolderKanban },
  { id: 'profile', label: 'Profil', icon: User },
];

const PRIVATE_NAV_ITEMS: ViewName[] = ['projects', 'profile'];

export function BottomNav() {
  const { currentView, navigate, isAuthenticated, notifications, requireAuth } = useAppStore();
  const unreadCount = unreadNotificationsForRole(notifications, false).length;

  const handleNav = (id: ViewName) => {
    if (PRIVATE_NAV_ITEMS.includes(id) && !isAuthenticated) {
      requireAuth(id);
      return;
    }
    navigate(id);
  };

  const getActiveId = () => {
    if (['model-detail', 'realizations', 'services', 'search'].includes(currentView)) return 'explore';
    if (['configurator'].includes(currentView)) return 'create';
    if (['project-detail', 'project-messages', 'favorites'].includes(currentView)) return 'projects';
    if (['notifications', 'messages'].includes(currentView)) return 'profile';
    if (NAV_ITEMS.some(n => n.id === currentView)) return currentView;
    return null;
  };

  const activeId = getActiveId();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-border safe-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(item => {
          const isActive = activeId === item.id;
          const Icon = item.icon;
          if (item.isCenter) {
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className="relative -mt-5"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${isActive ? 'bg-foreground text-background scale-105' : 'bg-foreground text-background'}`}>
                  <Plus className="w-6 h-6" />
                </div>
              </button>
            );
          }
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className="flex flex-col items-center gap-0.5 py-1 px-3 relative"
            >
              <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground'}`} />
              <span className={`text-[10px] transition-colors ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-0 w-8 h-0.5 bg-foreground rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              {item.id === 'profile' && unreadCount > 0 && (
                <span className="absolute top-0 right-1 w-2 h-2 bg-foreground rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
