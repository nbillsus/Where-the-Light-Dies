import Phaser from 'phaser';
import { ensureFxTextures } from '../effects/textures.js';

const ART_WIDTH = 330;
const ART_HEIGHT = 410;
// Pose pivot: between the feet, so leaning and squashing happen around the ground.
const PIVOT_X = 224;
const PIVOT_Y = 405;
// Sword swing timing (ms) and the arcs for the three combo hits (degrees,
// 0 = pointing forward, positive = downward).
const SWING = 170;
const SWINGS = [null, [-115, 70], [85, -65], [-160, 105]];

function drawLeg(graphics, hipX, kneeX, kneeY, ankleX, ankleY, color, rimAlpha, ghost = false) {
  graphics.lineStyle(34, color, 1).beginPath().moveTo(hipX, 317).lineTo(kneeX, kneeY).lineTo(ankleX, ankleY - 9).strokePath();
  graphics.fillStyle(color, 1).fillCircle(kneeX, kneeY, 17);
  graphics.fillStyle(ghost ? 0xb9d4df : 0x03050b, 1).fillPoints([
    { x: ankleX - 17, y: ankleY - 13 }, { x: ankleX + 13, y: ankleY - 13 },
    { x: ankleX + 29, y: ankleY - 3 }, { x: ankleX + 31, y: ankleY + 3 },
    { x: ankleX - 18, y: ankleY + 3 },
  ], true);
  graphics.lineStyle(3, ghost ? 0xf1faff : 0x8e9db8, rimAlpha).lineBetween(ankleX + 9, ankleY - 13, ankleX + 27, ankleY - 3);
  graphics.lineStyle(2, ghost ? 0xf1faff : 0x8e9db8, rimAlpha * 0.8).lineBetween(ankleX - 13, ankleY + 2, ankleX + 24, ankleY + 2);
}

const ease = t => 1 - Math.pow(1 - Phaser.Math.Clamp(t, 0, 1), 3);
const mix = (a, b, t) => a + (b - a) * t;

// Swing timing curve: a quick pull back (wind-up), a fast arc that slightly
// overshoots (follow-through), then settles. 0 = start angle, 1 = end angle.
function swingCurve(t) {
  if (t < .18) return -.12 * Math.sin(t / .18 * Math.PI / 2);
  const u = Math.min(1, (t - .18) / .82) - 1, c = 1.9;
  return -.12 + 1.12 * (1 + (c + 1) * u ** 3 + c * u ** 2);
}

// Cape: a chain of segments hanging from the shoulders. Angles are in
// degrees in the boy's own space (0 = forward, 90 = straight down).
const CAPE_ROOT = { x: 206, y: 212 };
const CAPE_SEGMENTS = 6;
const CAPE_LENGTH = 25;
const CAPE_WIDTH = [58, 52, 50, 52, 56, 60, 62];
// Eyes in the boy_upper art (the ghost draws its own eyes in the same spots).
const EYES = [[258, 120, 12, 32], [282, 123, 9, 26]];

// The lantern-blade: a slim sword whose edge carries the lantern's light.
function buildSword(scene) {
  const sword = scene.add.container(0, 0);
  const g = scene.add.graphics();
  const blade = [{ x: 8, y: -13 }, { x: 228, y: -8 }, { x: 262, y: 0 }, { x: 228, y: 8 }, { x: 8, y: 13 }];
  g.fillStyle(0x2a1d14, 1).fillRect(-40, -8, 40, 16);                       // grip
  g.fillStyle(0xb8925a, 1).fillCircle(-44, 0, 11);                         // pommel
  g.fillStyle(0xb8925a, 1).fillRoundedRect(-6, -34, 14, 68, 5);            // crossguard
  g.fillStyle(0xc9d3dc, 1).fillPoints(blade, true);
  g.fillStyle(0x8e9aa6, 1).fillPoints([{ x: 8, y: 0 }, { x: 228, y: 0 }, { x: 262, y: 0 }, { x: 228, y: 8 }, { x: 8, y: 13 }], true);
  g.lineStyle(4, 0x05070d, 1).strokePoints(blade, true);
  g.lineStyle(4, 0xffd38a, .9).lineBetween(18, -3, 236, -2);               // lit edge
  g.fillStyle(0x05070d, 1).fillCircle(-18, 0, 19);                         // fist
  sword.add(g);
  return sword;
}

