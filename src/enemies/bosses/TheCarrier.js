import Phaser from 'phaser';
import { Boss } from './Boss.js';
import { sfx } from '../../combat/sfx.js';

// THE CARRIER — Chapter 4 boss (The Deep Transmitter).
// A transmitter that grew a body. It hangs from the ceiling on a ribbed mast
// and drifts after the boy; its glowing core sits far out of reach.
// - SIGNAL WAVE: the dish brightens, then rings roll along the floor away
//   from it (1, jump them).
// - STATIC BEAM: a flickering line marks the boy's spot, then a beam slams
//   down there (2, step aside). Afterwards the Carrier overheats and VENTS:
//   the core sinks to sword height for a moment. Strike it then.
// - A Flare Pulse also drags the core down.
// - Below half health: beams come in pairs, waves roll both ways, and it
//   calls Skitterers.
const T = {
  health: 18, drift: 70,
  waveTelegraph: 700, waveSpeed: 430, beamTelegraph: 950, beamTelegraph2: 720, beamTime: 340,
  vent: 2300, flareVent: 1900, flareImmunity: 5200, rest: 1700, rest2: 1300, summonCooldown: 10000,
};
const CYAN = 0x9ce7e0, WHITE = 0xe8fffb, DARK = 0x04090c, METAL = 0x16262b, RED = 0xff5a4a;

export class TheCarrier extends Boss {
  constructor(scene, arena) {
    super(scene, arena, {
      health: T.health, title: 'THE CARRIER', subtitle: 'It has been repeating your voice for a hundred years.',
      deathTitle: 'THE SIGNAL GOES QUIET', deathLine: 'Somewhere far above, a lighthouse answers.', color: CYAN,
    });
    const H = this.H;
    this.minX = arena.startX + H * 2.4;
    this.maxX = arena.endX - H * 2;
    this.highY = this.floorY - H * 2.7;
    this.lowY = this.floorY - H * .75;
    this.mast = scene.add.graphics();
    this.core = scene.add.graphics();
    this.coreGlow = scene.add.image(0, 0, 'fx-glow').setTint(CYAN).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(H * 1.6, H * 1.6);
    this.art.add([this.mast, this.coreGlow, this.core]);
    // Telegraphs and attacks sit in front of the boy so they are never hidden.
    this.fx = scene.add.graphics().setDepth(8);
    this.beamGlow = scene.add.image(0, 0, 'fx-glow').setTint(CYAN).setBlendMode(Phaser.BlendModes.ADD).setDepth(7).setAlpha(0);
    this.waves = [];
    this.reset();
  }

  get x() { return this.bx; }
  // Reported at mid height so a Flare Pulse from the floor can reach it.
  get y() { return this.exposed ? this.coreY : this.floorY - this.H * 1.3; }
  get top() { return this.coreY - this.H * .5; }
  get width() { return this.H * 1.2; }
  get height() { return this.H * 1.2; }
  get exposed() { return this.scene.time.now < this.ventUntil; }

  reset() {
    this.resetCommon();
    this.bx = this.maxX;
    this.coreY = this.highY;
    this.ventUntil = 0;
    this.flareImmuneUntil = 0;
    this.beams = [];
    this.waveAt = 0;
    for (const w of this.waves) w.glow.destroy();
    this.waves = [];
    this.fx?.clear();
    this.beamGlow?.setAlpha(0);
  }

  engage() { super.engage(); this.nextAttackAt = this.scene.time.now + 1500; }

  hitTest(box) {
    if (!this.alive || !this.engaged) return null;
    const r = this.H * .55;
    const nearX = Phaser.Math.Clamp(this.bx, box.left, box.right), nearY = Phaser.Math.Clamp(this.coreY, box.top, box.bottom);
    if (Math.hypot(nearX - this.bx, nearY - this.coreY) < r) return 'core';
    // The mast above the core only throws sparks.
    return box.right > this.bx - this.H * .25 && box.left < this.bx + this.H * .25 && box.top < this.coreY ? 'body' : null;
  }

