import Phaser from 'phaser';
import { ensureFxTextures } from '../effects/textures.js';

// Hand-inked art for every object the player can use. Puzzle code keeps its
// own invisible physics shapes; these drawings sit on top and expose simple
// state changes (lit, open, anchored). Owner: Lucas (graphics).
//
// Readability rules: anything interactive glows softly in the area's accent
// colour and "breathes"; it brightens and animates when activated; cables
// show which mechanism opens which gate.

const INK = 0x05070b;
const IRON = 0x1c2228;
const IRON_LIGHT = 0x66727c;
const STONE = 0x232a31;
const BRASS = 0xb8925a;

function glow(scene, x, y, color, size, alpha, depth) {
  ensureFxTextures(scene);
  return scene.add.image(x, y, 'fx-glow').setTint(color).setBlendMode(Phaser.BlendModes.ADD)
    .setDisplaySize(size, size).setAlpha(alpha).setDepth(depth);
}

function breathe(scene, target, low, high, duration = 1600) {
  target.setAlpha(low);
  return scene.tweens.add({ targets: target, alpha: high, duration, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
}

// Keep a drawing glued to a moving physics shape.
function follow(scene, art, target, offsetY = 0) {
  const sync = () => {
    if (!target.active) return;
    art.setPosition(target.x, target.y + offsetY);
  };
  scene.events.on('postupdate', sync);
  scene.events.once('shutdown', () => scene.events.off('postupdate', sync));
  sync();
}

function burst(scene, x, y, color, s, count = 14) {
  ensureFxTextures(scene);
  const emitter = scene.add.particles(x, y, 'fx-mote', {
    speed: { min: 40, max: 160 }, angle: { min: 200, max: 340 }, gravityY: 260,
    lifespan: { min: 400, max: 800 }, scale: { start: .45 * Math.max(s, .6), end: 0 },
    tint: color, blendMode: 'ADD', emitting: false,
  }).setDepth(11);
  emitter.explode(count);
  scene.time.delayedCall(1000, () => emitter.destroy());
}

// Top of the nearest platform under a point.
export function floorBelow(scene, x, y) {
  let best = scene.viewportHeight;
  for (const p of scene.platforms) if (x >= p.left - 4 && x <= p.right + 4 && p.y >= y - 2 && p.y < best) best = p.y;
  return best;
}

export function hideShape(shape) {
  shape.setFillStyle(0x000000, 0).setStrokeStyle();
  return shape;
}

// --- Crate and iron weight ----------------------------------------------------

export function crate(scene, target, size, s, { dark = false } = {}) {
  const wood = dark ? 0x4a3526 : 0x5b4330;
  const art = scene.add.container(0, 0).setDepth(6);
  const g = scene.add.graphics();
  const h = size / 2;
  g.fillStyle(wood, 1).fillRect(-h, -h, size, size);
  g.lineStyle(2 * s, 0x2e2117, .9);
  for (let i = 1; i < 4; i++) g.lineBetween(-h, -h + i * size / 4, h, -h + i * size / 4);
  g.lineStyle(6 * s, 0x2e2117, 1).lineBetween(-h + 8 * s, h - 8 * s, h - 8 * s, -h + 8 * s);
  g.fillStyle(IRON, 1).fillRect(-h, -h, size, 7 * s).fillRect(-h, h - 7 * s, size, 7 * s);
  g.fillStyle(IRON_LIGHT, .9);
  for (const x of [-h + 6 * s, 0, h - 6 * s]) g.fillCircle(x, -h + 3.5 * s, 1.8 * s).fillCircle(x, h - 3.5 * s, 1.8 * s);
  g.lineStyle(3 * s, INK, 1).strokeRect(-h, -h, size, size);
  g.lineStyle(2 * s, 0xe0c69a, .3).lineBetween(-h + 3 * s, -h + 9 * s, h - 3 * s, -h + 9 * s);
  art.add(g);
  follow(scene, art, target);
  return art;
}

export function weight(scene, target, size, s, accent) {
  const art = scene.add.container(0, 0).setDepth(7);
  const g = scene.add.graphics();
  const h = size / 2;
  g.lineStyle(4 * s, 0x6b5a50, 1).strokeCircle(0, -h - 2 * s, size * .17);
  g.fillStyle(0x2b2327, 1).fillPoints([
    { x: -size * .46, y: h }, { x: size * .46, y: h }, { x: size * .33, y: -h * .7 }, { x: -size * .33, y: -h * .7 },
  ], true);
  g.fillStyle(0x3d3237, 1).fillRect(-size * .38, -h * .7 - 5 * s, size * .76, 8 * s);
  g.fillStyle(0x433539, 1).fillRect(-size * .44, h * .25, size * .88, 6 * s);
  g.lineStyle(3 * s, INK, 1).strokePoints([
    { x: -size * .46, y: h }, { x: size * .46, y: h }, { x: size * .33, y: -h * .7 }, { x: -size * .33, y: -h * .7 },
  ], true);
  g.fillStyle(accent, .85).fillRect(-size * .2, -h * .1, size * .4, 3 * s);
  const shine = glow(scene, 0, -h * .1, accent, size * 1.3, .3, 0);
  breathe(scene, shine, .15, .4, 1800);
  art.add([shine, g]);
  follow(scene, art, target);
  return art;
}

// --- Pressure plate ---------------------------------------------------------------

export function plate(scene, x, floorY, s, accent) {
  const art = scene.add.container(x, floorY).setDepth(5);
  const halo = glow(scene, 0, -18 * s, accent, 150 * s, .12, 0);
  const pulse = breathe(scene, halo, .08, .22, 1700);
  const base = scene.add.graphics();
  const trapezoid = [{ x: -62 * s, y: 0 }, { x: 62 * s, y: 0 }, { x: 54 * s, y: -14 * s }, { x: -54 * s, y: -14 * s }];
  base.fillStyle(STONE, 1).fillPoints(trapezoid, true);
  base.lineStyle(3 * s, BRASS, .85).strokePoints(trapezoid, true);
  const top = scene.add.container(0, 0);
  const slab = scene.add.graphics();
  slab.fillStyle(0x2f373d, 1).fillRect(-44 * s, -25 * s, 88 * s, 11 * s);
  slab.lineStyle(2 * s, INK, 1).strokeRect(-44 * s, -25 * s, 88 * s, 11 * s);
  const rune = scene.add.graphics();
  const drawRune = (color, alpha) => {
    rune.clear().lineStyle(2 * s, color, alpha);
    rune.strokePoints([{ x: -14 * s, y: -19.5 * s }, { x: 0, y: -23 * s }, { x: 14 * s, y: -19.5 * s }, { x: 0, y: -16 * s }], true);
    rune.lineBetween(-26 * s, -19.5 * s, -18 * s, -19.5 * s).lineBetween(18 * s, -19.5 * s, 26 * s, -19.5 * s);
  };
  drawRune(accent, .45);
  top.add([slab, rune]);
  art.add([halo, base, top]);
  let active = false;
  return {
    art,
    setActive(on) {
      if (on === active) return;
      active = on;
      scene.tweens.add({ targets: top, y: on ? 5 * s : 0, duration: 140 });
      drawRune(on ? 0xfff1c8 : accent, on ? 1 : .45);
      pulse.pause();
      scene.tweens.add({ targets: halo, alpha: on ? .75 : .12, duration: 250, onComplete: () => { if (!on) pulse.resume(); } });
      if (on) burst(scene, x, floorY - 20 * s, accent, s);
    },
  };
}

// --- Gate (portcullis) -----------------------------------------------------------

export function gate(scene, x, floorY, s, color) {
  const art = scene.add.container(x, 0).setDepth(7);
  const g = scene.add.graphics();
  const bottom = floorY - 16 * s;
  const bars = [-27, -13.5, 0, 13.5, 27].map(v => v * s);
  g.fillStyle(0x0b0e12, .55).fillRect(-31 * s, 0, 62 * s, bottom);
  for (const bx of bars) {
    g.fillStyle(IRON, 1).fillRect(bx - 4.5 * s, 0, 9 * s, bottom);
    g.fillTriangle(bx - 5.5 * s, bottom, bx + 5.5 * s, bottom, bx, floorY + 2 * s);
    g.lineStyle(2 * s, IRON_LIGHT, .55).lineBetween(bx - 2.5 * s, 0, bx - 2.5 * s, bottom);
    g.lineStyle(1.5 * s, INK, 1).strokeRect(bx - 4.5 * s, 0, 9 * s, bottom);
  }
  for (let y = 36 * s; y < bottom - 40 * s; y += 74 * s) {
    g.fillStyle(IRON, 1).fillRect(-34 * s, y, 68 * s, 10 * s);
    g.lineStyle(2 * s, INK, 1).strokeRect(-34 * s, y, 68 * s, 10 * s);
    g.fillStyle(IRON_LIGHT, .95);
    for (const bx of bars) g.fillCircle(bx, y + 5 * s, 2.4 * s);
  }
  const lockY = floorY - 140 * s;
  const halo = glow(scene, 0, lockY, color, 170 * s, .5, 0);
  const pulse = breathe(scene, halo, .3, .7, 1500);
  const lock = scene.add.graphics();
  lock.fillStyle(IRON, 1).fillRect(-30 * s, lockY - 26 * s, 60 * s, 52 * s);
  lock.lineStyle(2 * s, INK, 1).strokeRect(-30 * s, lockY - 26 * s, 60 * s, 52 * s);
  lock.fillStyle(0x0d1013, 1).fillCircle(0, lockY, 20 * s);
  lock.lineStyle(3 * s, color, .95).strokeCircle(0, lockY, 20 * s);
  lock.lineStyle(2.4 * s, color, .95);
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI / 3;
    lock.lineBetween(Math.cos(a) * -11 * s, lockY + Math.sin(a) * -11 * s, Math.cos(a) * 11 * s, lockY + Math.sin(a) * 11 * s);
  }
  art.add([g, halo, lock]);
  let opened = false;
  return {
    art,
    lock: { x, y: lockY },
    // Where cables plug in: the foot of the gate, which stays put when it rises.
    base: { x: x - 30 * s, y: floorY - 4 * s },
    setOpen(open) {
      if (open === opened) return;
      opened = open;
      scene.tweens.add({ targets: art, y: open ? -(floorY - 60 * s) : 0, duration: open ? 900 : 500, ease: open ? 'Cubic.easeInOut' : 'Bounce.easeOut' });
      if (open) { pulse.pause(); halo.setAlpha(.12); burst(scene, x, floorY - 6 * s, 0xc9c0b0, s, 18); } else pulse.resume();
    },
  };
}

// --- Lever on a pedestal ------------------------------------------------------------

export function lever(scene, x, y, s, accent, { timed = false, lamps = 0 } = {}) {
  const floor = floorBelow(scene, x, y);
  const k = s * 1.35;
  const art = scene.add.container(x, y).setDepth(6);
  const halo = glow(scene, 0, 8 * k, accent, 90 * k, .25, 0);
  const pulse = breathe(scene, halo, .15, .4, 1400);
  const body = scene.add.graphics();
  const column = Math.max(0, floor - y - 16 * k);
  body.fillStyle(STONE, 1).fillRect(-9 * k, 16 * k, 18 * k, column);
  body.fillPoints([{ x: -16 * k, y: floor - y }, { x: 16 * k, y: floor - y }, { x: 10 * k, y: floor - y - 8 * k }, { x: -10 * k, y: floor - y - 8 * k }], true);
  body.lineStyle(2 * k, INK, 1).strokeRect(-9 * k, 16 * k, 18 * k, column);
  body.fillStyle(0x4a381f, 1).fillRoundedRect(-17 * k, -2 * k, 34 * k, 19 * k, 4 * k);
  body.lineStyle(2 * k, BRASS, .9).strokeRoundedRect(-17 * k, -2 * k, 34 * k, 19 * k, 4 * k);
  const arm = scene.add.graphics();
  arm.lineStyle(4 * k, IRON_LIGHT, 1).lineBetween(0, 0, 0, -30 * k);
  arm.fillStyle(0x8a6a3a, 1).fillCircle(0, -30 * k, 5 * k);
  arm.lineStyle(1.5 * k, INK, 1).strokeCircle(0, -30 * k, 5 * k);
  arm.setPosition(0, -1 * k).setAngle(-35);
  const bulb = scene.add.graphics();
  const drawBulb = (color, alpha) => bulb.clear().fillStyle(color, alpha).fillCircle(0, 8 * k, 5.5 * k)
    .lineStyle(2 * k, BRASS, 1).strokeCircle(0, 8 * k, 5.5 * k);
  drawBulb(0x2a2218, 1);
  const ring = scene.add.graphics();
  const lampDots = [];
  const lampGlows = [];
  for (let i = 0; i < lamps; i++) {
    const ly = 26 * k + i * 10 * k;
    const dot = scene.add.graphics();
    lampGlows.push(glow(scene, 0, ly, accent, 30 * k, 0, 0));
    lampDots.push({ dot, ly });
  }
  const drawLamp = (i, on) => lampDots[i].dot.clear().fillStyle(on ? accent : 0x2a2a2a, 1).fillCircle(0, lampDots[i].ly, 3.2 * k)
    .lineStyle(1.2 * k, BRASS, .9).strokeCircle(0, lampDots[i].ly, 3.2 * k);
  lampDots.forEach((_, i) => drawLamp(i, false));
  art.add([halo, body, arm, bulb, ring, ...lampGlows, ...lampDots.map(l => l.dot)]);
  let active = false;
  return {
    art,
    activate() {
      if (active && !timed) return;
      active = true;
      scene.tweens.add({ targets: arm, angle: 35, duration: 260, ease: 'Back.easeOut' });
      drawBulb(accent, 1);
      pulse.pause();
      scene.tweens.add({ targets: halo, alpha: .95, duration: 200 });
      burst(scene, x, y + 8 * k, accent, s);
    },
    reset() {
      active = false;
      scene.tweens.add({ targets: arm, angle: -35, duration: 300 });
      drawBulb(0x2a2218, 1);
      ring.clear();
      pulse.resume();
    },
    setTimer(fraction) {
      ring.clear();
      if (fraction <= 0) return;
      ring.lineStyle(3 * k, accent, .95).beginPath()
        .arc(0, 8 * k, 10 * k, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, fraction), false).strokePath();
    },
    setLamp(i, on) { drawLamp(i, on); lampGlows[i].setAlpha(on ? .9 : 0); },
    deny() {
      const flash = glow(scene, x, y + 8 * k, 0xff4d4d, 80 * k, .9, 8);
      scene.tweens.add({ targets: flash, alpha: 0, duration: 450, onComplete: () => flash.destroy() });
      scene.tweens.add({ targets: art, x: x + 3 * k, duration: 45, yoyo: true, repeat: 3 });
    },
  };
}

