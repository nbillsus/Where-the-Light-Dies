import Phaser from 'phaser';
import { ensureFxTextures } from '../../effects/textures.js';
import { sfx } from '../../combat/sfx.js';
import { Skitterer } from '../Skitterer.js';

// Shared boss plumbing: health, phases, weak-point hits vs. armour sparks,
// contact damage, summoned minions and the death sequence.
export class Boss {
  constructor(scene, arena, { health, title, subtitle, deathTitle, deathLine, color }) {
    this.scene = scene;
    this.arena = arena;
    ensureFxTextures(scene);
    Object.assign(this, { maxHealth: health, title, subtitle, deathTitle, deathLine, color });
    this.H = scene.spriteHeight;
    this.floorY = arena.floor.y;
    // Behind the boy (depth 2) so he never disappears inside the boss.
    this.art = scene.add.container(0, 0).setDepth(1.8);
    this.engaged = false;
  }

  get armored() { return !this.exposed; }
  get phase2() { return this.health <= this.maxHealth / 2; }

  resetCommon() {
    this.health = this.maxHealth;
    this.alive = true;
    this.engaged = false;
    this.state = 'idle';
    this.nextAttackAt = 0;
    this.nextSummonAt = 0;
    this.stunUntil = 0;
    this.art.setVisible(true).setAlpha(1);
  }

  engage() {
    this.engaged = true;
    this.nextAttackAt = this.scene.time.now + 1600;
    this.nextSummonAt = this.scene.time.now + 9000;
  }

  /** Light Strike landed on `part`. Only the exposed weak point takes damage. */
  takeHit(damage, dir, time, heavy, part) {
    if (!this.alive || !this.engaged) return false;
    if (part !== 'core' || !this.exposed) {
      this.spark(this.scene.player.x + dir * this.H * .45, this.scene.player.y - this.H * .1);
      this.scene.player.setVelocityX(-dir * 160);
      return false;
    }
    this.health -= damage;
    const flash = this.scene.add.image(this.x, this.y, 'fx-glow').setTint(0xffffff).setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(this.H * 1.6, this.H * 1.6).setAlpha(.9).setDepth(12);
    this.scene.tweens.add({ targets: flash, alpha: 0, scale: 1.4, duration: 220, onComplete: () => flash.destroy() });
    if (this.health <= 0) this.die();
    return true;
  }

  spark(x, y) {
    const spark = this.scene.add.particles(x, y, 'fx-mote', {
      speed: { min: 80, max: 240 }, lifespan: 280, scale: { start: .55, end: 0 }, tint: [0xffffff, 0xffd59a],
      blendMode: 'ADD', emitting: false,
    }).setDepth(12);
    spark.explode(14);
    this.scene.time.delayedCall(400, () => spark.destroy());
    sfx.clank(this.scene);
  }

  /** Ground-level hit check for an attack covering [left, right]. */
  hitsPlayer(left, right, { needsGround = false, top = -Infinity } = {}) {
    const p = this.scene.player;
    if (needsGround && !(p.body.blocked.down || p.body.touching.down)) return false;
    return p.x > left && p.x < right && p.body.bottom > top;
  }

  summon(count) {
    const director = this.scene.enemies;
    const alive = director.list.filter(e => e.summoned && e.alive).length;
    for (let i = 0; i < Math.min(count, 4 - alive); i++) {
      const x = Phaser.Math.Clamp(this.x - (1.6 + i * .7) * this.H * this.facingSign(), this.arena.startX + this.H, this.arena.endX - this.H * 1.5);
      const minion = new Skitterer(this.scene, x, this.arena.floor);
      minion.summoned = true;
      director.list.push(minion);
      const puff = this.scene.add.image(x, this.floorY - this.H * .2, 'fx-glow').setTint(0x000000).setDisplaySize(this.H * 1.4, this.H)
        .setDepth(9).setAlpha(.9);
      this.scene.tweens.add({ targets: puff, alpha: 0, duration: 600, onComplete: () => puff.destroy() });
    }
  }

  facingSign() { return Math.sign(this.scene.player.x - this.x) || -1; }

  die() {
    this.alive = false;
    this.engaged = false;
    const scene = this.scene;
    for (const e of scene.enemies.list) if (e.summoned && e.alive) e.die();
    const smoke = scene.add.particles(this.x, this.y, 'fx-mote', {
      speed: { min: 60, max: 340 }, lifespan: { min: 600, max: 1600 }, scale: { start: 2.2, end: 0 },
      tint: [0x05070b, 0x1a1f2a, this.color], alpha: { start: .9, end: 0 }, emitting: false,
    }).setDepth(13);
    smoke.explode(90);
    scene.time.delayedCall(1800, () => smoke.destroy());
    scene.cameras.main.flash(500, 255, 240, 210);
    scene.shakeCamera(900, .02);
    sfx.enemyDeath(scene);
    scene.tweens.add({ targets: this.art, alpha: 0, duration: 900, onComplete: () => this.art.setVisible(false) });
    scene.events.emit('combat:enemy-killed', this);
    this.arena.defeated();
  }
}
