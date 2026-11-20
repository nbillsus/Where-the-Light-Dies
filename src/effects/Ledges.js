import Phaser from 'phaser';
import { ensureFxTextures, seededRandom } from './textures.js';
import { afterCameraMoves } from './cameraSync.js';

// Dresses every platform so it looks like part of its place, not a flat
// cut-out. Owner: Lucas (graphics).
//
//  - Lip: the top edge is built from the area's material (stone slabs,
//    riveted metal plates, bricks, roots and moss, or glass shards).
//  - Underside: shade, chipped notches and hanging strands below the lip.
//  - Moonlit rim: a faint line above the light map, so you can always see
//    where to land.
//  - Lantern rim: every frame, the part of each lip near a light glows in
//    that light's colour, so edges catch the lantern (and torches, the
//    sword, the flare) as the boy passes.
//  - Falling bits: drips, dust or embers dropping from ledge undersides.
//
// Depths: 1 underside · 1.5 lip · 3 tufts · 9.5 falling bits ·
// 19.55 moonlit rim · 19.57 lantern rim (both above the light map).

// Which material each area's ledges are made of.
const STYLE_BY_AREA = {
  'storm-coast': 'stone', 'abandoned-facility': 'metal', thornwood: 'roots', 'drowned-cavern': 'stone', 'lantern-vault': 'brick',
  'moonbreak-reef': 'stone', 'glass-tide': 'crystal', 'ash-orchard': 'roots', 'hollow-observatory': 'brick', 'black-lens': 'brick',
  'sunken-archive': 'brick', 'bone-conduit': 'metal', 'mirror-well': 'crystal', 'silent-engine': 'metal', 'deep-transmitter': 'metal',
  'last-shore': 'stone', 'split-signal': 'crystal', 'red-cathedral': 'brick', 'night-array': 'crystal', threshold: 'stone',
};
// What falls from the ledges, by the area's particle kind.
const FALL_BY_MOTES = { drips: 'drip', spray: 'drip', embers: 'ember', ash: 'ash' };

const mix = (a, b, t) => {
  const ar = a >> 16 & 255, ag = a >> 8 & 255, ab = a & 255;
  return Math.round(ar + ((b >> 16 & 255) - ar) * t) << 16 | Math.round(ag + ((b >> 8 & 255) - ag) * t) << 8 | Math.round(ab + ((b & 255) - ab) * t);
};

export class Ledges {
  constructor(scene, theme) {
    this.scene = scene;
    this.theme = theme;
    this.s = scene.artScale;
    this.rand = seededRandom(`${scene.stage.id}-ledges`);
    this.style = theme.ledge ?? STYLE_BY_AREA[scene.stage.id] ?? (scene.stage.chapter === 2 ? 'metal' : 'stone');
    // Material colours: a little lighter than the area's ink, tinted by its rim light.
    this.body = mix(theme.ink, theme.rim, .18);
    this.face = mix(theme.ink, theme.rim, .3);
    this.edge = mix(theme.rim, 0xffffff, .2);
    ensureFxTextures(scene);
    this.under = scene.add.graphics().setDepth(1);
    this.lip = scene.add.graphics().setDepth(1.5);
    this.front = scene.add.graphics().setDepth(3);
    this.moon = scene.add.graphics().setDepth(19.55);
    for (const platform of scene.platforms) this.dress(platform);
    this.addFallingBits();
    this.glow = scene.add.graphics().setDepth(19.57).setBlendMode(Phaser.BlendModes.ADD);
    afterCameraMoves(scene, () => this.drawLanternRims());
  }

  r(min, max) { return min + this.rand() * (max - min); }

