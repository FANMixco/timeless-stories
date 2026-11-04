// Audio resources are private to one game. Inject browser access for tests.
export function createGameAudio({ getAudioContext, fetch, isEnabled, isHidden }) {
  const soundFiles = { match: "memory-game/music/match.mp3", discovery: "memory-game/music/shiny.mp3", achievement: "memory-game/music/award.mp3", victory: "memory-game/music/complete.mp3", gameover: "memory-game/music/gameover.mp3", combo: "memory-game/music/combo1.mp3", combo5: "memory-game/music/combo5.mp3", combo10: "memory-game/music/combo10.mp3" };
  let audioContext = null;
  const soundChannels = {
    effect: { version: 0, active: null, pending: null },
    victory: { version: 0, active: null, pending: null },
    gameover: { version: 0, active: null, pending: null },
    achievement: { version: 0, active: null, pending: null },
    combo: { version: 0, active: null, pending: null },
  };
  const playingSounds = new Set();
  const soundFadeSeconds = 0.075;
  const soundBuffers = new Map();
  function getSoundBuffer(name) {
    if (!soundBuffers.has(name)) {
      const buffer = fetch(soundFiles[name])
        .then(response => {
          if (!response.ok) throw new Error("Sound unavailable");
          return response.arrayBuffer();
        })
        .then(data => audioContext.decodeAudioData(data))
        .catch(error => { soundBuffers.delete(name); throw error; });
      soundBuffers.set(name, buffer);
    }
    return soundBuffers.get(name);
  }

  function prepareGameAudio() {
    if (!isEnabled()) return;
    try {
      const AudioContext = getAudioContext();
      if (!AudioContext) return;
      if (!audioContext) audioContext = new AudioContext();
      if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
      // Load once after a player gesture so the first match is ready to sound.
      for (const name of Object.keys(soundFiles)) getSoundBuffer(name).catch(() => {});
    } catch { /* Audio support must never interrupt a game. */ }
  }

  function setSoundVolume(sound, volume) {
    const now = audioContext.currentTime;
    const gain = sound.gain.gain;
    if (gain.cancelAndHoldAtTime) gain.cancelAndHoldAtTime(now);
    else {
      gain.cancelScheduledValues(now);
      gain.setValueAtTime(gain.value, now);
    }
    gain.linearRampToValueAtTime(volume, now + soundFadeSeconds);
  }

  function updateVictoryVolume() {
    if (soundChannels.victory.active) {
      setSoundVolume(soundChannels.victory.active, soundChannels.achievement.active ? 0.25 : 1);
    }
  }

  function releaseSound(sound) {
    playingSounds.delete(sound);
    sound.source.disconnect();
    sound.gain.disconnect();
  }

  function stopSound(sound, fade) {
    if (fade) {
      setSoundVolume(sound, 0);
      try { sound.source.stop(audioContext.currentTime + soundFadeSeconds); } catch {}
    } else {
      sound.source.onended = null;
      try { sound.source.stop(); } catch {}
      releaseSound(sound);
    }
  }

  function stopSoundChannel(channel, fade = true) {
    channel.version += 1;
    channel.pending = null;
    const sound = channel.active;
    channel.active = null;
    if (sound) stopSound(sound, fade);
  }

  async function playGameSound(name, rate = 1) {
    if (!isEnabled() || !audioContext || isHidden()) return;
    const gameplay = name === "match" || name === "discovery";
    const combo = name === "combo" || name === "combo5" || name === "combo10";
    const channel = combo ? soundChannels.combo : gameplay ? soundChannels.effect : soundChannels[name];
    if (!channel) return;
    // One thunder at a time, including sounds still loading. Never restart it.
    if (combo && (channel.active || channel.pending)) return;
    if (gameplay || combo) {
      // Match feedback never interrupts a special discovery or a reward melody.
      if (soundChannels.gameover.active || soundChannels.gameover.pending || soundChannels.victory.active || soundChannels.victory.pending ||
          soundChannels.achievement.active || soundChannels.achievement.pending) return;
      if (name === "match" && (channel.active?.name === "discovery" || channel.pending?.name === "discovery")) return;
    } else {
      // Rewards immediately supersede gameplay, including effects still loading.
      stopSoundChannel(soundChannels.effect);
    }
    stopSoundChannel(channel);
    if (name === "achievement") updateVictoryVolume();
    const version = channel.version;
    channel.pending = { name };
    try {
      const buffer = await getSoundBuffer(name);
      if (version !== channel.version || !isEnabled() || isHidden()) return;
      const source = audioContext.createBufferSource();
      const gain = audioContext.createGain();
      const sound = { name, source, gain };
      source.buffer = buffer;
      source.playbackRate.value = rate;
      source.connect(gain);
      gain.connect(audioContext.destination);
      gain.gain.setValueAtTime(0, audioContext.currentTime);
      channel.active = sound;
      channel.pending = null;
      playingSounds.add(sound);
      setSoundVolume(sound, name === "victory" && soundChannels.achievement.active ? 0.25 : 1);
      source.onended = () => {
        releaseSound(sound);
        // A faded-out predecessor must not clear or unduck its replacement.
        if (channel.active !== sound) return;
        channel.active = null;
        if (name === "achievement") updateVictoryVolume();
      };
      source.start();
      if (name === "achievement") updateVictoryVolume();
    } catch {
      if (version !== channel.version) return;
      channel.pending = null;
      if (channel.active) stopSoundChannel(channel, false);
      if (name === "achievement") updateVictoryVolume();
    }
  }

  function stopGameSounds() {
    for (const channel of Object.values(soundChannels)) stopSoundChannel(channel, false);
    // Include predecessors still in their short fade-out period.
    for (const sound of playingSounds) stopSound(sound, false);
  }
  return {
    prepare: prepareGameAudio,
    play: playGameSound,
    stopAll: stopGameSounds,
    inspect() {
      return { playing: playingSounds.size, channels: Object.fromEntries(Object.entries(soundChannels).map(([name, channel]) =>
        [name, { active: channel.active?.name ?? null, pending: channel.pending?.name ?? null }])) };
    },
  };
}
