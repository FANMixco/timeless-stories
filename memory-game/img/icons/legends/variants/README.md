# Legend icon alternatives

Three independent alternatives for each SVG in the parent directory. Original icon IDs are the source filename stems (for example, `candle`). Variant IDs use `<original>-v1`, `<original>-v2`, and `<original>-v3`.

`manifest.json` maps each original ID to its source file, source SHA-256, and three variant IDs, paths, and detail descriptions. File paths are relative to the parent `legends` directory. Each SVG also declares `id` and `data-original-icon-id` on its root element.

Open `preview.html` to compare all originals with their alternatives. The preview enlarges icons for inspection; the SVG files retain their original dimensions and viewBox (including the narrower music icon), `currentColor` fill, path transform, and unstroked style. Each variant modifies only one local structural feature. No external assets, fonts, scripts, or runtime dependencies are used.
