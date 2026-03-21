import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import AnimTestScene from './scenes/AnimTestScene.js';

const isTestbed = new URLSearchParams(window.location.search).has('testbed');

const config = {
  type: Phaser.AUTO,
  width: 720,
  height: 1280,
  parent: 'game',
  backgroundColor: '#000000',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 800 }, debug: false }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: isTestbed
    ? [BootScene, AnimTestScene]
    : [BootScene, MenuScene, GameScene, UIScene]
};

const game = new Phaser.Game(config);
window.__game = game;
// Forced rebuild for v11
window.onerror = function (msg, url, line, col, error) {
  console.error('Global Error:', msg, 'at', url, ':', line, ':', col, error);
  return false;
};