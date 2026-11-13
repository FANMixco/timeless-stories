const CACHE_PREFIX = "memory-game-pwa-";
const CACHE_VERSION = `${CACHE_PREFIX}memory-c5fa68753e4c`;
const APP_SHELL = [
  "/memory-game.html",
  "/memory-game/js/theme.min.js?v=memory-c5fa68753e4c",
  "/memory-game/js/startup.min.js?v=memory-c5fa68753e4c",
  "/memory-game/js/pwa.min.js?v=memory-c5fa68753e4c",
  "/memory-game/manifest.webmanifest",
  "/memory-game/music/match.mp3",
  "/memory-game/music/shiny.mp3",
  "/memory-game/music/award.mp3",
  "/memory-game/music/complete.mp3",
  "/memory-game/music/gameover.mp3",
  "/memory-game/music/combo1.mp3",
  "/memory-game/music/combo5.mp3",
  "/memory-game/music/combo10.mp3",
  "/memory-game/css/icon-moon-memory.min.css?v=memory-c5fa68753e4c",
  "/memory-game/css/memory-game-impostor.min.css?v=memory-c5fa68753e4c",
  "/memory-game/css/fonts/memory-game-impostor.woff2?v=memory-c5fa68753e4c",
  "/memory-game/css/fonts/memory-game-impostor.woff?v=memory-c5fa68753e4c",
  "/memory-game/css/fonts/memory-game-impostor.ttf?v=memory-c5fa68753e4c",
  "/memory-game/css/memory-game.min.css?v=memory-c5fa68753e4c",
  "/memory-game/js/memory-game.min.js?v=memory-c5fa68753e4c",
  "/memory-game/data/memory-game-links.min.json?v=memory-c5fa68753e4c",
  "/memory-game/data/memory-game.min.json?v=memory-c5fa68753e4c",
  "/memory-game/i18n/lang-en.min.json?v=memory-c5fa68753e4c",
  "/memory-game/i18n/lang-es.min.json?v=memory-c5fa68753e4c",
  "/memory-game/i18n/lang-fr.min.json?v=memory-c5fa68753e4c",
  "/memory-game/i18n/lang-zh.min.json?v=memory-c5fa68753e4c",
  // BEGIN MEMORY MODULES
  "/memory-game/js/modules/analytics.min.js?v=memory-c5fa68753e4c",
  "/memory-game/js/modules/audio.min.js?v=memory-c5fa68753e4c",
  "/memory-game/js/modules/background-music.min.js?v=memory-c5fa68753e4c",
  "/memory-game/js/modules/collection.min.js?v=memory-c5fa68753e4c",
  "/memory-game/js/modules/dialogs.min.js?v=memory-c5fa68753e4c",
  "/memory-game/js/modules/home.min.js?v=memory-c5fa68753e4c",
  "/memory-game/js/modules/modes/classic.min.js?v=memory-c5fa68753e4c",
  "/memory-game/js/modules/modes/crazy-mirrors.min.js?v=memory-c5fa68753e4c",
  "/memory-game/js/modules/modes/impostor-glyphs.min.js?v=memory-c5fa68753e4c",
  "/memory-game/js/modules/modes/impostor.min.js?v=memory-c5fa68753e4c",
  "/memory-game/js/modules/modes/limited-moves.min.js?v=memory-c5fa68753e4c",
  "/memory-game/js/modules/modes/memory-flash.min.js?v=memory-c5fa68753e4c",
  "/memory-game/js/modules/modes/time-attack.min.js?v=memory-c5fa68753e4c",
  "/memory-game/js/modules/preview.min.js?v=memory-c5fa68753e4c",
  "/memory-game/js/modules/progress.min.js?v=memory-c5fa68753e4c",
  "/memory-game/js/modules/rules.min.js?v=memory-c5fa68753e4c",
  "/memory-game/js/modules/sharing.min.js?v=memory-c5fa68753e4c",
  "/memory-game/js/modules/spoken-countdown.min.js?v=memory-c5fa68753e4c",
  "/memory-game/js/modules/status.min.js?v=memory-c5fa68753e4c",
  "/memory-game/js/modules/storage.min.js?v=memory-c5fa68753e4c",
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
  "/memory-game/css/fonts/memory-game.woff2?v=memory-c5fa68753e4c",
  "/memory-game/css/fonts/memory-game.woff?v=memory-c5fa68753e4c",
  "/memory-game/css/fonts/memory-game.ttf?v=memory-c5fa68753e4c"
];

// The optional soundtrack is cached on first playback, outside installation.
const SOUNDTRACK = "/memory-game/music/default.ogg";

async function soundtrackResponse(event) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(SOUNDTRACK);
  if (!cached) {
    // Fetch a complete streaming response even if the media element requested a
    // range. A 200 response may ignore Range, and only complete files are cached.
    const response = await fetch(SOUNDTRACK);
    if (response.status === 200) {
      event.waitUntil(cache.put(SOUNDTRACK, response.clone()).catch(() => {}));
    }
    return response;
  }
  const range = event.request.headers.get("Range");
  if (!range) return cached;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match || (!match[1] && !match[2])) return cached;
  const body = await cached.arrayBuffer();
  const size = body.byteLength;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  const headers = new Headers(cached.headers);
  headers.set("Accept-Ranges", "bytes");
  if (start > end || start >= size) {
    headers.set("Content-Range", `bytes */${size}`);
    headers.delete("Content-Length");
    return new Response(null, { status: 416, headers });
  }
  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Content-Length", String(end - start + 1));
  return new Response(body.slice(start, end + 1), { status: 206, headers });
}

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

  if (url.pathname === SOUNDTRACK) {
    event.respondWith(soundtrackResponse(event));
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
