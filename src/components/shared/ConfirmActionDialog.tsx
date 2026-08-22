'use client';

import type { ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

type ConfirmActionDialogProps = {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  confirmClassName?: string;
};

export function ConfirmActionDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Continuer',
  cancelLabel = 'Annuler',
  onConfirm,
  confirmClassName,
}: ConfirmActionDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl border-border bg-card p-0 text-card-foreground shadow-2xl sm:max-w-md">
        <div className="space-y-5 rounded-2xl bg-card p-6">
          <AlertDialogHeader className="gap-2 text-left">
            <AlertDialogTitle className="text-xl font-bold leading-tight">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-2 gap-2 sm:flex sm:flex-row">
            <AlertDialogCancel className="mt-0 h-11 rounded-xl">
              {cancelLabel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              className={cn('h-11 rounded-xl font-semibold', confirmClassName)}
            >
              {confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
