// Cami Bulucu — Service Worker
// Statik dosyaları cache'ler, Google Maps API istekleri network-first gider.

const CACHE_NAME = 'cami-bulucu-v1';
const STATIC_ASSETS = [
  '/index.html',
  '/css/style.min.css',
  '/js/main.min.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Kurulum: statik dosyaları cache'e al
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Aktivasyon: eski cache'leri temizle
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: statik → cache-first, Google API → network-first
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Google Maps / Places / Routes API — her zaman network
  if (url.includes('maps.googleapis.com') ||
      url.includes('places.googleapis.com') ||
      url.includes('routes.googleapis.com') ||
      url.includes('fonts.googleapis.com') ||
      url.includes('fonts.gstatic.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Statik dosyalar — cache-first, yoksa network
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
