import Phaser from 'phaser';
import { themeFor } from './theme.js';
import { ensureFxTextures, seededRandom } from './textures.js';
import { readSettings } from '../settings.js';
import { drawArenaBackdrop } from './ArenaBackdrop.js';

// Depth and mood for a level: fog banks, drifting particles, weather, a dark
// foreground ink layer that scrolls faster than the camera, decorated ledges,
// and a soft vignette. Owner: Lucas (graphics).
//
// Depth order used across the game:
//   -10 backdrop · -6 far fog · 1–3 ledge decoration · 2 boy · 3 cables
//   5–7 puzzle objects · 9 ground fog · 10 particles · 20 foreground ink
//   24 lightning · 25 rain · 28 key prompts · 30 HUD · 80 title cards
const FOREGROUND_PARALLAX = 1.35;

export class Atmosphere {
  constructor(scene) {
    this.scene = scene;
    this.theme = themeFor(scene.stage);
    this.s = scene.artScale;
    this.W = scene.worldWidth;
    this.H = scene.viewportHeight;
    this.rand = seededRandom(scene.stage.id);
    ensureFxTextures(scene);
    drawArenaBackdrop(scene);
    this.addLedges();
    this.addParticles();
    this.addForeground();
    if (this.theme.weather === 'rain') this.addRain(readSettings().rain);
    this.addGrade();
  }

  r(min, max) { return min + this.rand() * (max - min); }
  pick(list) { return list[Math.floor(this.rand() * list.length)]; }

  // Inked ledges: shade under each lip, hanging strands, tufts on top.
  addLedges() {
    const { s, theme } = this;
    const back = this.scene.add.graphics().setDepth(1);
    const front = this.scene.add.graphics().setDepth(3);
    for (const { left, right, y } of this.scene.platforms) {
      const width = right - left;
      back.fillGradientStyle(theme.ink, theme.ink, theme.ink, theme.ink, .5, .5, 0, 0)
        .fillRect(left, y + 10 * s, width, 90 * s);
      back.lineStyle(2 * s, theme.rim, .35).lineBetween(left + 4 * s, y + 1 * s, right - 4 * s, y + 1 * s);
      for (let x = left + this.r(6, 30) * s; x < right - 6 * s; x += this.r(16, 48) * s) {
        this.hangingStrand(back, x, y + 9 * s);
      }
      for (let x = left + this.r(10, 60) * s; x < right - 12 * s; x += this.r(70, 170) * s) {
        this.tuft(front, x, y + 2 * s, this.r(6, 15) * s);
      }
    }
  }