// --- Shadow seal and prism (places the Shadow anchors) -------------------------------

export function seal(scene, x, y, s, accent) {
  const art = scene.add.container(x, y).setDepth(5);
  const halo = glow(scene, 0, 0, accent, 210 * s, .18, 0);
  const pulse = breathe(scene, halo, .12, .3, 1900);
  const ring = scene.add.graphics();
  ring.lineStyle(10 * s, STONE, 1).strokeCircle(0, 0, 36 * s);
  ring.lineStyle(2 * s, INK, 1).strokeCircle(0, 0, 41 * s).strokeCircle(0, 0, 31 * s);
  ring.fillStyle(0x04060a, .92).fillCircle(0, 0, 26 * s);
  const ticks = scene.add.graphics();
  const drawTicks = alpha => {
    ticks.clear().lineStyle(2 * s, accent, alpha);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      ticks.lineBetween(Math.cos(a) * 32 * s, Math.sin(a) * 32 * s, Math.cos(a) * 40 * s, Math.sin(a) * 40 * s);
    }
  };
  drawTicks(.55);
  const wisps = scene.add.graphics();
  for (let k = 0; k < 3; k++) {
    const points = [];
    for (let t = 0; t <= 1; t += .08) {
      const a = k * Math.PI * 2 / 3 + t * Math.PI * 1.4;
      const r = (24 - t * 18) * s;
      points.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    wisps.lineStyle(2.2 * s, accent, .6).strokePoints(points);
  }
  const spin = scene.tweens.add({ targets: wisps, angle: -360, duration: 7000, repeat: -1 });
  const core = scene.add.graphics();
  const drawCore = (radius, alpha) => core.clear().fillStyle(accent, alpha).fillCircle(0, 0, radius);
  drawCore(4 * s, .3);
  art.add([halo, ring, ticks, wisps, core]);
  let active = false;
  return {
    art,
    setActive(on) {
      if (on === active) return;
      active = on;
      drawTicks(on ? 1 : .55);
      drawCore(on ? 13 * s : 4 * s, on ? .85 : .3);
      spin.timeScale = on ? 4 : 1;
      if (on) { pulse.pause(); halo.setAlpha(.7); burst(scene, x, y, accent, s); } else pulse.resume();
    },
  };
}

