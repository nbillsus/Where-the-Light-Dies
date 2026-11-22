const MENU_MUSIC_SOURCES = [
  '/audio/game-theme.wav',
  '/audio/game-theme.mp3',
  '/audio/game-theme.m4a',
  '/audio/game-theme.ogg',
];

const CHAPTER_MUSIC_SOURCES = {
  1: ['/audio/music/chapter-1-heard.mp3'],
  2: ['/audio/music/chapter-2-dont-turn-around.mp3'],
  3: ['/audio/music/chapter-3-it-comes-at-night.mp3'],
  4: ['/audio/music/chapter-4-sacred-earths.mp3'],
  5: ['/audio/music/chapter-5-fog-choke.mp3'],
};

const MUSIC_DURATION_SECONDS = 178.8;
const MUSIC_HIT_TIMES_SECONDS = [
  6.4, 14.7, 23.2, 31.8, 40.4, 48.8, 57.5, 66.1, 74.7, 83.3,
  91.9, 100.5, 109.2, 117.8, 126.4, 135.1, 143.7, 152.3, 160.9, 169.6,
];

const state = {
  audio: null,
  trackKey: 'menu',
  sources: MENU_MUSIC_SOURCES,
  sourceIndex: 0,
  failed: false,
  startedAt: 0,
  timers: new Set(),
  baseVolume: 0.42,
  switchToken: 0,
};

function nowSeconds() {
  return performance.now() / 1000;
}

function createAudio() {
  if (state.audio) return state.audio;
  const audio = new Audio();
  audio.preload = 'auto';
  audio.loop = true;
  audio.volume = state.baseVolume;
  audio.crossOrigin = 'anonymous';
  audio.addEventListener('error', () => {
    if (state.sourceIndex < state.sources.length - 1) {
      state.sourceIndex += 1;
      audio.src = state.sources[state.sourceIndex];
      audio.load();
      void audio.play().catch(() => {});
      return;
    }
    state.failed = true;
  });
  audio.addEventListener('play', () => {
    state.failed = false;
    state.startedAt = nowSeconds() - (Number.isFinite(audio.currentTime) ? audio.currentTime : 0);
  });
  audio.src = state.sources[state.sourceIndex];
  state.audio = audio;
  return audio;
}

function rampVolume(audio, from, to, durationMs, token, onComplete) {
  const started = performance.now();
  const step = now => {
    if (token !== state.switchToken) return;
    const progress = Math.min(1, (now - started) / durationMs);
    audio.volume = from + (to - from) * progress;
    if (progress < 1) window.requestAnimationFrame(step);
    else onComplete?.();
  };
  window.requestAnimationFrame(step);
}

/** Select the menu score or the score assigned to a numbered chapter. */
export function setGameMusicChapter(chapter = null) {
  if (typeof window === 'undefined') return;
  const number = Number(chapter);
  const sources = CHAPTER_MUSIC_SOURCES[number] ?? MENU_MUSIC_SOURCES;
  const trackKey = CHAPTER_MUSIC_SOURCES[number] ? `chapter-${number}` : 'menu';
  if (trackKey === state.trackKey) return;

  state.trackKey = trackKey;
  state.sources = sources;
  state.sourceIndex = 0;
  state.failed = false;
  for (const timer of state.timers) window.clearTimeout(timer);
  state.timers.clear();
  const token = ++state.switchToken;
  const audio = state.audio;
  if (!audio) return;

  const wasPlaying = !audio.paused;
  const loadSelectedTrack = () => {
    if (token !== state.switchToken) return;
    audio.src = state.sources[0];
    audio.load();
    audio.currentTime = 0;
    audio.volume = wasPlaying ? 0 : state.baseVolume;
    if (!wasPlaying) return;
    void audio.play().then(() => {
      rampVolume(audio, 0, state.baseVolume, 650, token);
    }).catch(() => { audio.volume = state.baseVolume; });
  };

  if (wasPlaying && audio.volume > 0.01) rampVolume(audio, audio.volume, 0, 450, token, loadSelectedTrack);
  else loadSelectedTrack();
}

export function unlockGameMusic(volume = state.baseVolume) {
  if (typeof window === 'undefined') return null;
  state.baseVolume = volume;
  const audio = createAudio();
  audio.volume = Math.max(audio.volume, volume);
  if (!audio.src) audio.src = state.sources[state.sourceIndex];
  void audio.play().catch(() => {});
  return audio;
}

export function installGameMusicUnlock(scene, volume = state.baseVolume) {
  const unlock = () => unlockGameMusic(volume);
  scene.input?.on('pointerdown', unlock);
  scene.input?.keyboard?.on('keydown', unlock);
  for (const event of ['pointerdown', 'mousedown', 'touchstart', 'keydown']) {
    window.addEventListener(event, unlock, { passive: true });
  }
  return () => {
    scene.input?.off('pointerdown', unlock);
    scene.input?.keyboard?.off('keydown', unlock);
    for (const event of ['pointerdown', 'mousedown', 'touchstart', 'keydown']) {
      window.removeEventListener(event, unlock);
    }
  };
}

function musicDurationSeconds() {
  const audio = state.audio;
  return Number.isFinite(audio?.duration) && audio.duration > 0 ? audio.duration : MUSIC_DURATION_SECONDS;
}

function musicPositionSeconds() {
  const audio = state.audio;
  const duration = musicDurationSeconds();
  if (audio && Number.isFinite(audio.currentTime) && audio.currentTime > 0) {
    return audio.currentTime % duration;
  }
  const startedAt = state.startedAt || nowSeconds();
  return (nowSeconds() - startedAt) % duration;
}

export function getDelayToNextMusicHitMs({ minMs = 1300, maxMs = 3300, fallbackMs = 2150 } = {}) {
  const position = musicPositionSeconds();
  const duration = musicDurationSeconds();
  const minSeconds = minMs / 1000;
  const maxSeconds = maxMs / 1000;
  let bestDelay = Infinity;
  for (const hit of MUSIC_HIT_TIMES_SECONDS) {
    if (hit >= duration) continue;
    const delay = hit >= position ? hit - position : duration - position + hit;
    if (delay >= minSeconds && delay < bestDelay) bestDelay = delay;
  }
  return bestDelay <= maxSeconds ? Math.round(bestDelay * 1000) : fallbackMs;
}

function scheduleVolume(delayMs, volume) {
  const timer = window.setTimeout(() => {
    state.timers.delete(timer);
    if (!state.audio || state.failed) return;
    state.audio.volume = Math.max(0, Math.min(1, volume));
  }, delayMs);
  state.timers.add(timer);
}

export function syncGameMusicToScare(hitMs) {
  const audio = state.audio;
  if (!audio || state.failed) return;
  for (const timer of state.timers) window.clearTimeout(timer);
  state.timers.clear();
  audio.volume = Math.max(audio.volume, 0.5);
  scheduleVolume(Math.max(0, hitMs - 1150), 0.62);
  scheduleVolume(Math.max(0, hitMs - 170), 0.14);
  scheduleVolume(hitMs, 0.82);
  scheduleVolume(hitMs + 230, 0.5);
  scheduleVolume(hitMs + 900, state.baseVolume);
}

export function gameMusicAvailable() {
  return !!state.audio && !state.failed;
}
