import Phaser from 'phaser';

export class PrototypeLevelScene extends Phaser.Scene {
  constructor() {
    super('PrototypeLevel');
  }

  create() {
    this.buildLevel();
    this.scale.on('resize', this.buildLevel, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', this.buildLevel, this));
  }

  buildLevel() {
    this.children.removeAll();
    this.physics.world.colliders.destroy();
    this.physics.world.bodies.clear();
    const { width, height } = this.scale;
    const scale = Phaser.Math.Clamp(Math.min(width / 1280, height / 720), 0.72, 1.15);
    const groundY = height * 0.8;
    this.drawWorld(width, height, groundY);

    this.platforms = [];
    this.addStaticCollider(width / 2, groundY + 16, width, 32);
    this.addPlatform(width * 0.35, groundY - 94, 155 * scale);
    this.addPlatform(width * 0.57, groundY - 167, 145 * scale);
    this.addPlatform(width * 0.75, groundY - 221, 132 * scale);

    this.createKeeperTexture();
    this.player = this.physics.add.sprite(width * 0.14, groundY - 58, 'keeper-graybox');
    this.player.body.setSize(28, 54).setOffset(8, 12).setCollideWorldBounds(true).setMaxVelocity(330, 850);
    for (const platform of this.platforms) this.physics.add.collider(this.player, platform);
    this.lanternGlow = this.add.circle(this.player.x + 18, this.player.y + 3, 35, 0xf4ad48, 0.11).setBlendMode(Phaser.BlendModes.ADD);
    this.lantern = this.add.circle(this.player.x + 18, this.player.y + 3, 5, 0xffc761, 0.98);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,SPACE,ESC');
    this.input.keyboard.on('keydown-ESC', this.returnToMenu, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input.keyboard.off('keydown-ESC', this.returnToMenu, this));
    this.drawHud(width, height, scale);
  }

  createKeeperTexture() {
    if (this.textures.exists('keeper-graybox')) return;
    const art = this.make.graphics({ x: 0, y: 0, add: false });
    art.fillStyle(0x071018, 1).fillRoundedRect(10, 25, 26, 39, 7);
    art.fillStyle(0x283d4d, 1).fillTriangle(11, 60, 36, 60, 24, 17);
    art.fillStyle(0xd7bf81, 1).fillCircle(24, 14, 11);
    art.fillStyle(0x121a20, 1).fillRect(14, 5, 20, 7);
    art.lineStyle(2, 0xc89643, 0.82).lineBetween(12, 28, 8, 51);
    art.fillStyle(0xf4b74d, 1).fillCircle(39, 32, 5);
    art.generateTexture('keeper-graybox', 48, 72);
    art.destroy();
  }

  addPlatform(x, y, width) {
    this.addStaticCollider(x, y, width, 22);
  }

  addStaticCollider(x, y, width, height) {
    const collider = this.add.zone(x, y, width, height);
    this.physics.add.existing(collider, true);
    collider.body.setSize(width, height);
    this.platforms.push(collider);
  }

  returnToMenu() {
    this.scene.start('MainMenu');
  }

  update() {
    if (!this.player?.body) return;
    const movingLeft = this.cursors.left.isDown || this.keys.A.isDown;
    const movingRight = this.cursors.right.isDown || this.keys.D.isDown;
    this.player.setVelocityX(movingLeft ? -330 : movingRight ? 330 : 0);
    if ((this.cursors.space.isDown || this.keys.SPACE.isDown) && this.player.body.blocked.down) this.player.setVelocityY(-490);
    this.player.setFlipX(movingLeft);
    this.lanternGlow.setPosition(this.player.x + (this.player.flipX ? -18 : 18), this.player.y + 4);
    this.lantern.setPosition(this.player.x + (this.player.flipX ? -18 : 18), this.player.y + 4);
  }

  drawWorld(width, height, groundY) {
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x02070d, 0x02070d, 0x12384a, 0x071923, 1).fillRect(0, 0, width, height);
    graphics.fillStyle(0x769bad, 0.06).fillCircle(width * 0.64, height * 0.22, height * 0.42);
    graphics.lineStyle(1, 0xb2d5dc, 0.15);
    for (let x = -60; x < width + 140; x += 56) graphics.lineBetween(x, height * 0.13, x - height * 0.22, height * 0.61);
    graphics.fillStyle(0x0c2e41, 0.78).fillRect(0, groundY - 20, width, height - groundY + 20);
    graphics.lineStyle(2, 0x5a9aac, 0.25);
    for (let y = groundY + 25; y < height; y += 24) graphics.lineBetween(0, y, width, y - 12);
    graphics.fillStyle(0x263942, 1).fillRect(0, groundY, width, 32);
    graphics.fillStyle(0x101a20, 1).fillRect(0, groundY + 32, width, 11);
    graphics.lineStyle(2, 0x9a7742, 0.78).lineBetween(0, groundY, width, groundY);

    for (const [x, y, platformWidth] of [[width * 0.29, groundY - 105, 155], [width * 0.51, groundY - 178, 145], [width * 0.7, groundY - 232, 132]]) {
      graphics.fillStyle(0x324953, 1).fillRect(x, y, platformWidth, 22);
      graphics.fillStyle(0x1c2931, 1).fillRect(x + 7, y + 22, platformWidth - 14, 7);
      graphics.lineStyle(2, 0xd0a653, 0.68).lineBetween(x, y, x + platformWidth, y);
    }

    const lighthouseX = width * 0.86;
    const lighthouseHeight = height * 0.47;
    const topY = groundY - lighthouseHeight;
    graphics.fillStyle(0x071018, 0.96).fillPoints([
      { x: lighthouseX - 60, y: groundY }, { x: lighthouseX + 60, y: groundY },
      { x: lighthouseX + 34, y: topY + 30 }, { x: lighthouseX - 34, y: topY + 30 },
    ], true);
    graphics.fillStyle(0x18323f, 0.92).fillRect(lighthouseX - 46, topY + 25, 92, 22);
    graphics.fillStyle(0x071018, 1).fillRect(lighthouseX - 34, topY + 3, 68, 27);
    graphics.lineStyle(2, 0x6a8d97, 0.65).strokeRect(lighthouseX - 34, topY + 3, 68, 27);
    graphics.fillStyle(0xffc45e, 0.17).fillCircle(lighthouseX, topY + 16, 65);
    graphics.fillStyle(0xffd273, 0.9).fillCircle(lighthouseX, topY + 16, 7);
    graphics.fillStyle(0x03080e, 1).fillRect(lighthouseX - 17, groundY - 80, 34, 80);
    graphics.lineStyle(1, 0xd1a04b, 0.7).lineBetween(lighthouseX - 17, groundY - 80, lighthouseX + 17, groundY - 80);

    for (const x of [width * 0.23, width * 0.45, width * 0.64]) {
      graphics.fillStyle(0xffb24a, 0.12).fillCircle(x, groundY - 25, 26);
      graphics.fillStyle(0xffc269, 0.98).fillCircle(x, groundY - 25, 4);
    }
    this.add.text(lighthouseX, groundY - 102, 'BEACON DOOR', {
      color: '#d2d1bf', fontFamily: 'Arial, sans-serif', fontSize: '12px', letterSpacing: 1,
    }).setOrigin(0.5);
  }

