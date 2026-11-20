import Phaser from 'phaser';
import { Enemy } from './Enemy.js';

// Skitterer: a small, fast shadow bug that hunts in groups.
// - Fears the lantern: facing it makes it hang back and circle, but every
//   second or so it darts in anyway (a lunge you can see coming).
// - From behind it rushes straight in and bites.
// - Touching it hurts. Dies to one Light Strike; a Flare Pulse destroys it.
const T = {
  aggro: 3.4,      // × boy height: starts hunting
  lightRange: 1.7, // × boy height: inside this, facing it makes it hesitate
  biteRange: .5,   // × boy height
  chaseSpeed: 215, hesitateSpeed: 70, lungeSpeed: 520, wanderSpeed: 45,
  biteCooldown: 800, lungeTime: 320,
  lungeEvery: [900, 1600], // ms between lunges while lit
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
    this.lungeUntil = 0;
    this.nextLunge = 0;
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
    if (time < this.lungeUntil) {
      this.state = 'lunge';
      body.setVelocityX(this.lungeDir * T.lungeSpeed);
    } else if (sameLevel && dist < H * T.aggro) {
      this.facing = toward;
      if (lit && dist < H * T.lightRange) {
        // Hesitate at the edge of the light, then dart in.
        this.state = 'hesitate';
        body.setVelocityX(dist < H * T.lightRange * .7 ? -toward * T.hesitateSpeed : toward * T.hesitateSpeed * .5);
        if (!this.nextLunge) this.nextLunge = time + Phaser.Math.Between(...T.lungeEvery);
        if (time > this.nextLunge && body.blocked.down) {
          this.lungeUntil = time + T.lungeTime;
          this.lungeDir = toward;
          this.nextLunge = time + T.lungeTime + Phaser.Math.Between(...T.lungeEvery);
          body.setVelocity(toward * T.lungeSpeed, -200);
        }
      } else {
        this.state = 'chase';
        this.nextLunge = 0;
        body.setVelocityX(dist > H * T.biteRange * .6 ? toward * T.chaseSpeed : 0);
      }
    } else {
      this.state = 'idle';
      this.nextLunge = 0;
      if (time > this.wanderFlip) { this.wanderFlip = time + Phaser.Math.Between(900, 2200); this.facing = Math.random() < .5 ? -1 : 1; }
      body.setVelocityX(this.facing * T.wanderSpeed);
    }
    // Bite on contact (lunging or close behind).
    if (sameLevel && dist < H * T.biteRange && time > this.nextBite) {
      this.nextBite = time + T.biteCooldown;
      if (this.scene.combat?.hurt(1, this.x)) { this.lungeUntil = 0; body.setVelocity(-toward * 180, -180); }
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
    this.eyeGlow.setAlpha(this.state === 'chase' || this.state === 'lunge' ? .8 : this.stunned ? .1 : .4);
  }

  flareHit() { this.health = 0; this.flash(); this.die(); }
}
