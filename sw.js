/* MelodyMath — cache the demo so a school tablet survives wifi drops.
   First visit on https still needs a network. After that the listed files
   come from this cache. Bump CACHE when shipping a new set of assets. */
const CACHE = 'melodymath-offline-v2';
const ASSETS = [
  './',
  './index.html',
  './functions.html',
  './807.html',
  './landing.html',
  './manifest.webmanifest',
  './src/lib/core.js',
  './src/lib/sonify.js',
  './src/lib/adaptive.js',
  './src/lib/teacherStore.js',
  './src/lib/banks.js',
  './src/lib/worksheets.js',
  './src/lib/metro.js',
  './src/lib/access.js',
  './src/lib/graphListen.js',
  './src/lib/print.css',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k !== CACHE;
      }).map(function (k) {
        return caches.delete(k);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then(function (hit) {
      if (hit) return hit;
      return fetch(event.request).then(function (res) {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const copy = res.clone();
        caches.open(CACHE).then(function (cache) {
          cache.put(event.request, copy);
        });
        return res;
      }).catch(function () {
        if (event.request.mode === 'navigate') return caches.match('./index.html');
        return caches.match(event.request);
      });
    })
  );
});
