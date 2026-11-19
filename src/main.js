import './styles.css';
import Phaser from 'phaser';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { TestRoomScene } from './scenes/TestRoomScene.js';
import { ParkourScene } from './scenes/ParkourScene.js';
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
  scene: [MainMenuScene, TestRoomScene, ParkourScene],
});

window.addEventListener('beforeunload', () => game.destroy(true));
window.addEventListener('resize', () => {
  game.scale.setGameSize(
    Math.round(window.innerWidth * renderScale),
    Math.round(window.innerHeight * renderScale),
  );
});
