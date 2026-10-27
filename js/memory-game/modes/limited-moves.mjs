const limit = 25;

export const limitedMovesMode = Object.freeze({
  id: "limitedMoves",
  moves: limit,
  record: Object.freeze({ key: "fewestMoves", field: "moves" }),
  getStatus({ seconds, moves, completed }, warningThreshold) {
    return { seconds, moves: `${moves}/${limit}`, timeLow: false, movesLow: !completed && limit - moves <= warningThreshold };
  },
  getDefeatReason({ moves, matches, pairCount, attemptResolved }) {
    // Resolving the final permitted pair must take precedence over the move limit.
    return attemptResolved && moves >= limit && matches < pairCount ? "moveLimit" : null;
  },
});