  flareHit(time) {
    if (!this.engaged || time < this.flareImmuneUntil) return;
    this.ventUntil = time + T.flareVent;
    this.flareImmuneUntil = time + T.flareImmunity;
    this.nextAttackAt = Math.max(this.nextAttackAt, time + T.flareVent);
  }

  update(time, delta) {
    if (!this.alive) return;
    const player = this.scene.player;
    // Drift after the boy, slower while venting.
    const target = Phaser.Math.Clamp(player.x, this.minX, this.maxX);
    const speed = T.drift * (this.exposed ? .3 : this.phase2 ? 1.4 : 1) * this.scene.artScale * 1.4;
    if (this.engaged) this.bx += Phaser.Math.Clamp(target - this.bx, -speed * delta / 1000, speed * delta / 1000);
    this.coreY += ((this.exposed ? this.lowY : this.highY) - this.coreY) * Math.min(1, delta / (this.exposed ? 140 : 380));
    if (this.engaged) this.think(time);
    this.updateWaves(time, delta);
    this.draw(time);
  }

  think(time) {
    const p2 = this.phase2;
    if (p2 && time > this.nextSummonAt) { this.nextSummonAt = time + T.summonCooldown; this.summon(1); }
    // Beams: telegraph → strike → vent.
    for (const beam of this.beams) {
      if (!beam.fired && time >= beam.at) {
        beam.fired = true;
        beam.until = time + T.beamTime;
        this.scene.atmosphere?.lighting?.pulse(beam.x, this.floorY - this.H, this.H * 2.2, CYAN, 420, 1);
        this.scene.shakeCamera(160, .008);
        sfx.clank?.(this.scene);
        if (this.hitsPlayer(beam.x - this.H * .45, beam.x + this.H * .45)) this.scene.combat?.hurt(2, beam.x);
        if (beam.last) this.ventUntil = time + T.vent;
      }
    }
    this.beams = this.beams.filter(b => !b.fired || time < b.until);
    if (this.waveAt && time >= this.waveAt) {
      this.waveAt = 0;
      this.launchWave(-1);
      if (p2) this.launchWave(1);
    }
    if (time < this.nextAttackAt || this.exposed || this.beams.length || this.waveAt) return;
    if (Math.random() < .45) {
      this.waveAt = time + T.waveTelegraph;
      this.nextAttackAt = time + T.waveTelegraph + (p2 ? T.rest2 : T.rest) + 600;
    } else {
      const lead = p2 ? T.beamTelegraph2 : T.beamTelegraph;
      const px = this.scene.player.x;
      this.beams.push({ x: px, at: time + lead, last: !p2 });
      // Phase 2: a second beam where the boy will have stepped to.
      if (p2) this.beams.push({ x: px + (Math.random() < .5 ? -1 : 1) * this.H * 1.3, at: time + lead + 520, last: true });
      this.nextAttackAt = time + lead + 900 + T.vent + (p2 ? T.rest2 : T.rest);
    }
  }

  launchWave(dir) {
    const glow = this.scene.add.image(this.bx, this.floorY - this.H * .2, 'fx-glow').setTint(CYAN)
      .setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(this.H * .9, this.H * .7).setAlpha(.8).setDepth(7);
    this.waves.push({ x: this.bx, dir, glow, hit: false });
  }

  updateWaves(time, delta) {
    const s = this.scene.artScale, H = this.H;
    for (const w of this.waves) {
      w.x += w.dir * T.waveSpeed * s * 1.4 * delta / 1000;
      w.glow.setPosition(w.x, this.floorY - H * .18);
      if (!w.hit && this.hitsPlayer(w.x - H * .3, w.x + H * .3, { needsGround: true })) {
        w.hit = true;
        this.scene.combat?.hurt(1, w.x - w.dir * H);
      }
    }
    this.waves = this.waves.filter(w => {
      const gone = w.x < this.arena.startX || w.x > this.arena.endX;
      if (gone) w.glow.destroy();
      return !gone;
    });
  }

