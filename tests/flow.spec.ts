// tests/flow.spec.ts
// GameState 도메인 흐름 검증. tests/domain/flow_spec.lua 의 도메인 부분 반영.

import { describe, it, expect } from 'vitest';
import { GameState } from '@/domain/player/GameState';
import { calculate } from '@/domain/saju/SajuCalculator';
import { fromOhaeng } from '@/domain/ohaeng/StatMapping';
import { Stats } from '@/domain/player/Stats';
import { Companion, DEFS as COMPANION_DEFS } from '@/domain/relationship/Companion';

describe('GameState 흐름', () => {
  it('초기 상태: 사주 없음', () => {
    const state = new GameState();
    expect(state.hasSaju()).toBe(false);
  });

  it('사주 설정 후 hasSaju true + 오행 총합 8.0', () => {
    const state = new GameState();
    const result = calculate({ year: 1995, month: 6, day: 15, hour: 12, calendar: 'solar' });
    state.setSajuResult(null, result.fourPillars, result.ohaengBalance, new Stats(fromOhaeng(result.ohaengBalance)));
    expect(state.hasSaju()).toBe(true);
    expect(Math.abs(state.ohaengBalance!.total() - 8.0)).toBeLessThan(0.01);
  });

  it('엔딩 점수 우세 축', () => {
    const state = new GameState();
    state.addEndScore('harmony', 3);
    state.addEndScore('extremity', 1);
    expect(state.dominantEnding()).toBe('harmony');
  });

  it('동료 영입', () => {
    const state = new GameState();
    state.addCompanion(new Companion(COMPANION_DEFS.bori));
    expect(state.hasCompanion('bori')).toBe(true);
  });
});
