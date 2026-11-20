import Phaser from 'phaser';
import { renderScale } from '../rendering.js';
import { ensureFxTextures } from '../effects/textures.js';

// A single key icon that floats over whatever the player can use right now.
// Puzzle code supplies hints: { key, at: () => ({ x, y }), active: () => bool }.
// The first active hint wins. Replaces the old always-on control text.
export class KeyPrompt {
  constructor(scene) {
    this.scene = scene;
    ensureFxTextures(scene);
    const glow = scene.add.image(0, 0, 'fx-glow').setTint(0xf6d9a0).setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(74, 74).setAlpha(.35);
    const cap = scene.add.graphics();
    cap.fillStyle(0x0b0f14, .88).fillRoundedRect(-14, -14, 28, 28, 6);
    cap.fillStyle(0xe9dcc0, .3).fillRoundedRect(-14, 10, 28, 4, { tl: 0, tr: 0, bl: 6, br: 6 });
    cap.lineStyle(2, 0xe9dcc0, .9).strokeRoundedRect(-14, -14, 28, 28, 6);
    this.label = scene.add.text(0, -1, '', {
      fontFamily: 'Georgia, serif', fontStyle: 'bold', fontSize: '16px', color: '#f6ead2',
    }).setOrigin(.5).setResolution(renderScale);
    this.icon = scene.add.container(0, 0, [glow, cap, this.label]).setDepth(28).setAlpha(0);
    this.current = null;
  }

  update(hints, time) {
    const hint = hints.find(candidate => candidate.active());
    if (hint) {
      const { x, y } = hint.at();
      if (this.current !== hint.key) this.label.setText(hint.key);
      this.icon.setPosition(x, y - 58 + Math.sin(time * .004) * 3);
      if (!this.current) this.fade(1);
      this.current = hint.key;
    } else if (this.current) {
      this.current = null;
      this.fade(0);
    }
  }

  fade(alpha) {
    this.scene.tweens.killTweensOf(this.icon);
    this.scene.tweens.add({ targets: this.icon, alpha, duration: alpha ? 160 : 220 });
  }
}
