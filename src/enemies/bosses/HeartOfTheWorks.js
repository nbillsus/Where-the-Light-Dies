import Phaser from 'phaser';
import { Boss } from './Boss.js';
import { receptor as receptorArt } from '../../puzzles/PropArt.js';
import { sfx } from '../../combat/sfx.js';

// THE HEART OF THE WORKS — Chapter 2 boss.
// A red machine heart in an iron cage, with two hanging iron hands.
// - Its core is behind a SHIELD. The shield only drops while your Shadow is
//   anchored in one of the two floor receptors (Q, move, F). Each
//   receptor then needs time to recharge, so you keep moving between them.
// - The boy is defenceless while you steer the Shadow, so pick your moment.
// - HAND SLAM: a red mark tracks the boy, then an iron hand drops (2).
// - BEAM SWEEP: a red line flickers, then a beam sweeps the floor (1) — dodge
//   through it (Shift) or get onto a ledge.
// - Below half health: faster, two hands at once, the beam sweeps back, and
//   it calls Skitterers.
const T = {
  health: 24,
  shieldDown: 5200, receptorRecharge: 9000,
  slamTelegraph: 900, slamTelegraph2: 680, handDown: 650,
  beamTelegraph: 650, beamTime: 1500,
  restBetween: 1400, restBetween2: 900, flareStall: 1500,
};
const RED = 0xf36a65, GOLD = 0xffc984;

export class HeartOfTheWorks extends Boss {
  constructor(scene, arena) {
    super(scene, arena, {
      health: T.health, title: 'THE HEART OF THE WORKS', subtitle: 'It learned your shape. Now it wants your shadow.',
      deathTitle: 'THE HEART STOPS', deathLine: 'Somewhere below, another one starts.', color: RED,
    });
    const H = this.H, s = scene.artScale;
    this.cx = arena.endX - H * 3.3;
    this.coreY = this.floorY - H * 1.15;
    this.bx = this.cx;
    // Keep both shield receptors on the continuous arena floor so the fight
    // does not need floating platforms or precision jumps.
    const receptorY = this.floorY - H * .95;
    const receptorSpan = this.cx - arena.startX;
    this.receptors = [.28, .68].map(position => {
      const x = arena.startX + receptorSpan * position;
      return { x, y: receptorY, art: receptorArt(scene, x, receptorY, s, RED, GOLD), readyAt: 0 };
    });
    this.cage = scene.add.graphics().setDepth(1.6);
    this.coreGfx = scene.add.graphics().setDepth(1.75);
    this.coreGlow = scene.add.image(this.cx, this.coreY, 'fx-glow').setTint(RED).setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(H * 2.2, H * 2.2).setDepth(1.7);
    this.shield = scene.add.graphics().setDepth(1.9).setPosition(this.cx, this.coreY);
    this.drawCage();
    this.drawShield();
    this.hands = [this.makeHand(this.cx - H * 2.2), this.makeHand(this.cx - H * 4.6)];
    this.beamLine = scene.add.rectangle(0, this.floorY / 2, 4, this.floorY, RED, 0).setDepth(8);
    this.beam = scene.add.rectangle(0, this.floorY / 2, H * .5, this.floorY, 0xffd6cc, 0).setDepth(8);
    this.beamGlow = scene.add.rectangle(0, this.floorY / 2, H * 1.3, this.floorY, RED, 0).setDepth(7).setBlendMode('ADD');
    this.hints = [
      { key: 'Q', at: () => this.nearestReceptor(), active: () => this.engaged && !this.shieldIsDown && !!this.scene.shadow && !this.scene.shadow.detached && !!this.nearestReceptor() },
      { key: 'F', at: () => this.nearestReceptor(), active: () => {
        const sh = this.scene.shadow, r = this.nearestReceptor();
        return this.engaged && !!sh?.controlling && !!r && Math.hypot(sh.actor.x - r.x, sh.actor.y - r.y) < H * 1.1;
      } },
    ];
    this.reset();
  }

