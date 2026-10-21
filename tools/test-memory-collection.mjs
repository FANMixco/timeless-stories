import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise the production completion and collection code with a small DOM adapter.
class Element {
  constructor(tag = '') {
    this.tag = tag; this.children = []; this.dataset = {}; this.style = {};
    this.attributes = {}; this.listeners = {}; this.textContent = ''; this.hidden = false;
    const classes = new Set();
    this.classList = { add: (...v) => v.forEach(x => classes.add(x)), remove: (...v) => v.forEach(x => classes.delete(x)), contains: v => classes.has(v), toggle: (v, on) => on ? classes.add(v) : classes.delete(v) };
  }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k]; }
  toggleAttribute(k, on) { if (on) this.attributes[k] = ''; else delete this.attributes[k]; }
  addEventListener(k, fn) { this.listeners[k] = fn; }
  focus() {}
}
const source = fs.readFileSync('js/memory-game.js', 'utf8');
const sharedStorage = new Map([['timelessMemoryIntroSeen', 'true']]);
const data = JSON.parse(fs.readFileSync('js/i18n/memory-game/lang-en.json', 'utf8'));
const newMirrors = ['nakk', 'huldra', 'kludde', 'jolasveinar', 'monacello', 'perchta', 'karakoncolos', 'churel'];
for (const language of ['en', 'es', 'fr', 'zh']) {
  const localized = JSON.parse(fs.readFileSync(`js/i18n/memory-game/lang-${language}.json`, 'utf8')).translations;
  const golden = localized.memoryGame.rarePairs.filter(item => item.pair.rarity === 'ultra-rare');
  assert.equal(golden.length, 12);
  assert.ok(Math.abs(golden.reduce((sum, item) => sum + item.chance, 0) - 0.15) < 1e-12, 'Golden Mirrors share a 15% chance');
  assert.ok(Math.abs(localized.memoryGame.rarePairs.filter(item => item.pair.rarity === 'rare').reduce((sum, item) => sum + item.chance, 0) - 0.2) < 1e-12, 'Director’s Cut shares a 20% chance');
  assert.ok(Math.abs(localized.memoryGame.rarePairs.reduce((sum, item) => sum + item.chance, 0) - 0.35) < 1e-12, 'standard rounds have a 35% chance of a special');
  for (const mirror of newMirrors) {
    const variant = golden.find(item => item.pair.mirror === mirror);
    assert.ok(variant?.chance > 0, `${language}: ${mirror} can appear`);
    assert.ok(localized.mapLegends[mirror]?.desc, `${language}: ${mirror} has a description`);
    assert.equal(variant.replaceSource, variant.pair.source);
    assert.equal(variant.pair.insightTitle, localized.memoryGame.pairs.find(pair => pair.source === variant.pair.source).insightTitle);
  }
}
const links = JSON.parse(fs.readFileSync('js/data/links.json', 'utf8'));
async function load(storage = sharedStorage) {
  const runtimeData = structuredClone(data);
  const elements = new Map();
  const get = id => { if (!elements.has(id)) { const element = new Element(); element.id = id; elements.set(id, element); } return elements.get(id); };
  const windowListeners = {};
  const documentListeners = {};
  const entries = [null];
  let index = 0;
  const history = {
    get state() { return entries[index]; },
    get index() { return index; },
    get length() { return entries.length; },
    replaceState(state) { entries[index] = structuredClone(state); },
    pushState(state) { entries.splice(index + 1); entries.push(structuredClone(state)); index++; },
    go(delta) { setImmediate(() => { index = Math.max(0, Math.min(entries.length - 1, index + delta)); windowListeners.popstate?.({state: entries[index]}); }); }
  };
  const document = { getElementById: get, querySelector: get, createElement: tag => new Element(tag), createTextNode: text => text, documentElement: get('html'), addEventListener(type, handler) { documentListeners[type] = handler; } };
  const window = { history, localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, v) => storage.set(key, v) }, location: { search: '', href: 'https://example.test/memory-game.html' }, addEventListener(type, handler) { windowListeners[type] = handler; }, matchMedia: () => ({ matches: false, addEventListener() {} }), setTimeout() {}, clearTimeout() {}, setInterval() {}, clearInterval() {} };
  const context = vm.createContext({ document, window, navigator: { language: 'en' }, URL, URLSearchParams, console, fetch: async url => ({ json: async () => url.includes('links') ? links : runtimeData }) });
  vm.runInContext(source, context);
  await new Promise(resolve => setImmediate(resolve));
  return { run: code => vm.runInContext(code, context), get, history, documentListeners, windowListeners };
}
let page = await load();
assert.equal(page.get('collectionButton').hidden, true, 'collection starts hidden');
assert.equal(page.get('viewLegendsButton').textContent, 'View all legends', 'completion dialog keeps its text button');
assert.equal(sharedStorage.has('timelessMemoryCollection'), false, 'starting a game grants nothing');
const solve = `for (const pairId of new Set(deck.map(card => card.pairId))) {
  flipCard(createCard(deck.find(card => card.pairId === pairId), 0));
  flipCard(createCard(deck.filter(card => card.pairId === pairId)[1], 1));
}`;
for (const mirror of newMirrors) {
  const storage = new Map([['timelessMemoryIntroSeen', 'true']]);
  const runtime = await load(storage);
  const index = data.translations.memoryGame.rarePairs.findIndex(item => item.pair.mirror === mirror);
  const variants = data.translations.memoryGame.rarePairs;
  const roll = variants.slice(0, index).reduce((sum, item) => sum + item.chance, 0) + variants[index].chance / 2;
  runtime.run(`{ let rolls = [0.5, ${roll}]; Math.random = () => rolls.shift() ?? 0.5; } newGame();`);
  assert.equal(runtime.run(`activePairs.some(pair => pair.mirror === '${mirror}')`), true, `${mirror} is selected through the existing probability logic`);
  assert.equal(runtime.run('activePairs.length'), 10);
  assert.equal(storage.has('timelessMemoryCollection'), false);
  runtime.run(solve);
  assert.equal(runtime.run(`discoveries.has(getMirrorId(activePairs.find(pair => pair.mirror === '${mirror}')))`), true);
  assert.ok(runtime.run(`getOriginFlag('${variants[index].pair.mirrorOrigin}')`).length > 0);
  const reloaded = await load(storage);
  assert.equal(reloaded.run(`discoveries.has('${variants[index].pair.source}|${mirror}')`), true, `${mirror} discovery survives reload`);
}
page.run(`activePairs = memoryGame.pairs.map(pair => ({...pair})); deck = buildDeck();`);
page.run(`flipCard(createCard(deck[0], 0)); flipCard(createCard(deck[1], 1));`);
assert.equal(sharedStorage.has('timelessMemoryCollection'), false, 'a match grants nothing before completion');
page.run('newGame(); activePairs = memoryGame.pairs.map(pair => ({...pair})); deck = buildDeck();');
page.run(solve);
assert.equal(page.get('collectionButton').hidden, false);
assert.equal(JSON.parse(sharedStorage.get('timelessMemoryCollection')).length, 10);
page = await load();
assert.equal(page.get('collectionButton').hidden, false, 'collection remains available after a fresh page load');
assert.equal(page.run('discoveries.size'), 10);
assert.equal(page.run('getMirrorCatalogue().length'), 24);
page.run('openCollection()');
assert.equal(page.get('collectionProgress').value, 10);
assert.equal(page.get('collectionProgress').max, 24);
const groups = page.get('collectionGroups').children;
assert.equal(groups[2].children[0].textContent, 'Online exclusive mirrors');
assert.equal(page.get('collectionSubmit').href, links.shared.contact.englishContactForm);
assert.deepEqual(groups.map(group => group.children[1].children.length), [10, 2, 12]);
assert.equal(groups[1].children[1].children[0].disabled, true);
assert.equal(groups[1].children[1].children[0].children[1].textContent, '???');
assert.equal(groups[1].children[1].children[0].children[2].textContent, '🇸🇻 · ❓');
const discovered = groups[0].children[1].children[0];
assert.equal(discovered.children[1].textContent, 'The Devil', 'collection cards display comparison categories');
discovered.listeners.click();
assert.equal(page.get('legendsList').children.length, 1, 'discovered details reuse comparison renderer');
assert.equal(page.get('legendsPanelTitle').hidden, true, 'single preview omits the visible heading');
assert.equal(page.get('legendsPanelTitle').textContent, 'The Cave of Salamanca', 'dialog retains an accessible name');
assert.equal(page.get('legendsFooter').hidden, false, 'single preview includes the existing book link');
assert.equal(page.get('legendsRarityNote').hidden, true, 'single preview hides the rarity note');
assert.equal(page.get('collectionPanel').classList.contains('is-visible'), true, 'collection stays open beneath details');
assert.equal(page.get('legendsPanel').classList.contains('is-collection-detail'), true, 'details use the overlay layer');
assert.equal(page.get('collectionPanel').inert, true, 'background collection does not receive interaction');
page.run('closeLegendsPanel()');
assert.equal(page.get('collectionPanel').classList.contains('is-visible'), true);
assert.equal(page.get('collectionPanel').inert, false);
assert.equal(page.get('legendsPanel').classList.contains('is-collection-detail'), false);
assert.equal(page.get('legendsPanelTitle').textContent, data.translations.memoryGame.legendsTitle);
assert.equal(page.get('legendsPanelTitle').hidden, false, 'full legends view restores its heading');
assert.equal(page.get('legendsFooter').hidden, false, 'full legends view restores its footer');
for (const language of ['es', 'en', 'fr', 'zh']) {
  page.run(`currentLanguage = '${language}'; renderCollection();`);
  assert.equal(page.get('collectionSubmit').href, language === 'es' ? links.shared.contact.spanishContactForm : links.shared.contact.englishContactForm);
}
page.run('memoryGame.pairs.push({source:"futureSource", mirror:"futureMirror"}); renderCollection()');
assert.equal(page.get('collectionProgress').max, 25, 'future catalogue additions appear automatically');
assert.equal(page.get('collectionProgress').value, 10);
page = await load(new Map([['timelessMemoryIntroSeen', 'true']]));
page.run('activePairs = memoryGame.pairs.map(pair => ({...pair})); activePairs[0] = memoryGame.rarePairs[0].pair; deck = buildDeck();');
page.run(solve);
page.run('openCollection()');
assert.equal(page.run('discoveries.has(getMirrorId(memoryGame.rarePairs[0].pair))'), true, 'rare result unlocks its exact comparison');
assert.equal(page.run('discoveries.has(getMirrorId(memoryGame.pairs[0]))'), false, 'an absent original remains locked');
const lockedOriginal = page.get('collectionGroups').children[0].children[1].children[0];
assert.equal(lockedOriginal.disabled, true);
assert.equal(lockedOriginal.children[2].textContent, '🇸🇻 · 🇪🇸', 'locked originals retain both country flags');
page = await load(new Map([['timelessMemoryCollection', '{broken'], ['timelessMemoryIntroSeen', 'true']]));
assert.equal(page.get('collectionButton').hidden, true, 'corrupt saved progress does not crash initialization');
console.log('Passed: completion-only discoveries, reload persistence, locked cards, details, future additions, and corrupt storage.');