  dress({ left, right, y }) {
    const { s, theme } = this;
    const width = right - left;
    // Shade falling away under the lip, so the ledge reads as solid.
    this.under.fillGradientStyle(theme.ink, theme.ink, theme.ink, theme.ink, .6, .6, 0, 0)
      .fillRect(left, y + 8 * s, width, 110 * s);
    // Chipped notches along the underside of the lip.
    this.under.fillStyle(theme.ink, .9);
    for (let x = left + this.r(10, 40) * s; x < right - 14 * s; x += this.r(26, 70) * s) {
      const w = this.r(8, 22) * s, d = this.r(6, 16) * s;
      this.under.fillTriangle(x, y + 12 * s, x + w, y + 12 * s, x + w * this.r(.3, .7), y + 12 * s + d);
    }
    for (let x = left + this.r(6, 30) * s; x < right - 6 * s; x += this.r(18, 52) * s) this.hangingStrand(x, y + 14 * s);
    // Corner caps: a lit bevel where the ledge ends, the edge the eye reads first.
    for (const [cx, dir] of [[left, 1], [right, -1]]) {
      this.lip.fillStyle(this.face, 1).fillTriangle(cx, y, cx + dir * 12 * s, y, cx, y + 16 * s);
      this.lip.lineStyle(1.5 * s, this.edge, .55).lineBetween(cx, y, cx + dir * 10 * s, y);
    }
    this[this.style](left, right, y);
    // Faint moonlight on the lip, readable even in full darkness.
    this.moon.lineStyle(1.5 * s, theme.rim, .2).lineBetween(left + 6 * s, y + 1 * s, right - 6 * s, y + 1 * s);
  }

  // --- Materials ------------------------------------------------------------

  stone(left, right, y) {
    const { s, lip } = this;
    for (let x = left; x < right - 4 * s;) {
      const w = Math.min(right - x, this.r(26, 64) * s), lift = this.r(-2.5, 1.5) * s, h = this.r(9, 15) * s;
      const tilt = this.r(-1.5, 1.5) * s;
      lip.fillStyle(this.r(0, 1) < .5 ? this.body : this.face, 1).fillPoints([
        { x: x + 1 * s, y: y + lift - tilt }, { x: x + w - 1.5 * s, y: y + lift + tilt },
        { x: x + w - 3 * s, y: y + h }, { x: x + 2 * s, y: y + h + this.r(-2, 2) * s },
      ], true);
      lip.lineStyle(1.4 * s, this.edge, .45).lineBetween(x + 2 * s, y + lift - tilt, x + w - 3 * s, y + lift + tilt);
      if (this.theme.motes.kind === 'drips' || this.theme.motes.kind === 'spray') {
        if (this.rand() < .35) lip.fillStyle(this.edge, .5).fillCircle(x + w * this.r(.2, .8), y + h * .45, 1.2 * s);
      }
      if (this.rand() < .25) lip.fillStyle(this.body, 1).fillCircle(x + w * this.r(.2, .8), y + lift - 2 * s, this.r(1.5, 3.5) * s);
      x += w + this.r(1, 2.5) * s;
    }
  }

  metal(left, right, y) {
    const { s, lip, theme } = this;
    for (let x = left; x < right - 4 * s;) {
      const w = Math.min(right - x, this.r(60, 120) * s), h = 11 * s;
      lip.fillStyle(this.face, 1).fillRect(x, y - 1 * s, w - 1.5 * s, h);
      lip.lineStyle(1.4 * s, this.edge, .5).lineBetween(x, y - 1 * s, x + w - 2 * s, y - 1 * s);
      lip.lineStyle(1 * s, theme.ink, .9).lineBetween(x + w - 1.5 * s, y - 1 * s, x + w - 1.5 * s, y + h);
      lip.fillStyle(this.edge, .55);
      for (const rx of [x + 5 * s, x + w - 8 * s]) lip.fillCircle(rx, y + 4.5 * s, 1.5 * s);
      // Rust bleeding down from the seams.
      if (this.rand() < .6) {
        const rx = x + w * this.r(.15, .85), length = this.r(14, 46) * s;
        this.under.fillGradientStyle(theme.drip, theme.drip, theme.drip, theme.drip, .45, .45, 0, 0)
          .fillRect(rx, y + h, this.r(2, 5) * s, length);
      }
      x += w;
    }
  }

  brick(left, right, y) {
    const { s, lip, theme } = this;
    const course = 9 * s;
    for (let row = 0; row < 2; row++) {
      const top = y - 1 * s + row * course;
      for (let x = left - (row ? this.r(8, 18) * s : 0); x < right;) {
        const w = this.r(26, 40) * s, x0 = Math.max(left, x), x1 = Math.min(right, x + w - 1.5 * s);
        // Now and then a brick has crumbled away.
        if (x1 > x0 && !(row === 1 && this.rand() < .12)) {
          lip.fillStyle(row ? this.body : this.face, 1).fillRect(x0, top, x1 - x0, course - 1.5 * s);
          if (!row) lip.lineStyle(1.3 * s, this.edge, .45).lineBetween(x0, top, x1, top);
        }
        x += w;
      }
    }
    lip.lineStyle(1 * s, theme.ink, .8).lineBetween(left, y + course - 1 * s, right, y + course - 1 * s);
  }

