// Service worker de WorkSplit (PWA).
// Estrategia: network-first para el contenido propio (así la app se auto-actualiza
// al recargar) con respaldo en caché para que abra estando offline. Las llamadas a
// /api/* y a las APIs de Google NUNCA se cachean.
const CACHE = 'worksplit-v4';
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/i18n.js',
  '/i18n/translations.csv',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // deja pasar Google APIs, fuentes, etc.
  if (url.pathname.startsWith('/api/')) return;     // nunca cachear el backend (tokens, etc.)

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('/')))
  );
});

// Al hacer clic en una notificación (p. ej. "split excedido"), enfoca una ventana
// existente de WorkSplit o abre una nueva.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })
  );
});
