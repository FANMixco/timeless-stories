const limit = 45;

export const timeAttackMode = Object.freeze({
  id: "timeAttack",
  seconds: limit,
  record: Object.freeze({ key: "bestTime", field: "time" }),
  getStatus({ seconds, moves, completed }, warningThreshold) {
    const remaining = Math.max(0, limit - seconds);
    return { seconds: remaining, moves, timeLow: !completed && remaining <= warningThreshold, movesLow: false };
  },
  getDefeatReason({ seconds }) {
    return seconds >= limit ? "timeExpired" : null;
  },
});
