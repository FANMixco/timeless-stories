const CACHE_VERSION = "memory-game-pwa-20260523";
const APP_SHELL = [
  "/memory-game.html",
  "/memory-game.webmanifest",
  "/css/poppins.min.css",
  "/css/icon-moon-memory.min.css",
  "/css/memory-game.min.css?v=20260523-modal-icon-size",
  "/js/memory-game.min.js?v=20260523-split-i18n",
  "/js/pwa.min.js",
  "/js/data/links.min.json",
  "/js/i18n/memory-game/lang-en.min.json",
  "/js/i18n/memory-game/lang-es.min.json",
  "/js/i18n/memory-game/lang-fr.min.json",
  "/js/i18n/memory-game/lang-zh.min.json",
  "/img/preview_memory.jpg",
  "/img/favicons/android-chrome-192x192.png",
  "/img/favicons/android-chrome-512x512.png",
  "/img/favicons/apple-touch-icon.png",
  "/img/favicons/favicon-32x32.png",
  "/img/favicons/favicon-16x16.png",
  "/css/fonts/icomoon.woff",
  "/css/fonts/icomoon-memory.woff"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_VERSION);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    if (request.mode === "navigate") {
      return cache.match("/memory-game.html");
    }

    throw error;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_VERSION);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin || event.request.method !== "GET") {
    return;
  }

  if (event.request.mode === "navigate" || url.pathname.endsWith(".json")) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});
