// tests/save.spec.ts
// SaveRepository / GameSession 이식 검증. 메모리 저장소로 라운드트립.

import { describe, it, expect } from 'vitest';
import { GameState } from '@/domain/player/GameState';
import { BirthDate } from '@/domain/saju/BirthDate';
import { SaveRepository, memoryStorage, serialize, deserialize } from '@/infrastructure/persistence/SaveRepository';
import { GameSession } from '@/application/GameSession';
import { calculate } from '@/domain/saju/SajuCalculator';
import { fromOhaeng } from '@/domain/ohaeng/StatMapping';
import { Stats } from '@/domain/player/Stats';
import { Companion, DEFS as COMPANION_DEFS } from '@/domain/relationship/Companion';

function stateWithSaju(): GameState {
  const state = new GameState();
  const result = calculate({ year: 1995, month: 6, day: 15, hour: 7, calendar: 'solar' });
  state.setSajuResult(
    new BirthDate(1995, 6, 15, 7, 'solar'),
    result.fourPillars,
    result.ohaengBalance,
    new Stats(fromOhaeng(result.ohaengBalance)),
  );
  return state;
}

describe('SaveRepository 라운드트립', () => {
  it('저장 후 exists=true', () => {
    const repo = new SaveRepository(memoryStorage());
    expect(repo.exists()).toBe(false);
    repo.save(stateWithSaju());
    expect(repo.exists()).toBe(true);
  });

  it('오행 총합 8.0 보존', () => {
    const original = stateWithSaju();
    const roundTrip = deserialize(serialize(original));
    expect(roundTrip.ohaengBalance!.total()).toBeCloseTo(8.0, 2);
  });

  it('fourPillars 복원: stem 문자열 일치', () => {
    const original = stateWithSaju();
    const roundTrip = deserialize(serialize(original));
    expect(roundTrip.fourPillars!.getStems()).toEqual(original.fourPillars!.getStems());
  });

  it('stats 복원: farming 일치', () => {
    const original = stateWithSaju();
    const roundTrip = deserialize(serialize(original));
    expect(roundTrip.stats!.get('farming')).toBe(original.stats!.get('farming'));
  });

  it('birthDate 복원: 연/월/일/시 일치', () => {
    const original = stateWithSaju();
    const roundTrip = deserialize(serialize(original));
    expect(roundTrip.birthDate!.year).toBe(1995);
    expect(roundTrip.birthDate!.month).toBe(6);
    expect(roundTrip.birthDate!.hour).toBe(7);
  });

  it('동료 영입 + 호감도 복원', () => {
    const state = stateWithSaju();
    const bori = new Companion(COMPANION_DEFS.bori);
    bori.recruit();
    bori.affinity = 7;
    state.addCompanion(bori);
    const roundTrip = deserialize(serialize(state));
    expect(roundTrip.hasCompanion('bori')).toBe(true);
    expect((roundTrip.companions.bori as Companion).affinity).toBe(7);
    expect((roundTrip.companions.bori as Companion).recruited).toBe(true);
  });

  it('endScores + storyFlags 복원', () => {
    const state = stateWithSaju();
    state.addEndScore('harmony', 3);
    state.setFlag('met_bori', true);
    const roundTrip = deserialize(serialize(state));
    expect(roundTrip.endScores.harmony).toBe(3);
    expect(roundTrip.storyFlags.met_bori).toBe('true'); // 원본처럼 문자열 복원
  });

  it('load 후 delete -> exists=false', () => {
    const repo = new SaveRepository(memoryStorage());
    repo.save(stateWithSaju());
    expect(repo.load()).not.toBeNull();
    repo.delete();
    expect(repo.exists()).toBe(false);
    expect(repo.load()).toBeNull();
  });
});

describe('GameSession', () => {
  it('applySaju 로 사주/스탯 세팅 + 오행 총합 8.0', () => {
    const session = new GameSession(new SaveRepository(memoryStorage()));
    expect(session.state.hasSaju()).toBe(false);
    session.applySaju(new BirthDate(1990, 7, 9, 12, 'solar'));
    expect(session.state.hasSaju()).toBe(true);
    expect(session.state.ohaengBalance!.total()).toBeCloseTo(8.0, 2);
    expect(session.state.stats).not.toBeNull();
  });

  it('save 는 사주 입력 전 false, 입력 후 true', () => {
    const session = new GameSession(new SaveRepository(memoryStorage()));
    expect(session.save()).toBe(false);
    session.applySaju(new BirthDate(1990, 7, 9, 12, 'solar'));
    expect(session.save()).toBe(true);
    expect(session.hasSave()).toBe(true);
  });

  it('load 로 상태 교체', () => {
    const storage = memoryStorage();
    const a = new GameSession(new SaveRepository(storage));
    a.applySaju(new BirthDate(1988, 2, 29, 6, 'solar'));
    a.state.addEndScore('extremity', 5);
    a.save();

    const b = new GameSession(new SaveRepository(storage));
    expect(b.load()).toBe(true);
    expect(b.state.birthDate!.year).toBe(1988);
    expect(b.state.endScores.extremity).toBe(5);
  });
});
