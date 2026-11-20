import Phaser from 'phaser';
import { ChapterTwoMechanics } from './ChapterTwoMechanics.js';
import { gate as gateArt, hideShape, receptor, seal } from '../puzzles/PropArt.js';

// Chapter 4 teaches a signal pulse: the Keeper sends it with E, then anchors
// the Shadow in a receiver before the pulse expires. Chapter 5 layers those
// relays with the previously learned grasp, beam and reflection puzzles.
const PLANS = [
  { relays: [[1120, 1270]], color: 0x86c7d4 },
  { relays: [[1120, 1270], [2260, 2440]], crate: { kind: 'shadow', platform: 4, weight: 2810, plate: 3020, gate: 3500 }, color: 0xe4b178 },
  { relays: [[1120, 1270], [2260, 2440]], beam: [2920, 2820], color: 0xa6a7ee },
  { relays: [[1120, 1270], [2260, 2440]], crate: { kind: 'ordinary', platform: 4, weight: 2810, plate: 3010, gate: 3500 }, color: 0xcbbda2 },
  { relays: [[1120, 1270], [2260, 2440], [2890, 3070]], beam: [3480, 3400], color: 0x8fe6dc },
  { relays: [], shoreCollapse: true, color: 0x9ad7e6,
    title: 'THE LAST SHORE', instruction: 'The coast gives way behind you. Keep moving across the broken path.' },
  { relays: [], crates: [
    { kind: 'ordinary', platform: 1, weight: 960, plate: 1140, gate: 1270 },
    { kind: 'shadow', platform: 4, weight: 2810, plate: 3000, gate: 3500 },
  ], color: 0xe4a8c7, title: 'TWO HANDS', instruction: 'The Keeper moves one weight. Only the Shadow can carry the other.' },
  { relays: [[2260, 2440]], beams: [[1680, 1600, true], [3430, 3400, false]], color: 0xe2b477,
    title: 'THE RED CATHEDRAL', instruction: 'Silence the first beam, send one signal, then cross the unbroken light.' },
  { relays: [], beams: [[1680, 1600, false], [2900, 2810, true], [3450, 3400, false]], color: 0xaab7f4,
    title: 'NIGHT ARRAY', instruction: 'Three beams divide the path. Anchor the Shadow at each receiver and move the Keeper through.' },
  { relays: [[1120, 1270], [2260, 2440]], crates: [
    { kind: 'ordinary', platform: 2, weight: 1610, plate: 1810, gate: 1900 },
    { kind: 'shadow', platform: 4, weight: 2810, plate: 3000, gate: 3070 },
  ], beams: [[3430, 3400, true]], color: 0xf0cf94, final: true,
    title: 'THE THRESHOLD', instruction: 'Time two signals, move both kinds of weight, silence the beam, then align the last lens.' },
];

export class DeepSignalMechanics extends ChapterTwoMechanics {
  constructor(scene) {
    super(scene, { autoBuild: false });
    this.plan = PLANS[scene.levelIndex - 15];
    this.relays = [];
    this.color = this.plan.color;
    if (this.plan.crate) this.makePuzzle(this.plan.crate);
    for (const crate of this.plan.crates ?? []) this.makePuzzle(crate);
    if (this.plan.beam) this.makeBeam(this.plan.beam[0], this.plan.beam[1], { color: this.color, pulsing: true });
    for (const [beam, receiver, pulsing] of this.plan.beams ?? []) this.makeBeam(beam, receiver, { color: this.color, pulsing });
    for (const [station, gate] of this.plan.relays) this.makeRelay(station, gate);
    if (this.plan.shoreCollapse) this.buildShoreCollapse();
    if (this.plan.final) this.makeFinalLens();
    scene.cinematics.pulse(this.plan.title ?? 'THE SIGNAL PULSE', this.plan.instruction
      ?? 'Press E at a relay. Anchor the Shadow in its receiver before the pulse fades.', this.color, 3000);
  }

  buildShoreCollapse() {
    const scene = this.scene, s = this.scale;
    this.shoreShelves = [[745, 905, 710], [1385, 1545, 670], [1995, 2155, 675]].map(([start, end, top], index) => {
      const x = (start + end) * s / 2, y = top * s, width = (end - start) * s;
      const surface = hideShape(scene.add.rectangle(x, y + 7 * s, width, 16 * s, 0, 0));
      scene.physics.add.existing(surface, true);
      scene.physics.add.collider(scene.player, surface);
      if (scene.shadow?.actor) scene.physics.add.collider(scene.shadow.actor, surface);
      const art = scene.add.rectangle(x, y + 6 * s, width, 13 * s, 0x263b4b, 1)
        .setStrokeStyle(3 * s, this.color, .75).setDepth(4);
      return { start: start * s, end: end * s, surface, art, triggeredAt: 0, delay: 690 - index * 90, fallen: false };
    });
  }

  updateShoreCollapse(time) {
    for (const shelf of this.shoreShelves ?? []) {
      if (!shelf.triggeredAt && this.scene.player.x >= shelf.start && this.scene.player.x <= shelf.end) shelf.triggeredAt = time;
      if (shelf.fallen || !shelf.triggeredAt || time - shelf.triggeredAt < shelf.delay) continue;
      shelf.fallen = true;
      shelf.surface.body.enable = false;
      this.scene.tweens.add({ targets: shelf.art, y: shelf.art.y + 170 * this.scale, angle: 15, alpha: 0,
        duration: 600, ease: 'Cubic.easeIn' });
    }
  }

