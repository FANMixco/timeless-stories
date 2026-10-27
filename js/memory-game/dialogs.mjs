// History bookkeeping is shared by dialogs; restoreSnapshot owns game-specific layers.
export function createModalNavigation({ history, getSnapshot, restoreSnapshot, session = `${Date.now()}-${Math.random()}` }) {
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
    if (previous?.session !== session) write({ panels: [], detail: null, rarity: null });
    const depth = previous?.session === session ? previous.panels.length : 0;
    if (snapshot.panels.length < depth) {
      pending = true;
      history.go(snapshot.panels.length - depth);
    } else write(snapshot, snapshot.panels.length > depth);
  }
  function handlePopState(event) {
    if (!history) return;
    if (pending) { pending = false; sync(); return; }
    const snapshot = event.state?.[key];
    restoring = true;
    try { restoreSnapshot(snapshot?.session === session ? snapshot : { panels: [], detail: null, rarity: null }); }
    finally { restoring = false; }
    sync();
  }
  return { sync, handlePopState };
}
