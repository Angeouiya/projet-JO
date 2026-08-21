'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import type { ViewName } from '@/types';

const SHORTCUT_VIEWS = new Set<ViewName>(['create', 'projects', 'home', 'explore', 'services']);

export function PwaBootstrap() {
  const navigate = useAppStore(state => state.navigate);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registration failure should not block the application shell.
    });
  }, []);

  useEffect(() => {
    const view = new URLSearchParams(window.location.search).get('view') as ViewName | null;
    if (!view || !SHORTCUT_VIEWS.has(view)) return;
    navigate(view);
    window.history.replaceState(null, '', window.location.pathname);
  }, [navigate]);

  return null;
}
