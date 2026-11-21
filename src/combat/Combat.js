import Phaser from 'phaser';
import { fixedLayerOffset } from '../rendering.js';
import { ensureFxTextures } from '../effects/textures.js';
import { sfx } from './sfx.js';

// The Keeper's combat: Light Strike combo, Flare Pulse, dodge, health.
// Owner: Lucas (combat rules). Numbers are documented in docs/MECHANICS.md.
//
// Scene events emitted for audio/UI (scene.events):
//   'combat:strike' (step)            'combat:hit' (enemy, blocked)
//   'combat:flare' (x, y)             'combat:hurt' (health)
//   'combat:healed' (health)           'combat:died'
//   'combat:enemy-killed' (enemy)

export const TUNING = {
  maxHealth: 5,
  // Regain one missing heart after five seconds without taking damage.
  healthRegenInterval: 5000,
  // Light Strike: 3-hit combo. Presses closer than `strikeGap` are ignored;
  // a press within `comboWindow` of the last one continues the combo.
  strikeGap: 230, comboWindow: 560, strikeDamage: [1, 1, 2],
  strikeRange: .66, // × boy height, in front of him
  // Flare Pulse: radius × boy height, stun length and recharge (ms).
  flareRadius: 1.75, flareStun: 2200, flareCooldown: 6000,
  // Dodge: dash speed (px/s), length and recharge (ms); invulnerable while dashing.
  dodgeSpeed: 820, dodgeTime: 210, dodgeCooldown: 650,
  // After being hurt: invulnerable this long, knocked back this hard.
  hurtGrace: 1100, knockback: 360,
};
const RUN_SPEED = 320;

// What the player has already learned this session (for the key icons).
const learned = { strike: false, flare: false };

export class Combat {
  constructor(scene) {
    this.scene = scene;
    ensureFxTextures(scene);
    this.keys = scene.input.keyboard.addKeys('J,K,SHIFT');
    scene.input.mouse?.disableContextMenu();
    this.mouse = { left: false, right: false };
    this.onPointer = pointer => {
      if (scene.paused) return;
      if (pointer.rightButtonDown()) this.mouse.right = true; else this.mouse.left = true;
    };
    scene.input.on('pointerdown', this.onPointer);
    scene.events.once('shutdown', () => scene.input.off('pointerdown', this.onPointer));
    this.health = TUNING.maxHealth;
    this.nextHealthRegenAt = scene.time.now + TUNING.healthRegenInterval;
    this.combo = 0;
    this.lastStrike = -1e9;
    this.flareReadyAt = 0;
    this.dodgeUntil = 0;
    this.dodgeReadyAt = 0;
    this.invulnerableUntil = 0;
    this.knockedUntil = 0;
    this.dying = false;
    const { viewportWidth: w, viewportHeight: h } = scene;
    const offset = fixedLayerOffset(w, h);
    this.hurtVeil = scene.add.rectangle(offset.x + w / 2, offset.y + h / 2, w, h, 0x8a0d12, 0)
      .setScrollFactor(0).setDepth(70);
    this.hints = [
      { key: 'J', at: () => this.tutorialTarget('strike'), active: () => !learned.strike && !!this.tutorialTarget('strike') },
      { key: 'K', at: () => this.tutorialTarget('flare'), active: () => !learned.flare && this.flareReady && !!this.tutorialTarget('flare') },
    ];
  }

  get height() { return this.scene.spriteHeight; }
  get facing() { return this.scene.player.flipX ? -1 : 1; }
  get flareReady() { return this.scene.time.now >= this.flareReadyAt; }
  /** 0 = just used, 1 = ready. */
  get flareCharge() { return Phaser.Math.Clamp(1 - (this.flareReadyAt - this.scene.time.now) / TUNING.flareCooldown, 0, 1); }
  get invulnerable() { return this.scene.time.now < this.invulnerableUntil; }

  tutorialTarget(kind) {
    const enemies = this.scene.enemies;
    if (!enemies) return null;
    const enemy = enemies.nearest(this.scene.player, this.height * 3, e => kind === 'strike' || e.armored);
    return enemy ? { x: enemy.x, y: enemy.top } : null;
  }

