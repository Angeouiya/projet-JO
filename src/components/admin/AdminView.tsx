'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Bell,
  BellRing,
  BriefcaseBusiness,
  CalendarDays,
  Calculator,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Download,
  FileSignature,
  FolderArchive,
  FolderKanban,
  HardHat,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  MessageSquare,
  Package,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  User,
  Users,
  UsersRound,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/stores/app-store';
import { AdminCatalog } from './AdminCatalog';
import { AdminClients } from './AdminClients';
import { AdminDashboard } from './AdminDashboard';
import { AdminOperationsView } from './AdminOperationsView';
import { AdminProjectDetail } from './AdminProjectDetail';
import { AdminProjects } from './AdminProjects';
import { AdminRequests } from './AdminRequests';
import { AdminSettings } from './AdminSettings';
import { BrandLogo, BrandMark } from '@/components/shared/BrandLogo';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';

type AdminNavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

type AdminNavGroup = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

type GlobalResult = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  tab?: string;
  projectId?: string;
};

const NAV_GROUPS: AdminNavGroup[] = [
  {
    id: 'overview',
    label: 'Pilotage',
    items: [
      { id: 'dashboard', label: 'Vue d’ensemble', icon: LayoutDashboard },
      { id: 'requests', label: 'Demandes', icon: ClipboardList },
      { id: 'projects', label: 'Projets', icon: FolderKanban },
      { id: 'clients', label: 'Clients', icon: Users },
      { id: 'prospects', label: 'Prospects', icon: BriefcaseBusiness },
    ],
  },
  {
    id: 'production',
    label: 'Production',
    items: [
      { id: 'catalog', label: 'Catalogue', icon: Package },
      { id: 'forms', label: 'Formulaires', icon: ClipboardList },
      { id: 'studies', label: 'Études', icon: ClipboardCheck },
      { id: 'estimates', label: 'Estimations', icon: Calculator },
      { id: 'quotes', label: 'Devis', icon: Receipt },
      { id: 'contracts', label: 'Contrats', icon: FileSignature },
      { id: 'documents', label: 'Documents', icon: FolderArchive },
    ],
  },
  {
    id: 'field',
    label: 'Terrain',
    items: [
      { id: 'appointments', label: 'Rendez-vous', icon: CalendarDays },
      { id: 'visits', label: 'Visites', icon: MapPinned },
      { id: 'sites', label: 'Chantiers', icon: HardHat },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      { id: 'reports', label: 'Rapports', icon: BarChart3 },
      { id: 'invoices', label: 'Factures', icon: Receipt },
      { id: 'payments', label: 'Paiements', icon: CreditCard },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    items: [
      { id: 'messages', label: 'Messages', icon: MessageSquare },
      { id: 'notifications', label: 'Notifications', icon: BellRing },
    ],
  },
  {
    id: 'security',
    label: 'Organisation',
    items: [
      { id: 'teams', label: 'Équipe', icon: UsersRound },
      { id: 'roles', label: 'Rôles et permissions', icon: ShieldCheck },
      { id: 'statistics', label: 'Statistiques', icon: BarChart3 },
      { id: 'audit', label: 'Journal d’activité', icon: ClipboardList },
      { id: 'settings', label: 'Paramètres', icon: Settings },
    ],
  },
];

const ADMIN_VIEW_TO_TAB: Record<string, string> = {
  'admin-requests': 'requests',
  'admin-projects': 'projects',
  'admin-clients': 'clients',
  'admin-catalog': 'catalog',
  'admin-teams': 'teams',
  'admin-settings': 'settings',
  'admin-notifications': 'notifications',
};

function navBadge(itemId: string, workflowRequests: number, projectCount: number, unreadCount: number, missingInfoCount: number, quoteCount: number) {
  if (itemId === 'requests') return Math.max(workflowRequests, 12);
  if (itemId === 'projects') return projectCount || undefined;
  if (itemId === 'notifications') return unreadCount || undefined;
  if (itemId === 'messages') return missingInfoCount || undefined;
  if (itemId === 'quotes') return quoteCount || undefined;
  return undefined;
}

function useAdminNavState() {
  return useState<Record<string, boolean>>(() => ({
    overview: true,
    production: true,
    field: true,
    finance: true,
    communication: true,
    security: true,
  }));
}

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
    logout,
  } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useAdminNavState();
  const [adminSearch, setAdminSearch] = useState('');
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const workflowRequests = userProjects.filter(project => ['submitted', 'info_required'].includes(project.status)).length;
  const missingInfoCount = userProjects.filter(project => project.missingInfo).length;
  const quoteCount = userProjects.reduce((total, project) => total + (project.quotes?.length ?? 0), 0);
  const confirmLogout = () => {
    setSidebarOpen(false);
    logout();
  };

  useEffect(() => {
    const tabFromView = ADMIN_VIEW_TO_TAB[currentView];
    if (tabFromView && tabFromView !== adminTab) setAdminTab(tabFromView);
  }, [adminTab, currentView, setAdminTab]);

  const navGroups = useMemo(() => NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.map(item => ({
      ...item,
      badge: navBadge(item.id, workflowRequests, userProjects.length, unreadCount, missingInfoCount, quoteCount),
    })),
  })), [missingInfoCount, quoteCount, unreadCount, userProjects.length, workflowRequests]);

  const allItems = useMemo(
    () => navGroups.flatMap(group => group.items.map(item => ({ ...item, group: group.label }))),
    [navGroups]
  );
  const activeItem = allItems.find(item => item.id === adminTab) ?? allItems[0];
  const sidebarWidth = adminSidebarCollapsed ? 'lg:w-20' : 'lg:w-72';
  const contentPadding = adminSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72';

  const globalResults = useMemo(() => {
    const query = adminSearch.trim().toLowerCase();
    if (query.length < 2) return [];

    const projectResults: GlobalResult[] = userProjects
      .filter(project => [
        project.referenceNumber,
        project.title,
        project.clientName,
        project.city,
        project.categoryName,
      ].some(value => value?.toLowerCase().includes(query)))
      .map(project => ({
        id: `project-${project.id}`,
        type: 'Projet',
        title: project.title || project.referenceNumber,
        subtitle: `${project.referenceNumber} · ${project.clientName || 'Client'} · ${project.city || 'Ville à préciser'}`,
        projectId: project.id,
      }));

    const quoteResults: GlobalResult[] = userProjects.flatMap(project => (project.quotes ?? [])
      .filter(quote => [quote.label, project.referenceNumber, project.clientName].some(value => value?.toLowerCase().includes(query)))
      .map(quote => ({
        id: `quote-${quote.id}`,
        type: 'Devis',
        title: quote.label,
        subtitle: `${project.referenceNumber} · ${project.clientName || 'Client'}`,
        projectId: project.id,
      })));

    const documentResults: GlobalResult[] = userProjects.flatMap(project => (project.documents ?? [])
      .filter(document => [document.name, document.type, project.referenceNumber].some(value => value?.toLowerCase().includes(query)))
      .map(document => ({
        id: `document-${document.id}`,
        type: 'Document',
        title: document.name,
        subtitle: `${project.referenceNumber} · ${document.type}`,
        projectId: project.id,
      })));

    const notificationResults: GlobalResult[] = notifications
      .filter(notification => [notification.title, notification.message, notification.projectId].some(value => value?.toLowerCase().includes(query)))
      .map(notification => ({
        id: `notification-${notification.id}`,
        type: 'Notification',
        title: notification.title,
        subtitle: notification.message,
        projectId: notification.projectId,
        tab: 'notifications',
      }));

    const navResults: GlobalResult[] = allItems
      .filter(item => item.label.toLowerCase().includes(query) || item.group.toLowerCase().includes(query))
      .map(item => ({
        id: `nav-${item.id}`,
        type: 'Module',
        title: item.label,
        subtitle: `Administration · ${item.group}`,
        tab: item.id,
      }));

    return [...projectResults, ...quoteResults, ...documentResults, ...notificationResults, ...navResults].slice(0, 8);
  }, [adminSearch, allItems, notifications, userProjects]);

  const openAdminTab = (tab: string) => {
    setAdminTab(tab);
    if (currentView !== 'admin') navigate('admin');
  };

  const openProject = (projectId: string) => {
    navigate('admin-project-detail', { id: projectId });
  };

  const openResult = (result: GlobalResult) => {
    setAdminSearch('');
    if (result.projectId) {
      openProject(result.projectId);
      return;
    }
    if (result.tab) openAdminTab(result.tab);
  };

  const toggleGroup = (groupId: string) => {
    setOpenGroups(current => ({ ...current, [groupId]: !current[groupId] }));
  };

  const renderContent = () => {
    if (currentView === 'admin-project-detail') return <AdminProjectDetail />;

    switch (adminTab) {
      case 'dashboard': return <AdminDashboard />;
      case 'requests': return <AdminRequests />;
      case 'projects': return <AdminProjects />;
      case 'clients': return <AdminClients />;
      case 'catalog': return <AdminCatalog />;
      case 'settings': return <AdminSettings />;
      default:
        return (
          <AdminOperationsView
            tab={adminTab}
            searchQuery={adminSearch}
            projects={userProjects}
            notifications={notifications}
            onOpenProject={openProject}
          />
        );
    }
  };

  const renderNavButton = (item: AdminNavItem, mobile = false) => {
    const Icon = item.icon;
    const active = adminTab === item.id && currentView !== 'admin-project-detail';

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          openAdminTab(item.id);
          if (mobile) setSidebarOpen(false);
        }}
        title={item.label}
        className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
          adminSidebarCollapsed ? 'justify-center' : ''
        } ${
          active
            ? 'bg-foreground font-medium text-background'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
      >
        <Icon className="size-5 shrink-0" />
        {!adminSidebarCollapsed && <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>}
        {item.badge !== undefined && (
          adminSidebarCollapsed ? (
            <span className="absolute right-2 top-2 size-2 rounded-full bg-foreground" />
          ) : (
            <span className={`rounded-full px-1.5 py-0.5 text-xs ${
              active ? 'bg-background/20' : 'bg-muted'
            }`}>{item.badge}</span>
          )
        )}
      </button>
    );
  };

  const renderNavGroups = (mobile = false) => (
    <nav className={`space-y-3 overflow-y-auto ${mobile ? 'p-3' : 'flex-1 px-3 py-4 scrollbar-thin'}`}>
      {navGroups.map(group => (
        <div key={group.id} className="space-y-1">
          {!adminSidebarCollapsed || mobile ? (
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground hover:bg-muted"
            >
              {group.label}
              <ChevronDown className={`size-3.5 transition-transform ${openGroups[group.id] ? '' : '-rotate-90'}`} />
            </button>
          ) : (
            <div className="mx-auto my-2 h-px w-8 bg-border" />
          )}
          {(adminSidebarCollapsed && !mobile) || openGroups[group.id] ? (
            <div className="space-y-1">{group.items.map(item => renderNavButton(item, mobile))}</div>
          ) : null}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex h-screen bg-background">
      <aside className={`hidden ${sidebarWidth} lg:fixed lg:inset-y-0 lg:flex lg:flex-col border-r border-border bg-card transition-[width] duration-300`}>
        <div className={`flex items-center gap-3 border-b border-border py-5 ${adminSidebarCollapsed ? 'justify-center px-3' : 'px-5'}`}>
          {adminSidebarCollapsed ? <BrandMark size="md" /> : <BrandLogo size="md" subtitle="Administration" className="min-w-0 flex-1" />}
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

        {renderNavGroups()}

        <div className="border-t border-border p-4">
          <button
            type="button"
            onClick={() => navigate('profile')}
            title={user?.name || 'Admin'}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted ${
              adminSidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="flex size-8 items-center justify-center rounded-full bg-muted">
              <User className="size-4" />
            </div>
            {!adminSidebarCollapsed && (
              <>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-medium">{user?.name || 'Admin'}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.role || 'admin'}</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </>
            )}
          </button>
        </div>
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Fermer le menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={false}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 top-0 z-50 flex w-72 flex-col bg-card shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-3">
                  <BrandLogo size="sm" subtitle="Admin" />
                </div>
                <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 hover:bg-muted">
                  <X className="size-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {renderNavGroups(true)}
              </div>
              <div className="border-t border-border p-4">
                <ConfirmActionDialog
                  title="Se déconnecter de l’administration ?"
                  description="Vous allez quitter l’espace admin Buildify sur cet appareil. Les actions en cours non enregistrées peuvent être perdues."
                  confirmLabel="Se déconnecter"
                  onConfirm={confirmLogout}
                  trigger={(
                    <Button variant="ghost" className="w-full justify-start gap-3">
                      <LogOut className="size-4" />
                      Déconnexion
                    </Button>
                  )}
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className={`flex min-h-0 flex-1 flex-col ${contentPadding} transition-[padding] duration-300`}>
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 hover:bg-muted lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu className="size-5" />
            </button>

            <div className="hidden min-w-[180px] lg:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Administration / {activeItem.group}
              </p>
              <h1 className="truncate text-base font-bold">{currentView === 'admin-project-detail' ? 'Dossier' : activeItem.label}</h1>
            </div>

            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={adminSearch}
                onChange={event => setAdminSearch(event.target.value)}
                placeholder="Client, projet, devis, facture, document..."
                className="h-11 border-0 bg-muted pl-9"
              />
              {globalResults.length > 0 && (
                <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border bg-card shadow-lg">
                  {globalResults.map(result => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => openResult(result)}
                      className="flex w-full items-start gap-3 border-b px-4 py-3 text-left last:border-b-0 hover:bg-muted/70"
                    >
                      <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px]">{result.type}</Badge>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{result.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{result.subtitle}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button variant="outline" className="hidden h-11 gap-2 xl:inline-flex" onClick={() => openAdminTab('reports')}>
              <Download className="size-4" />
              Rapports
            </Button>
            <Button className="hidden h-11 gap-2 xl:inline-flex" onClick={() => navigate('create')}>
              <ClipboardList className="size-4" />
              Nouveau dossier
            </Button>
            <button type="button" onClick={() => openAdminTab('messages')} className="relative rounded-lg p-2 hover:bg-muted" aria-label="Messages">
              <MessageSquare className="size-5" />
              {missingInfoCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-foreground text-[10px] text-background">{missingInfoCount}</span>}
            </button>
            <button type="button" onClick={() => openAdminTab('notifications')} className="relative rounded-lg p-2 hover:bg-muted" aria-label="Notifications">
              <Bell className="size-5" />
              {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-foreground text-[10px] text-background">{unreadCount}</span>}
            </button>
            <button type="button" onClick={() => navigate('profile')} className="hidden rounded-lg p-2 hover:bg-muted sm:inline-flex" aria-label="Profil">
              <User className="size-5" />
            </button>
            <ConfirmActionDialog
              title="Se déconnecter de l’administration ?"
              description="Vous allez quitter l’espace admin Buildify sur cet appareil. Confirmez seulement si vous avez terminé vos actions en cours."
              confirmLabel="Se déconnecter"
              onConfirm={confirmLogout}
              trigger={(
                <button type="button" className="hidden rounded-lg p-2 hover:bg-muted sm:inline-flex" aria-label="Déconnexion">
                  <LogOut className="size-5" />
                </button>
              )}
            />
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-thin lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentView}-${adminTab}`}
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
