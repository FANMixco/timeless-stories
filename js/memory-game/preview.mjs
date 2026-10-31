// A wall-clock countdown. Canceled callbacks cannot affect later rounds.
export function createPreviewCountdown({ now, schedule, cancel, onTick, onComplete }) {
  let deadline = null, timer = null, generation = 0;
  function pause() { if (timer !== null) cancel(timer); timer = null; generation++; }
  function reset() { pause(); deadline = null; }
  function refresh() {
    if (deadline === null) return;
    const remaining = Math.max(0, Math.ceil((deadline - now()) / 1000));
    onTick(remaining);
    if (remaining === 0) { reset(); onComplete(); }
  }
  function resume() {
    if (deadline === null || timer !== null) return;
    refresh();
    if (deadline === null) return;
    const current = generation;
    timer = schedule(() => { if (current === generation) refresh(); }, 100);
  }
  return {
    start(seconds) { reset(); deadline = now() + seconds * 1000; resume(); },
    cancel: reset, pause, resume, refresh,
  };
}
