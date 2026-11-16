// Exported font order, verified against the supplied legend artwork.
// These are font code points, not new card identities or matching keys.
export const impostorGlyphs = Object.freeze(Object.fromEntries([
  ["wizard", 0xf000], ["tomb", 0xf006], ["routes", 0xf00c],
  ["paw", 0xf012], ["night", 0xf018], ["music", 0xf01e],
  ["masks", 0xf024], ["devil", 0xf02a], ["cry", 0xf030],
  ["crown", 0xf036], ["cross", 0xf03c], ["candle", 0xf042],
].map(([icon, start]) => [icon, Object.freeze(Array.from({ length: 6 }, (_, i) => String.fromCodePoint(start + i)))])));

export function chooseImpostorGlyph(icon, random = Math.random, previousIndex = null) {
  const glyphs = impostorGlyphs[icon];
  if (!glyphs) return null;
  const choices = glyphs.map((_, index) => index).filter(index => index !== previousIndex);
  const index = choices[Math.floor(random() * choices.length)];
  return Object.freeze({ index, glyph: glyphs[index] });
}
