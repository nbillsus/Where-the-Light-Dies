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
    if (this.area === 0) {
      this.makePuzzle({ kind: 'shadow', platform: 2, weight: 1550, plate: 1810, gate: 2240 });
      scene.cinematics.pulse('GRASP', 'Q releases the shadow. G lets it carry the pale relic. Drop it on the matching seal.', GHOST, 3100);
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

  makePuzzle({ kind, platform, weight, plate, gate }) {
    const floor = this.scene.platforms[platform].y;
    const s = this.scale;
    const size = (kind === 'shadow' ? 52 : 66) * s;
    const x = weight * s;
    const block = this.scene.add.rectangle(x, floor - size / 2 - 2, size, size,
      kind === 'shadow' ? 0x172537 : 0x66503a)
      .setStrokeStyle(4 * s, kind === 'shadow' ? GHOST : 0xd5aa70).setDepth(7);
    this.scene.physics.add.existing(block);
    block.body.setSize(size, size).setCollideWorldBounds(true).setDragX(kind === 'shadow' ? 760 : 450)
      .setMaxVelocity(230, 900);
    for (const ledge of this.scene.platforms) this.scene.physics.add.collider(block, ledge.zone);
    if (kind === 'ordinary') this.scene.physics.add.collider(this.scene.player, block);
    const badge = this.scene.add.text(x, block.y, kind === 'shadow' ? '✦' : '╳', {
      fontFamily: 'Georgia, serif', fontSize: `${Math.max(22, Math.round(33 * s))}px`,
      color: kind === 'shadow' ? '#d8f6ff' : '#d8b27d',
    }).setOrigin(.5).setDepth(8);
    if (kind === 'shadow') {
      this.scene.tweens.add({ targets: [block, badge], alpha: { from: .75, to: 1 }, duration: 900, yoyo: true, repeat: -1 });
    }
    const px = plate * s;
    const color = kind === 'shadow' ? GHOST : GOLD;
    const base = this.scene.add.rectangle(px, floor - 9 * s, 122 * s, 20 * s, kind === 'shadow' ? 0x152b36 : 0x3b2b1f)
      .setStrokeStyle(3 * s, color).setDepth(5);
    const light = this.scene.add.rectangle(px, floor - 20 * s, 85 * s, 8 * s, color, .32).setDepth(6);
    const label = this.scene.add.text(px, floor - 58 * s, kind === 'shadow' ? 'SHADOW SEAL  0/1' : 'MASS PLATE  0/1', {
      fontFamily: 'Arial, sans-serif', fontStyle: 'bold', fontSize: `${Math.max(12, Math.round(17 * s))}px`,
      color: kind === 'shadow' ? '#c7edf6' : '#f2cc94', letterSpacing: 1,
    }).setOrigin(.5).setDepth(8);
    const gx = gate * s;
    const wall = this.scene.add.rectangle(gx, floor / 2, 33 * s, floor, 0x1c1823, .95)
      .setStrokeStyle(5 * s, color).setDepth(7);
    this.scene.physics.add.existing(wall, true);
    this.scene.physics.add.collider(this.scene.player, wall);
    this.puzzles.push({ kind, block, badge, plateX: px, floor, base, light, label, wall, gateX: gx, lit: false });
  }

  makeBeam(x, receptorX, { color, pulsing }) {
    const s = this.scale, bx = x * s, rx = receptorX * s, ry = 530 * s;
    const beam = this.scene.add.rectangle(bx, this.scene.viewportHeight * .42, 10 * s, this.scene.viewportHeight * .84, color, .78).setDepth(4);
    const glow = this.scene.add.rectangle(bx, this.scene.viewportHeight * .42, 40 * s, this.scene.viewportHeight * .84, color, .18).setDepth(3);
    const receptor = this.scene.add.circle(rx, ry, 36 * s, 0x131724, .93).setStrokeStyle(5 * s, color).setDepth(5);
    this.scene.add.text(rx, ry, '✦', { fontFamily: 'Georgia, serif', fontSize: `${Math.round(30 * s)}px`, color: '#f5e8e0' })
      .setOrigin(.5).setDepth(6);
    this.beams.push({ x: bx, rx, ry, beam, glow, receptor, color, pulsing });
  }

  makeLever(x, gateX) {
    const s = this.scale, floor = this.scene.platforms[4].y;
    const lever = this.scene.add.rectangle(x * s, (floor - 58 * s), 18 * s, 78 * s, 0x88623e)
      .setStrokeStyle(3 * s, GOLD).setDepth(6);
    this.scene.add.text(x * s, floor - 115 * s, 'E  /  ROUTE POWER', {
      fontFamily: 'Arial, sans-serif', fontSize: `${Math.max(12, Math.round(17 * s))}px`, color: '#f6d19c',
    }).setOrigin(.5).setDepth(7);
    const gateFloor = this.scene.platforms[5].y;
    const wall = this.scene.add.rectangle(gateX * s, gateFloor / 2, 33 * s, gateFloor, 0x211722, .94)
      .setStrokeStyle(5 * s, GOLD).setDepth(7);
    this.scene.physics.add.existing(wall, true);
    this.scene.physics.add.collider(this.scene.player, wall);
    this.levers.push({ x: x * s, lever, wall, active: false });
  }

  toggleGrasp() {
    const shadow = this.scene.shadow;
    if (!shadow?.detached || !shadow.controlling) {
      this.scene.announce('CONTROL THE DETACHED SHADOW TO GRASP.', GHOST);
      return;
    }
    if (this.held) {
      const block = this.held.block;
      this.held = null;
      block.body.enable = true;
      block.body.reset(block.x, block.y);
      block.body.setAllowGravity(true);
      this.scene.announce('RELIC RELEASED.', GHOST);
      return;
    }
    const actor = shadow.actor;
    const nearest = this.puzzles.find(p => p.kind === 'shadow' && !p.lit
      && Math.hypot(p.block.x - actor.x, p.block.y - actor.y) < 125 * this.scale);
    if (!nearest) { this.scene.announce('G ONLY LIFTS A PALE SHADOW RELIC.', GHOST); return; }
    this.held = nearest;
    nearest.block.body.enable = false;
    this.scene.announce('RELIC HELD. CARRY IT TO THE PALE SEAL, THEN PRESS G.', GHOST);
  }

  interact() {
    const lever = this.levers.find(item => !item.active && Math.abs(this.scene.player.x - item.x) < 90 * this.scale);
    if (!lever) return;
    lever.active = true;
    lever.lever.setAngle(34).setFillStyle(GOLD);
    lever.wall.body.enable = false;
    this.scene.tweens.add({ targets: lever.wall, alpha: .08, duration: 380 });
    this.scene.announce('POWER ROUTED. THE SERVICE GATE IS OPEN.', GOLD);
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
      if (!saved.lit) return;
      p.lit = true;
      p.label.setText(p.kind === 'shadow' ? 'SHADOW SEAL  1/1' : 'MASS PLATE  1/1');
      p.light.setFillStyle(p.kind === 'shadow' ? GHOST : GOLD, .98);
      p.wall.body.enable = false;
      p.wall.setAlpha(.08);
    });
    data.levers?.forEach((active, index) => {
      const lever = this.levers[index];
      if (!lever || !active) return;
      lever.active = true;
      lever.lever.setAngle(34).setFillStyle(GOLD);
      lever.wall.body.enable = false;
      lever.wall.setAlpha(.08);
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
      puzzle.badge.setPosition(puzzle.block.x, puzzle.block.y);
      if (puzzle.lit || this.held === puzzle) continue;
      const active = Math.abs(puzzle.block.x - puzzle.plateX) < 44 * this.scale
        && Math.abs(puzzle.block.body.bottom - puzzle.floor) < 28 * this.scale;
      if (!active) continue;
      puzzle.lit = true;
      puzzle.label.setText(puzzle.kind === 'shadow' ? 'SHADOW SEAL  1/1' : 'MASS PLATE  1/1');
      puzzle.light.setFillStyle(puzzle.kind === 'shadow' ? GHOST : GOLD, .98);
      puzzle.wall.body.enable = false;
      this.scene.tweens.add({ targets: puzzle.wall, alpha: .08, duration: 420 });
      this.scene.flashAt(puzzle.gateX, this.scene.viewportHeight * .42, puzzle.kind === 'shadow' ? GHOST : GOLD);
      this.scene.announce(puzzle.kind === 'shadow' ? 'THE SHADOW SEAL OPENS.' : 'MASS CONFIRMED. BULKHEAD RELEASED.', GOLD);
    }
    for (const beam of this.beams) {
      const anchored = this.scene.shadow?.isAnchoredNear(beam.rx, beam.ry, 120 * this.scale);
      const powered = !beam.pulsing || Math.sin(time * .003) > -.3;
      const dangerous = powered && !anchored;
      beam.beam.setAlpha(dangerous ? .82 : .06);
      beam.glow.setAlpha(dangerous ? .22 : .02);
      beam.receptor.setStrokeStyle(5 * this.scale, anchored ? GOLD : beam.color);
      if (dangerous && Math.abs(this.scene.player.x - beam.x) < 25 * this.scale
        && this.scene.player.body.bottom > 430 * this.scale) {
        this.scene.announce('THE BEAM FOUND YOU.', beam.color);
        this.scene.respawn();
      }
    }
    const unsolved = this.puzzles.find(p => !p.lit);
    const nextBeam = this.beams.find(beam => this.scene.player.x < beam.x + 35 * this.scale);
    if (nextBeam && (!unsolved || unsolved.block.x > nextBeam.x))
      this.prompt = 'F  /  ANCHOR THE SHADOW IN A RECEPTOR TO SILENCE A BEAM.';
    else if (unsolved) this.prompt = unsolved.kind === 'shadow'
      ? 'PALE RELIC: Q DETACH  ·  G LIFT / DROP ON SHADOW SEAL'
      : 'WOODEN WEIGHT: PUSH IT ONTO THE GOLD MASS PLATE.';
    else if (this.levers.some(l => !l.active)) this.prompt = 'E  /  OPERATE THE BRASS POWER LEVER.';
    else if (this.beams.length) this.prompt = 'F  /  ANCHOR THE SHADOW IN A RECEPTOR TO SILENCE A BEAM.';
    else this.prompt = 'FOLLOW THE PATH INTO THE DARK.';
  }
}
