// Offline-ready static assets. Increment CACHE_VERSION when publishing a new version.
const CACHE_VERSION = 'time-lens-gold-v1';
const ASSETS = [
  './', './index.html', './styles.css', './app.js', './manifest.webmanifest',
  './assets/favicon.png', './assets/apple-touch-icon.png',
  './assets/time-lens-logo.png', './assets/icon-192.png',
  './assets/icon-512.png', './assets/icon-maskable-512.png',
  './assets/hero.webp', './assets/old-era.webp', './assets/middle-era.webp',
  './assets/new-era.webp', './assets/ramses.webp'
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok) {
      const clone = response.clone();
      caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
    }
    return response;
  })));
});
