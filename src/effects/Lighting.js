import Phaser from 'phaser';
import { ensureFxTextures } from './textures.js';
import { afterCameraMoves } from './cameraSync.js';

// Real darkness for every level. Owner: Lucas (graphics).
//
// How it works, in plain words:
//   1. Every frame we paint a "light map": a picture the size of the screen
//      filled with the area's dim ambient colour, a little moonlight from
//      above, and a soft blob of colour wherever there is a light.
//   2. The light map is laid over the world with MULTIPLY blending, so dark
//      parts of the map darken the scene and bright parts leave it as it was.
//   3. A faint glow sprite is ADDED on top of each light, so lights glow
//      through the darkness (a cheap "bloom").
//
// Lights are found automatically: anything already drawn as a glowing
// `fx-glow` image or a glowing shape with ADD blending (candles, torches,
// enemy eyes, the sword, the flare, relics...) casts light. To add a light
// somewhere new, just add a glow image there. The boy's lantern and short
// flashes (`pulse`) are added here directly.
//
// Depth 19.5 sits above the world and particles but below the foreground
// silhouettes (20), rain (25) and all UI, which stay unaffected.
const MAP_DEPTH = 19.5;
const BLOOM_DEPTH = 19.6;
const RES = .5;          // light map resolution (it is all soft gradients)
const SPREAD = 2.3;      // a light pool is this much wider than its glow sprite
const STRENGTH = 1.5;    // glow alpha → light brightness
const BLOOM = .32;       // how strongly lights glow through the darkness
const MAX_LIGHTS = 90;
const MAX_BLOOM = 48;
const LIGHT_SIZE = 256;  // fx-light texture size
const GLOW_SIZE = 128;   // fx-glow texture size

const ADD = Phaser.BlendModes.ADD;
const SHAPES = new Set(['Arc', 'Ellipse', 'Rectangle']);

export class Lighting {
  constructor(scene, theme) {
    this.scene = scene;
    this.theme = theme;
    ensureFxTextures(scene);
    const w = scene.viewportWidth, h = scene.viewportHeight;
    // Extra border so the map still covers the view while the camera eases
    // or shakes between the frame we paint it and the frame it is shown.
    this.margin = Math.max(w, h) * .12;
    const mw = w + this.margin * 2, mh = h + this.margin * 2;
    const tw = Math.ceil(mw * RES), th = Math.ceil(mh * RES);
    this.map = scene.add.renderTexture(0, 0, tw, th).setOrigin(0).setDisplaySize(mw, mh)
      .setDepth(MAP_DEPTH).setBlendMode(Phaser.BlendModes.MULTIPLY);
    // Reused glow sprites for the bloom, so nothing is created per frame.
    this.bloom = Array.from({ length: MAX_BLOOM }, () => scene.add.image(0, 0, 'fx-glow')
      .setBlendMode(ADD).setDepth(BLOOM_DEPTH).setVisible(false));
    this.pulses = [];
    this.lights = [];
    this.matrix = new Phaser.GameObjects.Components.TransformMatrix();
    this.parentMatrix = new Phaser.GameObjects.Components.TransformMatrix();
    // Paint the map in step with the camera, so it always covers the view.
    afterCameraMoves(scene, () => this.render());
  }

  /** A short burst of light, e.g. a hit or an explosion. */
  pulse(x, y, radius, color = 0xffe2a3, duration = 300, strength = 1) {
    this.pulses.push({ x, y, radius, color, strength, start: this.scene.time.now, duration });
  }

  // --- Finding lights -----------------------------------------------------

  collect() {
    const lights = this.lights;
    lights.length = 0;
    const cam = this.scene.cameras.main;
    const visit = (list, parentAlpha, scrollFactor, parent) => {
      for (const obj of list) {
        if (lights.length >= MAX_LIGHTS) return;
        if (!obj.visible || obj.alpha <= .01) continue;
        const top = !parent;
        if (top && (obj.depth >= MAP_DEPTH || obj.scrollFactorX === 0)) continue;
        const sf = top ? obj.scrollFactorX ?? 1 : scrollFactor;
        const alpha = parentAlpha * obj.alpha;
        if (obj.type === 'Container') {
          visit(obj.list, alpha, sf, obj);
          continue;
        }
        if (obj.blendMode !== ADD) continue;
        let color;
        if (obj.type === 'Image' && obj.texture?.key === 'fx-glow') color = obj.tintTopLeft;
        else if (SHAPES.has(obj.type) && obj.isFilled) color = obj.fillColor;
        else continue;
        const strength = alpha * (obj.type === 'Image' ? 1 : obj.fillAlpha);
        if (strength <= .02 || color === 0) continue;
        const m = obj.getWorldTransformMatrix(this.matrix, this.parentMatrix);
        const width = obj.width * Math.hypot(m.a, m.b), height = obj.height * Math.hypot(m.c, m.d);
        // Things in the parallax layers are drawn where the camera puts them,
        // not at their raw position.
        const x = m.tx - cam.scrollX * (sf - 1), y = m.ty - cam.scrollY * (sf - 1);
        // A shape is the glowing thing itself; a glow image is already its halo.
        const spread = obj.type === 'Image' ? SPREAD : SPREAD * 1.6;
        lights.push({ x, y, width: width * spread, height: height * spread, color, strength: strength * STRENGTH, bloom: obj.type === 'Image' ? 1 : .6, glowW: width, glowH: height });
      }
    };
    visit(this.scene.children.list, 1, 1, null);
    this.addActorLights(lights);
    return lights;
  }

