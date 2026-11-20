import Phaser from 'phaser';
import { fixedLayerOffset } from '../rendering.js';
import { ensureFxTextures } from '../effects/textures.js';

// Minimal HUD, top-left:
// - Health: a row of small lantern flames (lit = health left).
// - Flare Pulse: a sun icon whose ring fills as it recharges.
// - Shadow emblem below, only while the Shadow is detached (bright while
//   you control it, dimmed with a pin when anchored).
export class Hud {
  constructor(scene) {
    this.scene = scene;
    ensureFxTextures(scene);
    const offset = fixedLayerOffset(scene.viewportWidth, scene.viewportHeight);
    this.root = scene.add.container(offset.x, offset.y).setScrollFactor(0).setDepth(30);

    this.flames = scene.add.graphics();
    this.flare = scene.add.graphics();
    this.flareGlow = scene.add.image(0, 0, 'fx-glow').setTint(0xffd98a).setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(46, 46).setAlpha(0);
    this.root.add([this.flareGlow, this.flames, this.flare]);

    const glow = scene.add.image(0, 0, 'fx-glow').setTint(0xcfe3f5).setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(90, 90).setAlpha(.4);
    const badge = scene.add.graphics();
    badge.fillStyle(0x05080d, .8).fillCircle(0, 0, 22);
    badge.lineStyle(2, 0xcfd9e6, .85).strokeCircle(0, 0, 22);
    badge.lineStyle(1, 0xcfd9e6, .35).strokeCircle(0, 0, 27);
    badge.fillStyle(0xdfe8f2, .92).fillCircle(0, -5, 6.5);
    badge.fillTriangle(-10, 13, 10, 13, 0, -1);
    badge.fillStyle(0x05080d, 1).fillCircle(-2.3, -5, 1.3).fillCircle(2.3, -5, 1.3);
    this.pin = scene.add.graphics();
    this.pin.fillStyle(0xf6c874, 1).fillPoints([{ x: 0, y: 26 }, { x: 5, y: 32 }, { x: 0, y: 38 }, { x: -5, y: 32 }], true);
    this.glow = glow;
    this.emblem = scene.add.container(42, 92, [glow, badge, this.pin]).setAlpha(0);
    this.root.add(this.emblem);
    this.state = 'hidden';
    this.shownHealth = -1;
    this.shownCharge = -1;
  }

  drawFlames(health, max) {
    const g = this.flames.clear();
    for (let i = 0; i < max; i++) {
      const x = 28 + i * 22, y = 34, lit = i < health;
      g.fillStyle(lit ? 0xffb54a : 0x2a2f36, lit ? 1 : .85);
      g.fillPoints([{ x, y: y - 11 }, { x: x + 6, y: y - 1 }, { x: x + 4, y: y + 6 }, { x: x - 4, y: y + 6 }, { x: x - 6, y: y - 1 }], true);
      if (lit) g.fillStyle(0xfff1c2, 1).fillCircle(x, y + 1, 2.6);
      g.lineStyle(1.5, lit ? 0x6b3a12 : 0x4a5260, .9).strokePoints([{ x, y: y - 11 }, { x: x + 6, y: y - 1 }, { x: x + 4, y: y + 6 }, { x: x - 4, y: y + 6 }, { x: x - 6, y: y - 1 }], true);
    }
  }

  drawFlare(charge, max) {
    const x = 28 + max * 22 + 10, y = 32, g = this.flare.clear();
    g.fillStyle(charge >= 1 ? 0xffe3a6 : 0x6b6152, 1).fillCircle(x, y, 4.5);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      g.lineStyle(1.5, charge >= 1 ? 0xffe3a6 : 0x6b6152, .9).lineBetween(x + Math.cos(a) * 6.5, y + Math.sin(a) * 6.5, x + Math.cos(a) * 9, y + Math.sin(a) * 9);
    }
    g.lineStyle(2, 0x2a2f36, .9).strokeCircle(x, y, 12);
    if (charge > 0) g.lineStyle(2, 0xffc977, .95).beginPath().arc(x, y, 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * charge, false).strokePath();
    this.flareGlow.setPosition(x, y).setAlpha(charge >= 1 ? .5 : 0);
  }

  update() {
    const combat = this.scene.combat;
    if (combat) {
      const max = 5;
      if (combat.health !== this.shownHealth) {
        if (combat.health < this.shownHealth) this.scene.tweens.add({ targets: this.flames, x: 3, duration: 50, yoyo: true, repeat: 2 });
        this.shownHealth = combat.health;
        this.drawFlames(combat.health, max);
      }
      const charge = Math.round(combat.flareCharge * 40) / 40;
      if (charge !== this.shownCharge) { this.shownCharge = charge; this.drawFlare(charge, max); }
    }
    const shadow = this.scene.shadow;
    const state = !shadow?.detached ? 'hidden' : shadow.anchored ? 'anchored' : 'active';
    if (state === this.state) return;
    this.state = state;
    this.pin.setVisible(state === 'anchored');
    this.glow.setVisible(state === 'active');
    this.scene.tweens.killTweensOf(this.emblem);
    this.scene.tweens.add({ targets: this.emblem, alpha: state === 'hidden' ? 0 : state === 'active' ? 1 : .6, duration: 220 });
  }
}
