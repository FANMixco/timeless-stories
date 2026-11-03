const CACHE_PREFIX = "memory-game-pwa-";
const CACHE_VERSION = `${CACHE_PREFIX}memory-cf2881c0ca7f`;
const APP_SHELL = [
  "/memory-game.html",
  "/memory-game.webmanifest",
  "/music/default.ogg",
  "/music/match.mp3",
  "/music/shiny.mp3",
  "/music/award.mp3",
  "/music/complete.mp3",
  "/music/gameover.mp3",
  "/music/combo1.mp3",
  "/music/combo5.mp3",
  "/music/combo10.mp3",
  "/css/icon-moon-memory.min.css?v=memory-cf2881c0ca7f",
  "/css/memory-game.min.css?v=memory-cf2881c0ca7f",
  "/js/memory-game.min.js?v=memory-cf2881c0ca7f",
  "/js/data/memory-game-links.min.json?v=memory-cf2881c0ca7f",
  "/js/data/memory-game.min.json?v=memory-cf2881c0ca7f",
  "/js/i18n/memory-game/lang-en.min.json?v=memory-cf2881c0ca7f",
  "/js/i18n/memory-game/lang-es.min.json?v=memory-cf2881c0ca7f",
  "/js/i18n/memory-game/lang-fr.min.json?v=memory-cf2881c0ca7f",
  "/js/i18n/memory-game/lang-zh.min.json?v=memory-cf2881c0ca7f",
  // BEGIN MEMORY MODULES
  "/js/memory-game/analytics.min.js?v=memory-cf2881c0ca7f",
  "/js/memory-game/audio.min.js?v=memory-cf2881c0ca7f",
  "/js/memory-game/background-music.min.js?v=memory-cf2881c0ca7f",
  "/js/memory-game/dialogs.min.js?v=memory-cf2881c0ca7f",
  "/js/memory-game/home.min.js?v=memory-cf2881c0ca7f",
  "/js/memory-game/modes/classic.min.js?v=memory-cf2881c0ca7f",
  "/js/memory-game/modes/crazy-mirrors.min.js?v=memory-cf2881c0ca7f",
  "/js/memory-game/modes/limited-moves.min.js?v=memory-cf2881c0ca7f",
  "/js/memory-game/modes/memory-flash.min.js?v=memory-cf2881c0ca7f",
  "/js/memory-game/modes/time-attack.min.js?v=memory-cf2881c0ca7f",
  "/js/memory-game/preview.min.js?v=memory-cf2881c0ca7f",
  "/js/memory-game/progress.min.js?v=memory-cf2881c0ca7f",
  "/js/memory-game/rules.min.js?v=memory-cf2881c0ca7f",
  "/js/memory-game/spoken-countdown.min.js?v=memory-cf2881c0ca7f",
  "/js/memory-game/storage.min.js?v=memory-cf2881c0ca7f",
  // END MEMORY MODULES
  "/img/memory-game/previews/mirrors_medium.webp",
  "/img/memory-game/previews/mirrors_es_medium.webp",
  "/img/memory-game/previews/mirrors_fr_medium.webp",
  "/img/background-mg-warm.svg",
  "/img/background-mg-dark.svg",
  "/img/memory-game/preview_memory.jpg",
  "/img/memory-game/favicons/maskable_icon_x192.png",
  "/img/memory-game/favicons/maskable_icon_x512.png",
  "/img/memory-game/favicons/android-chrome-192x192.png",
  "/img/memory-game/favicons/android-chrome-512x512.png",
  "/img/memory-game/favicons/shortcut-classic.png",
  "/img/memory-game/favicons/shortcut-time-attack.png",
  "/img/memory-game/favicons/shortcut-limited-moves.png",
  "/img/memory-game/favicons/apple-touch-icon.png",
  "/img/memory-game/favicons/favicon-32x32.png",
  "/img/memory-game/favicons/favicon-16x16.png",
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
