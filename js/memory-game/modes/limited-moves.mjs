export function createLimitedMovesMode({ hard = false } = {}) {
  const limit = hard ? 20 : 25;

  return Object.freeze({
    id: "limitedMoves",
    moves: limit,
    record: Object.freeze({ key: "fewestMoves", field: "moves" }),
    getStatus({ seconds, moves, completed }, warningThreshold) {
      return { seconds, moves: `${moves}/${limit}`, timeLow: false, movesLow: !completed && limit - moves <= warningThreshold };
    },
    getDefeatReason({ moves, matches, pairCount, attemptResolved }) {
      return attemptResolved && moves >= limit && matches < pairCount ? "moveLimit" : null;
    },
  });
}
