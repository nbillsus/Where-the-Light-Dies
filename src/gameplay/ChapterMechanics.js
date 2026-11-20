import Phaser from 'phaser';
import {
  crate as crateArt, gate as gateArt, hideShape, lever as leverArt, link, plate as plateArt,
  prism as prismArt, seal as sealArt, shadowBridge as shadowBridgeArt,
} from '../puzzles/PropArt.js';

const CYAN = 0x9ce6e0;
const AMBER = 0xf6c874;
const VIOLET = 0xc9b2ff;

export class ChapterMechanics {
  constructor(scene) {
    this.scene = scene;
    this.id = scene.stage.id;
    this.scale = scene.artScale;
    this.gates = [];
    this.switches = [];
    this.receivers = [];
    this.crates = [];
    this.hints = [];
    this.links = [];
    this.flags = {};
    this.prompt = '';
    if (this.id === 'storm-coast') this.buildCoast();
    if (this.id === 'abandoned-facility') this.buildFacility();
    if (this.id === 'thornwood') this.buildForest();
    if (this.id === 'drowned-cavern') this.buildCavern();
    if (this.id === 'lantern-vault') this.buildVault();
  }

  p(x, y) { return { x: x * this.scale, y: y * this.scale }; }

  distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  // Key icon over a mechanism the Keeper can operate (E).
  useHint(target, isDone) {
    this.hints.push({ key: 'E', at: () => target, active: () => !this.scene.shadow?.controlling && !isDone() && this.near(target, 83) });
  }

  // Key icons at an anchor point: F once the Shadow is on it, Q to send the Shadow out.
  anchorHint(target) {
    this.hints.push({ key: 'F', at: () => target, active: () => {
      const shadow = this.scene.shadow;
      return !!shadow?.controlling && this.distance(shadow.actor, target) < 105 * this.scale;
    } });
    this.hints.push({ key: 'Q', at: () => target, active: () => {
      const shadow = this.scene.shadow;
      return !!shadow && !shadow.detached && this.distance(this.scene.player, target) < 360 * this.scale;
    } });
  }

  // A cable (or rune line) that lights up when its mechanism is solved.
  linkUp(from, to, isLit, color = AMBER, style = 'cable') {
    this.links.push({ wire: link(this.scene, from, to, this.scale, color, style), isLit });
  }

  gate(name, x, floorY, color = CYAN) {
    const px = x * this.scale;
    const h = floorY * this.scale;
    const wall = hideShape(this.scene.add.rectangle(px, h / 2, 28 * this.scale, h, 0, 0));
    this.scene.physics.add.existing(wall, true);
    this.scene.physics.add.collider(this.scene.player, wall);
    const art = gateArt(this.scene, px, h, this.scale, color);
    const gate = { name, x: px, wall, art, base: art.base, opened: false, latched: false };
    this.gates.push(gate);
    return gate;
  }

  setGate(gate, open, latch = false) {
    if (latch) gate.latched = true;
    const shouldOpen = gate.latched || open;
    if (gate.opened === shouldOpen) return;
    gate.opened = shouldOpen;
    gate.wall.body.enable = !shouldOpen;
    gate.art.setOpen(shouldOpen);
  }

  plate(x, floorY) {
    const pos = this.p(x, floorY);
    const art = plateArt(this.scene, pos.x, pos.y, this.scale, AMBER);
    return { ...pos, art, active: false, anchor: { x: pos.x, y: pos.y - 14 * this.scale } };
  }

  setPlateState(plate, active) {
    if (plate.active === active) return;
    plate.active = active;
    plate.art.setActive(active);
  }

  crate(x, platformIndex, { dark = false } = {}) {
    const top = this.scene.platforms[platformIndex].y;
    const size = 62 * this.scale;
    const box = hideShape(this.scene.add.rectangle(x * this.scale, top - size / 2 - 3, size, size, 0, 0));
    this.scene.physics.add.existing(box);
    box.body.setSize(size, size).setCollideWorldBounds(true).setDragX(1050)
      .setMaxVelocity(160, 950);
    for (const platform of this.scene.platforms) this.scene.physics.add.collider(box, platform.zone);
    this.scene.physics.add.collider(this.scene.player, box);
    crateArt(this.scene, box, size, this.scale, { dark });
    box.spawn = { x: box.x, y: box.y };
    this.crates.push(box);
    return box;
  }

