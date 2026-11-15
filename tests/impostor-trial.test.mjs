import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createImpostorTrial, impostorTrialStorageKey } from '../memory-game/js/modules/impostor-trial.mjs';

function store(saved = new Map()) {
  return { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) };
}

test('trial controls live in Impostor details, leaving the home card unchanged', () => {
  const html = readFileSync('memory-game.html', 'utf8');
  const homeCard = html.slice(html.indexOf('<button type="button" id="impostorBookGate"'), html.indexOf('<button class="home-card" id="home-impostor"'));
  assert.match(homeCard, /id="homeSixthMirrorStatus"/);
  assert.doesNotMatch(homeCard, /impostorTrialButton|impostorTrialRemaining/);
  const details = html.slice(html.indexOf('id="modeDetailsPanel"'), html.indexOf('id="winPanel"'));
  assert.match(details, /id="impostorTrialControls" hidden/);
  assert.ok(details.indexOf('id="impostorTrialButton"') < details.indexOf('id="homeSixthMirrorBook"'));
});

test('two trial rounds persist across visits and stale tabs cannot grant another round', () => {
  const saved = new Map();
  const storage = store(saved);
  const first = createImpostorTrial({ getStorage: () => storage });
  const otherTab = createImpostorTrial({ getStorage: () => storage });
  assert.equal(first.remaining(), 2);
  assert.equal(first.consume(), true);
  assert.equal(otherTab.remaining(), 1);
  assert.equal(otherTab.consume(), true);
  assert.equal(first.remaining(), 0);
  assert.equal(first.consume(), false);
  assert.equal(createImpostorTrial({ getStorage: () => storage }).remaining(), 0);
  assert.deepEqual([...saved], [[impostorTrialStorageKey, '2']]);
});

test('malformed counters and unavailable storage never create unlimited trials', () => {
  for (const value of ['', '-1', '3', 'Infinity', 'NaN', '{}', '1.5']) {
    const trial = createImpostorTrial({ getStorage: () => store(new Map([[impostorTrialStorageKey, value]])) });
    assert.equal(trial.remaining(), 0);
    assert.equal(trial.consume(), false);
  }
  for (const storage of [
    { getItem() { throw Error('blocked'); } },
    { getItem() { return null; }, setItem() { throw Error('full'); } },
  ]) {
    const trial = createImpostorTrial({ getStorage: () => storage });
    assert.equal(trial.consume(), false);
    assert.equal(trial.remaining(), null);
  }
});
