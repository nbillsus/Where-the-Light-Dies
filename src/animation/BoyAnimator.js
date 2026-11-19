const ART_WIDTH = 330;
const ART_HEIGHT = 410;

function drawLeg(graphics, hipX, kneeX, kneeY, ankleX, ankleY, color, rimAlpha) {
  graphics.lineStyle(34, color, 1).beginPath().moveTo(hipX, 317).lineTo(kneeX, kneeY).lineTo(ankleX, ankleY - 9).strokePath();
  graphics.fillStyle(color, 1).fillCircle(kneeX, kneeY, 17);
  graphics.fillStyle(0x03050b, 1).fillPoints([
    { x: ankleX - 17, y: ankleY - 13 }, { x: ankleX + 13, y: ankleY - 13 },
    { x: ankleX + 29, y: ankleY - 3 }, { x: ankleX + 31, y: ankleY + 3 },
    { x: ankleX - 18, y: ankleY + 3 },
  ], true);
  graphics.lineStyle(3, 0x8e9db8, rimAlpha).lineBetween(ankleX + 9, ankleY - 13, ankleX + 27, ankleY - 3);
  graphics.lineStyle(2, 0x8e9db8, rimAlpha * 0.8).lineBetween(ankleX - 13, ankleY + 2, ankleX + 24, ankleY + 2);
}

export class BoyAnimator {
  constructor(scene, player, displayHeight) {
    this.player = player;
    this.scale = displayHeight / ART_HEIGHT;
    this.displayWidth = ART_WIDTH * this.scale;
    this.visual = scene.add.container(0, 0).setDepth(2);
    this.cape = scene.add.graphics();
    this.legs = scene.add.graphics();
    this.upper = scene.add.image(0, 0, 'boy-upper').setOrigin(0);
    this.visual.add([this.cape, this.legs, this.upper]);
    this.phase = 0;
    this.runBlend = 0;
    this.wasAirborne = false;
    this.landingUntil = 0;
    player.setVisible(false);
    this.update(0, 16, true);
  }

  update(time, delta, grounded) {
    const { player } = this;
    const speed = Math.abs(player.body.velocity.x);
    const moving = grounded && speed > 30;
    this.runBlend += ((moving ? 1 : 0) - this.runBlend) * Math.min(1, delta / 105);
    if (moving) this.phase += speed * delta / 1000 * Math.PI * 2 / 175;

    if (grounded && this.wasAirborne) this.landingUntil = time + 150;
    this.wasAirborne = !grounded;
    const landing = grounded && time < this.landingUntil
      ? Math.sin((this.landingUntil - time) / 150 * Math.PI) : 0;
    const rising = !grounded && player.body.velocity.y < -60;
    const falling = !grounded && !rising;
    const bob = grounded ? this.runBlend * (1 - Math.cos(this.phase * 2)) * 5 : rising ? -8 : -3;
    this.upper.setY(bob + landing * 8).setScale(1, 1 - landing * 0.1);

    const x = player.flipX ? player.x + this.displayWidth / 2 : player.x - this.displayWidth / 2;
    this.visual.setPosition(x, player.y - ART_HEIGHT * this.scale / 2);
    this.visual.setScale(player.flipX ? -this.scale : this.scale, this.scale);

    const flutter = (Math.sin(this.phase - 0.7) * 9 * this.runBlend) + Math.sin(time * 0.003) * 2;
    this.cape.clear();
    this.cape.fillStyle(0x050711, 0.98).fillPoints([
      { x: 225, y: 209 + bob }, { x: 145, y: 226 + bob },
      { x: 57, y: 273 + flutter + bob }, { x: 72, y: 302 + flutter + bob },
      { x: 122, y: 280 + flutter + bob }, { x: 161, y: 338 + flutter + bob },
      { x: 215, y: 250 + bob },
    ], true);
    this.cape.lineStyle(4, 0x8e9db8, 0.38).lineBetween(145, 226 + bob, 59, 273 + flutter + bob);

    let nearKneeX, nearKneeY, nearAnkleX, nearAnkleY;
    let farKneeX, farKneeY, farAnkleX, farAnkleY;
    if (rising) {
      [nearKneeX, nearKneeY, nearAnkleX, nearAnkleY] = [271, 346, 256, 370];
      [farKneeX, farKneeY, farAnkleX, farAnkleY] = [186, 350, 171, 381];
    } else if (falling) {
      [nearKneeX, nearKneeY, nearAnkleX, nearAnkleY] = [269, 362, 273, 399];
      [farKneeX, farKneeY, farAnkleX, farAnkleY] = [184, 362, 181, 399];
    } else {
      const swing = Math.sin(this.phase) * this.runBlend;
      const nearLift = Math.max(0, swing);
      const farLift = Math.max(0, -swing);
      nearKneeX = 246 + swing * 41;
      nearKneeY = 364 - nearLift * 18 + landing * 10;
      nearAnkleX = 255 + swing * 62;
      nearAnkleY = 405 - nearLift * 43;
      farKneeX = 201 - swing * 39;
      farKneeY = 364 - farLift * 18 + landing * 10;
      farAnkleX = 193 - swing * 57;
      farAnkleY = 405 - farLift * 43;
    }
    this.legs.clear();
    drawLeg(this.legs, 207, farKneeX, farKneeY, farAnkleX, farAnkleY, 0x10131b, 0.19);
    drawLeg(this.legs, 246, nearKneeX, nearKneeY, nearAnkleX, nearAnkleY, 0x05070d, 0.39);
  }
}