  // A lever on a pedestal (used for every switch and ignition).
  switch(x, y) {
    const pos = this.p(x, y);
    const result = { ...pos, art: leverArt(this.scene, pos.x, pos.y, this.scale, AMBER) };
    this.switches.push(result);
    return result;
  }

  ignitor(x, y, { timed = false } = {}) {
    const pos = this.p(x, y);
    return { ...pos, timed, active: false, art: leverArt(this.scene, pos.x, pos.y, this.scale, AMBER, { timed }) };
  }

  activateIgnitor(ignitor) {
    if (ignitor.active && !ignitor.timed) return;
    ignitor.active = true;
    ignitor.art.activate();
  }

  resetTimedIgnitor(ignitor) {
    ignitor.active = false;
    ignitor.art.reset();
  }

  // Release lever with three status lamps (weight, light, released).
  combinationIgnitor(x, y) {
    const pos = this.p(x, y);
    return { ...pos, art: leverArt(this.scene, pos.x, pos.y, this.scale, 0xe5c48f, { lamps: 3 }) };
  }

  // A place to anchor the Shadow: a carved seal or a floating prism.
  receiver(x, y, { kind = 'seal', color = VIOLET } = {}) {
    const pos = this.p(x, y);
    const art = kind === 'prism' ? prismArt(this.scene, pos.x, pos.y, this.scale, color) : sealArt(this.scene, pos.x, pos.y, this.scale, color);
    const marker = { ...pos, art };
    this.receivers.push(marker);
    this.anchorHint(marker);
    return marker;
  }

  bridge(start, end, y, color = CYAN) {
    const left = start * this.scale, right = end * this.scale, top = y * this.scale;
    const surface = hideShape(this.scene.add.rectangle((left + right) / 2, top + 13 * this.scale, right - left, 25 * this.scale, 0, 0));
    this.scene.physics.add.existing(surface, true);
    this.scene.physics.add.collider(this.scene.player, surface);
    const art = shadowBridgeArt(this.scene, left, right, top, this.scale, color);
    return { left, right, top, surface, art };
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
      const plank = this.scene.add.rectangle((i + .5) * plankWidth, 7 * this.scale, plankWidth - 3 * this.scale, 17 * this.scale, i % 2 ? 0x3f2c1f : 0x4d3626)
        .setStrokeStyle(2 * this.scale, 0x07090c);
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
  }

  buildFacility() {
    this.boxA = this.crate(345, 0);
    this.plateA = this.plate(720, 735);
    this.gateA = this.gate('pressure', 900, 735);
    this.switchA = this.ignitor(1280, 625);
    this.switchB = this.ignitor(2380, 620);
    this.gateB = this.gate('sequence', 2560, 690, 0xb898da);
    this.switchC = this.ignitor(2820, 580, { timed: true });
    this.gateC = this.gate('timed', 3630, 620, 0xf2b96a);
    this.flags.sequence = 0;
    this.flags.timerEnd = 0;
    const housing = lever => ({ x: lever.x, y: lever.y + 8 * this.scale });
    this.linkUp(this.plateA.anchor, this.gateA.base, () => !!this.flags.plateSolved, CYAN);
    this.linkUp(housing(this.switchA), housing(this.switchB), () => this.flags.sequence >= 1);
    this.linkUp(housing(this.switchB), this.gateB.base, () => this.flags.sequence >= 2, 0xb898da);
    this.linkUp(housing(this.switchC), this.gateC.base, () => !!this.flags.timerEnd || this.gateC.latched, 0xf2b96a);
    this.useHint(this.switchA, () => this.flags.sequence >= 1);
    this.useHint(this.switchB, () => this.flags.sequence >= 2);
    this.useHint(this.switchC, () => !!this.flags.timerEnd);
  }

