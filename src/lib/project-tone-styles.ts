import type { ProjectDecisionTone } from '@/lib/project-decision-center';

export const PROJECT_DECISION_TONE_CLASS: Record<ProjectDecisionTone, string> = {
  good: 'border-foreground/15 bg-background',
  active: 'border-foreground bg-foreground text-background [&_.text-muted-foreground]:text-background/70',
  warning: 'border-foreground/30 border-dashed bg-muted/65 text-foreground',
  blocked: 'border-foreground/45 border-l-4 border-l-foreground bg-muted/80 text-foreground',
  muted: 'border-border bg-background',
};

export const PROJECT_BLOCKER_CLASS =
  'flex gap-2 rounded-xl border border-foreground/35 border-l-4 border-l-foreground bg-muted/70 px-3 py-2 text-xs leading-5 text-foreground';
