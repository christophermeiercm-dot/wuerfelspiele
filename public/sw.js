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
  const ausDemSpeicher = () => caches.match(event.request, { ignoreSearch: true, ignoreVary: true });

  if (event.request.mode === 'navigate') {
    // Seite öffnen: mit Netz immer die neueste Version (höchstens 3 Sekunden warten), sonst aus dem Speicher.
    event.respondWith(
      Promise.race([fetch(event.request), new Promise((_, nein) => setTimeout(nein, 3000))])
        .catch(() => caches.match('./', { ignoreSearch: true, ignoreVary: true }).then(t => t || Response.error())),
    );
    return;
  }
  // Dateien mit Hash im Namen ändern sich nie: erst im Speicher nachsehen, dann Netz.
  event.respondWith(ausDemSpeicher().then(t => t || fetch(event.request).catch(() => Response.error())));
});
