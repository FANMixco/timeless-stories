# Memory Game rules

Reference for the implemented behavior as of October 24, 2026. This document
describes the game; it does not change its behavior.

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

The Achievements button remains hidden until at least one achievement is earned.

## Tips and mobile messages

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
