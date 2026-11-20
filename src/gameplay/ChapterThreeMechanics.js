import Phaser from 'phaser';
import { BoyAnimator } from '../animation/BoyAnimator.js';
import { ChapterTwoMechanics } from './ChapterTwoMechanics.js';
import { gate as gateArt, hideShape, receptor, seal } from '../puzzles/PropArt.js';

const CONFIG = [
  { mirrors: [1700], gate: 1880, color: 0xb8e8eb },
  { mirrors: [2840], gate: 3570, color: 0x8bdbcb, crate: { kind: 'ordinary', platform: 1, weight: 1000, plate: 1190, gate: 1310 } },
  { mirrors: [1050, 1690], gate: 2400, color: 0xe9c49c },
  { mirrors: [2830], gate: 3540, color: 0xc7adf5, crate: { kind: 'shadow', platform: 2, weight: 1610, plate: 1780, gate: 1870 } },
  { mirrors: [1080, 1690, 2250], gate: 2940, color: 0xf4d199 },
];

const clampAngle = angle => Math.atan2(Math.sin(angle), Math.cos(angle));

// Chapter 3 keeps reflection as its shared language, but every area changes
// what reflected light does: break a cliff, freeze a tide, grow a path, guide
// a moving spotlight, then destroy a hostile delayed reflection.
export class ChapterThreeMechanics extends ChapterTwoMechanics {
  constructor(scene) {
    super(scene, { autoBuild: false });
    this.area = scene.levelIndex - 10;
    const config = CONFIG[this.area];
    this.color = config.color;
    this.mirrors = [];
    this.rays = scene.add.graphics().setDepth(4).setBlendMode(Phaser.BlendModes.ADD);
    if (config.crate) this.makePuzzle(config.crate);
    if (this.area === 2) this.makeBeam(2900, 2770, { color: 0xe8b26d, pulsing: true });
    for (const x of config.mirrors) this.makeMirror(x);
    this.makeReflectionGate(config.gate);
    if (this.area === 0) this.buildCollapsingReef();
    if (this.area === 1) this.buildGlassTide();
    if (this.area === 2) this.buildAshOrchard();
    if (this.area === 3) this.buildObservatorySpotlight();
    if (this.area === 4) this.buildHostileReflection();
    this.introduceArea();
  }

  introduceArea() {
    const beats = [
      ['REFLECTION', 'Anchor the Shadow in a lens. Then run—the reef will not hold.', 0xb8e8eb],
      ['THE GLASS TIDE', 'Captured light stills the water and hardens its surface.', 0x8bdbcb],
      ['BORROWED SPRING', 'The beam grows a path. Every new branch starves the last.', 0xe9c49c],
      ['THE SEARCHLIGHT', 'Move with its gaze. Anchor the Shadow when the light abandons it.', 0xc7adf5],
      ['THE FALSE KEEPER', 'Your reflection remembers every step two seconds too late.', 0xf4d199],
    ];
    const [title, line, color] = beats[this.area];
    this.scene.cinematics.pulse(title, line, color, this.area === 0 ? 3600 : 2900);
  }

  platformAt(x) {
    return this.scene.platforms.find(p => x * this.scale >= p.left && x * this.scale <= p.right);
  }

  addSurfaceCollider(surface) {
    this.scene.physics.add.collider(this.scene.player, surface);
    if (this.scene.shadow?.actor) this.scene.physics.add.collider(this.scene.shadow.actor, surface);
  }

  makeMirror(x) {
    const s = this.scale;
    const floor = this.platformAt(x).y;
    const point = { x: x * s, y: floor - 78 * s };
    const source = { x: (x - 245) * s, y: (this.area === 2 ? 270 : 340) * s };
    const receiver = { x: (x + 225) * s, y: (this.area === 3 ? 260 : 315) * s };
    const fixture = seal(this.scene, point.x, point.y, s, this.color);
    const eye = receptor(this.scene, receiver.x, receiver.y, s, this.color, this.color);
    const lamp = this.scene.add.container(source.x, source.y).setDepth(5);
    lamp.add(this.scene.add.circle(0, 0, 28 * s, 0x101923).setStrokeStyle(4 * s, this.color));
    lamp.add(this.scene.add.circle(0, 0, 10 * s, this.color, .9));
    const mirror = { point, source, receiver, fixture, eye, lit: false, index: this.mirrors.length };
    this.mirrors.push(mirror);
    this.hints.push({ key: 'F', at: () => point,
      active: () => !mirror.lit && !!this.scene.shadow?.controlling
        && Math.hypot(this.scene.shadow.actor.x - point.x, this.scene.shadow.actor.y - point.y) < 120 * s });
    this.hints.push({ key: 'Q', at: () => point,
      active: () => !mirror.lit && !!this.scene.shadow && !this.scene.shadow.detached
        && Math.abs(this.scene.player.x - point.x) < 180 * s });
  }

