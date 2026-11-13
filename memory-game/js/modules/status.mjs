// Keep the status nodes stable, including their screen-reader live regions.
export function createStatusView({ document, formatTime }) {
  const get = id => document.getElementById(id);
  const timeStatus = get("timeStatus");
  const movesStatus = get("movesStatus");
  const grid = document.querySelector(".status-grid");
  const movesLabel = document.querySelector('[data-ui-label="moves"]');
  const timeLabel = document.querySelector('[data-ui-label="time"]');
  const movesValue = get("movesValue");
  const matchesValue = get("matchesValue");
  const timeValue = get("timeValue");
  function text(element, value) {
    const next = String(value);
    if (element.textContent !== next) element.textContent = next;
  }
  function attribute(element, name, value) {
    if (element.getAttribute(name) !== value) element.setAttribute(name, value);
  }
  function toggle(element, name, value) {
    const next = Boolean(value);
    if (element.classList.contains(name) !== next) element.classList.toggle(name, next);
  }
  return {
    render({ mode, config, status, copy, matches, pairCount, impostorPending }) {
      toggle(timeStatus, "is-priority", mode === "timeAttack" || status.countdown);
      toggle(movesStatus, "is-priority", mode === "limitedMoves" || mode === "memoryFlash");
      text(movesLabel, config.maxMistakes != null ? copy.modes.memoryFlash.mistakesRemaining : copy.moves);
      text(timeLabel, status.timeLabel ?? (config.previewSeconds ? copy.modes.memoryFlash.preview : copy.time));
      if (timeStatus.hidden !== Boolean(status.hideTime)) timeStatus.hidden = Boolean(status.hideTime);
      toggle(grid, "is-untimed", status.hideTime);
      attribute(movesValue, "aria-live", config.maxMistakes != null ? "polite" : "off");
      attribute(timeValue, "aria-live", config.previewSeconds ? "polite" : "off");
      text(movesValue, status.moves);
      text(matchesValue, `${matches}/${pairCount}`);
      toggle(matchesValue, "is-impostor-pending", impostorPending);
      text(timeValue, formatTime(status.seconds));
      toggle(timeValue, "is-running-low", status.timeLow);
      toggle(movesValue, "is-running-low", status.movesLow);
    },
  };
}
