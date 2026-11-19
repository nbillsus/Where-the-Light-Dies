import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  create() {
    const { width, height } = this.scale;
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x07111e, 0x07111e, 0x12304a, 0x12304a, 1);
    sky.fillRect(0, 0, width, height);

    this.drawStorm(sky, width, height);
    this.add.circle(width * 0.76, height * 0.18, 75, 0xf0c166, 0.08);
    this.add.circle(width * 0.76, height * 0.18, 12, 0xf4b74d, 0.85);

    this.add.text(width / 2, 170, 'A STORM-BORNE PROTOTYPE', {
      color: '#c39a54', fontFamily: 'Arial, sans-serif', fontSize: '17px', letterSpacing: 3,
    }).setOrigin(0.5);

    this.add.text(width / 2, 270, 'WHERE THE\nLIGHT DIES', {
      color: '#f2eddc', fontFamily: 'Georgia, serif', fontSize: '62px', fontStyle: 'bold',
      align: 'center', lineSpacing: 3, shadow: { offsetX: 3, offsetY: 5, color: '#000000', blur: 8, fill: true },
    }).setOrigin(0.5);

    this.add.rectangle(width / 2, 361, 188, 2, 0xc89643, 0.85);
    this.add.text(width / 2, 396, 'The beacon is dark. The sea is listening.', {
      color: '#aebbc4', fontFamily: 'Arial, sans-serif', fontSize: '18px', fontStyle: 'italic',
    }).setOrigin(0.5);

    const start = this.add.text(width / 2, 493, 'BEGIN PROTOTYPE', {
      color: '#f6dea4', fontFamily: 'Arial, sans-serif', fontSize: '19px', fontStyle: 'bold',
      padding: { x: 34, y: 15 }, backgroundColor: '#1c2b38',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    start.on('pointerover', () => start.setStyle({ backgroundColor: '#344657', color: '#fff3cf' }));
    start.on('pointerout', () => start.setStyle({ backgroundColor: '#1c2b38', color: '#f6dea4' }));
    start.on('pointerup', () => this.scene.start('PrototypeLevel'));
    this.input.keyboard.once('keydown-SPACE', () => this.scene.start('PrototypeLevel'));
    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('PrototypeLevel'));

    this.add.text(width / 2, 565, 'A / D or arrow keys to move  •  Space to jump', {
      color: '#738694', fontFamily: 'Arial, sans-serif', fontSize: '14px',
    }).setOrigin(0.5);
  }

  drawStorm(graphics, width, height) {
    graphics.fillStyle(0x0b2637, 1).fillRect(0, height - 218, width, 218);
    graphics.lineStyle(2, 0x547c8d, 0.18);
    for (let x = -80; x < width + 150; x += 70) {
      graphics.lineBetween(x, 105, x - 118, 405);
    }
    graphics.lineStyle(2, 0x4d8ea2, 0.28);
    for (let y = height - 140; y < height; y += 28) {
      graphics.lineBetween(0, y, width, y - 12);
    }
  }
}
