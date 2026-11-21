import Phaser from 'phaser';
import { ChapterTwoMechanics } from './ChapterTwoMechanics.js';
import { gate as gateArt, hideShape, receptor, seal } from '../puzzles/PropArt.js';
import { Skitterer } from '../enemies/Skitterer.js';
import { fixedLayerOffset, sharpenText } from '../rendering.js';
import { sfx } from '../combat/sfx.js';

// Radio frequencies alter the world: low stabilizes, middle reveals, and high
// attracts danger. Later areas combine tuning with the earlier puzzle tools.
const PLANS = [
  { relays: [], radioLocks: [[1120, 1270, [1, 0]]], bridges: [[1390, 1540, 670, 1]], color: 0x86c7d4,
    title: 'THE RADIO', instruction: 'Tune with 1, 2, 3. Middle reveals hidden paths. At the console, press E in the order shown.' },
  { relays: [[1120, 1270]], crate: { kind: 'shadow', platform: 4, weight: 2810, plate: 3020, gate: 3500 },
    bridges: [[2000, 2150, 675, 0]], color: 0xe4b178, title: 'BONE CONDUIT',
    instruction: 'Low stabilizes the machine bridge. Send one pulse, then let the Shadow carry the relic.' },
  { relays: [], radioLocks: [[1710, 1900, [1, 2, 0], true]], prism: 1600,
    beam: [2900, 2810], color: 0xa6a7ee, title: 'MIRROR WELL',
    instruction: 'Anchor the Shadow in the prism. Tune the three-note sequence while the light is held.' },
  { relays: [], radioLocks: [[2260, 2440, [0, 2]]], crate: { kind: 'ordinary', platform: 1, weight: 960, plate: 1140, gate: 1270 },
    bridges: [[3190, 3340, 638, 1]], highDanger: true, color: 0xcbbda2, title: 'SILENT ENGINE',
    instruction: 'Push the weight, tune the engine, then reveal the path. High draws the things in the dark.' },
  { relays: [[1120, 1270]], radioLocks: [[2260, 2440, [0, 1, 2]], [3440, 3550, [2, 0, 1]]],
    beam: [2900, 2810], highDanger: true, color: 0x8fe6dc, title: 'DEEP TRANSMITTER',
    instruction: 'Combine one Shadow pulse, two radio sequences, and a dangerous beam.' },
  { relays: [], shoreCollapse: true, radio: true, color: 0x9ad7e6,
    title: 'THE LAST SHORE', instruction: 'The coast gives way behind you. Low frequency steadies it; high makes it break faster.' },
  { relays: [], crates: [
    { kind: 'ordinary', platform: 1, weight: 960, plate: 1140, gate: 1270 },
    { kind: 'shadow', platform: 4, weight: 2810, plate: 3000, gate: 3500 },
  ], bridges: [[2000, 2150, 675, 1]], color: 0xe4a8c7, title: 'TWO HANDS',
    instruction: 'The Keeper moves one weight, the Shadow carries the other. Middle reveals the route between.' },
  { relays: [[2260, 2440]], radioLocks: [[1120, 1270, [2, 0]]], beams: [[1680, 1600, true], [3430, 3400, false]],
    highDanger: true, color: 0xe2b477, title: 'THE RED CATHEDRAL',
    instruction: 'Tune the radio, silence a beam, send a pulse, and cross the sustained light.' },
  { relays: [], radioLocks: [[2260, 2440, [1, 2, 0]]],
    beams: [[1680, 1600, false], [2900, 2810, true], [3450, 3400, false]], reflection: [3070, 3580],
    highDanger: true, color: 0xaab7f4, title: 'NIGHT ARRAY',
    instruction: 'Tune the radio, capture light in the reflection lens, then silence the last beam.' },
  { relays: [[1120, 1270]], radioLocks: [[2260, 2440, [0, 1, 2]]], crates: [
    { kind: 'ordinary', platform: 2, weight: 1610, plate: 1810, gate: 1900 },
    { kind: 'shadow', platform: 4, weight: 2810, plate: 3000, gate: 3070 },
  ], beams: [[3430, 3400, true]], highDanger: true, color: 0xf0cf94, final: true,
    title: 'THE THRESHOLD', instruction: 'Bring together the radio, pulse, both weights, the beam, and the last Shadow lens.' },
];

