# Memory Game rules

Reference for the implemented behavior as of October 27, 2026. This document
describes the game; it does not change its behavior.

## Game modes and attempts

Settings offers three modes, with Classic as the default for new and existing
players. The selection persists in `timelessMemoryMode`. Changing modes starts a
fresh round and asks for confirmation when a round is in progress.

- **Classic:** the original unlimited game. Moves and time count upwards.
- **Time Attack:** match all ten pairs before 45 seconds expire. The existing
  Time counter starts at `0:45`; the first card selection starts the countdown.
  It uses elapsed wall-clock time, including time spent in dialogs, other tabs
  or backgrounded applications. Resuming checks the deadline before accepting
  another selection.
- **25-Move Challenge:** match all ten pairs within 25 attempts involving two cards.
  Matching and mismatching attempts each consume one move. The existing Moves
  counter shows `used/25`. The final allowed attempt is resolved before deciding
  the outcome: completing the board on move 25 wins; any other result loses.

Defeats stop gameplay and show the reason, matches and moves. Try Again restarts
the same mode; View Records opens the Records tab and closing it returns to the
defeat result. Settings allows changing modes. Previously saved discoveries and
achievements remain intact. Unfinished boards, including defeats, add no new
discoveries or victory achievements. Successful challenge boards use the usual
discovery and achievement logic, but never update Classic personal records.

All three modes share the record-card layout in Progress → Records.
Challenge statistics appear separately for each challenge, using `timelessMemoryChallenges:v1`. Each first card selection
counts exactly one attempt. Restarting, changing mode, reloading or leaving an
unfinished round keeps that attempt without adding a victory or defeat. Therefore
attempts can exceed victories plus defeats. Win percentage is victories divided
by attempts, rounded to a whole percent, or 0% without attempts. Only victories
can improve Time Attack's best completion time or 25-Move Challenge’s fewest moves.

New games clear the interval and pending mismatch callback. Time Attack checks
the deadline on timer ticks, card selections, visibility changes and page resume.
The last five remaining seconds or moves highlight their counter in red with an
exclamation mark. Classic has no extra mode label on the board. Mobile Settings
uses the full screen, while the defeat dialog remains compact and centered.
No board is restored across reloads; saved mode, statistics and collections persist.

## Card categories and matching

| Collection group | Internal rarity | Current number of pairs |
| --- | --- | ---: |
| Original Mirrors | No rarity | 10 |
| Director’s Cut | `rare` | 2 |
| Online exclusive mirrors / Golden Mirrors | `ultra-rare` | 18 |

Every round has 10 pairs / 20 cards. Special pairs replace original pairs rather
than adding cards. The cards are shuffled after the pairs have been selected.
Matching uses the generated pair ID. Names, flags, and rarity do not determine
whether two cards match.

## When special cards appear

Selection happens when a new game starts. There are two branches:

- **Normal round: 99% chance.** Within this branch, there is a 65% chance of
  Original Mirrors only, a 20% chance of one Director’s Cut pair, and a 15%
  chance of one Golden Mirror pair.
- **Bonus round: 1% chance.** Within this branch, there is a 50% chance of one
  Director’s Cut plus one Golden Mirror, and a 50% chance of two Golden Mirrors.

The 65/20/15 figures apply to normal rounds, not all rounds combined.

### Which special pair is chosen

The overall probabilities are stored once in `js/data/memory-game.json`, shared
by all languages and editable in the i18n manager under **Data → memory-game.json**:

```json
{
  "normalChances": { "rare": 0.2, "ultra-rare": 0.15 },
  "bonusRoundChance": 0.01,
  "bonusDirectorChance": 0.5,
  "directorUpgradeChance": 0.5
}
```

Each entry in a language file’s `rarePairs` uses a relative `weight`. New entries
default to weight 1, including when that field is omitted. The selector
automatically calculates each entry’s share of its category:

`entry probability in a normal round = category chance × weight / category weight total`

Adding a mirror or changing a weight redistributes only that category’s share;
it does not change the category’s total probability. For example, adding a 19th
equally weighted Golden Mirror gives each one 1/19 of the same 15% normal-round
Golden chance. To change the overall category chances deliberately, edit the
shared data file. Keep individual mirror weights consistent across languages.

- Selection is random and weighted. Undiscovered cards receive **no preference**.
  A player can encounter the same special many times before collecting the rest.
- All 18 Golden Mirrors have equal configured weights, sharing the normal-round
  15% Golden Mirror probability.
