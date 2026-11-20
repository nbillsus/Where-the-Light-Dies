import {
  beamEmitter, crate as crateArt, gate as gateArt, hideShape, lever as leverArt, link, plate as plateArt,
  receptor as receptorArt, relic as relicArt,
} from '../puzzles/PropArt.js';

const RED = 0xf36a65;
const GOLD = 0xffc984;
const GHOST = 0xaddde9;

// Each area adds a different beat. Only the first, fourth and final areas
// ask the shadow to carry an object; ordinary crates are pushed by the boy.
export class ChapterTwoMechanics {
  constructor(scene) {
    this.scene = scene;
    this.scale = scene.artScale;
    this.area = scene.levelIndex - 5;
    this.prompt = '';
    this.held = null;
    this.puzzles = [];
    this.beams = [];
    this.levers = [];
    this.hints = [];
    this.links = [];
    if (this.area === 0) {
      this.makePuzzle({ kind: 'shadow', platform: 2, weight: 1550, plate: 1810, gate: 2240 });
      scene.cinematics.pulse('GRASP', 'The shadow can carry what the Keeper cannot.', GHOST, 3100);
    } else if (this.area === 1) {
      this.makePuzzle({ kind: 'ordinary', platform: 1, weight: 970, plate: 1210, gate: 1700 });
      this.makeBeam(2320, 2110, { color: GOLD, pulsing: true });
      this.makeLever(2850, 3450);
    } else if (this.area === 2) {
      this.makeBeam(1640, 1480, { color: 0x8be2dc, pulsing: true });
      this.makeBeam(3360, 3200, { color: RED, pulsing: false });
    } else if (this.area === 3) {
      this.makeBeam(1510, 1500, { color: 0xc49de8, pulsing: true });
      this.makePuzzle({ kind: 'shadow', platform: 3, weight: 2130, plate: 2390, gate: 2850 });
    } else {
      this.makePuzzle({ kind: 'ordinary', platform: 1, weight: 990, plate: 1230, gate: 1690 });
      this.makeBeam(2320, 2140, { color: RED, pulsing: true });
      this.makePuzzle({ kind: 'shadow', platform: 4, weight: 2730, plate: 2980, gate: 3490 });
    }
  }

  near(a, b, radius) { return Math.hypot(a.x - b.x, a.y - b.y) < radius * this.scale; }

  makePuzzle({ kind, platform, weight, plate, gate }) {
    const floor = this.scene.platforms[platform].y;
    const s = this.scale;
    const size = (kind === 'shadow' ? 52 : 66) * s;
    const x = weight * s;
    const block = hideShape(this.scene.add.rectangle(x, floor - size / 2 - 2, size, size, 0, 0));
    this.scene.physics.add.existing(block);
    block.body.setSize(size, size).setCollideWorldBounds(true).setDragX(kind === 'shadow' ? 760 : 450)
      .setMaxVelocity(230, 900);
    for (const ledge of this.scene.platforms) this.scene.physics.add.collider(block, ledge.zone);
    if (kind === 'ordinary') this.scene.physics.add.collider(this.scene.player, block);
    if (kind === 'shadow') relicArt(this.scene, block, size, s, GHOST);
    else crateArt(this.scene, block, size, s);
    const px = plate * s;
    const color = kind === 'shadow' ? GHOST : GOLD;
    const plateDrawing = plateArt(this.scene, px, floor, s, color);
    const gx = gate * s;
    const wall = hideShape(this.scene.add.rectangle(gx, floor / 2, 33 * s, floor, 0, 0));
    this.scene.physics.add.existing(wall, true);
    this.scene.physics.add.collider(this.scene.player, wall);
    const gateDrawing = gateArt(this.scene, gx, floor, s, color);
    const puzzle = { kind, block, plateX: px, floor, plateArt: plateDrawing, wall, gateArt: gateDrawing, gateX: gx, lit: false };
    this.puzzles.push(puzzle);
    this.links.push({ wire: link(this.scene, { x: px, y: floor - 14 * s }, gateDrawing.base, s, color), isLit: () => puzzle.lit });
    if (kind === 'shadow') {
      // Key icons: Q to send the Shadow, G to lift the relic, G again over the seal.
      const shadow = () => this.scene.shadow;
      const above = () => ({ x: block.x, y: block.y - size * .8 });
      this.hints.push({ key: 'G', at: above,
        active: () => !puzzle.lit && !this.held && !!shadow()?.controlling && this.near(shadow().actor, block, 125) });
      this.hints.push({ key: 'G', at: () => ({ x: px, y: floor - 30 * s }),
        active: () => this.held === puzzle && Math.abs(block.x - px) < 60 * s });
      this.hints.push({ key: 'Q', at: above,
        active: () => !puzzle.lit && !!shadow() && !shadow().detached && this.near(this.scene.player, block, 420) });
    }
  }

  makeBeam(x, receptorX, { color, pulsing }) {
    const s = this.scale, bx = x * s, rx = receptorX * s, ry = 530 * s;
    const h = this.scene.viewportHeight;
    const beam = this.scene.add.rectangle(bx, h * .42, 8 * s, h * .84, 0xfff0e6, .78).setDepth(4);
    const glow = this.scene.add.rectangle(bx, h * .42, 44 * s, h * .84, color, .18).setDepth(3).setBlendMode('ADD');
    const emitter = beamEmitter(this.scene, bx, h * .84, s, color);
    const receptor = receptorArt(this.scene, rx, ry, s, color, GOLD);
    const target = { x: rx, y: ry };
    const shadow = () => this.scene.shadow;
    this.links.push({ wire: link(this.scene, target, { x: bx, y: 46 * s }, s, GOLD, 'rune'),
      isLit: () => !!shadow()?.isAnchoredNear(rx, ry, 120 * s) });
    this.hints.push({ key: 'F', at: () => target,
      active: () => !!shadow()?.controlling && this.near(shadow().actor, target, 120) });
    this.beams.push({ x: bx, rx, ry, beam, glow, emitter, receptor, color, pulsing });
  }

