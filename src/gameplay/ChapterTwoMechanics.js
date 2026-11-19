// The second chapter's grasp puzzles are separate from the signal chapter's
// machinery, so the two routes can be tuned independently.
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
    this.makePuzzle(0, 1010, 1220, 1660);
    if (this.area > 0) this.makePuzzle(1, 2810, 2950, 3460);
    if (this.area > 0) this.makeBeam(2320, 2050, this.area >= 2);
    if (this.area >= 3) this.makeBeam(3600, 3330, this.area === 4);
    if (this.area === 0) scene.cinematics.pulse('GRASP', 'Detach your shadow with Q. Stand near the iron weight and press G to lift or release it.', RED, 3200);
  }

  position(x, y) { return [x * this.scale, y * this.scale]; }

  makePuzzle(index, weightX, plateX, gateX) {
    const platformIndex = index ? 4 : 1;
    const floor = this.scene.platforms[platformIndex].y;
    const size = 56 * this.scale;
    const [x] = this.position(weightX, 0);
    const block = this.scene.add.rectangle(x, floor - size / 2 - 2, size, size, 0x33242a)
      .setStrokeStyle(4 * this.scale, 0xf1a784).setDepth(7);
    this.scene.physics.add.existing(block);
    block.body.setSize(size, size).setCollideWorldBounds(true).setDragX(800).setMaxVelocity(250, 900);
    for (const ledge of this.scene.platforms) this.scene.physics.add.collider(block, ledge.zone);
    this.weights.push(block);
    const [platePos] = this.position(plateX, 0);
    const plateBase = this.scene.add.rectangle(platePos, floor - 6 * this.scale, 120 * this.scale, 18 * this.scale, 0x21171d)
      .setStrokeStyle(3 * this.scale, RED).setDepth(5);
    const plateLight = this.scene.add.rectangle(platePos, floor - 19 * this.scale, 86 * this.scale, 8 * this.scale, RED, .32).setDepth(6);
    const counter = this.scene.add.text(platePos, floor - 51 * this.scale, '0/1', {
      fontFamily: 'Arial, sans-serif', fontSize: `${Math.max(13, Math.round(19 * this.scale))}px`, color: '#f8bbb1', fontStyle: 'bold',
    }).setOrigin(.5).setDepth(8);
    this.plates.push({ x: platePos, y: floor, base: plateBase, light: plateLight, counter, lit: false });
    const [gx] = this.position(gateX, 0);
    const gate = this.scene.add.rectangle(gx, floor / 2, 32 * this.scale, floor, 0x240e19, .94)
      .setStrokeStyle(5 * this.scale, RED).setDepth(7);
    this.scene.physics.add.existing(gate, true);
    this.scene.physics.add.collider(this.scene.player, gate);
    this.gates.push({ x: gx, object: gate, open: false });
    this.scene.add.text(platePos, floor - 80 * this.scale, index ? 'TRANSFER' : 'GRASP / RELEASE', {
      fontFamily: 'Arial, sans-serif', fontSize: `${Math.max(11, Math.round(15 * this.scale))}px`, color: '#e4aaa6', letterSpacing: 2,
    }).setOrigin(.5).setDepth(7);
  }

  makeBeam(x, receptorX, pulsing) {
    const [bx] = this.position(x, 0);
    const [rx, ry] = this.position(receptorX, 500);
    const beam = this.scene.add.rectangle(bx, this.scene.viewportHeight * .42, 10 * this.scale, this.scene.viewportHeight * .84, RED, .7)
      .setDepth(4);
    const glow = this.scene.add.rectangle(bx, this.scene.viewportHeight * .42, 37 * this.scale, this.scene.viewportHeight * .84, RED, .12)
      .setDepth(3);
    const receptor = this.scene.add.circle(rx, ry, 38 * this.scale, 0x170d18, .9)
      .setStrokeStyle(5 * this.scale, 0xf3938e).setDepth(5);
    this.scene.add.text(rx, ry, '✦', { fontFamily: 'Georgia, serif', fontSize: `${Math.round(30 * this.scale)}px`, color: '#ffd2c0' })
      .setOrigin(.5).setDepth(6);
    this.beams.push({ x: bx, rx, ry, beam, glow, receptor, pulsing, disabled: false });
  }

  toggleGrasp() {
    const shadow = this.scene.shadow;
    if (!shadow?.detached || !shadow.controlling) {
      this.scene.announce('CONTROL THE DETACHED SHADOW TO GRASP.', RED);
      return;
    }
    if (this.held) {
      const block = this.held;
      this.held = null;
      block.body.enable = true;
      block.body.reset(block.x, block.y);
      block.body.setAllowGravity(true);
      this.scene.announce('WEIGHT RELEASED.', GOLD);
      return;
    }
    const actor = shadow.actor;
    const nearest = this.weights.find(block => Math.hypot(block.x - actor.x, block.y - actor.y) < 115 * this.scale);
    if (!nearest) { this.scene.announce('MOVE THE SHADOW CLOSER TO AN IRON WEIGHT.', RED); return; }
    this.held = nearest;
    nearest.body.enable = false;
    this.scene.announce('GRASP ACTIVE. CARRY THE WEIGHT TO THE LIT PLATE. G RELEASES.', GOLD);
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
        plate.counter.setText('1/1');
        plate.light.setFillStyle(GOLD, .96);
        const gate = this.gates[index];
        gate.open = true;
        gate.object.body.enable = false;
        this.scene.tweens.add({ targets: gate.object, alpha: .08, duration: 450 });
        this.scene.flashAt(gate.x, this.scene.viewportHeight * .42, GOLD);
        this.scene.announce('MASS CONFIRMED. BULKHEAD RELEASED.', GOLD);
      }
    });
    for (const beam of this.beams) {
      const anchored = this.scene.shadow?.isAnchoredNear(beam.rx, beam.ry, 115 * this.scale);
      const powered = beam.pulsing ? Math.sin(time * .003) > -.3 : true;
      const dangerous = powered && !anchored;
      beam.beam.setAlpha(dangerous ? .8 : .06);
      beam.glow.setAlpha(dangerous ? .22 : .02);
      beam.receptor.setStrokeStyle(5 * this.scale, anchored ? GOLD : RED);
      if (dangerous && Math.abs(this.scene.player.x - beam.x) < 24 * this.scale && this.scene.player.body.bottom > 430 * this.scale) {
        this.scene.announce('THE RED BEAM FOUND YOU.', RED);
        this.scene.respawn();
      }
    }
    const remaining = this.plates.findIndex(plate => !plate.lit);
    this.prompt = remaining >= 0 ? 'Q DETACH  ·  G LIFT / DROP WEIGHT ON 0/1 PLATE  ·  F ANCHOR'
      : this.beams.length ? 'ANCHOR THE SHADOW IN A RED RECEPTOR TO SILENCE ITS BEAM.'
        : 'THE BULKHEAD IS OPEN. FOLLOW THE RED CABLES.';
  }
}
