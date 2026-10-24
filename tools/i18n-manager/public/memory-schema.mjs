// Shared by the browser editor and its save API.
export function memoryGameErrors(json) {
  const errors = [];
  const translations = json?.translations;
  const game = translations?.memoryGame;
  const legends = translations?.mapLegends;
  const text = value => typeof value === "string" && value.trim().length > 0;
  if (!game || typeof game !== "object" || Array.isArray(game) || !legends || typeof legends !== "object" || Array.isArray(legends)) return ["Memory Game requires translations.memoryGame and translations.mapLegends objects."];
  for (const [id, legend] of Object.entries(legends)) {
    if (!text(legend?.name) || !text(legend?.desc)) errors.push(`mapLegends.${id}: name and desc are required.`);
  }
  const comparisons = game.comparisons && typeof game.comparisons === "object" && !Array.isArray(game.comparisons) ? game.comparisons : {};
  if (comparisons !== game.comparisons) errors.push("memoryGame.comparisons must be an object of shared comparisons.");
  for (const [id, comparison] of Object.entries(comparisons)) {
    if (!text(comparison?.title) || !text(comparison?.description)) errors.push(`comparisons.${id}: title and description are required.`);
  }
  const seen = new Set();
  function checkPair(pair, path, special) {
    if (!pair || typeof pair !== "object" || Array.isArray(pair)) {
      errors.push(`${path}: expected a pair object.`);
      return;
    }
    for (const key of ["source", "mirror"]) {
      if (!Object.hasOwn(legends, pair[key])) errors.push(`${path}.${key}: unknown legend '${pair[key] ?? ""}'.`);
    }
    if (!Object.hasOwn(comparisons, pair.comparison)) errors.push(`${path}.comparison: unknown shared comparison '${pair.comparison ?? ""}'.`);
    if ("insight" in pair || "insightTitle" in pair) errors.push(`${path}: use a shared comparison ID instead of inline insight/insightTitle.`);
    if (special ? !["rare", "ultra-rare"].includes(pair.rarity) : Boolean(pair.rarity)) {
      errors.push(`${path}.rarity: ${special ? "choose rare or ultra-rare" : "Original Mirrors must not have a special rarity"}.`);
    }
    const id = `${pair.source}|${pair.mirror}`;
    if (seen.has(id)) errors.push(`${path}: duplicate pair '${id}'.`);
    seen.add(id);
  }
  if (!Array.isArray(game.pairs)) errors.push("memoryGame.pairs must be an array.");
  else game.pairs.forEach((pair, index) => checkPair(pair, `pairs[${index}]`, false));
  if (!Array.isArray(game.rarePairs)) errors.push("memoryGame.rarePairs must be an array.");
  else game.rarePairs.forEach((variant, index) => {
    const path = `rarePairs[${index}]`;
    checkPair(variant?.pair, `${path}.pair`, true);
    if (variant?.weight !== undefined && (typeof variant.weight !== "number" || !Number.isFinite(variant.weight) || variant.weight <= 0)) {
      errors.push(`${path}.weight must be a positive number (default: 1).`);
    }
    if (variant && "chance" in variant) errors.push(`${path}: use relative weight instead of chance; category rates live in js/data/memory-game.json.`);
    if (variant?.replaceSource && (!Array.isArray(game.pairs) || !game.pairs.some(pair => pair?.source === variant.replaceSource))) {
      errors.push(`${path}.replaceSource: choose a source from the Original Mirrors.`);
    }
  });
  return errors;
}

export function assertSelectionRules(rules) {
  const values = [rules?.normalChances?.rare, rules?.normalChances?.["ultra-rare"], rules?.bonusRoundChance, rules?.bonusDirectorChance, rules?.directorUpgradeChance];
  if (!values.every(value => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1)) {
    throw new Error("Selection probabilities must be numbers between 0 and 1.");
  }
  if (values[0] + values[1] > 1) throw new Error("Normal-round rarity probabilities total more than 1 (100%).");
}

export function assertMemoryGame(json) {
  const errors = memoryGameErrors(json);
  if (errors.length) throw new Error(errors.slice(0, 10).join("\n"));
}

export function setMissingPath(root, path, value) {
  if (!Array.isArray(path) || !path.length) throw new Error("Clone path is required.");
  if (path.some(part => !/^[\w.-]+$/.test(String(part)) || ["__proto__", "prototype", "constructor"].includes(String(part)))) {
    throw new Error("Clone path contains an invalid key.");
  }
  let cursor = root;
  for (let index = 0; index < path.length; index++) {
    const part = path[index];
    if (!cursor || typeof cursor !== "object") throw new Error("Clone path crosses an existing scalar value.");
    if (Array.isArray(cursor) && (!/^\d+$/.test(String(part)) || Number(part) > cursor.length)) {
      throw new Error("Clone the preceding array items first; sparse arrays are not supported.");
    }
    if (index === path.length - 1) {
      if (Object.hasOwn(cursor, part)) return false;
      cursor[part] = structuredClone(value);
      return true;
    }
    if (!Object.hasOwn(cursor, part)) cursor[part] = /^\d+$/.test(String(path[index + 1])) ? [] : {};
    cursor = cursor[part];
  }
}
