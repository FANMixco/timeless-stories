import assert from "node:assert/strict";
import test from "node:test";
import { fitFoldableBoard, fitSplitFoldableBoard, watchFoldableViewport } from "../memory-game/js/modules/foldable-layout.mjs";

const rect = (left, top, right, bottom) => ({ left, top, right, bottom });

function preview() {
  const states = [];
  const queries = new Map();
  const frames = [];
  const viewport = new EventTarget();
  const window = new EventTarget();
  const documentElement = { clientWidth: 760, clientHeight: 880 };
  window.viewport = {};
  window.visualViewport = viewport;
  window.navigator = { devicePosture: new EventTarget() };
  window.matchMedia = query => {
    const media = new EventTarget();
    media.matches = false;
    queries.set(query, media);
    return media;
  };
  window.requestAnimationFrame = callback => frames.push(callback);
  watchFoldableViewport(window, { documentElement }, (pane, width, height, split) => {
    states.push({ pane, width, height, split });
  });
  return { documentElement, window, queries, states, resize() {
    window.dispatchEvent(new Event("resize"));
    viewport.dispatchEvent(new Event("resize"));
    assert.equal(frames.length, 1, "coalesce viewport changes");
    frames.shift()();
    return states.at(-1);
  } };
}

test("a device preview only uses foldable layouts while the current viewport is segmented", () => {
  const { window, documentElement, states, resize } = preview();
  assert.equal(states.at(-1).pane, null);
  const left = rect(0, 0, 370, 880);
  const right = rect(390, 0, 760, 880);
  window.viewport.segments = [right, left];
  assert.deepEqual(resize().split, [left, right]);
  assert.deepEqual(states.at(-1).pane, left);

  const top = rect(0, 0, 880, 360);
  const bottom = rect(0, 380, 880, 740);
  Object.assign(documentElement, { clientWidth: 880, clientHeight: 740 });
  window.viewport.segments = [top, bottom];
  assert.deepEqual(resize().pane, top);
  assert.equal(states.at(-1).split, null);

  for (const [width, height] of [[390, 844], [768, 1024], [1280, 800]]) {
    Object.assign(documentElement, { clientWidth: width, clientHeight: height });
    window.viewport.segments = [rect(0, 0, width, height)];
    assert.equal(resize().pane, null);
  }
  window.navigator.devicePosture.type = "folded";
  assert.equal(resize().pane, null, "posture alone supplies no usable hinge geometry");
});

test("CSS segment geometry works without the JavaScript segment API", () => {
  const { window, queries, resize } = preview();
  queries.get("(horizontal-viewport-segments: 2)").matches = true;
  window.getComputedStyle = () => ({ getPropertyValue: key => ({
    "--foldable-segment-0": "0px 0px 340px 880px",
    "--foldable-segment-1": "360px 0px 760px 880px",
  }[key]) });
  const { pane, split } = resize();
  assert.deepEqual(pane, rect(360, 0, 760, 880));
  assert.deepEqual(split, [rect(0, 0, 340, 880), pane]);
  queries.get("(horizontal-viewport-segments: 2)").matches = false;
  assert.equal(resize().pane, null);
});

test("board fitting considers height and keeps usable touch targets", () => {
  assert.deepEqual(fitFoldableBoard(20, 360, 700, 6), { columns: 4, size: 85 });
  assert.deepEqual(fitFoldableBoard(20, 600, 380, 6), { columns: 5, size: 72 });
  assert.deepEqual(fitFoldableBoard(20, 180, 300, 6), { columns: 3, size: 56 });
  assert.equal(fitSplitFoldableBoard(20, 350, 350, 750, 6).leftColumns, 2);
  const compact = fitSplitFoldableBoard(20, 350, 350, 440, 6);
  assert.equal(compact.columns, 5);
  assert.equal(compact.rows, 4);
  assert.ok(compact.size * 1.25 * compact.rows + 6 * (compact.rows - 1) <= 440);
  assert.equal(fitSplitFoldableBoard(2, 180, 180, 310, 6).leftColumns, 1);
});