export class BoyAnimator {
  constructor(scene, player, displayHeight, { ghost = false } = {}) {
    this.scene = scene;
    this.player = player;
    this.ghost = ghost;
    this.scale = displayHeight / ART_HEIGHT;
    this.displayWidth = ART_WIDTH * this.scale;
    this.visual = scene.add.container(0, 0).setDepth(ghost ? 4 : 2);
    // Everything sits in a pose container pivoting at the feet.
    this.pose = scene.add.container(PIVOT_X, PIVOT_Y);
    this.visual.add(this.pose);
    this.cape = scene.add.graphics().setPosition(-PIVOT_X, -PIVOT_Y);
    this.legs = scene.add.graphics().setPosition(-PIVOT_X, -PIVOT_Y);
    this.upper = scene.add.image(-PIVOT_X, -PIVOT_Y, 'boy-upper').setOrigin(0);
    this.pose.add([this.cape, this.legs, this.upper]);
    if (ghost) {
      this.upper.setTintFill(0xbdd8e4);
      this.visual.setAlpha(0.68);
      const eyes = scene.add.graphics().fillStyle(0xf7ffff, 1).setPosition(-PIVOT_X, -PIVOT_Y);
      eyes.fillEllipse(258, 120, 10, 30).fillEllipse(282, 123, 7, 24);
      this.pose.add(eyes);
    } else {
      ensureFxTextures(scene);
      this.sword = buildSword(scene);
      this.pose.add(this.sword);
    }
    // Eyelids, drawn over the eyes for a blink.
    this.lids = scene.add.graphics().setPosition(-PIVOT_X, -PIVOT_Y);
    this.pose.add(this.lids);
    this.nextBlinkAt = 1500 + Math.random() * 2500;
    this.blinkUntil = 0;
    this.capeAngles = Array.from({ length: CAPE_SEGMENTS }, () => 115);
    this.idleSince = 0;
    if (!ghost) {
      // Dust kicked up by feet, and a soft smear behind the sword.
      this.dust = scene.add.particles(0, 0, 'fx-mote', {
        emitting: false, lifespan: { min: 320, max: 560 }, speedX: { min: -70, max: 70 }, speedY: { min: -55, max: -10 },
        gravityY: 140, scale: { start: .32, end: 0 }, alpha: { start: .5, end: 0 }, tint: [0x8e9db8, 0x5c6a80],
      }).setDepth(2.5);
      this.trail = scene.add.graphics().setDepth(2.6).setBlendMode(Phaser.BlendModes.ADD);
      this.trailPoints = [];
      this.matrix = new Phaser.GameObjects.Components.TransformMatrix();
      this.parentMatrix = new Phaser.GameObjects.Components.TransformMatrix();
    }
    this.footIndex = 0;
    this.phase = 0;
    this.runBlend = 0;
    this.wasAirborne = false;
    this.landingUntil = 0;
    this.lean = 0;
    player.setVisible(false);
    this.update(0, 16, true);
  }

  /** Brief red flash when the boy is hurt. */
  hurtFlash() {
    if (this.ghost) return;
    this.upper.setTintFill(0xff5050);
    this.scene.time.delayedCall(110, () => this.upper.clearTint());
  }

