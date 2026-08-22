'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ViewName,
  AppUser,
  FilterState,
  ConfiguratorState,
  CatalogModelData,
  CategoryData,
  ProjectData,
  ProjectDocumentData,
  ProjectActivityData,
  ProjectFinancingData,
  ProjectVisualProposalData,
  NotificationData,
} from '@/types';
import {
  isNotificationForRole,
  unreadNotificationsForRole,
} from '@/lib/notification-audience';

type ProjectRequestInput = Partial<ProjectData> & Pick<ProjectData, 'referenceNumber'>;
type AuthResumeAction = 'submit-configurator';

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
  authResumeAction: AuthResumeAction | null;

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
  adminSidebarCollapsed: boolean;

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
  setAuthResumeAction: (action: AuthResumeAction | null) => void;
  clearAuthResumeAction: () => void;
  updateUserProfile: (profile: Partial<Pick<AppUser,
    'name'
    | 'email'
    | 'phone'
    | 'residenceCountry'
    | 'timeZone'
    | 'preferredContactChannel'
    | 'representativeName'
    | 'representativePhone'
    | 'representativeRelation'
  >>) => void;

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
  createProjectRequest: (project: ProjectRequestInput) => ProjectData;
  addProjectDocuments: (projectId: string, documents: ProjectDocumentData[]) => void;
  assignProjectLead: (projectId: string, leadName: string) => void;
  requestProjectInfo: (projectId: string, message: string) => void;
  respondProjectInfo: (projectId: string, message: string) => void;
  sendProjectQuote: (projectId: string, amount: number, label?: string) => void;
  updateProjectQuoteStatus: (projectId: string, quoteId: string, status: 'accepted' | 'refused') => void;
  validateProjectVisualProposal: (projectId: string, proposal: Omit<ProjectVisualProposalData, 'validatedAt' | 'validatedBy'>) => void;
  updateProjectFinancing: (projectId: string, financing: ProjectFinancingData) => void;
  updateProjectStatus: (projectId: string, status: string, label?: string) => void;
  toggleFavorite: (modelId: string) => void;
  setUserFavorites: (ids: string[]) => void;
  setNotifications: (notifications: NotificationData[]) => void;
  addNotification: (notification: Omit<NotificationData, 'id' | 'createdAt' | 'isRead'> & Partial<Pick<NotificationData, 'id' | 'createdAt' | 'isRead'>>) => void;
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
  toggleAdminSidebar: () => void;
  setAdminSidebarCollapsed: (collapsed: boolean) => void;
}

const defaultConfigurator: ConfiguratorState = {
  currentStep: 0,
  responses: {},
};

const defaultFilters: FilterState = {};

function uniqueId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function activity(label: string, actor: string, type: ProjectActivityData['type']): ProjectActivityData {
  return {
    id: uniqueId('act'),
    label,
    actor,
    type,
    createdAt: new Date().toISOString(),
  };
}

