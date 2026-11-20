import Phaser from 'phaser';
import coastUrl from '../../assets/environment/parkour/storm-coast.svg?url';
import facilityUrl from '../../assets/environment/parkour/abandoned-facility.svg?url';
import thornwoodUrl from '../../assets/environment/parkour/thornwood.svg?url';
import cavernUrl from '../../assets/environment/parkour/drowned-cavern.svg?url';
import vaultUrl from '../../assets/environment/parkour/lantern-vault.svg?url';
import descentUrl from '../../assets/environment/chapter-two/red-descent.svg?url';
import worksUrl from '../../assets/environment/chapter-two/ossuary-works.svg?url';
import arrayUrl from '../../assets/environment/chapter-two/crimson-array.svg?url';
import chamberUrl from '../../assets/environment/chapter-two/bloodglass-chamber.svg?url';
import heartUrl from '../../assets/environment/chapter-two/heart-of-works.svg?url';
import boyUpperUrl from '../../assets/characters/boy_upper.png?url';
import { BoyAnimator } from '../animation/BoyAnimator.js';
import { CHAPTER_STAGES } from '../levels/chapterData.js';
import { ShadowController } from '../gameplay/ShadowController.js';
import { ChapterMechanics } from '../gameplay/ChapterMechanics.js';
import { ChapterTwoMechanics } from '../gameplay/ChapterTwoMechanics.js';
import { Cinematics } from '../gameplay/Cinematics.js';
import { HorrorPresentation } from '../gameplay/HorrorPresentation.js';
import { Atmosphere } from '../effects/Atmosphere.js';
import { Hud } from '../ui/Hud.js';
import { KeyPrompt } from '../ui/KeyPrompt.js';
import { fixedLayerOffset, logicalSize, renderScale, sharpenText } from '../rendering.js';
import { saveSlot } from '../saveSlots.js';

const ART_URLS = [coastUrl, facilityUrl, thornwoodUrl, cavernUrl, vaultUrl, descentUrl, worksUrl, arrayUrl, chamberUrl, heartUrl];
const RUN_SPEED = 320;
const JUMP_SPEED = -525;

export class ChapterScene extends Phaser.Scene {
  constructor() { super('Chapter'); }

  init(data) {
    this.levelIndex = Phaser.Math.Clamp(data?.levelIndex ?? 0, 0, CHAPTER_STAGES.length - 1);
    this.slotIndex = data?.slotIndex ?? null;
    this.restoreData = data?.restore ?? null;
  }

  preload() {
    const stage = CHAPTER_STAGES[this.levelIndex];
    this.backdropKey = `chapter-${stage.id}`;
    if (!this.textures.exists(this.backdropKey)) this.load.svg(this.backdropKey, ART_URLS[this.levelIndex]);
    if (!this.textures.exists('boy-upper')) this.load.image('boy-upper', boyUpperUrl);
  }

