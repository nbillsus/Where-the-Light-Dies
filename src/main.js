import './styles.css';
import Phaser from 'phaser';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { IntroScene } from './scenes/IntroScene.js';
import { ChapterScene } from './scenes/ChapterScene.js';
import { renderScale } from './rendering.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#07111e',
  width: Math.round(window.innerWidth * renderScale),
  height: Math.round(window.innerHeight * renderScale),
  render: { antialias: true, antialiasGL: true, pixelArt: false, roundPixels: false },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1250 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MainMenuScene, IntroScene, ChapterScene],
});

// Dev-only handle for automated play-tests and debugging (not in production builds).
if (import.meta.env.DEV) window.__WTLD_GAME__ = game;

window.addEventListener('beforeunload', () => game.destroy(true));
window.addEventListener('resize', () => {
  game.scale.setGameSize(
    Math.round(window.innerWidth * renderScale),
    Math.round(window.innerHeight * renderScale),
  );
});
