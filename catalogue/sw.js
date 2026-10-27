// Service worker du catalogue public (appli séparée de « Gestion de stock », portée ./catalogue/).
importScripts('watch.js');
const VERSION = 'catalogue-v4';
const SHELL = ['./', './index.html', './watch.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('catalogue-v') && k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;   // le stock (Google Drive) n'est jamais mis en cache
  e.respondWith(fetch(req, { cache: 'no-cache' }).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
});

// Vérification en arrière-plan (Chrome Android, appli installée) : fréquence décidée par le système.
self.addEventListener('periodicsync', e => {
  if (e.tag === 'catalogue-check') e.waitUntil(checkCatalog(self.registration, null, true).catch(() => {}));
});
// Message de la page (appli ouverte mais en arrière-plan) : vérifier et notifier
self.addEventListener('message', e => {
  if (e.data === 'check') e.waitUntil(checkCatalog(self.registration, null, true).catch(() => {}));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of list) if (c.url.startsWith(self.registration.scope)) { c.navigate(c.url).catch(() => {}); return c.focus(); }
    return self.clients.openWindow('./');
  })());
});
