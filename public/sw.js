// Service Worker: legt die ganze App beim ersten Besuch ab, danach läuft sie ohne Netz.
// Version und Dateiliste trägt der Build ein (vite.config.ts). Im Dev-Modus bleiben die
// Platzhalter stehen – dann tut der Worker nichts (AKTIV ist false).
const VERSION = '__VERSION__';
const DATEIEN = '__PRECACHE__';
const CACHE = 'wuerfel-' + VERSION;
const AKTIV = Array.isArray(DATEIEN);

self.addEventListener('install', event => {
  if (!AKTIV) return;
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(namen => Promise.all(namen.filter(n => n.startsWith('wuerfel-') && n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  if (!AKTIV || event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true, ignoreVary: true }).then(treffer => {
      if (treffer) return treffer;
      return fetch(event.request).catch(() =>
        event.request.mode === 'navigate' ? caches.match('./') : Response.error(),
      );
    }),
  );
});
