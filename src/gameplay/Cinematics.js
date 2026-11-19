import { fixedLayerOffset, sharpenText } from '../rendering.js';

export class Cinematics {
  constructor(scene) { this.scene = scene; }

  pulse(title, subtitle, color = 0xaee4e1, duration = 1900) {
    const scene = this.scene;
    const w = scene.viewportWidth, h = scene.viewportHeight;
    const offset = fixedLayerOffset(w, h);
    const layer = scene.add.container(offset.x, offset.y).setScrollFactor(0).setDepth(80);
    const veil = scene.add.rectangle(w / 2, h / 2, w, h, 0x030812, .62);
    const beam = scene.add.graphics();
    beam.fillStyle(color, .11).fillTriangle(w * .1, h, w * .49, h * .46, w * .9, h);
    beam.lineStyle(2, color, .55).strokeCircle(w / 2, h * .48, 80);
    beam.lineStyle(1, color, .32).strokeCircle(w / 2, h * .48, 110);
    const heading = scene.add.text(w / 2, h * .43, title, {
      fontFamily: 'Georgia, serif', fontSize: `${Math.round(Math.max(24, Math.min(42, w * .034)))}px`,
      color: '#f7eed9', align: 'center', wordWrap: { width: w - 60 },
    }).setOrigin(.5);
    const line = scene.add.text(w / 2, h * .57, subtitle, {
      fontFamily: 'Arial, sans-serif', fontSize: `${Math.round(Math.max(13, Math.min(17, w * .015)))}px`,
      color: '#c8e0dd', align: 'center', wordWrap: { width: w - 70 },
    }).setOrigin(.5);
    layer.add([veil, beam, heading, line]);
    layer.setAlpha(0);
    scene.tweens.add({ targets: layer, alpha: 1, duration: 230, ease: 'Sine.easeOut' });
    scene.tweens.add({ targets: beam, angle: 15, scale: 1.12, duration, ease: 'Sine.easeInOut' });
    scene.time.delayedCall(duration, () => scene.tweens.add({ targets: layer, alpha: 0, duration: 480, onComplete: () => layer.destroy(true) }));
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
    const title = scene.add.text(w / 2, h * .72, chapter === 2 ? 'THE MACHINE HAS LEARNED YOUR SHAPE' : 'THE SIGNAL CAME FROM BELOW', {
      fontFamily: 'Georgia, serif', fontSize: `${Math.round(Math.max(24, Math.min(37, w * .03)))}px`, color: '#f9e4bc',
      align: 'center', wordWrap: { width: w - 48 },
    }).setOrigin(.5);
    const message = scene.add.text(w / 2, h * .82, chapter === 2
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