  // The lantern the boy carries, a faint cold light on his detached shadow,
  // and any short pulses.
  addActorLights(lights) {
    const scene = this.scene, now = scene.time.now, size = scene.spriteHeight ?? 150;
    const player = scene.player;
    if (player?.active) {
      // A slow, gentle sway in brightness (kept subtle: no flicker or flashing).
      const flicker = .97 + Math.sin(now * .0021) * .02 + Math.sin(now * .0047 + 1.3) * .01;
      const radius = size * 5.6 * flicker;
      lights.push({ x: player.x, y: player.y - size * .1, width: radius, height: radius * .86, color: this.theme.lantern ?? 0xffd9a0, strength: 1.05, bloom: .4, glowW: radius * .45, glowH: radius * .4 });
      lights.push({ x: player.x, y: player.y - size * .1, width: size * 2.4, height: size * 2.4, color: 0xfff0d4, strength: .55 * flicker, bloom: 0 });
      // The lantern itself, at his hip: a steady warm glow (no flicker, so it
      // never reads as flashing) plus a small bright core.
      const hipX = player.x + (player.flipX ? -1 : 1) * size * .08, hipY = player.y + size * .05;
      lights.push({ x: hipX, y: hipY, width: 0, height: 0, color: 0xffc977, strength: .85, bloom: 1, glowW: size * 2.6, glowH: size * 2.1 });
      lights.push({ x: hipX, y: hipY, width: 0, height: 0, color: 0xffe9b8, strength: 1, bloom: 1, glowW: size * .75, glowH: size * .85 });
    }
    const shadow = scene.shadow;
    if (shadow?.detached && shadow.actor?.active) {
      lights.push({ x: shadow.actor.x, y: shadow.actor.y, width: size * 2.6, height: size * 2.6, color: 0x9fc4e0, strength: .45, bloom: 0 });
    }
    this.pulses = this.pulses.filter(p => now - p.start < p.duration);
    for (const p of this.pulses) {
      const t = (now - p.start) / p.duration, fade = 1 - t * t;
      lights.push({ x: p.x, y: p.y, width: p.radius * 2, height: p.radius * 2, color: p.color, strength: p.strength * fade, bloom: .5, glowW: p.radius * .7, glowH: p.radius * .7 });
    }
  }

  // --- Drawing ------------------------------------------------------------

  ambientColor() {
    return this.theme.ambient ?? 0x34405a; // areas without their own ambient colour
  }

  render() {
    const cam = this.scene.cameras.main;
    const ox = cam.worldView.x - this.margin, oy = cam.worldView.y - this.margin;
    this.map.setPosition(ox, oy);
    const lights = this.collect();

    // Everything is painted in one batch, starting with a solid ambient base.
    // (Phaser's ADD blend also scales what is underneath by its alpha, so
    // lights added onto a transparent texture leave square seams where they
    // overlap. On a solid base they add up cleanly.)
    const white = this.scene.textures.getFrame('__WHITE');
    this.map.clear();
    this.map.beginDraw();
    this.map.stamp('__WHITE', null, 0, 0, {
      originX: 0, originY: 0, scaleX: this.map.width / white.width, scaleY: this.map.height / white.height,
      tint: this.ambientColor(), alpha: 1, blendMode: Phaser.BlendModes.NORMAL, skipBatch: true,
    });
    // Moonlight from above: the sky and far background stay faintly visible,
    // which keeps the depth of the painted backdrop.
    this.map.stamp('fx-vfade', null, 0, 0, {
      originX: 0, originY: 0, scaleX: this.map.width / 4, scaleY: this.map.height * .75 / 128,
      tint: this.theme.rim, alpha: this.theme.sky ?? .2, blendMode: ADD, skipBatch: true,
    });
    for (const light of lights) {
      if (!light.width) continue; // glow-only entries
      this.map.stamp('fx-light', null, (light.x - ox) * RES, (light.y - oy) * RES, {
        scaleX: light.width * RES / LIGHT_SIZE, scaleY: light.height * RES / LIGHT_SIZE,
        tint: light.color, alpha: Math.min(1, light.strength), blendMode: ADD, skipBatch: true,
      });
    }
    // The finished batch is copied onto the (cleared) texture with the
    // renderer's current blend mode; make that a plain copy.
    this.scene.renderer.setBlendMode?.(Phaser.BlendModes.NORMAL);
    this.map.endDraw();

    let used = 0;
    for (const light of lights) {
      if (!light.bloom || used >= MAX_BLOOM) continue;
      this.bloom[used++].setPosition(light.x, light.y).setDisplaySize(light.glowW * 1.35, light.glowH * 1.35)
        .setTint(light.color).setAlpha(Math.min(1, light.strength * BLOOM * light.bloom)).setVisible(true);
    }
    for (let i = used; i < MAX_BLOOM; i++) this.bloom[i].setVisible(false);
  }
}
