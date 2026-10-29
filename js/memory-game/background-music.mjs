// Stream the soundtrack without decoding the whole recording into Web Audio.
export function createBackgroundMusic({ createAudio, isEnabled, isHidden }) {
  let player = null;
  let activated = false;
  function pause() { player?.pause(); }
  function sync() {
    if (!activated || !isEnabled() || isHidden()) { pause(); return; }
    try {
      if (!player) {
        player = createAudio("music/default.ogg");
        if (!player) return;
        player.loop = true;
        player.volume = 0.16;
        player.preload = "none";
      }
      if (!player.paused) return;
      const playing = player.play();
      playing?.then(() => {
        if (!isEnabled() || isHidden()) pause();
      }).catch(() => {});
    } catch { /* Playback restrictions or missing audio must not affect play. */ }
  }
  return { prepare() { activated = true; sync(); }, sync, pause };
}
