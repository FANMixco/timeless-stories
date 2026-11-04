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
export function createImpostorRound(random = Math.random) {
  const palette = impostorPalettes[Math.floor(random() * impostorPalettes.length)];
  const hue = Math.floor(random() * 360);
  const lightness = 34 + Math.floor(random() * 12);
  const border = `hsl(${hue} 18% ${lightness}%)`;
  const suspectBorder = `hsl(${hue} 18% ${lightness + (random() < .5 ? -8 : 8)}%)`;
  let suspect = null, encounters = 0, pendingShuffle = false, shuffled = false;
  let challenge = false, attempts = null, neutralized = false;
  return {
    palette, border, suspectBorder,
    get suspect() { return suspect; }, get encounters() { return encounters; },
    get challenge() { return challenge; }, get attempts() { return attempts; },
    get neutralized() { return neutralized; },
    activate(matches, remaining) {
      if (matches !== 3 || suspect) return false;
      suspect = remaining[Math.floor(random() * remaining.length)]; return true;
    },
    reveal(card, remainingCount) {
      if (card !== suspect || neutralized) return null;
      encounters++;
      if (encounters === 1) { pendingShuffle = true; return "encounter"; }
      if (encounters === 2) {
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
      if (!challenge || neutralized || !card) return null;
      if (card !== suspect) return false;
      neutralized = true; challenge = false; return true;
    },
  };
}
