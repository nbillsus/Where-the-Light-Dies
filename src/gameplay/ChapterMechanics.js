import Phaser from 'phaser';

const INK = 0x07121d;
const CYAN = 0x9ce6e0;
const AMBER = 0xf6c874;

export class ChapterMechanics {
  constructor(scene) {
    this.scene = scene;
    this.id = scene.stage.id;
    this.scale = scene.artScale;
    this.gates = [];
    this.switches = [];
    this.receivers = [];
    this.crates = [];
    this.flags = {};
    this.prompt = '';
    if (this.id === 'storm-coast') this.buildCoast();
    if (this.id === 'abandoned-facility') this.buildFacility();
    if (this.id === 'thornwood') this.buildForest();
    if (this.id === 'drowned-cavern') this.buildCavern();
    if (this.id === 'lantern-vault') this.buildVault();
  }

  p(x, y) { return { x: x * this.scale, y: y * this.scale }; }

  marker(x, y, color, symbol, radius = 33) {
    const pos = this.p(x, y);
    const ring = this.scene.add.circle(pos.x, pos.y, radius * this.scale, INK, .8)
      .setStrokeStyle(5 * this.scale, color, .88).setDepth(5);
    const glyph = this.scene.add.text(pos.x, pos.y, symbol, {
      fontFamily: 'Georgia, serif', fontSize: `${Math.round(30 * this.scale)}px`, color: `#${color.toString(16).padStart(6, '0')}`,
    }).setOrigin(.5).setDepth(6);
    this.scene.tweens.add({ targets: [ring, glyph], alpha: { from: .65, to: 1 }, scale: { from: .95, to: 1.04 }, duration: 1200, yoyo: true, repeat: -1 });
    return { ...pos, ring, glyph };
  }

  gate(name, x, floorY, color = CYAN) {
    const px = x * this.scale;
    const h = floorY * this.scale;
    const wall = this.scene.add.rectangle(px, h / 2, 28 * this.scale, h, INK, .92)
      .setStrokeStyle(5 * this.scale, color, .9).setDepth(7);
    this.scene.physics.add.existing(wall, true);
    this.scene.physics.add.collider(this.scene.player, wall);
    const gate = { name, x: px, wall, opened: false, latched: false };
    this.gates.push(gate);
    return gate;
  }

  setGate(gate, open, latch = false) {
    if (latch) gate.latched = true;
    const shouldOpen = gate.latched || open;
    if (gate.opened === shouldOpen) return;
    gate.opened = shouldOpen;
    gate.wall.body.enable = !shouldOpen;
    this.scene.tweens.add({ targets: gate.wall, alpha: shouldOpen ? .09 : 1, duration: 340 });
    if (shouldOpen) this.scene.flashAt(gate.x, this.scene.viewportHeight * .42, CYAN);
  }

  plate(x, floorY, label) {
    const pos = this.p(x, floorY);
    const base = this.scene.add.rectangle(pos.x, pos.y - 5 * this.scale, 92 * this.scale, 12 * this.scale, 0x557d86)
      .setStrokeStyle(3 * this.scale, CYAN).setDepth(5);
    this.scene.add.text(pos.x, pos.y - 33 * this.scale, label, { fontFamily: 'Arial, sans-serif', fontSize: `${Math.round(18 * this.scale)}px`, color: '#c9f3e7' })
      .setOrigin(.5).setDepth(6);
    return { ...pos, base };
  }

  crate(x, platformIndex, color = 0x527d87) {
    const top = this.scene.platforms[platformIndex].y;
    const size = 62 * this.scale;
    const box = this.scene.add.rectangle(x * this.scale, top - size / 2 - 3, size, size, color)
      .setStrokeStyle(4 * this.scale, 0xb1e4db).setDepth(6);
    this.scene.physics.add.existing(box);
    box.body.setSize(size, size).setCollideWorldBounds(true).setDragX(1050)
      .setMaxVelocity(160, 950);
    for (const platform of this.scene.platforms) this.scene.physics.add.collider(box, platform.zone);
    this.scene.physics.add.collider(this.scene.player, box);
    this.crates.push(box);
    return box;
  }