  platformAt(x) { return this.scene.platforms.find(p => x * this.scale >= p.left && x * this.scale <= p.right); }

  makeRelay(stationX, gateX) {
    const scene = this.scene, s = this.scale;
    const floor = this.platformAt(stationX).y;
    const station = { x: stationX * s, y: floor - 66 * s };
    const gateFloor = this.platformAt(gateX).y;
    const receiverPoint = { x: (stationX + 78) * s, y: floor - 72 * s };
    const pad = seal(scene, station.x, station.y, s, this.color);
    const eye = receptor(scene, receiverPoint.x, receiverPoint.y, s, this.color, 0xffdca0);
    const wall = hideShape(scene.add.rectangle(gateX * s, gateFloor / 2, 33 * s, gateFloor, 0, 0));
    scene.physics.add.existing(wall, true);
    scene.physics.add.collider(scene.player, wall);
    const art = gateArt(scene, gateX * s, gateFloor, s, this.color);
    const wire = scene.add.graphics().setDepth(4);
    wire.lineStyle(4 * s, this.color, .45).lineBetween(station.x, station.y, receiverPoint.x, receiverPoint.y);
    wire.lineBetween(receiverPoint.x, receiverPoint.y, gateX * s, gateFloor - 80 * s);
    const relay = { station, receiverPoint, pad, eye, wall, art, chargedUntil: 0, open: false };
    this.relays.push(relay);
    this.hints.push({ key: 'E', at: () => station, active: () => !relay.open && !scene.shadow?.controlling && Math.abs(scene.player.x - station.x) < 100 * s });
    this.hints.push({ key: 'F', at: () => receiverPoint, active: () => !relay.open && !!scene.shadow?.controlling
      && Math.hypot(scene.shadow.actor.x - receiverPoint.x, scene.shadow.actor.y - receiverPoint.y) < 125 * s });
  }

  makeFinalLens() {
    const scene = this.scene, s = this.scale, floor = this.platformAt(3950).y;
    const point = { x: 3950 * s, y: floor - 80 * s };
    const fixture = seal(scene, point.x, point.y, s, this.color);
    const wall = hideShape(scene.add.rectangle(4040 * s, floor / 2, 30 * s, floor, 0, 0));
    scene.physics.add.existing(wall, true);
    scene.physics.add.collider(scene.player, wall);
    const art = gateArt(scene, 4040 * s, floor, s, this.color);
    this.finalLens = { point, fixture, wall, art, lit: false };
    this.hints.push({ key: 'F', at: () => point, active: () => !this.finalLens.lit && !!scene.shadow?.controlling
      && Math.hypot(scene.shadow.actor.x - point.x, scene.shadow.actor.y - point.y) < 120 * s });
  }

  interact() {
    const scene = this.scene, s = this.scale;
    const relay = this.relays.find(r => !r.open && Math.abs(scene.player.x - r.station.x) < 100 * s
      && Math.abs(scene.player.y - r.station.y) < 155 * s);
    if (relay) {
      relay.chargedUntil = scene.time.now + (scene.stage.chapter === 5 ? 6500 : 9000);
      relay.pad.setActive(true);
      scene.flashAt(relay.station.x, relay.station.y, this.color);
      scene.announce('SIGNAL SENT — ANCHOR THE SHADOW IN THE RECEIVER', this.color);
      return;
    }
    super.interact();
  }

  update(time) {
    super.update(time);
    if (this.plan.shoreCollapse) this.updateShoreCollapse(time);
    const scene = this.scene, shadow = scene.shadow;
    for (const relay of this.relays) {
      if (relay.open) continue;
      if (relay.chargedUntil > time && shadow?.isAnchoredNear(relay.receiverPoint.x, relay.receiverPoint.y, 105 * this.scale)) {
        relay.open = true;
        relay.wall.body.enable = false;
        relay.art.setOpen(true);
        relay.eye.setActive(true);
        scene.flashAt(relay.receiverPoint.x, relay.receiverPoint.y, this.color);
        scene.cinematics.pulse('SIGNAL HELD', 'The Shadow kept the pulse alive.', this.color, 1100);
      } else if (relay.chargedUntil && time >= relay.chargedUntil) {
        relay.chargedUntil = 0;
        relay.pad.setActive(false);
      }
    }
    if (this.finalLens && !this.finalLens.lit && shadow?.isAnchoredNear(this.finalLens.point.x, this.finalLens.point.y, 110 * this.scale)
      && this.relays.every(r => r.open) && this.puzzles.every(p => p.lit)) {
      this.finalLens.lit = true;
      this.finalLens.fixture.setActive(true);
      this.finalLens.wall.body.enable = false;
      this.finalLens.art.setOpen(true);
      scene.cinematics.pulse('THE THRESHOLD ANSWERS', 'The final signal reaches the other side.', this.color, 2400);
    }
  }

  snapshot() { return { ...super.snapshot(), relays: this.relays.map(r => r.open), finalLens: !!this.finalLens?.lit }; }

  restore(data) {
    super.restore(data);
    data?.relays?.forEach((open, index) => {
      const relay = this.relays[index];
      if (!open || !relay) return;
      relay.open = true; relay.wall.body.enable = false; relay.art.setOpen(true); relay.pad.setActive(true); relay.eye.setActive(true);
    });
    if (data?.finalLens && this.finalLens) {
      this.finalLens.lit = true; this.finalLens.fixture.setActive(true);
      this.finalLens.wall.body.enable = false; this.finalLens.art.setOpen(true);
    }
  }
}
