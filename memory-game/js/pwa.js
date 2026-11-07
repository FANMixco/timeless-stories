// Register immediately; images, analytics and the game module need not finish.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js", {
    scope: "/memory-game.html",
    updateViaCache: "none"
  }).catch(error => {
    console.error("Memory Game service worker registration failed:", error);
  });
}
