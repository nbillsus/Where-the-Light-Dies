import Phaser from 'phaser';
import { Boss } from './Boss.js';
import { sfx } from '../../combat/sfx.js';

// The eye travels along a continuous floor arena. Marked surges can be jumped;
// periodic thunderstorms target the Keeper and must be dodged horizontally.
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
    this.stormMarks = scene.add.graphics().setDepth(9);
    this.stormBolts = scene.add.graphics().setDepth(10);
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
    this.nextStormAt = 0;
    this.stormWarnUntil = 0;
    this.stormStrikeUntil = 0;
    this.stormTargets = [];
    this.eye.setVisible(true);
    this.glow.setVisible(true);
    this.warning.setAlpha(0);
    this.surge.setAlpha(0);
    this.stormMarks.clear();
    this.stormBolts.clear();
  }
  engage() {
    super.engage();
    this.nextAttackAt = this.scene.time.now + 1700;
    this.nextStormAt = this.scene.time.now + 5000;
  }
  hitTest(box) {
    if (!this.alive || !this.engaged) return null;
    return this.x + this.width / 2 > box.left && this.x - this.width / 2 < box.right
      && this.y + this.height / 2 > box.top && this.y - this.height / 2 < box.bottom ? 'core' : null;
  }
  flareHit(time) { this.exposedUntil = time + 1600; this.nextAttackAt = Math.max(this.nextAttackAt, time + 1000); }
  warnStorm(time) {
    const H = this.H;
    const target = Phaser.Math.Clamp(this.scene.player.x, this.start + H, this.end - H);
    // One tracked strike and a second strike across the arena leave a clear
    // escape route. In phase two the warning is shorter and the radius grows.
    const second = Phaser.Math.Clamp(target + (target > (this.start + this.end) / 2 ? -2.5 : 2.5) * H,
      this.start + H, this.end - H);
    this.stormTargets = [target, second];
    this.stormWarnUntil = time + (this.phase2 ? 900 : 1200);
    this.nextStormAt = time + (this.phase2 ? 5600 : 7200);
    this.scene.announce('THUNDER — MOVE OUT OF THE MARKS', 0x9be8ef);
  }
  drawStormWarning(time) {
    const g = this.stormMarks.clear();
    const pulse = .45 + Math.sin(time * .026) * .2;
    for (const x of this.stormTargets) {
      g.fillStyle(0x83dce9, .12 + pulse * .16).fillEllipse(x, this.floorY - 3, this.H * 1.15, this.H * .23);
      g.lineStyle(3, 0xc9fbf3, .5 + pulse).strokeEllipse(x, this.floorY - 3, this.H * 1.15, this.H * .23);
      g.lineStyle(2, 0x8cdaea, .2 + pulse * .25).lineBetween(x, this.floorY - this.H * 3, x, this.floorY - this.H * .2);
    }
  }
  strikeStorm(time) {
    this.stormWarnUntil = 0;
    this.stormMarks.clear();
    this.stormStrikeUntil = time + 480;
    this.exposedUntil = Math.max(this.exposedUntil, time + 1600);
    const g = this.stormBolts.clear();
    for (const x of this.stormTargets) {
      const top = Math.max(0, this.floorY - this.H * 4.4);
      g.lineStyle(14, 0x488da4, .52).beginPath().moveTo(x - this.H * .18, top)
        .lineTo(x + this.H * .1, top + this.H).lineTo(x - this.H * .11, top + this.H * 2.15)
        .lineTo(x + this.H * .13, top + this.H * 3.15).lineTo(x, this.floorY).strokePath();
      g.lineStyle(4, 0xe2fffb, 1).beginPath().moveTo(x - this.H * .18, top)
        .lineTo(x + this.H * .1, top + this.H).lineTo(x - this.H * .11, top + this.H * 2.15)
        .lineTo(x + this.H * .13, top + this.H * 3.15).lineTo(x, this.floorY).strokePath();
      g.fillStyle(0x8ae9ea, .35).fillEllipse(x, this.floorY - 4, this.H, this.H * .18);
    }
    this.scene.shakeCamera(260, .009);
    sfx.thunder(this.scene);
  }
  update(time) {
    if (!this.alive) return;
    this.bx = this.start + (this.end - this.start) * (.5 + .5 * Math.sin(time * (this.phase2 ? .0009 : .00065)));
    this.eye.setPosition(this.bx, this.y).setFillStyle(this.exposed ? 0x75e4de : 0x18333c);
    this.glow.setPosition(this.bx, this.y).setAlpha(this.exposed ? .48 : .2);
    if (!this.engaged) return;
    if (time >= this.nextStormAt && !this.stormWarnUntil && !this.stormStrikeUntil) this.warnStorm(time);
    if (this.stormWarnUntil) {
      if (time >= this.stormWarnUntil) this.strikeStorm(time);
      else this.drawStormWarning(time);
    }
    if (this.stormStrikeUntil) {
      const radius = this.H * (this.phase2 ? .62 : .52);
      if (this.stormTargets.some(x => Math.abs(this.scene.player.x - x) < radius))
        this.scene.combat?.hurt(1, this.stormTargets[0]);
      if (time >= this.stormStrikeUntil) { this.stormStrikeUntil = 0; this.stormBolts.clear(); }
    }
    if (this.warningAt && time >= this.warningAt) {
      this.warningAt = 0;
      this.warning.setAlpha(0);
      this.surgeUntil = time + 650;
      this.exposedUntil = time + 2400;
      this.surge.setPosition(this.surgeX, this.floorY - this.H * .11).setAlpha(.75);
      if (this.hitsPlayer(this.surgeX - this.H * .85, this.surgeX + this.H * .85, { needsGround: true })) this.scene.combat?.hurt(1, this.surgeX);
    }
    if (this.surgeUntil && time >= this.surgeUntil) { this.surgeUntil = 0; this.surge.setAlpha(0); }
    if (this.surgeUntil && this.hitsPlayer(this.surgeX - this.H * .85, this.surgeX + this.H * .85, { needsGround: true }))
      this.scene.combat?.hurt(1, this.surgeX);
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
  die() {
    super.die();
    this.eye.setVisible(false); this.glow.setVisible(false); this.warning.setAlpha(0); this.surge.setAlpha(0);
    this.stormMarks.clear(); this.stormBolts.clear();
  }
}
