// Exported font order, verified against the supplied legend artwork.
// These are font code points, not new card identities or matching keys.
export const impostorGlyphs = Object.freeze(Object.fromEntries([
  ["wizard", 0xf000], ["tomb", 0xf003], ["routes", 0xf006],
  ["paw", 0xf009], ["night", 0xf00c], ["music", 0xf00f],
  ["masks", 0xf012], ["devil", 0xf015], ["cry", 0xf018],
  ["crown", 0xf01b], ["cross", 0xf01e], ["candle", 0xf021],
].map(([icon, start]) => [icon, Object.freeze(Array.from({ length: 3 }, (_, i) => String.fromCodePoint(start + i)))])));

export function chooseImpostorGlyph(icon, random = Math.random, previousIndex = null) {
  const glyphs = impostorGlyphs[icon];
  if (!glyphs) return null;
  const choices = [0, 1, 2].filter(index => index !== previousIndex);
  const index = choices[Math.floor(random() * choices.length)];
  return Object.freeze({ index, glyph: glyphs[index] });
}