export function prism(scene, x, y, s, accent) {
  const art = scene.add.container(x, y).setDepth(5);
  const halo = glow(scene, 0, 0, accent, 200 * s, .2, 0);
  const pulse = breathe(scene, halo, .14, .32, 1700);
  const rays = scene.add.graphics().setAlpha(0);
  rays.lineStyle(3 * s, accent, .7);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    rays.lineBetween(Math.cos(a) * 30 * s, Math.sin(a) * 30 * s, Math.cos(a) * 78 * s, Math.sin(a) * 78 * s);
  }
  scene.tweens.add({ targets: rays, angle: 360, duration: 14000, repeat: -1 });
  const crystal = scene.add.graphics();
  const shape = [{ x: 0, y: -40 * s }, { x: 15 * s, y: -14 * s }, { x: 15 * s, y: 18 * s }, { x: 0, y: 40 * s }, { x: -15 * s, y: 18 * s }, { x: -15 * s, y: -14 * s }];
  const drawCrystal = alpha => {
    crystal.clear().fillStyle(accent, alpha).fillPoints(shape, true);
    crystal.lineStyle(2 * s, 0xf2fffd, .9).strokePoints(shape, true);
    crystal.lineStyle(1.2 * s, 0xf2fffd, .5).lineBetween(0, -40 * s, 0, 40 * s)
      .lineBetween(-15 * s, -14 * s, 15 * s, 18 * s).lineBetween(15 * s, -14 * s, -15 * s, 18 * s);
  };
  drawCrystal(.3);
  scene.tweens.add({ targets: crystal, y: -6 * s, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  art.add([halo, rays, crystal]);
  let active = false;
  return {
    art,
    setActive(on) {
      if (on === active) return;
      active = on;
      drawCrystal(on ? .8 : .3);
      scene.tweens.add({ targets: rays, alpha: on ? 1 : 0, duration: 300 });
      if (on) { pulse.pause(); halo.setAlpha(.75); burst(scene, x, y, accent, s); } else pulse.resume();
    },
  };
}

// --- Shadow bridge --------------------------------------------------------------------

export function shadowBridge(scene, left, right, top, s, color) {
  const art = scene.add.container(0, 0).setDepth(3);
  const g = scene.add.graphics();
  const width = right - left;
  const count = Math.max(4, Math.round(width / (34 * s)));
  const plank = width / count;
  for (let i = 0; i < count; i++) {
    const px = left + i * plank + 1.5 * s, py = top + Math.sin(i * 1.7) * 2 * s;
    g.fillStyle(0x140f1e, .95).fillRect(px, py, plank - 3 * s, 16 * s);
    g.lineStyle(1.5 * s, color, .55).strokeRect(px, py, plank - 3 * s, 16 * s);
    const tail = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(px + plank / 2, py + 16 * s),
      new Phaser.Math.Vector2(px + plank / 2 + 8 * s, py + 34 * s),
      new Phaser.Math.Vector2(px + plank / 2 - 4 * s, py + (40 + (i % 3) * 14) * s)).getPoints(8);
    g.lineStyle(2 * s, color, .3).strokePoints(tail);
  }
  g.lineStyle(2 * s, color, .7).lineBetween(left, top, right, top);
  art.add(g);
  return art;
}

