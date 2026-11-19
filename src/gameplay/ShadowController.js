import { BoyAnimator } from '../animation/BoyAnimator.js';

// The browser chapter talks to this small interface only. A teammate's later
// shadow system can replace it without changing level puzzle definitions.
export class ShadowController {
  constructor(scene, player, displayHeight) {
    this.scene = scene;
    this.player = player;
    this.actor = scene.physics.add.sprite(player.x, player.y, 'boy-upper')
      .setDisplaySize(displayHeight * 330 / 410, displayHeight);
    this.actor.body.setSize(90, 345, false).setOffset(183, 60)
      .setAllowGravity(false).setCollideWorldBounds(true).setMaxVelocity(370, 370);
    this.actor.body.enable = false;
    this.animator = new BoyAnimator(scene, this.actor, displayHeight, { ghost: true });
    this.animator.visual.setVisible(false);
    this.detached = false;
    this.anchored = false;
    this.controlling = false;
  }

  toggleDetach() {
    if (this.detached) {
      this.actor.setVelocity(0, 0);
      this.actor.body.enable = false;
      this.animator.visual.setVisible(false);
      this.detached = false;
      this.anchored = false;
      this.controlling = false;
      this.scene.followActor(this.player);
      return false;
    }
    this.actor.body.enable = true;
    this.actor.setPosition(this.player.x + 64, this.player.y - 10).setVelocity(0, 0);
    this.actor.setFlipX(this.player.flipX);
    this.animator.visual.setVisible(true);
    this.detached = true;
    this.anchored = false;
    this.controlling = true;
    this.scene.followActor(this.actor);
    return true;
  }

  toggleAnchor() {
    if (!this.detached) return;
    this.anchored = !this.anchored;
    this.controlling = !this.anchored;
    this.actor.setVelocity(0, 0);
    this.scene.followActor(this.controlling ? this.actor : this.player);
  }

  update(time, delta, keys) {
    if (!this.detached) return;
    if (this.controlling) {
      const dx = Number(keys.right) - Number(keys.left);
      const dy = Number(keys.down) - Number(keys.up);
      this.actor.setVelocity(dx * 350, dy * 350);
      if (dx) {
        this.actor.setFlipX(dx < 0);
        this.actor.body.setOffset(dx < 0 ? 57 : 183, 60);
      }
    } else this.actor.setVelocity(0, 0);
    this.animator.update(time, delta, true);
  }

  isAnchoredNear(x, y, radius) {
    if (!this.detached || !this.anchored) return false;
    return Math.hypot(this.actor.x - x, this.actor.y - y) <= radius;
  }
}
