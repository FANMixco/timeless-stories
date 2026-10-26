const CACHE_PREFIX = "memory-game-pwa-";
const CACHE_VERSION = `${CACHE_PREFIX}20261026-view-records`;
const APP_SHELL = [
  "/memory-game.html",
  "/memory-game.webmanifest",
  "/music/match.mp3",
  "/music/shiny.mp3",
  "/music/award.mp3",
  "/music/complete.mp3",
  "/css/icon-moon-memory.min.css?v=20261023-shared-comparisons",
  "/css/memory-game.min.css?v=20261026-view-records",
  "/js/memory-game.min.js?v=20261026-view-records",
  "/js/pwa.min.js?v=20261021-pwa-registration",
  "/js/data/links.min.json",
  "/js/data/memory-game.min.json?v=20261026-view-records",
  "/js/i18n/memory-game/lang-en.min.json?v=20261026-view-records",
  "/js/i18n/memory-game/lang-es.min.json?v=20261026-view-records",
  "/js/i18n/memory-game/lang-fr.min.json?v=20261026-view-records",
  "/js/i18n/memory-game/lang-zh.min.json?v=20261026-view-records",
  "/img/previews/mirrors_medium.webp",
  "/img/previews/mirrors_es_medium.webp",
  "/img/previews/mirrors_fr_medium.webp",
  "/img/preview_memory.jpg",
  "/img/favicons/maskable_icon_x192.png",
  "/img/favicons/maskable_icon_x512.png",
  "/img/favicons/android-chrome-192x192.png",
  "/img/favicons/android-chrome-512x512.png",
  "/img/favicons/apple-touch-icon.png",
  "/img/favicons/favicon-32x32.png",
  "/img/favicons/favicon-16x16.png",
  "/css/fonts/icon-moon-memory.woff?20261023-special-masters",
  "/css/fonts/icon-moon-memory.ttf?20261023-special-masters"
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
        Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_VERSION).map((key) => caches.delete(key)))
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

    if (request.mode === "navigate" && new URL(request.url).pathname === "/memory-game.html") {
      return cache.match("/memory-game.html");
    }

    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin || event.request.method !== "GET") {
    return;
  }

  // Keep navigation outside the game under normal browser/network handling.
  if (event.request.mode === "navigate" && url.pathname !== "/memory-game.html") {
    return;
  }

  if (event.request.mode === "navigate" || url.pathname.endsWith(".json")) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});
