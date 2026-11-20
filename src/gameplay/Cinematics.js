import { fixedLayerOffset, sharpenText } from '../rendering.js';
import { ensureFxTextures } from '../effects/textures.js';

export class Cinematics {
  constructor(scene) { this.scene = scene; ensureFxTextures(scene); }

  clearPulse() {
    this.pulseTimer?.remove();
    this.pulseTimer = null;
    if (!this.pulseLayer) return;
    for (const part of this.pulseParts) this.scene.tweens.killTweensOf(part);
    this.pulseLayer.destroy(true);
    this.pulseLayer = null;
    this.pulseParts = null;
  }

  // Title card: area names, abilities and story beats. Centred serif title,
  // an ornamental divider and one line of text, then it fades away.
  pulse(title, subtitle, color = 0xaee4e1, duration = 1900) {
    this.clearPulse();
    const scene = this.scene;
    const w = scene.viewportWidth, h = scene.viewportHeight;
    const offset = fixedLayerOffset(w, h);
    const layer = scene.add.container(offset.x, offset.y).setScrollFactor(0).setDepth(80);
    const cy = h * .36;
    const shade = scene.add.image(w / 2, cy + 14, 'fx-glow').setTint(0x000000).setAlpha(.6)
      .setDisplaySize(Math.min(w * .9, 980), 230);
    const heading = scene.add.text(w / 2, cy - 14, title, {
      fontFamily: 'Georgia, serif', fontSize: `${Math.round(Math.max(26, Math.min(48, w * .038)))}px`,
      color: '#f4ead6', align: 'center', letterSpacing: 7, wordWrap: { width: w - 60 },
    }).setOrigin(.5).setShadow(0, 2, '#000000', 8, false, true);
    const span = Math.min(w * .2, 230);
    const ornament = scene.add.graphics().setPosition(w / 2, cy + 26);
    ornament.fillStyle(color, .85)
      .fillTriangle(-14, 0, -span, -1.2, -span, 1.2).fillTriangle(14, 0, span, -1.2, span, 1.2)
      .fillPoints([{ x: 0, y: -7 }, { x: 7, y: 0 }, { x: 0, y: 7 }, { x: -7, y: 0 }], true);
    ornament.lineStyle(1.5, color, .8).strokeCircle(-span - 5, 0, 4).strokeCircle(span + 5, 0, 4);
    const line = scene.add.text(w / 2, cy + 54, subtitle, {
      fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: `${Math.round(Math.max(14, Math.min(19, w * .016)))}px`,
      color: '#d3dcd8', align: 'center', wordWrap: { width: Math.min(w - 80, 760) },
    }).setOrigin(.5, 0).setShadow(0, 1, '#000000', 6, false, true);
    layer.add([shade, heading, ornament, line]);
    this.pulseLayer = layer;
    this.pulseParts = [layer, heading, ornament, line, shade];
    layer.setAlpha(0);
    ornament.setScale(0, 1);
    heading.y += 10;
    scene.tweens.add({ targets: layer, alpha: 1, duration: 500, ease: 'Sine.easeOut' });
    scene.tweens.add({ targets: heading, y: heading.y - 10, duration: 900, ease: 'Sine.easeOut' });
    scene.tweens.add({ targets: ornament, scaleX: 1, duration: 900, delay: 150, ease: 'Cubic.easeOut' });
    this.pulseTimer = scene.time.delayedCall(duration, () => {
      this.pulseTimer = null;
      scene.tweens.add({ targets: layer, alpha: 0, duration: 800, onComplete: () => {
        if (this.pulseLayer === layer) this.clearPulse();
      } });
    });
    sharpenText(scene);
  }

  finale(chapter = 1) {
    const scene = this.scene;
    const w = scene.viewportWidth, h = scene.viewportHeight;
    const offset = fixedLayerOffset(w, h);
    const layer = scene.add.container(offset.x, offset.y).setScrollFactor(0).setDepth(120);
    const veil = scene.add.rectangle(w / 2, h / 2, w, h, 0x020713, .92);
    const machine = scene.add.graphics();
    machine.fillStyle(0x7bcdd2, .05).fillCircle(0, 0, 220);
    machine.lineStyle(14, 0xb6ccbd, .73).strokeCircle(0, 0, 148);
    machine.lineStyle(4, 0xe9bd7c, .8).strokeCircle(0, 0, 182);
    machine.lineStyle(2, 0xc5e9ea, .68).strokeCircle(0, 0, 105);
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      machine.fillStyle(i % 2 ? 0xe4ae6b : 0x84d5d5, .8)
        .fillCircle(Math.cos(a) * 181, Math.sin(a) * 181, 5);
    }
    machine.setPosition(w / 2, h * .43);
    const ray = scene.add.graphics();
    ray.fillStyle(0xd7f7e5, .15).fillTriangle(w / 2, h * .43, 0, h, w, h);
    const title = scene.add.text(w / 2, h * .72, chapter === 5 ? 'THE THRESHOLD IS OPEN' : chapter === 4 ? 'THE WARNING HAS BEEN SENT' : chapter === 3 ? 'THE DARK HAS SEEN ITS OWN REFLECTION' : chapter === 2 ? 'THE MACHINE HAS LEARNED YOUR SHAPE' : 'THE SIGNAL CAME FROM BELOW', {
      fontFamily: 'Georgia, serif', fontSize: `${Math.round(Math.max(24, Math.min(37, w * .03)))}px`, color: '#f9e4bc',
      align: 'center', wordWrap: { width: w - 48 },
    }).setOrigin(.5);
    const message = scene.add.text(w / 2, h * .82, chapter === 5
      ? '“Something waits on the other side.”\n\nCHAPTER V COMPLETE  ·  FINAL BOSS TO COME  ·  R RESTART  ·  ESC MENU'
      : chapter === 4
      ? '“If the warning came from us, who was it for?”\n\nCHAPTER IV COMPLETE  ·  R RESTART  ·  ESC MENU'
      : chapter === 3
      ? '“It does not fear the light. It fears what the light remembers.”\n\nCHAPTER III COMPLETE  ·  R RESTART  ·  ESC MENU'
      : chapter === 2
      ? '“It held the weight for you. What will it hold next?”\n\nCHAPTER II COMPLETE  ·  R RESTART  ·  ESC MENU'
      : '“Caldera to lighthouse... we see your light. But what is beneath it?”\n\nR  RESTART CHAPTER     ·     ESC  MENU', {
      fontFamily: 'Arial, sans-serif', fontSize: `${Math.round(Math.max(12, Math.min(16, w * .013)))}px`,
      color: '#c5e4e4', align: 'center', wordWrap: { width: w - 48 }, lineSpacing: 8,
    }).setOrigin(.5);
    layer.add([veil, ray, machine, title, message]);
    layer.setAlpha(0);
    scene.tweens.add({ targets: layer, alpha: 1, duration: 1100 });
    scene.tweens.add({ targets: machine, angle: 180, duration: 6500, ease: 'Sine.easeInOut', repeat: -1, yoyo: true });
    scene.tweens.add({ targets: ray, alpha: { from: .2, to: .9 }, duration: 1200, yoyo: true, repeat: -1 });
    sharpenText(scene);
  }
}