// --- Chapter 2: beam emitter and receptor --------------------------------------------

export function beamEmitter(scene, x, bottom, s, danger) {
  const art = scene.add.container(x, 0).setDepth(6);
  const g = scene.add.graphics();
  const housing = [{ x: -26 * s, y: -4 }, { x: 26 * s, y: -4 }, { x: 20 * s, y: 34 * s }, { x: 9 * s, y: 46 * s }, { x: -9 * s, y: 46 * s }, { x: -20 * s, y: 34 * s }];
  g.fillStyle(0x1a1216, 1).fillPoints(housing, true);
  g.lineStyle(2.5 * s, INK, 1).strokePoints(housing, true);
  g.lineStyle(2 * s, 0x5a3c40, .9).lineBetween(-18 * s, 14 * s, 18 * s, 14 * s);
  const lens = glow(scene, 0, 46 * s, danger, 60 * s, .9, 0);
  g.fillStyle(danger, 1).fillCircle(0, 46 * s, 6 * s);
  art.add([lens, g]);
  const scorch = glow(scene, x, bottom, danger, 110 * s, .45, 5).setDisplaySize(110 * s, 28 * s);
  const sparks = scene.add.particles(x, bottom, 'fx-mote', {
    speedX: { min: -70, max: 70 }, speedY: { min: -140, max: -40 }, gravityY: 320,
    lifespan: 600, scale: { start: .3, end: 0 }, tint: [danger, 0xffd0a0], blendMode: 'ADD', frequency: 70,
  }).setDepth(11);
  let on = true;
  return {
    art,
    setDangerous(dangerous) {
      lens.setAlpha(dangerous ? .9 : .15);
      scorch.setAlpha(dangerous ? .4 + Math.random() * .15 : .03);
      if (dangerous === on) return;
      on = dangerous;
      if (on) sparks.start(); else sparks.stop();
    },
  };
}

