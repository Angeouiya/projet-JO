'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ViewName, AppUser, FilterState, ConfiguratorState, CatalogModelData, CategoryData, ProjectData, NotificationData } from '@/types';

interface AppState {
  // Navigation
  currentView: ViewName;
  viewParams: Record<string, string>;
  previousView: ViewName | null;
  navigationStack: ViewName[];

  // Auth
  user: AppUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  showAuthModal: boolean;
  authRedirectView: ViewName | null;
  authRedirectParams: Record<string, string>;

  // UI State
  isMobileMenuOpen: boolean;
  showInstallPrompt: boolean;
  isLoading: boolean;
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>

  // Data
  models: CatalogModelData[];
  categories: CategoryData[];
  featuredModels: CatalogModelData[];
  selectedModel: CatalogModelData | null;
  userProjects: ProjectData[];
  userFavorites: string[];
  notifications: NotificationData[];
  unreadNotificationCount: number;

  // Filters
  filters: FilterState;

  // Configurator
  configurator: ConfiguratorState;
  draftId: string | null;

  // Admin
  adminTab: string;

  // Actions - Navigation
  navigate: (view: ViewName, params?: Record<string, string>) => void;
  goBack: () => void;
  resetNavigation: () => void;

  // Actions - Auth
  setUser: (user: AppUser | null) => void;
  login: (user: AppUser) => void;
  logout: () => void;
  requireAuth: (redirectView?: ViewName, params?: Record<string, string>) => void;
  dismissAuth: () => void;

  // Actions - UI
  toggleMobileMenu: () => void;
  setInstallPrompt: (show: boolean) => void;
  setLoading: (loading: boolean) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  // Actions - Data
  setModels: (models: CatalogModelData[]) => void;
  setCategories: (categories: CategoryData[]) => void;
  setFeaturedModels: (models: CatalogModelData[]) => void;
  setSelectedModel: (model: CatalogModelData | null) => void;
  setUserProjects: (projects: ProjectData[]) => void;
  toggleFavorite: (modelId: string) => void;
  setUserFavorites: (ids: string[]) => void;
  setNotifications: (notifications: NotificationData[]) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Actions - Filters
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;

  // Actions - Configurator
  setConfiguratorStep: (step: number) => void;
  setConfiguratorData: (data: Partial<ConfiguratorState>) => void;
  setConfiguratorResponse: (key: string, value: unknown) => void;
  resetConfigurator: () => void;
  saveDraft: (draftId: string) => void;

  // Actions - Admin
  setAdminTab: (tab: string) => void;
}

const defaultConfigurator: ConfiguratorState = {
  currentStep: 0,
  responses: {},
};

