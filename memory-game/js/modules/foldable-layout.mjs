const segmentQueries = [
  "(horizontal-viewport-segments: 2)",
  "(vertical-viewport-segments: 2)",
  "(device-posture: folded)",
];

export function foldableDialogColumns(split) {
  if (!split) return 0;
  const narrowest = Math.min(...split.map(pane => pane.right - pane.left));
  if (narrowest >= 370) return 4;
  if (narrowest >= 280) return 2;
  return 0;
}

export function watchFoldableViewport(window, document, update) {
  const root = document.documentElement;
  const queries = segmentQueries.map(query => window.matchMedia?.(query));
  const posture = window.navigator?.devicePosture;
  const visualViewport = window.visualViewport;
  let frame = null;

  function refresh() {
    frame = null;
    const width = root.clientWidth;
    const height = root.clientHeight;
    let segments = window.viewport?.segments;
    if (!(segments?.length > 1) && (queries[0]?.matches || queries[1]?.matches)) {
      // Some browsers expose segment geometry only in CSS.
      const style = window.getComputedStyle(root);
      segments = [0, 1].map(index => {
        const values = style.getPropertyValue(`--foldable-segment-${index}`).trim().split(/\s+/).map(parseFloat);
        const [left, top, right, bottom] = values;
        return { left, top, right, bottom };
      });
    }
    const panes = segments?.length > 1 ? segments.map(segment => ({
      left: Math.max(0, segment.left),
      top: Math.max(0, segment.top),
      right: Math.min(width, segment.right),
      bottom: Math.min(height, segment.bottom),
    })).filter(pane => pane.right > pane.left && pane.bottom > pane.top) : [];

    // Compact dialogs use the largest pane, even when the reported crease has no gap.
    const area = pane => (pane.right - pane.left) * (pane.bottom - pane.top);
    panes.sort((a, b) => area(b) - area(a) || a.top - b.top || a.left - b.left);
    const pane = panes.length > 1 ? panes[0] : null;
    const [left, right] = [...panes].sort((a, b) => a.left - b.left);
    const split = panes.length === 2 && left.right <= right.left &&
      left.right - left.left >= 180 && right.right - right.left >= 180 &&
      Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top) >= 200 ? [left, right] : null;
    update(pane, width, height, split);
  }

  function schedule() {
    if (frame === null) frame = window.requestAnimationFrame(refresh);
  }

  // Only current segments identify a foldable viewport. Retaining evidence
  // across resizes also misidentifies device previews in DevTools.
  if (!window.requestAnimationFrame) return;
  refresh();
  window.addEventListener("resize", schedule);
  visualViewport?.addEventListener("resize", schedule);
  posture?.addEventListener("change", schedule);
  for (const query of queries) query?.addEventListener("change", schedule);
}

export function fitFoldableBoard(count, width, height, gap) {
  if (!count || !width) return null;
  const maxColumns = Math.max(1, Math.min(count, 5, Math.floor((width + gap) / (44 + gap))));
  const columnOptions = maxColumns === 5 ? [5, 4] : [maxColumns];
  const candidates = columnOptions.map(columns => {
    const rows = Math.ceil(count / columns);
    const widthLimit = (width - (columns - 1) * gap) / columns;
    const heightLimit = (height - (rows - 1) * gap) / rows * 4 / 5;
    // Below this size the revealed faces and touch targets need room to scroll.
    const size = Math.floor(Math.min(widthLimit, 112, Math.max(64, heightLimit)));
    return { columns, size };
  });
  return candidates.reduce((best, candidate) => candidate.size > best.size * 1.05 ? candidate : best);
}

export function fitSplitFoldableBoard(count, leftWidth, rightWidth, height, gap) {
  const options = count < 5 ? [2] : [4, 5];
  function fit(columns) {
    const leftColumns = Math.floor(columns / 2);
    const rightColumns = columns - leftColumns;
    const rows = Math.ceil(count / columns);
    const widthLimit = Math.min((leftWidth - (leftColumns - 1) * gap) / leftColumns,
      (rightWidth - (rightColumns - 1) * gap) / rightColumns);
    const heightLimit = (height - (rows - 1) * gap) / rows * 4 / 5;
    const size = Math.floor(Math.min(widthLimit, count < 5 ? 144 : 132, Math.max(64, heightLimit)));
    return { columns, leftColumns, rightColumns, rows, size };
  }
  const balanced = fit(options[0]);
  if (options.length === 1) return balanced;
  const compact = fit(options[1]);
  return compact.size > balanced.size * 1.05 ? compact : balanced;
}
