// Startup recovery stays independent of the game module graph.
// The build inserts only memoryGame.startup from the four translation files.
(() => {
  const copy = __MEMORY_STARTUP_COPY__;
  let saved;
  try { saved = window.localStorage.getItem("timelessMemoryLanguage"); } catch {}
  const requested = new URLSearchParams(window.location.search).get("lang");
  const browser = (navigator.languages?.[0] || navigator.language || "en").split("-")[0];
  const language = [requested, saved, browser, "en"].find(value => Object.hasOwn(copy, value));
  const { loading, error, retry } = copy[language];
  const panel = document.getElementById("gameStartup");
  const message = document.getElementById("gameStartupMessage");
  const button = document.getElementById("gameStartupRetry");
  const shell = document.querySelector(".game-shell");
  document.documentElement.lang = language;
  message.textContent = loading;
  button.textContent = retry;
  button.hidden = true;
  const startupTimeoutMs = 30000;
  let timeout;
  window.timelessMemoryStartup = {
    ready() {
      window.clearTimeout(timeout);
      panel.hidden = true;
      shell.hidden = false;
      shell.inert = false;
      shell.setAttribute("aria-busy", "false");
    },
    fail() {
      window.clearTimeout(timeout);
      panel.hidden = false;
      shell.hidden = true;
      shell.inert = true;
      shell.setAttribute("aria-busy", "false");
      message.textContent = error;
      button.hidden = false;
    }
  };
  document.addEventListener("error", event => {
    if (event.target?.id === "memoryGameEntry") window.timelessMemoryStartup.fail();
  }, true);
  timeout = window.setTimeout(window.timelessMemoryStartup.fail, startupTimeoutMs);
})();
