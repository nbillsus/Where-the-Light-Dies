import { PLACEMENTS } from './placements.js';
import { Skitterer } from './Skitterer.js';
import { ShroudWarden } from './ShroudWarden.js';
import { sfx } from '../combat/sfx.js';
import { TUNING } from '../combat/Combat.js';

// Spawns an area's enemies and routes the player's attacks to them.
export class EnemyDirector {
  constructor(scene) {
    this.scene = scene;
    this.list = (PLACEMENTS[scene.stage.id] ?? []).flatMap(({ type, platform, at, x: artX }) => {
      const ledge = scene.platforms[platform];
      if (!ledge) return [];
      const x = artX != null ? artX * scene.artScale : ledge.left + (ledge.right - ledge.left) * at;
      return [type === 'warden' ? new ShroudWarden(scene, x, ledge) : new Skitterer(scene, x, ledge)];
    });
  }

  update(time, delta) {
    for (const enemy of this.list) enemy.update(time, delta);
  }

  reset() {
    // Drop minions a boss summoned, then put everyone back.
    this.list = this.list.filter(enemy => {
      if (!enemy.summoned) return true;
      enemy.art.destroy(); enemy.body.destroy();
      return false;
    });
    for (const enemy of this.list) enemy.reset();
  }

  /** Light Strike hit box: { left, right, top, bottom }. */
  strike(box, damage, dir, fromX, time, heavy) {
    let landed = 0;
    for (const enemy of this.list) {
      if (!enemy.alive) continue;
      // Bosses report which part was struck (e.g. 'core' or 'body').
      const part = enemy.hitTest ? enemy.hitTest(box) : (enemy.x + enemy.width / 2 > box.left && enemy.x - enemy.width / 2 < box.right
        && enemy.y + enemy.height / 2 > box.top && enemy.y - enemy.height / 2 < box.bottom) ? 'body' : null;
      if (!part) continue;
      const hit = enemy.takeHit(damage, dir, time, heavy, part);
      this.scene.events.emit('combat:hit', enemy, !hit);
      if (hit) landed++;
    }
    if (landed) {
      sfx.hit(this.scene);
      this.scene.shakeCamera(90, .004);
    }
    return landed;
  }

  /** Flare Pulse: destroys Skitterers, stuns Wardens (their armour drops). */
  flare(x, y, radius, time) {
    for (const enemy of this.list) {
      if (!enemy.alive || Math.hypot(enemy.x - x, enemy.y - y) > radius) continue;
      enemy.flareHit(time, TUNING.flareStun);
    }
  }

  nearest(point, maxDist, filter = () => true) {
    let best = null, bestDist = maxDist;
    for (const enemy of this.list) {
      if (!enemy.alive || !filter(enemy)) continue;
      const d = Math.hypot(enemy.x - point.x, enemy.y - point.y);
      if (d < bestDist) { best = enemy; bestDist = d; }
    }
    return best;
  }
}
