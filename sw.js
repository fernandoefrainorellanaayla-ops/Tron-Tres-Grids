/* TRON — service worker: caché de archivos estáticos para jugar sin conexión (la IA de NPCs sigue necesitando servidor o clave). */
const V = 'tron-grids-v3', ASSETS = ['./', './index.html', './manifest.webmanifest', './css/main.css', './css/hud.css', './css/menus.css', './css/dialogs.css', './css/mobile.css'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => { const u = new URL(e.request.url); if (e.request.method !== 'GET' || u.pathname.startsWith('/api/') || u.origin !== location.origin) return;
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => { const cp = r.clone(); caches.open(V).then((c) => c.put(e.request, cp)); return r; }).catch(() => hit))); });
