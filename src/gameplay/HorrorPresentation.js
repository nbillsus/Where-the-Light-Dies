import Phaser from 'phaser';
import { ensureFxTextures } from '../effects/textures.js';
import { fixedLayerOffset } from '../rendering.js';

const AMBER = 0xf4c16b;
const CYAN = 0x9ce6e0;
const BLOOD = 0xe96756;
const DARK = 0x02060c;

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
};

// Soft round light (radial gradient) instead of a hard-edged ellipse. The
// gradient fades to nothing at its edge, so it is drawn a bit larger to keep
// the same bright area.
function softLight(scene, x, y, width, height, color, alpha) {
  return scene.add.image(x, y, 'fx-glow').setTint(color).setDisplaySize(width * 1.6, height * 1.6)
    .setAlpha(alpha).setBlendMode(Phaser.BlendModes.ADD);
}

// Flame flicker: brightness and a slight stretch, relative to each light's size.
function flicker(scene, lights, low, high, duration) {
  for (const light of lights) {
    const sx = light.scaleX, sy = light.scaleY;
    scene.tweens.add({
      targets: light,
      alpha: { from: low, to: high },
      scaleX: { from: sx * 0.92, to: sx * 1.12 },
      scaleY: { from: sy * 0.88, to: sy * 1.06 },
      duration, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }
}

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
    this.createAmbience();
    this.createLighting();
    this.installAudioUnlock();
    this.showOpeningIfNeeded();
  }

  installAudioUnlock() {
    const unlock = () => this.ensureAudio();
    this.scene.input.keyboard.once('keydown', unlock);
    this.scene.input.once('pointerdown', unlock);
  }

  ensureAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!this.audioContext) {
      this.audioContext = new AudioContextClass();
      this.master = this.audioContext.createGain();
      this.master.gain.value = 0.26;
      this.master.connect(this.audioContext.destination);
      this.startSuspenseMusic();
    }
    if (this.audioContext.state === 'suspended') this.audioContext.resume();
    return this.audioContext;
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
    // Lighter than before: these stack with the atmosphere's fog and vignette.
    this.moonDimmer = scene.add.rectangle(scene.worldWidth / 2, h / 2, scene.worldWidth, h, 0x020713, 0.5)
      .setDepth(-8);
    this.deepFog = scene.add.rectangle(scene.worldWidth / 2, h / 2, scene.worldWidth, h, 0x02050a, 0.14)
      .setDepth(1);

    this.torches = [];
    const torchPositions = [0.12, 0.29, 0.46, 0.64, 0.81, 0.94];
    for (const [index, ratio] of torchPositions.entries()) {
      const x = scene.worldWidth * ratio;
      const nearest = scene.platforms.reduce((best, platform) => Math.abs(platform.y - h * 0.72) < Math.abs(best.y - h * 0.72) ? platform : best, scene.platforms[0]);
      const y = Math.min(h - 72 * this.scale, nearest.y - (index % 2 ? 82 : 118) * this.scale);
      const torch = scene.add.container(x, y).setDepth(3.4);
      const post = scene.add.rectangle(0, 42 * this.scale, 9 * this.scale, 95 * this.scale, 0x120905, 0.88);
      const halo = softLight(scene, 0, 0, 330 * this.scale, 230 * this.scale, AMBER, 0.26);
      const flame = softLight(scene, 0, 0, 45 * this.scale, 75 * this.scale, 0xff9d3f, 0.78);
      const core = softLight(scene, 0, -6 * this.scale, 18 * this.scale, 37 * this.scale, 0xfff1b2, 0.96);
      torch.add([halo, post, flame, core]);
      flicker(scene, [halo, flame, core], 0.2, 0.58, 620 + index * 73);
      this.torches.push(torch);
    }

    this.lanternGlow = scene.add.container(0, 0).setDepth(3.2);
    this.lanternAura = softLight(scene, 0, 0, 380 * this.scale, 280 * this.scale, AMBER, 0.34);
    this.lanternCore = softLight(scene, 0, 0, 102 * this.scale, 132 * this.scale, 0xffe1a1, 0.48);
    this.lanternGlow.add([this.lanternAura, this.lanternCore]);
    flicker(scene, [this.lanternAura, this.lanternCore], 0.24, 0.52, 760);
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
    if (!this.lanternGlow) return;
    const actor = this.scene.shadow?.controlling ? this.scene.shadow.actor : this.scene.player;
    this.lanternGlow.setPosition(actor.x, actor.y + 14 * this.scale);
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
    const panel = scene.add.container(offset.x + w / 2, offset.y + 126).setScrollFactor(0).setDepth(95);
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
      scene.tweens.add({ targets: panel, alpha: 0, y: offset.y + 98, duration: 350, onComplete: () => panel.destroy(true) });
    });
    this.playRadioNoise();
  }

  runScare(beat) {
    if (this.isScaring) return;
    this.isScaring = true;
    this.radioPanel(beat.title, beat.message, 'signal pressure rising...', beat.color, 2600);
    this.linkedCrescendo(2400, 82);
    this.scene.time.delayedCall(520, () => this.playHelpCry(beat.scare === 'pierHand' ? 'near' : 'falseKeeper'));
    this.scene.time.delayedCall(1350, () => this.playHelpCry('panic'));
    this.scene.time.delayedCall(2150, () => {
      this.playImpact(beat.scare);
      this.playScream(beat.scare);
      this.flash(beat.color);
      this.drawScareVisual(beat);
      this.scene.cameras.main.shake(360, 0.012);
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
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.75, now + duration / 1000);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.11, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration / 1000);
    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + duration / 1000 + 0.05);
  }

  startSuspenseMusic() {
    const ctx = this.audioContext;
    if (!ctx || this.music) return;

    const bed = ctx.createGain();
    const tension = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const bass = ctx.createOscillator();
    const fifth = ctx.createOscillator();
    const scrape = ctx.createOscillator();

    bed.gain.value = 0.038;
    tension.gain.value = 0.014;
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    filter.Q.value = 8;

    bass.type = 'sine';
    fifth.type = 'sawtooth';
    scrape.type = 'triangle';
    bass.frequency.value = 43.65;
    fifth.frequency.value = 65.4;
    scrape.frequency.value = 116.5;

    bass.connect(bed);
    fifth.connect(tension);
    scrape.connect(tension);
    tension.connect(filter);
    bed.connect(this.master);
    filter.connect(this.master);

    const now = ctx.currentTime;
    bass.start(now);
    fifth.start(now);
    scrape.start(now);
    this.music = { bed, tension, filter, bass, fifth, scrape, level: 0 };
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
    this.music.filter.frequency.cancelScheduledValues(now);
    this.music.bed.gain.linearRampToValueAtTime(0.035 + amount * 0.045, now + 0.28);
    this.music.tension.gain.linearRampToValueAtTime(0.012 + amount * 0.15, now + 0.28);
    this.music.filter.frequency.linearRampToValueAtTime(320 + amount * 1350, now + 0.28);
  }

  linkedCrescendo(duration = 2400, pitch = 82) {
    this.suspense(duration, pitch);
    const ctx = this.audioContext;
    if (!ctx || !this.music) return;
    const now = ctx.currentTime;
    this.music.bed.gain.cancelScheduledValues(now);
    this.music.tension.gain.cancelScheduledValues(now);
    this.music.filter.frequency.cancelScheduledValues(now);
    this.music.bed.gain.setValueAtTime(this.music.bed.gain.value, now);
    this.music.tension.gain.setValueAtTime(this.music.tension.gain.value, now);
    this.music.filter.frequency.setValueAtTime(this.music.filter.frequency.value, now);
    this.music.bed.gain.linearRampToValueAtTime(0.11, now + duration / 1000);
    this.music.tension.gain.linearRampToValueAtTime(0.24, now + duration / 1000);
    this.music.filter.frequency.linearRampToValueAtTime(2100, now + duration / 1000);
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
    const low = ctx.createOscillator();
    const lowGain = ctx.createGain();
    const hiss = ctx.createBufferSource();
    const hissFilter = ctx.createBiquadFilter();
    const hissGain = ctx.createGain();
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.55), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const attack = Math.min(1, i / (ctx.sampleRate * 0.025));
      const decay = 1 - i / data.length;
      data[i] = (Math.random() * 2 - 1) * attack * decay;
    }
    hiss.buffer = buffer;
    low.type = 'sine';
    low.frequency.setValueAtTime(type === 'knock' ? 82 : 58, now);
    low.frequency.exponentialRampToValueAtTime(18, now + 0.28);
    lowGain.gain.setValueAtTime(0.5, now);
    lowGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
    hissFilter.type = 'bandpass';
    hissFilter.frequency.value = type === 'glass' ? 4200 : 2700;
    hissFilter.Q.value = type === 'glass' ? 12 : 7;
    hissGain.gain.setValueAtTime(0.0001, now);
    hissGain.gain.exponentialRampToValueAtTime(type === 'glass' ? 0.38 : 0.44, now + 0.018);
    hissGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);
    low.connect(lowGain).connect(this.master);
    hiss.connect(hissFilter).connect(hissGain).connect(this.master);
    low.start(now);
    hiss.start(now);
    low.stop(now + 0.46);
    hiss.stop(now + 0.58);
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
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.48), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const falloff = 1 - i / data.length;
      data[i] = (Math.random() * 2 - 1) * falloff;
    }
    noise.buffer = buffer;

    const shriek = ctx.createOscillator();
    const shriekTwo = ctx.createOscillator();
    const shriekGain = ctx.createGain();
    const shriekTwoGain = ctx.createGain();
    const noiseGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();

    shriek.type = 'sawtooth';
    shriekTwo.type = 'square';
    shriek.frequency.setValueAtTime(type === 'glass' ? 1900 : 1250, now);
    shriek.frequency.exponentialRampToValueAtTime(type === 'pierHand' ? 3100 : 3600, now + 0.11);
    shriek.frequency.exponentialRampToValueAtTime(410, now + 0.48);
    shriekTwo.frequency.setValueAtTime(type === 'glass' ? 2630 : 1740, now);
    shriekTwo.frequency.exponentialRampToValueAtTime(type === 'pierHand' ? 520 : 690, now + 0.32);
    shriekGain.gain.setValueAtTime(0.0001, now);
    shriekGain.gain.exponentialRampToValueAtTime(0.34, now + 0.022);
    shriekGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.56);
    shriekTwoGain.gain.setValueAtTime(0.0001, now);
    shriekTwoGain.gain.exponentialRampToValueAtTime(0.18, now + 0.035);
    shriekTwoGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

    filter.type = 'highpass';
    filter.frequency.value = type === 'knock' ? 1100 : 1600;
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(type === 'glass' ? 0.34 : 0.42, now + 0.012);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);

    sub.type = 'sine';
    sub.frequency.setValueAtTime(56, now);
    sub.frequency.exponentialRampToValueAtTime(23, now + 0.38);
    subGain.gain.setValueAtTime(0.34, now);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.44);

    shriek.connect(shriekGain).connect(this.master);
    shriekTwo.connect(shriekTwoGain).connect(this.master);
    noise.connect(filter).connect(noiseGain).connect(this.master);
    sub.connect(subGain).connect(this.master);
    shriek.start(now);
    shriekTwo.start(now);
    noise.start(now);
    sub.start(now);
    shriek.stop(now + 0.72);
    shriekTwo.stop(now + 0.52);
    noise.stop(now + 0.52);
    sub.stop(now + 0.46);
  }

  destroy() {
    if (this.vignette) this.vignette.destroy();
    if (this.audioContext) this.audioContext.close();
  }
}
