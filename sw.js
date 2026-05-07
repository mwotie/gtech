// GTech Service Worker — enables full offline operation
const CACHE_VERSION = 'gtech-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  './icon-192.png',
  './icon-maskable.png',
  'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      // Best-effort caching — don't fail install if a font URL is unreachable
      Promise.all(
        ASSETS.map((url) =>
          cache.add(url).catch(() => null)
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // Cache successful same-origin and font responses
          if (res && res.status === 200 && (res.type === 'basic' || req.url.includes('fonts.g'))) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone)).catch(() => {});
          }
          return res;
        })
        .catch(() => {
          // Offline fallback for navigation requests
          if (req.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
