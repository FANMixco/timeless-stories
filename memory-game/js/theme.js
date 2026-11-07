// Apply the launch theme before the stylesheet paints. No game-module dependencies.
(() => {
  const supported = ["system", "light", "dark"];
  const requested = new URLSearchParams(window.location.search).get("theme");
  let saved;
  try { saved = window.localStorage.getItem("timelessMemoryColorMode"); } catch {}
  const selected = [requested, saved, "system"].find(value => supported.includes(value));
  const systemDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  document.documentElement.dataset.theme = selected === "dark" || (selected === "system" && systemDark) ? "dark" : "light";
})();
