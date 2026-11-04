import { classicMode } from "./modes/classic.mjs";
import { crazyMirrorsMode } from "./modes/crazy-mirrors.mjs";
import { createTimeAttackMode } from "./modes/time-attack.mjs";
import { createLimitedMovesMode } from "./modes/limited-moves.mjs";
import { memoryFlashMode } from "./modes/memory-flash.mjs";

export function buildGameModes(hard = false) {
  return Object.freeze({
    classic: classicMode,
    timeAttack: createTimeAttackMode({ hard }),
    limitedMoves: createLimitedMovesMode({ hard }),
    crazyMirrors: crazyMirrorsMode,
    memoryFlash: memoryFlashMode,
  });
}

export const challengeWarningThreshold = 5;

export function getDefeatReason(gameModes, { mode, ...round }) {
  return gameModes[mode].getDefeatReason(round);
}

export function getModeStatus(gameModes, mode, round) {
  return gameModes[mode].getStatus(round, challengeWarningThreshold);
}

export function normalizeElapsedSeconds(gameModes, mode, seconds) {
  return Math.min(seconds, gameModes[mode].seconds ?? Infinity);
}

// One clock per round, including background time. All scheduling is injected.
export function createRoundClock({ now, schedule, cancel, onTick }) {
  let startedAt = null, timer = null;
  function refresh() {
    if (startedAt !== null) onTick(Math.floor(Math.max(0, now() - startedAt) / 1000));
  }
  function stop() { if (timer !== null) cancel(timer); timer = null; }
  return {
    get running() { return timer !== null; },
    start() { if (timer !== null) return; startedAt = now(); timer = schedule(refresh, 100); },
    stop,
    reset() { stop(); startedAt = null; },
    refresh,
  };
}

function getVariantWeight(variant) {
  if (variant.weight === undefined) return 1;
  return typeof variant.weight === "number" && Number.isFinite(variant.weight) && variant.weight > 0 ? variant.weight : 0;
}

export function chooseWeightedVariant(variants, random = Math.random) {
  const total = variants.reduce((sum, variant) => sum + getVariantWeight(variant), 0);
  if (!total) return undefined;
  const roll = random() * total;
  let threshold = 0;
  return variants.find(variant => {
    threshold += getVariantWeight(variant);
    return roll < threshold;
  });
}

export function selectActivePairs({ memoryGame, selectionRules, discoveries, random = Math.random }) {
  const pairs = Array.isArray(memoryGame.pairs) ? memoryGame.pairs.map((pair) => ({ ...pair })) : [];
  const variants = Array.isArray(memoryGame.rarePairs) ? memoryGame.rarePairs : [];
  const directorsCut = variants.filter(variant => variant.pair?.rarity === "rare");
  const goldenMirrors = variants.filter(variant => variant.pair?.rarity === "ultra-rare");
  const directorsComplete = directorsCut.length > 0 && directorsCut.every(variant => discoveries.has(`${variant.pair.source}|${variant.pair.mirror}`));
  let selectedVariants;
  // Bonus rounds have two specials. Normal rounds share fixed category rates
  // from the common configuration, with at most one special pair.
  if (random() < selectionRules.bonusRoundChance && pairs.length >= 2) {
    const superRare = variants.filter(variant => variant.pair?.rarity === "ultra-rare");
    const directorsCut = variants.filter(variant => variant.pair?.rarity === "rare");
    const first = chooseWeightedVariant(random() < selectionRules.bonusDirectorChance ? directorsCut : superRare, random);
    // A source legend must occur only once on the board. Two variants of the
    // same original would otherwise overwrite each other or duplicate a source.
    const compatible = superRare.filter(variant => first &&
      variant.pair.source !== first.pair.source &&
      variant.pair.mirror !== first.pair.mirror);
    selectedVariants = [first, chooseWeightedVariant(compatible, random)].filter(Boolean);
  } else {
    const roll = random();
    const totals = variants.reduce((groups, variant) => {
      const rarity = variant.pair?.rarity;
      groups[rarity] = (groups[rarity] || 0) + getVariantWeight(variant);
      return groups;
    }, {});
    let threshold = 0;
    const selected = variants.find(variant => {
      const rarity = variant.pair?.rarity;
      // Each rarity keeps its fixed probability regardless of catalogue size.
      threshold += totals[rarity] ? (selectionRules.normalChances[rarity] || 0) * getVariantWeight(variant) / totals[rarity] : 0;
      return roll < threshold;
    });
    selectedVariants = selected?.pair ? [selected] : [];
  }

  // After completing Director's Cut, its selected pairs get the configured
  // upgrade chance (50% by default), in normal and bonus rounds alike.
  if (directorsComplete) {
    selectedVariants = selectedVariants.map((variant, index) => {
      if (variant.pair.rarity !== "rare" || random() >= selectionRules.directorUpgradeChance) return variant;
      const others = selectedVariants.filter((_, otherIndex) => otherIndex !== index);
      const compatible = goldenMirrors.filter(candidate => others.every(other =>
        candidate.pair.source !== other.pair.source && candidate.pair.mirror !== other.pair.mirror));
      return chooseWeightedVariant(compatible, random) || variant;
    });
  }

  const replaced = new Set();
  for (const variant of selectedVariants) {
    const available = pairs.map((_, index) => index).filter(index => !replaced.has(index));
    if (!available.length) break;
    const target = variant.replaceSource
      ? pairs.findIndex(pair => pair.source === variant.replaceSource) : -1;
    const index = target >= 0 && !replaced.has(target)
      ? target : available[Math.floor(random() * available.length)];
    pairs[index] = { ...variant.pair };
    replaced.add(index);
  }
  return pairs;
}


// Sattolo's shuffle moves every remaining card, preserving matched slots.
export function shuffleRemainingCards(cards, isMatched, random = Math.random) {
  const remaining = cards.filter(card => !isMatched(card));
  for (let i = remaining.length - 1; i > 0; i--) {
    const j = Math.floor(random() * i);
    [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
  }
  let index = 0;
  return cards.map(card => isMatched(card) ? card : remaining[index++]);
}
