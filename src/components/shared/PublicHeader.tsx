'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Menu, X, Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { unreadNotificationsForRole } from '@/lib/notification-audience';
import { useAppStore } from '@/stores/app-store';
import { BrandLogo } from './BrandLogo';

type HeaderPlatform = 'public' | 'client' | 'admin';

export function PublicHeader({ platform = 'public' }: { platform?: HeaderPlatform }) {
  const { currentView, isAuthenticated, isAdmin, user, navigate, notifications, requireAuth, goBack } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const isClientAccount = isAuthenticated && !isAdmin;
  const unreadCount = unreadNotificationsForRole(notifications, false).length;
  const showBack = !['home', 'explore', 'admin'].includes(currentView);

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border safe-top">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-4">
        {/* Left */}
        <div className="flex items-center gap-3">
          {showBack && (
            <button onClick={goBack} className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          )}
          <button onClick={() => navigate('home')} className="flex items-center gap-2">
            <BrandLogo size="xs" nameClassName="hidden sm:block" />
          </button>
        </div>

        {/* Center - Search (desktop) */}
        <div className="hidden md:flex flex-1 max-w-sm mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un modèle, un projet..."
              className="pl-9 h-9 bg-muted border-0"
              onFocus={() => navigate('search')}
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {isClientAccount && (
                <Button
                  size="sm"
                  className="hidden gap-2 text-xs md:inline-flex"
                  onClick={() => navigate('dashboard')}
                >
                  <LayoutDashboard className="size-3.5" />
                  Espace client
                </Button>
              )}
              {isClientAccount && (
                <button onClick={() => navigate('notifications')} className="relative p-2 hover:bg-muted rounded-lg">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-foreground text-background text-[9px] rounded-full flex items-center justify-center font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={() => navigate(isClientAccount ? 'profile' : 'home')}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium hover:bg-secondary transition-colors"
              >
                {user?.name?.charAt(0) || 'U'}
              </button>
            </>
          ) : (
            <Button size="sm" variant="outline" className="text-xs" onClick={() => requireAuth()}>
              Connexion
            </Button>
          )}
          <button className="md:hidden p-2 hover:bg-muted rounded-lg" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-border overflow-hidden"
          >
            <div className="p-4 space-y-1">
              <button onClick={() => { navigate('home'); setMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted text-sm">Accueil</button>
              <button onClick={() => { navigate('explore'); setMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted text-sm">Explorer</button>
              <button onClick={() => { navigate('realizations'); setMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted text-sm">Réalisations</button>
              <button onClick={() => { navigate('services'); setMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted text-sm">Services</button>
              {isClientAccount || platform === 'client' ? (
                <button
                  onClick={() => {
                    if (isAuthenticated) {
                      navigate('dashboard');
                    } else {
                      requireAuth('dashboard');
                    }
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted text-sm font-medium"
                >
                  Espace client
                </button>
              ) : null}
              {!isAuthenticated && (
                <button onClick={() => { requireAuth(); setMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted text-sm font-medium">Se connecter</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