// Model asynchronous browser traversal, including close/open before popstate.
const settle = () => new Promise(resolve => setImmediate(resolve));
page = await load();
page.run('gameCompleted = true; openLegendsPanel();');
assert.equal(page.history.index, 1);
page.run('openLegendsPanel()');
assert.equal(page.history.index, 1, 'opening an already visible panel adds no entry');
page.history.go(-1);
await settle();
assert.equal(page.get('legendsPanel').classList.contains('is-visible'), false, 'Back dismisses legends');
assert.equal(page.get('html').classList.contains('is-modal-open'), false);
page.history.go(1);
await settle();
assert.equal(page.get('legendsPanel').classList.contains('is-visible'), true, 'Forward restores legends');
page.run('closeLegendsPanel()');
await settle();
assert.equal(page.history.index, 0, 'close button consumes the modal entry');
page.run('openCollection()');
const collectionIndex = page.history.index;
const collectionCard = page.get('collectionGroups').children[0].children[1].children[0];
collectionCard.listeners.click();
assert.equal(page.history.index, collectionIndex + 1);
page.history.go(-1);
await settle();
assert.equal(page.get('collectionPanel').classList.contains('is-visible'), true);
assert.equal(page.get('collectionPanel').inert, false);
assert.equal(page.get('legendsPanel').classList.contains('is-visible'), false);
page.history.go(1);
await settle();
assert.equal(page.get('legendsPanel').classList.contains('is-collection-detail'), true);
assert.equal(page.get('collectionPanel').inert, true);
page.run('closeLegendsPanel(); closeCollection();');
await settle();
await settle();
assert.equal(page.history.index, 0, 'rapid closes consume every modal entry');
page.run('openCollection(); openRarityPanel("rare", collectionButton);');
page.history.go(-1);
await settle();
assert.equal(page.get('rarityPanel').classList.contains('is-visible'), false);
assert.equal(page.get('collectionPanel').inert, false);
assert.equal(page.get('html').classList.contains('is-modal-open'), true);
page.run('closeCollection(); openCollection();');
await settle();
assert.equal(page.history.index, 1, 'reopening while Back is pending retains one entry');
page.run('closeCollection()');
await settle();
page.run('winPanel.classList.add("is-visible"); syncModalScrollLock(); openLegendsPanel(); openRarityPanel();');
assert.equal(page.history.index, 3);
for (const panel of ['rarityPanel', 'legendsPanel', 'winPanel']) {
  page.history.go(-1);
  await settle();
  assert.equal(page.get(panel).classList.contains('is-visible'), false, `Back dismisses ${panel}`);
}
assert.equal(page.history.index, 0);
page.run('openLegendsPanel()');
page.documentListeners.keydown({ key: 'Escape' });
await settle();
assert.equal(page.history.index, 0, 'Escape consumes its entry');
page.run('winPanel.classList.add("is-visible"); syncModalScrollLock(); newGame();');
await settle();
assert.equal(page.history.index, 0, 'Play again removes completion history');
page.history.go(1);
await settle();
assert.equal(page.get('winPanel').classList.contains('is-visible'), false, 'Forward does not show an old win during a new round');
console.log('Passed: modal Back/Forward, nested layers, rapid closes, reopen, Escape, and Play again.');

