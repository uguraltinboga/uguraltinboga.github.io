const CACHE_NAME = 'amiral-batti-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

// Sadece http/https isteklerini işle
function isValidRequest(url) {
  return url.startsWith('https://') || url.startsWith('http://');
}

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(ASSETS.map(asset => cache.add(asset)));
    })
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // chrome-extension, blob, data URL'leri yoksay
  if (!isValidRequest(e.request.url)) return;
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(resp => {
        // Sadece başarılı temel yanıtları önbellekle
        if (resp && resp.status === 200 &&
            (resp.type === 'basic' || resp.type === 'cors')) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => null);
      return cached || fetchPromise;
    })
  );
});