  update(time) {
    const scene = this.scene;
    const player = scene.player;
    if (this.dying || scene.finished) return;
    this.updateHealthRegen(time);
    const busy = !!scene.shadow?.controlling;
    const strike = Phaser.Input.Keyboard.JustDown(this.keys.J) || this.mouse.left;
    const flare = Phaser.Input.Keyboard.JustDown(this.keys.K) || this.mouse.right;
    const dodge = Phaser.Input.Keyboard.JustDown(this.keys.SHIFT);
    this.mouse.left = this.mouse.right = false;
    if (!busy) {
      if (strike) this.strike(time);
      if (flare) this.flare(time);
      if (dodge) this.dodge(time);
    }
    if (time < this.dodgeUntil) {
      player.setVelocityX(this.dodgeDir * TUNING.dodgeSpeed);
      if (Math.random() < .5) this.afterimage();
    } else if (time < this.knockedUntil) {
      // knockback velocity set in hurt() carries the boy
    } else if (player.body.maxVelocity.x !== RUN_SPEED) {
      player.body.setMaxVelocityX(RUN_SPEED);
    }
    // Flicker while invulnerable after a hit.
    const visual = scene.animator.visual;
    visual.setAlpha(time < this.invulnerableUntil && time > this.dodgeUntil ? (Math.floor(time / 70) % 2 ? .35 : 1) : 1);
  }

  updateHealthRegen(time) {
    if (this.health >= TUNING.maxHealth) {
      this.nextHealthRegenAt = time + TUNING.healthRegenInterval;
      return;
    }
    if (time < this.nextHealthRegenAt) return;
    this.health = Math.min(TUNING.maxHealth, this.health + 1);
    this.nextHealthRegenAt = time + TUNING.healthRegenInterval;
    this.scene.events.emit('combat:healed', this.health);
  }

  strike(time) {
    if (time - this.lastStrike < TUNING.strikeGap) return;
    this.combo = time - this.lastStrike < TUNING.comboWindow && this.combo < 3 ? this.combo + 1 : 1;
    this.lastStrike = time;
    this.attackAt = time;
    this.attackStep = this.combo;
    learned.strike = true;
    const player = this.scene.player, dir = this.facing, reach = this.height * TUNING.strikeRange;
    const box = {
      left: dir > 0 ? player.x - this.height * .1 : player.x - reach,
      right: dir > 0 ? player.x + reach : player.x + this.height * .1,
      top: player.y - this.height * .55, bottom: player.y + this.height * .45,
    };
    const damage = TUNING.strikeDamage[this.combo - 1];
    this.scene.enemies?.strike(box, damage, dir, player.x, time, this.combo === 3);
    if (player.body.blocked.down) player.setVelocityX(dir * (this.combo === 3 ? 220 : 120));
    this.slash(dir, this.combo);
    sfx.swing(this.scene, this.combo);
    this.scene.events.emit('combat:strike', this.combo);
  }