  draw(time) {
    const { H } = this, g = this.mast, x = this.bx, cy = this.coreY;
    const sway = Math.sin(time * .0013) * H * .08;
    g.clear();
    // Cables from the ceiling, swaying.
    for (const [ox, w] of [[-.42, 3], [.38, 4], [-.15, 2]]) {
      const points = new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(x + ox * H * 2, -10), new Phaser.Math.Vector2(x + ox * H + sway, cy * .5),
        new Phaser.Math.Vector2(x + ox * H * .3, cy - H * .3)).getPoints(14);
      g.lineStyle(w, DARK, 1).strokePoints(points);
    }
    // The mast: ribbed segments down to the dish.
    g.fillStyle(METAL, 1).fillRect(x - H * .12, -10, H * .24, cy - H * .35);
    for (let y = 20; y < cy - H * .4; y += H * .28) {
      g.fillStyle(DARK, 1).fillRect(x - H * .2, y, H * .4, H * .08);
      g.lineStyle(1.5, CYAN, .3).lineBetween(x - H * .2, y, x + H * .2, y);
    }
    // The dish: a wide bowl cradling the core.
    const flare = this.waveAt ? .5 + .5 * Math.sin(time * .04) : 0;
    g.fillStyle(DARK, 1).fillEllipse(x, cy - H * .18, H * 1.5, H * .42);
    g.lineStyle(3, CYAN, .45 + flare * .5).strokeEllipse(x, cy - H * .18, H * 1.5, H * .42);
    for (const side of [-1, 1]) g.lineStyle(4, METAL, 1).lineBetween(x + side * H * .7, cy - H * .2, x + side * H * .45, cy + H * .35);
    // The core: dim and shuttered when high, open and bright when venting.
    const open = Phaser.Math.Clamp((this.highY - cy) / (this.highY - this.lowY), 0, 1);
    const c = this.core.clear();
    c.fillStyle(DARK, 1).fillCircle(x, cy, H * .42);
    c.fillStyle(this.exposed ? WHITE : CYAN, .35 + open * .65).fillCircle(x, cy, H * (.16 + open * .14));
    c.lineStyle(4, CYAN, .5 + open * .5).strokeCircle(x, cy, H * .42);
    // Shutters slide apart as it vents.
    for (const side of [-1, 1]) c.fillStyle(METAL, 1).fillRect(x + side * H * (.08 + open * .3) - H * .1, cy - H * .38, H * .2, H * .76);
    this.coreGlow.setPosition(x, cy).setAlpha(.25 + open * .5 + flare * .3);

    // Telegraphs and beams.
    const f = this.fx.clear();
    let beamAlpha = 0, beamX = 0;
    for (const beam of this.beams) {
      if (!beam.fired) {
        const flicker = (Math.floor(time / 70) % 2) ? .9 : .4;
        f.lineStyle(2, RED, flicker).lineBetween(beam.x, 0, beam.x, this.floorY);
        f.fillStyle(RED, .25 * flicker).fillEllipse(beam.x, this.floorY, H * 1, H * .14);
      } else {
        const fade = Math.max(0, (beam.until - time) / T.beamTime);
        f.fillStyle(CYAN, .35 * fade).fillRect(beam.x - H * .45, 0, H * .9, this.floorY);
        f.fillStyle(WHITE, .85 * fade).fillRect(beam.x - H * .14, 0, H * .28, this.floorY);
        beamAlpha = Math.max(beamAlpha, fade); beamX = beam.x;
      }
    }
    this.beamGlow.setPosition(beamX, this.floorY - H).setDisplaySize(H * 1.8, H * 3).setAlpha(beamAlpha * .7);
    for (const w of this.waves) {
      f.lineStyle(3, CYAN, .9).strokeEllipse(w.x, this.floorY - H * .12, H * .5, H * .3);
      f.lineStyle(2, WHITE, .6).strokeEllipse(w.x - w.dir * H * .12, this.floorY - H * .1, H * .32, H * .2);
    }
  }

  die() {
    super.die();
    for (const w of this.waves) w.glow.destroy();
    this.waves = [];
    this.beams = [];
    this.fx.clear();
    this.beamGlow.setAlpha(0);
  }
}
