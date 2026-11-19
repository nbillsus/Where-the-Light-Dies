import Phaser from 'phaser';

const WIDTH = 1280;
const HEIGHT = 720;
const GROUND_Y = 575;

export class PrototypeLevelScene extends Phaser.Scene {
  constructor() {
    super('PrototypeLevel');
  }

  create() {
    this.drawWorld();
    this.platforms = [];
    this.addStaticCollider(WIDTH / 2, GROUND_Y + 16, WIDTH, 32);
    this.addPlatform(430, 485, 160);
    this.addPlatform(722, 414, 145);
    this.addPlatform(982, 360, 135);

    this.player = this.add.rectangle(190, 510, 28, 54, 0x18202b);
    this.physics.add.existing(this.player);
    this.player.body.setSize(28, 54).setCollideWorldBounds(true);
    this.player.body.setMaxVelocity(300, 800);
    for (const platform of this.platforms) this.physics.add.collider(this.player, platform);

    const lanternGlow = this.add.circle(207, 512, 18, 0xffa831, 0.18);
    const lantern = this.add.circle(207, 512, 5, 0xf4ad48);
    lanternGlow.setDepth(2);
    lantern.setDepth(3);
    this.playerGlow = { lanternGlow, lantern };

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,SPACE,ESC');
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('MainMenu'));

    this.add.text(36, 28, 'PROLOGUE  /  THE DARKENED LIGHTHOUSE', {
      color: '#e5c981', fontFamily: 'Arial, sans-serif', fontSize: '17px', fontStyle: 'bold',
    });
    this.add.text(38, 61, 'Explore the grounds. Reach the beacon door.', {
      color: '#b4c4ca', fontFamily: 'Arial, sans-serif', fontSize: '14px',
    });
    this.add.text(36, 675, 'A / D or arrows: move     Space: jump     Esc: return to menu', {
      color: '#8c9ba5', fontFamily: 'Arial, sans-serif', fontSize: '14px',
    });
    this.add.text(1242, 34, 'GRAYBOX BASELINE', {
      color: '#81929d', fontFamily: 'Arial, sans-serif', fontSize: '13px',
    }).setOrigin(1, 0);
  }

  addPlatform(x, y, width) {
    this.addStaticCollider(x, y, width, 22);
  }

  addStaticCollider(x, y, width, height) {
    const collider = this.add.zone(x, y, width, height);
    this.physics.add.existing(collider, true);
    collider.body.setSize(width, height);
    this.platforms.push(collider);
  }

  update() {
    const movingLeft = this.cursors.left.isDown || this.keys.A.isDown;
    const movingRight = this.cursors.right.isDown || this.keys.D.isDown;
    const body = this.player.body;
    body.setVelocityX(movingLeft ? -300 : movingRight ? 300 : 0);
    if ((this.cursors.space.isDown || this.keys.SPACE.isDown) && body.blocked.down) {
      body.setVelocityY(-465);
    }
    this.playerGlow.lanternGlow.setPosition(this.player.x + 17, this.player.y - 4);
    this.playerGlow.lantern.setPosition(this.player.x + 17, this.player.y - 4);
  }

  drawWorld() {
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x07111e, 0x07111e, 0x12304a, 0x12304a, 1).fillRect(0, 0, WIDTH, HEIGHT);
    graphics.fillStyle(0x0b2637, 1).fillRect(0, 555, WIDTH, 165);
    graphics.lineStyle(2, 0x3f7e94, 0.26);
    for (let y = 590; y < 720; y += 24) graphics.lineBetween(0, y, WIDTH, y - 12);
    graphics.lineStyle(2, 0x587d8e, 0.15);
    for (let x = -80; x < WIDTH + 150; x += 72) graphics.lineBetween(x, 110, x - 120, 400);

    graphics.fillStyle(0x26333b, 1).fillRect(0, GROUND_Y, WIDTH, 32);
    graphics.fillStyle(0x141c24, 1).fillRect(0, GROUND_Y + 32, WIDTH, 10);
    for (const [x, y, w] of [[350, 485, 160], [650, 414, 145], [915, 360, 135]]) {
      graphics.fillStyle(0x34414a, 1).fillRect(x, y, w, 22);
      graphics.lineStyle(2, 0xb89552, 0.65).lineBetween(x, y, x + w, y);
    }

    graphics.fillStyle(0x1b2630, 1).fillPoints([{ x: 1040, y: 575 }, { x: 1195, y: 575 }, { x: 1168, y: 210 }, { x: 1068, y: 210 }], true);
    graphics.fillStyle(0x27333a, 1).fillRect(1052, 195, 132, 28);
    graphics.fillStyle(0x10161b, 1).fillRect(1087, 488, 39, 87);
    graphics.lineStyle(2, 0xd4a047, 0.55).lineBetween(1087, 488, 1126, 488);
    graphics.fillStyle(0xf4b74d, 0.13).fillCircle(1118, 209, 46);
    graphics.fillStyle(0xf4b74d, 0.8).fillCircle(1118, 209, 8);

    for (const x of [300, 590, 850]) {
      graphics.fillStyle(0xffa531, 0.1).fillCircle(x, 550, 27);
      graphics.fillStyle(0xffb14d, 0.9).fillCircle(x, 550, 5);
    }
    this.add.text(1065, 470, 'BEACON DOOR', { color: '#c5c1aa', fontFamily: 'Arial, sans-serif', fontSize: '13px' });
  }
}
