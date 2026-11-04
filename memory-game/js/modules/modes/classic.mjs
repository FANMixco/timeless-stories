// Classic has no defeat condition and keeps its legacy personal records.
export const classicMode = Object.freeze({
  id: "classic",
  record: null,
  getStatus({ seconds, moves }) {
    return { seconds, moves, timeLow: false, movesLow: false };
  },
  getDefeatReason() { return null; },
});
