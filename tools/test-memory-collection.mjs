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
const links = JSON.parse(fs.readFileSync('js/data/links.json', 'utf8'));
async function load(storage = sharedStorage) {
  const elements = new Map();
  const get = id => { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); };
  const document = { getElementById: get, querySelector: get, createElement: tag => new Element(tag), createTextNode: text => text, documentElement: get('html'), addEventListener() {} };
  const window = { localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, v) => storage.set(key, v) }, location: { search: '', href: 'https://example.test/memory-game.html' }, addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }), setTimeout() {}, clearTimeout() {}, setInterval() {}, clearInterval() {} };
  const context = vm.createContext({ document, window, navigator: { language: 'en' }, URL, URLSearchParams, console, fetch: async url => ({ json: async () => url.includes('links') ? links : data }) });
  vm.runInContext(source, context);
  await new Promise(resolve => setImmediate(resolve));
  return { run: code => vm.runInContext(code, context), get };
}
let page = await load();
assert.equal(page.get('collectionButton').hidden, true, 'collection starts hidden');
assert.equal(page.get('viewLegendsButton').textContent, 'View all legends', 'completion dialog keeps its text button');
assert.equal(sharedStorage.has('timelessMemoryCollection'), false, 'starting a game grants nothing');
const solve = `for (const pairId of new Set(deck.map(card => card.pairId))) {
  flipCard(createCard(deck.find(card => card.pairId === pairId), 0));
  flipCard(createCard(deck.filter(card => card.pairId === pairId)[1], 1));
}`;
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
assert.equal(page.run('getMirrorCatalogue().length'), 16);
page.run('openCollection()');
assert.equal(page.get('collectionProgress').value, 10);
assert.equal(page.get('collectionProgress').max, 16);
const groups = page.get('collectionGroups').children;
assert.deepEqual(groups.map(group => group.children[1].children.length), [10, 2, 4]);
assert.equal(groups[1].children[1].children[0].disabled, true);
assert.equal(groups[1].children[1].children[0].children[1].textContent, '???');
assert.equal(groups[1].children[1].children[0].children[2].textContent, '🇸🇻 · ❓');
const discovered = groups[0].children[1].children[0];
discovered.listeners.click();
assert.equal(page.get('legendsList').children.length, 1, 'discovered details reuse comparison renderer');
assert.equal(page.get('legendsPanelTitle').hidden, true, 'single preview omits the visible heading');
assert.equal(page.get('legendsPanelTitle').textContent, 'The Cave of Salamanca', 'dialog retains an accessible name');
assert.equal(page.get('legendsFooter').hidden, true, 'single preview hides purchase and rarity sections');
assert.equal(page.get('collectionPanel').style.display, 'none');
page.run('closeLegendsPanel()');
assert.equal(page.get('collectionPanel').style.display, '');
assert.equal(page.get('legendsPanelTitle').textContent, data.translations.memoryGame.legendsTitle);
assert.equal(page.get('legendsPanelTitle').hidden, false, 'full legends view restores its heading');
assert.equal(page.get('legendsFooter').hidden, false, 'full legends view restores its footer');
page.run('memoryGame.pairs.push({source:"futureSource", mirror:"futureMirror"}); renderCollection()');
assert.equal(page.get('collectionProgress').max, 17, 'future catalogue additions appear automatically');
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
