import Phaser from 'phaser';
import { Boss } from './Boss.js';
import { receptor } from '../../puzzles/PropArt.js';
import { sfx } from '../../combat/sfx.js';
import { fixedLayerOffset } from '../../rendering.js';

const COLORS = [0x8bd6dd, 0xf0c681, 0xe77985];
const PULSE_TRAVEL_MS = 3200;

// Chapter 4's transmitter fights on a continuous floor. The radio and an
// anchored Shadow must agree with its changing broadcast to break the shield.
export class TheDeadFrequency extends Boss {
  constructor(scene, arena) {
    super(scene, arena, {
      health: 26, title: 'THE DEAD FREQUENCY',
      subtitle: 'It learned to answer on every channel.',
      deathTitle: 'THE SIGNAL FALLS SILENT',
      deathLine: 'The warning has somewhere else to go.', color: 0x9ddde0,
    });
    const H = this.H, s = scene.artScale;
    this.left = arena.startX + H * 2.1;
    this.right = arena.endX - H * 1.9;
    this.receptors = [this.left + H * .55, this.right - H * .55].map(x => {
      const y = this.floorY - H * .48;
      return { x, y, art: receptor(scene, x, y, s, 0x9ddde0, 0xffe5ad) };
    });
    this.bodyArt = scene.add.graphics().setDepth(1.8);
    this.aura = scene.add.image(0, 0, 'fx-glow').setTint(0x8bd6dd).setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(H * 2.3, H * 2.3).setAlpha(.3).setDepth(1.7);
    this.marks = scene.add.graphics().setDepth(8);
    this.bolts = scene.add.graphics().setDepth(9);
    this.wave = scene.add.rectangle(0, this.floorY - H * .18, H * .7, H * .36, 0x9ddde0, 0).setDepth(9);
    const offset = fixedLayerOffset(scene.viewportWidth, scene.viewportHeight);
    this.channelText = scene.add.text(offset.x + scene.viewportWidth - 95, offset.y + 115, '', {
      fontFamily: 'Georgia, serif', fontSize: '16px', color: '#e8f7ee',
      backgroundColor: '#0b1520cc', padding: { x: 8, y: 4 },
    }).setOrigin(1, .5).setScrollFactor(0).setDepth(48);
    this.hints = [
      { key: 'Q', at: () => this.receptors[this.receiverIndex], active: () => this.engaged && !scene.shadow?.detached && !this.exposed },
      { key: 'F', at: () => this.receptors[this.receiverIndex], active: () => this.engaged && !!scene.shadow?.controlling
        && Math.hypot(scene.shadow.actor.x - this.receptors[this.receiverIndex].x,
          scene.shadow.actor.y - this.receptors[this.receiverIndex].y) < H },
    ];
    this.reset();
  }

  get x() { return this.bx; }
  get y() { return this.by; }
  get top() { return this.by - this.H * .55; }
  get width() { return this.H * 1.1; }
  get height() { return this.H * 1.15; }
  get exposed() { return this.scene.time.now < this.exposedUntil; }

  reset() {
    this.resetCommon();
    this.bx = this.right;
    this.by = this.floorY - this.H;
    this.signal = 0;
    this.receiverIndex = 0;
    this.exposedUntil = 0;
    this.exposureReadyAt = 0;
    this.nextSignalAt = 0;
    this.receiverLatched = false;
    this.attack = null;
    this.attackCount = 0;
    this.marks.clear(); this.bolts.clear(); this.wave.setAlpha(0);
    this.channelLabel = null;
    this.channelText.setText('').setVisible(false);
    for (const item of this.receptors) item.art.setActive(false);
    this.bodyArt.setVisible(true); this.aura.setVisible(true);
  }

  engage() {
    super.engage();
    this.nextAttackAt = this.scene.time.now + 1700;
    this.nextSignalAt = this.scene.time.now + 7200;
    this.channelText.setVisible(true);
    this.scene.announce('MATCH THE RADIO CHANNEL. ANCHOR THE SHADOW AT THE LIT RECEIVER.', this.color);
  }