export function receptor(scene, x, y, s, danger, safe) {
  const art = scene.add.container(x, y).setDepth(5);
  const halo = glow(scene, 0, 0, danger, 170 * s, .35, 0);
  const pulse = breathe(scene, halo, .2, .45, 1100);
  const housing = scene.add.graphics();
  const teeth = [];
  for (let i = 0; i < 16; i++) {
    const a = i * Math.PI / 8, r = (i % 2 ? 36 : 43) * s;
    teeth.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
  }
  housing.fillStyle(0x1c1418, 1).fillPoints(teeth, true);
  housing.lineStyle(2 * s, INK, 1).strokePoints(teeth, true);
  housing.lineStyle(4 * s, 0x4a3a3e, 1).strokeCircle(0, 0, 29 * s);
  const lens = scene.add.graphics();
  const drawLens = (color, open) => {
    lens.clear().fillStyle(color, .9).fillCircle(0, 0, 22 * s);
    lens.fillStyle(0x1a0508, 1).fillEllipse(0, 0, (open ? 16 : 5) * s, 30 * s);
    lens.fillStyle(0xffffff, .55).fillCircle(-8 * s, -8 * s, 3 * s);
  };
  drawLens(danger, false);
  art.add([halo, housing, lens]);
  let active = false;
  return {
    art,
    setActive(on) {
      if (on === active) return;
      active = on;
      drawLens(on ? safe : danger, on);
      halo.setTint(on ? safe : danger);
      if (on) burst(scene, x, y, safe, s);
      pulse.timeScale = on ? .4 : 1;
    },
  };
}

