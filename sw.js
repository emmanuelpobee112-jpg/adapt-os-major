const CACHE_NAME = 'adapt-os-offline-v4';

// Install - save core files
self.addEventListener('install', e => {
 self.skipWaiting();
 e.waitUntil(
  caches.open(CACHE_NAME).then(cache => {
   return cache.addAll([
    './',
    './index.html',
    './manifest.json',
    './logo.png',
    './logo.png'
   ]);
  })
 );
});

// Activate - clean old cache
self.addEventListener('activate', e => {
 e.waitUntil(
  caches.keys().then(keys => {
   return Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
  })
 );
 self.clients.claim();
});

// Fetch - THIS makes it work without data
self.addEventListener('fetch', e => {
 // Don't cache chrome extensions or external APIs
 if (!e.request.url.startsWith(self.location.origin)) return;
 
 e.respondWith(
  caches.match(e.request).then(cached => {
   // 1. If we have it in cache, return it (works offline!)
   if (cached) return cached;
   
   // 2. If not, fetch from internet AND save it for next time offline
   return fetch(e.request).then(response => {
    return caches.open(CACHE_NAME).then(cache => {
     cache.put(e.request, response.clone());
     return response;
    });
   }).catch(() => {
    // 3. If offline and it's a page, show index.html
    if (e.request.mode === 'navigate') {
     return caches.match('./index.html');
    }
   });
  })
 );
});