function unreadCount(notifications: NotificationData[], isAdmin: boolean) {
  return unreadNotificationsForRole(notifications, isAdmin).length;
}

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
      authResumeAction: null,

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
      adminSidebarCollapsed: false,

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
      setUser: (user) => set(s => {
        const isAdmin = user?.type === 'admin' || user?.type === 'employee';
        return {
          user,
          isAuthenticated: !!user,
          isAdmin,
          unreadNotificationCount: unreadCount(s.notifications, isAdmin),
        };
      }),
      login: (user) => {
        const state = get();
        const isAdmin = user.type === 'admin' || user.type === 'employee';
        set({
          user,
          isAuthenticated: true,
          isAdmin,
          showAuthModal: false,
          unreadNotificationCount: unreadCount(state.notifications, isAdmin),
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
          authRedirectView: null,
          authRedirectParams: {},
          authResumeAction: null,
        });
      },
      requireAuth: (redirectView, params = {}) => {
        set({
          showAuthModal: true,
          authRedirectView: redirectView || get().currentView,
          authRedirectParams: params,
        });
      },
      dismissAuth: () => set({ showAuthModal: false, authResumeAction: null }),
      setAuthResumeAction: (action) => set({ authResumeAction: action }),
      clearAuthResumeAction: () => set({ authResumeAction: null }),
      updateUserProfile: (profile) => set(s => {
        if (!s.user) return {};

        const previous = s.user;
        const nextUser: AppUser = {
          ...previous,
          name: profile.name?.trim() || previous.name,
          email: profile.email !== undefined ? profile.email.trim() || undefined : previous.email,
          phone: profile.phone !== undefined ? profile.phone.trim() || undefined : previous.phone,
          residenceCountry: profile.residenceCountry !== undefined ? profile.residenceCountry.trim() || undefined : previous.residenceCountry,
          timeZone: profile.timeZone !== undefined ? profile.timeZone.trim() || undefined : previous.timeZone,
          preferredContactChannel: profile.preferredContactChannel !== undefined ? profile.preferredContactChannel.trim() || undefined : previous.preferredContactChannel,
          representativeName: profile.representativeName !== undefined ? profile.representativeName.trim() || undefined : previous.representativeName,
          representativePhone: profile.representativePhone !== undefined ? profile.representativePhone.trim() || undefined : previous.representativePhone,
          representativeRelation: profile.representativeRelation !== undefined ? profile.representativeRelation.trim() || undefined : previous.representativeRelation,
        };
        const now = new Date().toISOString();

        return {
          user: nextUser,
          userProjects: s.userProjects.map(project => {
            const belongsToUser = project.userId === previous.id
              || project.clientEmail === previous.email
              || project.clientPhone === previous.phone
              || (!project.userId && !project.clientEmail && !project.clientPhone);
            if (!belongsToUser) return project;

            return {
              ...project,
              clientName: nextUser.name,
              clientEmail: nextUser.email,
              clientPhone: nextUser.phone,
              clientResidenceCountry: nextUser.residenceCountry,
              clientTimeZone: nextUser.timeZone,
              clientPreferredContactChannel: nextUser.preferredContactChannel,
              representativeName: nextUser.representativeName,
              representativePhone: nextUser.representativePhone,
              representativeRelation: nextUser.representativeRelation,
              updatedAt: now,
            };
          }),
        };
      }),

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
      createProjectRequest: (input) => {
        const now = new Date().toISOString();
        const user = get().user;
        const createdByAdmin = get().isAdmin || user?.type === 'admin';
        const project: ProjectData = {
          id: input.id || uniqueId('prj'),
          referenceNumber: input.referenceNumber,
          title: input.title || input.modelName || 'Nouveau projet BTP',
          description: input.description,
          status: input.status || 'submitted',
          userId: input.userId || user?.id,
          clientName: input.clientName || user?.name || 'Client Buildify',
          clientEmail: input.clientEmail || user?.email,
          clientPhone: input.clientPhone || user?.phone,
          clientResidenceCountry: input.clientResidenceCountry || user?.residenceCountry,
          clientTimeZone: input.clientTimeZone || user?.timeZone,
          clientPreferredContactChannel: input.clientPreferredContactChannel || user?.preferredContactChannel,
          clientContactWindow: input.clientContactWindow,
          clientPresence: input.clientPresence,
          remoteDecisionMode: input.remoteDecisionMode,
          representativeName: input.representativeName || user?.representativeName,
          representativePhone: input.representativePhone || user?.representativePhone,
          representativeRelation: input.representativeRelation || user?.representativeRelation,
          country: input.country || "Côte d'Ivoire",
          categoryId: input.categoryId,
          categoryName: input.categoryName,
          modelId: input.modelId,
          modelName: input.modelName,
          budgetMin: input.budgetMin,
          budgetMax: input.budgetMax,
          city: input.city,
          progress: input.progress ?? 5,
          assignedTo: input.assignedTo,
          missingInfo: input.missingInfo,
          missingInfoRequestedAt: input.missingInfoRequestedAt,
          formData: input.formData,
          documents: input.documents ?? [],
          quotes: input.quotes ?? [],
          visualProposal: input.visualProposal,
          financing: input.financing,
          activityLog: [
            activity(
              createdByAdmin ? 'Dossier créé dans la plateforme admin' : 'Demande client soumise',
              user?.name || (createdByAdmin ? 'Administration' : 'Client'),
              createdByAdmin ? 'admin' : 'client'
            ),
            ...(input.activityLog ?? []),
          ],
          createdAt: input.createdAt || now,
          updatedAt: now,
        };

        set(s => {
          const withoutDuplicate = s.userProjects.filter(p => p.id !== project.id && p.referenceNumber !== project.referenceNumber);
          const projectNotifications: NotificationData[] = createdByAdmin
            ? [
                {
                  id: uniqueId('notif'),
                  title: 'Dossier admin créé',
                  message: `${project.referenceNumber} a été créé depuis la plateforme admin.`,
                  type: 'status',
                  audience: 'admin',
                  link: 'admin-project-detail',
                  projectId: project.id,
                  actionLabel: 'Ouvrir',
                  isRead: false,
                  createdAt: now,
                },
              ]
            : [
                {
                  id: uniqueId('notif'),
                  title: 'Demande transmise',
                  message: `${project.referenceNumber} a bien été transmis à Buildify.`,
                  type: 'status',
                  audience: 'client',
                  link: 'project-detail',
                  projectId: project.id,
                  actionLabel: 'Suivre',
                  isRead: false,
                  createdAt: now,
                },
                {
                  id: uniqueId('notif'),
                  title: 'Nouvelle demande client',
                  message: `${project.referenceNumber} est maintenant visible dans la plateforme admin.`,
                  type: 'status',
                  audience: 'admin',
                  link: 'admin-project-detail',
                  projectId: project.id,
                  actionLabel: 'Ouvrir',
                  isRead: false,
                  createdAt: now,
                },
              ];
          const notifications = [...projectNotifications, ...s.notifications];

          return {
            userProjects: [project, ...withoutDuplicate],
            notifications,
            unreadNotificationCount: unreadCount(notifications, s.isAdmin),
          };
        });

        return project;
      },
      addProjectDocuments: (projectId, documents) => set(s => {
        const now = new Date().toISOString();
        let projectRef = '';
        let projectTitle = '';
        const projects = s.userProjects.map(project => {
          if (project.id !== projectId) return project;
          projectRef = project.referenceNumber;
          projectTitle = project.title || project.referenceNumber;
          return {
            ...project,
            documents: [...documents, ...(project.documents ?? [])],
            activityLog: [
              activity(`${documents.length} document${documents.length > 1 ? 's' : ''} ajouté${documents.length > 1 ? 's' : ''}`, s.user?.name || 'Client', 'document'),
              ...(project.activityLog ?? []),
            ],
            updatedAt: now,
          };
        });

        if (!projectRef || documents.length === 0) {
          return { userProjects: projects };
        }

        const notifications: NotificationData[] = [
          {
            id: uniqueId('notif'),
            title: 'Documents reçus',
            message: `${documents.length} document${documents.length > 1 ? 's' : ''} ajouté${documents.length > 1 ? 's' : ''} au dossier ${projectRef} (${projectTitle}).`,
            type: 'document',
            audience: 'admin',
            link: 'admin-project-detail',
            projectId,
            actionLabel: 'Contrôler',
            isRead: false,
            createdAt: now,
          },
          ...s.notifications,
        ];

        return { userProjects: projects, notifications, unreadNotificationCount: unreadCount(notifications, s.isAdmin) };
      }),
      assignProjectLead: (projectId, leadName) => set(s => {
        const now = new Date().toISOString();
        const projects = s.userProjects.map(project => {
          if (project.id !== projectId) return project;
          return {
            ...project,
            assignedTo: leadName,
            status: project.status === 'submitted' ? 'verifying' : project.status,
            activityLog: [
              activity(`Responsable affecté : ${leadName}`, s.user?.name || 'Administration', 'admin'),
              ...(project.activityLog ?? []),
            ],
            updatedAt: now,
          };
        });

        return { userProjects: projects };
      }),
      requestProjectInfo: (projectId, message) => set(s => {
        const now = new Date().toISOString();
        let projectRef = '';
        const projects = s.userProjects.map(project => {
          if (project.id !== projectId) return project;
          projectRef = project.referenceNumber;
          return {
            ...project,
            status: 'info_required',
            missingInfo: message,
            missingInfoRequestedAt: now,
            activityLog: [
              activity('Information complémentaire demandée', s.user?.name || 'Administration', 'admin'),
              ...(project.activityLog ?? []),
            ],
            updatedAt: now,
          };
        });
        const notifications: NotificationData[] = [
          {
            id: uniqueId('notif'),
            title: 'Information requise',
            message: message || `L'équipe demande une précision sur ${projectRef}.`,
            type: 'status',
            audience: 'client',
            link: 'project-detail',
            projectId,
            actionLabel: 'Compléter',
            isRead: false,
            createdAt: now,
          },
          ...s.notifications,
        ];

        return { userProjects: projects, notifications, unreadNotificationCount: unreadCount(notifications, s.isAdmin) };
      }),
      respondProjectInfo: (projectId, message) => set(s => {
        const now = new Date().toISOString();
        let projectRef = '';
        const cleanMessage = message.trim();
        const projects = s.userProjects.map(project => {
          if (project.id !== projectId) return project;
          projectRef = project.referenceNumber;
          return {
            ...project,
            status: project.status === 'info_required' ? 'verifying' : project.status,
            progress: Math.max(project.progress ?? 0, 10),
            missingInfo: undefined,
            missingInfoRequestedAt: undefined,
            missingInfoResponses: [
              {
                id: uniqueId('info'),
                message: cleanMessage,
                requestMessage: project.missingInfo,
                respondedAt: now,
                respondedBy: s.user?.name || project.clientName || 'Client',
              },
              ...(project.missingInfoResponses ?? []),
            ],
            activityLog: [
              activity('Information complémentaire transmise par le client', s.user?.name || project.clientName || 'Client', 'client'),
              ...(project.activityLog ?? []),
            ],
            updatedAt: now,
          };
        });
        const notifications: NotificationData[] = [
          {
            id: uniqueId('notif'),
            title: 'Information client reçue',
            message: `${projectRef || 'Le dossier'} a été complété par le client.`,
            type: 'message',
            audience: 'admin',
            link: 'admin-project-detail',
            projectId,
            actionLabel: 'Ouvrir',
            isRead: false,
            createdAt: now,
          },
          ...s.notifications,
        ];

        return { userProjects: projects, notifications, unreadNotificationCount: unreadCount(notifications, s.isAdmin) };
      }),
      sendProjectQuote: (projectId, amount, label = 'Devis estimatif') => set(s => {
        const now = new Date().toISOString();
        let projectRef = '';
        const projects = s.userProjects.map(project => {
          if (project.id !== projectId) return project;
          projectRef = project.referenceNumber;
          return {
            ...project,
            status: 'quote_sent',
            progress: Math.max(project.progress ?? 0, 15),
            quotes: [
              {
                id: uniqueId('quote'),
                label,
                amount,
                status: 'sent' as const,
                date: now.slice(0, 10),
              },
              ...(project.quotes ?? []),
            ],
            activityLog: [
              activity(`${label} transmis`, s.user?.name || 'Administration', 'quote'),
              ...(project.activityLog ?? []),
            ],
            updatedAt: now,
          };
        });
        const notifications: NotificationData[] = [
          {
            id: uniqueId('notif'),
            title: 'Devis disponible',
            message: `${label} de ${new Intl.NumberFormat('fr-FR').format(amount)} XOF transmis pour ${projectRef}.`,
            type: 'quote',
            audience: 'client',
            link: 'project-detail',
            projectId,
            actionLabel: 'Consulter',
            isRead: false,
            createdAt: now,
          },
          ...s.notifications,
        ];

        return { userProjects: projects, notifications, unreadNotificationCount: unreadCount(notifications, s.isAdmin) };
      }),
      updateProjectQuoteStatus: (projectId, quoteId, status) => set(s => {
        const now = new Date().toISOString();
        let projectRef = '';
        let quoteLabel = 'Devis';
        let quoteAmount = 0;
        const projects = s.userProjects.map(project => {
          if (project.id !== projectId) return project;
          const quotes = (project.quotes ?? []).map(quote => (
            quote.id === quoteId
              ? (() => {
                  projectRef = project.referenceNumber;
                  quoteLabel = quote.label;
                  quoteAmount = quote.amount;
                  return { ...quote, status };
                })()
              : quote
          ));

          return {
            ...project,
            status: status === 'accepted' ? 'accepted' : 'modification_requested',
            quotes,
            activityLog: [
              activity(status === 'accepted' ? 'Devis accepté par le client' : 'Devis refusé par le client', s.user?.name || 'Client', 'quote'),
              ...(project.activityLog ?? []),
            ],
            updatedAt: now,
          };
        });
        const notifications: NotificationData[] = [
          {
            id: uniqueId('notif'),
            title: status === 'accepted' ? 'Devis accepté' : 'Devis refusé',
            message: status === 'accepted'
              ? `${quoteLabel} de ${new Intl.NumberFormat('fr-FR').format(quoteAmount)} XOF accepté pour ${projectRef || 'le dossier'}.`
              : `${quoteLabel} a été refusé pour ${projectRef || 'le dossier'}. Reprendre le chiffrage ou clarifier le périmètre.`,
            type: 'quote',
            audience: 'admin',
            link: 'admin-project-detail',
            projectId,
            actionLabel: 'Ouvrir',
            isRead: false,
            createdAt: now,
          },
          ...s.notifications,
        ];

        return { userProjects: projects, notifications, unreadNotificationCount: unreadCount(notifications, s.isAdmin) };
      }),
      validateProjectVisualProposal: (projectId, proposal) => set(s => {
        const now = new Date().toISOString();
        let projectRef = '';
        let proposalTitle = proposal.title;
        const projects = s.userProjects.map(project => {
          if (project.id !== projectId) return project;
          projectRef = project.referenceNumber;
          proposalTitle = proposal.title;
          const visualProposal: ProjectVisualProposalData = {
            ...proposal,
            validatedAt: now,
            validatedBy: s.user?.name || project.clientName || 'Client',
          };

          return {
            ...project,
            status: ['submitted', 'verifying', 'studying', 'estimating', 'proposal_ready'].includes(project.status)
              ? 'proposal_validated'
              : project.status,
            progress: Math.max(project.progress ?? 0, 25),
            visualProposal,
            activityLog: [
              activity(`Proposition visuelle validée : ${proposal.title}`, s.user?.name || project.clientName || 'Client', 'proposal'),
              ...(project.activityLog ?? []),
            ],
            updatedAt: now,
          };
        });
        const notifications: NotificationData[] = [
          {
            id: uniqueId('notif'),
            title: 'Choix enregistré',
            message: `Votre validation de ${proposalTitle} est enregistrée pour ${projectRef || 'le projet'}.`,
            type: 'proposal',
            audience: 'client',
            link: 'project-detail',
            projectId,
            actionLabel: 'Consulter',
            isRead: false,
            createdAt: now,
          },
          {
            id: uniqueId('notif'),
            title: 'Proposition validée',
            message: `${proposalTitle} a été retenue par le client pour ${projectRef || 'le projet'}.`,
            type: 'proposal',
            audience: 'admin',
            link: 'admin-project-detail',
            projectId,
            actionLabel: 'Traiter',
            isRead: false,
            createdAt: now,
          },
          ...s.notifications,
        ];

        return { userProjects: projects, notifications, unreadNotificationCount: unreadCount(notifications, s.isAdmin) };
      }),
      updateProjectFinancing: (projectId, financing) => set(s => {
        const now = new Date().toISOString();
        let projectRef = '';
        const projects = s.userProjects.map(project => {
          if (project.id !== projectId) return project;
          projectRef = project.referenceNumber;
          return {
            ...project,
            financing: { ...financing, updatedAt: financing.updatedAt || now },
            activityLog: [
              activity('Plan de financement mis à jour', s.user?.name || 'Administration', 'status'),
              ...(project.activityLog ?? []),
            ],
            updatedAt: now,
          };
        });

        if (!projectRef) return { userProjects: projects };

        const notifications: NotificationData[] = [
          {
            id: uniqueId('notif'),
            title: s.isAdmin ? 'Financement mis à jour' : 'Données financières reçues',
            message: s.isAdmin
              ? `Le plan de financement du dossier ${projectRef} a été mis à jour par Buildify.`
              : `Le client a complété les informations financières du dossier ${projectRef}.`,
            type: 'finance',
            audience: s.isAdmin ? 'client' : 'admin',
            link: s.isAdmin ? 'project-detail' : 'admin-project-detail',
            projectId,
            actionLabel: s.isAdmin ? 'Consulter' : 'Analyser',
            isRead: false,
            createdAt: now,
          },
          ...s.notifications,
        ];

        return { userProjects: projects, notifications, unreadNotificationCount: unreadCount(notifications, s.isAdmin) };
      }),
      updateProjectStatus: (projectId, status, label) => set(s => {
        const now = new Date().toISOString();
        let projectRef = '';
        const projects = s.userProjects.map(project => {
          if (project.id !== projectId) return project;
          projectRef = project.referenceNumber;
          return {
            ...project,
            status,
            activityLog: [
              activity(label || `Statut mis à jour : ${status}`, s.user?.name || 'Administration', 'status'),
              ...(project.activityLog ?? []),
            ],
            updatedAt: now,
          };
        });

        if (!projectRef) return { userProjects: projects };

        const notifications: NotificationData[] = [
          {
            id: uniqueId('notif'),
            title: 'Statut du projet',
            message: label || `Le statut du dossier ${projectRef} passe à ${status}.`,
            type: 'status',
            audience: s.isAdmin ? 'client' : 'admin',
            link: s.isAdmin ? 'project-detail' : 'admin-project-detail',
            projectId,
            actionLabel: 'Ouvrir',
            isRead: false,
            createdAt: now,
          },
          ...s.notifications,
        ];

        return { userProjects: projects, notifications, unreadNotificationCount: unreadCount(notifications, s.isAdmin) };
      }),
      toggleFavorite: (modelId) => {
        set(s => ({
          userFavorites: s.userFavorites.includes(modelId)
            ? s.userFavorites.filter(id => id !== modelId)
            : [...s.userFavorites, modelId],
        }));
      },
      setUserFavorites: (ids) => set({ userFavorites: ids }),
      setNotifications: (notifications) => set(s => ({
        notifications,
        unreadNotificationCount: unreadCount(notifications, s.isAdmin),
      })),
      addNotification: (notification) => set(s => {
        const notifications = [
          {
            id: notification.id || uniqueId('notif'),
            title: notification.title,
            message: notification.message,
            type: notification.type,
            audience: notification.audience,
            link: notification.link,
            projectId: notification.projectId,
            actionLabel: notification.actionLabel,
            isRead: notification.isRead ?? false,
            createdAt: notification.createdAt || new Date().toISOString(),
          },
          ...s.notifications,
        ];

        return { notifications, unreadNotificationCount: unreadCount(notifications, s.isAdmin) };
      }),
      markNotificationRead: (id) => set(s => {
        const notifications = s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
        return { notifications, unreadNotificationCount: unreadCount(notifications, s.isAdmin) };
      }),
      markAllNotificationsRead: () => set(s => {
        const notifications = s.notifications.map(n => (
          isNotificationForRole(n, s.isAdmin) ? { ...n, isRead: true } : n
        ));
        return { notifications, unreadNotificationCount: unreadCount(notifications, s.isAdmin) };
      }),

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
      toggleAdminSidebar: () => set(s => ({ adminSidebarCollapsed: !s.adminSidebarCollapsed })),
      setAdminSidebarCollapsed: (collapsed) => set({ adminSidebarCollapsed: collapsed }),
    }),
    {
      name: 'btp-app-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
        userProjects: state.userProjects,
        userFavorites: state.userFavorites,
        notifications: state.notifications,
        unreadNotificationCount: state.unreadNotificationCount,
        adminSidebarCollapsed: state.adminSidebarCollapsed,
        configurator: state.configurator,
        authResumeAction: state.authResumeAction,
        draftId: state.draftId,
        filters: state.filters,
      }),
    }
  )
);
