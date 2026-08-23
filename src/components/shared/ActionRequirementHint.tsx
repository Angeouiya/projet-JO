'use client';

import { cn } from '@/lib/utils';

type ActionRequirementHintProps = {
  items: string[];
  title?: string;
  readyText?: string;
  className?: string;
};

export function ActionRequirementHint({
  items,
  title = 'À compléter avant action',
  readyText,
  className,
}: ActionRequirementHintProps) {
  const missingItems = items.map(item => item.trim()).filter(Boolean);

  if (missingItems.length === 0) {
    if (!readyText) return null;

    return (
      <p className={cn('mt-2 rounded-lg border bg-muted/20 px-3 py-2 text-xs font-medium leading-5 text-muted-foreground', className)}>
        {readyText}
      </p>
    );
  }

  return (
    <div
      className={cn('mt-2 rounded-lg border border-dashed bg-muted/20 p-3 text-xs leading-5 text-muted-foreground', className)}
      aria-live="polite"
    >
      <p className="font-semibold text-foreground">{title}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {missingItems.map(item => (
          <span key={item} className="rounded-md border bg-background px-2 py-1 font-medium text-foreground">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