  drawHud(width, height, scale) {
    this.add.text(36, 31, 'PROLOGUE', {
      color: '#e4c777', fontFamily: 'Arial, sans-serif', fontSize: `${Math.round(16 * scale)}px`, fontStyle: 'bold', letterSpacing: 2,
    });
    this.add.text(37, 56, 'THE DARKENED LIGHTHOUSE', {
      color: '#aebfc4', fontFamily: 'Arial, sans-serif', fontSize: `${Math.round(11 * scale)}px`, letterSpacing: 1.2,
    });
    this.add.rectangle(37, 79, 146 * scale, 1, 0xd4a950, 0.65).setOrigin(0, 0.5);
    this.add.text(38, 101, 'Reach the beacon door.', {
      color: '#d5dfdf', fontFamily: 'Arial, sans-serif', fontSize: `${Math.round(14 * scale)}px`,
    });
    this.add.text(width - 35, 35, 'GRAYBOX  •  PRE-ALPHA', {
      color: '#9eafb4', fontFamily: 'Arial, sans-serif', fontSize: `${Math.round(11 * scale)}px`, letterSpacing: 1.3,
    }).setOrigin(1, 0);
    this.add.text(36, height - 34, 'A / D OR ARROWS  MOVE    SPACE  JUMP    ESC  MENU', {
      color: '#91a1a7', fontFamily: 'Arial, sans-serif', fontSize: `${Math.round(11 * scale)}px`, letterSpacing: 0.7,
    }).setAlpha(0.86);
  }
}
