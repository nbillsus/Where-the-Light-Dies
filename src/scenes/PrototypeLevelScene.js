import Phaser from 'phaser';
import coastBackdropUrl from '../../assets/environment/coast_backdrop.png?url';

const WORLD_WIDTH = 3100;
const SPEED = 320;
const JUMP = -505;

export class PrototypeLevelScene extends Phaser.Scene {
  constructor() { super('PrototypeLevel'); }

  preload() {
    this.load.image('coast-backdrop', coastBackdropUrl);
  }

  create() {
    this.settings = { rain: true, shake: true };
    try { Object.assign(this.settings, JSON.parse(localStorage.getItem('wtld-settings') || '{}')); } catch { /* defaults */ }
    this.buildLevel();
    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.onResize, this);
      this.input.keyboard.off('keydown-Q', this.toggleShadow, this);
      this.input.keyboard.off('keydown-ESC', this.returnToMenu, this);
    });
  }

  onResize() { this.scene.restart(); }

  buildLevel() {
    const { width: w, height: h } = this.scale;
    this.groundY = Math.max(h * 0.77, 450);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, h);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, h);
    this.drawBackdrop(w, h);
    this.drawWorld(h);
    this.drawForeground(h);
    this.makeTextures();

    this.platforms = [];
    this.addPlatform(WORLD_WIDTH / 2, this.groundY + 19, WORLD_WIDTH, 38);
    for (const [x, y, width] of [[570, -104, 180], [850, -174, 175], [1130, -113, 175], [1480, -148, 190], [1820, -211, 165], [2130, -135, 195], [2530, -190, 180]])
      this.addPlatform(x, this.groundY + y, width, 22);

    this.player = this.physics.add.sprite(170, this.groundY - 55, 'keeper-art').setDepth(7);
    this.player.body.setSize(33, 70).setOffset(16, 12).setCollideWorldBounds(true).setMaxVelocity(420, 1000);
    this.player.setDragX(1800);
    for (const platform of this.platforms) this.physics.add.collider(this.player, platform);
    this.shadow = this.add.image(this.player.x - 40, this.player.y + 14, 'shadow-art').setDepth(6).setAlpha(0.35);
    this.shadowDetached = false;
    this.shadowVelocity = 0;
    this.tether = this.add.graphics().setDepth(5);
    this.lanternGlow = this.add.circle(this.player.x + 28, this.player.y + 4, 47, 0xfab94c, 0.13).setBlendMode(Phaser.BlendModes.ADD).setDepth(8);
    this.lanternCore = this.add.circle(this.player.x + 28, this.player.y + 4, 5, 0xffe5a0, 1).setDepth(9);
    this.particles = this.add.graphics().setDepth(11);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,SPACE,Q,ESC');
    this.input.keyboard.on('keydown-Q', this.toggleShadow, this);
    this.input.keyboard.on('keydown-ESC', this.returnToMenu, this);
    this.cameras.main.startFollow(this.player, false, 0.09, 0.09, 0, h * 0.1);
    this.cameras.main.setDeadzone(Math.min(w * 0.3, 350), h * 0.36);
    this.lastGrounded = 0;
    this.jumpQueued = -1000;
    this.createHud(w, h);
  }

  drawBackdrop(w, h) {
    const g = this.add.graphics().setScrollFactor(0).setDepth(-10);
    g.fillGradientStyle(0x07111d, 0x101e2d, 0x455361, 0x233746, 1).fillRect(0, 0, w, h);
    g.fillStyle(0xc9d4d3, 0.17).fillCircle(w * 0.74, h * 0.19, h * 0.14);
    g.fillStyle(0xdce2d9, 0.36).fillCircle(w * 0.74, h * 0.19, h * 0.055);
    g.fillStyle(0x1b303f, 0.62).fillEllipse(w * 0.23, h * 0.32, w * 0.66, h * 0.13);
    g.fillEllipse(w * 0.75, h * 0.38, w * 0.8, h * 0.18);
    g.fillStyle(0x0f2535, 0.82).fillPoints([{ x: 0, y: h * 0.62 }, { x: w * 0.18, y: h * 0.42 }, { x: w * 0.33, y: h * 0.62 },
      { x: w * 0.5, y: h * 0.46 }, { x: w * 0.7, y: h * 0.64 }, { x: w * 0.88, y: h * 0.43 }, { x: w, y: h * 0.61 }, { x: w, y: h }, { x: 0, y: h }], true);
    g.fillStyle(0x1e4051, 0.8).fillRect(0, h * 0.66, w, h * 0.34);
    g.lineStyle(2, 0x9cb7bb, 0.18);
    for (let row = 0; row < 9; row++) for (let col = 0; col < 12; col++) {
      const y = h * (0.69 + row * 0.034);
      g.lineBetween(col * w / 12 + row * 17, y, col * w / 12 + row * 17 + w * 0.06, y - 3);
    }
    this.add.image(w / 2, h / 2, 'coast-backdrop').setDisplaySize(w + 420, h).setScrollFactor(0.06, 0).setDepth(-9);
    if (this.settings.rain) {
      this.rain = this.add.graphics().setScrollFactor(0).setDepth(15).lineStyle(1, 0xd5e9e8, 0.16);
      for (let i = 0; i < 170; i++) {
        const x = (i * 239.7) % w, y = (i * 127.4) % h;
        this.rain.lineBetween(x, y, x - 15, y + 33);
      }
    }
    const fog = this.add.rectangle(w / 2, h * 0.69, w * 1.2, h * 0.14, 0xc2d8d7, 0.06).setScrollFactor(0).setDepth(3);
    this.tweens.add({ targets: fog, alpha: 0.12, x: w * 0.46, duration: 4600, yoyo: true, repeat: -1 });
  }

  drawWorld(h) {
    const g = this.add.graphics().setDepth(0);
    const y = this.groundY;
    g.fillStyle(0x172b34, 0.93).fillPoints([{ x: 0, y }, { x: 330, y: y - 85 }, { x: 680, y: y - 25 }, { x: 1050, y: y - 95 },
      { x: 1500, y: y - 38 }, { x: 1910, y: y - 118 }, { x: 2360, y: y - 37 }, { x: WORLD_WIDTH, y: y - 100 },
      { x: WORLD_WIDTH, y: h }, { x: 0, y: h }], true);
    for (const [x, size] of [[310, 1], [1080, 0.8], [1650, 1.15], [2410, 0.9], [2870, 1.2]]) {
      g.lineStyle(13 * size, 0x0b1c24, 1).lineBetween(x, y, x - 9 * size, y - 165 * size);
      for (const sign of [-1, 1]) {
        g.lineStyle(5 * size, 0x0b1c24, 1).lineBetween(x - 9 * size, y - 118 * size, x + sign * 52 * size, y - 185 * size);
        g.lineStyle(2, 0x0b1c24, 1).lineBetween(x + sign * 52 * size, y - 185 * size, x + sign * 86 * size, y - 150 * size);
      }
    }
    for (const x of [800, 1720, 2650]) {
      g.fillStyle(0x18272e, 1).fillRect(x - 66, y - 164, 29, 164);
      g.fillRect(x + 44, y - 143, 27, 143);
      g.fillStyle(0x34434a, 1).fillRect(x - 75, y - 173, 47, 12);
      g.fillRect(x + 34, y - 150, 46, 10);
      g.lineStyle(2, 0xb2a683, 0.21).lineBetween(x - 37, y - 164, x + 44, y - 143);
    }
    g.fillStyle(0x253740, 1).fillRect(0, y, WORLD_WIDTH, 38);
    g.fillStyle(0x0b151b, 1).fillRect(0, y + 38, WORLD_WIDTH, h - y);
    g.lineStyle(3, 0x9f8d65, 0.58).lineBetween(0, y, WORLD_WIDTH, y);
    for (let x = 0; x < WORLD_WIDTH; x += 46) {
      g.lineStyle(1, 0x91a1a0, 0.15).lineBetween(x, y + 2, x + 17, y + 31);
      g.fillStyle(0x17282e, 1).fillEllipse(x + 11, y - 4, 24, 9);
    }
    for (const [x, dy, width] of [[570, -104, 180], [850, -174, 175], [1130, -113, 175], [1480, -148, 190], [1820, -211, 165], [2130, -135, 195], [2530, -190, 180]]) {
      g.fillStyle(0x3f555b, 1).fillRect(x - width / 2, y + dy - 11, width, 22);
      g.fillStyle(0x19292e, 1).fillRect(x - width / 2 + 5, y + dy + 11, width - 10, 11);
      g.lineStyle(2, 0xc2aa6e, 0.62).lineBetween(x - width / 2, y + dy - 11, x + width / 2, y + dy - 11);
    }
    for (const x of [480, 1310, 2050, 2750]) {
      g.fillStyle(0x101d22, 1).fillRect(x - 4, y - 81, 8, 81);
      g.fillStyle(0x936d3a, 1).fillRect(x - 11, y - 88, 22, 16);
      g.fillStyle(0xffbb58, 0.14).fillCircle(x, y - 79, 68);
      g.fillStyle(0xffd388, 0.8).fillCircle(x, y - 79, 8);
    }
    this.add.text(100, y - 135, 'THE STORM-LASHED COAST', { fontFamily: 'Georgia, serif', fontSize: '20px', color: '#cfbea0' }).setDepth(2);
    this.add.text(2850, y - 100, 'THE PATH CONTINUES...', { fontFamily: 'Georgia, serif', fontSize: '16px', color: '#b7aaa0' }).setDepth(2);
  }

  drawForeground(h) {
    const g = this.add.graphics().setDepth(12).setAlpha(0.65);
    for (let x = 0; x < WORLD_WIDTH; x += 42) {
      const y = this.groundY + 42;
      g.fillStyle(0x040d12, 1).fillEllipse(x, y, 52, 20);
      g.lineStyle(2, 0x07171a, 1).lineBetween(x, y, x + (x % 3 - 1) * 10, y - 17);
    }
    g.fillStyle(0x08151a, 0.9).fillRect(0, h - 29, WORLD_WIDTH, 29);
  }

  makeTextures() {
    if (!this.textures.exists('keeper-art')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x101a20, 1).fillEllipse(31, 80, 42, 9);
      g.fillStyle(0x131b21, 1).fillRect(16, 57, 12, 24).fillRect(35, 57, 12, 24);
      g.fillStyle(0x2a3032, 1).fillPoints([{ x: 20, y: 32 }, { x: 45, y: 32 }, { x: 53, y: 69 }, { x: 11, y: 69 }], true);
      g.fillStyle(0xb88c45, 1).fillRect(17, 32, 5, 31);
      g.fillStyle(0x4f6264, 1).fillTriangle(29, 29, 47, 31, 34, 64);
      g.fillStyle(0xc8ad79, 1).fillEllipse(32, 21, 22, 25);
      g.fillStyle(0x0b141b, 1).fillRect(20, 10, 25, 9);
      g.fillStyle(0x17232a, 1).fillRect(17, 9, 31, 5);
      g.lineStyle(4, 0x202f34, 1).lineBetween(43, 36, 53, 51);
      g.fillStyle(0x543d24, 1).fillRect(48, 46, 12, 15);
      g.fillStyle(0xffc66c, 1).fillCircle(54, 48, 5);
      g.generateTexture('keeper-art', 64, 88); g.destroy();
    }
    if (!this.textures.exists('shadow-art')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x01050b, 0.8).fillEllipse(33, 68, 51, 33);
      g.fillStyle(0x090c19, 0.95).fillPoints([{ x: 21, y: 24 }, { x: 42, y: 24 }, { x: 57, y: 76 }, { x: 7, y: 76 }], true);
      g.fillStyle(0x090b16, 1).fillCircle(32, 19, 15);
      g.fillStyle(0xc3dfe4, 1).fillEllipse(27, 20, 5, 3).fillEllipse(39, 20, 5, 3);
      g.generateTexture('shadow-art', 64, 88); g.destroy();
    }
  }

  addPlatform(x, y, width, height) {
    const zone = this.add.zone(x, y, width, height);
    this.physics.add.existing(zone, true);
    zone.body.setSize(width, height);
    this.platforms.push(zone);
  }

  createHud(w, h) {
    const ui = this.add.container(0, 0).setScrollFactor(0).setDepth(30);
    ui.add(this.add.rectangle(16, 17, Math.min(460, w - 32), 99, 0x061119, 0.66).setOrigin(0));
    ui.add(this.add.text(32, 28, 'PROLOGUE  /  THE COAST', { fontFamily: 'Georgia, serif', fontSize: '19px', color: '#e6c987' }));
    ui.add(this.add.text(33, 57, 'Find a path through the storm.', { fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#c9d5d0' }));
    this.statusText = this.add.text(33, 83, 'Q  DETACH SHADOW', { fontFamily: 'Arial, sans-serif', fontSize: '12px', letterSpacing: 1, color: '#d3ae72' });
    ui.add(this.statusText);
    ui.add(this.add.text(32, h - 34, 'A / D  RUN     SPACE  JUMP     Q  SHADOW     ESC  MENU', { fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#d5dfdc' }));
  }

  toggleShadow() {
    this.shadowDetached = !this.shadowDetached;
    this.shadow.setAlpha(this.shadowDetached ? 0.95 : 0.32);
    if (this.shadowDetached) {
      this.shadow.setPosition(this.player.x + (this.player.flipX ? -55 : 55), this.player.y + 8);
      if (this.settings.shake) this.cameras.main.shake(110, 0.0015);
    }
    this.statusText.setText(this.shadowDetached ? 'SHADOW DETACHED  •  Q TO RECALL' : 'Q  DETACH SHADOW');
  }

  returnToMenu() { this.scene.start('MainMenu'); }

  update(time, delta) {
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const direction = Number(right) - Number(left);
    if (this.shadowDetached) {
      this.player.setAccelerationX(0).setDragX(1800);
      this.shadowVelocity = Phaser.Math.Linear(this.shadowVelocity, direction * SPEED * 1.1, Math.min(1, delta / 90));
      this.shadow.x = Phaser.Math.Clamp(this.shadow.x + this.shadowVelocity * delta / 1000, this.player.x - 250, this.player.x + 250);
      this.shadow.y = this.player.y + 8 + Math.sin(time * 0.006) * 6;
      this.shadow.setFlipX(direction < 0);
    } else {
      this.player.setAccelerationX(direction * 2150).setDragX(direction ? 900 : 2200);
      this.shadow.setPosition(this.player.x - (this.player.flipX ? -42 : 42), this.player.y + 15);
      this.shadowVelocity = 0;
    }
    this.player.setFlipX(direction < 0 || (direction === 0 && this.player.flipX));
    if (this.player.body.blocked.down) this.lastGrounded = time;
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.cursors.space)) this.jumpQueued = time;
    if (!this.shadowDetached && time - this.jumpQueued < 130 && time - this.lastGrounded < 120) {
      this.player.setVelocityY(JUMP); this.jumpQueued = -1000; this.lastGrounded = -1000;
    }
    const lanternX = this.player.x + (this.player.flipX ? -22 : 22);
    this.lanternGlow.setPosition(lanternX, this.player.y + 8);
    this.lanternCore.setPosition(lanternX, this.player.y + 8);
    this.tether.clear();
    if (this.shadowDetached) {
      this.tether.lineStyle(2, 0xaeb9d0, 0.5).lineBetween(this.player.x, this.player.y + 24, this.shadow.x, this.shadow.y + 24);
      this.tether.fillStyle(0xc0d6e1, 0.22).fillCircle(this.shadow.x, this.shadow.y + 4, 35);
    }
    this.particles.clear();
    for (let i = 0; i < 7; i++) {
      const a = time * 0.0016 + i * 2.4;
      this.particles.fillStyle(0xffd48a, 0.13 + i * 0.03).fillCircle(lanternX + Math.sin(a) * (13 + i * 3), this.player.y + 5 + Math.cos(a * 0.7) * (9 + i * 2), 1 + i % 2);
    }
    if (this.rain) this.rain.y = (time * 0.07) % 33;
  }
}
