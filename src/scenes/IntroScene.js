import Phaser from 'phaser';
import introVideoUrl from '../../assets/video/lighthouse-intro.mp4?url';
import boyUpperUrl from '../../assets/characters/boy_upper.png?url';
import { BoyAnimator } from '../animation/BoyAnimator.js';
import { StormCutsceneAudio } from '../audio/StormCutsceneAudio.js';
import { logicalSize, renderScale, sharpenText } from '../rendering.js';

const PRELOAD_HOLD_MS = 1800;
const POSTLOAD_HOLD_MS = 3000;

export class IntroScene extends Phaser.Scene {
  constructor() { super('Intro'); }

  init(data) {
    this.levelIndex = data?.levelIndex ?? 0;
    this.slotIndex = data?.slotIndex ?? null;
  }

  preload() {
    if (!this.textures.exists('boy-upper')) this.load.image('boy-upper', boyUpperUrl);
  }

  create() {
    this.phase = 'preparing';
    this.startedAt = this.time.now;
    this.finishing = false;
    this.cameras.main.setBackgroundColor('#000000');

    this.backdrop = this.add.rectangle(0, 0, 10, 10, 0x000000).setOrigin(0).setDepth(0);
    this.createVideoElement();

    this.createLoadingScreen();
    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.layout, this);
      this.stormAudio?.stop();
      this.destroyVideoElement();
    });

    this.time.delayedCall(PRELOAD_HOLD_MS, () => this.playVideo());
    sharpenText(this);
  }

  createVideoElement() {
    const video = document.createElement('video');
    video.src = introVideoUrl;
    video.preload = 'auto';
    video.playsInline = true;
    video.controls = false;
    video.disablePictureInPicture = true;
    video.setAttribute('aria-label', 'Where the Light Dies opening cutscene');
    Object.assign(video.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      background: '#000',
      opacity: '0',
      pointerEvents: 'none',
      transition: 'opacity 750ms ease-in-out',
      zIndex: '2',
    });
    video.addEventListener('playing', () => this.revealVideo());
    video.addEventListener('ended', () => this.finishVideo());
    video.addEventListener('error', () => this.finishVideo());
    document.getElementById('app').appendChild(video);
    this.videoElement = video;
  }

  destroyVideoElement() {
    if (!this.videoElement) return;
    this.videoElement.pause();
    this.videoElement.removeAttribute('src');
    this.videoElement.load();
    this.videoElement.remove();
    this.videoElement = null;
  }

  createLoadingScreen() {
    this.loadingVeil = this.add.rectangle(0, 0, 10, 10, 0x000000).setOrigin(0).setDepth(20);
    this.loadingRule = this.add.rectangle(0, 0, 260, 1, 0xffffff, .2).setDepth(21);
    this.loadingText = this.add.text(0, 0, 'LOADING', {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      color: '#f5f5f2',
      letterSpacing: 7,
    }).setOrigin(.5).setDepth(21);
    this.loadingHint = this.add.text(0, 0, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      color: '#9ca2a5',
      letterSpacing: 3,
    }).setOrigin(.5).setDepth(21);

    this.runner = this.physics.add.sprite(0, 0, 'boy-upper');
    this.runner.body.setAllowGravity(false);
    this.runner.body.velocity.x = 210;
    this.runnerAnimator = new BoyAnimator(this, this.runner, 54, { ghost: true });
    this.runnerAnimator.upper.setTintFill(0xffffff);
    this.runnerAnimator.visual.setAlpha(.94).setDepth(22);

    this.loadingItems = [this.loadingVeil, this.loadingRule, this.loadingText, this.loadingHint, this.runnerAnimator.visual];
    this.dotTimer = this.time.addEvent({
      delay: 360,
      loop: true,
      callback: () => {
        if (this.phase === 'video') return;
        const dots = '.'.repeat((Math.floor(this.time.now / 360) % 3) + 1);
        this.loadingText.setText(`LOADING${dots}`);
      },
    });
  }

  layout() {
    const { width: w, height: h } = logicalSize(this);
    this.viewportWidth = w;
    this.viewportHeight = h;
    this.cameras.main.setZoom(renderScale);
    this.cameras.main.setScroll((1 - renderScale) * w / 2, (1 - renderScale) * h / 2);
    this.backdrop?.setSize(w, h);
    this.loadingVeil?.setSize(w, h);

    const centerY = h * .54;
    this.loadingText?.setPosition(w / 2, centerY);
    this.loadingRule?.setPosition(w / 2, centerY + 36);
    this.loadingHint?.setPosition(w / 2, centerY + 65);

  }

  playVideo() {
    if (this.finishing || this.phase === 'video') return;
    this.loadingHint.setText('');
    this.videoElement.play().catch(() => this.showUnlockPrompt());
  }

  revealVideo() {
    if (this.finishing || this.phase === 'video') return;
    this.phase = 'video';
    this.stormAudio = new StormCutsceneAudio(this);
    this.stormAudio.start();
    this.videoElement.style.opacity = '1';
    this.tweens.add({
      targets: this.loadingItems,
      alpha: 0,
      duration: 750,
      ease: 'Sine.easeInOut',
      onComplete: () => this.loadingItems.forEach(item => item.setVisible(false)),
    });
  }

  showUnlockPrompt() {
    if (this.finishing) return;
    this.loadingHint.setText('CLICK TO BEGIN');
    const unlock = () => {
      this.loadingHint.setText('');
      this.videoElement.play().catch(() => this.showUnlockPrompt());
    };
    this.input.once('pointerdown', unlock);
    this.input.keyboard.once('keydown-ENTER', unlock);
    this.input.keyboard.once('keydown-SPACE', unlock);
  }

  finishVideo() {
    if (this.finishing) return;
    this.finishing = true;
    this.phase = 'finishing';
    this.stormAudio?.stop();
    if (this.videoElement) this.videoElement.style.opacity = '0';
    this.time.delayedCall(760, () => this.destroyVideoElement());
    this.loadingText.setText('LOADING');
    this.loadingHint.setText('');
    this.loadingItems.forEach(item => item.setVisible(true).setAlpha(0));
    this.tweens.add({ targets: this.loadingItems, alpha: 1, duration: 500, ease: 'Sine.easeOut' });
    this.time.delayedCall(POSTLOAD_HOLD_MS, () => {
      this.cameras.main.fadeOut(650, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('Chapter', { levelIndex: this.levelIndex, slotIndex: this.slotIndex });
      });
    });
  }

  update(time, delta) {
    if (!this.runnerAnimator || this.phase === 'video') return;
    const textWidth = Math.max(245, this.loadingText.displayWidth + 70);
    const progress = ((time - this.startedAt) * .105) % textWidth;
    this.runner.x = this.viewportWidth / 2 - textWidth / 2 + progress;
    this.runner.y = this.loadingText.y - 42;
    this.runner.body.velocity.x = 210;
    this.runnerAnimator.update(time, delta, true);
  }
}
