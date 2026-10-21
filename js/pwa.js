if ("serviceWorker" in navigator) {
  // This script is deferred: register as soon as the document is parsed, without
  // waiting for images, analytics, or other resources to finish loading.
  navigator.serviceWorker.register("/sw.js", {
    scope: "/memory-game.html",
    updateViaCache: "none"
  }).catch((error) => {
    console.error("Memory Game service worker registration failed:", error);
  });
}
