import Phaser from 'phaser';
import coastUrl from '../../assets/environment/parkour/storm-coast.svg?url';
import facilityUrl from '../../assets/environment/parkour/abandoned-facility.svg?url';
import thornwoodUrl from '../../assets/environment/parkour/thornwood.svg?url';
import cavernUrl from '../../assets/environment/parkour/drowned-cavern.svg?url';
import vaultUrl from '../../assets/environment/parkour/lantern-vault.svg?url';
import boyUpperUrl from '../../assets/characters/boy_upper.png?url';
import { BoyAnimator } from '../animation/BoyAnimator.js';
import { CHAPTER_STAGES } from '../levels/chapterData.js';
import { ShadowController } from '../gameplay/ShadowController.js';
import { ChapterMechanics } from '../gameplay/ChapterMechanics.js';
import { Cinematics } from '../gameplay/Cinematics.js';
import { fixedLayerOffset, logicalSize, renderScale, sharpenText } from '../rendering.js';

const ART_URLS = [coastUrl, facilityUrl, thornwoodUrl, cavernUrl, vaultUrl];
const RUN_SPEED = 320;
const JUMP_SPEED = -490;

export class ChapterScene extends Phaser.Scene {
  constructor() { super('Chapter'); }

  init(data) { this.levelIndex = Phaser.Math.Clamp(data?.levelIndex ?? 0, 0, CHAPTER_STAGES.length - 1); }

  preload() {
    const stage = CHAPTER_STAGES[this.levelIndex];
    this.backdropKey = `chapter-${stage.id}`;
    if (!this.textures.exists(this.backdropKey)) this.load.svg(this.backdropKey, ART_URLS[this.levelIndex]);
    if (!this.textures.exists('boy-upper')) this.load.image('boy-upper', boyUpperUrl);
  }

  create() {
    this.stage = CHAPTER_STAGES[this.levelIndex];
    const { width: w, height: h } = logicalSize(this);
    this.viewportWidth = w;
    this.viewportHeight = h;
    this.artScale = h / this.stage.height;
    this.worldWidth = this.stage.width * this.artScale;
    this.cameras.main.setZoom(renderScale).setBounds(0, 0, this.worldWidth, h);
    this.add.image(this.worldWidth / 2, h / 2, this.backdropKey).setDisplaySize(this.worldWidth, h).setDepth(-10);

    this.platforms = this.stage.platforms.map(([start, end, top]) => {
      const left = start * this.artScale;
      const right = end * this.artScale;
      const y = top * this.artScale;
      const zone = this.add.zone((left + right) / 2, y + 20, right - left, 40);
      this.physics.add.existing(zone, true);
      return { left, right, y, zone };
    });

    this.spriteHeight = Phaser.Math.Clamp(h * .21, 100, 190);
    const spriteWidth = this.spriteHeight * 330 / 410;
    const edgeInset = spriteWidth * .19;
    this.physics.world.setBounds(edgeInset, 0, this.worldWidth - edgeInset * 2, h + 320);
    this.player = this.physics.add.sprite(145 * this.artScale, this.platforms[0].y - this.spriteHeight * .49, 'boy-upper')
      .setDisplaySize(spriteWidth, this.spriteHeight);
    this.player.body.setSize(90, 345, false).setOffset(183, 60)
      .setCollideWorldBounds(true).setMaxVelocity(RUN_SPEED, 1000);
    this.placePlayerOnPlatform(0, 145 * this.artScale);
    this.player.setDragX(2200);
    for (const platform of this.platforms) this.physics.add.collider(this.player, platform.zone);
    this.animator = new BoyAnimator(this, this.player, this.spriteHeight);
    this.shadow = this.stage.shadow ? new ShadowController(this, this.player, this.spriteHeight) : null;
    this.mechanics = new ChapterMechanics(this);
    this.cinematics = new Cinematics(this);
    this.checkpoint = 0;
    this.lastGrounded = 0;
    this.jumpQueued = -1000;
    this.finished = false;
    this.shadowAwakeningShown = false;
    if (import.meta.env.DEV) {
      const requested = Number.parseInt(new URLSearchParams(window.location.search).get('checkpoint'), 10);
      if (Number.isInteger(requested) && requested >= 1 && requested <= this.platforms.length) {
        this.checkpoint = requested - 1;
        this.placePlayerOnPlatform(this.checkpoint);
      }
    }

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,W,S,SPACE,Q,F,E,R');
    this.input.keyboard.on('keydown-ESC', this.returnToMenu, this);
    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => {
      this.input.keyboard.off('keydown-ESC', this.returnToMenu, this);
      this.scale.off('resize', this.onResize, this);
    });