  update(time, delta, grounded) {
    const { player } = this;
    const speed = Math.abs(player.body.velocity.x);
    const moving = grounded && speed > 30;
    this.runBlend += ((moving ? 1 : 0) - this.runBlend) * Math.min(1, delta / 105);
    if (moving) this.phase += speed * delta / 1000 * Math.PI * 2 / 175;

    if (grounded && this.wasAirborne) {
      this.landingUntil = time + 150;
      this.puff(9);
    } else if (!grounded && !this.wasAirborne && player.body.velocity.y < -200) this.puff(5);
    this.wasAirborne = !grounded;
    // A small puff each time a foot plants while running.
    const footIndex = Math.floor(this.phase / Math.PI);
    if (moving && this.runBlend > .6 && footIndex !== this.footIndex) this.puff(2);
    this.footIndex = footIndex;
    const landing = grounded && time < this.landingUntil
      ? Math.sin((this.landingUntil - time) / 150 * Math.PI) : 0;
    const rising = !grounded && player.body.velocity.y < -60;
    const falling = !grounded && !rising;
    const breathe = grounded && !moving ? Math.sin(time * .0025) * 2.5 : 0;
    const bob = grounded ? this.runBlend * (1 - Math.cos(this.phase * 2)) * 5 + breathe : rising ? -8 : -3;
    this.upper.setY(-PIVOT_Y + bob + landing * 8).setScale(1, 1 - landing * 0.1);
    this.drawBlink(time, bob + landing * 8, 1 - landing * .1);

    const x = player.flipX ? player.x + this.displayWidth / 2 : player.x - this.displayWidth / 2;
    this.visual.setPosition(x, player.y - ART_HEIGHT * this.scale / 2);
    this.visual.setScale(player.flipX ? -this.scale : this.scale, this.scale);

    // --- Combat-driven pose (the boy only; the Shadow copies movement only).
    const combat = this.ghost ? null : this.scene.combat;
    const sinceAttack = combat?.attackAt != null ? time - combat.attackAt : Infinity;
    const attackT = sinceAttack / SWING;                 // 0..1 during the swing
    const attackWeight = attackT < 1.7 ? 1 : Math.max(0, 1 - (attackT - 1.7) / .9);
    const hurtT = combat?.hurtAt != null ? (time - combat.hurtAt) / 320 : Infinity;
    const dodging = combat?.dodgeAt != null && time - combat.dodgeAt < 230;

    let targetLean = this.runBlend * 4 + (rising ? -3 : 0);
    if (attackWeight > 0) targetLean = mix(targetLean, combat.attackStep === 3 ? 14 : 9, attackWeight);
    if (hurtT < 1) targetLean = -12 * (1 - hurtT);
    if (dodging) targetLean = 16;
    this.lean += (targetLean - this.lean) * Math.min(1, delta / 60);
    const stretch = rising ? .05 : 0;
    this.pose.setAngle(this.lean)
      .setScale(1 - stretch * .6 + landing * .06, 1 + stretch - landing * .06);

    if (this.sword) {
      // Resting angle: held low in front; trails behind when running.
      // Standing still for a while: now and then he shifts his grip.
      if (moving || !grounded || attackWeight > 0) this.idleSince = time;
      const idle = time - this.idleSince;
      const fidget = idle > 4000 ? Math.max(0, Math.sin((idle - 4000) * .0011)) ** 6 * 18 : 0;
      let base = mix(70, 148, this.runBlend) + Math.sin(this.phase) * 8 * this.runBlend + breathe - fidget;
      if (rising) base = 25; else if (falling) base = 100;
      if (dodging) base = 165;
      if (hurtT < 1) base = 155;
      let angle = base;
      let handX = mix(238, 226, this.runBlend), handY = 258 + bob;
      if (attackWeight > 0) {
        const [from, to] = SWINGS[combat.attackStep] ?? SWINGS[1];
        const swingAngle = mix(from, to, swingCurve(attackT));
        angle = mix(base, swingAngle, attackWeight);
        handX = mix(handX, combat.attackStep === 3 ? 292 : 276, attackWeight * ease(attackT));
        handY = mix(handY, 236 + bob, attackWeight);
      }
      this.sword.setPosition(handX - PIVOT_X, handY - PIVOT_Y).setAngle(angle);
      this.drawTrail(time, attackT);
    }

    this.drawCape(time, delta, { bob, rising, falling, dodging, grounded });

    let nearKneeX, nearKneeY, nearAnkleX, nearAnkleY;
    let farKneeX, farKneeY, farAnkleX, farAnkleY;
    if (rising) {
      [nearKneeX, nearKneeY, nearAnkleX, nearAnkleY] = [271, 346, 256, 370];
      [farKneeX, farKneeY, farAnkleX, farAnkleY] = [186, 350, 171, 381];
    } else if (falling) {
      [nearKneeX, nearKneeY, nearAnkleX, nearAnkleY] = [269, 362, 273, 399];
      [farKneeX, farKneeY, farAnkleX, farAnkleY] = [184, 362, 181, 399];
    } else {
      // Run cycle; a lunging step forward during attacks.
      const swing = Math.sin(this.phase) * this.runBlend;
      const nearLift = Math.max(0, swing);
      const farLift = Math.max(0, -swing);
      const step = attackWeight * 18;
      nearKneeX = 246 + swing * 41 + step;
      nearKneeY = 364 - nearLift * 18 + landing * 10;
      nearAnkleX = 255 + swing * 62 + step * 1.6;
      nearAnkleY = 405 - nearLift * 43;
      farKneeX = 201 - swing * 39 - step * .5;
      farKneeY = 364 - farLift * 18 + landing * 10;
      farAnkleX = 193 - swing * 57 - step;
      farAnkleY = 405 - farLift * 43;
    }
    this.legs.clear();
    drawLeg(this.legs, 207, farKneeX, farKneeY, farAnkleX, farAnkleY, this.ghost ? 0xaacbd8 : 0x10131b, 0.19, this.ghost);
    drawLeg(this.legs, 246, nearKneeX, nearKneeY, nearAnkleX, nearAnkleY, this.ghost ? 0xc7dce5 : 0x05070d, 0.39, this.ghost);
  }

  // Dust at the boy's feet (world space).
  puff(count) {
    if (!this.dust) return;
    this.dust.emitParticleAt(this.player.x, this.player.body.bottom - 2, count);
  }

