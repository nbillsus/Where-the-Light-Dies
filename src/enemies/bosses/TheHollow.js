import Phaser from 'phaser';
import { Boss } from './Boss.js';
import { sfx } from '../../combat/sfx.js';

// THE HOLLOW — Chapter 1 boss (Lantern Vault).
// A huge shadow that drags itself through the drowned hall.
// - Its chest core is caged in ribs. It only opens when the Hollow is
//   slumped: right after a SLAM (its hand is stuck in the floor) or while
//   stunned by a Flare Pulse. Strike the core then.
// - SLAM: raises its hand, a red mark shows where it will land; crushes (2)
//   and sends a shock along the floor (1, jump it).
// - SWEEP: pulls its arm back, then rakes the floor in front (1, jump it).
// - Below half health: faster, rolls dark WAVES along the floor (1, jump or
//   dodge), and calls Skitterers.
const T = {
  health: 26,
  walk: 55, slamTelegraph: 820, slamTelegraph2: 600, stuck: 1500, stuck2: 1150,
  sweepTelegraph: 560, sweepTime: 320, waveSpeed: 400,
  restBetween: 1300, restBetween2: 850, flareStun: 1800, flareImmunity: 7000,
};

export class TheHollow extends Boss {
  constructor(scene, arena) {
    super(scene, arena, {
      health: T.health, title: 'THE HOLLOW', subtitle: 'It wears the dark like a drowned coat.',
      deathTitle: 'THE HOLLOW FALLS', deathLine: 'The lens room is quiet. For now.', color: 0xf0c27a,
    });
    const H = this.H;
    this.BH = H * 2.8;
    this.BW = H * 1.75;
    this.spawnX = arena.endX - H * 3.4;
    this.minX = arena.startX + H * 3.2;
    this.maxX = arena.endX - H * 2.2;
    this.coreGlow = scene.add.image(0, 0, 'fx-glow').setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(H * 1.3, H * 1.3);
    this.body = scene.add.graphics();
    this.arm = scene.add.graphics();
    this.eyes = scene.add.graphics();
    this.eyeGlow = scene.add.image(0, 0, 'fx-glow').setTint(0xdff3ff).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(H * 1.2, H * .6);
    this.art.add([this.body, this.coreGlow, this.eyeGlow, this.eyes, this.arm]);
    this.marker = scene.add.image(0, this.floorY, 'fx-glow').setTint(0xff3b2f).setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(H * 2.2, H * .5).setAlpha(0).setDepth(4);
    this.waves = [];
    this.reset();
  }

  get x() { return this.bx; }
  get y() { return this.coreY; }
  get top() { return this.floorY - this.BH; }
  get width() { return this.BW; }
  get height() { return this.BH; }
  get exposed() { return this.state === 'stuck' || this.scene.time.now < this.stunUntil; }
  get slump() { return this.exposed ? 1 : 0; }
  get coreY() { return this.floorY - this.H * (1.6 - this.slumpBlend * .75); }

  reset() {
    this.resetCommon();
    this.bx = this.spawnX;
    this.facing = -1;
    this.slumpBlend = 0;
    this.stunImmuneUntil = 0;
    this.hand = { x: 0, y: 0 };
    for (const w of this.waves) { w.sprite.destroy(); w.crest.destroy(); }
    this.waves = [];
    this.marker?.setAlpha(0);
    this.contactAt = 0;
  }

  hitTest(box) {
    const coreX = this.bx + this.facing * this.BW * .12, r = this.H * .42;
    const nearX = Phaser.Math.Clamp(coreX, box.left, box.right), nearY = Phaser.Math.Clamp(this.coreY, box.top, box.bottom);
    if (Math.hypot(nearX - coreX, nearY - this.coreY) < r) return 'core';
    const overlapsBody = box.right > this.bx - this.BW * .45 && box.left < this.bx + this.BW * .45 && box.bottom > this.floorY - this.BH;
    return overlapsBody ? 'body' : null;
  }

  flareHit(time) {
    if (!this.engaged || time < this.stunImmuneUntil) return;
    this.stunUntil = time + T.flareStun;
    this.stunImmuneUntil = time + T.flareImmunity;
    this.state = 'idle';
    this.marker.setAlpha(0);
  }

  update(time, delta) {
    if (!this.alive) return;
    this.slumpBlend += ((this.exposed ? 1 : 0) - this.slumpBlend) * Math.min(1, delta / 120);
    if (this.engaged) this.think(time, delta);
    this.updateWaves(delta);
    this.draw(time);
  }

