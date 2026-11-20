import Phaser from 'phaser';
import { themeFor } from './theme.js';
import { seededRandom } from './textures.js';

// Draws the part of a level beyond its painted backdrop (boss arenas):
// a dark hall that fades in from the painted art, background silhouettes,
// and solid bodies under every ledge that lies past the painted area.
// Owner: Lucas (graphics).
export function drawArenaBackdrop(scene) {
  const stage = scene.stage;
  if (!stage.artWidth || stage.artWidth >= stage.width) return;
  const s = scene.artScale, H = scene.viewportHeight, W = scene.worldWidth;
  const theme = themeFor(stage);
  const rand = seededRandom(`${stage.id}-arena`);
  const start = stage.artWidth * s, fade = 380 * s;
  const red = stage.chapter === 2;
  const sky = red ? 0x14060a : 0x050b14, low = red ? 0x2a0c12 : 0x0c1a26;

  const back = scene.add.graphics().setDepth(-9);
  // Fade in from the painted art, then a solid hall.
  back.fillGradientStyle(sky, sky, low, low, 0, 1, 0, 1).fillRect(start - fade, 0, fade, H);
  back.fillGradientStyle(sky, sky, low, low, 1, 1, 1, 1).fillRect(start, 0, W - start + 10, H);

  // Background silhouettes.
  const shade = red ? 0x1d0a10 : 0x0a1520, edge = red ? 0x6a2430 : 0x2a4558;
  if (red) {
    for (let x = start + 80 * s; x < W; x += 260 * s) {
      back.fillStyle(shade, 1).fillRect(x, 0, 46 * s, H * .82);
      back.lineStyle(2 * s, edge, .55).lineBetween(x + 6 * s, 0, x + 6 * s, H * .82);
      for (let y = 120 * s; y < H * .8; y += 140 * s) back.fillStyle(edge, .5).fillRect(x - 6 * s, y, 58 * s, 10 * s);
    }
    const cx = W - 520 * s, cy = H * .36;
    back.lineStyle(26 * s, shade, 1).strokeCircle(cx, cy, 300 * s);
    back.lineStyle(4 * s, edge, .6).strokeCircle(cx, cy, 300 * s);
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      back.fillStyle(shade, 1).fillCircle(cx + Math.cos(a) * 330 * s, cy + Math.sin(a) * 330 * s, 34 * s);
    }
  } else {
    // A drowned cathedral: tall broken arches and a cracked lens window.
    for (let x = start + 40 * s; x < W; x += 420 * s) {
      const top = H * rand() * .15 + H * .08;
      back.fillStyle(shade, 1).fillRect(x, top, 70 * s, H - top);
      back.fillStyle(shade, 1).fillRect(x + 300 * s, top + 40 * s, 70 * s, H - top);
      const arch = new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(x + 35 * s, top + 20 * s), new Phaser.Math.Vector2(x + 200 * s, top - 160 * s),
        new Phaser.Math.Vector2(x + 335 * s, top + 60 * s)).getPoints(24);
      back.lineStyle(30 * s, shade, 1).strokePoints(arch);
      back.lineStyle(3 * s, edge, .5).strokePoints(arch);
    }
    const cx = W - 560 * s, cy = H * .33;
    back.fillStyle(0x0f2632, .9).fillCircle(cx, cy, 210 * s);
    back.lineStyle(14 * s, shade, 1).strokeCircle(cx, cy, 210 * s);
    back.lineStyle(5 * s, shade, 1);
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3 + .3;
      back.lineBetween(cx, cy, cx + Math.cos(a) * 210 * s, cy + Math.sin(a) * 210 * s);
    }
    const glow = scene.add.image(cx, cy, 'fx-glow').setTint(0x6fb6c8).setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(620 * s, 620 * s).setAlpha(.16).setDepth(-8);
    scene.tweens.add({ targets: glow, alpha: .26, duration: 2600, yoyo: true, repeat: -1 });
  }

  // Solid bodies under ledges that extend past the painted art.
  const ground = scene.add.graphics().setDepth(-7);
  const bodyColor = red ? 0x14111a : 0x101820;
  for (const p of scene.platforms) {
    if (p.right <= start) continue;
    const left = Math.max(p.left, start - 2), floating = p.y < H * .7 && p.right - p.left < 400 * s;
    const bottom = floating ? p.y + 70 * s : H;
    ground.fillStyle(bodyColor, 1).fillPoints([
      { x: left, y: p.y }, { x: p.right, y: p.y }, { x: p.right - (floating ? 30 : 0) * s, y: bottom }, { x: left + (floating ? 30 : 0) * s, y: bottom },
    ], true);
    ground.lineStyle(5 * s, theme.rim, .45).lineBetween(left, p.y + 2 * s, p.right, p.y + 2 * s);
    if (!floating) for (let x = left + 40 * s; x < p.right; x += 90 * s) ground.lineStyle(2 * s, theme.rim, .18).lineBetween(x, p.y + 20 * s, x, p.y + (50 + (x % 3) * 18) * s);
  }
}