  // Blink: lids close over the eyes for ~120ms every few seconds.
  drawBlink(time, offsetY, scaleY) {
    const lids = this.lids.clear().setY(-PIVOT_Y + offsetY).setScale(1, scaleY);
    if (time > this.nextBlinkAt) {
      this.blinkUntil = time + 130;
      // Sometimes a quick double blink.
      this.nextBlinkAt = time + (Math.random() < .2 ? 260 : 2600 + Math.random() * 3200);
    }
    if (time >= this.blinkUntil) return;
    const closed = Math.sin((1 - (this.blinkUntil - time) / 130) * Math.PI);
    lids.fillStyle(this.ghost ? 0xbdd8e4 : 0x0b0e16, 1);
    for (const [x, y, w, h] of EYES) lids.fillRect(x - w / 2 - 2, y - h / 2 - 2, w + 4, (h + 4) * closed);
  }

  // The cape: each segment eases toward a target angle, lower segments more
  // slowly, so movement ripples down the cloth.
  drawCape(time, delta, { bob, rising, falling, dodging, grounded }) {
    const vx = Math.abs(this.player.body.velocity.x), run = Phaser.Math.Clamp(vx / 320, 0, 1);
    let target = mix(112, 158, run);
    if (rising) target = 104;
    if (falling && !grounded) target = 196;
    if (dodging) target = 176;
    const wave = 4 + 12 * run + (falling ? 8 : 0);
    let x = CAPE_ROOT.x, y = CAPE_ROOT.y + bob;
    const spine = [{ x, y }];
    for (let i = 0; i < CAPE_SEGMENTS; i++) {
      const goal = target + Math.sin(time * (.006 + run * .006) - i * .9) * wave * (i + 1) / CAPE_SEGMENTS;
      this.capeAngles[i] += (goal - this.capeAngles[i]) * Math.min(1, delta / (55 + i * 32));
      const a = Phaser.Math.DegToRad(this.capeAngles[i]);
      x += Math.cos(a) * CAPE_LENGTH;
      y += Math.sin(a) * CAPE_LENGTH;
      spine.push({ x, y });
    }
    // Cloth outline: both sides of the spine, with a ragged hem.
    const left = [], right = [];
    spine.forEach((p, i) => {
      const next = spine[Math.min(i + 1, spine.length - 1)], prev = spine[Math.max(i - 1, 0)];
      const a = Math.atan2(next.y - prev.y, next.x - prev.x) + Math.PI / 2, w = CAPE_WIDTH[i] / 2;
      left.push({ x: p.x + Math.cos(a) * w, y: p.y + Math.sin(a) * w });
      right.push({ x: p.x - Math.cos(a) * w, y: p.y - Math.sin(a) * w });
    });
    const end = spine[spine.length - 1], tip = Phaser.Math.DegToRad(this.capeAngles[CAPE_SEGMENTS - 1]);
    const hem = [0, 1, 2].map(k => ({
      x: end.x + Math.cos(tip) * (k % 2 ? 4 : 14) + Math.cos(tip + Math.PI / 2) * (k - 1) * 18,
      y: end.y + Math.sin(tip) * (k % 2 ? 4 : 14) + Math.sin(tip + Math.PI / 2) * (k - 1) * 18,
    }));
    const outline = [...left, ...hem.reverse(), ...right.reverse()];
    this.cape.clear();
    this.cape.fillStyle(this.ghost ? 0xa9cadc : 0x050711, this.ghost ? 0.72 : 0.98).fillPoints(outline, true);
    // Moonlight along the outer edge of the cloth.
    this.cape.lineStyle(4, this.ghost ? 0xe5f8ff : 0x8e9db8, 0.38).strokePoints(right.slice(-CAPE_SEGMENTS), false);
  }

  // A soft smear across the arc the blade just swept. It fades within a
  // fraction of a second and never flashes.
  drawTrail(time, attackT) {
    const g = this.trail.clear();
    const m = this.sword.getWorldTransformMatrix(this.matrix, this.parentMatrix);
    if (attackT < 1.05) {
      const root = m.transformPoint(70, 0, { x: 0, y: 0 }), tip = m.transformPoint(262, 0, { x: 0, y: 0 });
      this.trailPoints.push({ root, tip, born: time });
    }
    this.trailPoints = this.trailPoints.filter(p => time - p.born < 130);
    for (let i = 1; i < this.trailPoints.length; i++) {
      const a = this.trailPoints[i - 1], b = this.trailPoints[i];
      const fade = 1 - (time - a.born) / 130;
      g.fillStyle(0xffd38a, .32 * fade).fillPoints([a.root, a.tip, b.tip, b.root], true);
      g.lineStyle(3, 0xfff1c8, .5 * fade).lineBetween(a.tip.x, a.tip.y, b.tip.x, b.tip.y);
    }
  }
}
