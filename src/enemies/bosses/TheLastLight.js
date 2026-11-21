import Phaser from 'phaser';
import { Boss } from './Boss.js';
import { receptor } from '../../puzzles/PropArt.js';
import { TUNING } from '../../combat/Combat.js';

const FORMS = [
  { name: 'THE DROWNED CROWN', health: 16, color: 0x88dce3,
    line: 'The sea rises to remember its first keeper.' },
  { name: 'THE IRON CHOIR', health: 20, color: 0xe79b8d,
    line: 'Three voices answer from the second chamber.' },
  { name: 'THE LAST ECLIPSE', health: 24, color: 0xf2cc8e,
    line: 'The signal and the shadow become one.' },
];

// One encounter across three continuous chambers. Only the form changes;
// death always resets the whole encounter to the entrance of chamber one.
export class TheLastLight extends Boss {
  constructor(scene, arena) {
    super(scene, arena, { health: FORMS[0].health, title: FORMS[0].name,
      subtitle: FORMS[0].line, deathTitle: 'THE LIGHT GOES OUT',
      deathLine: 'The sea is finally still.', color: FORMS[0].color });
    const s = scene.artScale;
    this.chambers = [[4300, 5800], [5800, 7300], [7300, 9000]].map(pair => pair.map(x => x * s));
    this.dividers = [5800, 7300].map(x => {
      const wall = scene.add.rectangle(x * s, scene.viewportHeight / 2, 36 * s, scene.viewportHeight * 2, 0, 0);
      scene.physics.add.existing(wall, true);
      scene.physics.add.collider(scene.player, wall);
      return wall;
    });
    this.formArt = scene.add.graphics();
    this.art.add(this.formArt);
    this.warning = scene.add.rectangle(0, this.floorY - 9 * s, this.H, 18 * s, 0xe9bc8e, 0).setDepth(8);
    this.strike = scene.add.rectangle(0, this.floorY - this.H * .36, this.H, this.H * .72, 0xffffff, 0).setDepth(8);
    this.receptors = [1, 2].map(phase => {
      const [left, right] = this.chambers[phase], x = left + (right - left) * .32;
      const y = this.floorY - this.H * .47;
      return { phase, x, y, art: receptor(scene, x, y, s, FORMS[phase].color, 0xffdfa2) };
    });
    this.hints = [
      { key: 'Q', at: () => this.receptors[this.phase - 1], active: () => this.engaged && this.phase > 0 && !scene.shadow?.detached && !this.exposed },
      { key: 'F', at: () => this.receptors[this.phase - 1], active: () => this.engaged && this.phase > 0 && !!scene.shadow?.controlling
        && Math.hypot(scene.shadow.actor.x - this.receptors[this.phase - 1].x,
          scene.shadow.actor.y - this.receptors[this.phase - 1].y) < this.H },
    ];
    this.reset();
  }

  get x() { return this.bx; }
  get y() { return this.floorY - this.H * .8; }
  get top() { return this.y - this.H * .6; }
  get width() { return this.H * 1.25; }
  get height() { return this.H * 1.15; }
  get exposed() { return this.scene.time.now < this.exposedUntil; }

  reset() {
    this.resetCommon();
    this.phase = 0;
    this.waitingForNext = false;
    this.exposedUntil = 0;
    this.telegraphUntil = 0;
    this.attackTarget = 0;
    this.warning.setAlpha(0);
    this.strike.setAlpha(0);
    this.maxHealth = FORMS[0].health;
    this.health = this.maxHealth;
    this.color = FORMS[0].color;
    this.title = FORMS[0].name;
    this.subtitle = FORMS[0].line;
    this.bx = this.chambers[0][1] - this.H * 2.5;
    for (const wall of this.dividers) wall.body.enable = true;
    for (const item of this.receptors) item.art.setActive(false);
    this.draw(0);
  }

  hitTest(box) {
    if (!this.alive || !this.engaged || this.waitingForNext) return null;
    return this.x + this.width / 2 > box.left && this.x - this.width / 2 < box.right
      && this.y + this.height / 2 > box.top && this.y - this.height / 2 < box.bottom ? 'core' : null;
  }

  flareHit(time) { if (this.engaged && !this.waitingForNext) this.exposedUntil = Math.max(this.exposedUntil, time + 2000); }

  update(time) {
    if (!this.alive) return;
    if (this.waitingForNext) {
      const boundary = this.chambers[this.phase][1];
      if (this.scene.player.x > boundary + this.H * .6) this.beginNextForm(time);
      return;
    }
    const [left, right] = this.chambers[this.phase];
    this.bx = Phaser.Math.Clamp(this.scene.player.x + this.H * (this.phase === 2 ? 1.65 : 2.1),
      left + this.H * 2.2, right - this.H * 1.3);
    this.draw(time);
    if (!this.engaged) return;
    const shadow = this.scene.shadow;
    const receptor = this.receptors[this.phase - 1];
    if (receptor && shadow?.isAnchoredNear(receptor.x, receptor.y, this.H * .62)) {
      receptor.art.setActive(true);
      this.exposedUntil = Math.max(this.exposedUntil, time + 450);
    } else receptor?.art.setActive(false);
    if (this.telegraphUntil && time >= this.telegraphUntil) this.resolveAttack(time);
    if (time >= this.nextAttackAt && !this.telegraphUntil) this.startAttack(time);
    if (this.phase === 2 && time >= this.nextSummonAt) {
      this.summon(1);
      this.nextSummonAt = time + 9300;
    }
  }

