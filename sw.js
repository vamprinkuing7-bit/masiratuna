const CACHE_NAME = 'masiratuna-v1';
const SHELL_FILES = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-512-maskable.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for API calls (never serve stale course data offline as if it's live),
// cache-first for the app shell itself so it still opens offline.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if(url.pathname.startsWith('/api/')){
    return; // let it hit the network / fail naturally, don't cache live data
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
