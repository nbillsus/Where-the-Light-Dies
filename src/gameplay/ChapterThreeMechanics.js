import { ChapterTwoMechanics } from './ChapterTwoMechanics.js';
import { gate as gateArt, hideShape, receptor, seal } from '../puzzles/PropArt.js';

const CONFIG = [
  { mirrors: [1700], gate: 1880, color: 0xb8e8eb },
  { mirrors: [2840], gate: 3570, color: 0x8bdbcb, crate: { kind: 'ordinary', platform: 1, weight: 1000, plate: 1190, gate: 1310 } },
  { mirrors: [1050, 1690], gate: 2400, color: 0xe9c49c },
  { mirrors: [2830], gate: 3540, color: 0xc7adf5, crate: { kind: 'shadow', platform: 2, weight: 1610, plate: 1780, gate: 1870 } },
  { mirrors: [1080, 1690, 2250], gate: 2940, color: 0xf4d199, crate: { kind: 'shadow', platform: 1, weight: 990, plate: 1170, gate: 1300 } },
];

// Anchoring the Shadow inside a lens captures a reflection. Captured rays stay
// aligned, so the player can walk back, reposition the Shadow and build a chain.
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
    if (this.area === 4) this.makeLever(2840, 3450);
    for (const x of config.mirrors) this.makeMirror(x);
    this.makeReflectionGate(config.gate);
    if (this.area === 0) scene.cinematics.pulse('REFLECTION', 'Anchor the Shadow in a lens. It can turn the light.', config.color, 3600);
  }

  platformAt(x) {
    return this.scene.platforms.find(p => x * this.scale >= p.left && x * this.scale <= p.right);
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
    const mirror = { point, source, receiver, fixture, eye, lit: false };
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
  }

  openReflectionGate(announce = true) {
    if (this.reflectionGate.open) return;
    this.reflectionGate.open = true;
    this.reflectionGate.wall.body.enable = false;
    this.reflectionGate.art.setOpen(true);
    if (announce) this.scene.cinematics.pulse('THE PATH OPENS', 'The light remembers the path your shadow chose.', this.color, 1800);
  }

  snapshot() { return { ...super.snapshot(), mirrors: this.mirrors.map(m => m.lit) }; }

  restore(data) {
    super.restore(data);
    data?.mirrors?.forEach((lit, index) => { if (lit && this.mirrors[index]) this.lightMirror(this.mirrors[index]); });
    if (this.mirrors.every(m => m.lit)) this.openReflectionGate(false);
  }

  update(time) {
    super.update(time);
    const shadow = this.scene.shadow;
    for (const mirror of this.mirrors) {
      if (!mirror.lit && shadow?.isAnchoredNear(mirror.point.x, mirror.point.y, 118 * this.scale)) this.lightMirror(mirror);
    }
    if (this.mirrors.every(m => m.lit)) this.openReflectionGate();
    const g = this.rays.clear();
    for (const mirror of this.mirrors) {
      const { source, point, receiver } = mirror;
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
}
