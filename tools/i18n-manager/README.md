# i18n Manager

Local JSON editor for the source files in `js/i18n`, `js/i18n/memory-game`, and `js/data`.

Run it from the repository root:

```sh
npm run i18n:manager
```

The manager prints the local URL with an available port, for example:

```txt
http://127.0.0.1:49231
```

If you need a specific port, pass one directly or use `PORT`:

```sh
node tools/i18n-manager/server.mjs 4185
```

The manager can:

- edit `js/i18n/lang-*.json`
- edit `js/i18n/memory-game/lang-*.json`
- edit `js/data/*.json`
- add a new language file from an existing language template
- validate JSON
- save pretty source JSON
- generate matching `.min.json` files
- regenerate all minified JSON files at once

## Memory Game editing

The editor supports the current Memory Game structure:

- `translations.mapLegends`: legend names, descriptions, and optional short names.
- `translations.memoryGame.comparisons`: shared comparison titles/descriptions.
  Edit these once per language; pairs reference them through `comparison` IDs.
- `pairs`: Original Mirrors. `rarePairs`: weighted Director’s Cut and Golden
  Mirror variants, including their nested `pair` objects.
- `achievements`, `settings`, `collection`, `about`, and country labels remain
  editable through the same object editor. Achievement `bonus` text is separate
  from its description and is shown only in the unlock modal.

Pair source, mirror, comparison, rarity, and replacement-source fields use
dropdowns populated from the selected file. Special-pair selectors display the
comparison and legend names rather than a generic object label.

For Memory Game files, Validate, Save, and minification check legend/comparison
references, duplicate pairs, rarity values, and positive relative selection weights.
Each special uses `weight`, not an absolute `chance`. Omitted weights default to
1, and newly added special pairs start with weight 1. There is no limit of 1 on
the sum of these relative weights.

Edit **Data → memory-game.json** to change the shared category rates for every
language. Its `normalChances` initially reserves 0.20 for Director’s Cut and 0.15
for Golden Mirrors; the remaining 0.65 is for original-only normal rounds.
Adding/removing mirrors or changing their weights does not alter those category
rates. The shared file also controls the bonus-round chance, bonus composition,
and post-Director’s-Cut upgrade chance. The manager validates probabilities as
numbers between 0 and 1 and rejects normal category totals above 1.

For example, 19 Golden Mirrors with weight 1 each share the same 15% category
chance equally. A weight of 2 receives twice the share of a weight of 1 within
that category. Mirror weights remain in the language files, so keep their
relative values consistent across languages. Consult
[the game rules](../../docs/memory-game-rules.md) before changing weights.

When adding a story, add its legend and any new shared comparison before saving
or cloning a pair that references them. Clone fills only missing fields; it does
not translate copied text or overwrite existing translations. Array cloning
preserves arrays and uses item indices, so keep pair ordering consistent across
languages. Clone earlier items first if a target array is shorter; gaps are
rejected instead of creating sparse or malformed arrays.

Save alone updates the source JSON. Use Save and minify (or the minify buttons)
before testing the game, which loads `.min.json`. The manager does not update the
game's supported-language list or service-worker/asset cache versions.
