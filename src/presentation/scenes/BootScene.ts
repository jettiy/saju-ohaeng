// src/presentation/scenes/BootScene.ts
// 부트: 배경 설정 + (향후 에셋 프리로드) + 타이틀로 진입.

import Phaser from 'phaser';
import { Scenes } from '../sceneKeys';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(Scenes.Boot);
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a1f');
    this.scene.start(Scenes.Title);
  }
}