  switch(x, y, label) {
    const marker = this.marker(x, y, AMBER, '◇', 28);
    this.scene.add.text(marker.x, marker.y - 57 * this.scale, label, {
      fontFamily: 'Arial, sans-serif', fontSize: `${Math.round(19 * this.scale)}px`, color: '#f7d595',
    }).setOrigin(.5).setDepth(6);
    const result = { ...marker, label };
    this.switches.push(result);
    return result;
  }

  receiver(x, y, label) {
    const marker = this.marker(x, y, CYAN, '✦', 40);
    this.scene.add.text(marker.x, marker.y - 65 * this.scale, label, {
      fontFamily: 'Arial, sans-serif', fontSize: `${Math.round(18 * this.scale)}px`, color: '#bdebe8',
    }).setOrigin(.5).setDepth(6);
    this.receivers.push(marker);
    return marker;
  }

  bridge(start, end, y, color = CYAN) {
    const left = start * this.scale, right = end * this.scale, top = y * this.scale;
    const surface = this.scene.add.rectangle((left + right) / 2, top + 13 * this.scale, right - left, 25 * this.scale, 0x274855, .92)
      .setStrokeStyle(5 * this.scale, color, .95).setDepth(3);
    this.scene.physics.add.existing(surface, true);
    this.scene.physics.add.collider(this.scene.player, surface);
    return { left, right, top, surface };
  }

  buildCoast() {
    const pos = this.p(2465, 664);
    const surface = this.scene.add.rectangle(pos.x, pos.y + 13 * this.scale, 190 * this.scale, 26 * this.scale, 0x365e6d)
      .setStrokeStyle(5 * this.scale, 0x99dff3).setDepth(3);
    this.scene.physics.add.existing(surface);
    surface.body.setAllowGravity(false).setImmovable(true).setVelocityX(75 * this.scale);
    this.scene.physics.add.collider(this.scene.player, surface);
    this.moving = { surface, min: 2310 * this.scale, max: 2630 * this.scale, velocity: 75 * this.scale };
    this.collapsing = this.bridge(1800, 1940, 680, 0xc4d7dc);
    this.flags.collapsingStarted = false;
    this.flags.collapsed = false;
    this.scene.add.text(2420 * this.scale, 590 * this.scale, 'TIDAL LIFT', {
      fontFamily: 'Arial, sans-serif', fontSize: `${Math.round(20 * this.scale)}px`, color: '#cde8ee',
    }).setOrigin(.5).setDepth(5);
  }

  buildFacility() {
    this.boxA = this.crate(345, 0);
    this.plateA = this.plate(720, 735, '01 / MASS');
    this.gateA = this.gate('pressure', 900, 735);
    this.switchA = this.switch(1280, 625, 'A / IGNITION');
    this.switchB = this.switch(2380, 620, 'B / ROUTING');
    this.gateB = this.gate('sequence', 2560, 690, 0xb898da);
    this.switchC = this.switch(2820, 580, 'C / TEMPORAL BYPASS');
    this.gateC = this.gate('timed', 3630, 620, 0xf2b96a);
    this.flags.sequence = 0;
    this.flags.timerEnd = 0;
  }

  buildForest() {
    this.forestSeal = this.receiver(1480, 420, 'HOLD THE SEAL');
    this.forestGate = this.gate('forest', 1640, 650, 0xb995d8);
    this.bridgeSeal = this.receiver(3410, 460, 'HOLD THE PATH');
    this.shadowBridge = this.bridge(3200, 3630, 680, 0xb4e7e9);
    this.shadowBridge.surface.body.enable = false;
    this.shadowBridge.surface.setAlpha(.1);
    this.flags.bridgeLatched = false;
  }

