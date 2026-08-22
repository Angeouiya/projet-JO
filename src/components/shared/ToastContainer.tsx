'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function ToastContainer() {
  const { toasts, removeToast } = useAppStore();

  return (
    <div className="pointer-events-none fixed left-3 right-3 top-4 z-[60] space-y-2 sm:left-auto sm:right-4">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="pointer-events-auto relative w-full max-w-[calc(100vw-1.5rem)] rounded-xl border border-border bg-card p-3 pr-10 shadow-lg sm:min-w-[260px] sm:max-w-sm"
          >
            <div className="flex items-start gap-2.5">
              {(() => { const Icon = ICONS[toast.type]; return Icon ? <Icon className="w-4 h-4 mt-0.5 shrink-0" /> : null; })()}
              <p className="text-sm">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="absolute top-3 right-3 p-0.5 hover:bg-muted rounded"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
