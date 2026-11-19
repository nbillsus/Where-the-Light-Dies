import './styles.css';
import Phaser from 'phaser';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { PrototypeLevelScene } from './scenes/PrototypeLevelScene.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#07111e',
  width: 1280,
  height: 720,
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
  scene: [MainMenuScene, PrototypeLevelScene],
});

window.addEventListener('beforeunload', () => game.destroy(true));