  hitTest(box) {
    if (!this.alive || !this.engaged) return null;
    return this.x + this.width / 2 > box.left && this.x - this.width / 2 < box.right
      && this.y + this.height / 2 > box.top && this.y - this.height / 2 < box.bottom ? 'core' : null;
  }

  flareHit(time) {
    if (!this.engaged) return;
    this.nextAttackAt = Math.max(this.nextAttackAt, time + 700);
    this.exposedUntil = Math.max(this.exposedUntil, time + 1100);
  }

  changeSignal(time) {
    this.signal = (this.signal + 1) % 3;
    this.receiverIndex = 1 - this.receiverIndex;
    this.receiverLatched = false;
    this.nextSignalAt = time + (this.phase2 ? 5600 : 7200);
    this.scene.announce(`BROADCAST ${this.signal + 1} — FIND THE LIT RECEIVER`, COLORS[this.signal]);
    sfx.radio(this.scene, this.signal);
  }

  update(time) {
    if (!this.alive) return;
    const span = this.right - this.left;
    this.bx = this.left + span * (.5 + .43 * Math.sin(time * (this.phase2 ? .00115 : .00085)));
    this.by = this.floorY - this.H * (1.02 + .22 * Math.sin(time * .0031));
    this.draw(time);
    if (!this.engaged) return;

    if (!this.exposed && time >= this.nextSignalAt) this.changeSignal(time);
    const receiver = this.receptors[this.receiverIndex];
    const anchored = this.scene.shadow?.isAnchoredNear(receiver.x, receiver.y, this.H * .78);
    for (const [index, item] of this.receptors.entries())
      item.art.setActive(index === this.receiverIndex && time >= this.exposureReadyAt);
    if (!anchored) this.receiverLatched = false;
    if (anchored && !this.receiverLatched && time >= this.exposureReadyAt
      && this.scene.mechanics.radioFrequency === this.signal) {
      this.receiverLatched = true;
      this.exposedUntil = time + (this.phase2 ? 2500 : 3200);
      this.exposureReadyAt = time + 6200;
      this.nextSignalAt = this.exposedUntil + 500;
      this.scene.cinematics.pulse('SIGNAL BROKEN', 'The core is open. Strike now.', COLORS[this.signal], 900);
      this.scene.flashAt(this.x, this.y, COLORS[this.signal]);
    }

    this.updateAttack(time);
    if (this.phase2 && time >= this.nextSummonAt) {
      this.summon(1);
      this.nextSummonAt = time + 11000;
    }
  }

  startAttack(time) {
    const pulse = this.attackCount++ % 2 === 1;
    const [left, right] = [this.arena.startX + this.H, this.arena.endX - this.H];
    const target = Phaser.Math.Clamp(this.scene.player.x, left, right);
    this.attack = { kind: pulse ? 'pulse' : 'lightning', target, warnUntil: time + (this.phase2 ? 760 : 970),
      activeUntil: 0, startedAt: 0, dir: Math.sign(this.scene.player.x - this.x) || -1,
      targets: [target, Phaser.Math.Clamp(target + (target < this.x ? this.H * 2.4 : -this.H * 2.4), left, right)] };
    this.nextAttackAt = time + (this.phase2 ? 2600 : 3400);
    sfx.windup(this.scene);
  }

