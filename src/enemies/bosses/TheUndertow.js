import Phaser from 'phaser';
import { Boss } from './Boss.js';

// Chapter 3's boss fights entirely on the continuous arena floor. Its eye
// travels along a rail at striking height; a marked floor surge is jumped.
export class TheUndertow extends Boss {
  constructor(scene, arena) {
    super(scene, arena, {
      health: 16, title: 'THE UNDERTOW', subtitle: 'The sea has kept a copy of every light.',
      deathTitle: 'THE CURRENT BREAKS', deathLine: 'A voice calls from much farther below.', color: 0x8ddce4,
    });
    this.start = arena.startX + this.H * 2;
    this.end = arena.endX - this.H * 1.5;
    this.eye = scene.add.circle(0, 0, this.H * .38, 0x102b36, 1).setStrokeStyle(8, 0xb6f4e9).setDepth(7);
    this.glow = scene.add.image(0, 0, 'fx-glow').setTint(0x75e8e3).setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(this.H * 2, this.H * 2).setDepth(5);
    this.rail = scene.add.graphics().setDepth(4).lineStyle(5, 0x68aeb9, .6)
      .lineBetween(this.start, this.floorY - this.H * .85, this.end, this.floorY - this.H * .85);
    this.surge = scene.add.rectangle(0, this.floorY - this.H * .11, this.H * 1.7, this.H * .2, 0x9ff7ee, 0).setDepth(8);
    this.warning = scene.add.rectangle(0, this.floorY - 4, this.H * 1.8, 8, 0x8ddce4, 0).setDepth(8);
    this.reset();
  }
  get x() { return this.bx; }
  get y() { return this.floorY - this.H * .85; }
  get top() { return this.y - this.H * .4; }
  get width() { return this.H * .9; }
  get height() { return this.H * .9; }
  get exposed() { return this.scene.time.now < this.exposedUntil; }
  reset() {
    this.resetCommon();
    this.bx = this.end;
    this.exposedUntil = 0;
    this.warningAt = 0;
    this.surgeUntil = 0;
    this.surgeX = this.start;
    this.eye.setVisible(true);
    this.glow.setVisible(true);
    this.warning.setAlpha(0);
    this.surge.setAlpha(0);
  }
  engage() { super.engage(); this.nextAttackAt = this.scene.time.now + 1700; }
  hitTest(box) {
    if (!this.alive || !this.engaged) return null;
    return this.x + this.width / 2 > box.left && this.x - this.width / 2 < box.right
      && this.y + this.height / 2 > box.top && this.y - this.height / 2 < box.bottom ? 'core' : null;
  }
  flareHit(time) { this.exposedUntil = time + 1600; this.nextAttackAt = Math.max(this.nextAttackAt, time + 1000); }
  update(time) {
    if (!this.alive) return;
    this.bx = this.start + (this.end - this.start) * (.5 + .5 * Math.sin(time * (this.phase2 ? .0009 : .00065)));
    this.eye.setPosition(this.bx, this.y).setFillStyle(this.exposed ? 0x75e4de : 0x18333c);
    this.glow.setPosition(this.bx, this.y).setAlpha(this.exposed ? .48 : .2);
    if (!this.engaged) return;
    if (this.warningAt && time >= this.warningAt) {
      this.warningAt = 0;
      this.warning.setAlpha(0);
      this.surgeUntil = time + 650;
      this.exposedUntil = time + 2400;
      this.surge.setPosition(this.surgeX, this.floorY - this.H * .11).setAlpha(.75);
      if (this.hitsPlayer(this.surgeX - this.H * .85, this.surgeX + this.H * .85, { needsGround: true })) this.scene.combat?.hurt(1, this.surgeX);
    }
    if (this.surgeUntil && time >= this.surgeUntil) { this.surgeUntil = 0; this.surge.setAlpha(0); }
    if (time >= this.nextAttackAt) {
      this.surgeX = Phaser.Math.Clamp(this.scene.player.x, this.start, this.end);
      this.warning.setPosition(this.surgeX, this.floorY - 4).setAlpha(.8);
      this.warningAt = time + 950;
      this.nextAttackAt = time + (this.phase2 ? 3300 : 4100);
      if (this.phase2 && time >= this.nextSummonAt) { this.summon(1); this.nextSummonAt = time + 8500; }
    }
  }
  takeHit(damage, dir, time, heavy, part) {
    // The vulnerable eye stays at reachable height after every marked surge.
    return super.takeHit(damage, dir, time, heavy, part);
  }
  die() { super.die(); this.eye.setVisible(false); this.glow.setVisible(false); this.warning.setAlpha(0); this.surge.setAlpha(0); }
}