for (const mode of [0.25, 0.75]) {
  const storage = new Map([['timelessMemoryIntroSeen', 'true']]);
  const runtime = await load(storage);
  runtime.run(`{ let rolls = [0.005, ${mode}, 0.45, 0.6]; Math.random = () => rolls.shift() ?? 0.5; } newGame();`);
  assert.equal(runtime.run('activePairs.filter(pair => pair.rarity).length'), 2);
  assert.equal(runtime.run('deck.length'), 20);
  assert.equal(storage.has('timelessMemoryCollection'), false, 'bonus rounds do not grant discoveries early');
  runtime.run(solve);
  assert.equal(JSON.parse(storage.get('timelessMemoryCollection')).length, 10);
  assert.equal(runtime.run('activePairs.every(pair => discoveries.has(getMirrorId(pair)))'), true, 'both specials unlock on completion');
}
console.log('Passed: both two-special combinations are playable and save all discoveries on completion.');

page = await load(new Map([['timelessMemoryIntroSeen', 'true']]));
for (const event of ['pageshow', 'focus', 'visibilitychange']) {
  const dispatch = () => event === 'visibilitychange'
    ? (page.run('document.visibilityState = "visible"'), page.documentListeners.visibilitychange())
    : page.windowListeners[event]({ persisted: true });
  page.get('html').classList.add('is-modal-open');
  const previousIndex = page.history.index;
  const previousLength = page.history.length;
  dispatch();
  assert.equal(page.get('html').classList.contains('is-modal-open'), false, `${event} clears a stale lock when no dialog is visible`);
  for (const panel of ['winPanel', 'legendsPanel', 'rarityPanel', 'collectionPanel']) {
    page.get(panel).classList.add('is-visible');
    dispatch();
    assert.equal(page.get('html').classList.contains('is-modal-open'), true, `${event} retains the lock for ${panel}`);
    page.get(panel).classList.remove('is-visible');
    dispatch();
    assert.equal(page.get('html').classList.contains('is-modal-open'), false);
  }
  assert.equal(page.history.index, previousIndex, 'resuming does not traverse modal history');
  assert.equal(page.history.length, previousLength, 'resuming does not push modal history');
}
page.run('matchInsight.classList.add("is-visible"); refreshModalScrollLock();');
assert.equal(page.get('html').classList.contains('is-modal-open'), false, 'a match description never locks the game');
console.log('Passed: return from links, cached-page restore, visible dialogs, and match descriptions refresh scroll locks without changing history.');

page.run(`
  window.scrollTo = options => { window.lastScroll = options; };
  collectionPanel.classList.add("is-visible");
  legendsPanel.classList.add("is-visible", "is-collection-detail");
  collectionPanel.inert = true;
  modalDetailPair = memoryGame.pairs[0];
  syncModalScrollLock();
`);
page.get('newGameButton').listeners.click();
assert.equal(page.run('window.lastScroll.top'), 0, 'New game returns to the top of the board');
assert.equal(page.get('html').classList.contains('is-modal-open'), false, 'New game releases the scroll lock');
assert.equal(page.get('collectionPanel').inert, false);
assert.equal(page.run('modalPanels.some(panel => panel.classList.contains("is-visible"))'), false);
assert.equal(page.run('modalDetailPair'), null);
await settle();
await settle();
page.get('playAgainButton').listeners.click();
assert.equal(page.run('window.lastScroll.top'), 0, 'Play again also resets scrolling');
console.log('Passed: New game and Play again clear nested modal state and reset the board scroll position.');