  updateAttack(time) {
    if (!this.attack && time >= this.nextAttackAt) this.startAttack(time);
    const a = this.attack;
    if (!a) return;
    if (!a.activeUntil) {
      if (time < a.warnUntil) {
        const g = this.marks.clear();
        if (a.kind === 'lightning') {
          for (const x of a.targets) {
            g.fillStyle(0x9ddde0, .17).fillEllipse(x, this.floorY - 5, this.H * 1.25, this.H * .25);
            g.lineStyle(3, 0xdffaf3, .7 + Math.sin(time * .026) * .2)
              .strokeEllipse(x, this.floorY - 5, this.H * 1.25, this.H * .25);
          }
        } else g.lineStyle(7, COLORS[this.signal], .55 + Math.sin(time * .024) * .2)
          .lineBetween(this.arena.startX, this.floorY - this.H * .12, this.arena.endX, this.floorY - this.H * .12);
        return;
      }
      this.marks.clear();
      a.startedAt = time;
      a.activeUntil = time + (a.kind === 'pulse' ? PULSE_TRAVEL_MS : 600);
      if (a.kind === 'lightning') {
        const g = this.bolts.clear();
        for (const x of a.targets) {
          g.lineStyle(12, COLORS[this.signal], .62).beginPath().moveTo(x - this.H * .16, 0)
            .lineTo(x + this.H * .1, this.floorY * .42).lineTo(x - this.H * .08, this.floorY * .72)
            .lineTo(x, this.floorY).strokePath();
          g.lineStyle(3, 0xf5ffef, 1).beginPath().moveTo(x - this.H * .16, 0)
            .lineTo(x + this.H * .1, this.floorY * .42).lineTo(x - this.H * .08, this.floorY * .72)
            .lineTo(x, this.floorY).strokePath();
        }
        sfx.thunder(this.scene);
      } else sfx.flare(this.scene);
      this.scene.shakeCamera(250, .01);
    }
    if (a.kind === 'lightning') {
      if (a.targets.some(x => Math.abs(this.scene.player.x - x) < this.H * .65))
        this.scene.combat?.hurt(this.phase2 ? 2 : 1, a.target);
    } else {
      const travel = (time - a.startedAt) / PULSE_TRAVEL_MS;
      const from = a.dir > 0 ? this.arena.startX : this.arena.endX;
      const to = a.dir > 0 ? this.arena.endX : this.arena.startX;
      const x = Phaser.Math.Linear(from, to, travel);
      this.wave.setPosition(x, this.floorY - this.H * .18).setFillStyle(COLORS[this.signal], .8).setAlpha(.8);
      if (Math.abs(this.scene.player.x - x) < this.H * .48 && this.scene.player.body.bottom > this.floorY - this.H * .48)
        this.scene.combat?.hurt(this.phase2 ? 2 : 1, x);
    }
    if (time >= a.activeUntil) {
      this.attack = null;
      this.wave.setAlpha(0);
      this.bolts.clear();
    }
  }

  draw(time) {
    const H = this.H, g = this.bodyArt.clear().setPosition(this.x, this.y);
    const color = COLORS[this.signal];
    g.fillStyle(0x08121b, 1).fillCircle(0, 0, H * .55);
    g.lineStyle(12, 0x172931, 1).strokeCircle(0, 0, H * .65);
    g.lineStyle(4, color, .9).strokeCircle(0, 0, H * (.69 + Math.sin(time * .004) * .035));
    for (let i = 0; i < 10; i++) {
      const a = i * Math.PI / 5 + time * .00065;
      g.lineStyle(5, 0x1b343c, 1).lineBetween(Math.cos(a) * H * .66, Math.sin(a) * H * .66,
        Math.cos(a) * H * .95, Math.sin(a) * H * .95);
    }
    g.fillStyle(this.exposed ? 0xffe9ba : color, 1).fillEllipse(0, 0, H * .3, H * .18);
    this.aura.setPosition(this.x, this.y).setTint(color).setAlpha(this.exposed ? .56 : .22);
    const label = `BROADCAST ${this.signal + 1}  ·  ${this.receiverIndex ? 'RIGHT' : 'LEFT'} RECEIVER`;
    if (label !== this.channelLabel) { this.channelText.setText(label); this.channelLabel = label; }
    this.channelText.setColor(this.exposed ? '#ffe9ba' : `#${color.toString(16).padStart(6, '0')}`);
  }

  die() {
    this.attack = null;
    this.marks.clear(); this.bolts.clear(); this.wave.setAlpha(0);
    this.channelText.setVisible(false); this.bodyArt.setVisible(false); this.aura.setVisible(false);
    super.die();
  }
}
