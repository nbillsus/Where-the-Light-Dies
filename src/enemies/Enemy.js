import Phaser from 'phaser';
import { ensureFxTextures } from '../effects/textures.js';
import { sfx } from '../combat/sfx.js';

// Shared enemy plumbing: an invisible physics body that walks on the level's
// platforms, a drawing that follows it, health, stun, death and respawn.
// Enemies stay on the ledge they spawn on, so they never fall into pits.
// Owner: Neel's lane (enemies and AI); started by Lucas with the combat step.
export class Enemy {
  constructor(scene, { x, platform, width, height, health }) {
    this.scene = scene;
    ensureFxTextures(scene);
    this.platform = platform;
    this.width = width;
    this.height = height;
    this.maxHealth = health;
    this.spawnX = x;
    this.body = scene.add.rectangle(x, platform.y - height / 2 - 1, width, height, 0, 0);
    scene.physics.add.existing(this.body);
    this.body.body.setCollideWorldBounds(true).setMaxVelocity(600, 1000);
    for (const ledge of scene.platforms) scene.physics.add.collider(this.body, ledge.zone);
    this.art = scene.add.container(x, this.body.y).setDepth(6);
    this.facing = -1;
    this.reset();
  }

  get x() { return this.body.x; }
  get y() { return this.body.y; }
  get top() { return this.body.y - this.height / 2; }
  get stunned() { return this.scene.time.now < this.stunUntil; }
  get armored() { return false; }

  reset() {
    this.health = this.maxHealth;
    this.alive = true;
    this.stunUntil = 0;
    this.state = 'idle';
    this.body.body.enable = true;
    this.body.body.reset(this.spawnX, this.platform.y - this.height / 2 - 1);
    this.art.setVisible(true).setAlpha(1).setScale(1);
  }

  // Keep walking inside the ledge we were placed on.
  clampToLedge() {
    const half = this.width / 2, body = this.body.body;
    const min = this.platform.left + half + 2, max = this.platform.right - half - 2;
    if (this.body.x < min) { body.reset(min, this.body.y); body.setVelocityX(0); return -1; }
    if (this.body.x > max) { body.reset(max, this.body.y); body.setVelocityX(0); return 1; }
    return 0;
  }

  /** Called by the player's Light Strike. Returns true if it landed. */
  takeHit(damage, dir, time, heavy) {
    if (!this.alive) return false;
    this.health -= damage;
    this.flash();
    this.body.body.setVelocity(dir * (heavy ? 340 : 200), -120);
    if (this.health <= 0) this.die();
    return true;
  }

  stun(ms, time) {
    if (!this.alive) return;
    this.stunUntil = time + ms;
    this.state = 'stunned';
  }

  flash() {
    const glow = this.scene.add.image(this.x, this.y, 'fx-glow').setTint(0xffffff).setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(this.width * 2.2, this.height * 1.6).setAlpha(.8).setDepth(8);
    this.scene.tweens.add({ targets: glow, alpha: 0, duration: 160, onComplete: () => glow.destroy() });
    this.scene.tweens.add({ targets: this.art, scaleY: .86, duration: 60, yoyo: true });
  }

  die() {
    this.alive = false;
    this.body.body.enable = false;
    const smoke = this.scene.add.particles(this.x, this.y, 'fx-mote', {
      speed: { min: 30, max: 140 }, lifespan: { min: 400, max: 900 }, scale: { start: .9, end: 0 },
      tint: [0x05070b, 0x1a1f2a, 0x3a2f45], alpha: { start: .9, end: 0 }, emitting: false,
    }).setDepth(9);
    smoke.explode(24);
    this.scene.time.delayedCall(1000, () => smoke.destroy());
    this.scene.tweens.add({ targets: this.art, alpha: 0, scaleY: .2, duration: 260, onComplete: () => this.art.setVisible(false) });
    sfx.enemyDeath(this.scene);
    this.scene.events.emit('combat:enemy-killed', this);
  }

  // Each subclass implements think(time, delta) and draw(time).
  update(time, delta) {
    if (!this.alive) return;
    this.think(time, delta);
    this.clampToLedge();
    this.art.setPosition(this.body.x, this.body.y);
    this.draw(time);
  }

  // Helpers for AI.
  playerInfo() {
    const player = this.scene.player;
    const dx = player.x - this.x;
    return {
      player, dx, dist: Math.abs(dx),
      sameLevel: Math.abs(player.y - this.y) < this.scene.spriteHeight * .9,
      // The lantern faces the way the boy faces.
      lit: Math.sign(-dx) === (player.flipX ? -1 : 1),
    };
  }
}
