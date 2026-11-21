import Phaser from 'phaser';
import { Boss } from './Boss.js';
import { sfx } from '../../combat/sfx.js';

// THE OTHER LIGHT — final boss (Chapter 5, The Threshold).
// The boy's shadow, grown tall, carrying a lantern that burns black. It moves
// like him: the same lean, the same cape, the same sword-hand.
// - LUNGE: it crouches and its eyes turn red, then it dashes across the floor
//   (2, jump over it or dodge through it). Afterwards it is WINDED and the
//   black lantern hangs low: strike the lantern.
// - ECLIPSE: it raises the lantern; dark orbs fall on marked spots (1).
// - A Flare Pulse makes it flinch and drop the lantern too.
// - Below half health: lunges come twice in a row, more orbs fall, and it
//   calls Skitterers.
const T = {
  health: 22, walk: 80, crouch: 650, crouch2: 480, dash: 980, dashTime: 430,
  winded: 1600, flareWinded: 1900, flareImmunity: 6000, rest: 1300, rest2: 950,
  orbMark: 900, orbFall: 380, summonCooldown: 11000,
};
const SHADOW = 0x06060c, RIM = 0x9d8fd6, PALE = 0xe9e2ff, VOID = 0x2a1f4a, RED = 0xff4b4b;

export class TheOtherLight extends Boss {
  constructor(scene, arena) {
    super(scene, arena, {
      health: T.health, title: 'THE OTHER LIGHT', subtitle: 'It learned to walk by watching you.',
      deathTitle: 'THE SHADOW LETS GO', deathLine: 'Only one light walks out of the dark.', color: PALE,
    });
    const H = this.H;
    this.BH = H * 2.3;
    this.minX = arena.startX + H * 1.6;
    this.maxX = arena.endX - H * 1.6;
    this.body = scene.add.graphics();
    // A dim violet haze behind it, so its black silhouette stands out.
    this.aura = scene.add.image(0, 0, 'fx-glow').setTint(0x6a55b8).setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(H * 3.2, H * 3.6).setAlpha(.5);
    // Its lantern drinks light: a dark halo with a thin violet heart.
    this.antiGlow = scene.add.image(0, 0, 'fx-glow').setTint(0x000000).setDisplaySize(H * 2.4, H * 2.4).setAlpha(.55);
    this.heart = scene.add.image(0, 0, 'fx-glow').setTint(0xb39cff).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(H * .8, H * .8);
    this.eyeGlow = scene.add.image(0, 0, 'fx-glow').setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(H * .9, H * .45);
    this.art.add([this.aura, this.antiGlow, this.body, this.heart, this.eyeGlow]);
    this.fx = scene.add.graphics().setDepth(8);
    this.trail = [];
    this.reset();
  }

  get x() { return this.bx; }
  get y() { return this.floorY - this.BH * .45; }
  get top() { return this.floorY - this.BH; }
  get width() { return this.H * .9; }
  get height() { return this.BH; }
  get exposed() { return this.state === 'winded' || this.scene.time.now < this.flinchUntil; }
  get lantern() {
    // Held out front at chest height; hangs at the boy's sword height when winded.
    const low = this.lanternDrop;
    return { x: this.bx + this.facing * this.H * (.55 - low * .1), y: this.floorY - this.H * (1.35 - low * .8) };
  }

  reset() {
    this.resetCommon();
    this.bx = this.maxX - this.H;
    this.facing = -1;
    this.state = 'idle';
    this.stateUntil = 0;
    this.flinchUntil = 0;
    this.flareImmuneUntil = 0;
    this.lanternDrop = 0;
    this.lunges = 0;
    this.orbs = [];
    this.contactAt = 0;
    this.fx?.clear();
  }

  engage() { super.engage(); this.nextAttackAt = this.scene.time.now + 1300; }

  hitTest(box) {
    if (!this.alive || !this.engaged) return null;
    const { x, y } = this.lantern, r = this.H * .45;
    const nearX = Phaser.Math.Clamp(x, box.left, box.right), nearY = Phaser.Math.Clamp(y, box.top, box.bottom);
    if (Math.hypot(nearX - x, nearY - y) < r) return 'core';
    return box.right > this.bx - this.width / 2 && box.left < this.bx + this.width / 2 && box.bottom > this.top ? 'body' : null;
  }

  flareHit(time) {
    if (!this.engaged || time < this.flareImmuneUntil) return;
    this.flinchUntil = time + T.flareWinded;
    this.flareImmuneUntil = time + T.flareImmunity;
    if (this.state === 'crouch') this.state = 'idle';
    this.nextAttackAt = Math.max(this.nextAttackAt, time + T.flareWinded);
  }

  update(time, delta) {
    if (!this.alive) return;
    this.lanternDrop += ((this.exposed ? 1 : this.state === 'eclipse' ? -.4 : 0) - this.lanternDrop) * Math.min(1, delta / 140);
    if (this.engaged) this.think(time, delta);
    this.updateOrbs(time);
    this.draw(time);
  }

