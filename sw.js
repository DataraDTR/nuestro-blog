const CACHE_NAME = 'galerias-de-amor-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/galeria.html',
    '/css/style.css',
    '/js/script.js',
    '/js/script_galeria.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js',
    'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js',
    'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js',
    'https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js',
    '/assets/android-chrome-192x192.png',
    '/assets/android-chrome-512x512.png',
    '/assets/apple-touch-icon.png',
    '/assets/favicon-16x16.png',
    '/assets/favicon-32x32.png',
    '/assets/favicon.ico',
    '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/galerias/') || url.hostname.includes('firebasestorage.googleapis.com')) {
    event.respondWith(networkFirst(event.request));
  } else {
    event.respondWith(cacheFirst(event.request));
  }
});

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  return cachedResponse || fetch(request).then(response => {
    if (response.ok) {
      caches.open(CACHE_NAME).then(cache => {
        cache.put(request, response.clone());
      });
    }
    return response;
  });
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      caches.open(CACHE_NAME).then(cache => {
        cache.put(request, networkResponse.clone());
      });
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline: No se pudo cargar el recurso.', { status: 503 });
  }
}