import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  create() {
    this.paint();
    this.scale.on('resize', this.paint, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', this.paint, this));
  }

  paint() {
    this.children.removeAll();
    this.tweens.killAll();
    const { width, height } = this.scale;
    const uiScale = Phaser.Math.Clamp(Math.min(width / 1280, height / 760), 0.72, 1.2);
    const textScale = Phaser.Math.Clamp(width / 1280, 0.6, 1.12);

    this.drawSky(width, height);
    this.drawSea(width, height);
    this.drawLighthouse(width, height);
    this.drawForeground(width, height);

    const titleX = width * 0.39;
    const top = height * 0.23;
    this.add.text(titleX, top - 62 * uiScale, 'WHERE THE LIGHT DIES', {
      color: '#d4ac55', fontFamily: 'Arial, sans-serif', fontSize: `${Math.round(13 * textScale)}px`,
      letterSpacing: Math.round(5 * textScale), fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.92);

    this.add.text(titleX, top + 28 * uiScale, 'WHERE THE\nLIGHT DIES', {
      color: '#f7f2df', fontFamily: 'Georgia, Times New Roman, serif', fontStyle: 'bold',
      fontSize: `${Math.round(68 * textScale)}px`, align: 'center', lineSpacing: -4 * uiScale,
      shadow: { offsetX: 0, offsetY: 7, color: '#02070c', blur: 14, fill: true },
    }).setOrigin(0.5);

    this.add.rectangle(titleX, top + 123 * uiScale, 210 * uiScale, 1, 0xdfb15e, 0.75);
    this.add.text(titleX, top + 154 * uiScale, 'THE BEACON IS DARK.  THE SEA IS LISTENING.', {
      color: '#b7c3c4', fontFamily: 'Arial, sans-serif', fontSize: `${Math.round(13 * textScale)}px`,
      letterSpacing: Math.round(1.2 * textScale), fontStyle: 'italic',
    }).setOrigin(0.5);

    const button = this.createButton(titleX, top + 232 * uiScale, 250 * uiScale, 54 * uiScale, uiScale);
    button.on('pointerup', () => this.scene.start('PrototypeLevel'));
    this.input.keyboard.once('keydown-SPACE', () => this.scene.start('PrototypeLevel'));
    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('PrototypeLevel'));

    this.add.text(titleX, top + 286 * uiScale, 'A / D OR ARROWS TO MOVE   ·   SPACE TO JUMP', {
      color: '#8ba0a5', fontFamily: 'Arial, sans-serif', fontSize: `${Math.round(11 * textScale)}px`, letterSpacing: 1,
    }).setOrigin(0.5).setAlpha(0.9);
    this.add.text(34, height - 34, 'PROTOTYPE BUILD  •  01', {
      color: '#8fa2a4', fontFamily: 'Arial, sans-serif', fontSize: '11px', letterSpacing: 1.5,
    }).setAlpha(0.75);
    this.add.text(width - 34, height - 34, 'WHERE THE LIGHT DIES', {
      color: '#8fa2a4', fontFamily: 'Arial, sans-serif', fontSize: '11px', letterSpacing: 1.5,
    }).setOrigin(1, 0).setAlpha(0.75);
  }

  createButton(x, y, buttonWidth, buttonHeight, scale) {
    const container = this.add.container(x, y);
    const shadow = this.add.rectangle(0, 5, buttonWidth, buttonHeight, 0x020609, 0.55);
    const panel = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x122634, 0.94).setStrokeStyle(1.5, 0xd5a950, 0.8);
    const inner = this.add.rectangle(0, 0, buttonWidth - 10, buttonHeight - 10, 0x1d3441, 0.75).setStrokeStyle(1, 0x5e7880, 0.7);
    const label = this.add.text(0, 0, 'BEGIN PROTOTYPE', {
      color: '#fff1c6', fontFamily: 'Arial, sans-serif', fontSize: `${Math.round(15 * scale)}px`, fontStyle: 'bold', letterSpacing: 2,
    }).setOrigin(0.5);
    container.add([shadow, panel, inner, label]);
    container.setSize(buttonWidth, buttonHeight).setInteractive({ useHandCursor: true });
    container.on('pointerover', () => {
      panel.setFillStyle(0x284554, 1); inner.setFillStyle(0x315565, 0.92); label.setColor('#ffffff');
      this.tweens.add({ targets: container, scaleX: 1.025, scaleY: 1.025, duration: 110 });
    });
    container.on('pointerout', () => {
      panel.setFillStyle(0x122634, 0.94); inner.setFillStyle(0x1d3441, 0.75); label.setColor('#fff1c6');
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 110 });
    });
    return container;
  }

  drawSky(width, height) {
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x02060e, 0x02060e, 0x102c40, 0x0b1c2d, 1).fillRect(0, 0, width, height);
    graphics.fillStyle(0x7594a7, 0.06).fillCircle(width * 0.38, height * 0.18, Math.max(width, height) * 0.52);
    graphics.fillStyle(0xe4e5dc, 0.22).fillCircle(width * 0.78, height * 0.16, 39);
    graphics.fillStyle(0xa6c7d7, 0.06).fillCircle(width * 0.78, height * 0.16, 98);
    graphics.fillStyle(0x0c2334, 0.45).fillEllipse(width * 0.18, height * 0.28, width * 0.55, height * 0.13);
    graphics.fillEllipse(width * 0.65, height * 0.35, width * 0.7, height * 0.18);
    graphics.fillStyle(0x081724, 0.52).fillEllipse(width * 0.15, height * 0.41, width * 0.68, height * 0.15);
    graphics.fillEllipse(width * 0.72, height * 0.47, width * 0.75, height * 0.17);
    graphics.lineStyle(1, 0xa4cad5, 0.16);
    for (let x = -100; x < width + 180; x += 57) graphics.lineBetween(x, height * 0.1, x - height * 0.22, height * 0.58);
    const lightning = graphics.lineBetween(width * 0.65, height * 0.14, width * 0.59, height * 0.4).setAlpha(0);
    this.tweens.add({ targets: lightning, alpha: 0.7, duration: 48, yoyo: true, repeat: -1, repeatDelay: 8200 });
  }

  drawSea(width, height) {
    const horizon = height * 0.67;
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x0d3447, 0x0d3447, 0x04111c, 0x04111c, 1).fillRect(0, horizon, width, height - horizon);
    for (let row = 0; row < 8; row += 1) {
      const y = horizon + 22 + row * ((height - horizon) / 8);
      graphics.lineStyle(Math.max(1, 3 - row * 0.2), 0x5795a9, Math.max(0.07, 0.26 - row * 0.02));
      for (let x = -60 + (row % 2) * 18; x < width; x += 130) graphics.lineBetween(x, y, x + 88, y - 5);
    }
    const mist = this.add.rectangle(width * 0.5, horizon + 38, width * 1.1, 54, 0x9ac5cd, 0.055);
    this.tweens.add({ targets: mist, x: width * 0.47, alpha: 0.16, duration: 4200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  drawLighthouse(width, height) {
    const graphics = this.add.graphics();
    const baseX = width * 0.77;
    const groundY = height * 0.73;
    const towerHeight = height * 0.47;
    const topY = groundY - towerHeight;
    const towerWidth = Math.max(82, width * 0.09);
    graphics.fillStyle(0x061019, 0.92).fillPoints([
      { x: baseX - towerWidth * 0.56, y: groundY }, { x: baseX + towerWidth * 0.56, y: groundY },
      { x: baseX + towerWidth * 0.33, y: topY + 31 }, { x: baseX - towerWidth * 0.33, y: topY + 31 },
    ], true);
    graphics.fillStyle(0x1a3441, 0.85).fillRect(baseX - towerWidth * 0.43, topY + 25, towerWidth * 0.86, 19);
    graphics.fillStyle(0x08151d, 1).fillRect(baseX - towerWidth * 0.34, topY + 5, towerWidth * 0.68, 24);
    graphics.lineStyle(2, 0x6a8490, 0.55).strokeRect(baseX - towerWidth * 0.34, topY + 5, towerWidth * 0.68, 24);
    graphics.fillStyle(0xe5ad4e, 0.22).fillCircle(baseX, topY + 17, 73);
    graphics.fillStyle(0xffd471, 0.98).fillCircle(baseX, topY + 17, 6);
    graphics.fillStyle(0x03070c, 1).fillRect(baseX - 17, groundY - 78, 34, 78);
    graphics.lineStyle(1, 0xcda04f, 0.65).lineBetween(baseX - 17, groundY - 78, baseX + 17, groundY - 78);
    const beam = this.add.triangle(baseX - 4, topY + 18, baseX - 4, topY + 10, width * 0.28, height * 0.52, 0xf4c976, 0.07).setOrigin(0, 0);
    this.tweens.add({ targets: beam, alpha: 0.16, duration: 2700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  drawForeground(width, height) {
    const graphics = this.add.graphics();
    const shoreY = height * 0.82;
    graphics.fillStyle(0x02070c, 0.94).fillPoints([
      { x: 0, y: shoreY }, { x: width * 0.15, y: shoreY - 34 }, { x: width * 0.3, y: shoreY - 16 },
      { x: width * 0.47, y: shoreY - 52 }, { x: width * 0.64, y: shoreY - 22 }, { x: width * 0.8, y: shoreY - 44 },
      { x: width, y: shoreY - 19 }, { x: width, y: height }, { x: 0, y: height },
    ], true);
  }
}