  makeReflectionGate(x) {
    const s = this.scale;
    const floor = this.platformAt(x).y;
    const wall = hideShape(this.scene.add.rectangle(x * s, floor / 2, 33 * s, floor, 0, 0));
    this.scene.physics.add.existing(wall, true);
    this.scene.physics.add.collider(this.scene.player, wall);
    const art = gateArt(this.scene, x * s, floor, s, this.color);
    this.reflectionGate = { wall, art, open: false };
    const count = this.scene.add.text(x * s, floor - 185 * s, `0 / ${this.mirrors.length}`, {
      fontFamily: 'Georgia, serif', fontSize: `${Math.round(25 * s)}px`, color: '#f1e8d4',
      backgroundColor: '#0b111bcc', padding: { x: 9, y: 4 },
    }).setOrigin(.5).setDepth(9);
    this.reflectionGate.count = count;
  }

  lightMirror(mirror) {
    if (mirror.lit) return;
    mirror.lit = true;
    mirror.fixture.setActive(true);
    mirror.eye.setActive(true);
    this.scene.flashAt(mirror.point.x, mirror.point.y, this.color);
    this.reflectionGate.count.setText(`${this.mirrors.filter(item => item.lit).length} / ${this.mirrors.length}`);
    if (this.area === 1) this.freezeTide();
    if (this.area === 2) this.growOrchardBridge(mirror.index);
    if (this.area === 4) this.strikeHostileReflection();
  }

  openReflectionGate(announce = true) {
    if (this.reflectionGate.open) return;
    this.reflectionGate.open = true;
    this.reflectionGate.wall.body.enable = false;
    this.reflectionGate.art.setOpen(true);
    if (this.area === 4) this.defeatHostileReflection(announce);
    else if (announce) this.scene.cinematics.pulse('THE PATH OPENS', 'The light remembers the path your shadow chose.', this.color, 1800);
  }

  // --- Moonbreak Reef: collapsing escape ------------------------------------------

  buildCollapsingReef() {
    this.cliffEscapeStarted = false;
    this.cliffShelves = [
      this.makeCliffShelf(1925, 2085, 675, 520),
      this.makeCliffShelf(2545, 2705, 678, 430),
      this.makeCliffShelf(3135, 3295, 640, 360),
    ];
  }

  makeCliffShelf(start, end, top, delay) {
    const s = this.scale, left = start * s, right = end * s, y = top * s;
    const shelf = this.scene.add.container(0, 0).setDepth(4);
    const rock = this.scene.add.polygon((left + right) / 2, y + 13 * s, [
      -(right - left) / 2, -13 * s, (right - left) / 2, -13 * s,
      (right - left) / 2 - 20 * s, 22 * s, 18 * s, 31 * s, -(right - left) / 2 + 12 * s, 15 * s,
    ], 0x17232c, 1).setStrokeStyle(3 * s, 0x93cbd3, .55);
    shelf.add(rock);
    const surface = hideShape(this.scene.add.rectangle((left + right) / 2, y + 7 * s, right - left, 16 * s, 0, 0));
    this.scene.physics.add.existing(surface, true);
    this.addSurfaceCollider(surface);
    return { left, right, top: y, delay, shelf, surface, triggeredAt: 0, collapsed: false };
  }

  updateCollapsingReef(time) {
    if (!this.reflectionGate.open) return;
    const player = this.scene.player;
    for (const shelf of this.cliffShelves) {
      if (!shelf.triggeredAt && player.x > shelf.left - 15 * this.scale && player.x < shelf.right + 15 * this.scale) {
        shelf.triggeredAt = time;
        if (!this.cliffEscapeStarted) {
          this.cliffEscapeStarted = true;
          this.scene.cinematics.pulse('RUN', 'The reflected beam split the reef beneath you.', 0xb8e8eb, 1300);
        }
      }
      if (!shelf.collapsed && shelf.triggeredAt && time - shelf.triggeredAt >= shelf.delay) {
        shelf.collapsed = true;
        shelf.surface.body.enable = false;
        this.scene.tweens.add({ targets: shelf.shelf, y: 250 * this.scale, angle: Phaser.Math.Between(-12, 12), alpha: 0,
          duration: 650, ease: 'Cubic.easeIn' });
        this.scene.shakeCamera(180, .006);
      }
    }
  }

