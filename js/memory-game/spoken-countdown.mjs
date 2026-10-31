// Speak only the current warning; never queue numbers that have already expired.
export function createSpokenCountdown({ getSynthesis, createUtterance, isEnabled, isHidden, getLanguage }) {
  let lastKey = null;
  let active = null;

  function stop() {
    if (!active) return;
    active = null;
    try { getSynthesis()?.cancel(); } catch { /* Speech is optional. */ }
  }

  return {
    update({ key, remaining, playing }) {
      if (!playing || !Number.isInteger(remaining) || remaining < 1 || remaining > 5) {
        stop();
        return;
      }
      const nextKey = `${key}:${remaining}`;
      if (nextKey === lastKey) return;
      lastKey = nextKey;
      stop();
      if (!isEnabled() || isHidden()) return;
      try {
        const synthesis = getSynthesis();
        if (!synthesis) return;
        const utterance = createUtterance(String(remaining));
        if (!utterance) return;
        const language = getLanguage();
        utterance.lang = { en: "en-US", es: "es-ES", fr: "fr-FR", zh: "zh-CN" }[language] || language;
        const voices = synthesis.getVoices?.().filter(voice => voice.lang?.split(/[-_]/)[0] === language) || [];
        const voice = voices.find(voice => voice.localService) || voices[0];
        if (voice) utterance.voice = voice;
        utterance.rate = 1.2;
        utterance.onend = utterance.onerror = () => { if (active === utterance) active = null; };
        active = utterance;
        synthesis.speak(utterance);
      } catch { stop(); }
    },
    stop,
    reset() { stop(); lastKey = null; },
  };
}
