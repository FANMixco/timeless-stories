// Keep legacy keys and sanitization intact. Storage may be unavailable.
export function createProgressStore({ getStorage, recordsStorageKey, challengeStatsStorageKey, modeStorageKey, gameModes }) {
  const storage = {
    getItem(key) { return getStorage().getItem(key); },
    setItem(key, value) { getStorage().setItem(key, value); },
  };
  function emptyPersonalRecords() {
    return { version: 1, gamesCompleted: 0, totalPairsMatched: 0, configurations: {} };
  }

  const personalStorageKey = mode => mode === "crazyMirrors" ? "timelessMemoryCrazyMirrorsRecords:v1" : recordsStorageKey;
  function readPersonalRecords(mode = "classic") {
    const records = emptyPersonalRecords();
    try {
      let saved = JSON.parse(storage.getItem(personalStorageKey(mode)));
      // Earlier Crazy mirrors builds used challenge statistics on ten-pair boards.
      // Preserve only known results; historical move records cannot be inferred.
      if (mode === "crazyMirrors" && !saved) {
        const legacy = JSON.parse(storage.getItem(challengeStatsStorageKey));
        const previous = legacy?.version === 1 ? legacy.crazyMirrors : null;
        if (previous && validRecordNumber(previous.victories) && previous.victories > 0) {
          saved = { ...emptyPersonalRecords(), gamesCompleted: previous.victories,
            totalPairsMatched: previous.victories * 10 };
          if (validRecordNumber(previous.bestTime)) saved.configurations['standard:10'] = { bestTime: previous.bestTime };
          try { storage.setItem(personalStorageKey(mode), JSON.stringify(saved)); } catch {}
        }
      }
      if (saved?.version !== 1) return records;
      for (const field of ["gamesCompleted", "totalPairsMatched"]) {
        if (validRecordNumber(saved[field])) records[field] = saved[field];
      }
      for (const [key, value] of Object.entries(saved.configurations || {})) {
        if (!/^standard:[1-9]\d*$/.test(key) || !value || typeof value !== "object") continue;
        const entry = {};
        for (const field of ["bestTime", "fewestMoves"]) {
          if (validRecordNumber(value[field])) entry[field] = value[field];
        }
        if (validRecordNumber(value.last?.time) && validRecordNumber(value.last?.moves)) {
          entry.last = { time: value.last.time, moves: value.last.moves };
        }
        records.configurations[key] = entry;
      }
    } catch {}
    return records;
  }

  function readGameMode() {
    try {
      const saved = storage.getItem(modeStorageKey);
      return Object.hasOwn(gameModes, saved) ? saved : "classic";
    } catch { return "classic"; }
  }

  function readChallengeStats() {
    let saved;
    try { saved = JSON.parse(storage.getItem(challengeStatsStorageKey)); } catch {}
    const stats = {};
    for (const mode of Object.keys(gameModes).filter(id => gameModes[id].record)) {
      const entry = saved?.version === 1 ? saved[mode] : null;
      stats[mode] = { attempts: 0, victories: 0, defeats: 0 };
      for (const field of ["attempts", "victories", "defeats", "bestTime", "fewestMoves", "hardVictories"]) {
        if (validRecordNumber(entry?.[field])) stats[mode][field] = entry[field];
      }
    }
    return { version: 1, ...stats };
  }

  function writeChallengeStats(stats) {
    readPersonalRecords("crazyMirrors");
    try { storage.setItem(challengeStatsStorageKey, JSON.stringify(stats)); } catch {}
  }
  function completePersonalRecords({ pairCount, time, moves, mode = "classic" }) {
    // Read again to include completed activity from other tabs.
    const personalRecords = readPersonalRecords(mode);
    const key = `standard:${pairCount}`;
    const previous = personalRecords.configurations[key] || {};
    const current = { time, moves };
    const completedPerformance = {
      ...current,
      previous: previous.last || null,
      // Keep the pre-game records as this result's stable comparison reference.
      bestBefore: { time: previous.bestTime ?? null, moves: previous.fewestMoves ?? null },
      newBestTime: validRecordNumber(previous.bestTime) && current.time < previous.bestTime,
      newFewestMoves: validRecordNumber(previous.fewestMoves) && current.moves < previous.fewestMoves,
    };
    personalRecords.gamesCompleted += 1;
    personalRecords.totalPairsMatched += pairCount;
    personalRecords.configurations[key] = {
      bestTime: Math.min(previous.bestTime ?? current.time, current.time),
      fewestMoves: Math.min(previous.fewestMoves ?? current.moves, current.moves),
      last: current,
    };
    try { storage.setItem(personalStorageKey(mode), JSON.stringify(personalRecords)); } catch {}
    return completedPerformance;
  }
  function completeChallenge(mode, won, { time, moves, hardMode = false }) {
    let performance = null;
    const stats = readChallengeStats();
    const entry = stats[mode];
    if (won) {
      const { key: metric, field } = gameModes[mode].record;
      performance = {
        time, moves,
        bestBefore: { time: entry.bestTime ?? null, moves: entry.fewestMoves ?? null },
        newBestTime: metric === "bestTime" && validRecordNumber(entry.bestTime) && time < entry.bestTime,
        newFewestMoves: metric === "fewestMoves" && validRecordNumber(entry.fewestMoves) && moves < entry.fewestMoves,
      };
      entry[metric] = Math.min(entry[metric] ?? Infinity, ({ time, moves })[field]);
      if (hardMode) entry.hardVictories = (entry.hardVictories || 0) + 1;
    }
    entry[won ? "victories" : "defeats"] += 1;
    writeChallengeStats(stats);
    return performance;
  }
  function beginChallenge(mode) {
    const stats = readChallengeStats();
    stats[mode].attempts += 1;
    writeChallengeStats(stats);
  }
  return { readPersonalRecords, readGameMode, readChallengeStats, completeClassic: completePersonalRecords, completePersonalRecords, completeChallenge, beginChallenge };
}
export function validRecordNumber(value) { return Number.isSafeInteger(value) && value >= 0; }
