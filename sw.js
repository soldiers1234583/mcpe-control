self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.open('mcpe-control').then(async (cache) => {
      try {
        const res = await fetch(e.request);
        if (e.request.url.startsWith(self.location.origin)) cache.put(e.request, res.clone());
        return res;
      } catch (err) {
        const cached = await cache.match(e.request);
        return cached || Response.error();
      }
    })
  );
});