  roots(left, right, y) {
    const { s, lip, theme } = this;
    // A soil lip, uneven on top.
    const top = [];
    for (let x = left; x <= right; x += 14 * s) top.push({ x: Math.min(x, right), y: y + this.r(-3, 1.5) * s });
    lip.fillStyle(this.body, 1).fillPoints([...top, { x: right, y: y + 12 * s }, { x: left, y: y + 12 * s }], true);
    lip.lineStyle(1.3 * s, this.edge, .35).strokePoints(top);
    // Moss cushions on top and roots curling over the edge.
    for (let x = left + this.r(4, 20) * s; x < right - 10 * s; x += this.r(22, 60) * s) {
      lip.fillStyle(mix(this.face, theme.accent, .18), 1).fillEllipse(x, y - 1 * s, this.r(10, 26) * s, this.r(4, 7) * s);
    }
    for (let x = left + this.r(10, 40) * s; x < right - 10 * s; x += this.r(40, 110) * s) {
      const length = this.r(18, 48) * s, curl = this.r(-14, 14) * s;
      const points = new Phaser.Curves.CubicBezier(
        new Phaser.Math.Vector2(x, y + 2 * s), new Phaser.Math.Vector2(x + curl, y + length * .35),
        new Phaser.Math.Vector2(x - curl, y + length * .7), new Phaser.Math.Vector2(x + curl * .5, y + length)).getPoints(10);
      this.under.lineStyle(this.r(2, 3.5) * s, theme.ink, 1).strokePoints(points);
    }
    for (let x = left + this.r(10, 60) * s; x < right - 12 * s; x += this.r(50, 120) * s) this.tuft(x, y, this.r(7, 16) * s);
  }

  crystal(left, right, y) {
    const { s, lip, theme } = this;
    lip.fillStyle(this.body, 1).fillRect(left, y - 1 * s, right - left, 10 * s);
    lip.lineStyle(1.3 * s, this.edge, .4).lineBetween(left, y - 1 * s, right, y - 1 * s);
    // Shards jutting from the edge, each with a lit facet.
    for (let x = left + this.r(6, 24) * s; x < right - 8 * s; x += this.r(14, 44) * s) {
      const h = this.r(6, 20) * s, w = this.r(4, 9) * s, lean = this.r(-6, 6) * s;
      lip.fillStyle(this.face, 1).fillTriangle(x - w, y, x + w, y, x + lean, y - h);
      lip.fillStyle(theme.rim, .35).fillTriangle(x, y, x + w, y, x + lean, y - h);
    }
  }

  // --- Small dressing ---------------------------------------------------------

