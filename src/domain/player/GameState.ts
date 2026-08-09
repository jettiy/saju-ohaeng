// src/domain/player/GameState.ts
// 게임 세션 전체 도메인 상태. src/domain/player/GameState.lua 1:1 이식.
// Application 계층이 인스턴스를 들고, 각 Scene 이 참조로 읽고 갱신.

import type { BirthDate } from '../saju/BirthDate';
import type { FourPillars } from '../saju/FourPillars';
import type { OhaengBalance } from '../saju/OhaengBalance';
import type { Stats } from './Stats';
import type { Companion } from '../relationship/Companion';

export type EndAxis = 'extremity' | 'harmony' | 'acceptance';

export interface CompanionLike {
  id: string;
  [key: string]: unknown;
}

export class GameState {
  birthDate: BirthDate | null = null;
  fourPillars: FourPillars | null = null;
  ohaengBalance: OhaengBalance | null = null;
  stats: Stats | null = null;
  companions: Record<string, Companion | CompanionLike> = {};
  storyFlags: Record<string, boolean | number | string> = {};
  endScores: Record<EndAxis, number> = { extremity: 0, harmony: 0, acceptance: 0 };
  currentTown = 'willowhaven';

  /** 사주 입력 완료 시 호출. 도메인 객체들을 한 번에 세팅. */
  setSajuResult(birthDate: BirthDate | null, fourPillars: FourPillars, ohaengBalance: OhaengBalance, stats: Stats): void {
    this.birthDate = birthDate;
    this.fourPillars = fourPillars;
    this.ohaengBalance = ohaengBalance;
    this.stats = stats;
  }

  hasSaju(): boolean {
    return this.ohaengBalance !== null;
  }

  /** 동료 영입. */
  addCompanion(companion: Companion | CompanionLike): void {
    this.companions[companion.id] = companion;
  }

  hasCompanion(id: string): boolean {
    return this.companions[id] !== undefined;
  }

  setFlag(key: string, value: boolean | number | string): void {
    this.storyFlags[key] = value;
  }

  getFlag(key: string, defaultValue?: boolean | number | string): boolean | number | string | undefined {
    const v = this.storyFlags[key];
    if (v === undefined) return defaultValue;
    return v;
  }

  /** 엔딩 점수 가산. */
  addEndScore(axis: EndAxis, amount = 1): void {
    this.endScores[axis] = (this.endScores[axis] ?? 0) + amount;
  }

  /** 현재 우세한 엔딩 방향. */
  dominantEnding(): EndAxis {
    let best: EndAxis = 'extremity';
    let bestVal = -1;
    for (const axis of ['extremity', 'harmony', 'acceptance'] as EndAxis[]) {
      if (this.endScores[axis] > bestVal) {
        best = axis;
        bestVal = this.endScores[axis];
      }
    }
    return best;
  }
}