  // --- Glass Tide: moving water and frozen glass ----------------------------------

  buildGlassTide() {
    const s = this.scale;
    this.tideFrozen = false;
    this.tideWater = this.scene.add.rectangle(2630 * s, 645 * s, 2220 * s, 255 * s, 0x143f4b, .58)
      .setOrigin(.5, 0).setDepth(1).setBlendMode(Phaser.BlendModes.ADD);
    this.tidePlatforms = [
      this.makeTidePlatform(2180, 665, 175, 0),
      this.makeTidePlatform(2670, 625, 190, 2.1),
      this.makeTidePlatform(3180, 650, 170, 4.2),
    ];
    const left = 3190 * s, right = 3340 * s, top = 638 * s;
    this.glassBridge = hideShape(this.scene.add.rectangle((left + right) / 2, top + 8 * s, right - left, 18 * s, 0, 0));
    this.scene.physics.add.existing(this.glassBridge, true);
    this.addSurfaceCollider(this.glassBridge);
    this.glassBridge.body.enable = false;
    this.glassBridgeArt = this.scene.add.rectangle((left + right) / 2, top + 5 * s, right - left, 13 * s, 0xb9fff5, .08)
      .setStrokeStyle(2 * s, 0xeaffff, .35).setDepth(4);
  }

  makeTidePlatform(x, y, width, phase) {
    const s = this.scale;
    const surface = this.scene.add.rectangle(x * s, y * s, width * s, 18 * s, 0x6bd0cd, .42)
      .setStrokeStyle(3 * s, 0xdffff8, .8).setDepth(4);
    this.scene.physics.add.existing(surface);
    surface.body.setAllowGravity(false).setImmovable(true);
    this.addSurfaceCollider(surface);
    return { surface, baseY: y * s, phase };
  }

  freezeTide() {
    if (this.tideFrozen) return;
    this.tideFrozen = true;
    this.glassBridge.body.enable = true;
    this.scene.tweens.add({ targets: [this.tideWater, this.glassBridgeArt], alpha: .78, duration: 480 });
    for (const platform of this.tidePlatforms) {
      platform.surface.body.setVelocityY(0);
      platform.surface.setFillStyle(0xb9fff5, .72).setStrokeStyle(3 * this.scale, 0xffffff, .95);
    }
    if (!this.restoring) this.scene.cinematics.pulse('TIDE LOCKED', 'The remembered light turns the sea to glass.', 0x8bdbcb, 1700);
  }

  updateGlassTide(time) {
    if (this.tideFrozen) return;
    const wave = Math.sin(time * .0011) * 22 * this.scale;
    this.tideWater.y = 645 * this.scale + wave;
    for (const platform of this.tidePlatforms) {
      const target = platform.baseY + Math.sin(time * .00135 + platform.phase) * 48 * this.scale;
      platform.surface.body.setVelocityY((target - platform.surface.y) * 5.5);
    }
  }

  // --- Ash Orchard: one living bridge at a time -----------------------------------

  buildAshOrchard() {
    this.orchardBridges = [
      this.makeBranchBridge(1260, 1420, 668),
      this.makeBranchBridge(1850, 2010, 678),
    ];
  }

  makeBranchBridge(start, end, top) {
    const s = this.scale, left = start * s, right = end * s, y = top * s;
    const surface = hideShape(this.scene.add.rectangle((left + right) / 2, y + 8 * s, right - left, 18 * s, 0, 0));
    this.scene.physics.add.existing(surface, true);
    this.addSurfaceCollider(surface);
    surface.body.enable = false;
    const art = this.scene.add.graphics().setDepth(4).setAlpha(.1);
    const redraw = alive => {
      art.clear().lineStyle((alive ? 13 : 5) * s, alive ? 0x553b25 : 0x211913, alive ? 1 : .45);
      const curve = new Phaser.Curves.CubicBezier(
        new Phaser.Math.Vector2(left, y + 8 * s), new Phaser.Math.Vector2(left + (right - left) * .3, y - 22 * s),
        new Phaser.Math.Vector2(left + (right - left) * .68, y + 25 * s), new Phaser.Math.Vector2(right, y + 5 * s));
      art.strokePoints(curve.getPoints(28));
      art.lineStyle(3 * s, alive ? 0xe9c49c : 0x4a392d, alive ? .85 : .28);
      for (let i = 3; i < 25; i += 4) {
        const p = curve.getPoint(i / 28);
        art.lineBetween(p.x, p.y, p.x + (i % 8 ? 13 : -13) * s, p.y - 18 * s);
      }
    };
    redraw(false);
    return { surface, art, redraw, alive: false };
  }