  buildForest() {
    this.forestSeal = this.receiver(1480, 420);
    this.forestGate = this.gate('forest', 1640, 650, 0xb995d8);
    this.bridgeSeal = this.receiver(3410, 460);
    this.shadowBridge = this.bridge(3200, 3630, 680, 0xb4e7e9);
    this.shadowBridge.surface.body.enable = false;
    this.shadowBridge.art.setAlpha(.12);
    this.flags.bridgeLatched = false;
    const bridge = this.shadowBridge;
    this.linkUp(this.forestSeal, this.forestGate.base, () => this.forestGate.opened, VIOLET, 'rune');
    this.linkUp(this.bridgeSeal, { x: (bridge.left + bridge.right) / 2, y: bridge.top }, () => bridge.surface.body.enable, VIOLET, 'rune');
  }

  buildCavern() {
    this.caveSeal = this.receiver(1480, 390, { kind: 'prism', color: CYAN });
    this.caveGate = this.gate('cave-prism', 1990, 680);
    this.caveLever = this.switch(2780, 585);
    this.caveReceiver = this.receiver(3240, 330, { kind: 'prism', color: CYAN });
    this.caveGateB = this.gate('cave-combination', 3430, 600, 0xe4b886);
    this.flags.lever = false;
    this.linkUp(this.caveSeal, this.caveGate.base, () => this.caveGate.opened, CYAN, 'rune');
    this.linkUp({ x: this.caveLever.x, y: this.caveLever.y + 8 * this.scale }, this.caveReceiver, () => this.flags.lever);
    this.linkUp(this.caveReceiver, this.caveGateB.base, () => this.caveGateB.opened, 0xe4b886, 'rune');
    this.useHint(this.caveLever, () => this.flags.lever);
    const pos = this.p(3200, 330);
    this.spotlight = this.scene.add.graphics().setDepth(1);
    this.spotlightOrigin = pos;
  }

  buildVault() {
    this.vaultBox = this.crate(2940, 5, { dark: true });
    this.vaultPlate = this.plate(3050, 665);
    this.vaultPrism = this.receiver(3500, 465, { kind: 'prism', color: 0xf2d29a });
    this.vaultLever = this.combinationIgnitor(3390, 540);
    this.vaultGate = this.gate('final', 3990, 660, 0xe5c48f);
    this.flags.release = false;
    const housing = { x: this.vaultLever.x, y: this.vaultLever.y + 8 * this.scale };
    this.linkUp(this.vaultPlate.anchor, housing, () => this.vaultPlate.active);
    this.linkUp(this.vaultPrism, housing, () => this.shadowAt(this.vaultPrism), 0xf2d29a, 'rune');
    this.linkUp(housing, this.vaultGate.base, () => this.flags.release, 0xe5c48f);
    this.useHint(this.vaultLever, () => this.flags.release);
  }

  interact() {
    if (this.id === 'abandoned-facility') {
      if (this.near(this.switchA, 83)) {
        if (this.flags.sequence === 0) {
          this.flags.sequence = 1;
          this.activateIgnitor(this.switchA);
        }
      } else if (this.near(this.switchB, 83)) {
        if (this.flags.sequence === 1) {
          this.flags.sequence = 2;
          this.activateIgnitor(this.switchB);
          this.setGate(this.gateB, true, true);
        } else if (this.flags.sequence < 1) this.switchB.art.deny();
      } else if (this.near(this.switchC, 83)) {
        this.flags.timerEnd = this.scene.time.now + 11000;
        this.activateIgnitor(this.switchC);
      }
    } else if (this.id === 'drowned-cavern' && this.near(this.caveLever, 83)) {
      this.flags.lever = true;
      this.caveLever.art.activate();
    } else if (this.id === 'lantern-vault' && this.near(this.vaultLever, 83)) {
      const plate = this.boxOn(this.vaultBox, this.vaultPlate);
      const prism = this.shadowAt(this.vaultPrism);
      if (plate && prism) {
        this.flags.release = true;
        this.setGate(this.vaultGate, true, true);
        this.vaultLever.art.activate();
        this.scene.cinematics.pulse('THE FINAL RELAY', 'Something answers from beneath the island.', 0xe6bd83, 2300);
      } else this.vaultLever.art.deny();
    }
  }

  near(marker, radius) {
    return Math.hypot(this.scene.player.x - marker.x, this.scene.player.y - marker.y) < radius * this.scale;
  }

