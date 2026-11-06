// Layers are ordered from front to back. All modal interactions use this order.
export function createModalLayers(layers) {
  let previousPanel;
  const isVisible = panel => panel.classList.contains("is-visible");
  const active = () => layers.find(layer => isVisible(layer.panel));
  return {
    active,
    isVisible,
    focusActive() { active()?.focus(); },
    closeActive() { active()?.close(); },
    sync() {
      const current = active();
      for (const { panel } of layers) {
        // A closed panel can still be fading out, but must stop accepting input.
        panel.inert = panel !== current?.panel;
        panel.setAttribute("aria-modal", String(panel === current?.panel));
      }
      // Opening/closing callbacks may focus before a covered layer becomes usable.
      if (current && current.panel !== previousPanel) current.focus();
      previousPanel = current?.panel;
      return current?.panel;
    }
  };
}

// History bookkeeping is shared by dialogs; restoreSnapshot owns game-specific layers.
export function createModalNavigation({ history, getSnapshot, restoreSnapshot, onBackToHome, session = `${Date.now()}-${Math.random()}` }) {
  const key = "timelessMemoryModals";
  let restoring = false, pending = false;
  function write(snapshot, push = false) {
    const state = { ...history.state, [key]: { session, ...snapshot } };
    history[push ? "pushState" : "replaceState"](state, "");
  }
  function sync() {
    if (!history || restoring || pending) return;
    const snapshot = getSnapshot();
    const previous = history.state?.[key];
    if (previous?.session !== session) write({ panels: [], detail: null, rarity: null, screen: snapshot.screen });
    const depth = previous?.session === session ? previous.panels.length : 0;
    if (snapshot.panels.length < depth) {
      pending = true;
      history.go(snapshot.panels.length - depth);
    } else if (snapshot.screen === "home" && previous?.session === session && previous.screen === "game") {
      pending = true;
      history.go(-1);
    } else write(snapshot, snapshot.panels.length > depth ||
      (snapshot.screen === "game" && previous?.screen !== "game"));
  }
  function handlePopState(event) {
    if (!history) return;
    if (pending) { pending = false; sync(); return; }
    const snapshot = event.state?.[key];
    const current = getSnapshot();
    if (onBackToHome && current.screen === "game" &&
        (snapshot?.session !== session || snapshot.screen === "home")) {
      // Keep a game entry beneath the confirmation so Cancel/Back stays in play.
      write(current, true);
      onBackToHome();
      return;
    }
    restoring = true;
    try { restoreSnapshot(snapshot?.session === session ? snapshot : { panels: [], detail: null, rarity: null }); }
    finally { restoring = false; }
    sync();
  }
  return { sync, handlePopState };
}