  // Crescent of light in front of the boy.
  slash(dir, step) {
    const scene = this.scene, player = scene.player, r = this.height * (step === 3 ? .62 : .5);
    const g = scene.add.graphics().setDepth(12).setBlendMode(Phaser.BlendModes.ADD);
    const start = step === 2 ? .9 : -.9, end = -start, steps = 14;
    const outer = [], inner = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, a = start + (end - start) * t, thick = Math.sin(t * Math.PI);
      outer.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
      inner.push({ x: Math.cos(a) * r * (1 - .3 * thick), y: Math.sin(a) * r * (1 - .3 * thick) });
    }
    g.fillStyle(0xfff0c8, .9).fillPoints([...outer, ...inner.reverse()], true);
    g.setPosition(player.x + dir * this.height * .12, player.y - this.height * .05).setScale(dir, 1);
    const glow = scene.add.image(player.x + dir * r * .7, player.y, 'fx-glow').setTint(0xffc977)
      .setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(r * 1.6, r * 1.3).setAlpha(.5).setDepth(11);
    scene.tweens.add({ targets: [g, glow], alpha: 0, duration: 170, onComplete: () => { g.destroy(); glow.destroy(); } });
    // Each swing gently warms the ground around it (soft, never a flash).
    scene.atmosphere?.lighting?.pulse(player.x + dir * r * .6, player.y, r * (step === 3 ? 2.4 : 1.9), 0xffd38a, 320, .3);
  }

  flare(time) {
    if (time < this.flareReadyAt) return;
    this.flareReadyAt = time + TUNING.flareCooldown;
    learned.flare = true;
    const scene = this.scene, player = scene.player, radius = this.height * TUNING.flareRadius;
    scene.enemies?.flare(player.x, player.y, radius, time);
    const glow = scene.add.image(player.x, player.y, 'fx-glow').setTint(0xffe2a3)
      .setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(radius * .5, radius * .5).setAlpha(1).setDepth(12);
    const ring = scene.add.circle(player.x, player.y, radius * .2).setStrokeStyle(4, 0xfff1c8, .9).setDepth(12);
    scene.tweens.add({ targets: glow, displayWidth: radius * 2.8, displayHeight: radius * 2.8, alpha: 0, duration: 520, ease: 'Cubic.easeOut', onComplete: () => glow.destroy() });
    scene.tweens.add({ targets: ring, radius, alpha: 0, duration: 420, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
    // The flare throws light across the whole area for a moment.
    scene.atmosphere?.lighting?.pulse(player.x, player.y, radius * 3.2, 0xffe8b8, 700, 1.2);
    sfx.flare(scene);
    scene.events.emit('combat:flare', player.x, player.y);
  }

  dodge(time) {
    if (time < this.dodgeReadyAt) return;
    const scene = this.scene, player = scene.player;
    const left = scene.cursors.left.isDown || scene.keys.A.isDown, right = scene.cursors.right.isDown || scene.keys.D.isDown;
    // Dash the way you're pushing; with no direction held, step back from danger.
    this.dodgeDir = right && !left ? 1 : left && !right ? -1 : -this.facing;
    this.dodgeUntil = time + TUNING.dodgeTime;
    this.dodgeAt = time;
    this.dodgeReadyAt = time + TUNING.dodgeCooldown;
    this.invulnerableUntil = Math.max(this.invulnerableUntil, time + TUNING.dodgeTime + 60);
    player.body.setMaxVelocityX(TUNING.dodgeSpeed);
    sfx.dodge(scene);
  }

  afterimage() {
    const visual = this.scene.animator.visual;
    const ghost = this.scene.add.circle(this.scene.player.x, this.scene.player.y, this.height * .22, 0xcfe3f5, .18)
      .setDepth(visual.depth - .1);
    this.scene.tweens.add({ targets: ghost, alpha: 0, scale: .6, duration: 220, onComplete: () => ghost.destroy() });
  }

  hurt(amount, fromX) {
    const scene = this.scene, time = scene.time.now;
    if (this.dying || scene.finished || time < this.invulnerableUntil) return false;
    this.health = Math.max(0, this.health - amount);
    this.nextHealthRegenAt = time + TUNING.healthRegenInterval;
    this.invulnerableUntil = time + TUNING.hurtGrace;
    this.knockedUntil = time + 260;
    const player = scene.player, dir = Math.sign(player.x - fromX) || -this.facing;
    player.body.setMaxVelocityX(TUNING.knockback);
    player.setVelocity(dir * TUNING.knockback, -260);
    this.hurtAt = time;
    this.hurtVeil.setAlpha(.5);
    scene.tweens.add({ targets: this.hurtVeil, alpha: 0, duration: 520 });
    scene.shakeCamera(240, .012);
    scene.animator.hurtFlash?.();
    // Hit-stop: a tiny freeze so the hit registers.
    scene.physics.world.pause();
    setTimeout(() => { if (!scene.paused && scene.sys.isActive()) scene.physics.world.resume(); }, 80);
    sfx.hurt(scene);
    scene.events.emit('combat:hurt', this.health);
    if (this.health === 0) this.die();
    return true;
  }

  die() {
    const scene = this.scene;
    this.dying = true;
    scene.events.emit('combat:died');
    scene.player.setVelocity(0, 0).setAcceleration(0, 0);
    scene.cameras.main.fadeOut(450, 30, 0, 4);
    scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      scene.respawn();
      scene.enemies?.reset();
      this.health = TUNING.maxHealth;
      this.nextHealthRegenAt = scene.time.now + TUNING.healthRegenInterval;
      this.invulnerableUntil = scene.time.now + 1200;
      this.dying = false;
      scene.cameras.main.fadeIn(500, 0, 0, 0);
    });
  }
}
