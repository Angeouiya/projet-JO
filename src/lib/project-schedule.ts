import type { ProjectScheduleItemData } from '@/types';

export const PROJECT_SCHEDULE_TYPE_LABELS: Record<ProjectScheduleItemData['type'], string> = {
  appointment: 'Rendez-vous',
  technical_visit: 'Visite technique',
  site_meeting: 'Réunion chantier',
  bank_meeting: 'Rendez-vous banque',
  client_validation: 'Validation client',
};

export const PROJECT_SCHEDULE_MODE_LABELS: Record<ProjectScheduleItemData['mode'], string> = {
  phone: 'Appel',
  video: 'Visio',
  whatsapp: 'WhatsApp',
  site: 'Sur site',
  office: 'Bureau Buildify',
  bank: 'Banque',
};

export const PROJECT_SCHEDULE_STATUS_LABELS: Record<ProjectScheduleItemData['status'], string> = {
  scheduled: 'Programmé',
  confirmed: 'Confirmé',
  completed: 'Réalisé',
  postponed: 'Reporté',
  cancelled: 'Annulé',
};

export function sortProjectSchedule(items: ProjectScheduleItemData[] = []) {
  return items
    .slice()
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
}

export function formatProjectScheduleDate(value: string, timeZone?: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  try {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timeZone || undefined,
    }).format(date);
  } catch {
    return date.toLocaleString('fr-FR');
  }
}

export function projectScheduleTypeLabel(type: ProjectScheduleItemData['type']) {
  return PROJECT_SCHEDULE_TYPE_LABELS[type] || type;
}

export function projectScheduleModeLabel(mode: ProjectScheduleItemData['mode']) {
  return PROJECT_SCHEDULE_MODE_LABELS[mode] || mode;
}

export function projectScheduleStatusLabel(status: ProjectScheduleItemData['status']) {
  return PROJECT_SCHEDULE_STATUS_LABELS[status] || status;
}
