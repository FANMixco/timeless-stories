import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { test } from "node:test";

function fontTable(font, extension, tag) {
  const count = font.readUInt16BE(extension === "woff" ? 12 : 4);
  for (let i = 0; i < count; i++) {
    const entry = (extension === "woff" ? 44 : 12) + i * (extension === "woff" ? 20 : 16);
    if (font.toString("ascii", entry, entry + 4) !== tag) continue;
    const offset = font.readUInt32BE(entry + (extension === "woff" ? 4 : 8));
    const length = font.readUInt32BE(entry + (extension === "woff" ? 8 : 12));
    const data = font.subarray(offset, offset + length);
    return extension === "woff" && length < font.readUInt32BE(entry + 12) ? inflateSync(data) : data;
  }
  throw new Error(`Font has no ${tag} table`);
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

test("all 40 CSS mappings exist, settings is centered, and the outlined lock is selected", () => {
  const css = readFileSync("memory-game/css/icon-moon-memory.css", "utf8");
  const mappings = [...css.matchAll(/\.(icon-[\w-]+)::before\s*\{\s*content: "\\([a-f0-9]+)"/g)];
  assert.equal(mappings.length, 40);
  assert.equal(mappings.find(([, name]) => name === "icon-settings")[2], "f00c");
  assert.equal(mappings.find(([, name]) => name === "icon-lock")[2], "f00b");
  for (const extension of ["woff", "ttf"]) {
    const table = fontTable(readFileSync(`memory-game/css/fonts/memory-game.${extension}`), extension, "cmap");
    for (const [, name, hex] of mappings) assert.notEqual(glyphFor(table, parseInt(hex, 16)), 0, `${extension}: ${name}`);
  }
  const ttf = readFileSync("memory-game/css/fonts/memory-game.ttf");
  const settings = glyphFor(fontTable(ttf, "ttf", "cmap"), 0xf00c);
  const head = fontTable(ttf, "ttf", "head"), loca = fontTable(ttf, "ttf", "loca");
  const offset = head.readInt16BE(50) ? loca.readUInt32BE(settings * 4) : loca.readUInt16BE(settings * 2) * 2;
  const glyf = fontTable(ttf, "ttf", "glyf").subarray(offset);
  const hhea = fontTable(ttf, "ttf", "hhea"), hmtx = fontTable(ttf, "ttf", "hmtx");
  const advance = hmtx.readUInt16BE(Math.min(settings, hhea.readUInt16BE(34) - 1) * 4);
  assert.equal(glyf.readInt16BE(2) + glyf.readInt16BE(6), advance, "settings artwork is horizontally centered in its glyph");
  assert.equal(glyf.readInt16BE(4) + glyf.readInt16BE(8), hhea.readInt16BE(4) + hhea.readInt16BE(6), "settings artwork is vertically centered in its line box");
  assert.equal(readFileSync("memory-game/css/fonts/memory-game.woff2").toString("ascii", 0, 4), "wOF2");
  const built = readFileSync("memory-game/css/icon-moon-memory.min.css", "utf8");
  const html = readFileSync("memory-game.html", "utf8");
  const worker = readFileSync("sw.js", "utf8");
  const version = html.match(/fonts\/memory-game\.woff2\?v=([^"\s]+)/)[1];
  assert.ok(built.includes(`fonts/memory-game.woff2?v=${version}`));
  for (const extension of ["woff2", "woff", "ttf"]) assert.ok(worker.includes(`/memory-game/css/fonts/memory-game.${extension}?v=${version}`));
  assert.doesNotMatch(html, /<svg\b|icon-svg-/);
  assert.doesNotMatch(readFileSync("memory-game/css/memory-game.css", "utf8"), /img\/icons\/|data:image\/svg/);
});