  think(time, delta) {
    const H = this.H, s = this.scene.artScale, player = this.scene.player, dx = player.x - this.bx, p2 = this.phase2;
    if (p2 && time > this.nextSummonAt) { this.nextSummonAt = time + T.summonCooldown; this.summon(1); }
    // Touching it hurts, much more so mid-lunge.
    const dashing = this.state === 'dash';
    if (time > this.contactAt && Math.abs(dx) < this.width * .55 && player.body.bottom > this.top + H * .3) {
      this.contactAt = time + 900;
      this.scene.combat?.hurt(dashing ? 2 : 1, this.bx);
    }
    if (time < this.flinchUntil) return;
    switch (this.state) {
      case 'idle':
        this.facing = Math.sign(dx) || this.facing;
        if (Math.abs(dx) > H * 2.2) this.bx = Phaser.Math.Clamp(this.bx + this.facing * T.walk * s * 1.4 * (p2 ? 1.3 : 1) * delta / 1000, this.minX, this.maxX);
        if (time < this.nextAttackAt) break;
        if (Math.abs(dx) > H * 1.2 && Math.random() < (p2 ? .65 : .6)) this.startLunge(time);
        else this.startEclipse(time);
        break;
      case 'crouch':
        if (time >= this.stateUntil) {
          this.state = 'dash';
          this.stateUntil = time + T.dashTime;
          sfx.dodge?.(this.scene);
        }
        break;
      case 'dash': {
        this.bx = Phaser.Math.Clamp(this.bx + this.facing * T.dash * s * 1.4 * delta / 1000, this.minX, this.maxX);
        if (Math.random() < .6) this.trail.push({ x: this.bx, born: time, facing: this.facing });
        if (time >= this.stateUntil || this.bx === this.minX || this.bx === this.maxX) {
          // Phase 2: turn and lunge again before stopping.
          if (p2 && this.lunges < 2) { this.startLunge(time, T.crouch2); break; }
          this.state = 'winded';
          this.stateUntil = time + T.winded;
          this.scene.shakeCamera(140, .006);
        }
        break;
      }
      case 'winded':
        if (time >= this.stateUntil) { this.state = 'idle'; this.lunges = 0; this.nextAttackAt = time + (p2 ? T.rest2 : T.rest); }
        break;
      case 'eclipse':
        if (time >= this.stateUntil) { this.state = 'idle'; this.nextAttackAt = time + (p2 ? T.rest2 : T.rest); }
        break;
    }
  }

  startLunge(time, crouch = this.phase2 ? T.crouch2 : T.crouch) {
    this.facing = Math.sign(this.scene.player.x - this.bx) || this.facing;
    this.state = 'crouch';
    this.stateUntil = time + crouch;
    this.lunges++;
  }