export class DeepSignalMechanics extends ChapterTwoMechanics {
  constructor(scene) {
    super(scene, { autoBuild: false });
    this.plan = PLANS[scene.levelIndex - 15];
    this.relays = [];
    this.radioLocks = [];
    this.bridges = [];
    this.radioFrequency = 0;
    this.nextRadioSpawnAt = scene.time.now + 6500;
    this.prism = null;
    this.reflectionLens = null;
    this.color = this.plan.color;
    if (this.plan.crate) this.makePuzzle(this.plan.crate);
    for (const crate of this.plan.crates ?? []) this.makePuzzle(crate);
    if (this.plan.beam) this.makeBeam(this.plan.beam[0], this.plan.beam[1], { color: this.color, pulsing: true });
    for (const [beam, receiver, pulsing] of this.plan.beams ?? []) this.makeBeam(beam, receiver, { color: this.color, pulsing });
    for (const [station, gate] of this.plan.relays) this.makeRelay(station, gate);
    for (const [station, gate, sequence, prismRequired] of this.plan.radioLocks ?? [])
      this.makeRadioLock(station, gate, sequence, prismRequired);
    if (this.plan.prism) this.makePrism(this.plan.prism);
    if (this.plan.reflection) this.makeReflectionLens(...this.plan.reflection);
    for (const bridge of this.plan.bridges ?? []) this.makeFrequencyBridge(...bridge);
    if (scene.stage.chapter >= 4) this.buildRadioDisplay();
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
      const pace = [1.65, 1, .66][this.radioFrequency];
      if (shelf.fallen || !shelf.triggeredAt || time - shelf.triggeredAt < shelf.delay * pace) continue;
      shelf.fallen = true;
      shelf.surface.body.enable = false;
      this.scene.tweens.add({ targets: shelf.art, y: shelf.art.y + 170 * this.scale, angle: 15, alpha: 0,
        duration: 600, ease: 'Cubic.easeIn' });
    }
  }

  platformAt(x) { return this.scene.platforms.find(p => x * this.scale >= p.left && x * this.scale <= p.right); }

  makeRadioLock(stationX, gateX, sequence, prismRequired = false) {
    const scene = this.scene, s = this.scale;
    const floor = this.platformAt(stationX).y;
    const station = { x: stationX * s, y: floor - 72 * s };
    const gateFloor = this.platformAt(gateX).y;
    const wall = hideShape(scene.add.rectangle(gateX * s, gateFloor / 2, 33 * s, gateFloor, 0, 0));
    scene.physics.add.existing(wall, true);
    scene.physics.add.collider(scene.player, wall);
    const art = gateArt(scene, gateX * s, gateFloor, s, this.color);
    const consoleArt = scene.add.graphics().setPosition(station.x, station.y).setDepth(6);
    consoleArt.fillStyle(0x121a20, 1).fillRoundedRect(-39 * s, -38 * s, 78 * s, 76 * s, 7 * s);
    consoleArt.lineStyle(3 * s, this.color, .9).strokeRoundedRect(-39 * s, -38 * s, 78 * s, 76 * s, 7 * s);
    consoleArt.fillStyle(0x03141b, 1).fillRoundedRect(-29 * s, -25 * s, 58 * s, 31 * s, 3 * s);
    for (let i = 0; i < 3; i++) consoleArt.fillStyle([0x95d7d7, 0xf2cb83, 0xe87987][i], .85).fillCircle((i - 1) * 18 * s, 21 * s, 5 * s);
    const label = scene.add.text(station.x, station.y - 83 * s, sequence.map(n => n + 1).join('  ›  '), {
      fontFamily: 'Arial, sans-serif', fontSize: `${Math.round(23 * s)}px`, color: '#f3e7c9',
      backgroundColor: '#101923', padding: { x: 7, y: 4 },
    }).setOrigin(.5).setDepth(8);
    const lock = { station, wall, art, consoleArt, label, sequence, prismRequired, progress: 0, open: false };
    this.radioLocks.push(lock);
    this.hints.push({ key: 'E', at: () => station, active: () => !lock.open && !scene.shadow?.controlling
      && Math.abs(scene.player.x - station.x) < 95 * s && Math.abs(scene.player.y - station.y) < 150 * s });
  }

  makePrism(x) {
    const scene = this.scene, s = this.scale, floor = this.platformAt(x).y;
    const point = { x: x * s, y: floor - 72 * s };
    this.prism = { point, art: receptor(scene, point.x, point.y, s, 0xa6a7ee, 0xffdbab) };
    this.hints.push({ key: 'F', at: () => point, active: () => !!scene.shadow?.controlling
      && Math.hypot(scene.shadow.actor.x - point.x, scene.shadow.actor.y - point.y) < 120 * s });
  }

  makeReflectionLens(x, gateX) {
    const scene = this.scene, s = this.scale, floor = this.platformAt(x).y;
    const point = { x: x * s, y: floor - 78 * s };
    const source = { x: (x - 170) * s, y: 320 * s };
    const receiver = { x: (x + 180) * s, y: 315 * s };
    const fixture = seal(scene, point.x, point.y, s, this.color);
    const eye = receptor(scene, receiver.x, receiver.y, s, this.color, 0xffe4b0);
    const lamp = scene.add.circle(source.x, source.y, 19 * s, this.color, .8).setStrokeStyle(5 * s, 0x121825).setDepth(5);
    const wire = scene.add.graphics().setDepth(4).setBlendMode(Phaser.BlendModes.ADD);
    const gateFloor = this.platformAt(gateX).y;
    const wall = hideShape(scene.add.rectangle(gateX * s, gateFloor / 2, 33 * s, gateFloor, 0, 0));
    scene.physics.add.existing(wall, true);
    scene.physics.add.collider(scene.player, wall);
    const art = gateArt(scene, gateX * s, gateFloor, s, this.color);
    this.reflectionLens = { point, source, receiver, fixture, eye, lamp, wire, wall, art, lit: false };
    this.hints.push({ key: 'F', at: () => point, active: () => !this.reflectionLens.lit && !!scene.shadow?.controlling
      && Math.hypot(scene.shadow.actor.x - point.x, scene.shadow.actor.y - point.y) < 120 * s });
  }

  lightReflectionLens() {
    const lens = this.reflectionLens;
    if (!lens || lens.lit) return;
    lens.lit = true;
    lens.fixture.setActive(true);
    lens.eye.setActive(true);
    lens.wall.body.enable = false;
    lens.art.setOpen(true);
    this.scene.flashAt(lens.point.x, lens.point.y, this.color);
    this.scene.cinematics.pulse('BORROWED LIGHT', 'The reflected beam opens the path. Release the Shadow and cross.', this.color, 1700);
  }

  makeFrequencyBridge(start, end, top, frequency) {
    const scene = this.scene, s = this.scale;
    const x = (start + end) * s / 2, y = top * s, width = (end - start) * s;
    const surface = hideShape(scene.add.rectangle(x, y + 8 * s, width, 16 * s, 0, 0));
    scene.physics.add.existing(surface, true);
    scene.physics.add.collider(scene.player, surface);
    if (scene.shadow?.actor) scene.physics.add.collider(scene.shadow.actor, surface);
    const art = scene.add.graphics().setDepth(5);
    art.fillStyle(0x212d36, 1).fillRect(x - width / 2, y, width, 14 * s);
    art.lineStyle(3 * s, this.color, .9).lineBetween(x - width / 2, y, x + width / 2, y);
    for (let i = 0; i < 5; i++) art.fillStyle(this.color, .7).fillCircle(x - width * .4 + i * width * .2, y + 7 * s, 2.5 * s);
    this.bridges.push({ surface, art, frequency });
  }

  buildRadioDisplay() {
    const scene = this.scene, { viewportWidth: w, viewportHeight: h } = scene;
    const offset = fixedLayerOffset(w, h);
    const root = scene.add.container(offset.x + w - 180, offset.y + 44).setScrollFactor(0).setDepth(35);
    const panel = scene.add.graphics();
    panel.fillStyle(0x071017, .78).fillRoundedRect(-150, -24, 170, 67, 8);
    panel.lineStyle(1.5, this.color, .7).strokeRoundedRect(-150, -24, 170, 67, 8);
    const title = scene.add.text(-140, -15, 'RADIO  1 / 2 / 3', { fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#e4e2d7' });
    const state = scene.add.text(-140, 6, '', { fontFamily: 'Georgia, serif', fontSize: '18px', color: '#f2d79e' });
    root.add([panel, title, state]);
    this.radioDisplay = { root, state };
    this.radioKeys = scene.input.keyboard.addKeys({ low: Phaser.Input.Keyboard.KeyCodes.ONE,
      middle: Phaser.Input.Keyboard.KeyCodes.TWO, high: Phaser.Input.Keyboard.KeyCodes.THREE });
    this.setFrequency(0, false);
    sharpenText(scene);
  }

  setFrequency(frequency, announce = true) {
    this.radioFrequency = frequency;
    const names = ['LOW · steady', 'MIDDLE · reveal', 'HIGH · danger'];
    this.radioDisplay.state.setText(names[frequency]);
    this.radioDisplay.state.setColor(['#acd6d7', '#f1d18e', '#ef8790'][frequency]);
    if (announce) {
      sfx.radio(this.scene, frequency);
      this.scene.announce(`RADIO: ${names[frequency].toUpperCase()}`, this.color);
    }
    for (const bridge of this.bridges) {
      const active = bridge.frequency === frequency;
      bridge.surface.body.enable = active;
      bridge.art.setAlpha(active ? 1 : .09);
    }
  }

  openRadioLock(lock) {
    lock.open = true;
    lock.wall.body.enable = false;
    lock.art.setOpen(true);
    lock.label.setText('SIGNAL HELD').setColor('#b6eee4');
    lock.consoleArt.setAlpha(.7);
  }

  updateRadio(time) {
    if (Phaser.Input.Keyboard.JustDown(this.radioKeys.low)) this.setFrequency(0);
    if (Phaser.Input.Keyboard.JustDown(this.radioKeys.middle)) this.setFrequency(1);
    if (Phaser.Input.Keyboard.JustDown(this.radioKeys.high)) this.setFrequency(2);
    if (this.prism) this.prism.art.setActive(!!this.scene.shadow?.isAnchoredNear(
      this.prism.point.x, this.prism.point.y, 115 * this.scale));
    if (!this.plan.highDanger || this.radioFrequency !== 2 || time < this.nextRadioSpawnAt) return;
    this.nextRadioSpawnAt = time + 9000;
    const scene = this.scene;
    if (scene.stage.arena?.boss === 'dead-frequency'
      && scene.player.x >= scene.stage.arena.start * scene.artScale - scene.spriteHeight * 2) return;
    const alive = scene.enemies.list.filter(e => e.radioSummoned && e.alive).length;
    if (alive >= 2 || scene.arena?.state === 'fighting') return;
    const platform = scene.platforms.find(p => scene.player.x >= p.left && scene.player.x <= p.right);
    if (!platform || platform.right - platform.left < scene.spriteHeight * 2.5) return;
    const x = Phaser.Math.Clamp(scene.player.x + scene.spriteHeight * 1.6,
      platform.left + scene.spriteHeight, platform.right - scene.spriteHeight);
    const enemy = new Skitterer(scene, x, platform);
    enemy.summoned = enemy.radioSummoned = true;
    scene.enemies.list.push(enemy);
    scene.announce('THE HIGH SIGNAL DREW SOMETHING NEAR', 0xe87987);
  }

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
    const lock = this.radioLocks.find(r => !r.open && Math.abs(scene.player.x - r.station.x) < 95 * s
      && Math.abs(scene.player.y - r.station.y) < 150 * s);
    if (lock) {
      if (lock.prismRequired && !scene.shadow?.isAnchoredNear(this.prism.point.x, this.prism.point.y, 115 * s)) {
        scene.announce('THE SHADOW MUST HOLD THE PRISM', this.color);
        return;
      }
      if (lock.sequence[lock.progress] === this.radioFrequency) {
        lock.progress++;
        sfx.radio(scene, this.radioFrequency);
        scene.flashAt(lock.station.x, lock.station.y, this.color);
        if (lock.progress === lock.sequence.length) {
          this.openRadioLock(lock);
          scene.cinematics.pulse('FREQUENCY LOCKED', 'The path responds to the complete signal.', this.color, 1150);
        } else scene.announce(`SIGNAL ${lock.progress}/${lock.sequence.length} — NEXT: ${lock.sequence[lock.progress] + 1}`, this.color);
      } else {
        lock.progress = 0;
        scene.announce(`WRONG FREQUENCY — START AGAIN WITH ${lock.sequence[0] + 1}`, 0xe87987);
      }
      return;
    }
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
    this.updateRadio(time);
    if (this.plan.shoreCollapse) this.updateShoreCollapse(time);
    const scene = this.scene, shadow = scene.shadow;
    if (this.reflectionLens) {
      const lens = this.reflectionLens;
      if (!lens.lit && shadow?.isAnchoredNear(lens.point.x, lens.point.y, 118 * this.scale)) this.lightReflectionLens();
      const g = lens.wire.clear();
      g.lineStyle(4 * this.scale, this.color, .55).lineBetween(lens.source.x, lens.source.y, lens.point.x, lens.point.y);
      g.lineStyle(lens.lit ? 5 * this.scale : 2 * this.scale, lens.lit ? 0xfff0ca : this.color, lens.lit ? .8 : .2)
        .lineBetween(lens.point.x, lens.point.y, lens.receiver.x, lens.receiver.y);
    }
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
      && this.relays.every(r => r.open) && this.radioLocks.every(r => r.open) && this.puzzles.every(p => p.lit)) {
      this.finalLens.lit = true;
      this.finalLens.fixture.setActive(true);
      this.finalLens.wall.body.enable = false;
      this.finalLens.art.setOpen(true);
      scene.cinematics.pulse('THE THRESHOLD ANSWERS', 'The final signal reaches the other side.', this.color, 2400);
    }
  }

  snapshot() { return { ...super.snapshot(), relays: this.relays.map(r => r.open),
    radioFrequency: this.radioFrequency, radioLocks: this.radioLocks.map(r => ({ progress: r.progress, open: r.open })),
    reflectionLens: !!this.reflectionLens?.lit, finalLens: !!this.finalLens?.lit }; }

  restore(data) {
    super.restore(data);
    data?.relays?.forEach((open, index) => {
      const relay = this.relays[index];
      if (!open || !relay) return;
      relay.open = true; relay.wall.body.enable = false; relay.art.setOpen(true); relay.pad.setActive(true); relay.eye.setActive(true);
    });
    if (Number.isInteger(data?.radioFrequency) && data.radioFrequency >= 0 && data.radioFrequency <= 2)
      this.setFrequency(data.radioFrequency, false);
    data?.radioLocks?.forEach((saved, index) => {
      const lock = this.radioLocks[index];
      if (!lock) return;
      if (saved.open) this.openRadioLock(lock);
      else if (Number.isInteger(saved.progress)) lock.progress = Phaser.Math.Clamp(saved.progress, 0, lock.sequence.length - 1);
    });
    if (data?.reflectionLens && this.reflectionLens) {
      const lens = this.reflectionLens;
      lens.lit = true; lens.fixture.setActive(true); lens.eye.setActive(true);
      lens.wall.body.enable = false; lens.art.setOpen(true);
    }
    if (data?.finalLens && this.finalLens) {
      this.finalLens.lit = true; this.finalLens.fixture.setActive(true);
      this.finalLens.wall.body.enable = false; this.finalLens.art.setOpen(true);
    }
  }
}