  create() {
    this.stage = CHAPTER_STAGES[this.levelIndex];
    const { width: w, height: h } = logicalSize(this);
    this.viewportWidth = w;
    this.viewportHeight = h;
    this.artScale = h / this.stage.height;
    this.worldWidth = this.stage.width * this.artScale;
    this.cameras.main.setZoom(renderScale).setBounds(0, 0, this.worldWidth, h);
    this.add.image(this.worldWidth / 2, h / 2, this.backdropKey).setDisplaySize(this.worldWidth, h).setDepth(-10);

    this.platforms = this.stage.platforms.map(([start, end, top]) => {
      const left = start * this.artScale;
      const right = end * this.artScale;
      const y = top * this.artScale;
      const zone = this.add.zone((left + right) / 2, y + 20, right - left, 40);
      this.physics.add.existing(zone, true);
      return { left, right, y, zone };
    });
    this.atmosphere = new Atmosphere(this);

    this.spriteHeight = Phaser.Math.Clamp(h * .21, 100, 190);
    const spriteWidth = this.spriteHeight * 330 / 410;
    const edgeInset = spriteWidth * .19;
    this.physics.world.setBounds(edgeInset, 0, this.worldWidth - edgeInset * 2, h + 320);
    this.player = this.physics.add.sprite(145 * this.artScale, this.platforms[0].y - this.spriteHeight * .49, 'boy-upper')
      .setDisplaySize(spriteWidth, this.spriteHeight);
    this.player.body.setSize(90, 345, false).setOffset(183, 60)
      .setCollideWorldBounds(true).setMaxVelocity(RUN_SPEED, 1000);
    this.placePlayerOnPlatform(0, 145 * this.artScale);
    this.player.setDragX(2200);
    for (const platform of this.platforms) this.physics.add.collider(this.player, platform.zone);
    this.animator = new BoyAnimator(this, this.player, this.spriteHeight);
    this.shadow = this.stage.shadow ? new ShadowController(this, this.player, this.spriteHeight) : null;
    this.cinematics = new Cinematics(this);
    this.mechanics = this.stage.chapter === 2 ? new ChapterTwoMechanics(this) : new ChapterMechanics(this);
    this.horror = new HorrorPresentation(this);
    this.checkpoint = 0;
    this.lastGrounded = 0;
    this.jumpQueued = -1000;
    this.finished = false;
    this.paused = false;
    this.pausePanel = null;
    this.pauseSelection = 0;
    this.shadowAwakeningShown = false;
    if (import.meta.env.DEV) {
      const requested = Number.parseInt(new URLSearchParams(window.location.search).get('checkpoint'), 10);
      if (Number.isInteger(requested) && requested >= 1 && requested <= this.platforms.length) {
        this.checkpoint = requested - 1;
        this.placePlayerOnPlatform(this.checkpoint);
      }
    }

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,W,S,SPACE,Q,F,G,E,R');
    this.input.keyboard.on('keydown-ESC', this.togglePause, this);
    this.input.keyboard.on('keydown-UP', this.pauseUp, this);
    this.input.keyboard.on('keydown-DOWN', this.pauseDown, this);
    this.input.keyboard.on('keydown-ENTER', this.pauseActivate, this);
    this.input.on('pointerdown', this.handlePausePointer, this);
    this.onPageHide = () => this.saveProgress();
    window.addEventListener('pagehide', this.onPageHide);
    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => {
      this.input.keyboard.off('keydown-ESC', this.togglePause, this);
      this.input.keyboard.off('keydown-UP', this.pauseUp, this);
      this.input.keyboard.off('keydown-DOWN', this.pauseDown, this);
      this.input.keyboard.off('keydown-ENTER', this.pauseActivate, this);
      this.input.off('pointerdown', this.handlePausePointer, this);
      window.removeEventListener('pagehide', this.onPageHide);
      this.scale.off('resize', this.onResize, this);
      this.horror?.destroy();
    });

