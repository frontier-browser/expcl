const CACHE_NAME = 'frontier-os-v6-core';
const DYNAMIC_CACHE = 'frontier-os-v6-dynamic';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'icon.png',
  'icon-512.png',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js'
];

// 1. Install event: Cache essential enterprise assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// 2. Activate event: Clean up legacy caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.filter(name => name !== CACHE_NAME && name !== DYNAMIC_CACHE)
                .map(name => caches.delete(name))
    ))
  );
  self.clients.claim();
});

// 3. Fetch event: Stale-while-revalidate for maximum UI speed
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request).then((networkResponse) => {
        // Dynamically cache successful read-only requests
        if (event.request.method === 'GET' && networkResponse.status === 200) {
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
      // Return cached response instantly, while silently updating it in the background
      return cachedResponse || networkFetch;
    })
  );
});
