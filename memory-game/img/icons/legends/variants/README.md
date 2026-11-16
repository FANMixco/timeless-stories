# Legend icon alternatives

Six independent alternatives for each SVG in the parent directory (72 variants total). Original icon IDs are the source filename stems (for example, `candle`). Variant IDs run from `<original>-v1` through `<original>-v6`.

`manifest.json` maps each original ID to its source file, source SHA-256, and six variant IDs, paths, and detail descriptions. File paths are relative to the parent `legends` directory. Each SVG also declares `id` and `data-original-icon-id` on its root element.

Variants 1–3 are the initial alternatives. Variants 4–6 carry `"difficulty": "subtle"` in the manifest and retain the original feature types while changing one local proportion or edge: an oval eye, a shorter arrowhead, or a narrower star. The difficulty field is optional; existing entries retain their original metadata. These smaller differences are intended for more challenging comparisons, but actual game difficulty needs playtesting.

Open `preview.html` to compare all originals with their alternatives at their native 32px height and an enlarged 64px height. Scroll horizontally to see all versions. The SVG files retain their original dimensions and viewBox (including the narrower music icon), `currentColor` fill, path transform, and unstroked style. Each variant modifies only one local structural feature. No external assets, fonts, scripts, or runtime dependencies are used.
