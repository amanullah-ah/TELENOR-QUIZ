const V = 'tq-v7';
const SHELL = ['/', '/aman.css', '/aman.js', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const networkFirst = async (req, key) => {
  const c = await caches.open(V);
  try {
    const r = await fetch(req);
    if (r && r.ok) c.put(key || req, r.clone());
    return r;
  } catch (err) {
    const hit = await c.match(key || req);
    if (hit) return hit;
    throw err;
  }
};

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.endsWith('.apk')) return;
  if (url.pathname.startsWith('/api/') && url.pathname !== '/api/answers') return;
  if (req.mode === 'navigate') { e.respondWith(networkFirst(req, '/')); return; }
  if (url.pathname === '/api/answers') { e.respondWith(networkFirst(req)); return; }
  e.respondWith(caches.open(V).then(async c => {
    const hit = await c.match(req);
    const net = fetch(req).then(r => { if (r && r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
