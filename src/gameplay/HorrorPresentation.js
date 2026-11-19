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

export class HorrorPresentation {
  constructor(scene) {
    this.scene = scene;
    this.stage = scene.stage;
    this.scale = scene.artScale;
    this.beats = STORY_BEATS[this.stage.id] || [];
    this.triggered = new Set();
    this.audioContext = null;
    this.master = null;
    this.drone = null;
    this.isScaring = false;
    this.createAmbience();
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
      this.master.gain.value = 0.18;
      this.master.connect(this.audioContext.destination);
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
    });
  }

  update() {
    for (const beat of this.beats) {
      if (this.triggered.has(beat.key)) continue;
      if (this.scene.player.x >= beat.x * this.scale) {
        this.triggered.add(beat.key);
        this.playBeat(beat);
      }
    }
  }

  playBeat(beat) {
    if (beat.kind === 'scare') {
      this.runScare(beat);
      return;
    }
    this.radioPanel(beat.title, beat.message, beat.voice, beat.color);
    this.suspense(1900, 65);
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
    this.suspense(1600, 115);
    this.scene.time.delayedCall(1450, () => {
      this.playImpact(beat.scare);
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
    const high = ctx.createOscillator();
    const lowGain = ctx.createGain();
    const highGain = ctx.createGain();
    low.type = 'sine';
    high.type = type === 'glass' ? 'triangle' : 'square';
    low.frequency.setValueAtTime(type === 'knock' ? 72 : 48, now);
    low.frequency.exponentialRampToValueAtTime(24, now + 0.35);
    high.frequency.setValueAtTime(type === 'glass' ? 1350 : 180, now);
    high.frequency.exponentialRampToValueAtTime(type === 'glass' ? 3600 : 75, now + 0.18);
    lowGain.gain.setValueAtTime(0.45, now);
    lowGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    highGain.gain.setValueAtTime(0.22, now);
    highGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    low.connect(lowGain).connect(this.master);
    high.connect(highGain).connect(this.master);
    low.start(now);
    high.start(now);
    low.stop(now + 0.46);
    high.stop(now + 0.32);
  }

  destroy() {
    if (this.vignette) this.vignette.destroy();
    if (this.audioContext) this.audioContext.close();
  }
}
