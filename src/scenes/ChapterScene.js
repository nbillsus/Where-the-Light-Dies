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
import reefUrl from '../../assets/environment/chapter-three/moonbreak-reef.svg?url';
import tideUrl from '../../assets/environment/chapter-three/glass-tide.svg?url';
import orchardUrl from '../../assets/environment/chapter-three/ash-orchard.svg?url';
import observatoryUrl from '../../assets/environment/chapter-three/hollow-observatory.svg?url';
import lensUrl from '../../assets/environment/chapter-three/black-lens.svg?url';
import boyUpperUrl from '../../assets/characters/boy_upper.png?url';
import { BoyAnimator } from '../animation/BoyAnimator.js';
import { CHAPTER_STAGES } from '../levels/chapterData.js';
import { ShadowController } from '../gameplay/ShadowController.js';
import { ChapterMechanics } from '../gameplay/ChapterMechanics.js';
import { ChapterTwoMechanics } from '../gameplay/ChapterTwoMechanics.js';
import { ChapterThreeMechanics } from '../gameplay/ChapterThreeMechanics.js';
import { Cinematics } from '../gameplay/Cinematics.js';
import { HorrorPresentation } from '../gameplay/HorrorPresentation.js';
import { Atmosphere } from '../effects/Atmosphere.js';
import { Hud } from '../ui/Hud.js';
import { KeyPrompt } from '../ui/KeyPrompt.js';
import { readSettings } from '../settings.js';
import { Combat } from '../combat/Combat.js';
import { EnemyDirector } from '../enemies/EnemyDirector.js';
import { BossArena } from '../enemies/bosses/BossArena.js';
import { fixedLayerOffset, logicalSize, renderScale, sharpenText } from '../rendering.js';
import { saveSlot } from '../saveSlots.js';

