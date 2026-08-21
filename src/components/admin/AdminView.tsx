'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, FolderKanban, Users, Package, Settings,
  Menu, X, Search, Bell, LogOut, ChevronRight, User, ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/stores/app-store';
import { AdminDashboard } from './AdminDashboard';
import { AdminRequests } from './AdminRequests';
import { AdminProjects } from './AdminProjects';
import { AdminClients } from './AdminClients';
import { AdminCatalog } from './AdminCatalog';
import { AdminSettings } from './AdminSettings';
import { AdminProjectDetail } from './AdminProjectDetail';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'requests', label: 'Demandes', icon: FileText, badge: 12 },
  { id: 'projects', label: 'Projets', icon: FolderKanban },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'catalog', label: 'Catalogue', icon: Package },
  { id: 'settings', label: 'Paramètres', icon: Settings },
];

export function AdminView() {
  const {
    adminTab,
    setAdminTab,
    user,
    navigate,
    notifications,
    userProjects,
    currentView,
    adminSidebarCollapsed,
    toggleAdminSidebar,
  } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const sidebarWidth = adminSidebarCollapsed ? 'lg:w-20' : 'lg:w-64';
  const contentPadding = adminSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64';
  const navItems = NAV_ITEMS.map(item => (
    item.id === 'requests'
      ? { ...item, badge: Math.max(userProjects.filter(project => ['submitted', 'info_required'].includes(project.status)).length, item.badge || 0) }
      : item
  ));

  const openAdminTab = (tab: string) => {
    setAdminTab(tab);
    if (currentView !== 'admin') navigate('admin');
  };

  const renderContent = () => {
    if (currentView === 'admin-project-detail') return <AdminProjectDetail />;

    switch (adminTab) {
      case 'requests': return <AdminRequests />;
      case 'projects': return <AdminProjects />;
      case 'clients': return <AdminClients />;
      case 'catalog': return <AdminCatalog />;
      case 'settings': return <AdminSettings />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className={`hidden ${sidebarWidth} lg:flex lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-card transition-[width] duration-300`}>
        <div className={`flex items-center gap-3 border-b border-border py-5 ${adminSidebarCollapsed ? 'justify-center px-3' : 'px-6'}`}>
          <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
            <span className="text-background text-xs font-bold">B</span>
          </div>
          {!adminSidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">BÂTI·CI</p>
              <p className="text-xs text-muted-foreground">Administration</p>
            </div>
          )}
          <button
            type="button"
            onClick={toggleAdminSidebar}
            className="hidden rounded-lg p-2 hover:bg-muted lg:inline-flex"
            aria-label={adminSidebarCollapsed ? 'Ouvrir la sidebar' : 'Réduire la sidebar'}
            title={adminSidebarCollapsed ? 'Ouvrir' : 'Réduire'}
          >
            {adminSidebarCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => openAdminTab(item.id)}
              title={item.label}
              className={`relative w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                adminSidebarCollapsed ? 'justify-center' : ''
              } ${
                adminTab === item.id
                  ? 'bg-foreground text-background font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {!adminSidebarCollapsed && <span className="flex-1 text-left">{item.label}</span>}
              {item.badge && (
                adminSidebarCollapsed ? (
                  <span className="absolute right-2 top-2 size-2 rounded-full bg-foreground" />
                ) : (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    adminTab === item.id ? 'bg-background/20' : 'bg-muted'
                  }`}>{item.badge}</span>
                )
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <button
            onClick={() => navigate('profile')}
            title={user?.name || 'Admin'}
            className={`flex items-center gap-3 w-full rounded-lg px-3 py-2 hover:bg-muted transition-colors ${
              adminSidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            {!adminSidebarCollapsed && (
              <>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-muted-foreground">{user?.role}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-card z-50 lg:hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
                    <span className="text-background text-xs font-bold">B</span>
                  </div>
                  <p className="text-sm font-semibold">BÂTI·CI</p>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-muted rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="p-3 space-y-1">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { openAdminTab(item.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      adminTab === item.id
                        ? 'bg-foreground text-background font-medium'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && <Badge variant="secondary" className="text-xs">{item.badge}</Badge>}
                  </button>
                ))}
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  onClick={() => { navigate('home'); setSidebarOpen(false); }}
                >
                  <LogOut className="w-4 h-4" /> Retour au site
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex-1 ${contentPadding} flex flex-col min-h-0 transition-[padding] duration-300`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 lg:px-8 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  className="pl-9 bg-muted border-0"
                />
              </div>
            </div>
            <button
              onClick={() => navigate('notifications')}
              className="relative p-2 hover:bg-muted rounded-lg"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-foreground text-background text-[10px] rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scrollbar-thin">
          <AnimatePresence mode="wait">
            <motion.div
              key={adminTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
