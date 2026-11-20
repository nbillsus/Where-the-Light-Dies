import Phaser from 'phaser';
import { Enemy } from './Enemy.js';
import { sfx } from '../combat/sfx.js';

// Shroud Warden: a tall armoured shadow that guards a ledge.
// - Its FRONT is armoured: Light Strikes there only spark.
// - Hit it from BEHIND, or stun it with a Flare Pulse first (armour goes dark).
// - Telegraphs its swing: raises its blade and its eyes flare before striking.
const T = {
  sight: 3.0,        // × boy height
  attackRange: .85,  // × boy height, in front of it
  walkSpeed: 70, patrolSpeed: 38,
  windup: 650, cooldown: 1500, health: 4,
  turnDelay: 480,  // ms before it turns to face a player who got behind it
  recover: 700,    // ms it stands still after a swing (the punish window)
};

export class ShroudWarden extends Enemy {
  constructor(scene, x, platform) {
    const H = scene.spriteHeight;
    super(scene, { x, platform, width: H * .42, height: H * 1.12, health: T.health });
    this.H = H;
    this.eyeGlow = scene.add.image(this.width * .12, -this.height * .32, 'fx-glow').setTint(0xbfe7ff)
      .setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(H * .5, H * .3).setAlpha(.5);
    this.cloak = scene.add.graphics();
    this.armor = scene.add.graphics();
    this.arm = scene.add.graphics();
    this.drawCloak();
    this.drawArmor(true);
    this.drawArm();
    this.arm.setPosition(this.width * .18, -this.height * .12);
    this.art.add([this.eyeGlow, this.cloak, this.arm, this.armor]);
    this.nextAttack = 0;
    this.patrolFlip = 0;
  }

  get armored() { return !this.stunned; }

  drawCloak() {
    const w = this.width, h = this.height, g = this.cloak;
    g.clear().fillStyle(0x06070c, 1).fillPoints([
      { x: 0, y: -h * .5 }, { x: w * .38, y: -h * .28 }, { x: w * .5, y: h * .5 },
      { x: w * .1, y: h * .42 }, { x: -w * .2, y: h * .5 }, { x: -w * .5, y: h * .48 }, { x: -w * .34, y: -h * .26 },
    ], true);
    g.fillStyle(0xdff3ff, .95).fillRect(w * .02, -h * .34, w * .14, h * .025).fillRect(w * .2, -h * .335, w * .12, h * .022);
  }

  // Armour plates on the front (the side it faces).
  drawArmor(on) {
    const w = this.width, h = this.height, g = this.armor;
    const edge = on ? 0x8b98a8 : 0x2a2f38, fill = on ? 0x262c35 : 0x111419;
    g.clear().fillStyle(fill, 1).lineStyle(2, edge, .95);
    for (const [y, len] of [[-.2, .32], [0, .36], [.2, .32]]) {
      const pts = [{ x: w * .16, y: h * y }, { x: w * (.16 + len), y: h * (y + .03) }, { x: w * (.1 + len), y: h * (y + .17) }, { x: w * .1, y: h * (y + .15) }];
      g.fillPoints(pts, true).strokePoints(pts, true);
    }
  }

  drawArm() {
    const h = this.height, g = this.arm;
    g.clear().lineStyle(this.width * .12, 0x06070c, 1).lineBetween(0, 0, this.width * .55, h * .22);
    g.fillStyle(0x9aa6b4, 1).fillTriangle(this.width * .5, h * .18, this.width * .62, h * .26, this.width * 1.25, h * .02);
  }

