const CACHE_NAME = 'buildify-shell-v8-2026-09-09';
const STATIC_ASSETS = ['/manifest.json', '/icons/buildify-logo.png'];
const CACHEABLE_PREFIXES = ['/icons/', '/images/', '/_next/static/'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'BUILDIFY_SW_UPDATED', cacheName: CACHE_NAME });
          if ('navigate' in client) {
            client.navigate(client.url);
          }
        });
      })
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'CLEAR_BUILDIFY_CACHES') {
    event.waitUntil(
      caches.keys()
        .then(keys => Promise.all(keys.filter(key => key.startsWith('buildify-') && key !== CACHE_NAME).map(key => caches.delete(key))))
    );
  }
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => new Response(
        '<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Buildify</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><main style="font-family:system-ui,sans-serif;padding:24px"><h1>Buildify</h1><p>Connexion indisponible. Rechargez la page dès que le réseau revient.</p></main></body></html>',
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      ))
    );
    return;
  }

  if (url.pathname.startsWith('/api/') || url.pathname.includes('/_next/data/')) return;

  const shouldCache = CACHEABLE_PREFIXES.some(prefix => url.pathname.startsWith(prefix)) || url.pathname === '/manifest.json';
  if (!shouldCache) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