  buildCavern() {
    this.caveSeal = this.receiver(1480, 390, 'PRISM I');
    this.caveGate = this.gate('cave-prism', 1990, 680);
    this.caveLever = this.switch(2780, 585, 'ALIGN THE BEAM');
    this.caveReceiver = this.receiver(3240, 330, 'PRISM II');
    this.caveGateB = this.gate('cave-combination', 3430, 600, 0xe4b886);
    this.flags.lever = false;
    const pos = this.p(3200, 330);
    this.spotlight = this.scene.add.graphics().setDepth(1);
    this.spotlightOrigin = pos;
  }

  buildVault() {
    this.vaultBox = this.crate(2940, 5, 0x776052);
    this.vaultPlate = this.plate(3050, 665, 'WEIGHT');
    this.vaultPrism = this.receiver(3500, 360, 'LIGHT');
    this.vaultLever = this.switch(3390, 540, 'RELEASE');
    this.vaultGate = this.gate('final', 3990, 660, 0xe5c48f);
    this.flags.release = false;
  }

  interact() {
    if (this.id === 'abandoned-facility') {
      if (this.near(this.switchA, 83)) {
        this.flags.sequence = 1;
        this.scene.announce('IGNITION ONLINE. FIND ROUTING B.', AMBER);
      } else if (this.near(this.switchB, 83)) {
        if (this.flags.sequence === 1) {
          this.flags.sequence = 2;
          this.setGate(this.gateB, true, true);
          this.scene.announce('ROUTING COMPLETE. SECOND BULKHEAD OPEN.', CYAN);
        } else this.scene.announce('ROUTING NEEDS IGNITION A FIRST.', 0xf19a9a);
      } else if (this.near(this.switchC, 83)) {
        this.flags.timerEnd = this.scene.time.now + 11000;
        this.scene.announce('BYPASS ACTIVE: 11 SECONDS.', AMBER);
      }
    } else if (this.id === 'drowned-cavern' && this.near(this.caveLever, 83)) {
      this.flags.lever = true;
      this.scene.announce('BEAM ALIGNED. ANCHOR THE SHADOW IN PRISM II.', AMBER);
    } else if (this.id === 'lantern-vault' && this.near(this.vaultLever, 83)) {
      const plate = this.boxOn(this.vaultBox, this.vaultPlate);
      const prism = this.shadowAt(this.vaultPrism);
      if (plate && prism) {
        this.flags.release = true;
        this.setGate(this.vaultGate, true, true);
        this.scene.announce('THE LENS REMEMBERS.', AMBER);
        this.scene.cinematics.pulse('THE FINAL RELAY', 'Something answers from beneath the island.', 0xe6bd83, 2300);
      } else {
        const missing = [!plate && 'WEIGHT', !prism && 'LIGHT'].filter(Boolean).join(' + ');
        this.scene.announce(`NEEDS ${missing}.`, 0xf19a9a);
      }
    }
  }

  near(marker, radius) {
    return Math.hypot(this.scene.player.x - marker.x, this.scene.player.y - marker.y) < radius * this.scale;
  }

  boxOn(box, plate) { return Math.abs(box.x - plate.x) < 39 * this.scale && Math.abs(box.body.bottom - plate.y) < 23 * this.scale; }
  shadowAt(marker) { return this.scene.shadow?.isAnchoredNear(marker.x, marker.y, 105 * this.scale) || false; }

