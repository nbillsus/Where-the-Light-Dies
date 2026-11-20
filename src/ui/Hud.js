import Phaser from 'phaser';
import { fixedLayerOffset } from '../rendering.js';
import { ensureFxTextures } from '../effects/textures.js';

// Minimal HUD: a small Shadow emblem in the corner, only while the Shadow is
// detached. Bright while you control it, dimmed with a pin when anchored.
export class Hud {
  constructor(scene) {
    this.scene = scene;
    ensureFxTextures(scene);
    const offset = fixedLayerOffset(scene.viewportWidth, scene.viewportHeight);
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
    this.emblem = scene.add.container(offset.x + 42, offset.y + 42, [glow, badge, this.pin])
      .setScrollFactor(0).setDepth(30).setAlpha(0);
    this.state = 'hidden';
  }

  update() {
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
