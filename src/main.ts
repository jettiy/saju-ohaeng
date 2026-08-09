// src/main.ts
// 웹 빌드 진입점. GameSession(Application) 생성 -> Phaser 게임 + 씬 등록.
// 도메인(saju/ohaeng/battle)은 love/phaser 의존성 ZERO 로 별도 단위 테스트로 검증됨.

import Phaser from 'phaser';
import { GameSession } from '@/application/GameSession';
import { SESSION_KEY, GAME_WIDTH, GAME_HEIGHT } from '@/presentation/sceneKeys';
import { BootScene } from '@/presentation/scenes/BootScene';
import { TitleScene } from '@/presentation/scenes/TitleScene';
import { SajuInputScene } from '@/presentation/scenes/SajuInputScene';
import { SajuResultScene } from '@/presentation/scenes/SajuResultScene';

const session = new GameSession();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  backgroundColor: '#1a1a1f',
  scene: [BootScene, TitleScene, SajuInputScene, SajuResultScene],
});

game.registry.set(SESSION_KEY, session);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) session.save();
});

declare global {
  interface Window {
    __saju?: { session: GameSession };
  }
}

// 디버그/검증 훅: 브라우저 콘솔에서 세션 상태 확인 가능.
window.__saju = { session };
window.addEventListener('beforeunload', () => session.save());

export default game;