  think(time, delta) {
    const H = this.H, player = this.scene.player, dx = player.x - this.bx, dist = Math.abs(dx);
    // Contact hurts.
    if (time > this.contactAt && Math.abs(dx) < this.BW * .4 && player.body.bottom > this.floorY - this.BH * .8) {
      this.contactAt = time + 900;
      this.scene.combat?.hurt(1, this.bx);
    }
    if (time < this.stunUntil) return;
    const p2 = this.phase2;
    if (p2 && time > this.nextSummonAt) { this.nextSummonAt = time + 14000; this.summon(2); }

    switch (this.state) {
      case 'idle': {
        this.facing = Math.sign(dx) || this.facing;
        if (dist > H * 2.4) this.bx = Phaser.Math.Clamp(this.bx + this.facing * T.walk * delta / 1000 * (p2 ? 1.5 : 1), this.minX, this.maxX);
        if (time < this.nextAttackAt) break;
        if (p2 && dist > H * 4 && Math.random() < .55) this.startWave(time);
        else if (dist < H * 3 && Math.random() < .5) this.startSweep(time);
        else this.startSlam(time);
        break;
      }
      case 'slamTelegraph':
        if (time >= this.stateUntil) this.slam(time);
        break;
      case 'stuck':
        if (time >= this.stateUntil) this.rest(time);
        break;
      case 'sweepTelegraph':
        if (time >= this.stateUntil) { this.state = 'sweep'; this.stateUntil = time + T.sweepTime; this.sweepHit = false; }
        break;
      case 'sweep': {
        const reach = this.bx + this.facing * H * 3.6;
        if (!this.sweepHit && this.hitsPlayer(Math.min(this.bx, reach), Math.max(this.bx, reach), { needsGround: true })) {
          this.sweepHit = true;
          this.scene.combat?.hurt(1, this.bx);
        }
        if (time >= this.stateUntil) this.rest(time);
        break;
      }
      case 'wave':
        if (time >= this.stateUntil) this.rest(time);
        break;
    }
  }

  rest(time) {
    this.state = 'idle';
    this.nextAttackAt = time + (this.phase2 ? T.restBetween2 : T.restBetween);
  }

  startSlam(time) {
    const H = this.H;
    this.state = 'slamTelegraph';
    this.stateUntil = time + (this.phase2 ? T.slamTelegraph2 : T.slamTelegraph);
    this.slamX = Phaser.Math.Clamp(this.scene.player.x, this.bx - H * 6, this.bx + H * 6);
    this.facing = Math.sign(this.slamX - this.bx) || this.facing;
    this.marker.setPosition(this.slamX, this.floorY).setAlpha(.15);
    this.scene.tweens.add({ targets: this.marker, alpha: .9, duration: this.stateUntil - time });
    sfx.windup(this.scene);
  }

  slam(time) {
    const H = this.H;
    this.state = 'stuck';
    this.stateUntil = time + (this.phase2 ? T.stuck2 : T.stuck);
    this.marker.setAlpha(0);
    if (this.hitsPlayer(this.slamX - H * .9, this.slamX + H * .9)) this.scene.combat?.hurt(2, this.slamX);
    else if (this.hitsPlayer(this.slamX - H * 2.4, this.slamX + H * 2.4, { needsGround: true })) this.scene.combat?.hurt(1, this.slamX);
    this.scene.shakeCamera(320, .016);
    const ring = this.scene.add.ellipse(this.slamX, this.floorY, H * .6, H * .2).setStrokeStyle(4, 0xf0c27a, .9).setDepth(9);
    this.scene.tweens.add({ targets: ring, width: H * 4.8, height: H * .5, alpha: 0, duration: 420, onComplete: () => ring.destroy() });
    sfx.hit(this.scene);
  }

  startSweep(time) {
    this.state = 'sweepTelegraph';
    this.stateUntil = time + T.sweepTelegraph;
    this.facing = Math.sign(this.scene.player.x - this.bx) || this.facing;
    sfx.windup(this.scene);
  }

  startWave(time) {
    this.state = 'wave';
    this.stateUntil = time + 700;
    const dir = Math.sign(this.scene.player.x - this.bx) || -1;
    const sprite = this.scene.add.image(this.bx + dir * this.BW * .4, this.floorY - this.H * .25, 'fx-glow').setTint(0x000000)
      .setDisplaySize(this.H * .9, this.H * .7).setDepth(9);
    const crest = this.scene.add.image(0, 0, 'fx-glow').setTint(0x9fb8d8).setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(this.H * .7, this.H * .25).setAlpha(.6).setDepth(10);
    this.waves.push({ sprite, crest, dir, hit: false });
    sfx.flare(this.scene);
  }

  updateWaves(delta) {
    const H = this.H;
    this.waves = this.waves.filter(w => {
      w.sprite.x += w.dir * T.waveSpeed * delta / 1000;
      w.crest.setPosition(w.sprite.x, w.sprite.y - H * .25);
      if (!w.hit && this.hitsPlayer(w.sprite.x - H * .32, w.sprite.x + H * .32, { needsGround: true })) {
        w.hit = true;
        this.scene.combat?.hurt(1, w.sprite.x - w.dir * H);
      }
      const gone = w.sprite.x < this.arena.startX || w.sprite.x > this.arena.endX;
      if (gone) { w.sprite.destroy(); w.crest.destroy(); }
      return !gone;
    });
  }