// --- Cables and rune lines that show cause and effect --------------------------------

export function link(scene, from, to, s, color, style = 'cable') {
  const sag = style === 'cable' ? Math.max(from.y, to.y) + 70 * s : Math.min(from.y, to.y) - 50 * s;
  const curve = new Phaser.Curves.QuadraticBezier(
    new Phaser.Math.Vector2(from.x, from.y), new Phaser.Math.Vector2((from.x + to.x) / 2, sag), new Phaser.Math.Vector2(to.x, to.y));
  const points = curve.getPoints(48);
  const dark = scene.add.graphics().setDepth(3);
  const lit = scene.add.graphics().setDepth(3).setAlpha(0);
  if (style === 'cable') {
    dark.lineStyle(4 * s, INK, .75).strokePoints(points);
    lit.lineStyle(2 * s, color, .95).strokePoints(points);
  } else {
    points.forEach((p, i) => {
      if (i % 3) return;
      dark.fillStyle(color, .16).fillCircle(p.x, p.y, 2 * s);
      lit.fillStyle(color, .95).fillCircle(p.x, p.y, 2.6 * s);
    });
  }
  const spark = glow(scene, from.x, from.y, color, 34 * s, 0, 4);
  const runner = { t: 0 };
  const travel = scene.tweens.add({
    targets: runner, t: 1, duration: 1300, repeat: -1, paused: true,
    onUpdate: () => { const p = curve.getPoint(runner.t); spark.setPosition(p.x, p.y); },
  });
  let isLit = false;
  return {
    setLit(on) {
      if (on === isLit) return;
      isLit = on;
      scene.tweens.add({ targets: lit, alpha: on ? 1 : 0, duration: 300 });
      spark.setAlpha(on ? .9 : 0);
      if (on) travel.resume(); else travel.pause();
    },
  };
}
