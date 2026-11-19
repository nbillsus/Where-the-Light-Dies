import Phaser from 'phaser';
import thornwoodUrl from '../../assets/environment/parkour/thornwood.svg?url';
import cavernUrl from '../../assets/environment/parkour/drowned-cavern.svg?url';
import vaultUrl from '../../assets/environment/parkour/lantern-vault.svg?url';
import boyUpperUrl from '../../assets/characters/boy_upper.png?url';
import { BoyAnimator } from '../animation/BoyAnimator.js';
import { PARKOUR_STAGES } from '../levels/parkourData.js';
import { fixedLayerOffset, logicalSize, renderScale, sharpenText } from '../rendering.js';

const ART_URLS = [thornwoodUrl, cavernUrl, vaultUrl];
const RUN_SPEED = 320;
const JUMP_SPEED = -490;

export class ParkourScene extends Phaser.Scene {
  constructor() { super('Parkour'); }

  init(data) { this.levelIndex = Phaser.Math.Clamp(data?.levelIndex ?? 0, 0, PARKOUR_STAGES.length - 1); }

  preload() {
    const stage = PARKOUR_STAGES[this.levelIndex];
    this.backdropKey = `parkour-${stage.id}`;
    if (!this.textures.exists(this.backdropKey)) this.load.svg(this.backdropKey, ART_URLS[this.levelIndex]);
    if (!this.textures.exists('boy-upper')) this.load.image('boy-upper', boyUpperUrl);
  }

  create() {
    this.stage = PARKOUR_STAGES[this.levelIndex];
    const { width: w, height: h } = logicalSize(this);
    this.viewportWidth = w;
    this.viewportHeight = h;
    this.artScale = h / this.stage.height;
    this.worldWidth = this.stage.width * this.artScale;
    this.cameras.main.setZoom(renderScale).setBounds(0, 0, this.worldWidth, h);
    this.add.image(this.worldWidth / 2, h / 2, this.backdropKey).setDisplaySize(this.worldWidth, h);

    this.platforms = this.stage.platforms.map(([start, end, top]) => {
      const left = start * this.artScale;
      const right = end * this.artScale;
      const y = top * this.artScale;
      const zone = this.add.zone((left + right) / 2, y + 20, right - left, 40);
      this.physics.add.existing(zone, true);
      return { left, right, y, zone };
    });

    this.spriteHeight = Phaser.Math.Clamp(h * 0.21, 100, 190);
    const spriteWidth = this.spriteHeight * 330 / 410;
    const edgeInset = spriteWidth * 0.19;
    this.physics.world.setBounds(edgeInset, 0, this.worldWidth - edgeInset * 2, h + 320);
    this.player = this.physics.add.sprite(145 * this.artScale, this.platforms[0].y - this.spriteHeight * 0.49, 'boy-upper')
      .setDisplaySize(spriteWidth, this.spriteHeight);
    this.player.body.setSize(90, 345, false).setOffset(183, 60)
      .setCollideWorldBounds(true).setMaxVelocity(RUN_SPEED, 1000);
    this.player.setDragX(2200);
    for (const platform of this.platforms) this.physics.add.collider(this.player, platform.zone);
    this.animator = new BoyAnimator(this, this.player, this.spriteHeight);
    this.checkpoint = 0;
    this.lastGrounded = 0;
    this.jumpQueued = -1000;
    this.finished = false;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,SPACE');
    this.input.keyboard.on('keydown-ESC', this.returnToMenu, this);
    this.input.keyboard.on('keydown-R', this.restartStage, this);
    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => {
      this.input.keyboard.off('keydown-ESC', this.returnToMenu, this);
      this.input.keyboard.off('keydown-R', this.restartStage, this);
      this.scale.off('resize', this.onResize, this);
    });