  hangingStrand(x, y) {
    const { s, theme } = this;
    const length = this.r(8, 56) * s;
    if (this.style === 'metal' || this.style === 'brick') {
      if (this.rand() < .5) this.under.lineStyle(this.r(1.5, 3) * s, theme.ink, .85).lineBetween(x, y, x + this.r(-2, 2) * s, y + length * .6);
      return;
    }
    const sway = this.r(-10, 10) * s;
    const points = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(x, y), new Phaser.Math.Vector2(x + sway, y + length * .5),
      new Phaser.Math.Vector2(x + sway * .4, y + length)).getPoints(8);
    this.under.lineStyle(this.r(1.5, 3) * s, theme.ink, .9).strokePoints(points);
    if (this.rand() < .3) {
      const end = points[points.length - 1];
      this.under.fillStyle(theme.drip, .55).fillCircle(end.x, end.y + 2 * s, 2 * s);
    }
  }

  tuft(x, y, height) {
    const blades = 3 + Math.floor(this.rand() * 4), s = this.s;
    this.front.fillStyle(this.theme.ink, .95);
    for (let i = 0; i < blades; i++) {
      const base = x + (i - blades / 2) * 3 * s, lean = this.r(-6, 6) * s;
      this.front.fillTriangle(base - 1.6 * s, y, base + 1.6 * s, y, base + lean, y - height * this.r(.6, 1.1));
    }
  }

  // Drips, dust, ash or embers falling from (or rising off) the ledges.
  addFallingBits() {
    const { s, theme, scene } = this;
    const kind = FALL_BY_MOTES[theme.motes.kind] ?? 'dust';
    const ledges = scene.platforms.filter(p => p.right - p.left > 40 * s);
    const total = ledges.reduce((sum, p) => sum + p.right - p.left, 0);
    if (!total) return;
    const rising = kind === 'ember';
    const source = {
      getRandomPoint: (point) => {
        let pick = Math.random() * total;
        const p = ledges.find(l => (pick -= l.right - l.left) <= 0) ?? ledges[0];
        point.x = p.left + 8 * s + Math.random() * (p.right - p.left - 16 * s);
        point.y = rising ? p.y - 2 * s : p.y + 14 * s;
        return point;
      },
    };
    const looks = {
      drip: { gravityY: 900, speedY: { min: 0, max: 20 }, lifespan: 900, scale: { start: .2 * s + .05, end: .14 * s + .04 }, tint: theme.drip, alpha: { start: .85, end: .3 } },
      dust: { gravityY: 160, speedX: { min: -8, max: 8 }, lifespan: 1400, scale: { min: .08, max: .16 }, tint: theme.rim, alpha: { start: .5, end: 0 } },
      ash: { gravityY: 40, speedX: { min: -14, max: 14 }, lifespan: 2600, scale: { min: .1, max: .2 }, tint: theme.motes.color, alpha: { start: .6, end: 0 } },
      ember: { gravityY: -50, speedX: { min: -12, max: 12 }, lifespan: 1800, scale: { start: .22, end: 0 }, tint: [0xffb35a, 0xffd38a], alpha: { start: .9, end: 0 }, blendMode: 'ADD' },
    }[kind];
    const alive = Math.max(6, Math.round(total / (150 * s)));
    this.falling = scene.add.particles(0, 0, 'fx-mote', {
      ...looks, emitZone: { type: 'random', source }, quantity: 1, frequency: looks.lifespan / alive,
    }).setDepth(9.5);
  }

  // --- Lantern rims (every frame) ---------------------------------------------

  drawLanternRims() {
    const { scene, s } = this;
    const g = this.glow.clear();
    const view = scene.cameras.main.worldView;
    const minSize = (scene.spriteHeight ?? 150) * 1.3; // skips small glows like enemy eyes
    const lights = scene.atmosphere?.lighting?.lights?.length
      ? scene.atmosphere.lighting.lights
      : [{ x: scene.player.x, y: scene.player.y, width: minSize * 5.6, height: minSize * 4.8, color: this.theme.lantern ?? 0xffd9a0, strength: 1 }];
    const step = 9 * s;
    for (const light of lights) {
      if (light.width < minSize || light.strength < .15) continue;
      const rx = light.width * .4, ry = light.height * .42;
      if (light.x + rx < view.x || light.x - rx > view.right) continue;
      // Added light washes out to white on pale stone, so lit edges use a
      // deeper amber than the light itself to stay visibly warm.
      const color = mix(light.color, 0xff7a1e, .45);
      for (const p of scene.platforms) {
        const dy = p.y - light.y;
        if (Math.abs(dy) >= ry) continue;
        const reach = rx * Math.sqrt(1 - (dy / ry) ** 2);
        const from = Math.max(p.left + 4 * s, light.x - reach, view.x), to = Math.min(p.right - 4 * s, light.x + reach, view.right);
        for (let x = from; x < to; x += step) {
          const fall = 1 - Math.abs(x + step / 2 - light.x) / reach;
          if (fall <= 0) continue;
          const alpha = Math.min(1, light.strength) * fall * fall * (1 - (dy / ry) ** 2);
          const end = Math.min(x + step, to);
          // Warm wash on the ledge face just under the lip...
          g.fillGradientStyle(color, color, color, color, alpha * .32, alpha * .32, 0, 0).fillRect(x, p.y, end - x, 20 * s);
          // ...a soft halo along the edge, and the bright lit edge itself.
          g.lineStyle(7 * s, color, alpha * .2).lineBetween(x, p.y + 1 * s, end, p.y + 1 * s);
          g.lineStyle(2.5 * s, color, alpha * .6).lineBetween(x, p.y - .5 * s, end, p.y - .5 * s);
        }
      }
    }
  }
}