  think(time) {
    const body = this.body.body;
    const { dx, dist, sameLevel } = this.playerInfo();
    const H = this.H;
    if (this.stunned) { body.setVelocityX(0); return; }
    if (this.state === 'windup') {
      body.setVelocityX(0);
      if (time >= this.strikeAt) this.swing(time);
      return;
    }
    if (time < this.recoverUntil) { body.setVelocityX(0); return; }
    if (sameLevel && dist < H * T.sight) {
      this.state = 'hunt';
      // Heavy armour: it takes a moment to turn round when you get behind it.
      const side = Math.sign(dx) || this.facing;
      if (side !== this.facing) {
        this.behindSince ??= time;
        if (time - this.behindSince > T.turnDelay) { this.facing = side; this.behindSince = null; }
      } else this.behindSince = null;
      const inFront = side === this.facing;
      if (inFront && dist > H * T.attackRange * .8) body.setVelocityX(this.facing * T.walkSpeed);
      else body.setVelocityX(0);
      if (inFront && dist < H * T.attackRange && time > this.nextAttack) {
        this.state = 'windup';
        this.strikeAt = time + T.windup;
        sfx.windup(this.scene);
      }
    } else {
      this.state = 'patrol';
      if (time > this.patrolFlip) { this.patrolFlip = time + Phaser.Math.Between(1800, 3200); this.facing *= -1; }
      body.setVelocityX(this.facing * T.patrolSpeed);
    }
    if (this.clampToLedge() !== 0 && this.state === 'patrol') this.facing *= -1;
  }

  swing(time) {
    this.state = 'hunt';
    this.nextAttack = time + T.cooldown;
    this.recoverUntil = time + T.recover;
    const { dx, sameLevel } = this.playerInfo();
    const inFront = Math.sign(dx) === this.facing && Math.abs(dx) < this.H * T.attackRange * 1.15;
    if (sameLevel && inFront) this.scene.combat?.hurt(1, this.x);
    const slash = this.scene.add.graphics().setDepth(12).setBlendMode(Phaser.BlendModes.ADD);
    slash.lineStyle(6, 0xbfe7ff, .8).beginPath()
      .arc(0, 0, this.H * .7, -1.2, .9, false).strokePath();
    slash.setPosition(this.x, this.y - this.height * .1).setScale(this.facing, 1);
    this.scene.tweens.add({ targets: slash, alpha: 0, duration: 200, onComplete: () => slash.destroy() });
  }

  /** Front hits are blocked by the armour unless it is stunned. */
  takeHit(damage, dir, time, heavy) {
    if (!this.alive) return false;
    const fromFront = dir === -this.facing;
    if (fromFront && this.armored) {
      const spark = this.scene.add.particles(this.x + this.facing * this.width * .45, this.y - this.height * .05, 'fx-mote', {
        speed: { min: 80, max: 220 }, lifespan: 260, scale: { start: .5, end: 0 }, tint: [0xffffff, 0xbfe7ff, 0xffd59a],
        blendMode: 'ADD', emitting: false,
      }).setDepth(12);
      spark.explode(12);
      this.scene.time.delayedCall(400, () => spark.destroy());
      sfx.clank(this.scene);
      this.scene.player.setVelocityX(-dir * 180);
      return false;
    }
    return super.takeHit(damage, dir, time, heavy);
  }

  stun(ms, time) {
    super.stun(ms, time);
    this.drawArmor(false);
    this.scene.time.delayedCall(ms, () => { if (this.alive) this.drawArmor(true); });
  }

  flareHit(time, ms) { this.stun(ms, time); this.flash(); }

  reset() {
    super.reset();
    this.recoverUntil = 0;
    this.behindSince = null;
    if (this.armor) this.drawArmor(true);
  }

  draw(time) {
    this.art.setScale(this.facing, 1);
    const winding = this.state === 'windup';
    const target = winding ? -75 : this.stunned ? 25 : 10;
    this.arm.angle += (target - this.arm.angle) * .25;
    this.eyeGlow.setAlpha(winding ? .95 : this.stunned ? .08 : .45 + Math.sin(time * .004) * .1);
    this.eyeGlow.setTint(winding ? 0xff7a5a : 0xbfe7ff);
    this.art.setAngle(this.stunned ? Math.sin(time * .02) * 4 : 0);
  }
}
