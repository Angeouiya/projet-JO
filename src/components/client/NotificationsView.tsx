'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CheckCheck, Bell, FileText, MessageSquare,
  AlertCircle, CheckCircle2, Clock, FolderKanban, Receipt,
  Camera, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/stores/app-store';
import type { NotificationData } from '@/types';

// ── Mock notifications ────────────────────────────────────

const MOCK_NOTIFICATIONS: NotificationData[] = [
  {
    id: 'n1',
    title: 'Devis disponible',
    message: 'Le devis pour votre projet Duplex Horizon est prêt. Consultez-le et donnez votre accord.',
    type: 'quote',
    link: 'project-detail',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
  },
  {
    id: 'n2',
    title: 'Nouveau message',
    message: 'Kouamé A. vous a envoyé un message concernant Villa Aurore.',
    type: 'message',
    link: 'project-detail',
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5h ago
  },
  {
    id: 'n3',
    title: 'Rapport de chantier',
    message: 'Le rapport hebdomadaire S02 de votre chantier Villa Aurore est disponible.',
    type: 'report',
    link: 'project-detail',
    isRead: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
  {
    id: 'n4',
    title: 'Photo de chantier',
    message: 'Nouvelles photos du chantier Villa Émeraude ont été ajoutées.',
    type: 'photo',
    link: 'project-detail',
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    id: 'n5',
    title: 'Facture émise',
    message: 'La facture d\'acompte 30% pour Villa Aurore a été émise.',
    type: 'invoice',
    link: 'project-detail',
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },
  {
    id: 'n6',
    title: 'Mise à jour du projet',
    message: 'Le statut de votre projet Villa Émeraude est passé à « En cours ».',
    type: 'status',
    link: 'project-detail',
    isRead: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  },
  {
    id: 'n7',
    title: 'Visite planifiée',
    message: 'Une visite de votre terrain à Cocody est planifiée le vendredi à 10h.',
    type: 'visit',
    link: 'project-detail',
    isRead: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
  },
  {
    id: 'n8',
    title: 'Bienvenue !',
    message: 'Votre compte a été créé avec succès. Découvrez nos modèles et créez votre premier projet.',
    type: 'info',
    link: 'home',
    isRead: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
  },
];

// ── Helpers ───────────────────────────────────────────────

function getNotificationIcon(type: string) {
  switch (type) {
    case 'quote': return Receipt;
    case 'message': return MessageSquare;
    case 'report': return FileText;
    case 'photo': return Camera;
    case 'invoice': return Receipt;
    case 'status': return CheckCircle2;
    case 'visit': return Clock;
    default: return Bell;
  }
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffD = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD < 7) return `Il y a ${diffD}j`;
  if (diffD < 30) return `Il y a ${Math.floor(diffD / 7)} sem.`;
  return `Il y a ${Math.floor(diffD / 30)} mois`;
}

// ── Component ─────────────────────────────────────────────

export function NotificationsView() {
  const { goBack, navigate, notifications: workflowNotifications, markNotificationRead, markAllNotificationsRead } = useAppStore();
  const [readDemoIds, setReadDemoIds] = useState<Set<string>>(new Set());

  const workflowIds = new Set(workflowNotifications.map(notification => notification.id));
  const demoNotifications = MOCK_NOTIFICATIONS.map(notification => (
    readDemoIds.has(notification.id) ? { ...notification, isRead: true } : notification
  ));
  const notifications = [
    ...workflowNotifications,
    ...demoNotifications.filter(notification => !workflowIds.has(notification.id)),
  ];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (notification: NotificationData) => {
    markNotificationRead(notification.id);
    if (MOCK_NOTIFICATIONS.some(item => item.id === notification.id)) {
      setReadDemoIds(prev => new Set(prev).add(notification.id));
    }
    if (notification.link) {
      let viewParams: Record<string, string> | undefined;
      if (notification.projectId) {
        viewParams = { id: notification.projectId };
      } else if (notification.type === 'quote' || notification.type === 'message' || notification.type === 'report' || notification.type === 'photo' || notification.type === 'invoice' || notification.type === 'status' || notification.type === 'visit') {
        viewParams = { id: 'prj-001' };
      }
      navigate(notification.link as any, viewParams);
    }
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    setReadDemoIds(new Set(MOCK_NOTIFICATIONS.map(notification => notification.id)));
  };

  return (
    <main className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="size-9" onClick={goBack}>
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="font-bold text-lg flex-1">Notifications</h1>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="size-3.5" />
              Tout marquer lu
            </Button>
          )}
        </div>
      </div>

      {/* Notification list */}
      <div className="px-4 mt-2">
        {notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="size-16 rounded-full bg-muted flex items-center justify-center">
              <Bell className="size-7 text-muted-foreground/40" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Aucune notification.
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Vos alertes et mises à jour apparaîtront ici.
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {notifications.map((notif, i) => {
              const Icon = getNotificationIcon(notif.type);
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <button
                    className={`w-full text-left transition-colors ${
                      notif.isRead
                        ? 'opacity-60 hover:opacity-100'
                        : ''
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex items-start gap-3 py-4 relative">
                      {/* Unread dot */}
                      {!notif.isRead && (
                        <div className="absolute top-5 left-[-4px] size-2 rounded-full bg-foreground" />
                      )}

                      {/* Icon */}
                      <div className="size-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="size-4.5 text-muted-foreground" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`text-sm leading-tight ${!notif.isRead ? 'font-semibold' : 'font-medium'}`}>
                            {notif.title}
                          </h3>
                          <span className="text-[11px] text-muted-foreground flex-shrink-0 whitespace-nowrap mt-0.5">
                            {timeAgo(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                    <Separator />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </main>
  );
}