  get x() { return this.cx; }
  get y() { return this.coreY; }
  get top() { return this.coreY - this.H; }
  get width() { return this.H * 2; }
  get height() { return this.H * 2; }
  get shieldIsDown() { return this.scene.time.now < this.shieldDownUntil; }
  get exposed() { return this.shieldIsDown; }

  nearestReceptor() {
    const now = this.scene.time.now, from = this.scene.shadow?.detached ? this.scene.shadow.actor : this.scene.player;
    let best = null, bestD = Infinity;
    for (const r of this.receptors) {
      if (now < r.readyAt) continue;
      const d = Math.hypot(r.x - from.x, r.y - from.y);
      if (d < bestD) { bestD = d; best = r; }
    }
    return best;
  }

  makeHand(restX) {
    const H = this.H, g = this.scene.add.graphics().setDepth(8);
    const marker = this.scene.add.image(restX, this.floorY, 'fx-glow').setTint(RED).setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(H * 1.8, H * .45).setAlpha(0).setDepth(4);
    return { restX, x: restX, y: this.floorY - H * 2.6, g, marker, state: 'rest' };
  }

  reset() {
    this.resetCommon();
    this.shieldDownUntil = 0;
    this.stallUntil = 0;
    for (const r of this.receptors ?? []) { r.readyAt = 0; r.art.setActive(false); }
    for (const hand of this.hands ?? []) Object.assign(hand, { x: hand.restX, y: this.floorY - this.H * 2.6, state: 'rest' }), hand.marker.setAlpha(0);
    this.beamState = null;
    this.beam?.setAlpha(0); this.beamGlow?.setAlpha(0); this.beamLine?.setAlpha(0);
    this.art.setVisible(true);
    for (const o of [this.cage, this.coreGfx, this.coreGlow, this.shield]) o?.setVisible(true).setAlpha(1);
  }

  hitTest(box) {
    const r = this.H * .5;
    const nx = Phaser.Math.Clamp(this.cx, box.left, box.right), ny = Phaser.Math.Clamp(this.coreY, box.top, box.bottom);
    return Math.hypot(nx - this.cx, ny - this.coreY) < r * (this.shieldIsDown ? 1 : 1.5) ? 'core' : null;
  }

  // A Flare Pulse makes the machine stall (attacks delayed) but can't break the shield.
  flareHit(time) {
    if (!this.engaged) return;
    this.stallUntil = time + T.flareStall;
    this.nextAttackAt = Math.max(this.nextAttackAt, this.stallUntil);
  }

  update(time, delta) {
    if (!this.alive) return;
    if (this.engaged) this.think(time, delta);
    this.draw(time, delta);
  }

  think(time) {
    const H = this.H, p2 = this.phase2;
    // Receptors: an anchored Shadow drops the shield.
    for (const r of this.receptors) {
      const anchored = !!this.scene.shadow?.isAnchoredNear(r.x, r.y, H * .9);
      if (anchored && time >= r.readyAt) {
        r.readyAt = time + T.receptorRecharge;
        this.shieldDownUntil = time + T.shieldDown;
        r.art.setActive(true);
        this.scene.time.delayedCall(T.shieldDown, () => r.art.setActive(false));
        this.scene.shakeCamera(200, .006);
        sfx.clank(this.scene);
      }
    }
    if (p2 && time > this.nextSummonAt) { this.nextSummonAt = time + 16000; this.summon(2); }
    for (const hand of this.hands) this.updateHand(hand, time);
    this.updateBeam(time);
    if (time < this.nextAttackAt || time < this.stallUntil) return;
    if (this.hands.some(h => h.state !== 'rest') || this.beamState) return;
    const roll = Math.random();
    if (roll < (p2 ? .4 : .35)) this.startBeam(time);
    else {
      this.startSlam(this.hands[0], time, this.scene.player.x);
      if (p2) this.startSlam(this.hands[1], time, this.scene.player.x + (Math.random() < .5 ? -1 : 1) * H * 1.6);
    }
    this.nextAttackAt = time + (p2 ? T.restBetween2 : T.restBetween) + 900;
  }

