import { fixedLayerOffset, renderScale } from '../rendering.js';

// Boss name and health bar along the bottom of the screen.
export class BossBar {
  constructor(scene, name, color) {
    this.scene = scene;
    const w = scene.viewportWidth, h = scene.viewportHeight;
    const offset = fixedLayerOffset(w, h);
    this.width = Math.min(w * .52, 580);
    const x = w / 2 - this.width / 2, y = h - 46;
    this.root = scene.add.container(offset.x, offset.y).setScrollFactor(0).setDepth(60).setAlpha(0);
    const name_ = scene.add.text(w / 2, y - 16, name, {
      fontFamily: 'Georgia, serif', fontSize: '17px', color: '#f1e3c6', letterSpacing: 5,
    }).setOrigin(.5, 1).setShadow(0, 1, '#000', 6, false, true).setResolution(renderScale);
    const frame = scene.add.rectangle(x - 3, y - 3, this.width + 6, 14, 0x05070b, .85).setOrigin(0).setStrokeStyle(1.5, color, .7);
    this.chip = scene.add.rectangle(x, y, this.width, 8, 0xf6ead2, .85).setOrigin(0);
    this.fill = scene.add.rectangle(x, y, this.width, 8, color, 1).setOrigin(0);
    this.root.add([name_, frame, this.chip, this.fill]);
    this.nameText = name_;
    this.frame = frame;
    this.value = 1;
    this.transitioning = false;
  }

  show() { this.scene.tweens.add({ targets: this.root, alpha: 1, duration: 600 }); }
  hide() { this.scene.tweens.add({ targets: this.root, alpha: 0, duration: 900 }); }

  set(fraction) {
    if (this.transitioning) return;
    fraction = Math.max(0, fraction);
    if (fraction === this.value) return;
    this.value = fraction;
    this.fill.width = this.width * fraction;
    this.scene.tweens.killTweensOf(this.chip);
    this.scene.tweens.add({ targets: this.chip, width: this.width * fraction, delay: 250, duration: 450 });
  }

  refill(name, color) {
    this.transitioning = true;
    this.nameText.setText(name);
    this.frame.setStrokeStyle(1.5, color, .9);
    this.fill.setFillStyle(color);
    this.scene.tweens.killTweensOf([this.fill, this.chip]);
    this.fill.width = 0;
    this.chip.width = 0;
    this.value = 1;
    this.scene.tweens.add({ targets: [this.fill, this.chip], width: this.width, duration: 1500,
      ease: 'Cubic.easeOut', onComplete: () => { this.transitioning = false; } });
  }

  reset(name, color) {
    this.scene.tweens.killTweensOf([this.fill, this.chip]);
    this.transitioning = false;
    this.nameText.setText(name);
    this.frame.setStrokeStyle(1.5, color, .7);
    this.fill.setFillStyle(color);
    this.fill.width = this.width;
    this.chip.width = this.width;
    this.value = 1;
  }
}