    this.cameras.main.startFollow(this.player, false, 0.12, 0.12);
    this.cameras.main.setDeadzone(Math.min(w * 0.3, 360), h * 0.42);
    this.addHud(w, h);
    sharpenText(this);
  }

  addHud(w, h) {
    const offset = fixedLayerOffset(w, h);
    const hud = this.add.container(offset.x, offset.y).setScrollFactor(0).setDepth(30);
    hud.add(this.add.rectangle(16, 16, Math.min(410, w - 32), 72, 0x061015, 0.78).setOrigin(0));
    hud.add(this.add.text(29, 25, this.stage.title, {
      fontFamily: 'Georgia, serif', fontSize: '18px', color: '#e4d4ad',
    }));
    hud.add(this.add.text(30, 53, `PATH ${this.levelIndex + 1} / ${PARKOUR_STAGES.length}   ·   A / D RUN   ·   SPACE JUMP   ·   R RESTART`, {
      fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#d1dbd5', letterSpacing: 1,
    }));
  }

  onResize() { this.scene.restart({ levelIndex: this.levelIndex }); }
  returnToMenu() { this.scene.start('MainMenu'); }
  restartStage() { this.scene.restart({ levelIndex: this.levelIndex }); }

  respawn() {
    const platform = this.platforms[this.checkpoint];
    this.player.setPosition(Math.min(platform.right - 50, platform.left + 90), platform.y - this.spriteHeight * 0.49);
    this.player.setVelocity(0, 0).setAcceleration(0, 0);
    this.jumpQueued = -1000;
  }

  finishStage() {
    if (this.finished) return;
    this.finished = true;
    if (this.levelIndex < PARKOUR_STAGES.length - 1) {
      this.scene.start('Parkour', { levelIndex: this.levelIndex + 1 });
      return;
    }
    this.player.setVelocity(0, 0).setAcceleration(0, 0);
    const { viewportWidth: w, viewportHeight: h } = this;
    const offset = fixedLayerOffset(w, h);
    const card = this.add.container(offset.x, offset.y).setScrollFactor(0).setDepth(100);
    card.add(this.add.rectangle(w / 2, h / 2, w, h, 0x02080c, 0.76));
    card.add(this.add.text(w / 2, h / 2 - 43, 'END OF PARKOUR PREVIEW', {
      fontFamily: 'Georgia, serif', fontSize: '31px', color: '#f0dfb6', align: 'center',
    }).setOrigin(0.5));
    card.add(this.add.text(w / 2, h / 2 + 16, 'The next chapter will introduce the shadow.\n\nR RESTART    ·    ESC MENU', {
      fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#d3dedb', align: 'center', lineSpacing: 8,
    }).setOrigin(0.5));
    sharpenText(this);
  }

  update(time, delta) {
    if (this.finished) return;
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const direction = Number(right) - Number(left);
    this.player.setAccelerationX(direction * 2100).setDragX(direction ? 900 : 2200);
    if (direction !== 0) {
      const facingLeft = direction < 0;
      this.player.setFlipX(facingLeft);
      this.player.body.setOffset(facingLeft ? 57 : 183, 60);
    }

    const grounded = this.player.body.blocked.down || this.player.body.touching.down;
    if (grounded) {
      this.lastGrounded = time;
      const feet = this.player.body.bottom;
      const index = this.platforms.findIndex(platform => this.player.body.center.x >= platform.left
        && this.player.body.center.x <= platform.right && Math.abs(feet - platform.y) < 14);
      if (index >= 0) this.checkpoint = index;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.cursors.space)) this.jumpQueued = time;
    if (time - this.jumpQueued < 130 && time - this.lastGrounded < 120) {
      this.player.setVelocityY(JUMP_SPEED);
      this.jumpQueued = -1000;
      this.lastGrounded = -1000;
    }
    this.animator.update(time, delta, grounded);
    if (this.player.y > this.viewportHeight + 110) this.respawn();
    if (grounded && this.player.x > this.worldWidth - this.spriteHeight * 0.65) this.finishStage();
  }
}