- The two Director’s Cut pairs have different weights: Aisha Qandisha has one
  third of the Director’s Cut weight; Xana has two thirds.
- In bonus rounds, the second special must have a different Salvadoran source
  and a different mirror from the first. Selection is weighted among the
  compatible candidates. The same compatibility rule applies to substitutions.

### Bonus after completing Director’s Cut

Once every currently available Director’s Cut pair is saved in the collection
(currently both stories), each selected Director’s Cut pair gets an additional
50/50 roll:

- 50%: keep the Director’s Cut pair.
- 50%: substitute a Golden Mirror, chosen randomly from compatible candidates.

This applies to both normal and bonus rounds. It does not favor unseen Golden
Mirrors, and it does not change rounds that selected no Director’s Cut.

For the current catalogue, the resulting probabilities across **all rounds** are:

| Round contents | Before completing Director’s Cut | After completing Director’s Cut |
| --- | ---: | ---: |
| Original Mirrors only | 64.35% | 64.35% |
| One Director’s Cut | 19.80% | 9.90% |
| One Golden Mirror | 14.85% | 24.75% |
| One Director’s Cut + one Golden Mirror | 0.50% | 0.25% |
| Two Golden Mirrors | 0.50% | 0.75% |

Eligibility is based on saved collection data, including progress from another
tab. Merely revealing or matching both stories in an unfinished game does not
qualify. The earned achievement alone is not the eligibility check: if another
Director’s Cut story is added, that story must also be collected for the boost.

## Discoveries and persistence

- Discoveries are saved **only after the entire board is completed**. An
  unfinished or abandoned game adds nothing to the collection.
- Completion saves every pair present in that round, including special pairs.
  An original pair replaced by a special is not collected in that round.
- Each discovery is identified by `source|mirror`, so different variants of a
  Salvadoran legend are separate collection entries.
- Collection totals include all available original and special pairs, currently
  30. Totals are calculated from the current catalogue; new content can lower
  the displayed completion percentage.

## Sound rules

The special chime marks a **new discovery**, not simply a match with rare cards.

| Event | Sound |
| --- | --- |
| Match an Original Mirror pair | `music/match.mp3` |
| Match an already collected special pair | `music/match.mp3` |
| Match a Director’s Cut pair not yet saved in the collection | `music/shiny.mp3` at normal pitch |
| Match a Golden Mirror pair not yet saved in the collection | `music/shiny.mp3` at 1.25× playback rate, producing a brighter pitch |
| Match the final pair, regardless of rarity or discovery status | `music/complete.mp3`, replacing the pair’s usual sound |
| Lose a Time Attack or 25-Move Challenge challenge | `music/gameover.mp3` by ejah_music from Pixabay |
| Display a newly unlocked achievement | `music/award.mp3` |

Consequences worth remembering:

- Matching a Director’s Cut pair first in a round still plays the normal sound
  if that exact pair is already in the saved collection.
- A new special can play its discovery chime in an unfinished game without
  becoming permanently collected. Completing the board is still required.
- Clicking an already matched card does not play another match sound.

### Sound priority and synchronization

- There is no playback queue or accumulating backlog.
- A new ordinary match replaces the previous ordinary match with a 75 ms fade.
- A special discovery interrupts ordinary match audio. Ordinary matches do not
  interrupt an active or loading discovery chime. Another discovery can replace it.
- Victory immediately supersedes gameplay sounds, including effects still
  loading. The final pair does not also play a match or discovery effect.
- Achievement audio starts with its unlock modal. While it plays, victory audio
  is reduced to 25% volume, then restored. Rapidly advancing achievement modals
  replaces the previous reward melody with a short fade.
- Muting, starting a new game, or backgrounding the page stops all active,
  fading, and pending sounds. Superseded effects cannot play when loading finishes.
- Audio initializes after player interaction. Sounds are enabled by default,
  and the sound preference persists across visits and synchronizes across tabs.
  Tutorial demonstrations do not play match effects.

## Achievements

| Achievement | Unlock requirement |
| --- | --- |
| Legendary Collector | Collect every currently available Original Mirror. |
| First Victory | Complete a board. Existing valid discoveries also prove a previous win. |
| Lightning Memory | Complete a board in strictly less than 30 seconds. Exactly 30 seconds does not qualify. |
| Golden Discovery | Collect the first Golden Mirror. |
| Behind the Scenes | Collect the first Director’s Cut story. |
| Director’s Cut Master | Collect every currently available Director’s Cut story, currently two. |
| Golden Collector | Collect every currently available Golden Mirror. |
| Master Collector | Collect every currently available original and special pair. |

