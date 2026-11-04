export const memoryFlashMode = Object.freeze({
  id: "memoryFlash",
  previewSeconds: 7,
  maxMistakes: 3,
  tracksTime: false,
  matchSettleMs: 350,
  record: Object.freeze({ key: "fewestMoves", field: "moves" }),
  getStatus({ mistakes = 0, previewRemaining = null, completed }) {
    return { seconds: previewRemaining ?? 0, moves: `${Math.max(0, 3 - mistakes)} / 3`,
      hideTime: previewRemaining === null, timeLow: false, movesLow: !completed && mistakes >= 2 };
  },
  getDefeatReason({ mistakes = 0 }) {
    return mistakes > 3 ? "mistakeLimit" : null;
  },
});
