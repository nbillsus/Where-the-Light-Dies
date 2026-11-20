import Phaser from 'phaser';
import { ensureFxTextures } from '../effects/textures.js';
import { fixedLayerOffset } from '../rendering.js';

const AMBER = 0xf4c16b;
const CYAN = 0x9ce6e0;
const BLOOD = 0xe96756;
const DARK = 0x02060c;
const SCARE_HIT_MS = 2150;

const STORY_BEATS = {
  'storm-coast': [
    {
      key: 'origin',
      x: 360,
      kind: 'radio',
      title: 'COAST STATION',
      message: 'The beacon was built after Mourning Reef. The first keepers heard voices calling from the fog for three nights after the wreck had already sunk.',
      voice: '...any light still burning? The main beacon is dark.',
      color: AMBER,
    },
    {
      key: 'pier-cry',
      x: 1660,
      kind: 'scare',
      title: 'UNDER THE PIER',
      message: 'Help me. I can see your lantern.',
      after: 'The same cry repeats from farther away, now in your own voice.',
      scare: 'pierHand',
      color: BLOOD,
    },
  ],
  'abandoned-facility': [
    {
      key: 'relay',
      x: 1240,
      kind: 'radio',
      title: 'RELAY ONE',
      message: 'Caldera to lighthouse. We can see the cliffs only when lightning hits. We need your beam.',
      voice: 'Something in the fog is pulling sound away.',
      color: CYAN,
    },
    {
      key: 'lens-knock',
      x: 2700,
      kind: 'scare',
      title: 'THE LENS ROOM',
      message: 'A violent knock rolls through the old cables overhead.',
      after: 'Wet footprints face inward beneath a door that has not opened in years.',
      scare: 'knock',
      color: AMBER,
    },
  ],
  thornwood: [
    {
      key: 'drowned-choir',
      x: 1020,
      kind: 'radio',
      title: 'THE DROWNED CHOIR',
      message: 'The voices are not lost sailors. They are the reef remembering every mouth that drowned there.',
      voice: 'Do not answer any voice that comes from below the water. Do not answer your own.',
      color: CYAN,
    },
    {
      key: 'shadow-warning',
      x: 2650,
      kind: 'scare',
      title: 'IT MOVED FIRST',
      message: 'Your shadow turns before you do.',
      after: 'For a second, the lantern throws two shadows. One of them is smiling.',
      scare: 'behind',
      color: BLOOD,
    },
  ],
  'drowned-cavern': [
    {
      key: 'chapel-reflection',
      x: 1160,
      kind: 'scare',
      title: 'CHAPEL GLASS',
      message: 'That is not your reflection.',
      after: 'The delayed silhouette mouths the words before the radio says them.',
      scare: 'glass',
      color: CYAN,
    },
    {
      key: 'crew-log',
      x: 2860,
      kind: 'radio',
      title: 'KEEPER ARCHIVE',
      message: 'The crystals do not create light. They remember it, bend it, and carry it where flame cannot go.',
      voice: 'The dark recoils only when the beam is held steady.',
      color: AMBER,
    },
  ],
  'lantern-vault': [
    {
      key: 'false-keeper',
      x: 1300,
      kind: 'scare',
      title: 'FALSE DISTRESS',
      message: 'Help me, please. I am still down here.',
      after: 'The voice is clean now. Too clean. It is yours.',
      scare: 'behind',
      color: BLOOD,
    },
    {
      key: 'final-contact',
      x: 3330,
      kind: 'radio',
      title: 'CALDERA',
      message: 'Lighthouse, we have your signal. Bring the main lens online and keep it burning.',
      voice: 'We will follow your light home.',
      color: AMBER,
    },
  ],
  'moonbreak-reef': [{
    key: 'first-reflection', x: 2200, kind: 'radio', title: 'THE RETURNING BEAM',
    message: 'The lens gave back a light that had gone out decades ago. Someone carved a warning into its frame: reflections have memories.',
    voice: '...not the lighthouse... something on the reef is answering...', color: CYAN,
  }],
  'glass-tide': [{
    key: 'glass-tide-echo', x: 2100, kind: 'scare', title: 'UNDER THE GLASS',
    message: 'A silhouette keeps pace beneath the transparent shore.',
    after: 'It stops only when you stop. Its head turns one beat too late.', scare: 'glass', color: CYAN,
  }],
  'ash-orchard': [{
    key: 'orchard-recording', x: 2050, kind: 'radio', title: 'ORCHARD RECORDING',
    message: 'The trees grew around the old reflectors after the first blackout. Their roots follow the buried cables, not the water.',
    voice: 'The station called this place a garden. No one remembers planting it.', color: AMBER,
  }],
  'hollow-observatory': [{
    key: 'observatory-eye', x: 2500, kind: 'scare', title: 'THE EMPTY TELESCOPE',
    message: 'The instrument points down, toward the floor beneath your feet.',
    after: 'A pale handprint appears on the inside of the lens.', scare: 'glass', color: CYAN,
  }],
  'black-lens': [{
    key: 'lens-message', x: 2650, kind: 'radio', title: 'THE ORIGINAL SIGNAL',
    message: 'This is not a distress call. The first keeper sent it to keep the black lens closed. The signal has been repeating his warning ever since.',
    voice: '...if it learns to carry light, do not let it find the lighthouse...', color: AMBER,
  }],
};

export class HorrorPresentation {
  constructor(scene) {
    this.scene = scene;
    this.stage = scene.stage;
    this.scale = scene.artScale;
    this.beats = STORY_BEATS[this.stage.id] || [];
    this.triggered = new Set();
    this.audioContext = null;
    this.master = null;
    this.music = null;
    this.isScaring = false;
    this.audioUnlocked = false;
    this.unlockHandlers = [];
    this.createAmbience();
    this.createLighting();
    this.installAudioUnlock();
    this.showOpeningIfNeeded();
  }

  installAudioUnlock() {
    const unlock = () => this.ensureAudio(true);
    this.scene.input.keyboard.on('keydown', unlock);
    this.scene.input.on('pointerdown', unlock);
    this.unlockHandlers.push(['scene-keyboard', unlock], ['scene-pointer', unlock]);
    for (const event of ['keydown', 'pointerdown', 'mousedown', 'touchstart']) {
      window.addEventListener(event, unlock, { passive: true });
      this.unlockHandlers.push([event, unlock]);
    }
  }