Achievements and unlock dates persist. Each achievement unlocks and notifies
only once. Simultaneous notifications are shown sequentially, with Legendary
Collector first. The increased Golden Mirror chance message appears only in the
Director’s Cut Master unlock modal, not its collection-list description.

Previously earned achievements remain earned when new stories are added. New
players must meet completion requirements against the expanded catalogue.
Existing saved discoveries can establish collection achievements, but they
cannot establish a historical completion time for Lightning Memory.

The Progress button becomes available after an achievement is earned or a
challenge attempt is started, so statistics remain accessible before the first win.

## Personal records and performance

The Achievements modal shows best time and fewest moves for the current pair
count, plus overall completed games and pairs matched. Records are separate from
the eight achievements and use the versioned `timelessMemoryRecords:v1` local
storage key. Existing discoveries cannot establish historical performance.

Only successful completion updates records, once per round. Restarting or
abandoning a game adds nothing. Time and move records update independently;
equal results do not earn record notifications. Rarity substitutions follow the
same gameplay rules and share records for the same pair count.

Congratulations shows time and moves separately from its completion message.
Each metric compares with the personal best for the same configuration before
that game, with the best value explicitly labeled. A new record labels that
reference as the previous best. Reopening the result keeps the same comparison;
the last completed game is still saved but is not the comparison baseline.
Notifications identify improvements to all-time personal bests. The first
completed game establishes initial records without showing comparison indicators.
Records persist across refreshes and PWA reopenings when local storage is available.
The Congratulations modal's **View Records** link opens Achievements at the top
of Personal Records. Closing it returns to the completion result and its link.

Settings includes **Reset all game data**, with a visible warning and a separate
confirmation. Confirming clears all local storage for this website and this tab's
session storage, including collections, achievements, records, language, theme,
sound/tip preferences and tutorial progress, then reloads into a fresh game.
Other open game tabs discard their in-memory progress and reload when they receive
the storage-clear event. Canceling changes nothing. Offline application assets
remain cached so the installed PWA can still open offline.

## Tips and mobile messages

- On screens wider than 640 px, **Use short card names** in Settings switches
  card labels immediately without restarting the round. Full names remain the
  default. The preference persists and synchronizes across open game tabs.
  Cards without a translated short name keep their full name. Mobile always
  uses the existing short labels and does not show this setting. Full names in
  card accessibility labels, story descriptions, and collection details remain.

- The saved **Show tips button** setting controls only the Tips button.
- When enabled, the button is visible in new/in-progress games and hidden after
  completion. When disabled, it stays hidden across visits and new games.
- Other buttons keep their existing behavior. In particular, View all legends
  becomes available after completion independently of the Tips preference.
- Disabling the button does not disable the automatic first-visit tutorial or
  match/story descriptions. With the button enabled, three presses before play
  can replay the tutorial; during play, it shows the usual tip.
- On mobile (640 px wide or less), in-progress match comparisons use the bottom
  toast. After completion, comparisons appear at the top and tapping a matched
  card shows its individual story in the bottom toast. Desktop comparisons
  retain their top position.

## Where these rules live

- `js/memory-game.js`: `chooseActivePairs`, `chooseWeightedVariant`,
  `saveCompletedDiscoveries`, `evaluateAchievements`, `markMatch`,
  `playGameSound`, `setTipsEnabled`, and `showMatchInsight`.
- `js/i18n/memory-game/lang-*.json`: localized names/descriptions, shared
  `comparisons`, original `pairs`, special `rarePairs`, and relative mirror weights.
- `js/data/memory-game.json`: shared rarity probabilities, bonus-round settings,
  and Director’s Cut completion upgrade probability.
- `css/memory-game.css`: responsive message and modal presentation.
- `sw.js` and versioned asset URLs in `memory-game.html`: offline assets and
  cache refreshes.

When adding content, keep catalogue IDs and shared comparison references
consistent across all four languages, assign a relative weight (or accept the
default of 1), regenerate minified assets, and refresh affected cache versions.
No manual rebalancing of existing mirror percentages is needed.

## Progress navigation

Progress opens on the Records tab, with separate cards for all three modes.
The Achievements tab contains the unlock list and shows the unlocked count on
its tab. Both tabs support arrow keys, Home and End. View Records after a win
opens the Records tab directly. Preferences and mode selection stay in Settings.