  growOrchardBridge(index) {
    const bridge = this.orchardBridges?.[index];
    if (!bridge) return;
    for (const [otherIndex, other] of this.orchardBridges.entries()) {
      if (otherIndex === index || !other.alive) continue;
      other.alive = false;
      other.surface.body.enable = false;
      other.redraw(false);
      this.scene.tweens.add({ targets: other.art, alpha: .12, duration: 520 });
    }
    bridge.alive = true;
    bridge.surface.body.enable = true;
    bridge.redraw(true);
    this.scene.tweens.add({ targets: bridge.art, alpha: 1, duration: 520, ease: 'Back.easeOut' });
    if (!this.restoring) this.scene.cinematics.pulse(index ? 'THE OLD PATH WITHERS' : 'THE ORCHARD WAKES',
      index ? 'The light moved on. So did the roots.' : 'Dead wood remembers the sun.', 0xe9c49c, 1500);
  }

  // --- Hollow Observatory: moving spotlight ---------------------------------------

  buildObservatorySpotlight() {
    const s = this.scale;
    this.spotlight = {
      x: 2380 * s, y: 110 * s, angle: Math.PI / 2, spread: .29, length: this.scene.viewportHeight * 1.12,
      outsideSince: 0, resetReadyAt: 0,
    };
    this.spotlightGfx = this.scene.add.graphics().setDepth(2).setBlendMode(Phaser.BlendModes.ADD);
    this.spotlightLamp = this.scene.add.circle(this.spotlight.x, this.spotlight.y, 35 * s, 0xe7dcff, .9)
      .setStrokeStyle(9 * s, 0x231c38, 1).setDepth(5);
  }

  pointInSpotlight(point) {
    const light = this.spotlight;
    if (!light) return true;
    const dx = point.x - light.x, dy = point.y - light.y;
    return Math.hypot(dx, dy) <= light.length && Math.abs(clampAngle(Math.atan2(dy, dx) - light.angle)) < light.spread;
  }

  updateObservatorySpotlight(time) {
    const light = this.spotlight;
    light.angle = Math.PI / 2 + Math.sin(time * .00062) * .93;
    const left = light.angle - light.spread, right = light.angle + light.spread;
    const lx = light.x + Math.cos(left) * light.length, ly = light.y + Math.sin(left) * light.length;
    const rx = light.x + Math.cos(right) * light.length, ry = light.y + Math.sin(right) * light.length;
    this.spotlightGfx.clear().fillStyle(0xc7adf5, .13).fillPoints([
      { x: light.x, y: light.y }, { x: lx, y: ly }, { x: rx, y: ry },
    ], true).lineStyle(3 * this.scale, 0xefe7ff, .5).lineBetween(light.x, light.y, lx, ly)
      .lineBetween(light.x, light.y, rx, ry);
    const shadow = this.scene.shadow;
    if (!shadow?.detached || !shadow.controlling || this.pointInSpotlight(shadow.actor)) {
      light.outsideSince = 0;
      return;
    }
    if (!light.outsideSince) light.outsideSince = time;
    if (time - light.outsideSince > 850 && time >= light.resetReadyAt) {
      light.resetReadyAt = time + 1400;
      light.outsideSince = 0;
      shadow.resetAtPlayer();
      this.scene.flashAt(this.scene.player.x, this.scene.player.y, 0xc7adf5);
      this.scene.announce('THE UNLIT SHADOW SNAPS BACK TO YOU.', 0xd8c8f5);
    }
  }

  // --- Black Lens: a delayed hostile copy ------------------------------------------

  buildHostileReflection() {
    const scene = this.scene, H = scene.spriteHeight;
    const actor = scene.physics.add.sprite(scene.player.x, scene.player.y, 'boy-upper')
      .setDisplaySize(H * 330 / 410, H);
    actor.body.setAllowGravity(false);
    const animator = new BoyAnimator(scene, actor, H, { ghost: true });
    animator.visual.setAlpha(.58).setVisible(false);
    const aura = scene.add.circle(actor.x, actor.y, H * .34, 0x8d2030, .13).setStrokeStyle(3, 0xf4d199, .4).setDepth(3).setVisible(false);
    this.echo = { actor, animator, aura, history: [], active: false, defeated: false, hitReadyAt: 0, startedAt: scene.time.now };
  }