  draw(time) {
    const H = this.H, BH = this.BH, BW = this.BW, sl = this.slumpBlend, g = this.body;
    const breathe = Math.sin(time * .002) * H * .04;
    this.art.setPosition(this.bx, this.floorY).setScale(this.facing, 1);
    const top = -BH * (1 - sl * .28) + breathe;
    // Body: hunched mass with a ragged, smoking hem.
    const hem = [];
    for (let i = 0; i <= 8; i++) hem.push({ x: BW * (.55 - i * .1375), y: Math.sin(time * .004 + i * 1.7) * H * .06 });
    g.clear().fillStyle(0x030509, 1).fillPoints([
      ...hem, { x: -BW * .55, y: -BH * .3 }, { x: -BW * .42, y: top * .78 }, { x: -BW * .05, y: top * .98 },
      { x: BW * .22, y: top }, { x: BW * .46, y: top * .82 }, { x: BW * .55, y: -BH * .35 },
    ], true);
    g.lineStyle(3, 0x2e3a4c, .7).strokePoints([{ x: -BW * .42, y: top * .78 }, { x: -BW * .05, y: top * .98 }, { x: BW * .22, y: top }, { x: BW * .46, y: top * .82 }]);
    // Back arm hanging.
    g.lineStyle(H * .2, 0x030509, 1).lineBetween(-BW * .38, top * .72, -BW * .62, -H * .2);
    // Core and its rib cage.
    const coreLocalY = this.coreY - this.floorY, coreX = BW * .12;
    const open = this.exposed;
    g.fillStyle(open ? 0xffe2a0 : 0x5a2a1a, 1).fillCircle(coreX, coreLocalY, H * .26);
    if (!open) {
      g.lineStyle(H * .07, 0x0b0e14, 1);
      for (let i = -1; i <= 1; i++) g.lineBetween(coreX - H * .32, coreLocalY + i * H * .12, coreX + H * .32, coreLocalY + i * H * .12 - H * .05);
    }
    this.coreGlow.setPosition(coreX, coreLocalY).setTint(open ? 0xffd27a : 0xb5442a)
      .setAlpha(open ? .85 + Math.sin(time * .02) * .1 : .35);
    // Eyes: a cluster of pale points in the head.
    const ey = top * .9;
    this.eyes.clear().fillStyle(0xeaf6ff, 1);
    for (const [ex, eyOff, r] of [[.05, 0, .07], [.16, .04, .06], [.26, -.02, .05], [.1, .12, .045], [.22, .14, .04]]) {
      this.eyes.fillCircle(BW * ex, ey + H * eyOff, H * r * (this.state.endsWith('Telegraph') ? 1.3 : 1));
    }
    this.eyeGlow.setPosition(BW * .15, ey + H * .05).setAlpha(this.state.endsWith('Telegraph') ? .9 : .4)
      .setTint(this.state.endsWith('Telegraph') ? 0xff6a4a : 0xdff3ff);
    // Front arm, posed by state.
    const shoulder = { x: BW * .36, y: top * .72 };
    let hand;
    if (this.state === 'slamTelegraph') hand = { x: BW * .3, y: -BH * 1.15 };
    else if (this.state === 'stuck') hand = { x: Math.abs(this.slamX - this.bx), y: 0 };
    else if (this.state === 'sweepTelegraph') hand = { x: -BW * .45, y: -BH * .35 };
    else if (this.state === 'sweep') {
      const t = 1 - Math.max(0, (this.stateUntil - this.scene.time.now) / T.sweepTime);
      hand = { x: Phaser.Math.Linear(BW * .3, H * 3.6, t), y: -H * .08 };
    } else hand = { x: BW * .62, y: -H * .2 + breathe };
    const a = this.arm.clear();
    const elbow = { x: (shoulder.x + hand.x) / 2 + BW * .05, y: (shoulder.y + hand.y) / 2 - H * .25 };
    a.lineStyle(H * .22, 0x030509, 1).lineBetween(shoulder.x, shoulder.y, elbow.x, elbow.y).lineBetween(elbow.x, elbow.y, hand.x, hand.y);
    a.fillStyle(0x030509, 1).fillCircle(hand.x, hand.y, H * .2);
    for (const k of [-1, 0, 1]) a.fillTriangle(hand.x + H * .1, hand.y + k * H * .12 - H * .05, hand.x + H * .1, hand.y + k * H * .12 + H * .05, hand.x + H * .48, hand.y + k * H * .16);
  }
}