const defaultFilters: FilterState = {};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Navigation
      currentView: 'home',
      viewParams: {},
      previousView: null,
      navigationStack: ['home'],

      // Auth
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      showAuthModal: false,
      authRedirectView: null,
      authRedirectParams: {},

      // UI State
      isMobileMenuOpen: false,
      showInstallPrompt: false,
      isLoading: false,
      toasts: [],

      // Data
      models: [],
      categories: [],
      featuredModels: [],
      selectedModel: null,
      userProjects: [],
      userFavorites: [],
      notifications: [],
      unreadNotificationCount: 0,

      // Filters
      filters: defaultFilters,

      // Configurator
      configurator: { ...defaultConfigurator },
      draftId: null,

      // Admin
      adminTab: 'dashboard',

      // Actions - Navigation
      navigate: (view, params = {}) => {
        const state = get();
        set({
          previousView: state.currentView,
          currentView: view,
          viewParams: params,
          navigationStack: [...state.navigationStack, view],
          isMobileMenuOpen: false,
        });
      },

      goBack: () => {
        const state = get();
        const stack = [...state.navigationStack];
        stack.pop();
        const prevView = stack[stack.length - 1] || 'home';
        set({
          currentView: prevView as ViewName,
          viewParams: {},
          navigationStack: stack,
          previousView: null,
        });
      },

      resetNavigation: () => {
        set({
          currentView: 'home',
          viewParams: {},
          previousView: null,
          navigationStack: ['home'],
        });
      },

      // Actions - Auth
      setUser: (user) => set({ user, isAuthenticated: !!user, isAdmin: user?.type === 'admin' || user?.type === 'employee' }),
      login: (user) => {
        const state = get();
        set({
          user,
          isAuthenticated: true,
          isAdmin: user.type === 'admin' || user.type === 'employee',
          showAuthModal: false,
        });
        if (state.authRedirectView) {
          setTimeout(() => {
            get().navigate(state.authRedirectView!, state.authRedirectParams);
          }, 100);
        }
      },
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isAdmin: false,
          userProjects: [],
          userFavorites: [],
          notifications: [],
          unreadNotificationCount: 0,
          currentView: 'home',
          navigationStack: ['home'],
          viewParams: {},
          previousView: null,
        });
      },
      requireAuth: (redirectView, params = {}) => {
        set({
          showAuthModal: true,
          authRedirectView: redirectView || get().currentView,
          authRedirectParams: params,
        });
      },
      dismissAuth: () => set({ showAuthModal: false }),

      // Actions - UI
      toggleMobileMenu: () => set(s => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
      setInstallPrompt: (show) => set({ showInstallPrompt: show }),
      setLoading: (loading) => set({ isLoading: loading }),
      addToast: (message, type = 'info') => {
        const id = Date.now().toString();
        set(s => ({ toasts: [...s.toasts, { id, message, type }] }));
        setTimeout(() => get().removeToast(id), 4000);
      },
      removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

      // Actions - Data
      setModels: (models) => set({ models }),
      setCategories: (categories) => set({ categories }),
      setFeaturedModels: (models) => set({ featuredModels: models }),
      setSelectedModel: (model) => set({ selectedModel: model }),
      setUserProjects: (projects) => set({ userProjects: projects }),
      toggleFavorite: (modelId) => {
        set(s => ({
          userFavorites: s.userFavorites.includes(modelId)
            ? s.userFavorites.filter(id => id !== modelId)
            : [...s.userFavorites, modelId],
        }));
      },
      setUserFavorites: (ids) => set({ userFavorites: ids }),
      setNotifications: (notifications) => set({
        notifications,
        unreadNotificationCount: notifications.filter(n => !n.isRead).length,
      }),
      markNotificationRead: (id) => set(s => ({
        notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
        unreadNotificationCount: s.notifications.filter(n => !n.isRead && n.id !== id).length,
      })),
      markAllNotificationsRead: () => set(s => ({
        notifications: s.notifications.map(n => ({ ...n, isRead: true })),
        unreadNotificationCount: 0,
      })),

      // Actions - Filters
      setFilters: (filters) => set(s => ({ filters: { ...s.filters, ...filters } })),
      resetFilters: () => set({ filters: defaultFilters }),

      // Actions - Configurator
      setConfiguratorStep: (step) => set(s => ({
        configurator: { ...s.configurator, currentStep: step },
      })),
      setConfiguratorData: (data) => set(s => ({
        configurator: { ...s.configurator, ...data },
      })),
      setConfiguratorResponse: (key, value) => set(s => ({
        configurator: {
          ...s.configurator,
          responses: { ...s.configurator.responses, [key]: value },
        },
      })),
      resetConfigurator: () => set({ configurator: { ...defaultConfigurator }, draftId: null }),
      saveDraft: (draftId) => set({ draftId }),

      // Actions - Admin
      setAdminTab: (tab) => set({ adminTab: tab }),
    }),
    {
      name: 'btp-app-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
        userFavorites: state.userFavorites,
        configurator: state.configurator,
        draftId: state.draftId,
        filters: state.filters,
      }),
    }
  )
);
