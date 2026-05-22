const CACHE_VERSION = "timeless-stories-pwa-20260522";
const APP_SHELL = [
  "/",
  "/index.html",
  "/memory-game.html",
  "/site.webmanifest",
  "/css/main.min.css?v=20260519-hero-inset",
  "/css/book.min.css",
  "/css/poppins.min.css",
  "/css/icon-moon.min.css",
  "/css/icon-moon-memory.min.css",
  "/css/memory-game.min.css?v=20260522-memory-icons",
  "/js/main.min.js?v=20260513-bootstrap-modal",
  "/js/translations.min.js?v=20260514-link-registry",
  "/js/map.min.js",
  "/js/memory-game.min.js?v=20260522-memory-icons",
  "/js/data/links.min.json",
  "/js/i18n/lang-en.min.json",
  "/js/i18n/lang-es.min.json",
  "/js/i18n/lang-fr.min.json",
  "/js/i18n/lang-zh.min.json",
  "/img/logo.png",
  "/img/logo-full.png",
  "/img/preview.jpg",
  "/img/preview_memory.jpg",
  "/img/cover-colorized-v2-sm.jpg",
  "/img/cover-colorized-v2-sm.webp",
  "/img/cover-colorized-v2-sm-es.jpg",
  "/img/cover-colorized-v2-sm-es.webp",
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
      return cache.match("/index.html");
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