  boxOn(box, plate) { return Math.abs(box.x - plate.x) < 39 * this.scale && Math.abs(box.body.bottom - plate.y) < 23 * this.scale; }
  shadowAt(marker) { return this.scene.shadow?.isAnchoredNear(marker.x, marker.y, 105 * this.scale) || false; }

  snapshot() {
    const { timerEnd, ...flags } = this.flags;
    return {
      flags: this.id === 'storm-coast' && flags.collapsingStarted ? { ...flags, collapsed: true } : flags,
      timerRemaining: timerEnd ? Math.max(0, timerEnd - this.scene.time.now) : 0,
      crates: this.crates.map(box => ({ x: box.x / this.scale, y: box.y / this.scale })),
      gates: this.gates.map(gate => ({ opened: gate.opened, latched: gate.latched })),
    };
  }

  restore(data) {
    if (!data || typeof data !== 'object') return;
    this.flags = { ...this.flags, ...data.flags };
    if ('timerEnd' in this.flags) this.flags.timerEnd = data.timerRemaining > 0 ? this.scene.time.now + data.timerRemaining : 0;
    data.crates?.forEach((position, index) => {
      const box = this.crates[index];
      if (box && Number.isFinite(position.x) && Number.isFinite(position.y)) box.body.reset(position.x * this.scale, position.y * this.scale);
    });
    data.gates?.forEach((saved, index) => {
      const gate = this.gates[index];
      if (!gate) return;
      gate.opened = !!saved.opened;
      gate.latched = !!saved.latched;
      gate.wall.body.enable = !gate.opened;
      gate.art.setOpen(gate.opened);
    });
    if (this.id === 'storm-coast' && this.flags.collapsed) {
      this.collapsing.surface.body.enable = false;
      this.collapsing.visual.setAlpha(.08);
    }
    if (this.id === 'abandoned-facility') {
      if (this.flags.sequence >= 1) this.activateIgnitor(this.switchA);
      if (this.flags.sequence >= 2) this.activateIgnitor(this.switchB);
      if (this.flags.timerEnd) this.activateIgnitor(this.switchC);
    }
    if (this.id === 'thornwood' && this.flags.bridgeLatched) {
      this.shadowBridge.surface.body.enable = true;
      this.shadowBridge.art.setAlpha(1);
    }
  }

  // Keep timed puzzles honest across a pause.
  shiftTimers(ms) {
    if (this.flags.timerEnd) this.flags.timerEnd += ms;
  }

  update(time) {
    const player = this.scene.player;
    // A crate pushed into a pit returns to where it started, so the puzzle can't soft-lock.
    for (const box of this.crates) {
      if (box.y > this.scene.viewportHeight + 120) box.body.reset(box.spawn.x, box.spawn.y);
    }
    if (this.id === 'storm-coast') {
      const body = this.moving.surface.body;
      if (body.x < this.moving.min || body.x + body.width > this.moving.max) {
        this.moving.velocity *= -1;
        body.setVelocityX(this.moving.velocity);
      }
      this.moving.visual.setPosition(this.moving.surface.x - this.moving.width / 2, this.moving.surface.y - 8 * this.scale);
      if (!this.flags.collapsingStarted && player.body.blocked.down && Math.abs(player.x - this.collapsing.surface.x) < 64 * this.scale) {
        this.flags.collapsingStarted = true;
        this.scene.shakeCamera(380, .004);
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
        this.flags.plateSolved = true;
        this.setGate(this.gateA, true, true);
      }
      if (this.flags.timerEnd) this.switchC.art.setTimer((this.flags.timerEnd - time) / 11000);
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
        this.scene.tweens.add({ targets: this.shadowBridge.art, alpha: bridge ? 1 : .12, duration: 270 });
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
      [plate, prism, this.flags.release].forEach((active, index) => this.vaultLever.art.setLamp(index, active));
      this.prompt = this.flags.release ? 'THE RELAY IS LIVE. WALK INTO THE SIGNAL.'
        : 'WEIGHT ON PLATE  ·  SHADOW IN LIGHT  ·  E AT RELEASE';
    }
    // Visual state: anchor points light up under the Shadow; cables light when solved.
    for (const receiver of this.receivers) receiver.art.setActive(this.shadowAt(receiver));
    for (const { wire, isLit } of this.links) wire.setLit(!!isLit());
  }
}
