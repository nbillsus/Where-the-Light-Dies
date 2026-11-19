// The second chapter's grasp puzzles are separate from the signal chapter's
// machinery, so the two routes can be tuned independently.
import {
  beamEmitter, gate as gateArt, hideShape, link, plate as plateArt, receptor as receptorArt, weight as weightArt,
} from '../puzzles/PropArt.js';

const RED = 0xf36a65;
const GOLD = 0xffc984;

export class ChapterTwoMechanics {
  constructor(scene) {
    this.scene = scene;
    this.scale = scene.artScale;
    this.area = scene.levelIndex - 5;
    this.prompt = 'Q DETACH THE SHADOW  ·  G GRASP A WEIGHT';
    this.held = null;
    this.weights = [];
    this.plates = [];
    this.gates = [];
    this.beams = [];
    this.hints = [];
    this.links = [];
    this.makePuzzle(0, 1010, 1220, 1660);
    if (this.area > 0) this.makePuzzle(1, 2810, 2950, 3460);
    if (this.area > 0) this.makeBeam(2320, 2050, this.area >= 2);
    if (this.area >= 3) this.makeBeam(3600, 3330, this.area === 4);
    if (this.area === 0) scene.cinematics.pulse('GRASP', 'The shadow can carry what the Keeper cannot.', RED, 3200);
  }

  position(x, y) { return [x * this.scale, y * this.scale]; }

  makePuzzle(index, weightX, plateX, gateX) {
    const platformIndex = index ? 4 : 1;
    const floor = this.scene.platforms[platformIndex].y;
    const size = 56 * this.scale;
    const [x] = this.position(weightX, 0);
    const block = hideShape(this.scene.add.rectangle(x, floor - size / 2 - 2, size, size, 0, 0));
    this.scene.physics.add.existing(block);
    weightArt(this.scene, block, size, this.scale, RED);
    block.body.setSize(size, size).setCollideWorldBounds(true).setDragX(800).setMaxVelocity(250, 900);
    for (const ledge of this.scene.platforms) this.scene.physics.add.collider(block, ledge.zone);
    this.weights.push(block);
    const [platePos] = this.position(plateX, 0);
    const plate = { x: platePos, y: floor, art: plateArt(this.scene, platePos, floor, this.scale, RED), lit: false };
    this.plates.push(plate);
    const [gx] = this.position(gateX, 0);
    const gate = hideShape(this.scene.add.rectangle(gx, floor / 2, 32 * this.scale, floor, 0, 0));
    this.scene.physics.add.existing(gate, true);
    this.scene.physics.add.collider(this.scene.player, gate);
    const art = gateArt(this.scene, gx, floor, this.scale, RED);
    this.gates.push({ x: gx, object: gate, art, open: false });
    this.links.push({ wire: link(this.scene, { x: platePos, y: floor - 14 * this.scale }, art.base, this.scale, GOLD), isLit: () => plate.lit });
    // Key icons: Q to send the Shadow, G to lift the weight, G again over the plate.
    const shadow = () => this.scene.shadow;
    const near = (a, b, r) => Math.hypot(a.x - b.x, a.y - b.y) < r * this.scale;
    this.hints.push({ key: 'G', at: () => ({ x: block.x, y: block.y - size * .8 }),
      active: () => !plate.lit && !this.held && !!shadow()?.controlling && near(shadow().actor, block, 115) });
    this.hints.push({ key: 'G', at: () => ({ x: platePos, y: floor - 30 * this.scale }),
      active: () => this.held === block && Math.abs(block.x - platePos) < 60 * this.scale });
    this.hints.push({ key: 'Q', at: () => ({ x: block.x, y: block.y - size * .8 }),
      active: () => !plate.lit && !!shadow() && !shadow().detached && near(this.scene.player, block, 420) });
  }

