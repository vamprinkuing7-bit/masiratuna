// Bump this string on every deploy that changes any cached file. It forces
// the browser to see sw.js as "changed", install a fresh service worker,
// and drop the old cache (see the activate handler below).
const CACHE_NAME = 'masiratuna-v2';
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

// Network-first for everything in the app shell: always try to fetch the
// latest file first (so a fresh deploy shows up the moment you're online,
// with no need to reinstall or clear anything), and only fall back to the
// cached copy if the network request fails (i.e. you're offline).
// API calls are left alone entirely — never cached, never served stale.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if(url.pathname.startsWith('/api/')){
    return; // let it hit the network / fail naturally, don't cache live data
  }
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
