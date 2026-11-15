// Device-local trial access is separate from the future book entitlement.
export const impostorTrialStorageKey = "timelessMemoryImpostorTrials:v1";
const limit = 2;

export function createImpostorTrial({ getStorage }) {
  let unavailable = false;
  function remaining() {
    if (unavailable) return null;
    try {
      const saved = getStorage().getItem(impostorTrialStorageKey);
      if (saved === null) return limit;
      if (!/^[0-2]$/.test(saved)) return 0;
      const used = Number(saved);
      return Number.isInteger(used) && used >= 0 && used <= limit ? limit - used : 0;
    } catch { unavailable = true; return null; }
  }
  return {
    remaining,
    consume() {
      const left = remaining();
      if (left === null || left <= 0) return false;
      try {
        getStorage().setItem(impostorTrialStorageKey, String(limit - left + 1));
        return true;
      } catch { unavailable = true; return false; }
    },
  };
}