  startEclipse(time) {
    this.state = 'eclipse';
    const count = this.phase2 ? 5 : 3, H = this.H, px = this.scene.player.x;
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Clamp(px + (i - (count - 1) / 2) * H * 1.15 + Phaser.Math.FloatBetween(-.2, .2) * H, this.arena.startX + H * .5, this.arena.endX - H);
      this.orbs.push({ x, fallAt: time + T.orbMark + i * 160, hit: false });
    }
    this.stateUntil = time + T.orbMark + count * 160 + T.orbFall + 200;
  }

  updateOrbs(time) {
    const H = this.H;
    for (const orb of this.orbs) {
      if (!orb.hit && time >= orb.fallAt + T.orbFall) {
        orb.hit = true;
        orb.doneAt = time + 260;
        this.scene.atmosphere?.lighting?.pulse(orb.x, this.floorY - H * .3, H * 1.2, 0x8a6cff, 300, .6);
        if (this.hitsPlayer(orb.x - H * .4, orb.x + H * .4, { top: this.floorY - H * 1.6 })) this.scene.combat?.hurt(1, orb.x);
      }
    }
    this.orbs = this.orbs.filter(o => !o.hit || time < o.doneAt);
    this.trail = this.trail.filter(t => time - t.born < 260);
  }

  draw(time) {
    const { H } = this, g = this.body.clear(), f = this.fx.clear();
    const x = this.bx, floor = this.floorY, dir = this.facing;
    const crouch = this.state === 'crouch' ? 1 : 0, winded = this.state === 'winded' ? 1 : 0, dash = this.state === 'dash' ? 1 : 0;
    const breathe = Math.sin(time * .003) * H * .03;
    const height = this.BH * (1 - crouch * .18 - winded * .08) + breathe;
    const lean = (dash * .35 + crouch * .2 - winded * .1) * dir;
    const top = floor - height;
    const shoulders = top + height * .28;
    // Afterimages left by a lunge.
    for (const t of this.trail) {
      const a = 1 - (time - t.born) / 260;
      f.fillStyle(VOID, a * .35).fillEllipse(t.x, floor - this.BH * .45, H * .8, this.BH * .85);
    }
    this.aura.setPosition(x - dir * H * .2, floor - this.BH * .5).setAlpha((this.exposed ? .3 : .5) + (crouch + dash) * .25);
    // Cape: a ragged sheet streaming back from the shoulders.
    const flow = Math.sin(time * .004) * H * .12 + dash * H * .5;
    const cape = [
      { x: x + lean * H, y: shoulders }, { x: x - dir * (H * .9 + flow), y: shoulders + height * .25 },
      { x: x - dir * (H * 1.1 + flow * 1.3), y: floor - H * .25 }, { x: x - dir * H * .7, y: floor - H * .4 },
      { x: x - dir * H * .45, y: floor - H * .05 }, { x: x - dir * H * .1, y: floor - H * .25 },
    ];
    g.fillStyle(SHADOW, 1).fillPoints(cape, true);
    g.lineStyle(2, RIM, .55).strokePoints(cape.slice(0, 4));
    // Body and legs.
    const torso = [
      { x: x - H * .3 + lean * H, y: shoulders }, { x: x + H * .3 + lean * H, y: shoulders },
      { x: x + H * .28, y: floor - H * .45 }, { x: x - H * .28, y: floor - H * .45 },
    ];
    g.fillStyle(SHADOW, 1).fillPoints(torso, true);
    g.lineStyle(2, RIM, .5).lineBetween(torso[1].x, torso[1].y, torso[2].x, torso[2].y);
    const stride = Math.sin(time * .012) * H * .18 * (this.state === 'idle' ? 1 : 0) + dash * H * .3;
    g.lineStyle(H * .2, SHADOW, 1).lineBetween(x - H * .12, floor - H * .5, x - H * .14 - stride, floor);
    g.lineStyle(H * .2, SHADOW, 1).lineBetween(x + H * .12, floor - H * .5, x + H * .14 + stride, floor);
    // Head with wild hair, like the boy's.
    const hx = x + lean * H * 1.3, hy = top + H * .38;
    g.fillStyle(SHADOW, 1).fillCircle(hx, hy, H * .36);
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (1.05 + i * .13) + Math.sin(time * .002 + i) * .05;
      g.fillTriangle(hx + Math.cos(a - .15) * H * .3, hy + Math.sin(a - .15) * H * .3, hx + Math.cos(a + .15) * H * .3,
        hy + Math.sin(a + .15) * H * .3, hx + Math.cos(a) * H * .58, hy + Math.sin(a) * H * .58);
    }
    // Rim light so it reads against the dark.
    g.lineStyle(2.5, RIM, .6).strokeCircle(hx, hy, H * .36);
    // Eyes: white, or red while it gathers itself to lunge.
    const eyeColor = crouch || dash ? RED : PALE;
    g.fillStyle(eyeColor, 1).fillEllipse(hx + dir * H * .1, hy, H * .07, H * .2).fillEllipse(hx + dir * H * .24, hy + H * .01, H * .055, H * .16);
    this.eyeGlow.setPosition(hx + dir * H * .17, hy).setTint(eyeColor).setAlpha(crouch || dash ? .9 : .35);
    // The black lantern on its arm.
    const { x: lx, y: ly } = this.lantern;
    g.lineStyle(H * .14, SHADOW, 1).lineBetween(x + lean * H + dir * H * .2, shoulders + H * .1, lx, ly - H * .2);
    g.fillStyle(0x0c0a14, 1).fillRoundedRect(lx - H * .17, ly - H * .22, H * .34, H * .44, H * .06);
    g.lineStyle(2, this.exposed ? PALE : RIM, this.exposed ? .9 : .5).strokeRoundedRect(lx - H * .17, ly - H * .22, H * .34, H * .44, H * .06);
    const pulse = .5 + .5 * Math.sin(time * .006);
    this.heart.setPosition(lx, ly).setAlpha((this.exposed ? .8 : .35) + pulse * .15);
    this.antiGlow.setPosition(lx, ly).setAlpha(this.state === 'eclipse' ? .85 : .5);
    // Falling orbs: a mark on the floor, then the orb drops.
    for (const orb of this.orbs) {
      const until = orb.fallAt + T.orbFall;
      if (time < orb.fallAt) {
        const blink = (Math.floor(time / 90) % 2) ? .7 : .35;
        f.fillStyle(RED, .3 * blink).fillEllipse(orb.x, floor, H * .9, H * .14);
        f.lineStyle(2, RED, blink).strokeEllipse(orb.x, floor, H * .9, H * .14);
      } else if (time < until) {
        const t = (time - orb.fallAt) / T.orbFall, oy = -H + (floor - H * .3 + H) * t * t;
        f.fillStyle(0x0a0614, 1).fillCircle(orb.x, oy, H * .3);
        f.lineStyle(3, 0x8a6cff, .8).strokeCircle(orb.x, oy, H * .3);
      } else {
        const a = Math.max(0, (orb.doneAt - time) / 260);
        f.fillStyle(0x8a6cff, .5 * a).fillEllipse(orb.x, floor - H * .1, H * 1.3, H * .3);
      }
    }
  }

  die() {
    super.die();
    this.orbs = [];
    this.trail = [];
    this.fx.clear();
  }
}
