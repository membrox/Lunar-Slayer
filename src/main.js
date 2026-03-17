import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';

const config = {
  type: Phaser.AUTO,
  width: 720,
  height: 1280,
  pixelArt: true,
  parent: 'game',
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 800 }, debug: false }
  },
  scene: [BootScene, MenuScene, GameScene, UIScene]
};

const game = new Phaser.Game(config);

window.onerror = function(msg, url, line, col, error) {
  console.error('Global Error:', msg, 'at', url, ':', line, ':', col, error);
  return false;
};