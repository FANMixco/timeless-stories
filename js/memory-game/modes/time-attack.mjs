export function createTimeAttackMode({ hard = false } = {}) {
  const limit = hard ? 30 : 45;

  return Object.freeze({
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
}
