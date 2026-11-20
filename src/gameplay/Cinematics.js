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
    if (chapter === 5) {
      this.finalEnding();
      return;
    }
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

  finalEnding() {
    const scene = this.scene;
    const w = scene.viewportWidth, h = scene.viewportHeight;
    const offset = fixedLayerOffset(w, h);
    const layer = scene.add.container(offset.x, offset.y).setScrollFactor(0).setDepth(125);
    const veil = scene.add.rectangle(w / 2, h / 2, w, h, 0x01040a, .96);
    const horizon = scene.add.rectangle(w / 2, h * .66, w, Math.max(150, h * .34), 0x06131a, .95);
    const dawn = scene.add.image(w / 2, h * .55, 'fx-glow').setTint(0xf1c58a).setAlpha(0)
      .setDisplaySize(Math.min(w * 1.08, 980), Math.min(h * .76, 560));
    const sea = scene.add.graphics();
    sea.fillStyle(0x091e27, .95).fillRect(0, h * .7, w, h * .3);
    for (let i = 0; i < 9; i++) {
      sea.lineStyle(1.2, 0x8ccbd0, .08 + i * .014).lineBetween(0, h * .72 + i * 19, w, h * .72 + i * 19 + Math.sin(i) * 7);
    }

    const tower = scene.add.container(w / 2, h * .58);
    const body = scene.add.graphics();
    body.fillStyle(0x0c1215, .98).fillTriangle(-58, 190, 58, 190, 28, -122).fillTriangle(-58, 190, 28, -122, -28, -122);
    body.fillStyle(0xdcc78d, .9).fillRect(-34, -152, 68, 30);
    body.fillStyle(0x10191d, 1).fillRect(-46, -122, 92, 22);
    body.fillStyle(0x0b1114, 1).fillRect(-18, -96, 36, 285);
    body.lineStyle(2, 0xa4c4bd, .2).strokeTriangle(-58, 190, 58, 190, 28, -122).strokeTriangle(-58, 190, 28, -122, -28, -122);
    const lens = scene.add.image(0, -137, 'fx-glow').setTint(0xffe7a4).setAlpha(.18).setDisplaySize(92, 64);
    const beamLeft = scene.add.graphics();
    const beamRight = scene.add.graphics();
    const paintBeam = (graphics, flip = 1, alpha = .08) => {
      graphics.clear();
      graphics.fillStyle(0xffe9a7, alpha).fillTriangle(0, -137, flip * w * .58, -235, flip * w * .55, 42);
      graphics.fillStyle(0xdafcff, alpha * .42).fillTriangle(0, -137, flip * w * .38, -210, flip * w * .44, -12);
    };
    paintBeam(beamLeft, -1, .03);
    paintBeam(beamRight, 1, .03);
    tower.add([beamLeft, beamRight, body, lens]);

    const title = scene.add.text(w / 2, h * .12, 'THE LIGHT RETURNS', {
      fontFamily: 'Georgia, serif',
      fontSize: `${Math.round(Math.max(28, Math.min(54, w * .044)))}px`,
      color: '#f7ead0',
      align: 'center',
      letterSpacing: 5,
      wordWrap: { width: w - 54 },
    }).setOrigin(.5).setAlpha(0).setShadow(0, 3, '#000000', 10, false, true);

    const caption = scene.add.text(w / 2, h * .22, '', {
      fontFamily: 'Georgia, serif',
      fontStyle: 'italic',
      fontSize: `${Math.round(Math.max(15, Math.min(21, w * .017)))}px`,
      color: '#dbe8df',
      align: 'center',
      wordWrap: { width: Math.min(w - 54, 850) },
      lineSpacing: 8,
    }).setOrigin(.5, 0).setAlpha(0).setShadow(0, 2, '#000000', 7, false, true);

    const credits = scene.add.text(w / 2, h * .5, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${Math.round(Math.max(12, Math.min(17, w * .0135)))}px`,
      color: '#cfe8df',
      align: 'center',
      wordWrap: { width: Math.min(w - 58, 760) },
      lineSpacing: 11,
    }).setOrigin(.5, 0).setAlpha(0);

    const hint = scene.add.text(w / 2, h - 42, 'R REPLAY FINAL CHAPTER     ESC MENU', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${Math.round(Math.max(10, Math.min(13, w * .01)))}px`,
      color: '#9fb7b2',
      align: 'center',
      letterSpacing: 2,
    }).setOrigin(.5).setAlpha(0);

    layer.add([veil, dawn, horizon, sea, tower, title, caption, credits, hint]);
    layer.setAlpha(0);

    const lines = [
      'The transmitter stops screaming. For the first time all night, the sea answers with silence.',
      'The shadow gives back the stolen light. The reef loosens its hold on every voice it kept below.',
      'Caldera sees the beam sweep across the water. The lost ships finally have a way home.',
      'Morning reaches the lighthouse, and the fog pulls away from Mourning Reef.',
    ];

    const showCaption = (text, at, hold = 3600) => {
      scene.time.delayedCall(at, () => {
        caption.setText(text);
        scene.tweens.add({ targets: caption, alpha: 1, y: h * .22, duration: 500, ease: 'Sine.easeOut' });
        scene.tweens.add({ targets: caption, alpha: 0, duration: 650, delay: hold, ease: 'Sine.easeIn' });
      });
    };

    scene.tweens.add({ targets: layer, alpha: 1, duration: 900, ease: 'Sine.easeOut' });
    scene.tweens.add({ targets: title, alpha: 1, y: h * .1, duration: 1000, delay: 350, ease: 'Sine.easeOut' });
    scene.tweens.add({ targets: dawn, alpha: .46, duration: 5200, delay: 900, ease: 'Sine.easeInOut' });
    scene.tweens.add({ targets: lens, alpha: { from: .18, to: .95 }, duration: 1600, delay: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    scene.tweens.add({ targets: tower, y: h * .54, duration: 5200, ease: 'Sine.easeInOut' });
    scene.time.delayedCall(1800, () => {
      paintBeam(beamLeft, -1, .16);
      paintBeam(beamRight, 1, .16);
      scene.tweens.add({ targets: [beamLeft, beamRight], alpha: { from: .45, to: 1 }, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
    lines.forEach((line, index) => showCaption(line, 1200 + index * 4300));

    scene.time.delayedCall(19000, () => {
      caption.setAlpha(0);
      title.setText('WHERE THE LIGHT DIES');
      credits.setText([
        'The lighthouse is burning again.',
        'Mourning Reef is quiet.',
        'The voices in the fog have found the beam.',
        '',
        'CREDITS',
        'Story, audio, and presentation: Axel',
        'Game design and levels: Lucas, Neel, Axel',
        'Built for the Where the Light Dies prototype',
        '',
        'Thank you for keeping the light alive.',
      ].join('\n'));
      scene.tweens.add({ targets: title, alpha: 1, y: h * .11, duration: 700, ease: 'Sine.easeOut' });
      scene.tweens.add({ targets: credits, alpha: 1, y: h * .45, duration: 900, delay: 250, ease: 'Sine.easeOut' });
      scene.tweens.add({ targets: hint, alpha: 1, duration: 800, delay: 850, ease: 'Sine.easeOut' });
    });

    sharpenText(scene);
  }
}