const ART_URLS = [coastUrl, facilityUrl, thornwoodUrl, cavernUrl, vaultUrl, descentUrl, worksUrl, arrayUrl, chamberUrl, heartUrl,
  reefUrl, tideUrl, orchardUrl, observatoryUrl, lensUrl];
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
    // The painted backdrop covers the original 4096-wide area; boss arenas
    // beyond it are drawn in code (src/effects/ArenaBackdrop.js).
    const artWidth = (this.stage.artWidth ?? this.stage.width) * this.artScale;
    this.add.image(artWidth / 2, h / 2, this.backdropKey).setDisplaySize(artWidth, h).setDepth(-10);

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
    this.mechanics = this.stage.chapter === 3 ? new ChapterThreeMechanics(this)
      : this.stage.chapter === 2 ? new ChapterTwoMechanics(this) : new ChapterMechanics(this);
    this.horror = new HorrorPresentation(this);
    this.enemies = new EnemyDirector(this);
    this.arena = this.stage.arena ? new BossArena(this) : null;
    this.combat = new Combat(this);
    this.checkpoint = 0;
    this.lastGrounded = 0;
    this.jumpQueued = -1000;
    this.finished = false;
    this.paused = false;
    this.dead = false;
    this.respawning = false;
    this.respawnAtBoss = false;
    this.deathPanel = null;
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
    this.keys = this.input.keyboard.addKeys('A,D,W,S,SPACE,Q,F,G,E,R,ENTER');
    this.input.keyboard.on('keydown-ESC', this.togglePause, this);
    this.input.keyboard.on('keydown-UP', this.pauseUp, this);
    this.input.keyboard.on('keydown-DOWN', this.pauseDown, this);
    this.input.keyboard.on('keydown-ENTER', this.pauseActivate, this);
    this.input.on('pointerdown', this.handlePausePointer, this);
    this.input.on('pointerup', this.handleDeathPointer, this);
    this.onPageHide = () => this.saveProgress();
    window.addEventListener('pagehide', this.onPageHide);
    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => {
      this.input.keyboard.off('keydown-ESC', this.togglePause, this);
      this.input.keyboard.off('keydown-UP', this.pauseUp, this);
      this.input.keyboard.off('keydown-DOWN', this.pauseDown, this);
      this.input.keyboard.off('keydown-ENTER', this.pauseActivate, this);
      this.input.off('pointerdown', this.handlePausePointer, this);
      this.input.off('pointerup', this.handleDeathPointer, this);
      window.removeEventListener('pagehide', this.onPageHide);
      this.scale.off('resize', this.onResize, this);
      this.horror?.destroy();
    });

    this.cameras.main.setDeadzone(Math.min(w * .3, 360), h * .42);
    this.followActor(this.player);
    this.hud = new Hud(this);
    this.keyPrompt = new KeyPrompt(this);
    if (this.restoreData) this.applySave(this.restoreData);
    else if (![5, 10].includes(this.levelIndex)) this.cinematics.pulse(this.stage.title, this.stage.subtitle,
      this.stage.chapter === 3 ? 0xb8e8eb : this.stage.chapter === 2 ? 0xe96756 : this.stage.shadow ? 0xb79bdb : 0xa5dde3, 2600);
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
    // Freeze scheduled events (lightning, scares) and remember when, so timed
    // puzzles don't lose time while the game is paused.
    this.time.paused = true;
    this.pausedAt = this.game.loop.time;
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
    const settings = readSettings();
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
      this.pauseSettingToggles[index] = () => {
        settings[key] = !settings[key];
        localStorage.setItem('wtld-settings', JSON.stringify(settings));
        if (key === 'rain') this.atmosphere.setRain(settings.rain);
        refresh();
      };
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
    this.time.paused = false;
    this.mechanics.shiftTimers?.(this.game.loop.time - (this.pausedAt ?? this.game.loop.time));
  }

  // A quiet story caption near the top of the screen (no box). Gameplay
  // feedback is shown in the world instead of with text.
  announce(message, color = 0xb9e5df) {
    if (this.toast) this.toast.destroy(true);
    const w = this.viewportWidth, h = this.viewportHeight;
    const offset = fixedLayerOffset(w, h);
    const toast = this.add.container(offset.x, offset.y).setScrollFactor(0).setDepth(45);
    // Subtitle position, clear of the radio panel at the top.
    const text = this.add.text(w / 2, h * .8, message, {
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
    const px = x ?? Math.min(platform.right - 50, platform.left + 40);
    this.player.setPosition(px, platform.y - this.spriteHeight * .49);
    this.player.body.updateFromGameObject();
    // Distance from the sprite's centre to its feet, then a clean body reset so
    // the physics body and sprite agree (moving them separately mid-fall made
    // the boy reappear at the far-left edge in mid-air).
    const foot = this.player.body.bottom - this.player.y;
    this.player.body.reset(px, platform.y - 1 - foot);
  }

  // Camera shake that respects the "Screen shake" setting.
  shakeCamera(duration, intensity) {
    if (readSettings().shake) this.cameras.main.shake(duration, intensity);
  }

  respawn() {
    if (this.dead) return;
    // Remember whether the death happened during a boss fight so the eventual
    // respawn uses the arena entrance rather than the start of the stage.
    this.respawnAtBoss = this.arena?.state === 'fighting';
    this.showDeathScreen();
  }

  showDeathScreen() {
    if (this.deathPanel) return;
    this.dead = true;
    this.player.setVelocity(0, 0).setAcceleration(0, 0);
    this.physics.world.pause();
    const w = this.viewportWidth, h = this.viewportHeight;
    const offset = fixedLayerOffset(w, h);
    const panel = this.add.container(offset.x, offset.y).setScrollFactor(0).setDepth(170);
    const redVeil = this.add.rectangle(w / 2, h / 2, w, h, 0x3c0207, 0.62);
    const blackFalloff = this.add.rectangle(w / 2, h / 2, w, h, 0x020004, 0.42);
    const lineTop = this.add.rectangle(w / 2, h * 0.29, Math.min(w * 0.72, 760), 2, 0xe96756, 0.7);
    const lineBottom = this.add.rectangle(w / 2, h * 0.69, Math.min(w * 0.72, 760), 2, 0xe96756, 0.42);
    const title = this.add.text(w / 2, h * 0.39, 'YOU DIED', {
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
      fontSize: `${Math.round(Math.max(48, Math.min(86, w * 0.075)))}px`,
      color: '#f5eddb',
      align: 'center',
      letterSpacing: 5,
    }).setOrigin(.5).setShadow(0, 4, '#180004', 16, false, true);
    const message = this.add.text(w / 2, h * 0.52, 'The dark found the space between your light and your breath.', {
      fontFamily: 'Georgia, serif',
      fontStyle: 'italic',
      fontSize: `${Math.round(Math.max(16, Math.min(23, w * 0.018)))}px`,
      color: '#f2c7c0',
      align: 'center',
      wordWrap: { width: Math.min(w - 70, 680) },
    }).setOrigin(.5).setShadow(0, 2, '#000000', 8, false, true);
    const buttonWidth = Math.min(260, w - 72);
    const buttonHeight = 56;
    const buttonBg = this.add.rectangle(w / 2, h * 0.63, buttonWidth, buttonHeight, 0x16080b, 0.86)
      .setStrokeStyle(2, 0xe96756, 0.88)
      .setInteractive({ useHandCursor: true });
    const buttonText = this.add.text(w / 2, h * 0.63, 'RESPAWN', {
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
      fontSize: '22px',
      color: '#f5eddb',
      letterSpacing: 2,
    }).setOrigin(.5);
    buttonBg.on('pointerover', () => {
      buttonBg.setFillStyle(0x2a090d, 0.96);
      buttonText.setColor('#ffd2bd');
    });
    buttonBg.on('pointerout', () => {
      buttonBg.setFillStyle(0x16080b, 0.86);
      buttonText.setColor('#f5eddb');
    });
    buttonBg.on('pointerdown', () => this.confirmRespawn());
    buttonBg.on('pointerup', () => this.confirmRespawn());
    this.deathRespawnArea = {
      left: w / 2 - buttonWidth / 2,
      right: w / 2 + buttonWidth / 2,
      top: h * 0.63 - buttonHeight / 2,
      bottom: h * 0.63 + buttonHeight / 2,
    };
    panel.add([redVeil, blackFalloff, lineTop, lineBottom, title, message, buttonBg, buttonText]);
    panel.setAlpha(0);
    this.tweens.add({ targets: panel, alpha: 1, duration: 260, ease: 'Sine.easeOut' });
    this.deathPanel = panel;
    sharpenText(this);
  }

  handleDeathPointer(pointer) {
    if (!this.dead || !this.deathRespawnArea) return;
    const x = pointer.x / renderScale;
    const y = pointer.y / renderScale;
    const area = this.deathRespawnArea;
    if (x >= area.left && x <= area.right && y >= area.top && y <= area.bottom) this.confirmRespawn();
  }

  confirmRespawn() {
    if (!this.dead) return;
    this.deathPanel?.destroy(true);
    this.deathPanel = null;
    this.deathRespawnArea = null;
    this.dead = false;
    this.respawning = true;
    if (this.respawnAtBoss) {
      this.arena?.afterDeath();
    } else {
      this.checkpoint = 0;
      this.placePlayerOnPlatform(0, 145 * this.artScale);
    }
    if (this.shadow?.detached) this.shadow.toggleDetach();
    // The physics sprite is intentionally always hidden by BoyAnimator. The
    // respawn effect must hide the animated visual instead; showing the sprite
    // here creates a second boy directly behind the animated one.
    this.player.setVisible(false).setVelocity(0, 0).setAcceleration(0, 0);
    this.animator.visual.setVisible(false);
    this.jumpQueued = -1000;
    this.lastGrounded = this.time.now;
    this.followActor(this.player);
    this.cameras.main.centerOn(this.player.x, this.player.y);
    this.playRespawnLightning(() => {
      this.player.setVisible(false);
      this.animator.visual.setVisible(true);
      this.physics.world.resume();
      this.respawning = false;
      this.respawnAtBoss = false;
      this.cameras.main.flash(260, 244, 226, 210);
      this.cameras.main.shake(170, 0.006);
    });
  }

  playRespawnLightning(onImpact) {
    const x = this.player.x;
    const groundY = this.player.body.bottom;
    const topY = Math.max(18 * this.artScale, groundY - this.viewportHeight * 0.72);
    const bolt = this.add.graphics().setDepth(35);
    const glow = this.add.graphics().setDepth(34);
    const impact = this.add.circle(x, groundY - 6 * this.artScale, 8 * this.artScale, 0xf9e4bc, 0).setDepth(36);
    const drawBolt = (jitter = 1) => {
      bolt.clear();
      glow.clear();
      bolt.lineStyle(9 * this.artScale, 0xf9e4bc, 0.24);
      glow.lineStyle(24 * this.artScale, 0x8adcf0, 0.16);
      const points = [];
      const segments = 9;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const spread = (1 - Math.abs(t - 0.5)) * 44 * this.artScale;
        points.push({
          x: x + (Math.random() * 2 - 1) * spread * jitter,
          y: Phaser.Math.Linear(topY, groundY, t),
        });
      }
      for (const graphics of [glow, bolt]) {
        graphics.beginPath();
        graphics.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) graphics.lineTo(points[i].x, points[i].y);
        graphics.strokePath();
      }
      bolt.lineStyle(3 * this.artScale, 0xffffff, 0.95);
      bolt.beginPath();
      bolt.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) bolt.lineTo(points[i].x, points[i].y);
      bolt.strokePath();
    };
    drawBolt(0.65);
    bolt.setAlpha(0);
    glow.setAlpha(0);
    this.time.delayedCall(120, () => drawBolt(1));
    this.time.delayedCall(220, () => drawBolt(0.85));
    this.tweens.add({ targets: [bolt, glow], alpha: 1, duration: 70, yoyo: true, repeat: 1 });
    this.time.delayedCall(260, () => {
      impact.setAlpha(0.95);
      this.playRespawnLightningSound();
      this.tweens.add({ targets: impact, radius: 120 * this.artScale, alpha: 0, duration: 380, ease: 'Cubic.easeOut', onComplete: () => impact.destroy() });
      this.tweens.add({ targets: [bolt, glow], alpha: 0, duration: 170, onComplete: () => { bolt.destroy(); glow.destroy(); } });
      onImpact?.();
    });
  }

  playRespawnLightningSound() {
    const ctx = this.horror?.ensureAudio(true);
    const master = this.horror?.master;
    if (!ctx || !master) return;
    const now = ctx.currentTime;

    const crack = ctx.createBufferSource();
    const crackBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.18), ctx.sampleRate);
    const crackData = crackBuffer.getChannelData(0);
    for (let i = 0; i < crackData.length; i++) {
      const t = i / crackData.length;
      const snap = Math.pow(1 - t, 3.2);
      crackData[i] = (Math.random() * 2 - 1) * snap;
    }
    crack.buffer = crackBuffer;

    const crackFilter = ctx.createBiquadFilter();
    const crackGain = ctx.createGain();
    crackFilter.type = 'highpass';
    crackFilter.frequency.value = 1400;
    crackFilter.Q.value = 5;
    crackGain.gain.setValueAtTime(0.0001, now);
    crackGain.gain.exponentialRampToValueAtTime(0.62, now + 0.006);
    crackGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    crack.connect(crackFilter).connect(crackGain).connect(master);

    const thunder = ctx.createOscillator();
    const thunderGain = ctx.createGain();
    thunder.type = 'sine';
    thunder.frequency.setValueAtTime(72, now);
    thunder.frequency.exponentialRampToValueAtTime(24, now + 0.48);
    thunderGain.gain.setValueAtTime(0.0001, now);
    thunderGain.gain.exponentialRampToValueAtTime(0.38, now + 0.03);
    thunderGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.72);
    thunder.connect(thunderGain).connect(master);

    const sizzle = ctx.createBufferSource();
    const sizzleBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.42), ctx.sampleRate);
    const sizzleData = sizzleBuffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < sizzleData.length; i++) {
      const t = i / sizzleData.length;
      last = last * 0.58 + (Math.random() * 2 - 1) * 0.42;
      sizzleData[i] = last * Math.pow(1 - t, 1.4) * (0.7 + Math.sin(t * 180) * 0.22);
    }
    sizzle.buffer = sizzleBuffer;
    const sizzleFilter = ctx.createBiquadFilter();
    const sizzleGain = ctx.createGain();
    sizzleFilter.type = 'bandpass';
    sizzleFilter.frequency.setValueAtTime(2600, now);
    sizzleFilter.frequency.exponentialRampToValueAtTime(6800, now + 0.12);
    sizzleFilter.frequency.exponentialRampToValueAtTime(1200, now + 0.42);
    sizzleFilter.Q.value = 9;
    sizzleGain.gain.setValueAtTime(0.0001, now);
    sizzleGain.gain.exponentialRampToValueAtTime(0.24, now + 0.012);
    sizzleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    sizzle.connect(sizzleFilter).connect(sizzleGain).connect(master);

    crack.start(now);
    thunder.start(now);
    sizzle.start(now);
    crack.stop(now + 0.2);
    thunder.stop(now + 0.75);
    sizzle.stop(now + 0.45);
  }

  finishStage() {
    if (this.finished) return;
    this.finished = true;
    this.player.setVelocity(0, 0).setAcceleration(0, 0);
    if (this.levelIndex === CHAPTER_STAGES.length - 1) {
      this.saveProgress();
      this.cinematics.finale(this.stage.chapter || 1);
      return;
    }
    if (this.levelIndex === 4) this.cinematics.pulse('CHAPTER II · THE FACILITY BELOW', 'The signal opens a path beneath the island. The shadow reaches for what the light left behind.', 0xe96756, 2400);
    if (this.levelIndex === 9) this.cinematics.pulse('CHAPTER III · THE REFLECTED COAST', 'The machine opens onto a coast that remembers every light it has swallowed.', 0xb8e8eb, 2400);
    this.cameras.main.fadeOut([4, 9].includes(this.levelIndex) ? 2500 : 600, 2, 7, 16);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        if (this.slotIndex !== null) saveSlot(this.slotIndex, { levelIndex: this.levelIndex + 1, x: 145, y: null, mechanics: null, shadow: null });
        this.scene.start('Chapter', { levelIndex: this.levelIndex + 1, slotIndex: this.slotIndex });
      });
  }

  update(time, delta) {
    if (this.respawning) return;
    if (this.dead) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.ENTER) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.keys.R))
        this.confirmRespawn();
      return;
    }
    if (this.paused) return;
    if (this.finished) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.scene.start('Chapter', { levelIndex: this.stage.chapter === 3 ? 10 : this.stage.chapter === 2 ? 5 : 0, slotIndex: this.slotIndex });
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
    this.enemies.update(time, delta);
    this.arena?.update(time, delta);
    this.combat.update(time);
    this.hud.update();
    this.keyPrompt.update([...(this.arena?.hints ?? []), ...(this.mechanics.hints ?? []), ...this.combat.hints], time);
    if (this.player.y > this.viewportHeight + 110) this.respawn();
    if (grounded && this.player.x > this.worldWidth - this.spriteHeight * .43) this.finishStage();
  }
}