  startAttack(time) {
    this.attackTarget = Phaser.Math.Clamp(this.scene.player.x, this.chambers[this.phase][0] + this.H,
      this.chambers[this.phase][1] - this.H);
    this.telegraphUntil = time + [920, 1100, 780][this.phase];
    this.nextAttackAt = time + [4200, 3700, 3200][this.phase];
    this.warning.setPosition(this.attackTarget, this.floorY - 9 * this.scene.artScale)
      .setSize(this.H * [1.7, 2.2, 1.35][this.phase], 18 * this.scene.artScale)
      .setFillStyle(FORMS[this.phase].color, .85).setAlpha(.8);
  }

  resolveAttack(time) {
    this.telegraphUntil = 0;
    this.warning.setAlpha(0);
    const width = this.H * [1.7, 2.2, 1.35][this.phase];
    this.strike.setPosition(this.attackTarget, this.floorY - this.H * .36)
      .setSize(width, this.H * .72).setFillStyle(FORMS[this.phase].color, .65).setAlpha(.75);
    this.scene.tweens.add({ targets: this.strike, alpha: 0, duration: 500 });
    if (this.hitsPlayer(this.attackTarget - width / 2, this.attackTarget + width / 2,
      { needsGround: this.phase !== 1 })) this.scene.combat?.hurt(this.phase === 2 ? 2 : 1, this.attackTarget);
    this.exposedUntil = Math.max(this.exposedUntil, time + [4100, 3300, 2600][this.phase]);
    this.scene.shakeCamera(240, .008);
  }

  draw(time) {
    const H = this.H, g = this.formArt.clear().setPosition(this.x, this.y);
    const pulse = Math.sin(time * .003) * .06;
    if (this.phase === 0) {
      g.fillStyle(0x071b27, 1).fillCircle(0, 0, H * .48);
      g.lineStyle(8, 0x8fdce4, .9).strokeCircle(0, 0, H * (.48 + pulse));
      for (let i = -2; i <= 2; i++) g.fillStyle(0x102f38, 1).fillTriangle(i * H * .17 - H * .1, -H * .25,
        i * H * .17, -H * (.8 + (i % 2) * .12), i * H * .17 + H * .1, -H * .25);
      g.fillStyle(this.exposed ? 0xffeac1 : 0x8acbd1, 1).fillEllipse(0, 0, H * .34, H * .19);
    } else if (this.phase === 1) {
      g.lineStyle(11, 0x6a3235, .9).strokeCircle(0, -H * .05, H * .6);
      for (let i = -1; i <= 1; i++) {
        const x = i * H * .36, y = Math.sin(time * .002 + i) * H * .08;
        g.fillStyle(0x27131a, 1).fillEllipse(x, y, H * .36, H * .54);
        g.lineStyle(4, 0xe5a193, 1).strokeEllipse(x, y, H * .36, H * .54);
        g.fillStyle(this.exposed ? 0xffe0ae : 0x9d4a49, 1).fillEllipse(x, y - H * .06, H * .12, H * .08);
      }
    } else {
      g.fillStyle(0x070b15, 1).fillCircle(0, 0, H * .58);
      g.lineStyle(13, 0xefc985, .9).strokeCircle(0, 0, H * (.67 + pulse));
      g.lineStyle(4, 0xf7e0ab, .8).strokeCircle(0, 0, H * .41);
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6 + time * .00045;
        g.lineStyle(4, 0xe7af78, .75).lineBetween(Math.cos(a) * H * .46, Math.sin(a) * H * .46,
          Math.cos(a) * H * .79, Math.sin(a) * H * .79);
      }
      g.fillStyle(this.exposed ? 0xffffff : 0xb66d5d, 1).fillCircle(0, 0, H * .14);
    }
  }

  die() {
    if (this.phase < 2) {
      this.waitingForNext = true;
      this.engaged = false;
      this.telegraphUntil = 0;
      this.warning.setAlpha(0);
      this.strike.setAlpha(0);
      this.dividers[this.phase].body.enable = false;
      for (const enemy of this.scene.enemies.list) if (enemy.summoned && enemy.alive) enemy.die();
      this.scene.combat.health = TUNING.maxHealth;
      this.scene.combat.nextHealthRegenAt = this.scene.time.now + TUNING.healthRegenInterval;
      this.scene.events.emit('combat:healed', TUNING.maxHealth);
      this.arena.bar.set(0);
      this.scene.cinematics.pulse('CHAMBER CLEARED', 'Your hearts return. The next form is waiting beyond the gate.',
        FORMS[this.phase].color, 2600);
      return;
    }
    this.alive = false;
    this.engaged = false;
    this.arena.state = 'won';
    this.arena.bar.hide();
    this.scene.completeFinalBoss(this.x, this.y);
  }

  beginNextForm(time) {
    this.dividers[this.phase].body.enable = true;
    this.phase++;
    const form = FORMS[this.phase];
    this.waitingForNext = false;
    this.engaged = true;
    this.maxHealth = form.health;
    this.health = form.health;
    this.color = form.color;
    this.title = form.name;
    this.exposedUntil = 0;
    this.bx = this.chambers[this.phase][1] - this.H * 2;
    this.nextAttackAt = time + 2000;
    this.nextSummonAt = time + 7500;
    this.scene.combat.health = TUNING.maxHealth;
    this.scene.combat.nextHealthRegenAt = time + TUNING.healthRegenInterval;
    this.arena.bar.refill(form.name, form.color);
    this.scene.cinematics.pulse(form.name, form.line, form.color, 2600);
    this.scene.shakeCamera(680, .012);
    this.draw(time);
  }
}