  startSlam(hand, time, targetX) {
    const H = this.H;
    hand.state = 'aim';
    hand.until = time + (this.phase2 ? T.slamTelegraph2 : T.slamTelegraph);
    hand.targetX = Phaser.Math.Clamp(targetX, this.arena.startX + H, this.cx - H * .8);
    hand.marker.setPosition(hand.targetX, this.floorY).setAlpha(.2);
    sfx.windup(this.scene);
  }

  updateHand(hand, time) {
    const H = this.H;
    if (hand.state === 'aim') {
      // Track the boy for most of the telegraph, then lock in.
      if (hand.until - time > 280) hand.targetX = Phaser.Math.Linear(hand.targetX, Phaser.Math.Clamp(this.scene.player.x, this.arena.startX + H, this.cx - H * .8), .05);
      hand.marker.setPosition(hand.targetX, this.floorY).setAlpha(.25 + .7 * (1 - Math.max(0, hand.until - time) / T.slamTelegraph));
      hand.x = Phaser.Math.Linear(hand.x, hand.targetX, .12);
      if (time >= hand.until) {
        hand.state = 'down'; hand.until = time + T.handDown; hand.y = this.floorY - H * .35;
        hand.marker.setAlpha(0);
        if (this.hitsPlayer(hand.x - H * .8, hand.x + H * .8, { top: this.floorY - H * 1.4 })) this.scene.combat?.hurt(2, hand.x);
        this.scene.shakeCamera(260, .014);
        sfx.hit(this.scene);
      }
    } else if (hand.state === 'down' && time >= hand.until) {
      hand.state = 'rise';
    } else if (hand.state === 'rise') {
      hand.y = Phaser.Math.Linear(hand.y, this.floorY - H * 2.6, .08);
      hand.x = Phaser.Math.Linear(hand.x, hand.restX, .06);
      if (Math.abs(hand.y - (this.floorY - H * 2.6)) < 4) hand.state = 'rest';
    } else if (hand.state === 'rest') {
      hand.y = this.floorY - H * 2.6 + Math.sin(time * .002 + hand.restX) * H * .1;
    }
  }

  startBeam(time) {
    this.beamState = { phase: 'telegraph', until: time + T.beamTelegraph, from: this.cx - this.H, to: this.arena.startX + this.H * .5, back: this.phase2 };
    sfx.windup(this.scene);
  }

  updateBeam(time) {
    const b = this.beamState;
    if (!b) return;
    const H = this.H;
    if (b.phase === 'telegraph') {
      this.beamLine.setPosition(b.from, this.floorY / 2).setAlpha(Math.floor(time / 80) % 2 ? .9 : .3);
      if (time >= b.until) { b.phase = 'sweep'; b.start = time; this.beamLine.setAlpha(0); }
      return;
    }
    const total = T.beamTime * (b.back ? 2 : 1);
    let t = (time - b.start) / T.beamTime;
    const x = t <= 1 ? Phaser.Math.Linear(b.from, b.to, t) : Phaser.Math.Linear(b.to, b.from, t - 1);
    this.beam.setPosition(x, this.floorY / 2).setAlpha(.75 + Math.random() * .25);
    this.beamGlow.setPosition(x, this.floorY / 2).setAlpha(.25 + Math.random() * .1);
    const p = this.scene.player;
    if (Math.abs(p.x - x) < H * .3 && p.body.bottom > this.floorY - H * 1.2) this.scene.combat?.hurt(1, x);
    if (time - b.start >= total) { this.beamState = null; this.beam.setAlpha(0); this.beamGlow.setAlpha(0); }
  }

