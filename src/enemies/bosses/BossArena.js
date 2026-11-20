import { BossBar } from '../../ui/BossBar.js';
import { TheHollow } from './TheHollow.js';
import { HeartOfTheWorks } from './HeartOfTheWorks.js';

// The end-of-chapter boss fight. Walking into the arena locks it behind you;
// the exit stays sealed until the boss is dead. Dying here brings you back to
// the arena entrance, not the start of the area.
export class BossArena {
  constructor(scene) {
    this.scene = scene;
    const s = scene.artScale, cfg = scene.stage.arena;
    this.startX = cfg.start * s;
    this.endX = scene.worldWidth;
    this.floor = scene.platforms.find(p => p.left <= this.startX && p.right >= this.startX);
    this.state = 'waiting';
    this.boss = cfg.boss === 'heart' ? new HeartOfTheWorks(scene, this) : new TheHollow(scene, this);
    // The boss takes hits and Flare Pulses through the normal enemy list.
    scene.enemies.list.push(this.boss);
    this.bar = new BossBar(scene, this.boss.title, this.boss.color);
    // Invisible walls: the entrance (closed during the fight) and the exit.
    const wall = (x, enabled) => {
      const rect = scene.add.rectangle(x, scene.viewportHeight / 2, 30 * s, scene.viewportHeight * 2, 0, 0);
      scene.physics.add.existing(rect, true);
      scene.physics.add.collider(scene.player, rect);
      rect.body.enable = enabled;
      return rect;
    };
    this.entrance = wall(this.startX - 30 * s, false);
    this.exit = wall(this.endX - 70 * s, true);
  }

  get hints() { return this.state === 'fighting' ? this.boss.hints ?? [] : []; }

  update(time, delta) {
    const player = this.scene.player;
    if (this.state === 'waiting' && player.x > this.startX + 60 * this.scene.artScale && !this.scene.shadow?.controlling) this.engage();
    if (this.state === 'fighting') this.bar.set(this.boss.health / this.boss.maxHealth);
  }

  engage() {
    this.state = 'fighting';
    this.entrance.body.enable = true;
    this.boss.engage();
    this.bar.show();
    this.scene.cinematics.pulse(this.boss.title, this.boss.subtitle, this.boss.color, 2000);
  }

  defeated() {
    this.state = 'won';
    this.entrance.body.enable = false;
    this.exit.body.enable = false;
    this.bar.set(0);
    this.bar.hide();
    this.scene.cinematics.pulse(this.boss.deathTitle, this.boss.deathLine, this.boss.color, 2600);
  }

  /** Called after the player dies and respawns. */
  afterDeath() {
    if (this.state !== 'fighting') return;
    this.state = 'waiting';
    this.entrance.body.enable = false;
    this.boss.reset();
    this.bar.hide();
    const index = this.scene.platforms.indexOf(this.floor);
    this.scene.placePlayerOnPlatform(index, this.startX - 160 * this.scene.artScale);
    this.scene.cameras.main.centerOn(this.scene.player.x, this.scene.player.y);
  }
}