  makeBeam(x, receptorX, pulsing) {
    const [bx] = this.position(x, 0);
    const [rx, ry] = this.position(receptorX, 500);
    const h = this.scene.viewportHeight;
    const beam = this.scene.add.rectangle(bx, h * .42, 8 * this.scale, h * .84, 0xffd6cc, .8).setDepth(4);
    const glow = this.scene.add.rectangle(bx, h * .42, 44 * this.scale, h * .84, RED, .2).setDepth(3)
      .setBlendMode('ADD');
    const emitter = beamEmitter(this.scene, bx, h * .84, this.scale, RED);
    const receptor = receptorArt(this.scene, rx, ry, this.scale, RED, GOLD);
    const target = { x: rx, y: ry };
    const shadow = () => this.scene.shadow;
    this.links.push({ wire: link(this.scene, target, { x: bx, y: 46 * this.scale }, this.scale, GOLD, 'rune'), isLit: () => !!shadow()?.isAnchoredNear(rx, ry, 115 * this.scale) });
    this.hints.push({ key: 'F', at: () => target,
      active: () => !!shadow()?.controlling && Math.hypot(shadow().actor.x - rx, shadow().actor.y - ry) < 115 * this.scale });
    this.beams.push({ x: bx, rx, ry, beam, glow, emitter, receptor, pulsing, disabled: false });
  }

  toggleGrasp() {
    const shadow = this.scene.shadow;
    if (!shadow?.detached || !shadow.controlling) return;
    if (this.held) {
      const block = this.held;
      this.held = null;
      block.body.enable = true;
      block.body.reset(block.x, block.y);
      block.body.setAllowGravity(true);
      return;
    }
    const actor = shadow.actor;
    const nearest = this.weights.find(block => Math.hypot(block.x - actor.x, block.y - actor.y) < 115 * this.scale);
    if (!nearest) return;
    this.held = nearest;
    nearest.body.enable = false;
  }

  interact() { /* Existing E input belongs to the first chapter's machinery. */ }

  update(time) {
    const actor = this.scene.shadow?.actor;
    if (this.held) {
      if (!this.scene.shadow?.detached) {
        this.held.body.enable = true;
        this.held.body.reset(this.held.x, this.held.y);
        this.held = null;
      } else {
        this.held.setPosition(actor.x, actor.body.bottom - 30 * this.scale);
      }
    }
    this.plates.forEach((plate, index) => {
      const block = this.weights[index];
      const active = !this.held && Math.abs(block.x - plate.x) < 40 * this.scale
        && Math.abs(block.body.bottom - plate.y) < 28 * this.scale;
      if (active && !plate.lit) {
        plate.lit = true;
        plate.art.setActive(true);
        const gate = this.gates[index];
        gate.open = true;
        gate.object.body.enable = false;
        gate.art.setOpen(true);
      }
    });
    for (const beam of this.beams) {
      const anchored = this.scene.shadow?.isAnchoredNear(beam.rx, beam.ry, 115 * this.scale);
      const powered = beam.pulsing ? Math.sin(time * .003) > -.3 : true;
      const dangerous = powered && !anchored;
      // A crackling, flickering beam while live; a faint trace when silenced.
      beam.beam.setAlpha(dangerous ? .7 + Math.random() * .3 : .05);
      beam.glow.setAlpha(dangerous ? .18 + Math.random() * .1 : .02);
      beam.emitter.setDangerous(dangerous);
      beam.receptor.setActive(!!anchored);
      if (dangerous && Math.abs(this.scene.player.x - beam.x) < 24 * this.scale && this.scene.player.body.bottom > 430 * this.scale) {
        this.scene.cameras.main.flash(320, 150, 24, 30);
        this.scene.cameras.main.shake(220, .006);
        this.scene.respawn();
      }
    }
    const remaining = this.plates.findIndex(plate => !plate.lit);
    this.prompt = remaining >= 0 ? 'Q DETACH  ·  G LIFT / DROP WEIGHT ON 0/1 PLATE  ·  F ANCHOR'
      : this.beams.length ? 'ANCHOR THE SHADOW IN A RED RECEPTOR TO SILENCE ITS BEAM.'
        : 'THE BULKHEAD IS OPEN. FOLLOW THE RED CABLES.';
    for (const { wire, isLit } of this.links) wire.setLit(!!isLit());
  }
}
