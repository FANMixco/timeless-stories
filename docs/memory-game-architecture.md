# Memory Game maintenance

The game uses native ES modules and the existing Terser/CleanCSS build. There is
no framework, runtime dependency or custom JavaScript bundler.

Runtime assets live together under `memory-game/`: `js/` (entrypoint and
`modules/`), `css/` (including the game icon fonts), `data/`, `i18n/`, `img/`,
`music/`, and `manifest.webmanifest`. The public page stays at `/memory-game.html`
and the worker stays at `/sw.js` to preserve existing links, installed-app identity,
scope, and worker updates. The manifest uses root-relative artwork paths.
The shared translation editor routes game data and translations to this folder.

The `memory-game` icon font has 40 glyphs. Its class/code-point mappings live in
`memory-game/css/icon-moon-memory.css`; WOFF2, WOFF and TTF files live in `css/fonts/`.
The outlined lock uses `f00b`, the filled alternative uses `f004`, and the
centered settings glyph uses `f00c` (the old `f002` is no longer in the font).
The build versions the font URLs together with the preload and offline cache,
including the font binary contents in the version. SVG originals remain in
`img/icons/` as font-source artwork and are not downloaded by the game.

## Source ownership

| File | Responsibility |
| --- | --- |
| `memory-game/js/memory-game.js` | Page entrypoint: wires controllers to the board, settings, collection, tutorial and dialog actions. Owns the current round and existing DOM interactions. |
| `memory-game/js/modules/rules.mjs` | Mode registry, shared wall-clock scheduling and weighted pair selection. Randomness and scheduling can be injected for tests. |
| `memory-game/js/modules/modes/crazy-mirrors.mjs` | Unlimited Classic counters, shuffle-after-match policy and independent Classic-style personal records. |
| `memory-game/js/modules/modes/classic.mjs` | Unlimited counters and no defeat condition; preserves Classic record storage. |
| `memory-game/js/modules/modes/time-attack.mjs` | The time limit, countdown/warning presentation, deadline defeat and best-time metric. |
| `memory-game/js/modules/modes/limited-moves.mjs` | The move limit, move-counter/warning presentation, resolved-attempt defeat and fewest-moves metric. |
| `memory-game/js/modules/modes/memory-flash.mjs` | Seven-second preview, three-mistake allowance, untimed status and fourth-mistake defeat policy. |
| `memory-game/js/modules/preview.mjs` | Injected wall-clock preview countdown, cancellation tokens and page-hide/resume handling. |
| `memory-game/js/modules/storage.mjs` | Validates saved Classic/challenge statistics and records attempts/results. Preserves existing local-storage keys and reads fresh data before updates. |
| `memory-game/js/modules/audio.mjs` | Owns AudioContext, buffers, playback channels, fades, priorities and cancellation of pending sounds. |
| `memory-game/js/modules/background-music.mjs` | Streams the looping soundtrack after interaction, independently of effects, and pauses it when disabled or hidden. |
| `memory-game/js/modules/progress.mjs` | Renders records, completion comparisons and achievements; owns Records/Achievements tab state and keyboard navigation. Reads application state through a supplied snapshot. |
| `memory-game/js/modules/home.mjs` | Renders the mode selection screen and binds its six mode cards. Receives callbacks for starting a mode, Settings, Records and returning home; the entrypoint owns round cleanup and confirmation. |
| `memory-game/js/modules/dialogs.mjs` | Owns browser-history synchronization and modal priority, focus, dismissal and inert layers. The entrypoint supplies the game-specific callbacks, snapshot and restore behavior. |

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

## Website boundary

The website launches the game with `lang=en|es|fr|zh` and
`theme=system|light|dark` query parameters. All website launch links include
`embed=1`; the modal loads its iframe only when opened. Website theme changes update launch links rather
than sending messages into a running game.

The game stores language and theme under `timelessMemoryLanguage` and
`timelessMemoryColorMode`. It does not read the website's preference keys.
Other existing game progress keys are preserved. Reset removes only
`timelessMemory*` data and notifies other game tabs through
`timelessMemoryResetVersion`; website and third-party storage are untouched.

Game translations, links, rules, styling, modules, analytics initialization and
offline cache are independent of the website's application files. Book-preview
artwork and favicons use game-owned copies under `memory-game/img/`.
`memory-game/js/modules/analytics.mjs` owns the game's deferred analytics loader while
retaining the website's measurement ID. This separation does not create a
different origin or analytics property.

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

All twelve dialog cards share `.dialog-card`, `.dialog-header`, and `.dialog-body`.
The header owns the title and close control; only the focusable body scrolls.
Card widths, mobile full-screen variants, theme colors, and bottom padding remain
with their existing variants. Progress-tab scroll resets target `.dialog-body`.
When adding a modal, use this structure so its header stays visible on short
screens and its bottom actions remain reachable without a second scrollbar.

## Impostor Mode and planned book access

`modes/impostor.mjs` owns round-local suspect identity, encounters, one-shot
shuffle requests, identification chances and neutralization. The entrypoint
uses the existing card nodes, Sattolo shuffle, match/combo effects, challenge
records, discoveries and achievements. The round palette overrides every
rarity/category style only inside `.board.is-impostor`.

The repository does not yet contain a book verification service. Normal access
fails closed unless the future trusted host provider supplies
`window.timelessMemoryEntitlements = { book: true }` before the entrypoint loads.
This is an integration seam, not purchase verification or a security boundary.
Saved mode preferences, achievements and launch URLs cannot grant book access.
Replace the host seam with verified entitlement results when the provider ships.
The temporary About-image testing exception below must be removed at that point.

## Temporary Impostor playtest access

**MUST REMOVE before the book-entitlement release / end of user testing.**
This is a temporary testing shortcut, not an unlock or purchase verification.

In About, click or tap the book/device preview image three times, with no more
than 600 ms between taps. This starts an Impostor round in the current page.
An existing round uses the normal restart confirmation before being replaced.
The shortcut does not grant book entitlement, change `isModeUnlocked`, write a
saved mode preference, reveal the Impostor home card, or expose Impostor records.
Results may be saved through the normal game systems; locked records remain
hidden. Restart can repeat testing rounds; Home restores the saved unlocked
mode, and reloading does not retain testing access.

Removal checklist (search for `TEMPORARY IMPOSTOR PLAYTEST`):

- Remove `pendingImpostorPlaytest`, the About-image tap counters,
  `handleAboutBookPlaytestTap`, `startImpostorPlaytest`, and the image listener.
- Remove the temporary pending action from modal snapshots, restart
  confirmation/cancellation, `newGame`, and `confirmRestartAction`.
- Remove the temporary `#aboutBookImage` touch/selection CSS and `draggable`
  override if no other image interaction needs them.
- Remove the playtest-specific integration cases and this section.
- Verify that only the verified book entitlement can start Impostor and expose
  its home card and records. Keep the normal entitlement check intact.

The saved-mode fallback on Home can remain as defensive handling for a mode
whose entitlement is no longer available.