  updateHostileReflection(time) {
    const echo = this.echo, player = this.scene.player;
    if (!echo || echo.defeated) return;
    const grounded = player.body.blocked.down || player.body.touching.down;
    echo.history.push({ time, x: player.x, y: player.y, flipX: player.flipX,
      vx: player.body.velocity.x, vy: player.body.velocity.y, grounded });
    const targetTime = time - 2000;
    while (echo.history.length > 2 && echo.history[1].time <= targetTime) echo.history.shift();
    if (targetTime < echo.startedAt || !echo.history.length) return;
    const sample = echo.history[0];
    if (!echo.active) {
      echo.active = true;
      echo.animator.visual.setVisible(true);
      echo.aura.setVisible(true);
    }
    echo.actor.body.reset(sample.x, sample.y);
    echo.actor.setFlipX(sample.flipX).setVelocity(sample.vx, sample.vy);
    echo.animator.update(time, 16, sample.grounded);
    echo.aura.setPosition(sample.x, sample.y).setAlpha(.1 + Math.sin(time * .008) * .04);
    if (time >= echo.hitReadyAt && Math.hypot(player.x - sample.x, player.y - sample.y) < this.scene.spriteHeight * .48) {
      echo.hitReadyAt = time + 1600;
      this.scene.combat?.hurt(1, sample.x);
    }
  }

  strikeHostileReflection() {
    const echo = this.echo;
    if (!echo || echo.defeated) return;
    this.scene.flashAt(echo.actor.x, echo.actor.y, 0xf4d199);
    this.scene.tweens.add({ targets: [echo.animator.visual, echo.aura], alpha: .12, duration: 90, yoyo: true, repeat: 2 });
    if (!this.restoring) this.scene.cinematics.pulse(`${this.mirrors.filter(m => m.lit).length} / 3`,
      'The stolen light tears through the false Keeper.', 0xf4d199, 1050);
  }

  defeatHostileReflection(announce = true) {
    const echo = this.echo;
    if (!echo || echo.defeated) return;
    echo.defeated = true;
    this.scene.tweens.add({ targets: [echo.animator.visual, echo.aura], alpha: 0, scale: 1.5, duration: 650,
      onComplete: () => { echo.animator.visual.setVisible(false); echo.aura.setVisible(false); } });
    if (announce) this.scene.cinematics.pulse('THE FALSE KEEPER SHATTERS',
      'Three remembered lights leave no reflection behind.', 0xf4d199, 2300);
  }

  canLightMirror(mirror) {
    return this.area !== 3 || this.pointInSpotlight(mirror.point);
  }

  snapshot() {
    return { ...super.snapshot(), mirrors: this.mirrors.map(m => m.lit) };
  }

  restore(data) {
    super.restore(data);
    this.restoring = true;
    data?.mirrors?.forEach((lit, index) => { if (lit && this.mirrors[index]) this.lightMirror(this.mirrors[index]); });
    this.restoring = false;
    if (this.mirrors.every(m => m.lit)) this.openReflectionGate(false);
  }

  drawRays(time) {
    const g = this.rays.clear();
    for (const mirror of this.mirrors) {
      const { source, point } = mirror;
      const receiver = this.area === 4 && mirror.lit && this.echo?.active && !this.echo.defeated
        ? { x: this.echo.actor.x, y: this.echo.actor.y } : mirror.receiver;
      const shimmer = mirror.lit ? .75 + Math.sin(time * .006) * .13 : .27;
      g.lineStyle(17 * this.scale, this.color, mirror.lit ? .12 : .045);
      g.lineBetween(source.x, source.y, point.x, point.y);
      g.lineStyle(3 * this.scale, this.color, shimmer);
      g.lineBetween(source.x, source.y, point.x, point.y);
      if (mirror.lit) {
        g.lineStyle(24 * this.scale, this.color, .14);
        g.lineBetween(point.x, point.y, receiver.x, receiver.y);
        g.lineStyle(5 * this.scale, 0xfff0ce, .85);
        g.lineBetween(point.x, point.y, receiver.x, receiver.y);
      } else {
        g.lineStyle(2 * this.scale, this.color, .13);
        g.lineBetween(point.x, point.y, receiver.x, receiver.y);
      }
    }
  }

  update(time) {
    super.update(time);
    if (this.area === 0) this.updateCollapsingReef(time);
    if (this.area === 1) this.updateGlassTide(time);
    if (this.area === 3) this.updateObservatorySpotlight(time);
    if (this.area === 4) this.updateHostileReflection(time);
    const shadow = this.scene.shadow;
    for (const mirror of this.mirrors) {
      if (!mirror.lit && this.canLightMirror(mirror)
        && shadow?.isAnchoredNear(mirror.point.x, mirror.point.y, 118 * this.scale)) this.lightMirror(mirror);
    }
    if (this.mirrors.every(m => m.lit)) this.openReflectionGate();
    this.drawRays(time);
  }
}