  drawCage() {
    const H = this.H, g = this.cage.clear(), cx = this.cx, cy = this.coreY;
    g.lineStyle(H * .16, 0x140b0f, 1);
    g.lineBetween(cx - H * .3, 0, cx - H * .3, cy - H * .6).lineBetween(cx + H * .3, 0, cx + H * .3, cy - H * .6);
    for (let i = 0; i < 6; i++) {
      const a = Math.PI * (.15 + i * .14);
      const pts = new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(cx + Math.cos(a) * H * 1.1, cy - Math.sin(a) * H * 1.1),
        new Phaser.Math.Vector2(cx + Math.cos(a) * H * 1.45, cy), new Phaser.Math.Vector2(cx + Math.cos(a) * H * 1.1, cy + Math.sin(a) * H * 1.05)).getPoints(16);
      g.lineStyle(H * .1, 0x1d1015, 1).strokePoints(pts);
      g.lineStyle(2, 0x6a2430, .6).strokePoints(pts);
    }
    g.fillStyle(0x140b0f, 1).fillRect(cx - H * 1.2, cy + H * .95, H * 2.4, this.floorY - cy - H * .95);
  }

  drawShield() {
    const H = this.H, g = this.shield.clear(), r = H * .78;
    const pts = Array.from({ length: 6 }, (_, i) => ({ x: Math.cos(i * Math.PI / 3) * r, y: Math.sin(i * Math.PI / 3) * r }));
    g.lineStyle(6, RED, .9).strokePoints(pts, true);
    g.lineStyle(2, 0xffd6cc, .7).strokePoints(pts.map(p => ({ x: p.x * .88, y: p.y * .88 })), true);
  }

  draw(time, delta) {
    const H = this.H, open = this.shieldIsDown;
    const beat = 1 + Math.max(0, Math.sin(time * (this.phase2 ? .012 : .008))) * .08;
    this.coreGfx.clear().fillStyle(open ? 0xffe2b0 : 0xa71335, 1).fillCircle(this.cx, this.coreY, H * .36 * beat);
    this.coreGfx.lineStyle(4, 0xffd49b, .8).strokeCircle(this.cx, this.coreY, H * .36 * beat);
    this.coreGlow.setTint(open ? GOLD : RED).setAlpha(open ? .9 : .45 + (beat - 1) * 3);
    this.shield.setAngle(this.shield.angle + delta * .02).setAlpha(open ? .08 : .9);
    for (const hand of this.hands) {
      const g = hand.g.clear();
      g.lineStyle(H * .06, 0x2a1d22, 1).lineBetween(hand.x, 0, hand.x, hand.y - H * .3);
      g.fillStyle(0x1c1418, 1).fillRoundedRect(hand.x - H * .42, hand.y - H * .35, H * .84, H * .5, H * .08);
      g.lineStyle(3, 0x5a3c40, .9).strokeRoundedRect(hand.x - H * .42, hand.y - H * .35, H * .84, H * .5, H * .08);
      for (const k of [-.3, -.1, .1, .3]) g.fillStyle(0x1c1418, 1).fillTriangle(hand.x + k * H - H * .07, hand.y + H * .1, hand.x + k * H + H * .07, hand.y + H * .1, hand.x + k * H, hand.y + H * .42);
      g.fillStyle(hand.state === 'aim' ? 0xff4d3d : 0x7a2a2a, 1).fillCircle(hand.x, hand.y - H * .1, H * .08);
    }
  }

  die() {
    for (const o of [this.cage, this.coreGfx, this.coreGlow, this.shield, ...this.hands.map(h => h.g)])
      this.scene.tweens.add({ targets: o, alpha: 0, duration: 900 });
    for (const h of this.hands) h.marker.setAlpha(0);
    this.beamState = null; this.beam.setAlpha(0); this.beamGlow.setAlpha(0); this.beamLine.setAlpha(0);
    super.die();
  }
}