  update(time) {
    const player = this.scene.player;
    if (this.id === 'storm-coast') {
      const body = this.moving.surface.body;
      if (body.x < this.moving.min || body.x + body.width > this.moving.max) {
        this.moving.velocity *= -1;
        body.setVelocityX(this.moving.velocity);
      }
      if (!this.flags.collapsingStarted && player.body.blocked.down && Math.abs(player.x - this.collapsing.surface.x) < 64 * this.scale) {
        this.flags.collapsingStarted = true;
        this.scene.announce('THE BRIDGE GIVES WAY!', 0xbfe4ed);
        this.scene.time.delayedCall(1000, () => {
          this.collapsing.surface.body.enable = false;
          this.scene.tweens.add({ targets: this.collapsing.surface, y: '+=85', alpha: 0, angle: 15, duration: 550 });
          this.flags.collapsed = true;
        });
      }
      if (player.x > 2740 * this.scale && !this.flags.silhouette) {
        this.flags.silhouette = true;
        this.scene.showDistantSilhouette();
      }
      this.prompt = player.x < 2300 * this.scale ? 'THE LIGHTHOUSE IS BEHIND YOU.' : 'TIME YOUR JUMP WITH THE TIDAL LIFT.';
    } else if (this.id === 'abandoned-facility') {
      if (this.boxOn(this.boxA, this.plateA)) {
        if (!this.flags.plateSolved) this.scene.announce('MASS CONFIRMED. BULKHEAD OPEN.', CYAN);
        this.flags.plateSolved = true;
        this.setGate(this.gateA, true, true);
      }
      if (this.flags.timerEnd && time > this.flags.timerEnd && player.x < this.gateC.x + 30 * this.scale) this.flags.timerEnd = 0;
      this.setGate(this.gateC, !!this.flags.timerEnd, player.x > this.gateC.x + 30 * this.scale);
      this.prompt = this.near(this.switchA, 83) || this.near(this.switchB, 83) || this.near(this.switchC, 83)
        ? 'E  /  OPERATE MECHANISM' : this.flags.plateSolved ? 'FOLLOW THE POWERED CABLES.' : 'PUSH THE CRATE ONTO THE LIT PLATE.';
    } else if (this.id === 'thornwood') {
      const first = this.shadowAt(this.forestSeal);
      this.setGate(this.forestGate, first, player.x > this.forestGate.x + 28 * this.scale);
      const bridge = this.shadowAt(this.bridgeSeal) || this.flags.bridgeLatched;
      if (player.x > 3630 * this.scale) this.flags.bridgeLatched = true;
      if (this.shadowBridge.surface.body.enable !== bridge) {
        this.shadowBridge.surface.body.enable = bridge;
        this.scene.tweens.add({ targets: this.shadowBridge.surface, alpha: bridge ? .95 : .1, duration: 270 });
      }
      this.prompt = player.x < this.forestGate.x ? 'Q  /  DETACH SHADOW     F  /  ANCHOR AT THE SEAL'
        : 'ANCHOR YOUR SHADOW AT THE DISTANT SEAL TO FORM A PATH.';
    } else if (this.id === 'drowned-cavern') {
      this.setGate(this.caveGate, this.shadowAt(this.caveSeal), player.x > this.caveGate.x + 28 * this.scale);
      this.setGate(this.caveGateB, this.flags.lever && this.shadowAt(this.caveReceiver), player.x > this.caveGateB.x + 28 * this.scale);
      const x = this.spotlightOrigin.x, y = this.spotlightOrigin.y;
      this.spotlight.clear().fillStyle(0xb5fff4, .08)
        .fillTriangle(x, y, x - 180 * this.scale + Math.sin(time * .001) * 65, 900 * this.scale, x + 180 * this.scale + Math.sin(time * .001) * 65, 900 * this.scale);
      this.prompt = player.x < this.caveGate.x ? 'ANCHOR THE SHADOW IN PRISM I.'
        : 'E  /  ALIGN LEVER     ANCHOR SHADOW IN PRISM II.';
    } else if (this.id === 'lantern-vault') {
      const plate = this.boxOn(this.vaultBox, this.vaultPlate);
      this.vaultPlate.base.setFillStyle(plate ? 0xb7ddbf : 0x557d86);
      this.prompt = this.flags.release ? 'THE RELAY IS LIVE. WALK INTO THE SIGNAL.'
        : 'WEIGHT ON PLATE  ·  SHADOW IN LIGHT  ·  E AT RELEASE';
    }
  }
}
