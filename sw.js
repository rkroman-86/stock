// Service worker : rend l'appli installable et utilisable hors ligne.
// Changer VERSION à chaque mise à jour importante pour forcer le rafraîchissement du cache.
const VERSION = 'stock-v10';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];
const LIBS = [
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })));
    await Promise.all(LIBS.map(u => c.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Jamais de cache pour Google (connexion, Drive)
  if (/(^|\.)google(apis)?\.com$|gstatic\.com$/.test(url.hostname)) return;

  // Bibliothèques versionnées : cache d'abord
  if (LIBS.includes(req.url)) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res;
    })));
    return;
  }

  // Fichiers de l'appli : réseau d'abord pour recevoir les mises à jour,
  // mais si le réseau ne répond pas en 3 s (mauvaise connexion), on sert la copie en cache.
  if (url.origin === location.origin) {
    e.respondWith((async () => {
      const cached = caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined));
      const network = fetch(req, { cache: 'no-cache' }).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
        return res;
      });
      e.waitUntil(network.catch(() => {}));
      const timeout = new Promise(r => setTimeout(r, 3000));
      const first = await Promise.race([network.catch(() => null), timeout.then(() => null)]);
      if (first) return first;
      const c = await cached;
      return c || network;
    })());
  }
});
