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
  { relays: [[1120, 1270], [2260, 2440]], beam: [2900, 2810], color: 0x9ad7e6 },
  { relays: [[1120, 1270], [2260, 2440], [2890, 3070]], crate: { kind: 'shadow', platform: 4, weight: 2810, plate: 3010, gate: 3500 }, color: 0xe4a8c7 },
  { relays: [[1120, 1270], [2260, 2440]], crate: { kind: 'ordinary', platform: 4, weight: 2810, plate: 3020, gate: 3500 }, beam: [3440, 3400], color: 0xe2b477 },
  { relays: [[1120, 1270], [2260, 2440], [2890, 3070]], beam: [3480, 3400], color: 0xaab7f4 },
  { relays: [[1120, 1270], [2260, 2440], [2890, 3070]], crate: { kind: 'shadow', platform: 4, weight: 2810, plate: 3000, gate: 3500 }, beam: [3430, 3400], color: 0xf0cf94, final: true },
];

export class DeepSignalMechanics extends ChapterTwoMechanics {
  constructor(scene) {
    super(scene, { autoBuild: false });
    this.plan = PLANS[scene.levelIndex - 15];
    this.relays = [];
    this.color = this.plan.color;
    if (this.plan.crate) this.makePuzzle(this.plan.crate);
    if (this.plan.beam) this.makeBeam(this.plan.beam[0], this.plan.beam[1], { color: this.color, pulsing: true });
    for (const [station, gate] of this.plan.relays) this.makeRelay(station, gate);
    if (this.plan.final) this.makeFinalLens();
    scene.cinematics.pulse(scene.stage.chapter === 4 ? 'THE SIGNAL PULSE' : 'THE LAST CIRCUIT',
      scene.stage.chapter === 4 ? 'Press E at a relay. Anchor the Shadow in its receiver before the pulse fades.'
        : 'Link the relays, carry the weight, redirect the beam, and hold the final lens.', this.color, 3000);
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