  makeLever(x, gateX) {
    const s = this.scale, floor = this.scene.platforms[4].y;
    const art = leverArt(this.scene, x * s, floor - 70 * s, s, GOLD);
    const gateFloor = this.scene.platforms[5].y;
    const wall = hideShape(this.scene.add.rectangle(gateX * s, gateFloor / 2, 33 * s, gateFloor, 0, 0));
    this.scene.physics.add.existing(wall, true);
    this.scene.physics.add.collider(this.scene.player, wall);
    const gateDrawing = gateArt(this.scene, gateX * s, gateFloor, s, GOLD);
    const lever = { x: x * s, art, wall, gateArt: gateDrawing, active: false };
    this.levers.push(lever);
    this.links.push({ wire: link(this.scene, { x: x * s, y: floor - 59 * s }, gateDrawing.base, s, GOLD), isLit: () => lever.active });
    this.hints.push({ key: 'E', at: () => ({ x: x * s, y: floor - 70 * s }),
      active: () => !lever.active && !this.scene.shadow?.controlling && Math.abs(this.scene.player.x - lever.x) < 90 * s });
  }

  openLever(lever) {
    lever.active = true;
    lever.art.activate();
    lever.wall.body.enable = false;
    lever.gateArt.setOpen(true);
  }

  openPuzzle(puzzle) {
    puzzle.lit = true;
    puzzle.plateArt.setActive(true);
    puzzle.wall.body.enable = false;
    puzzle.gateArt.setOpen(true);
  }

  toggleGrasp() {
    const shadow = this.scene.shadow;
    if (!shadow?.detached || !shadow.controlling) return;
    if (this.held) {
      const block = this.held.block;
      this.held = null;
      block.body.enable = true;
      block.body.reset(block.x, block.y);
      block.body.setAllowGravity(true);
      return;
    }
    const actor = shadow.actor;
    const nearest = this.puzzles.find(p => p.kind === 'shadow' && !p.lit
      && Math.hypot(p.block.x - actor.x, p.block.y - actor.y) < 125 * this.scale);
    if (!nearest) return;
    this.held = nearest;
    nearest.block.body.enable = false;
  }

  interact() {
    const lever = this.levers.find(item => !item.active && Math.abs(this.scene.player.x - item.x) < 90 * this.scale);
    if (lever) this.openLever(lever);
  }

  snapshot() {
    return {
      puzzles: this.puzzles.map(p => ({ x: p.block.x / this.scale, y: p.block.y / this.scale, lit: p.lit })),
      levers: this.levers.map(l => l.active),
      held: this.held ? this.puzzles.indexOf(this.held) : -1,
    };
  }

  restore(data) {
    if (!data || typeof data !== 'object') return;
    data.puzzles?.forEach((saved, index) => {
      const p = this.puzzles[index];
      if (!p) return;
      if (Number.isFinite(saved.x) && Number.isFinite(saved.y)) p.block.body.reset(saved.x * this.scale, saved.y * this.scale);
      if (saved.lit) this.openPuzzle(p);
    });
    data.levers?.forEach((active, index) => {
      const lever = this.levers[index];
      if (lever && active) this.openLever(lever);
    });
    if (Number.isInteger(data.held) && data.held >= 0 && this.puzzles[data.held]?.kind === 'shadow') {
      this.held = this.puzzles[data.held];
      this.held.block.body.enable = false;
    }
  }

  update(time) {
    const actor = this.scene.shadow?.actor;
    if (this.held) {
      if (!this.scene.shadow?.detached) {
        const block = this.held.block;
        this.held = null;
        block.body.enable = true;
        block.body.reset(block.x, block.y);
      } else this.held.block.setPosition(actor.x, actor.body.bottom - 30 * this.scale);
    }
    for (const puzzle of this.puzzles) {
      if (puzzle.lit || this.held === puzzle) continue;
      const active = Math.abs(puzzle.block.x - puzzle.plateX) < 44 * this.scale
        && Math.abs(puzzle.block.body.bottom - puzzle.floor) < 28 * this.scale;
      if (active) this.openPuzzle(puzzle);
    }
    for (const beam of this.beams) {
      const anchored = this.scene.shadow?.isAnchoredNear(beam.rx, beam.ry, 120 * this.scale);
      const powered = !beam.pulsing || Math.sin(time * .003) > -.3;
      const dangerous = powered && !anchored;
      // A crackling, flickering beam while live; a faint trace when silenced.
      beam.beam.setAlpha(dangerous ? .7 + Math.random() * .25 : .05);
      beam.glow.setAlpha(dangerous ? .18 + Math.random() * .08 : .02);
      beam.emitter.setDangerous(dangerous);
      beam.receptor.setActive(!!anchored);
      if (dangerous && Math.abs(this.scene.player.x - beam.x) < 25 * this.scale
        && this.scene.player.body.bottom > 430 * this.scale) {
        this.scene.cameras.main.flash(320, 150, 24, 30);
        this.scene.cameras.main.shake(220, .006);
        this.scene.respawn();
      }
    }
    for (const { wire, isLit } of this.links) wire.setLit(!!isLit());
  }
}
