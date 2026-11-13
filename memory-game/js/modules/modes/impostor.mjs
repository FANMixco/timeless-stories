import { chooseImpostorGlyph } from "./impostor-glyphs.mjs";

// Round-local identities are card objects, never positions or pair IDs.
export const impostorMode = Object.freeze({
  id: "impostor", record: Object.freeze({ key: "fewestMoves", field: "moves" }),
  getStatus({ seconds, moves }) { return { seconds, moves, timeLow: false, movesLow: false }; },
  getDefeatReason() { return null; },
});
export const impostorPalettes = Object.freeze([
  ["#cfaaaa", "#542c2c"], ["#bfaecc", "#493058"], ["#aabdd0", "#293f58"],
  ["#afc4ac", "#304a2d"], ["#d0c79e", "#514820"], ["#cfb59e", "#563a23"], ["#a5c6c2", "#244b46"],
]);
export function createImpostorRound(random = Math.random, previousVariationIndex = null, now = () => Date.now()) {
  const palette = impostorPalettes[Math.floor(random() * impostorPalettes.length)];
  const hue = Math.floor(random() * 360);
  const lightness = 34 + Math.floor(random() * 12);
  const border = `hsl(${hue} 18% ${lightness}%)`;
  let variation = null;
  let suspect = null, encounters = 0, pendingShuffle = false, shuffled = false;
  let challenge = false, attempts = null, neutralized = false;
  let deadline = null;
  const isAffected = card => Boolean(card && suspect && card.dataset.pairId === suspect.dataset.pairId);
  return {
    palette, border,
    get variation() { return variation; },
    get suspect() { return suspect; }, get encounters() { return encounters; },
    get challenge() { return challenge; }, get attempts() { return attempts; },
    get neutralized() { return neutralized; },
    get remainingSeconds() { return deadline === null ? null : Math.ceil(Math.max(0, deadline - now()) / 1000); },
    get expired() { return deadline !== null && now() >= deadline; },
    activate(matches, remaining) {
      if (matches !== 3 || suspect) return false;
      const selected = remaining[Math.floor(random() * remaining.length)];
      variation = chooseImpostorGlyph(selected?.dataset.icon, random, previousVariationIndex);
      if (!variation) return false;
      suspect = selected; return true;
    },
    isAffected,
    canAccuse(card) { return shuffled && challenge && !neutralized && isAffected(card); },
    encounterPair(a, b) {
      // Only the two legitimate partners can reveal the affected pair.
      if (neutralized || shuffled || pendingShuffle || a === b || !isAffected(a) || !isAffected(b)) return false;
      pendingShuffle = true;
      deadline = now() + 30000;
      return true;
    },
    reveal(card, remainingCount) {
      if (!shuffled || neutralized || !isAffected(card)) return null;
      encounters++;
      if (!challenge) {
        challenge = true; attempts = remainingCount >= 6 ? 3 : remainingCount === 4 ? 2 : 1;
        return "challenge";
      }
      return null;
    },
    takeShuffle() {
      if (!pendingShuffle || shuffled) return false;
      pendingShuffle = false; shuffled = true; return true;
    },
    blocksMatch(a, b) { return !neutralized && suspect !== null && (a === suspect || b === suspect); },
    miss() {
      if (!challenge || neutralized) return false;
      attempts -= 1;
      return attempts <= 0;
    },
    accuse(card) {
      if (!shuffled || !challenge || neutralized || !isAffected(card)) return null;
      if (card !== suspect) return false;
      neutralized = true; challenge = false; return true;
    },
  };
}
