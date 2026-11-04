import { classicMode } from "./classic.mjs";

// Unlimited Classic counters and personal records, with moving unmatched cards.
export const crazyMirrorsMode = Object.freeze({
  ...classicMode,
  id: "crazyMirrors",
  shuffleAfterMatch: true,
  canLose: false,
  personalRecords: true,
});
