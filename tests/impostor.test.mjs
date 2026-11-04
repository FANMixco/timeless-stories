import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createImpostorRound, impostorPalettes } from '../memory-game/js/modules/modes/impostor.mjs';
import { shuffleRemainingCards } from '../memory-game/js/modules/rules.mjs';

test('seven muted palettes and independently randomized border shades', () => {
  assert.equal(impostorPalettes.length, 7);
  const borders = new Set();
  for (let index = 0; index < 7; index++) {
    const round = createImpostorRound(() => (index + .1) / 7);
    assert.equal(round.palette, impostorPalettes[index]);
    assert.notEqual(round.border, round.suspectBorder);
    borders.add(round.border);
  }
  assert.equal(borders.size, 7);
});
test('activation, persistent identity, a single derangement and neutralization', () => {
  const cards = Array.from({ length: 20 }, (_, id) => ({ id, pair: Math.floor(id / 2), rarity: id > 15 ? 'ultra-rare' : 'rare' }));
  const round = createImpostorRound(() => .4);
  assert.equal(round.activate(2, cards.slice(4)), false);
  assert.equal(round.activate(3, cards.slice(6)), true);
  const suspect = round.suspect;
  assert.equal(round.activate(3, cards.slice(6)), false);
  assert.equal(round.reveal(suspect, 14), 'encounter');
  assert.equal(round.takeShuffle(), true);
  const shuffled = shuffleRemainingCards(cards, card => card.id < 6, () => .4);
  assert.notEqual(shuffled.indexOf(suspect), cards.indexOf(suspect));
  assert.equal(round.suspect, suspect);
  assert.equal(round.takeShuffle(), false);
  assert.equal(round.reveal(suspect, 14), 'challenge');
  assert.equal(round.attempts, 3);
  assert.equal(round.blocksMatch(suspect, cards[0]), true);
  assert.equal(round.accuse(suspect), true);
  assert.equal(round.blocksMatch(suspect, cards[0]), false);
  assert.equal(round.takeShuffle(), false);
});
for (const [remaining, chances] of [[14, 3], [6, 3], [4, 2], [2, 1]]) {
  test(`${remaining} remaining cards allow exactly ${chances} unsuccessful attempts`, () => {
    const cards = Array.from({ length: remaining }, () => ({}));
    const round = createImpostorRound(() => 0);
    round.activate(3, cards);
    round.reveal(cards[0], remaining); round.takeShuffle();
    round.reveal(cards[0], remaining);
    assert.equal(round.attempts, chances);
    for (let attempt = 1; attempt <= chances; attempt++) assert.equal(round.miss(), attempt === chances);
  });
}
