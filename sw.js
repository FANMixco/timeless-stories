const CACHE_PREFIX = "memory-game-pwa-";
const CACHE_VERSION = `${CACHE_PREFIX}memory-9ec7bd20c323`;
const APP_SHELL = [
  "/memory-game.html",
  "/memory-game/manifest.webmanifest",
  "/memory-game/music/default.ogg",
  "/memory-game/music/match.mp3",
  "/memory-game/music/shiny.mp3",
  "/memory-game/music/award.mp3",
  "/memory-game/music/complete.mp3",
  "/memory-game/music/gameover.mp3",
  "/memory-game/music/combo1.mp3",
  "/memory-game/music/combo5.mp3",
  "/memory-game/music/combo10.mp3",
  "/memory-game/css/icon-moon-memory.min.css?v=memory-9ec7bd20c323",
  "/memory-game/css/memory-game.min.css?v=memory-9ec7bd20c323",
  "/memory-game/js/memory-game.min.js?v=memory-9ec7bd20c323",
  "/memory-game/data/memory-game-links.min.json?v=memory-9ec7bd20c323",
  "/memory-game/data/memory-game.min.json?v=memory-9ec7bd20c323",
  "/memory-game/i18n/lang-en.min.json?v=memory-9ec7bd20c323",
  "/memory-game/i18n/lang-es.min.json?v=memory-9ec7bd20c323",
  "/memory-game/i18n/lang-fr.min.json?v=memory-9ec7bd20c323",
  "/memory-game/i18n/lang-zh.min.json?v=memory-9ec7bd20c323",
  // BEGIN MEMORY MODULES
  "/memory-game/js/modules/analytics.min.js?v=memory-9ec7bd20c323",
  "/memory-game/js/modules/audio.min.js?v=memory-9ec7bd20c323",
  "/memory-game/js/modules/background-music.min.js?v=memory-9ec7bd20c323",
  "/memory-game/js/modules/dialogs.min.js?v=memory-9ec7bd20c323",
  "/memory-game/js/modules/home.min.js?v=memory-9ec7bd20c323",
  "/memory-game/js/modules/modes/classic.min.js?v=memory-9ec7bd20c323",
  "/memory-game/js/modules/modes/crazy-mirrors.min.js?v=memory-9ec7bd20c323",
  "/memory-game/js/modules/modes/impostor.min.js?v=memory-9ec7bd20c323",
  "/memory-game/js/modules/modes/limited-moves.min.js?v=memory-9ec7bd20c323",
  "/memory-game/js/modules/modes/memory-flash.min.js?v=memory-9ec7bd20c323",
  "/memory-game/js/modules/modes/time-attack.min.js?v=memory-9ec7bd20c323",
  "/memory-game/js/modules/preview.min.js?v=memory-9ec7bd20c323",
  "/memory-game/js/modules/progress.min.js?v=memory-9ec7bd20c323",
  "/memory-game/js/modules/rules.min.js?v=memory-9ec7bd20c323",
  "/memory-game/js/modules/spoken-countdown.min.js?v=memory-9ec7bd20c323",
  "/memory-game/js/modules/storage.min.js?v=memory-9ec7bd20c323",
  // END MEMORY MODULES
  "/memory-game/img/previews/mirrors_medium.webp",
  "/memory-game/img/previews/mirrors_es_medium.webp",
  "/memory-game/img/previews/mirrors_fr_medium.webp",
  "/memory-game/img/background-mg-warm.svg",
  "/memory-game/img/background-mg-dark.svg",
  "/memory-game/img/preview_memory.jpg",
  "/memory-game/img/favicons/maskable_icon_x192.png",
  "/memory-game/img/favicons/maskable_icon_x512.png",
  "/memory-game/img/favicons/android-chrome-192x192.png",
  "/memory-game/img/favicons/android-chrome-512x512.png",
  "/memory-game/img/favicons/shortcut-classic.png",
  "/memory-game/img/favicons/shortcut-time-attack.png",
  "/memory-game/img/favicons/shortcut-limited-moves.png",
  "/memory-game/img/favicons/apple-touch-icon.png",
  "/memory-game/img/favicons/favicon-32x32.png",
  "/memory-game/img/favicons/favicon-16x16.png",
  "/memory-game/css/fonts/memory-game.woff2?v=memory-9ec7bd20c323",
  "/memory-game/css/fonts/memory-game.woff?v=memory-9ec7bd20c323",
  "/memory-game/css/fonts/memory-game.ttf?v=memory-9ec7bd20c323"
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

  if (event.request.mode !== "navigate" && !APP_SHELL.some(asset =>
    new URL(asset, self.location.origin).pathname === url.pathname)) {
    return;
  }

  if (event.request.mode === "navigate" || url.pathname.endsWith(".json")) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});
