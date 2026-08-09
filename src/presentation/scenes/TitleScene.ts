// src/presentation/scenes/TitleScene.ts
// 타이틀: 게임 제목 + 시작 안내. 아무 키나 누르면 사주 입력으로.

import Phaser from 'phaser';
import { Scenes, SESSION_KEY, GAME_WIDTH, GAME_HEIGHT } from '../sceneKeys';
import type { GameSession } from '@/application/GameSession';

const FONT = "'Noto Sans KR', 'Malgun Gothic', sans-serif";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super(Scenes.Title);
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    this.add.text(cx, GAME_HEIGHT / 2 - 70, '사주팔자 - 오행', {
      fontFamily: FONT, fontSize: '52px', color: '#f0e6d2',
    }).setOrigin(0.5);

    this.add.text(cx, GAME_HEIGHT / 2 - 10, '실제 사주가 캐릭터 스탯이 되는, 따뜻+치유 JRPG', {
      fontFamily: FONT, fontSize: '18px', color: '#9a8f7a',
    }).setOrigin(0.5);

    const session = this.game.registry.get(SESSION_KEY) as GameSession;
    const hasSave = session?.hasSave() ?? false;
    const prompt = hasSave ? 'ENTER: 이어하기   /   N: 새 게임' : 'ENTER: 시작';
    const promptText = this.add.text(cx, GAME_HEIGHT / 2 + 70, prompt, {
      fontFamily: FONT, fontSize: '20px', color: '#c9b98f',
    }).setOrigin(0.5);

    this.tweens.add({ targets: promptText, alpha: 0.4, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.inOut' });

    this.input.keyboard?.once('keydown-ENTER', () => {
      if (hasSave && session) {
        session.load();
        this.scene.start(Scenes.SajuResult);
      } else {
        this.scene.start(Scenes.SajuInput);
      }
    });
    this.input.keyboard?.once('keydown-N', () => this.scene.start(Scenes.SajuInput));
  }
}
