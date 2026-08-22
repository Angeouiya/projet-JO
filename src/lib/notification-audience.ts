import type { NotificationData } from '@/types';

export type NotificationAudience = NonNullable<NotificationData['audience']>;

export function getNotificationAudience(notification: NotificationData): NotificationAudience {
  if (notification.audience) return notification.audience;
  if (notification.link?.startsWith('admin')) return 'admin';
  return 'client';
}

export function isNotificationForRole(notification: NotificationData, isAdmin: boolean) {
  const audience = getNotificationAudience(notification);
  if (audience === 'both') return true;
  return isAdmin ? audience === 'admin' : audience === 'client';
}

export function filterNotificationsForRole(notifications: NotificationData[], isAdmin: boolean) {
  return notifications.filter(notification => isNotificationForRole(notification, isAdmin));
}

export function unreadNotificationsForRole(notifications: NotificationData[], isAdmin: boolean) {
  return filterNotificationsForRole(notifications, isAdmin).filter(notification => !notification.isRead);
}