    this.cameras.main.setDeadzone(Math.min(w * .3, 360), h * .42);
    this.followActor(this.player);
    this.hud = new Hud(this);
    this.keyPrompt = new KeyPrompt(this);
    if (this.restoreData) this.applySave(this.restoreData);
    else if (this.levelIndex !== 5) this.cinematics.pulse(this.stage.title, this.stage.subtitle,
      this.stage.chapter === 2 ? 0xe96756 : this.stage.shadow ? 0xb79bdb : 0xa5dde3, 2600);
    if (this.slotIndex !== null) this.time.addEvent({ delay: 5000, loop: true, callback: () => { if (!this.paused) this.saveProgress(); } });
    sharpenText(this);
  }

  followActor(actor) { this.cameras.main.startFollow(actor, false, .12, .12); }
  onResize() { this.scene.restart({ levelIndex: this.levelIndex, slotIndex: this.slotIndex, restore: this.captureSave() }); }

  captureSave() {
    return {
      levelIndex: this.levelIndex,
      x: this.player.x / this.artScale,
      y: this.player.y / this.artScale,
      facingLeft: this.player.flipX,
      mechanics: this.mechanics.snapshot(),
      shadow: this.shadow?.detached ? {
        x: this.shadow.actor.x / this.artScale, y: this.shadow.actor.y / this.artScale,
        facingLeft: this.shadow.actor.flipX, anchored: this.shadow.anchored,
      } : null,
      completed: this.finished && this.levelIndex === CHAPTER_STAGES.length - 1,
    };
  }

  saveProgress() {
    if (this.slotIndex === null) return false;
    return saveSlot(this.slotIndex, this.captureSave());
  }

  applySave(data) {
    this.mechanics.restore(data.mechanics);
    if (Number.isFinite(data.x) && Number.isFinite(data.y)) {
      const x = Phaser.Math.Clamp(data.x * this.artScale, 30, this.worldWidth - 30);
      const y = Phaser.Math.Clamp(data.y * this.artScale, 20, this.viewportHeight + 50);
      this.player.body.reset(x, y);
      this.player.setFlipX(!!data.facingLeft);
      this.player.body.setOffset(data.facingLeft ? 57 : 183, 60);
    }
    if (this.shadow && data.shadow && Number.isFinite(data.shadow.x) && Number.isFinite(data.shadow.y)) {
      this.shadow.toggleDetach();
      this.shadow.actor.body.reset(data.shadow.x * this.artScale, data.shadow.y * this.artScale);
      this.shadow.actor.setFlipX(!!data.shadow.facingLeft);
      this.shadow.actor.body.setOffset(data.shadow.facingLeft ? 57 : 183, 60);
      if (data.shadow.anchored) this.shadow.toggleAnchor();
    }
    this.followActor(this.shadow?.controlling ? this.shadow.actor : this.player);
    this.cameras.main.centerOn(this.player.x, this.player.y);
    if (data.completed) { this.finished = true; this.cinematics.finale(this.stage.chapter || 1); }
  }

  togglePause() {
    if (this.paused) { this.closePause(); return; }
    this.paused = true;
    this.physics.world.pause();
    this.tweens.pauseAll();
    const w = this.viewportWidth, h = this.viewportHeight;
    const offset = fixedLayerOffset(w, h);
    this.pausePanel = this.add.container(offset.x, offset.y).setScrollFactor(0).setDepth(150);
    this.pausePanel.add(this.add.rectangle(w / 2, h / 2, w, h, 0x020811, .8));
    this.pausePanel.add(this.add.rectangle(w / 2, h / 2, Math.min(540, w - 32), Math.min(450, h - 32), 0x10232d, .98)
      .setStrokeStyle(2, 0xd8af69));
    this.pausePanel.add(this.add.text(w / 2, h / 2 - 160, 'GAME PAUSED', {
      fontFamily: 'Georgia, serif', fontSize: '31px', color: '#f5eddb',
    }).setOrigin(.5));
    this.pauseRows = ['Resume', 'Save & Main Menu', 'Settings'].map((label, index) => {
      const row = this.add.text(w / 2, h / 2 - 57 + index * 72, label, {
        fontFamily: 'Georgia, serif', fontSize: '23px', color: '#c7d5d2',
      }).setOrigin(.5);
      this.pausePanel.add(row);
      return row;
    });
    this.pauseSelection = 0;
    this.refreshPauseRows();
    this.pausePanel.add(this.add.text(w / 2, h / 2 + 177, 'ESC RESUME  ·  ↑ ↓ SELECT  ·  ENTER CONFIRM', {
      fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#9eafb0', letterSpacing: 1,
    }).setOrigin(.5));
    sharpenText(this);
  }

  refreshPauseRows() { this.pauseRows?.forEach((row, index) => row.setColor(index === this.pauseSelection ? '#f5d499' : '#c7d5d2')); }
  pauseUp() { if (this.paused && !this.pauseSettings) { this.pauseSelection = (this.pauseSelection + 2) % 3; this.refreshPauseRows(); } }
  pauseDown() { if (this.paused && !this.pauseSettings) { this.pauseSelection = (this.pauseSelection + 1) % 3; this.refreshPauseRows(); } }
  handlePausePointer(pointer) {
    if (!this.paused) return;
    const x = pointer.x / renderScale, y = pointer.y / renderScale;
    const midX = this.viewportWidth / 2, midY = this.viewportHeight / 2;
    if (Math.abs(x - midX) > Math.min(270, (this.viewportWidth - 32) / 2)) return;
    if (this.pauseSettings) {
      if (Math.abs(y - (midY + 140)) < 30) { this.pauseSettings.destroy(true); this.pauseSettings = null; return; }
      const index = [midY - 50, midY + 24].findIndex(rowY => Math.abs(y - rowY) < 30);
      if (index >= 0) this.pauseSettingToggles[index]();
      return;
    }
    const index = [midY - 57, midY + 15, midY + 87].findIndex(rowY => Math.abs(y - rowY) < 31);
    if (index >= 0) { this.pauseSelection = index; this.pauseActivate(); }
  }
  pauseActivate() {
    if (!this.paused || this.pauseSettings) return;
    if (this.pauseSelection === 0) this.closePause();
    else if (this.pauseSelection === 1) {
      if (!this.saveProgress()) { this.announce('SAVE FAILED. CHECK BROWSER STORAGE.', 0xf19a9a); return; }
      this.physics.world.resume();
      this.tweens.resumeAll();
      this.scene.start('MainMenu');
    } else this.showPauseSettings();
  }

  showPauseSettings() {
    const w = this.viewportWidth, h = this.viewportHeight;
    const settings = (() => { try { return { rain: true, shake: true, ...JSON.parse(localStorage.getItem('wtld-settings') || '{}') }; }
      catch { return { rain: true, shake: true }; } })();
    this.pauseSettings = this.add.container(0, 0);
    this.pausePanel.add(this.pauseSettings);
    this.pauseSettings.add(this.add.rectangle(w / 2, h / 2, Math.min(540, w - 32), Math.min(450, h - 32), 0x10232d, .99)
      .setStrokeStyle(2, 0xd8af69));
    this.pauseSettings.add(this.add.text(w / 2, h / 2 - 154, 'SETTINGS', {
      fontFamily: 'Georgia, serif', fontSize: '30px', color: '#f5eddb',
    }).setOrigin(.5));
    this.pauseSettingToggles = [];
    for (const [index, key, label] of [[0, 'rain', 'Rain effects'], [1, 'shake', 'Screen shake']]) {
      const row = this.add.text(w / 2, h / 2 - 50 + index * 74, '', {
        fontFamily: 'Arial, sans-serif', fontSize: '19px', color: '#d8e1dc',
      }).setOrigin(.5);
      const refresh = () => row.setText(`${label}     ${settings[key] ? 'ON' : 'OFF'}`);
      refresh();
      this.pauseSettingToggles[index] = () => { settings[key] = !settings[key]; localStorage.setItem('wtld-settings', JSON.stringify(settings)); refresh(); };
      this.pauseSettings.add(row);
    }
    this.pauseSettings.add(this.add.text(w / 2, h / 2 + 140, 'BACK', { fontFamily: 'Georgia, serif', fontSize: '21px', color: '#f5d499' })
      .setOrigin(.5));
  }

  closePause() {
    if (this.pauseSettings) { this.pauseSettings.destroy(true); this.pauseSettings = null; return; }
    this.pausePanel?.destroy(true);
    this.pausePanel = null;
    this.paused = false;
    this.physics.world.resume();
    this.tweens.resumeAll();
  }

  // A quiet story caption near the top of the screen (no box). Gameplay
  // feedback is shown in the world instead of with text.
  announce(message, color = 0xb9e5df) {
    if (this.toast) this.toast.destroy(true);
    const w = this.viewportWidth, h = this.viewportHeight;
    const offset = fixedLayerOffset(w, h);
    const toast = this.add.container(offset.x, offset.y).setScrollFactor(0).setDepth(45);
    const text = this.add.text(w / 2, h * .17, message, {
      fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: `${Math.round(Math.max(15, Math.min(20, w * .016)))}px`,
      color: `#${color.toString(16).padStart(6, '0')}`, align: 'center', wordWrap: { width: Math.min(w - 80, 720) },
    }).setOrigin(.5).setShadow(0, 1, '#000000', 8, false, true);
    toast.add(text);
    toast.setAlpha(0);
    this.tweens.add({ targets: toast, alpha: 1, duration: 400 });
    this.toast = toast;
    this.time.delayedCall(2600, () => {
      if (toast.active) this.tweens.add({ targets: toast, alpha: 0, duration: 700, onComplete: () => toast.destroy(true) });
    });
    sharpenText(this);
  }

  flashAt(x, y, color) {
    const flare = this.add.circle(x, y, 14, color, .52).setDepth(8);
    this.tweens.add({ targets: flare, radius: 150, alpha: 0, duration: 540, onComplete: () => flare.destroy() });
  }

  showDistantSilhouette() {
    const x = 3190 * this.artScale, y = 380 * this.artScale;
    const figure = this.add.container(x, y).setDepth(-2).setAlpha(.54);
    figure.add(this.add.ellipse(0, 0, 24 * this.artScale, 35 * this.artScale, 0x070a14));
    figure.add(this.add.triangle(0, 50 * this.artScale, 0, 0, -26 * this.artScale, 92 * this.artScale, 30 * this.artScale, 92 * this.artScale, 0x070a14));
    this.tweens.add({ targets: figure, x: x + 210 * this.artScale, alpha: 0, duration: 2100, ease: 'Sine.easeInOut', onComplete: () => figure.destroy(true) });
    this.announce('SOMETHING MOVED BEYOND THE FOG.', 0xadc7e4);
  }

  placePlayerOnPlatform(index, x = null) {
    const platform = this.platforms[index];
    this.player.setPosition(x ?? Math.min(platform.right - 50, platform.left + 40), platform.y - this.spriteHeight * .49);
    this.player.body.updateFromGameObject();
    this.player.y -= this.player.body.bottom - (platform.y - 1);
    this.player.body.updateFromGameObject();
  }

  respawn() {
    this.checkpoint = 0;
    this.placePlayerOnPlatform(0, 145 * this.artScale);
    this.player.setVelocity(0, 0).setAcceleration(0, 0);
    if (this.shadow?.detached) this.shadow.toggleDetach();
    this.jumpQueued = -1000;
    this.lastGrounded = this.time.now;
    this.followActor(this.player);
    this.cameras.main.centerOn(this.player.x, this.player.y);
  }

  finishStage() {
    if (this.finished) return;
    this.finished = true;
    this.player.setVelocity(0, 0).setAcceleration(0, 0);
    if (this.levelIndex === CHAPTER_STAGES.length - 1) {
      this.saveProgress();
      this.cinematics.finale(2);
      return;
    }
    if (this.levelIndex === 4) this.cinematics.pulse('CHAPTER II · THE FACILITY BELOW', 'The signal opens a path beneath the island. The shadow reaches for what the light left behind.', 0xe96756, 2400);
    this.cameras.main.fadeOut(this.levelIndex === 4 ? 2500 : 600, 2, 7, 16);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        if (this.slotIndex !== null) saveSlot(this.slotIndex, { levelIndex: this.levelIndex + 1, x: 145, y: null, mechanics: null, shadow: null });
        this.scene.start('Chapter', { levelIndex: this.levelIndex + 1, slotIndex: this.slotIndex });
      });
  }

  update(time, delta) {
    if (this.paused) return;
    if (this.finished) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.scene.start('Chapter', { levelIndex: this.stage.chapter === 2 ? 5 : 0, slotIndex: this.slotIndex });
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.R)) { this.scene.restart({ levelIndex: this.levelIndex, slotIndex: this.slotIndex }); return; }
    if (this.shadow && Phaser.Input.Keyboard.JustDown(this.keys.Q)) {
      if (this.stage.grasp && this.mechanics.held) this.mechanics.toggleGrasp();
      const detached = this.shadow.toggleDetach();
      if (detached && this.stage.id === 'thornwood' && !this.shadowAwakeningShown) {
        this.shadowAwakeningShown = true;
        this.cinematics.pulse('IT MOVED FIRST', 'The light has not changed. Your shadow has.', 0xb7d5ef, 2400);
      }
    }
    if (this.shadow && Phaser.Input.Keyboard.JustDown(this.keys.F) && this.shadow.detached) {
      this.shadow.toggleAnchor();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.E) && !this.shadow?.controlling) this.mechanics.interact();
    if (this.stage.grasp && Phaser.Input.Keyboard.JustDown(this.keys.G)) this.mechanics.toggleGrasp();

    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.cursors.space);
    const jumpHeld = this.keys.SPACE.isDown || this.cursors.space.isDown;
    const controllingShadow = !!this.shadow?.controlling;
    const direction = controllingShadow ? 0 : Number(right) - Number(left);
    this.player.setAccelerationX(direction * 2100).setDragX(direction ? 900 : 2200);
    if (direction !== 0) {
      const facingLeft = direction < 0;
      this.player.setFlipX(facingLeft);
      this.player.body.setOffset(facingLeft ? 57 : 183, 60);
    }

    const grounded = this.player.body.blocked.down || this.player.body.touching.down;
    if (grounded) this.lastGrounded = time;
    if (!controllingShadow && jumpPressed) this.jumpQueued = time;
    if (!controllingShadow && time - this.jumpQueued < 130 && time - this.lastGrounded < 120) {
      this.player.setVelocityY(JUMP_SPEED);
      this.jumpQueued = -1000;
      this.lastGrounded = -1000;
    }
    if (!controllingShadow && !jumpHeld && this.player.body.velocity.y < -180)
      this.player.setVelocityY(this.player.body.velocity.y * .86);

    this.animator.update(time, delta, grounded);
    this.shadow?.update(time, delta, { left, right, jumpPressed, jumpHeld });
    this.mechanics.update(time);
    this.horror?.update(time);
    this.hud.update();
    this.keyPrompt.update(this.mechanics.hints ?? [], time);
    if (this.player.y > this.viewportHeight + 110) this.respawn();
    if (grounded && this.player.x > this.worldWidth - this.spriteHeight * .43) this.finishStage();
  }
}
