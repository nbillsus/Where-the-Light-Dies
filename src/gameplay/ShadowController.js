import { BoyAnimator } from '../animation/BoyAnimator.js';

const RUN_SPEED = 320;
const JUMP_SPEED = -490;

// The browser chapter talks to this small interface only. A teammate's later
// shadow system can replace it without changing level puzzle definitions.
export class ShadowController {
  constructor(scene, player, displayHeight) {
    this.scene = scene;
    this.player = player;
    this.actor = scene.physics.add.sprite(player.x, player.y, 'boy-upper')
      .setDisplaySize(displayHeight * 330 / 410, displayHeight);
    this.actor.body.setSize(90, 345, false).setOffset(183, 60)
      .setAllowGravity(true).setCollideWorldBounds(true).setMaxVelocity(RUN_SPEED, 1000);
    for (const platform of scene.platforms) scene.physics.add.collider(this.actor, platform.zone);
    this.actor.body.enable = false;
    this.animator = new BoyAnimator(scene, this.actor, displayHeight, { ghost: true });
    this.animator.visual.setVisible(false);
    this.detached = false;
    this.anchored = false;
    this.controlling = false;
    this.lastGrounded = 0;
    this.jumpQueued = -1000;
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
    this.actor.setFlipX(this.player.flipX);
    this.actor.body.setOffset(this.player.flipX ? 57 : 183, 60);
    this.actor.body.enable = true;
    this.actor.body.setAllowGravity(true);
    this.placeOnPlayer();
    this.animator.visual.setVisible(true);
    this.detached = true;
    this.anchored = false;
    this.controlling = true;
    this.lastGrounded = this.scene.time.now;
    this.jumpQueued = -1000;
    this.scene.followActor(this.actor);
    return true;
  }

  toggleAnchor() {
    if (!this.detached) return;
    this.anchored = !this.anchored;
    this.controlling = !this.anchored;
    this.actor.setVelocity(0, 0);
    this.actor.setAcceleration(0, 0).setDragX(2200);
    this.actor.body.setAllowGravity(!this.anchored);
    if (this.controlling) {
      this.lastGrounded = this.scene.time.now;
      this.jumpQueued = -1000;
    }
    this.scene.followActor(this.controlling ? this.actor : this.player);
  }

  update(time, delta, keys) {
    if (!this.detached) return;
    if (this.controlling) {
      const dx = Number(keys.right) - Number(keys.left);
      this.actor.setAccelerationX(dx * 2100).setDragX(dx ? 900 : 2200);
      if (dx) {
        this.actor.setFlipX(dx < 0);
        this.actor.body.setOffset(dx < 0 ? 57 : 183, 60);
      }
      const grounded = this.actor.body.blocked.down || this.actor.body.touching.down;
      if (grounded) this.lastGrounded = time;
      if (keys.jumpPressed) this.jumpQueued = time;
      if (time - this.jumpQueued < 130 && time - this.lastGrounded < 120) {
        this.actor.setVelocityY(JUMP_SPEED);
        this.jumpQueued = -1000;
        this.lastGrounded = -1000;
      }
      if (!keys.jumpHeld && this.actor.body.velocity.y < -180) this.actor.setVelocityY(this.actor.body.velocity.y * .86);
      this.animator.update(time, delta, grounded);
      if (this.actor.y > this.scene.viewportHeight + 110) this.resetAtPlayer();
    } else {
      this.actor.setVelocity(0, 0).setAcceleration(0, 0);
      this.animator.update(time, delta, false);
    }
  }

  resetAtPlayer() {
    this.actor.body.setAllowGravity(true);
    this.placeOnPlayer();
    this.lastGrounded = this.scene.time.now;
    this.jumpQueued = -1000;
    this.scene.followActor(this.actor);
  }

  placeOnPlayer() {
    this.actor.setPosition(this.player.x, this.player.y).setVelocity(0, 0).setAcceleration(0, 0);
    this.actor.body.updateFromGameObject();
    const platform = this.scene.platforms.find(candidate => this.player.body.center.x >= candidate.left
      && this.player.body.center.x <= candidate.right && Math.abs(this.player.body.bottom - candidate.y) < 16);
    if (platform) {
      this.actor.y -= this.actor.body.bottom - (platform.y - 2);
      this.actor.body.updateFromGameObject();
    }
    this.actor.body.reset(this.actor.x, this.actor.y);
  }

  isAnchoredNear(x, y, radius) {
    if (!this.detached || !this.anchored) return false;
    return Math.hypot(this.actor.x - x, this.actor.y - y) <= radius;
  }
}
