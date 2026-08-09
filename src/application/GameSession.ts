// src/application/GameSession.ts
// 게임 세션 생명주기 관리 (Application 계층).
// src/application/GameSession.lua 이식. love 콜백 위임은 제거하고(Phaser가 게임 루프/씬 담당),
// GameState 보관 + 사주 적용 유스케이스 + 세이브 조율로 집중.

import { GameState } from '@/domain/player/GameState';
import { BirthDate } from '@/domain/saju/BirthDate';
import { calculate } from '@/domain/saju/SajuCalculator';
import { fromOhaeng } from '@/domain/ohaeng/StatMapping';
import { Stats } from '@/domain/player/Stats';
import { SaveRepository } from '@/infrastructure/persistence/SaveRepository';

export class GameSession {
  state: GameState;
  private readonly saves: SaveRepository;

  constructor(saves?: SaveRepository) {
    this.state = new GameState();
    this.saves = saves ?? new SaveRepository();
  }

  /** 사주 입력 완료: 계산 + 스탯 산출 + 상태 반영. */
  applySaju(birthDate: BirthDate): void {
    const result = calculate(birthDate);
    this.state.setSajuResult(
      birthDate,
      result.fourPillars,
      result.ohaengBalance,
      new Stats(fromOhaeng(result.ohaengBalance)),
    );
  }

  hasSave(): boolean {
    return this.saves.exists();
  }

  /** 현재 상태 저장. 사주 입력된 상태에서만 의미. */
  save(): boolean {
    if (!this.state.hasSaju()) return false;
    return this.saves.save(this.state);
  }

  /** 세이브 로드하여 state 교체. 사주가 있어야 성공. */
  load(): boolean {
    const loaded = this.saves.load();
    if (!loaded || !loaded.hasSaju()) return false;
    this.state = loaded;
    return true;
  }

  deleteSave(): boolean {
    return this.saves.delete();
  }
}