    this.cameras.main.setDeadzone(Math.min(w * .3, 360), h * .42);
    this.followActor(this.player);
    this.addHud(w, h);
    this.cinematics.pulse(this.stage.phase, this.stage.subtitle, this.stage.shadow ? 0xb79bdb : 0xa5dde3);
    sharpenText(this);
  }

  followActor(actor) { this.cameras.main.startFollow(actor, false, .12, .12); }
  onResize() { this.scene.restart({ levelIndex: this.levelIndex }); }
  returnToMenu() { this.scene.start('MainMenu'); }

  addHud(w, h) {
    const offset = fixedLayerOffset(w, h);
    const hud = this.add.container(offset.x, offset.y).setScrollFactor(0).setDepth(30);
    hud.add(this.add.rectangle(16, 16, Math.min(468, w - 32), 77, 0x061015, .82).setOrigin(0));
    hud.add(this.add.text(29, 23, this.stage.title, {
      fontFamily: 'Georgia, serif', fontSize: '18px', color: '#f0e0bd',
    }));
    const controls = this.stage.shadow ? 'A / D RUN   ·   SPACE JUMP   ·   Q SHADOW   ·   F ANCHOR   ·   E USE'
      : 'A / D RUN   ·   SPACE JUMP   ·   E USE   ·   R RESTART';
    hud.add(this.add.text(30, 54, `${this.levelIndex + 1} / ${CHAPTER_STAGES.length}   ·   ${controls}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#d1dbd5', letterSpacing: 1,
    }));
    hud.add(this.add.rectangle(w / 2, h - 37, Math.min(w - 28, 720), 39, 0x061015, .78));
    this.hintText = this.add.text(w / 2, h - 37, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#e2ede4', align: 'center', letterSpacing: 1,
      wordWrap: { width: Math.max(200, w - 58) },
    }).setOrigin(.5);
    hud.add(this.hintText);
  }

  announce(message, color = 0xb9e5df) {
    if (this.toast) this.toast.destroy(true);
    const w = this.viewportWidth, h = this.viewportHeight;
    const offset = fixedLayerOffset(w, h);
    const toast = this.add.container(offset.x, offset.y).setScrollFactor(0).setDepth(45);
    toast.add(this.add.rectangle(w / 2, 120, Math.min(620, w - 38), 58, 0x06121b, .9).setStrokeStyle(2, color, .65));
    toast.add(this.add.text(w / 2, 120, message, {
      fontFamily: 'Georgia, serif', fontSize: '18px', color: '#f6e9d5', align: 'center', wordWrap: { width: w - 80 },
    }).setOrigin(.5));
    this.toast = toast;
    this.time.delayedCall(2400, () => {
      if (toast.active) this.tweens.add({ targets: toast, alpha: 0, duration: 450, onComplete: () => toast.destroy(true) });
    });
    sharpenText(this);
  }

  flashAt(x, y, color) {
    const flare = this.add.circle(x, y, 14, color, .52).setDepth(8);
    this.tweens.add({ targets: flare, radius: 150, alpha: 0, duration: 540, onComplete: () => flare.destroy() });
  }

  showDistantSilhouette() {
    const x = 3190 * this.artScale, y = 380 * this.artScale;
    const figure = this.add.container(x, y).setDepth(-2).setAlpha(.54);
    figure.add(this.add.ellipse(0, 0, 24 * this.artScale, 35 * this.artScale, 0x070a14));
    figure.add(this.add.triangle(0, 50 * this.artScale, 0, 0, -26 * this.artScale, 92 * this.artScale, 30 * this.artScale, 92 * this.artScale, 0x070a14));
    this.tweens.add({ targets: figure, x: x + 210 * this.artScale, alpha: 0, duration: 2100, ease: 'Sine.easeInOut', onComplete: () => figure.destroy(true) });
    this.announce('SOMETHING MOVED BEYOND THE FOG.', 0xadc7e4);
  }

  placePlayerOnPlatform(index, x = null) {
    const platform = this.platforms[index];
    this.player.setPosition(x ?? Math.min(platform.right - 50, platform.left + 40), platform.y - this.spriteHeight * .49);
    this.player.body.updateFromGameObject();
    this.player.y -= this.player.body.bottom - (platform.y - 8);
    this.player.body.updateFromGameObject();
  }

  respawn() {
    this.placePlayerOnPlatform(this.checkpoint);
    this.player.setVelocity(0, 0).setAcceleration(0, 0);
    if (this.shadow?.detached) this.shadow.toggleDetach();
    this.jumpQueued = -1000;
    this.followActor(this.player);
  }

  finishStage() {
    if (this.finished) return;
    this.finished = true;
    this.player.setVelocity(0, 0).setAcceleration(0, 0);
    if (this.levelIndex === CHAPTER_STAGES.length - 1) {
      this.cinematics.finale();
      return;
    }
    this.cameras.main.fadeOut(600, 2, 7, 16);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => this.scene.start('Chapter', { levelIndex: this.levelIndex + 1 }));
  }

  update(time, delta) {
    if (this.finished) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.scene.start('Chapter', { levelIndex: 0 });
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.R)) { this.scene.restart({ levelIndex: this.levelIndex }); return; }
    if (this.shadow && Phaser.Input.Keyboard.JustDown(this.keys.Q)) {
      const detached = this.shadow.toggleDetach();
      this.announce(detached ? 'THE SHADOW IS FREE. MOVE IT WITH W / A / S / D. F ANCHORS IT.' : 'THE SHADOW RETURNS.', detached ? 0xc0e8f0 : 0xf0d6a8);
      if (detached && this.stage.id === 'thornwood' && !this.shadowAwakeningShown) {
        this.shadowAwakeningShown = true;
        this.cinematics.pulse('IT MOVED FIRST', 'The light has not changed. Your shadow has.', 0xb7d5ef, 2400);
      }
    }
    if (this.shadow && Phaser.Input.Keyboard.JustDown(this.keys.F) && this.shadow.detached) {
      this.shadow.toggleAnchor();
      this.announce(this.shadow.anchored ? 'SHADOW ANCHORED. THE KEEPER CAN MOVE.' : 'SHADOW RELEASED.', 0xbde7eb);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.E) && !this.shadow?.controlling) this.mechanics.interact();

    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;
    const controllingShadow = !!this.shadow?.controlling;
    const direction = controllingShadow ? 0 : Number(right) - Number(left);
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
    if (!controllingShadow && (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.cursors.space))) this.jumpQueued = time;
    if (!controllingShadow && time - this.jumpQueued < 130 && time - this.lastGrounded < 120) {
      this.player.setVelocityY(JUMP_SPEED);
      this.jumpQueued = -1000;
      this.lastGrounded = -1000;
    }
    if (!controllingShadow && !this.keys.SPACE.isDown && !this.cursors.space.isDown && this.player.body.velocity.y < -180)
      this.player.setVelocityY(this.player.body.velocity.y * .86);

    this.animator.update(time, delta, grounded);
    this.shadow?.update(time, delta, { left, right, up, down });
    this.mechanics.update(time);
    this.hintText.setText(this.shadow?.controlling ? 'SHADOW ACTIVE  ·  W / A / S / D MOVE  ·  F ANCHOR  ·  Q RECALL' : this.mechanics.prompt);
    if (this.player.y > this.viewportHeight + 110) this.respawn();
    if (grounded && this.player.x > this.worldWidth - this.spriteHeight * .43) this.finishStage();
  }
}
