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
    const base = this.scene.add.rectangle(pos.x, pos.y - 8 * this.scale, 118 * this.scale, 18 * this.scale, 0x101b22)
      .setStrokeStyle(4 * this.scale, 0x6f8c91).setDepth(5);
    const top = this.scene.add.rectangle(pos.x, pos.y - 18 * this.scale, 86 * this.scale, 13 * this.scale, 0x8b7048)
      .setStrokeStyle(3 * this.scale, 0xe0bd78).setDepth(6);
    this.scene.add.text(pos.x, pos.y - 54 * this.scale, label, { fontFamily: 'Arial, sans-serif', fontSize: `${Math.round(16 * this.scale)}px`, color: '#f0d59c' })
      .setOrigin(.5).setDepth(6);
    const count = this.scene.add.text(pos.x, pos.y - 33 * this.scale, '0/1', {
      fontFamily: 'Arial, sans-serif', fontStyle: 'bold', fontSize: `${Math.round(18 * this.scale)}px`, color: '#dec48d',
    }).setOrigin(.5).setDepth(7);
    return { ...pos, base, top, count, active: false };
  }

  setPlateState(plate, active) {
    if (plate.active === active) return;
    plate.active = active;
    plate.count.setText(active ? '1/1' : '0/1').setColor(active ? '#dff9dc' : '#dec48d');
    plate.top.setFillStyle(active ? 0x78b98a : 0x8b7048);
    this.scene.tweens.add({ targets: plate.top, y: plate.y - (active ? 12 : 18) * this.scale, duration: 130 });
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

  ignitor(x, y, label, { timed = false } = {}) {
    const marker = this.marker(x, y, AMBER, '◇', 30);
    const bubble = this.scene.add.circle(marker.x, marker.y, 23 * this.scale, 0xffca55, .92)
      .setStrokeStyle(3 * this.scale, 0xffedaa).setScale(0).setDepth(6);
    const labelText = this.scene.add.text(marker.x, marker.y - 61 * this.scale, label, {
      fontFamily: 'Arial, sans-serif', fontSize: `${Math.round(18 * this.scale)}px`, color: '#f7d595',
    }).setOrigin(.5).setDepth(6);
    const timerText = this.scene.add.text(marker.x, marker.y, '', {
      fontFamily: 'Arial, sans-serif', fontStyle: 'bold', fontSize: `${Math.round(18 * this.scale)}px`, color: '#201605',
    }).setOrigin(.5).setDepth(7);
    return { ...marker, bubble, labelText, timerText, timed, active: false, parts: [marker.ring, marker.glyph, bubble, labelText, timerText] };
  }

  activateIgnitor(ignitor, disappear = true) {
    if (ignitor.active && !ignitor.timed) return;
    ignitor.active = true;
    ignitor.bubble.setVisible(true).setAlpha(.95).setScale(0);
    this.scene.tweens.add({ targets: ignitor.bubble, scale: 1, duration: 260, ease: 'Back.easeOut' });
    if (!disappear) return;
    this.scene.time.delayedCall(520, () => {
      this.scene.tweens.killTweensOf([ignitor.ring, ignitor.glyph]);
      this.scene.tweens.add({ targets: ignitor.parts, alpha: 0, scale: .72, duration: 260 });
    });
  }

  resetTimedIgnitor(ignitor) {
    ignitor.active = false;
    ignitor.timerText.setText('');
    ignitor.bubble.setScale(0).setVisible(true);
  }

  combinationIgnitor(x, y, label) {
    const marker = this.marker(x, y, 0xe5c48f, '⬡', 36);
    const labelText = this.scene.add.text(marker.x, marker.y - 68 * this.scale, label, {
      fontFamily: 'Arial, sans-serif', fontSize: `${Math.round(18 * this.scale)}px`, color: '#f4d9a6',
    }).setOrigin(.5).setDepth(6);
    const dots = [-24, 0, 24].map(offset => this.scene.add.circle(marker.x + offset * this.scale, marker.y + 48 * this.scale, 7 * this.scale, 0x28333a)
      .setStrokeStyle(2 * this.scale, 0xd5b77e).setDepth(7));
    return { ...marker, labelText, dots };
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

  woodenPlatform(start, end, y, moving = false) {
    const left = start * this.scale, right = end * this.scale, top = y * this.scale;
    const width = right - left;
    const surface = this.scene.add.rectangle((left + right) / 2, top + 8 * this.scale, width, 18 * this.scale, 0x000000, .001);
    this.scene.physics.add.existing(surface, !moving);
    this.scene.physics.add.collider(this.scene.player, surface);
    const visual = this.scene.add.container(left, top).setDepth(4);
    const plankCount = Math.max(4, Math.round(width / (38 * this.scale)));
    const plankWidth = width / plankCount;
    const planks = [];
    for (let i = 0; i < plankCount; i++) {
      const plank = this.scene.add.rectangle((i + .5) * plankWidth, 7 * this.scale, plankWidth - 3 * this.scale, 17 * this.scale, i % 2 ? 0x76502f : 0x8d6237)
        .setStrokeStyle(2 * this.scale, 0x3d281b);
      visual.add(plank);
      planks.push(plank);
    }
    const ropes = this.scene.add.graphics().lineStyle(3 * this.scale, 0x38271c, .9);
    ropes.lineBetween(0, -2 * this.scale, width, -2 * this.scale);
    ropes.lineBetween(0, 17 * this.scale, width, 17 * this.scale);
    visual.addAt(ropes, 0);
    return { left, right, top, width, surface, visual, planks, ropes };
  }

  buildCoast() {
    this.moving = this.woodenPlatform(2370, 2560, 664, true);
    this.moving.surface.body.setAllowGravity(false).setImmovable(true).setVelocityX(75 * this.scale);
    this.moving.min = 2310 * this.scale;
    this.moving.max = 2630 * this.scale;
    this.moving.velocity = 75 * this.scale;
    this.collapsing = this.woodenPlatform(1800, 1940, 680);
    this.flags.collapsingStarted = false;
    this.flags.collapsed = false;
    this.scene.add.text(2420 * this.scale, 590 * this.scale, 'TIDAL LIFT', {
      fontFamily: 'Arial, sans-serif', fontSize: `${Math.round(20 * this.scale)}px`, color: '#cde8ee',
    }).setOrigin(.5).setDepth(5);
  }

  buildFacility() {
    this.boxA = this.crate(345, 0);
    this.plateA = this.plate(720, 735, 'MASS BUTTON');
    this.gateA = this.gate('pressure', 900, 735);
    this.switchA = this.ignitor(1280, 625, 'A / IGNITION');
    this.switchB = this.ignitor(2380, 620, 'B / ROUTING');
    this.gateB = this.gate('sequence', 2560, 690, 0xb898da);
    this.switchC = this.ignitor(2820, 580, 'C / TEMPORAL BYPASS', { timed: true });
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
    this.vaultPlate = this.plate(3050, 665, 'WEIGHT BUTTON');
    this.vaultPrism = this.receiver(3500, 360, 'LIGHT');
    this.vaultLever = this.combinationIgnitor(3390, 540, 'THREE-PART RELEASE');
    this.vaultGate = this.gate('final', 3990, 660, 0xe5c48f);
    this.flags.release = false;
  }

  interact() {
    if (this.id === 'abandoned-facility') {
      if (this.near(this.switchA, 83)) {
        if (this.flags.sequence === 0) {
          this.flags.sequence = 1;
          this.activateIgnitor(this.switchA);
          this.scene.announce('IGNITION ONLINE. FIND ROUTING B.', AMBER);
        }
      } else if (this.near(this.switchB, 83)) {
        if (this.flags.sequence === 1) {
          this.flags.sequence = 2;
          this.activateIgnitor(this.switchB);
          this.setGate(this.gateB, true, true);
          this.scene.announce('ROUTING COMPLETE. SECOND BULKHEAD OPEN.', CYAN);
        } else this.scene.announce('ROUTING NEEDS IGNITION A FIRST.', 0xf19a9a);
      } else if (this.near(this.switchC, 83)) {
        this.flags.timerEnd = this.scene.time.now + 11000;
        this.activateIgnitor(this.switchC, false);
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
      this.moving.visual.setPosition(this.moving.surface.x - this.moving.width / 2, this.moving.surface.y - 8 * this.scale);
      if (!this.flags.collapsingStarted && player.body.blocked.down && Math.abs(player.x - this.collapsing.surface.x) < 64 * this.scale) {
        this.flags.collapsingStarted = true;
        this.scene.announce('THE OLD BRIDGE GIVES WAY!', 0xd7b989);
        this.scene.time.delayedCall(480, () => {
          this.collapsing.surface.body.enable = false;
          this.scene.tweens.add({ targets: this.collapsing.ropes, alpha: 0, duration: 170 });
          this.collapsing.planks.forEach((plank, index) => {
            this.scene.tweens.add({
              targets: plank, y: `+=${115 + index * 14}`, angle: index % 2 ? 48 : -38,
              alpha: .08, duration: 600 + index * 80, delay: index * 45, ease: 'Quad.easeIn',
            });
          });
          this.flags.collapsed = true;
        });
      }
      if (player.x > 2740 * this.scale && !this.flags.silhouette) {
        this.flags.silhouette = true;
        this.scene.showDistantSilhouette();
      }
      this.prompt = player.x < 2300 * this.scale ? 'FOLLOW THE DEAD RELAY LIGHTS.' : 'TIME YOUR JUMP WITH THE WOODEN TIDAL LIFT.';
    } else if (this.id === 'abandoned-facility') {
      const plateActive = this.boxOn(this.boxA, this.plateA);
      this.setPlateState(this.plateA, plateActive);
      if (plateActive) {
        if (!this.flags.plateSolved) this.scene.announce('MASS CONFIRMED. BULKHEAD OPEN.', CYAN);
        this.flags.plateSolved = true;
        this.setGate(this.gateA, true, true);
      }
      if (this.flags.timerEnd) {
        const remaining = Math.max(0, Math.ceil((this.flags.timerEnd - time) / 1000));
        this.switchC.timerText.setText(String(remaining));
      }
      if (this.flags.timerEnd && time > this.flags.timerEnd && player.x < this.gateC.x + 30 * this.scale) {
        this.flags.timerEnd = 0;
        this.resetTimedIgnitor(this.switchC);
      }
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
      const prism = this.shadowAt(this.vaultPrism);
      this.setPlateState(this.vaultPlate, plate);
      [plate, prism, this.flags.release].forEach((active, index) => this.vaultLever.dots[index].setFillStyle(active ? 0xf2c66f : 0x28333a));
      this.prompt = this.flags.release ? 'THE RELAY IS LIVE. WALK INTO THE SIGNAL.'
        : 'WEIGHT ON PLATE  ·  SHADOW IN LIGHT  ·  E AT RELEASE';
    }
  }
}
