import { classicMode } from "./classic.mjs";

// Unlimited Classic counters, with moving unmatched cards and separate records.
export const crazyMirrorsMode = Object.freeze({
  ...classicMode,
  id: "crazyMirrors",
  shuffleAfterMatch: true,
  canLose: false,
  record: Object.freeze({ key: "bestTime", field: "time" }),
});
