import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { test } from "node:test";

function cmap(font, extension) {
  const count = font.readUInt16BE(extension === "woff" ? 12 : 4);
  for (let i = 0; i < count; i++) {
    const entry = (extension === "woff" ? 44 : 12) + i * (extension === "woff" ? 20 : 16);
    if (font.toString("ascii", entry, entry + 4) !== "cmap") continue;
    const offset = font.readUInt32BE(entry + (extension === "woff" ? 4 : 8));
    const length = font.readUInt32BE(entry + (extension === "woff" ? 8 : 12));
    const data = font.subarray(offset, offset + length);
    return extension === "woff" && length < font.readUInt32BE(entry + 12) ? inflateSync(data) : data;
  }
  throw new Error("Font has no character map");
}

function glyphFor(table, code) {
  for (let i = 0; i < table.readUInt16BE(2); i++) {
    const offset = table.readUInt32BE(8 + i * 8);
    if (table.readUInt16BE(offset) !== 4) continue;
    const count = table.readUInt16BE(offset + 6) / 2;
    const ends = offset + 14, starts = ends + count * 2 + 2;
    const deltas = starts + count * 2, ranges = deltas + count * 2;
    for (let j = 0; j < count; j++) {
      const start = table.readUInt16BE(starts + j * 2), end = table.readUInt16BE(ends + j * 2);
      if (code < start || code > end) continue;
      const delta = table.readInt16BE(deltas + j * 2), range = table.readUInt16BE(ranges + j * 2);
      if (!range) return (code + delta) & 0xffff;
      const glyph = table.readUInt16BE(ranges + j * 2 + range + (code - start) * 2);
      return glyph ? (glyph + delta) & 0xffff : 0;
    }
  }
  return 0;
}

test("all 39 CSS mappings exist in both deployed font formats", () => {
  const css = readFileSync("memory-game/css/icon-moon-memory.css", "utf8");
  const mappings = [...css.matchAll(/\.(icon-[\w-]+)::before\s*\{\s*content: "\\([a-f0-9]+)"/g)];
  assert.equal(mappings.length, 39);
  for (const extension of ["woff", "ttf"]) {
    const table = cmap(readFileSync(`memory-game/css/fonts/memory-game.${extension}`), extension);
    for (const [, name, hex] of mappings) assert.notEqual(glyphFor(table, parseInt(hex, 16)), 0, `${extension}: ${name}`);
  }
  const built = readFileSync("memory-game/css/icon-moon-memory.min.css", "utf8");
  const html = readFileSync("memory-game.html", "utf8");
  const worker = readFileSync("sw.js", "utf8");
  const version = html.match(/fonts\/memory-game\.woff\?v=([^"\s]+)/)[1];
  assert.ok(built.includes(`fonts/memory-game.woff?v=${version}`));
  for (const extension of ["woff", "ttf"]) assert.ok(worker.includes(`/memory-game/css/fonts/memory-game.${extension}?v=${version}`));
  assert.doesNotMatch(html, /<svg\b|icon-svg-/);
  assert.doesNotMatch(readFileSync("memory-game/css/memory-game.css", "utf8"), /img\/icons\/|data:image\/svg/);
});
