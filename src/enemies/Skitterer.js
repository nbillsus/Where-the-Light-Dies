import Phaser from 'phaser';
import { Enemy } from './Enemy.js';

// Skitterer: a small, fast shadow bug that hunts in groups.
// - Fears the lantern: if the boy faces it up close, it backs off.
// - Bites from behind or the side the lantern isn't pointing at.
// - Dies to one Light Strike; a Flare Pulse destroys it outright.
const T = {
  aggro: 3.2,      // × boy height: starts hunting
  lightRange: 1.6, // × boy height: lantern scares it away
  biteRange: .42,  // × boy height
  chaseSpeed: 205, fleeSpeed: 250, wanderSpeed: 45,
  biteCooldown: 900,
};

export class Skitterer extends Enemy {
  constructor(scene, x, platform) {
    const H = scene.spriteHeight;
    super(scene, { x, platform, width: H * .36, height: H * .2, health: 1 });
    this.H = H;
    this.legs = scene.add.graphics();
    this.shell = scene.add.graphics();
    this.eyes = scene.add.graphics();
    this.eyeGlow = scene.add.image(0, -this.height * .1, 'fx-glow').setTint(0xff5a3c)
      .setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(this.width * 1.1, this.width * .7).setAlpha(.45);
    this.drawShell();
    this.art.add([this.eyeGlow, this.legs, this.shell, this.eyes]);
    this.wanderFlip = 0;
    this.nextBite = 0;
    this.fleeUntil = 0;
    this.phase = Math.random() * 10;
  }

  drawShell() {
    const w = this.width, h = this.height, g = this.shell;
    g.clear().fillStyle(0x05060a, 1).fillEllipse(0, 0, w, h);
    g.fillStyle(0x05060a, 1);
    for (let i = -2; i <= 2; i++) g.fillTriangle(i * w * .15 - w * .06, -h * .3, i * w * .15 + w * .06, -h * .3, i * w * .15 - w * .04, -h * (.85 + Math.abs(i) * -.1));
    g.lineStyle(1.5, 0x3d4658, .8).strokeEllipse(0, 0, w, h);
    this.eyes.clear().fillStyle(0xffb08a, 1).fillCircle(w * .3, -h * .08, h * .1).fillCircle(w * .18, -h * .1, h * .08);
  }

  think(time) {
    const body = this.body.body;
    if (this.stunned) { body.setVelocityX(body.velocity.x * .85); return; }
    const { dx, dist, sameLevel, lit } = this.playerInfo();
    const H = this.H;
    const toward = Math.sign(dx) || 1;
    if (sameLevel && lit && dist < H * T.lightRange) this.fleeUntil = time + 450;
    if (time < this.fleeUntil) {
      this.state = 'flee';
      this.facing = -toward;
      body.setVelocityX(-toward * T.fleeSpeed);
    } else if (sameLevel && dist < H * T.aggro) {
      this.state = 'chase';
      this.facing = toward;
      body.setVelocityX(dist > H * T.biteRange * .7 ? toward * T.chaseSpeed : 0);
      if (dist < H * T.biteRange && time > this.nextBite) {
        this.nextBite = time + T.biteCooldown;
        if (this.scene.combat?.hurt(1, this.x)) body.setVelocity(-toward * 160, -180);
      }
    } else {
      this.state = 'idle';
      if (time > this.wanderFlip) { this.wanderFlip = time + Phaser.Math.Between(900, 2200); this.facing = Math.random() < .5 ? -1 : 1; }
      body.setVelocityX(this.facing * T.wanderSpeed);
    }
    if (this.clampToLedge() !== 0 && this.state === 'idle') this.facing *= -1;
  }

  draw(time) {
    const speed = Math.abs(this.body.body.velocity.x);
    this.phase += speed * .0009 + (this.stunned ? 0 : .02);
    const w = this.width, h = this.height, g = this.legs;
    g.clear().lineStyle(Math.max(1.5, h * .09), 0x05060a, 1);
    for (let i = 0; i < 3; i++) {
      const lx = (i - 1) * w * .26, swing = Math.sin(this.phase * 9 + i * 2.1) * w * .08;
      g.lineBetween(lx, 0, lx - w * .1 + swing, h * .55);
      g.lineBetween(lx, 0, lx + w * .1 - swing, h * .55);
    }
    this.art.setScale(this.facing, 1 + Math.sin(this.phase * 9) * .05);
    if (this.stunned) this.art.setAngle(Math.sin(time * .03) * 6); else this.art.setAngle(0);
    this.eyeGlow.setAlpha(this.state === 'chase' ? .7 : this.stunned ? .1 : .4);
  }

  flareHit() { this.health = 0; this.flash(); this.die(); }
}
