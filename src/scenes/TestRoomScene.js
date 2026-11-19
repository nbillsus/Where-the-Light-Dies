import Phaser from 'phaser';
import hallUrl from '../../assets/environment/watchful_hall.png?url';
import boyUrl from '../../assets/characters/boy.png?url';
import { logicalSize, renderScale, sharpenText } from '../rendering.js';

const WALKWAY_Y_IN_IMAGE = 670;
const RUN_SPEED = 320;
const JUMP_SPEED = -490;

export class TestRoomScene extends Phaser.Scene {
  constructor() { super('TestRoom'); }

  preload() {
    this.load.image('watchful-hall', hallUrl);
    this.load.image('boy', boyUrl);
  }

  create() {
    this.cameras.main.setZoom(renderScale);
    const { width: w, height: h } = logicalSize(this);
    this.cameras.main.setScroll((1 - renderScale) * w / 2, (1 - renderScale) * h / 2);

    const backdrop = this.add.image(w / 2, h / 2, 'watchful-hall');
    const coverScale = Math.max(w / backdrop.width, h / backdrop.height);
    backdrop.setDisplaySize(backdrop.width * coverScale, backdrop.height * coverScale);
    const walkwayY = h / 2 + (WALKWAY_Y_IN_IMAGE - backdrop.height / 2) * coverScale;

    const floor = this.add.zone(w / 2, walkwayY + 20, w, 40);
    this.physics.add.existing(floor, true);

    const spriteHeight = Phaser.Math.Clamp(h * 0.21, 100, 190);
    const spriteWidth = spriteHeight * 330 / 410;
    const edgeInset = spriteWidth * 0.19;
    this.physics.world.setBounds(edgeInset, 0, w - edgeInset * 2, h);
    this.player = this.physics.add.sprite(w * 0.24, walkwayY - spriteHeight * 0.49, 'boy')
      .setDisplaySize(spriteWidth, spriteHeight).setDepth(2);
    this.player.body.setSize(90, 345, false).setOffset(183, 60)
      .setCollideWorldBounds(true).setMaxVelocity(RUN_SPEED, 950);
    this.player.setDragX(2200);
    this.physics.add.collider(this.player, floor);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,SPACE');
    this.input.keyboard.on('keydown-ESC', this.returnToMenu, this);
    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => {
      this.input.keyboard.off('keydown-ESC', this.returnToMenu, this);
      this.scale.off('resize', this.onResize, this);
    });

    const label = this.add.graphics().setDepth(10);
    label.fillStyle(0x070d11, 0.72).fillRoundedRect(18, 16, Math.min(350, w - 36), 61, 8);
    this.add.text(31, 25, 'TEST ROOM', { fontFamily: 'Georgia, serif', fontSize: '17px', color: '#e7d2a4' }).setDepth(11);
    this.add.text(31, 52, 'A / D  MOVE     SPACE  JUMP     ESC  MENU', {
      fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#dce1d9', letterSpacing: 1,
    }).setDepth(11);
    sharpenText(this);

    this.lastGrounded = 0;
    this.jumpQueued = -1000;
  }

  onResize() { this.scene.restart(); }
  returnToMenu() { this.scene.start('MainMenu'); }

  update(time) {
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const direction = Number(right) - Number(left);
    this.player.setAccelerationX(direction * 2100).setDragX(direction ? 900 : 2200);
    if (direction !== 0) {
      const facingLeft = direction < 0;
      this.player.setFlipX(facingLeft);
      this.player.body.setOffset(facingLeft ? 57 : 183, 60);
    }

    if (this.player.body.blocked.down || this.player.body.touching.down) this.lastGrounded = time;
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.cursors.space)) this.jumpQueued = time;
    if (time - this.jumpQueued < 130 && time - this.lastGrounded < 120) {
      this.player.setVelocityY(JUMP_SPEED);
      this.jumpQueued = -1000;
      this.lastGrounded = -1000;
    }
  }
}