  hangingStrand(g, x, y) {
    const { s, theme } = this;
    const length = this.r(10, 64) * s;
    if (theme.hang === 'rust') {
      g.lineStyle(this.r(2, 4) * s, theme.drip, .45).lineBetween(x, y, x + this.r(-2, 2) * s, y + length * .8);
      return;
    }
    const sway = this.r(-10, 10) * s;
    const points = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(x, y),
      new Phaser.Math.Vector2(x + sway, y + length * .5),
      new Phaser.Math.Vector2(x + sway * .4, y + length),
    ).getPoints(8);
    g.lineStyle(this.r(1.5, 3.2) * s, theme.ink, .9).strokePoints(points);
    if (this.rand() < .35) {
      const end = points[points.length - 1];
      g.fillStyle(theme.drip, .55).fillCircle(end.x, end.y + 2 * s, 2.2 * s);
    }
  }

  tuft(g, x, y, height) {
    const blades = 3 + Math.floor(this.rand() * 4);
    g.fillStyle(this.theme.ink, .95);
    for (let i = 0; i < blades; i++) {
      const base = x + (i - blades / 2) * 3 * this.s;
      const lean = this.r(-6, 6) * this.s;
      g.fillTriangle(base - 1.6 * this.s, y, base + 1.6 * this.s, y, base + lean, y - height * this.r(.6, 1.1));
    }
  }

  addParticles() {
    const { W, H, theme } = this;
    const kind = theme.motes.kind;
    const base = {
      x: { min: 0, max: W }, y: { min: 0, max: H }, lifespan: 9000, quantity: 1,
      speedX: { min: -7, max: 7 }, speedY: { min: -5, max: 5 },
      scale: { min: .15, max: .4 }, alpha: { start: .6, end: 0 },
      tint: theme.motes.color, blendMode: 'ADD',
    };
    const variants = {
      dust: {},
      spores: { speedY: { min: -12, max: -3 }, scale: { min: .2, max: .5 }, lifespan: 10000 },
      embers: { speedY: { min: -32, max: -12 }, speedX: { min: -10, max: 10 }, scale: { start: .35, end: 0 },
        lifespan: 6000, alpha: { start: .9, end: 0 }, tint: [0xffc77a, 0xff9a4a, 0xffe0a8] },
      ash: { speedY: { min: 6, max: 20 }, speedX: { min: -14, max: 4 }, scale: { min: .18, max: .36 },
        tint: [0xff9a7c, 0xc4473f, 0xffc0a0] },
      drips: { y: { min: 0, max: H * .35 }, speedX: 0, speedY: { min: 20, max: 40 }, gravityY: 420,
        lifespan: 2200, scale: { min: .16, max: .26 }, alpha: { start: .8, end: .2 } },
      spray: { y: { min: H * .6, max: H }, speedX: { min: 18, max: 60 }, speedY: { min: -22, max: -6 },
        alpha: { start: .4, end: 0 } },
    };
    const config = { ...base, ...(variants[kind] ?? {}) };
    const alive = Math.round(W / (kind === 'drips' ? 120 : 34));
    config.frequency = Math.max(8, config.lifespan / alive);
    const emitter = this.scene.add.particles(0, 0, 'fx-mote', config).setDepth(10);
    emitter.fastForward?.(config.lifespan);
    this.particles = emitter;
  }

  // Dark silhouettes in front of the action: they scroll faster than the
  // camera, which sells the depth of the scene.
  addForeground() {
    const { s, W, theme } = this;
    const g = this.scene.add.graphics().setDepth(20).setScrollFactor(FOREGROUND_PARALLAX);
    // Wide enough to cover the view at both ends of the level.
    const end = W * FOREGROUND_PARALLAX + 400 * s;
    for (let x = this.r(0, 200) * s; x < end; x += this.r(220, 520) * s) this.bottomShape(g, this.pick(theme.bottom), x);
    if (theme.top.length) {
      for (let x = this.r(0, 300) * s; x < end; x += this.r(380, 900) * s) this.topShape(g, this.pick(theme.top), x);
    }
    this.foreground = g;
  }

  bottomShape(g, kind, x) {
    const { s, H, theme } = this;
    const floor = H + 12 * s;
    g.fillStyle(theme.ink, .94);
    if (kind === 'grass') {
      const blades = 7 + Math.floor(this.rand() * 9);
      for (let i = 0; i < blades; i++) {
        const bx = x + this.r(-60, 60) * s, h = this.r(40, 125) * s, lean = this.r(-34, 34) * s;
        g.fillTriangle(bx - 4 * s, floor, bx + 4 * s, floor, bx + lean, floor - h);
      }
    } else if (kind === 'rocks' || kind === 'rubble') {
      const pieces = kind === 'rocks' ? 1 + Math.floor(this.rand() * 2) : 3 + Math.floor(this.rand() * 4);
      for (let i = 0; i < pieces; i++) {
        const cx = x + this.r(-80, 80) * s, radius = (kind === 'rocks' ? this.r(55, 130) : this.r(18, 46)) * s;
        const points = [];
        for (let a = 0; a < 7; a++) {
          const angle = Math.PI + (a / 6) * Math.PI;
          points.push({ x: cx + Math.cos(angle) * radius * this.r(.8, 1.15), y: floor + Math.sin(angle) * radius * this.r(.55, .9) });
        }
        g.fillPoints(points, true);
      }
    } else if (kind === 'thorns') {
      const height = this.r(90, 210) * s, lean = this.r(-90, 90) * s;
      const curve = new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(x, floor), new Phaser.Math.Vector2(x + lean * .2, floor - height * .6),
        new Phaser.Math.Vector2(x + lean, floor - height)).getPoints(14);
      g.lineStyle(7 * s, theme.ink, .94).strokePoints(curve);
      curve.forEach((p, i) => {
        if (i % 2 || i === 0) return;
        const side = i % 4 ? 1 : -1;
        g.fillTriangle(p.x, p.y - 3 * s, p.x, p.y + 3 * s, p.x + side * this.r(10, 18) * s, p.y - this.r(4, 10) * s);
      });
    } else if (kind === 'spikes') {
      const count = 3 + Math.floor(this.rand() * 5);
      for (let i = 0; i < count; i++) {
        const bx = x + i * 16 * s, h = this.r(30, 95) * s;
        g.fillTriangle(bx - 7 * s, floor, bx + 7 * s, floor, bx + this.r(-4, 4) * s, floor - h);
      }
    } else if (kind === 'candles') {
      const count = 2 + Math.floor(this.rand() * 3);
      for (let i = 0; i < count; i++) {
        const bx = x + i * this.r(14, 26) * s, h = this.r(26, 70) * s;
        g.fillRect(bx - 4 * s, floor - h, 8 * s, h);
        const flame = this.scene.add.image(bx, floor - h - 6 * s, 'fx-glow').setTint(0xffb35a)
          .setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(30 * s, 42 * s).setAlpha(.75)
          .setDepth(21).setScrollFactor(FOREGROUND_PARALLAX);
        this.scene.tweens.add({ targets: flame, alpha: .45, scaleX: flame.scaleX * .85, duration: this.r(140, 260), yoyo: true, repeat: -1 });
      }
    }
  }

  topShape(g, kind, x) {
    const { s, theme } = this;
    g.fillStyle(theme.ink, .94);
    if (kind === 'stalactites') {
      const count = 2 + Math.floor(this.rand() * 4);
      for (let i = 0; i < count; i++) {
        const bx = x + this.r(-60, 60) * s, h = this.r(40, 150) * s, w = this.r(10, 26) * s;
        g.fillTriangle(bx - w, -4, bx + w, -4, bx + this.r(-4, 4) * s, h);
      }
    } else if (kind === 'chains') {
      const length = this.r(80, 240) * s;
      g.lineStyle(3 * s, theme.ink, .94);
      for (let y = -6 * s; y < length; y += 15 * s) {
        if ((y / (15 * s)) % 2 < 1) g.strokeEllipse(x, y, 9 * s, 16 * s); else g.fillRect(x - 1.5 * s, y - 7 * s, 3 * s, 14 * s);
      }
    } else if (kind === 'pipes') {
      const y = this.r(14, 50) * s, length = this.r(280, 640) * s, thick = this.r(20, 32) * s;
      g.fillRect(x, y, length, thick);
      for (let fx = x + 40 * s; fx < x + length; fx += this.r(90, 160) * s) g.fillRect(fx, y - 5 * s, 12 * s, thick + 10 * s);
      g.fillRect(x + length * .3, -4, thick * .6, y + 4);
    } else if (kind === 'cables') {
      const span = this.r(240, 560) * s, sag = this.r(40, 120) * s;
      const points = new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(x, -2), new Phaser.Math.Vector2(x + span / 2, sag * 2), new Phaser.Math.Vector2(x + span, -2)).getPoints(20);
      g.lineStyle(this.r(3, 6) * s, theme.ink, .94).strokePoints(points);
    } else if (kind === 'branches' || kind === 'roots') {
      const strands = kind === 'roots' ? 4 + Math.floor(this.rand() * 4) : 1;
      for (let i = 0; i < strands; i++) {
        const bx = x + this.r(-50, 50) * s, length = this.r(60, kind === 'roots' ? 160 : 230) * s, lean = this.r(-80, 80) * s;
        const points = new Phaser.Curves.QuadraticBezier(
          new Phaser.Math.Vector2(bx, -4), new Phaser.Math.Vector2(bx + lean * .3, length * .5),
          new Phaser.Math.Vector2(bx + lean, length)).getPoints(12);
        g.lineStyle((kind === 'roots' ? this.r(2, 4) : 8) * s, theme.ink, .94).strokePoints(points);
        if (kind === 'branches') {
          points.forEach((p, k) => {
            if (k % 3 !== 2) return;
            g.lineStyle(3 * s, theme.ink, .94).lineBetween(p.x, p.y, p.x + this.r(-30, 30) * s, p.y + this.r(10, 30) * s);
          });
        }
      }
    } else if (kind === 'ribs') {
      const width = this.r(260, 460) * s, depth = this.r(60, 120) * s;
      const points = new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(x, -4), new Phaser.Math.Vector2(x + width / 2, depth * 2), new Phaser.Math.Vector2(x + width, -4)).getPoints(24);
      g.lineStyle(this.r(16, 26) * s, theme.ink, .94).strokePoints(points);
      g.lineStyle(2 * s, theme.danger ?? theme.rim, .25).strokePoints(points.map(p => ({ x: p.x, y: p.y + 9 * s })));
    }
  }

  // Rain falls around the camera only, so it stays cheap on long levels.
  // Turn rain and lightning on or off (Settings > Rain effects).
  setRain(on) {
    if (!this.rain) return;
    this.rainOn = on;
    this.rain.setVisible(on);
    if (on) this.rain.start(); else this.rain.stop();
  }

  addRain(on = true) {
    this.rainOn = on;
    const cam = this.scene.cameras.main;
    const rain = this.scene.add.particles(0, -40, 'fx-rain', {
      x: { min: -150, max: this.scene.viewportWidth + 250 }, y: 0,
      speedY: { min: 950, max: 1250 }, speedX: { min: -200, max: -150 }, rotate: 9,
      lifespan: 900, quantity: 3, frequency: 16,
      scale: { min: .6, max: 1.1 }, alpha: { min: .14, max: .3 }, tint: 0xc5d9ea,
    }).setDepth(25);
    this.rain = rain;
    if (!on) { rain.stop(); rain.setVisible(false); }
    const onUpdate = () => {
      rain.setPosition(cam.worldView.x, cam.worldView.y - 40);
    };
    this.scene.events.on('postupdate', onUpdate);
    this.scene.events.once('shutdown', () => this.scene.events.off('postupdate', onUpdate));
  }

  // Soft vignette and slightly muted colour, WebGL only.
  addGrade() {
    const cam = this.scene.cameras.main;
    if (this.scene.renderer.type !== Phaser.WEBGL || !cam.postFX) return;
    cam.postFX.addVignette(.5, .5, .92, .34);
    const grade = cam.postFX.addColorMatrix();
    grade.saturate(this.theme.saturate);
  }
}
