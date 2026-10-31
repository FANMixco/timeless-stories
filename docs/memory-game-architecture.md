# Memory Game maintenance

The game uses native ES modules and the existing Terser/CleanCSS build. There is
no framework, runtime dependency or custom JavaScript bundler.

## Source ownership

| File | Responsibility |
| --- | --- |
| `js/memory-game.js` | Page entrypoint: wires controllers to the board, settings, collection, tutorial and dialog actions. Owns the current round and existing DOM interactions. |
| `js/memory-game/rules.mjs` | Mode registry, shared wall-clock scheduling and weighted pair selection. Randomness and scheduling can be injected for tests. |
| `js/memory-game/modes/crazy-mirrors.mjs` | Unlimited Classic counters, shuffle-after-match policy and independent best-time records. |
| `js/memory-game/modes/classic.mjs` | Unlimited counters and no defeat condition; preserves Classic record storage. |
| `js/memory-game/modes/time-attack.mjs` | The time limit, countdown/warning presentation, deadline defeat and best-time metric. |
| `js/memory-game/modes/limited-moves.mjs` | The move limit, move-counter/warning presentation, resolved-attempt defeat and fewest-moves metric. |
| `js/memory-game/storage.mjs` | Validates saved Classic/challenge statistics and records attempts/results. Preserves existing local-storage keys and reads fresh data before updates. |
| `js/memory-game/audio.mjs` | Owns AudioContext, buffers, playback channels, fades, priorities and cancellation of pending sounds. |
| `js/memory-game/background-music.mjs` | Streams the looping soundtrack after interaction, independently of effects, and pauses it when disabled or hidden. |
| `js/memory-game/progress.mjs` | Renders records, completion comparisons and achievements; owns Records/Achievements tab state and keyboard navigation. Reads application state through a supplied snapshot. |
| `js/memory-game/home.mjs` | Renders the mode selection screen and binds its five cards. Receives callbacks for starting a mode, Settings, Records and returning home; the entrypoint owns round cleanup and confirmation. |
| `js/memory-game/dialogs.mjs` | Owns browser-history synchronization, pending traversal and restoration suppression. The entrypoint supplies the game-specific dialog snapshot and restore behavior. |

Controllers receive the browser services and application callbacks they use.
They do not reach into entrypoint globals. Audio and timer resources are private
to their controller instances. Restarting stops audio, resets the clock and
cancels the pending mismatch callback before creating another board.

Each mode provides the same small policy interface: `getStatus`, `getDefeatReason`
and a record descriptor (or `null` for Classic). The shared board never branches
on a mode name to decide counters or defeat. To change a mode, edit its policy
and its localized mode description. Changing limits may require a deliberate
statistics migration because old results were earned under the previous rules.

Keep shared gameplay code in `rules.mjs`, persistence changes in `storage.mjs`, and
Progress presentation in `progress.mjs`. Board and collection presentation remain
in the entrypoint so this refactor does not rewrite existing matching behavior.

## Build and offline delivery

Run `npm run build` after changing game code, CSS, markup or translations.
`npm run minify` remains an alias for the same operation.

The build compiles `.js`, `.mjs`, CSS and JSON assets (module sources use `.mjs`
and browser outputs use `.min.js` for static-server MIME compatibility), calculates a deterministic
content version, and rewrites module imports to their versioned `.min.js` URLs.
It then updates the HTML references and service-worker precache together. Modules
and data are written before the entrypoint; HTML and service-worker references
are published last. Do not hand-edit generated asset versions or `.min.*` files.

`tools/memory-game-assets.mjs` defines version inputs and reference generation.
The precache module list is generated from the source module directory. The
version includes runtime sources, markup, translations and build configuration;
generated URLs do not change the hash on subsequent builds.

## Verification

- `npm test`: controller tests, rarity probabilities in all four languages,
  offline precache checks, build determinism and full-game integration checks.
- `npm run test:built`: the integration checks against the compiled entrypoint
  and actual compiled module imports.
- `npm run check:minified`: verifies generated files and version references
  without writing files.

Run the build before testing compiled/offline assets. The integration adapter
injects DOM, storage, scheduling and audio services while loading the real modules;
the browser loads the same ES-module graph. Tests live in the `tests/`
directory; older ignored scripts under `tools/` are not the maintained suite.

For UI changes, also inspect the local page at mobile and desktop widths. Verify
both Progress tabs, Settings scrolling, restart confirmation, and return from
records to the victory/defeat result. Behavior is documented separately in
`docs/memory-game-rules.md`.
