'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { PLATFORM_RELEASE } from '@/data/platform-release';
import type { ViewName } from '@/types';

const SHORTCUT_VIEWS = new Set<ViewName>(['create', 'dashboard', 'projects', 'home', 'explore', 'services']);
const PWA_RELEASE_KEY = 'buildify:pwa-release';
const ACTIVE_CACHE_NAME = 'buildify-shell-v6-2026-08-24';

export function PwaBootstrap() {
  const navigate = useAppStore(state => state.navigate);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    let hasReloadedForController = false;

    const refreshOldCaches = async () => {
      try {
        const previousRelease = window.localStorage.getItem(PWA_RELEASE_KEY);
        if (previousRelease === PLATFORM_RELEASE.id) return;
        const cacheNames = await window.caches?.keys?.();
        await Promise.all((cacheNames || []).filter(name => name.startsWith('buildify-') && name !== ACTIVE_CACHE_NAME).map(name => window.caches.delete(name)));
        window.localStorage.setItem(PWA_RELEASE_KEY, PLATFORM_RELEASE.id);
      } catch {
        // Cache refresh is a PWA improvement only. The app must keep loading if storage is unavailable.
      }
    };

    const onControllerChange = () => {
      if (hasReloadedForController) return;
      hasReloadedForController = true;
      window.location.reload();
    };

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'BUILDIFY_SW_UPDATED') {
        void refreshOldCaches();
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    navigator.serviceWorker.addEventListener('message', onMessage);

    navigator.serviceWorker
      .register(`/sw.js?release=${encodeURIComponent(PLATFORM_RELEASE.id)}`, { updateViaCache: 'none' })
      .then(registration => {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        registration.active?.postMessage({ type: 'CLEAR_BUILDIFY_CACHES' });
        void registration.update();
        void refreshOldCaches();
      })
      .catch(() => {
        // Registration failure should not block the application shell.
      });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      navigator.serviceWorker.removeEventListener('message', onMessage);
    };
  }, []);

  useEffect(() => {
    const view = new URLSearchParams(window.location.search).get('view') as ViewName | null;
    if (!view || !SHORTCUT_VIEWS.has(view)) return;
    navigate(view);
    window.history.replaceState(null, '', window.location.pathname);
  }, [navigate]);

  return null;
}
