'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CheckCheck, Bell, ClipboardList, MessageSquare,
  CheckCircle2, Clock, Receipt, Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/stores/app-store';
import type { NotificationData, ViewName } from '@/types';

function getNotificationIcon(type: string) {
  switch (type) {
    case 'quote': return Receipt;
    case 'message': return MessageSquare;
    case 'report': return ClipboardList;
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

export function NotificationsView() {
  const { goBack, navigate, notifications, markNotificationRead, markAllNotificationsRead } = useAppStore();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (notification: NotificationData) => {
    markNotificationRead(notification.id);
    if (notification.link) {
      let viewParams: Record<string, string> | undefined;
      if (notification.projectId) {
        viewParams = { id: notification.projectId };
      }
      navigate(notification.link as ViewName, viewParams);
    }
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
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