  ensureAudio(fromGesture = false) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!this.audioContext) {
      this.audioContext = new AudioContextClass();
      this.master = this.audioContext.createGain();
      this.master.gain.value = 0.42;
      this.master.connect(this.audioContext.destination);
      this.startSuspenseMusic();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().then(() => {
        if (fromGesture) this.confirmAudioUnlocked();
      }).catch(() => {});
    } else if (fromGesture) {
      this.confirmAudioUnlocked();
    }
    return this.audioContext;
  }

  confirmAudioUnlocked() {
    if (this.audioUnlocked || !this.audioContext || !this.master || this.audioContext.state !== 'running') return;
    this.audioUnlocked = true;
    this.playUnlockThump();
  }

  playUnlockThump() {
    const ctx = this.audioContext;
    if (!ctx || !this.master) return;
    const now = ctx.currentTime;
    const thump = ctx.createOscillator();
    const gain = ctx.createGain();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(46, now);
    thump.frequency.exponentialRampToValueAtTime(24, now + 0.18);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    thump.connect(gain).connect(this.master);
    thump.start(now);
    thump.stop(now + 0.24);
  }

  createAmbience() {
    const w = this.scene.viewportWidth;
    const h = this.scene.viewportHeight;
    const offset = fixedLayerOffset(w, h);
    this.vignette = this.scene.add.container(offset.x, offset.y).setScrollFactor(0).setDepth(25);
    this.vignette.add(this.scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.1));
    this.vignette.add(this.scene.add.rectangle(w / 2, 9, w, 18, 0x000000, 0.22));
    this.vignette.add(this.scene.add.rectangle(w / 2, h - 9, w, 18, 0x000000, 0.22));
  }

  createLighting() {
    const scene = this.scene;
    const h = scene.viewportHeight;
    ensureFxTextures(scene);
    this.watcherEyes = [];
    const eyePositions = [
      [0.2, 0.48], [0.34, 0.36], [0.54, 0.44], [0.72, 0.38], [0.89, 0.51],
    ];
    for (const [index, [rx, ry]] of eyePositions.entries()) {
      const eyes = this.createWatcherEyes(scene.worldWidth * rx, h * ry, 0.72 + index * 0.08);
      this.watcherEyes.push(eyes);
    }
  }

  createWatcherEyes(x, y, delay) {
    const scene = this.scene;
    const eyes = scene.add.container(x, y).setDepth(2.7).setAlpha(0);
    // Soft darkness behind the eyes instead of a hard-edged oval.
    const shadow = scene.add.image(0, 0, 'fx-glow').setTint(0x000000)
      .setDisplaySize(118 * 1.8 * this.scale, 54 * 2 * this.scale).setAlpha(0.8);
    const left = scene.add.ellipse(-24 * this.scale, 0, 23 * this.scale, 13 * this.scale, 0xf1f7df, 0.9)
      .setBlendMode(Phaser.BlendModes.ADD);
    const right = scene.add.ellipse(24 * this.scale, 0, 23 * this.scale, 13 * this.scale, 0xf1f7df, 0.9)
      .setBlendMode(Phaser.BlendModes.ADD);
    const leftPupil = scene.add.circle(-24 * this.scale, 0, 4.5 * this.scale, 0x090b0d, 0.95);
    const rightPupil = scene.add.circle(24 * this.scale, 0, 4.5 * this.scale, 0x090b0d, 0.95);
    eyes.add([shadow, left, right, leftPupil, rightPupil]);
    eyes.leftPupil = leftPupil;
    eyes.rightPupil = rightPupil;
    eyes.baseY = y;
    eyes.phase = delay;
    scene.tweens.add({
      targets: eyes,
      alpha: { from: 0.06, to: 0.82 },
      duration: 1500 + delay * 220,
      delay: delay * 900,
      yoyo: true,
      repeat: -1,
      hold: 1300,
      repeatDelay: 900,
      ease: 'Sine.easeInOut',
    });
    return eyes;
  }

  showOpeningIfNeeded() {
    if (this.stage.id !== 'storm-coast') return;
    this.scene.time.delayedCall(450, () => {
      this.radioPanel(
        'WHERE THE LIGHT DIES',
        'The lighthouse was built to warn ships away from Mourning Reef. Tonight, the reef is calling back.',
        '...coast station to any light... answer...',
        AMBER,
        5200,
      );
      this.suspense(3600, 95);
      this.scene.time.delayedCall(900, () => this.playHelpCry('distant'));
    });
  }

  update() {
    this.updateLighting();
    this.updateSuspenseMusic();
    for (const beat of this.beats) {
      if (this.triggered.has(beat.key)) continue;
      if (this.scene.player.x >= beat.x * this.scale) {
        this.triggered.add(beat.key);
        this.playBeat(beat);
      }
    }
  }

  updateLighting() {
    const actor = this.scene.shadow?.controlling ? this.scene.shadow.actor : this.scene.player;
    for (const eyes of this.watcherEyes || []) {
      const dx = Phaser.Math.Clamp((actor.x - eyes.x) / (460 * this.scale), -1, 1) * 7 * this.scale;
      const dy = Phaser.Math.Clamp((actor.y - eyes.y) / (280 * this.scale), -1, 1) * 4 * this.scale;
      eyes.leftPupil.setPosition(-24 * this.scale + dx, dy);
      eyes.rightPupil.setPosition(24 * this.scale + dx, dy);
      eyes.y = eyes.baseY + Math.sin(this.scene.time.now * 0.0015 + eyes.phase) * 5 * this.scale;
    }
  }

  updateSuspenseMusic() {
    if (!this.music) return;
    const scare = this.beats.find(beat => beat.kind === 'scare' && !this.triggered.has(beat.key));
    let level = this.isScaring ? 1 : 0.18;
    if (scare) {
      const distance = Math.max(0, scare.x * this.scale - this.scene.player.x);
      const range = 720 * this.scale;
      if (distance < range) level = Math.max(level, 1 - distance / range);
    }
    this.setMusicIntensity(level);
  }


  playBeat(beat) {
    if (beat.kind === 'scare') {
      this.runScare(beat);
      return;
    }
    this.radioPanel(beat.title, beat.message, beat.voice, beat.color);
    this.suspense(1900, 65);
    if (beat.title === 'THE DROWNED CHOIR' || beat.title === 'KEEPER ARCHIVE') this.playHelpCry('choir');
  }

  radioPanel(title, message, voice, color = CYAN, duration = 4300) {
    const scene = this.scene;
    const w = scene.viewportWidth;
    const h = scene.viewportHeight;
    const offset = fixedLayerOffset(w, h);
    // Only one radio message at a time: a new one replaces any still on screen.
    if (this.activePanel?.active) this.activePanel.destroy(true);
    const panel = scene.add.container(offset.x + w / 2, offset.y + 126).setScrollFactor(0).setDepth(95);
    this.activePanel = panel;
    const box = scene.add.rectangle(0, 0, Math.min(w - 42, 760), 112, 0x061017, 0.94)
      .setStrokeStyle(2, color, 0.78);
    const glow = scene.add.rectangle(0, 0, Math.min(w - 42, 760), 112, color, 0.05);
    const heading = scene.add.text(-box.width / 2 + 22, -43, title, {
      fontFamily: 'Georgia, serif',
      fontSize: '19px',
      color: '#f6e4bd',
    });
    const body = scene.add.text(-box.width / 2 + 22, -13, message, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#e2ece8',
      wordWrap: { width: box.width - 44 },
      lineSpacing: 3,
    });
    const signal = scene.add.text(-box.width / 2 + 22, 35, voice, {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#9ed8d1',
      wordWrap: { width: box.width - 44 },
    });
    panel.add([glow, box, heading, body, signal]);
    panel.setAlpha(0).setY(offset.y + 104);
    scene.tweens.add({ targets: panel, alpha: 1, y: offset.y + 126, duration: 220, ease: 'Sine.easeOut' });
    scene.tweens.add({ targets: glow, alpha: { from: 0.02, to: 0.16 }, duration: 120, yoyo: true, repeat: Math.floor(duration / 240) });
    scene.time.delayedCall(duration, () => {
      if (!panel.active) return;
      scene.tweens.add({ targets: panel, alpha: 0, y: offset.y + 98, duration: 350, onComplete: () => panel.destroy(true) });
    });
    this.playRadioNoise();
  }

  runScare(beat) {
    if (this.isScaring) return;
    this.isScaring = true;
    this.radioPanel(beat.title, beat.message, 'signal pressure rising...', beat.color, 2600);
    this.scoreJumpScare(SCARE_HIT_MS, beat.scare);
    this.scene.time.delayedCall(520, () => this.playHelpCry(beat.scare === 'pierHand' ? 'near' : 'falseKeeper'));
    this.scene.time.delayedCall(1350, () => this.playHelpCry('panic'));
    this.scene.time.delayedCall(SCARE_HIT_MS, () => {
      this.playHorrorHit(beat.scare);
      this.playImpact(beat.scare);
      this.playScream(beat.scare);
      this.flash(beat.color);
      this.drawScareVisual(beat);
      this.scene.shakeCamera(360, 0.012);
      this.scene.time.delayedCall(540, () => this.radioPanel('AFTERIMAGE', beat.after, 'do not answer your own voice', beat.color, 3300));
      this.scene.time.delayedCall(900, () => { this.isScaring = false; });
    });
  }

  drawScareVisual(beat) {
    if (beat.scare === 'pierHand') {
      const x = this.scene.player.x + 95 * this.scale;
      const y = this.scene.player.body.bottom - 30 * this.scale;
      const hand = this.scene.add.container(x, y).setDepth(20);
      hand.add(this.scene.add.ellipse(0, 12 * this.scale, 36 * this.scale, 82 * this.scale, DARK, 0.92));
      for (let i = -2; i <= 2; i++) {
        hand.add(this.scene.add.ellipse(i * 9 * this.scale, -31 * this.scale, 8 * this.scale, 48 * this.scale, DARK, 0.95));
      }
      hand.setScale(0.2, 0.05);
      this.scene.tweens.add({ targets: hand, scaleX: 1, scaleY: 1, y: y - 55 * this.scale, duration: 115, ease: 'Back.easeOut' });
      this.scene.tweens.add({ targets: hand, alpha: 0, y: y + 70 * this.scale, duration: 460, delay: 430, onComplete: () => hand.destroy(true) });
      return;
    }

    if (beat.scare === 'glass') {
      const x = this.scene.player.x + 160 * this.scale;
      const y = this.scene.player.y - 26 * this.scale;
      const reflection = this.scene.add.container(x, y).setDepth(18).setAlpha(0.72);
      reflection.add(this.scene.add.ellipse(0, -50 * this.scale, 28 * this.scale, 34 * this.scale, DARK, 0.85));
      reflection.add(this.scene.add.triangle(0, 2 * this.scale, -34 * this.scale, 62 * this.scale, 34 * this.scale, 62 * this.scale, 0, -35 * this.scale, DARK, 0.85));
      reflection.add(this.scene.add.line(0, 4 * this.scale, -42 * this.scale, -34 * this.scale, 42 * this.scale, -34 * this.scale, 0xbdeefa, 0.85).setLineWidth(3 * this.scale));
      this.scene.tweens.add({ targets: reflection, x: this.scene.player.x + 70 * this.scale, alpha: 0, duration: 720, ease: 'Sine.easeIn', onComplete: () => reflection.destroy(true) });
      return;
    }

    const x = this.scene.player.x - 120 * this.scale;
    const y = this.scene.player.y - 40 * this.scale;
    const figure = this.scene.add.container(x, y).setDepth(18).setAlpha(0.88);
    figure.add(this.scene.add.ellipse(0, -42 * this.scale, 35 * this.scale, 46 * this.scale, DARK, 0.96));
    figure.add(this.scene.add.triangle(0, 28 * this.scale, -48 * this.scale, 95 * this.scale, 48 * this.scale, 95 * this.scale, 0, -22 * this.scale, DARK, 0.96));
    figure.add(this.scene.add.circle(-8 * this.scale, -46 * this.scale, 3 * this.scale, 0xf4f6f0, 0.92));
    figure.add(this.scene.add.circle(8 * this.scale, -46 * this.scale, 3 * this.scale, 0xf4f6f0, 0.92));
    this.scene.tweens.add({ targets: figure, x: this.scene.player.x - 38 * this.scale, duration: 90, ease: 'Quad.easeOut' });
    this.scene.tweens.add({ targets: figure, alpha: 0, duration: 520, delay: 340, onComplete: () => figure.destroy(true) });
  }

  flash(color) {
    const scene = this.scene;
    const w = scene.viewportWidth;
    const h = scene.viewportHeight;
    const offset = fixedLayerOffset(w, h);
    const overlay = scene.add.rectangle(offset.x + w / 2, offset.y + h / 2, w, h, color, 0.36).setScrollFactor(0).setDepth(110);
    scene.tweens.add({ targets: overlay, alpha: 0, duration: 420, onComplete: () => overlay.destroy() });
  }

  suspense(duration = 1600, pitch = 85) {
    const ctx = this.ensureAudio();
    if (!ctx || !this.master) return;
    const now = ctx.currentTime;
    const seconds = duration / 1000;
    const pressure = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const shiver = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let rumble = 0;
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      const rise = Math.pow(t, 1.7);
      const tremble = 0.55 + Math.sin(t * 73) * 0.22 + Math.sin(t * 191) * 0.12;
      rumble = rumble * 0.8 + (Math.random() * 2 - 1) * 0.2;
      data[i] = rumble * rise * tremble;
    }
    pressure.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(160, now);
    filter.frequency.exponentialRampToValueAtTime(1100, now + seconds);
    filter.Q.value = 9;
    shiver.type = 'highpass';
    shiver.frequency.value = 700;
    shiver.Q.value = 2.8;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + Math.min(0.36, seconds * 0.35));
    gain.gain.linearRampToValueAtTime(0.28, now + seconds * 0.88);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
    sub.type = 'sine';
    sub.frequency.setValueAtTime(Math.max(28, pitch * 0.38), now);
    sub.frequency.exponentialRampToValueAtTime(18, now + seconds);
    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.exponentialRampToValueAtTime(0.22, now + 0.12);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
    pressure.connect(filter).connect(shiver).connect(gain).connect(this.master);
    sub.connect(subGain).connect(this.master);
    pressure.start(now);
    sub.start(now);
    pressure.stop(now + seconds + 0.04);
    sub.stop(now + seconds + 0.04);
  }

  startSuspenseMusic() {
    const ctx = this.audioContext;
    if (!ctx || this.music) return;

    const bed = ctx.createGain();
    const tension = ctx.createGain();
    const whisper = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const whisperFilter = ctx.createBiquadFilter();
    const movement = ctx.createGain();
    const lfo = ctx.createOscillator();
    const bass = ctx.createOscillator();
    const underBass = ctx.createOscillator();
    const growl = ctx.createBufferSource();
    const growlFilter = ctx.createBiquadFilter();
    const scrape = ctx.createBufferSource();
    const growlBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const growlData = growlBuffer.getChannelData(0);
    let growlLast = 0;
    for (let i = 0; i < growlData.length; i++) {
      const t = i / growlData.length;
      const unevenBreath = 0.48 + Math.sin(t * Math.PI * 9) * 0.24 + Math.sin(t * Math.PI * 23) * 0.1;
      growlLast = growlLast * 0.9 + (Math.random() * 2 - 1) * 0.1;
      growlData[i] = growlLast * unevenBreath;
    }
    growl.buffer = growlBuffer;
    growl.loop = true;
    const scrapeBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const scrapeData = scrapeBuffer.getChannelData(0);
    let scrapeLast = 0;
    for (let i = 0; i < scrapeData.length; i++) {
      const t = i / scrapeData.length;
      const scrapePulse = Math.sin(t * Math.PI * 12) > 0.35 ? 1 : 0.24;
      scrapeLast = scrapeLast * 0.66 + (Math.random() * 2 - 1) * 0.34;
      scrapeData[i] = scrapeLast * scrapePulse;
    }
    scrape.buffer = scrapeBuffer;
    scrape.loop = true;

    bed.gain.value = 0.028;
    tension.gain.value = 0.01;
    whisper.gain.value = 0.006;
    filter.type = 'lowpass';
    filter.frequency.value = 260;
    filter.Q.value = 12;
    growlFilter.type = 'bandpass';
    growlFilter.frequency.value = 95;
    growlFilter.Q.value = 8;
    whisperFilter.type = 'bandpass';
    whisperFilter.frequency.value = 1180;
    whisperFilter.Q.value = 14;

    bass.type = 'sine';
    underBass.type = 'sine';
    bass.frequency.value = 36.7;
    underBass.frequency.value = 34.9;
    lfo.type = 'sine';
    lfo.frequency.value = 0.68;
    movement.gain.value = 0.018;

    bass.connect(bed);
    underBass.connect(bed);
    growl.connect(growlFilter).connect(tension);
    scrape.connect(whisperFilter).connect(whisper);
    lfo.connect(movement.gain);
    tension.connect(filter);
    whisper.connect(filter);
    bed.connect(movement).connect(this.master);
    filter.connect(this.master);

    const now = ctx.currentTime;
    bass.start(now);
    underBass.start(now);
    growl.start(now);
    scrape.start(now);
    lfo.start(now);
    this.music = { bed, tension, whisper, filter, growlFilter, whisperFilter, movement, bass, underBass, growl, scrape, lfo, level: 0 };
    this.setMusicIntensity(0.18);
  }

  setMusicIntensity(level) {
    const ctx = this.audioContext;
    if (!ctx || !this.music) return;
    const amount = Phaser.Math.Clamp(level, 0, 1);
    const now = ctx.currentTime;
    this.music.level = amount;
    this.music.bed.gain.cancelScheduledValues(now);
    this.music.tension.gain.cancelScheduledValues(now);
    this.music.whisper.gain.cancelScheduledValues(now);
    this.music.filter.frequency.cancelScheduledValues(now);
    this.music.growlFilter.frequency.cancelScheduledValues(now);
    this.music.whisperFilter.frequency.cancelScheduledValues(now);
    this.music.bed.gain.linearRampToValueAtTime(0.03 + amount * 0.055, now + 0.38);
    this.music.tension.gain.linearRampToValueAtTime(0.006 + amount * 0.055, now + 0.38);
    this.music.whisper.gain.linearRampToValueAtTime(0.004 + amount * 0.105, now + 0.38);
    this.music.filter.frequency.linearRampToValueAtTime(210 + amount * 780, now + 0.38);
    this.music.growlFilter.frequency.linearRampToValueAtTime(70 + amount * 210, now + 0.38);
    this.music.whisperFilter.frequency.linearRampToValueAtTime(820 + amount * 2400, now + 0.38);
  }

  linkedCrescendo(duration = 2400, pitch = 82) {
    this.suspense(duration, pitch);
    const ctx = this.audioContext;
    if (!ctx || !this.music) return;
    const now = ctx.currentTime;
    this.music.bed.gain.cancelScheduledValues(now);
    this.music.tension.gain.cancelScheduledValues(now);
    this.music.whisper.gain.cancelScheduledValues(now);
    this.music.filter.frequency.cancelScheduledValues(now);
    this.music.growlFilter.frequency.cancelScheduledValues(now);
    this.music.whisperFilter.frequency.cancelScheduledValues(now);
    this.music.bed.gain.setValueAtTime(this.music.bed.gain.value, now);
    this.music.tension.gain.setValueAtTime(this.music.tension.gain.value, now);
    this.music.whisper.gain.setValueAtTime(this.music.whisper.gain.value, now);
    this.music.filter.frequency.setValueAtTime(this.music.filter.frequency.value, now);
    this.music.growlFilter.frequency.setValueAtTime(this.music.growlFilter.frequency.value, now);
    this.music.whisperFilter.frequency.setValueAtTime(this.music.whisperFilter.frequency.value, now);
    this.music.bed.gain.linearRampToValueAtTime(0.13, now + duration / 1000);
    this.music.tension.gain.linearRampToValueAtTime(0.08, now + duration / 1000);
    this.music.whisper.gain.linearRampToValueAtTime(0.22, now + duration / 1000);
    this.music.filter.frequency.linearRampToValueAtTime(920, now + duration / 1000);
    this.music.growlFilter.frequency.linearRampToValueAtTime(320, now + duration / 1000);
    this.music.whisperFilter.frequency.linearRampToValueAtTime(3800, now + duration / 1000);
  }

  scoreJumpScare(hitMs = SCARE_HIT_MS, type = 'behind') {
    this.linkedCrescendo(hitMs, type === 'glass' ? 92 : 58);
    this.playHorrorCrescendo(hitMs, type);
    this.playHeartbeatPulse(0.28, 0.18);
    this.playHeartbeatPulse(0.84, 0.24);
    this.playHeartbeatPulse(1.36, 0.31);
    this.playHeartbeatPulse(Math.max(0.1, hitMs / 1000 - 0.36), 0.42);
    this.playDissonantMusicStab(Math.max(0.1, hitMs / 1000 - 0.82), 0.62, type);
    this.playPreHitSilence(hitMs);
    this.playHitMusicDrop(hitMs, type);
  }

  playHeartbeatPulse(when, gain = 0.25) {
    const ctx = this.ensureAudio();
    if (!ctx || !this.master) return;
    const start = ctx.currentTime + when;
    const end = start + 0.34;
    const thump = ctx.createOscillator();
    const body = ctx.createOscillator();
    const volume = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    thump.type = 'sine';
    body.type = 'triangle';
    thump.frequency.setValueAtTime(68, start);
    thump.frequency.exponentialRampToValueAtTime(24, start + 0.24);
    body.frequency.setValueAtTime(35, start);
    body.frequency.exponentialRampToValueAtTime(19, start + 0.32);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, start);
    filter.frequency.exponentialRampToValueAtTime(55, end);
    volume.gain.setValueAtTime(0.0001, start);
    volume.gain.exponentialRampToValueAtTime(gain, start + 0.014);
    volume.gain.exponentialRampToValueAtTime(0.0001, end);
    thump.connect(filter);
    body.connect(filter);
    filter.connect(volume).connect(this.master);
    thump.start(start);
    body.start(start);
    thump.stop(end + 0.02);
    body.stop(end + 0.02);
  }

  playDissonantMusicStab(when, duration, type = 'behind') {
    const ctx = this.ensureAudio();
    if (!ctx || !this.master) return;
    const start = ctx.currentTime + when;
    const end = start + duration;
    const intervals = type === 'glass' ? [277, 293, 587] : [185, 196, 415];
    const filter = ctx.createBiquadFilter();
    const shaper = ctx.createWaveShaper();
    const volume = ctx.createGain();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(type === 'glass' ? 900 : 430, start);
    filter.frequency.exponentialRampToValueAtTime(type === 'glass' ? 3600 : 1900, end);
    filter.Q.value = 13;
    shaper.curve = this.distortionCurve(3.8);
    shaper.oversample = '4x';
    volume.gain.setValueAtTime(0.0001, start);
    volume.gain.exponentialRampToValueAtTime(0.17, start + 0.04);
    volume.gain.linearRampToValueAtTime(0.24, end - 0.08);
    volume.gain.exponentialRampToValueAtTime(0.0001, end);
    filter.connect(shaper).connect(volume).connect(this.master);
    for (const [index, freq] of intervals.entries()) {
      const osc = ctx.createOscillator();
      osc.type = index === 2 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * (type === 'glass' ? 1.75 : 1.32), end);
      osc.connect(filter);
      osc.start(start);
      osc.stop(end + 0.02);
    }
  }

  playPreHitSilence(hitMs) {
    const ctx = this.audioContext;
    if (!ctx || !this.music) return;
    const hit = ctx.currentTime + hitMs / 1000;
    const dipStart = Math.max(ctx.currentTime + 0.05, hit - 0.16);
    this.music.bed.gain.cancelScheduledValues(dipStart);
    this.music.tension.gain.cancelScheduledValues(dipStart);
    this.music.whisper.gain.cancelScheduledValues(dipStart);
    this.music.bed.gain.setValueAtTime(this.music.bed.gain.value, dipStart);
    this.music.tension.gain.setValueAtTime(this.music.tension.gain.value, dipStart);
    this.music.whisper.gain.setValueAtTime(this.music.whisper.gain.value, dipStart);
    this.music.bed.gain.linearRampToValueAtTime(0.018, hit - 0.035);
    this.music.tension.gain.linearRampToValueAtTime(0.006, hit - 0.035);
    this.music.whisper.gain.linearRampToValueAtTime(0.01, hit - 0.035);
  }

  playHitMusicDrop(hitMs, type = 'behind') {
    const ctx = this.audioContext;
    if (!ctx || !this.music) return;
    const hit = ctx.currentTime + hitMs / 1000;
    this.music.bed.gain.setValueAtTime(0.2, hit);
    this.music.tension.gain.setValueAtTime(type === 'glass' ? 0.14 : 0.18, hit);
    this.music.whisper.gain.setValueAtTime(0.25, hit);
    this.music.filter.frequency.setValueAtTime(type === 'glass' ? 2100 : 1600, hit);
    this.music.growlFilter.frequency.setValueAtTime(type === 'glass' ? 420 : 280, hit);
    this.music.whisperFilter.frequency.setValueAtTime(5200, hit);
    this.music.bed.gain.exponentialRampToValueAtTime(0.045, hit + 0.5);
    this.music.tension.gain.exponentialRampToValueAtTime(0.018, hit + 0.58);
    this.music.whisper.gain.exponentialRampToValueAtTime(0.02, hit + 0.62);
    this.music.filter.frequency.exponentialRampToValueAtTime(310, hit + 0.7);
    this.music.growlFilter.frequency.exponentialRampToValueAtTime(92, hit + 0.7);
    this.music.whisperFilter.frequency.exponentialRampToValueAtTime(980, hit + 0.7);
  }

  distortionCurve(amount = 5) {
    return new Float32Array(512).map((_, i) => {
      const x = i / 255.5 - 1;
      return Math.tanh(x * amount);
    });
  }

  noiseBuffer(ctx, duration, shaping = 'rise') {
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      const attack = shaping === 'hit' ? Math.min(1, t / 0.015) : Math.pow(t, 1.6);
      const decay = shaping === 'hit' ? Math.pow(1 - t, 0.62) : 0.35 + t * 0.65;
      const tremble = 0.55 + Math.sin(t * 113) * 0.22 + Math.sin(t * 307) * 0.14;
      const teeth = Math.random() > 0.9 ? (Math.random() * 2 - 1) * 0.95 : 0;
      last = last * 0.54 + (Math.random() * 2 - 1) * 0.46;
      data[i] = (last + teeth) * attack * decay * tremble;
    }
    return buffer;
  }

  startNoiseLayer({ when, duration, gain, filterType, filterStart, filterEnd, q = 8, drive = 5, pan = 0, shape = 'rise' }) {
    const ctx = this.ensureAudio();
    if (!ctx || !this.master) return;
    const start = ctx.currentTime + when;
    const end = start + duration;
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const shaper = ctx.createWaveShaper();
    const volume = ctx.createGain();
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    source.buffer = this.noiseBuffer(ctx, duration, shape);
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterStart, start);
    filter.frequency.exponentialRampToValueAtTime(filterEnd, end);
    filter.Q.value = q;
    shaper.curve = this.distortionCurve(drive);
    shaper.oversample = '4x';
    volume.gain.setValueAtTime(0.0001, start);
    volume.gain.exponentialRampToValueAtTime(gain, start + (shape === 'hit' ? 0.012 : 0.18));
    volume.gain.linearRampToValueAtTime(gain * 0.84, Math.max(start + 0.04, end - 0.09));
    volume.gain.exponentialRampToValueAtTime(0.0001, end);
    if (panner) {
      panner.pan.setValueAtTime(pan, start);
      panner.pan.linearRampToValueAtTime(-pan, end);
      source.connect(filter).connect(shaper).connect(volume).connect(panner).connect(this.master);
    } else {
      source.connect(filter).connect(shaper).connect(volume).connect(this.master);
    }
    source.start(start);
    source.stop(end + 0.02);
  }

  startScreamLayer({ when, duration, gain, startFreq, peakFreq, endFreq, drive = 6, pan = 0 }) {
    const ctx = this.ensureAudio();
    if (!ctx || !this.master) return;
    const start = ctx.currentTime + when;
    const end = start + duration;
    const voice = ctx.createBufferSource();
    const formant = ctx.createBiquadFilter();
    const shaper = ctx.createWaveShaper();
    const volume = ctx.createGain();
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let phase = 0;
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      const attack = Math.min(1, t / 0.02);
      const falloff = Math.pow(1 - t, 0.72);
      const sweep = t < 0.35
        ? Phaser.Math.Linear(startFreq, peakFreq, t / 0.35)
        : Phaser.Math.Linear(peakFreq, endFreq, (t - 0.35) / 0.65);
      const panic = Math.sin(t * 97) * 520 + Math.sin(t * 241) * 170 + (Math.random() * 2 - 1) * 360;
      phase += (Math.max(180, sweep + panic) / ctx.sampleRate) * Math.PI * 2;
      data[i] = (Math.sin(phase) * 0.42 + Math.sin(phase * 1.91) * 0.24 + (Math.random() * 2 - 1) * 0.25) * attack * falloff;
    }
    voice.buffer = buffer;
    formant.type = 'bandpass';
    formant.frequency.setValueAtTime(startFreq * 1.6, start);
    formant.frequency.exponentialRampToValueAtTime(peakFreq * 1.35, start + duration * 0.35);
    formant.frequency.exponentialRampToValueAtTime(Math.max(900, endFreq * 1.55), end);
    formant.Q.value = 10;
    shaper.curve = this.distortionCurve(drive);
    shaper.oversample = '4x';
    volume.gain.setValueAtTime(0.0001, start);
    volume.gain.exponentialRampToValueAtTime(gain, start + 0.016);
    volume.gain.exponentialRampToValueAtTime(0.0001, end);
    if (panner) {
      panner.pan.setValueAtTime(pan, start);
      panner.pan.linearRampToValueAtTime(-pan * 0.7, end);
      voice.connect(formant).connect(shaper).connect(volume).connect(panner).connect(this.master);
    } else {
      voice.connect(formant).connect(shaper).connect(volume).connect(this.master);
    }
    voice.start(start);
    voice.stop(end + 0.02);
  }

  playHorrorCrescendo(duration = 2200, type = 'behind') {
    const seconds = duration / 1000;
    this.startNoiseLayer({
      when: 0,
      duration: seconds,
      gain: type === 'pierHand' ? 0.19 : 0.16,
      filterType: 'bandpass',
      filterStart: 80,
      filterEnd: type === 'glass' ? 2400 : 1500,
      q: 12,
      drive: 3.6,
      pan: 0.28,
    });
    this.startNoiseLayer({
      when: Math.max(0, seconds - 0.7),
      duration: 0.68,
      gain: 0.22,
      filterType: 'highpass',
      filterStart: 850,
      filterEnd: 4200,
      q: 6,
      drive: 7.5,
      pan: -0.22,
      shape: 'hit',
    });
    this.startScreamLayer({
      when: Math.max(0, seconds - 0.38),
      duration: 0.42,
      gain: 0.16,
      startFreq: 480,
      peakFreq: type === 'glass' ? 3600 : 2600,
      endFreq: 620,
      drive: 5.4,
      pan: 0.18,
    });
  }

  playHorrorHit(type = 'behind') {
    this.startNoiseLayer({
      when: 0,
      duration: type === 'glass' ? 0.78 : 0.9,
      gain: type === 'glass' ? 0.5 : 0.64,
      filterType: 'bandpass',
      filterStart: type === 'glass' ? 1600 : 520,
      filterEnd: type === 'glass' ? 6200 : 3900,
      q: 11,
      drive: 11,
      pan: type === 'pierHand' ? 0.42 : -0.34,
      shape: 'hit',
    });
    this.startScreamLayer({
      when: 0.018,
      duration: type === 'glass' ? 0.82 : 1.05,
      gain: type === 'glass' ? 0.34 : 0.43,
      startFreq: type === 'knock' ? 380 : 760,
      peakFreq: type === 'glass' ? 5600 : 4300,
      endFreq: type === 'pierHand' ? 420 : 680,
      drive: 9,
      pan: type === 'pierHand' ? -0.25 : 0.31,
    });
    this.startNoiseLayer({
      when: 0.03,
      duration: 0.36,
      gain: 0.34,
      filterType: 'lowpass',
      filterStart: 180,
      filterEnd: 44,
      q: 3,
      drive: 8,
      pan: 0,
      shape: 'hit',
    });
  }

  playRadioNoise() {
    const ctx = this.ensureAudio();
    if (!ctx || !this.master) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(930, now);
    osc.frequency.linearRampToValueAtTime(220, now + 0.18);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  playImpact(type) {
    const ctx = this.ensureAudio();
    if (!ctx || !this.master) return;
    const now = ctx.currentTime;
    const duration = type === 'glass' ? 0.66 : 0.9;
    const low = ctx.createOscillator();
    const lowGain = ctx.createGain();
    const inhale = ctx.createBufferSource();
    const throat = ctx.createBiquadFilter();
    const teeth = ctx.createBiquadFilter();
    const snarl = ctx.createWaveShaper();
    const hissGain = ctx.createGain();
    const snap = ctx.createBufferSource();
    const snapFilter = ctx.createBiquadFilter();
    const snapGain = ctx.createGain();
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      const attack = Math.min(1, t / 0.018);
      const decay = Math.pow(1 - t, 0.7);
      const choke = 0.62 + Math.sin(t * 148) * 0.28 + Math.sin(t * 411) * 0.1;
      const spit = Math.random() > 0.86 ? (Math.random() * 2 - 1) * 0.9 : 0;
      last = last * 0.55 + (Math.random() * 2 - 1) * 0.45;
      data[i] = (last + spit) * attack * decay * choke;
    }
    inhale.buffer = buffer;
    const snapBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.11), ctx.sampleRate);
    const snapData = snapBuffer.getChannelData(0);
    for (let i = 0; i < snapData.length; i++) {
      const t = i / snapData.length;
      const envelope = Math.pow(1 - t, 3.1);
      snapData[i] = (Math.random() * 2 - 1) * envelope;
    }
    snap.buffer = snapBuffer;
    low.type = 'sine';
    low.frequency.setValueAtTime(type === 'knock' ? 70 : 47, now);
    low.frequency.exponentialRampToValueAtTime(17, now + 0.24);
    lowGain.gain.setValueAtTime(0.58, now);
    lowGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    throat.type = 'bandpass';
    throat.frequency.setValueAtTime(type === 'glass' ? 2300 : 860, now);
    throat.frequency.exponentialRampToValueAtTime(type === 'glass' ? 5600 : 3200, now + 0.18);
    throat.frequency.exponentialRampToValueAtTime(type === 'glass' ? 1800 : 1250, now + duration);
    throat.Q.value = 7.5;
    teeth.type = 'highpass';
    teeth.frequency.value = 1300;
    teeth.Q.value = 4.2;
    snarl.curve = new Float32Array(512).map((_, i) => {
      const x = i / 255.5 - 1;
      return Math.tanh(x * 7.5);
    });
    snarl.oversample = '4x';
    hissGain.gain.setValueAtTime(0.0001, now);
    hissGain.gain.exponentialRampToValueAtTime(type === 'glass' ? 0.46 : 0.68, now + 0.018);
    hissGain.gain.linearRampToValueAtTime(type === 'glass' ? 0.26 : 0.42, now + 0.2);
    hissGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    snapFilter.type = 'highpass';
    snapFilter.frequency.value = type === 'glass' ? 2600 : 1700;
    snapFilter.Q.value = 8;
    snapGain.gain.setValueAtTime(0.0001, now);
    snapGain.gain.exponentialRampToValueAtTime(type === 'glass' ? 0.42 : 0.58, now + 0.006);
    snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    low.connect(lowGain).connect(this.master);
    inhale.connect(throat).connect(teeth).connect(snarl).connect(hissGain).connect(this.master);
    snap.connect(snapFilter).connect(snapGain).connect(this.master);
    low.start(now);
    inhale.start(now);
    snap.start(now + 0.012);
    low.stop(now + 0.46);
    inhale.stop(now + duration + 0.04);
    snap.stop(now + 0.13);
  }

  playHelpCry(type = 'distant') {
    const ctx = this.ensureAudio();
    if (!ctx || !this.master) return;
    const now = ctx.currentTime;
    const duration = type === 'panic' ? 1.15 : type === 'choir' ? 2.1 : 1.55;
    const voice = ctx.createOscillator();
    const wobble = ctx.createOscillator();
    const tremolo = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const delay = ctx.createDelay();
    const echo = ctx.createGain();

    voice.type = type === 'panic' ? 'square' : 'sawtooth';
    const startFreq = type === 'falseKeeper' ? 390 : type === 'near' ? 310 : type === 'panic' ? 520 : 250;
    voice.frequency.setValueAtTime(startFreq, now);
    voice.frequency.linearRampToValueAtTime(startFreq * 0.74, now + duration * 0.38);
    voice.frequency.linearRampToValueAtTime(startFreq * 1.08, now + duration * 0.62);
    voice.frequency.linearRampToValueAtTime(startFreq * 0.58, now + duration);

    wobble.type = 'sine';
    wobble.frequency.value = type === 'choir' ? 7.2 : 5.1;
    tremolo.gain.value = type === 'panic' ? 0.19 : 0.11;
    wobble.connect(tremolo.gain);

    filter.type = 'bandpass';
    filter.frequency.value = type === 'distant' ? 760 : type === 'near' ? 930 : 1180;
    filter.Q.value = type === 'panic' ? 11 : 7;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(type === 'panic' ? 0.19 : 0.115, now + 0.16);
    gain.gain.linearRampToValueAtTime(type === 'panic' ? 0.08 : 0.045, now + duration * 0.64);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    delay.delayTime.value = type === 'near' ? 0.08 : 0.19;
    echo.gain.value = type === 'choir' ? 0.18 : 0.1;

    voice.connect(filter).connect(tremolo).connect(gain).connect(this.master);
    gain.connect(delay).connect(echo).connect(this.master);
    voice.start(now);
    wobble.start(now);
    voice.stop(now + duration + 0.04);
    wobble.stop(now + duration + 0.04);

    if (type === 'choir') {
      this.scene.time.delayedCall(260, () => this.playHelpCry('distant'));
      this.scene.time.delayedCall(540, () => this.playHelpCry('near'));
    }
  }

  playScream(type = 'behind') {
    const ctx = this.ensureAudio();
    if (!ctx || !this.master) return;
    const now = ctx.currentTime;
    const duration = type === 'glass' ? 0.58 : 0.82;
    const noise = ctx.createBufferSource();
    const rawScream = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let dirt = 0;
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      const attack = Math.min(1, t / 0.025);
      const falloff = Math.pow(1 - t, 0.58);
      const flutter = 0.55 + Math.sin(t * 116) * 0.25 + Math.sin(t * 293) * 0.18;
      dirt = dirt * 0.46 + (Math.random() * 2 - 1) * 0.54;
      data[i] = dirt * attack * falloff * flutter;
    }
    noise.buffer = buffer;
    const screamBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const screamData = screamBuffer.getChannelData(0);
    let phase = 0;
    for (let i = 0; i < screamData.length; i++) {
      const t = i / screamData.length;
      const attack = Math.min(1, t / 0.018);
      const falloff = Math.pow(1 - t, 0.75);
      const sweep = type === 'pierHand' ? 900 + t * 2600 : 1250 + Math.sin(t * Math.PI) * 2400;
      const panic = Math.sin(t * 91) * 440 + (Math.random() * 2 - 1) * 280;
      phase += (Math.max(260, sweep + panic) / ctx.sampleRate) * Math.PI * 2;
      const tornVoice = Math.sin(phase) * 0.36 + Math.sin(phase * 1.97) * 0.18;
      screamData[i] = (tornVoice + (Math.random() * 2 - 1) * 0.32) * attack * falloff;
    }
    rawScream.buffer = screamBuffer;

    const noiseGain = ctx.createGain();
    const screamGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const formant = ctx.createBiquadFilter();
    const shred = ctx.createWaveShaper();
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();

    filter.type = 'highpass';
    filter.frequency.value = type === 'knock' ? 1250 : 1850;
    filter.Q.value = 5;
    formant.type = 'bandpass';
    formant.frequency.setValueAtTime(type === 'glass' ? 4100 : 2850, now);
    formant.frequency.exponentialRampToValueAtTime(type === 'pierHand' ? 5200 : 3700, now + 0.12);
    formant.frequency.exponentialRampToValueAtTime(type === 'glass' ? 1900 : 1700, now + duration);
    formant.Q.value = 9.5;
    shred.curve = new Float32Array(512).map((_, i) => {
      const x = i / 255.5 - 1;
      return Math.tanh(x * 5.8);
    });
    shred.oversample = '4x';
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(type === 'glass' ? 0.42 : 0.56, now + 0.009);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    screamGain.gain.setValueAtTime(0.0001, now);
    screamGain.gain.exponentialRampToValueAtTime(type === 'glass' ? 0.2 : 0.28, now + 0.016);
    screamGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    sub.type = 'sine';
    sub.frequency.setValueAtTime(50, now);
    sub.frequency.exponentialRampToValueAtTime(19, now + 0.34);
    subGain.gain.setValueAtTime(0.42, now);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    noise.connect(filter).connect(noiseGain).connect(this.master);
    rawScream.connect(formant).connect(shred).connect(screamGain).connect(this.master);
    sub.connect(subGain).connect(this.master);
    noise.start(now);
    rawScream.start(now + 0.006);
    sub.start(now);
    noise.stop(now + duration + 0.04);
    rawScream.stop(now + duration + 0.04);
    sub.stop(now + 0.52);
  }

  destroy() {
    for (const [target, handler] of this.unlockHandlers) {
      if (target === 'scene-keyboard') this.scene.input.keyboard.off('keydown', handler);
      else if (target === 'scene-pointer') this.scene.input.off('pointerdown', handler);
      else window.removeEventListener(target, handler);
    }
    this.unlockHandlers = [];
    if (this.vignette) this.vignette.destroy();
    if (this.audioContext) this.audioContext.close();
  }
}
