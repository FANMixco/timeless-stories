// The website and game use the same analytics property, with separate loaders.
export function initializeAnalytics({ window, document }) {
  function loadAnalytics() {
    if (document.getElementById("memory-game-analytics")) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", "G-L3K2NVBX01");
    const script = document.createElement("script");
    script.id = "memory-game-analytics";
    script.src = "https://www.googletagmanager.com/gtag/js?id=G-L3K2NVBX01";
    script.async = true;
    document.head.append(script);
  }

  if (window.requestIdleCallback) window.requestIdleCallback(loadAnalytics, { timeout: 1500 });
  else if (document.readyState === "complete") loadAnalytics();
  else window.addEventListener("load", loadAnalytics, { once: true });
}
