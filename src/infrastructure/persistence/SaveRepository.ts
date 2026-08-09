// src/infrastructure/persistence/SaveRepository.ts
// GameState 직렬화/저장/로드 (Infrastructure 계층).
// src/infrastructure/persistence/SaveRepository.lua 이식.love.filesystem → localStorage, 커스텀 포맷 → JSON.
// 저장 항목: birthDate, fourPillars(인덱스), ohaengBalance, stats, companions, endScores, storyFlags.

import { GameState } from '@/domain/player/GameState';
import { BirthDate } from '@/domain/saju/BirthDate';
import { FourPillars, makePillar } from '@/domain/saju/FourPillars';
import { OhaengBalance } from '@/domain/saju/OhaengBalance';
import { Stats } from '@/domain/player/Stats';
import { Companion, DEFS as COMPANION_DEFS } from '@/domain/relationship/Companion';

const SAVE_KEY = 'saju_ohaeng_save_v1';

/** 키-값 저장소 추상화. localStorage 래핑 + 테스트용 메모리 주입(DI seam). */
export interface KVStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface SaveBirth {
  year: number; month: number; day: number; hour: number;
  calendar: 'solar' | 'lunar'; isLeapMonth: boolean;
}
interface SaveData {
  v: 1;
  birth?: SaveBirth;
  pillars?: number[]; // [yearStem,yearBranch,monthStem,monthBranch,dayStem,dayBranch,hourStem,hourBranch]
  ohaeng?: { wood: number; fire: number; earth: number; metal: number; water: number };
  stats?: Record<string, number>;
  companions?: Array<{ id: string; affinity: number }>;
  endscores?: { extremity: number; harmony: number; acceptance: number };
  flags?: Array<[string, string]>;
}

function browserStorage(): KVStorage | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    // SSR / 접근 차단 환경
  }
  return null;
}

/** GameState -> 저장용 데이터 객체. */
export function serialize(state: GameState): SaveData {
  const data: SaveData = { v: 1 };

  if (state.birthDate) {
    const bd = state.birthDate;
    data.birth = {
      year: bd.year, month: bd.month, day: bd.day, hour: bd.hour,
      calendar: bd.calendar, isLeapMonth: bd.isLeapMonth,
    };
  }

  if (state.fourPillars) {
    const fp = state.fourPillars;
    data.pillars = [
      fp.yearPillar.stemIndex, fp.yearPillar.branchIndex,
      fp.monthPillar.stemIndex, fp.monthPillar.branchIndex,
      fp.dayPillar.stemIndex, fp.dayPillar.branchIndex,
      fp.hourPillar.stemIndex, fp.hourPillar.branchIndex,
    ];
  }

  if (state.ohaengBalance) {
    const ob = state.ohaengBalance;
    data.ohaeng = { wood: ob.wood, fire: ob.fire, earth: ob.earth, metal: ob.metal, water: ob.water };
  }

  if (state.stats) {
    data.stats = state.stats.getAll();
  }

  const companions: Array<{ id: string; affinity: number }> = [];
  for (const c of Object.values(state.companions)) {
    if ('recruited' in c && (c as Companion).recruited) {
      companions.push({ id: c.id, affinity: (c as Companion).affinity });
    }
  }
  if (companions.length > 0) data.companions = companions;

  data.endscores = { ...state.endScores };

  const flags: Array<[string, string]> = [];
  for (const [k, v] of Object.entries(state.storyFlags)) {
    flags.push([k, String(v)]);
  }
  if (flags.length > 0) data.flags = flags;

  return data;
}

/** 저장 데이터 -> GameState (도메인 객체 재구성). */
export function deserialize(data: SaveData): GameState {
  const state = new GameState();

  if (data.birth) {
    const b = data.birth;
    try {
      state.birthDate = new BirthDate(b.year, b.month, b.day, b.hour, b.calendar, b.isLeapMonth);
    } catch {
      // 잘못된 birthDate 무시
    }
  }

  if (data.pillars && data.pillars.length >= 8) {
    const p = data.pillars;
    try {
      state.fourPillars = new FourPillars(
        makePillar(p[0], p[1]), makePillar(p[2], p[3]),
        makePillar(p[4], p[5]), makePillar(p[6], p[7]),
      );
    } catch {
      // 잘못된 pillars 무시
    }
  }

  if (data.ohaeng) {
    const o = data.ohaeng;
    state.ohaengBalance = new OhaengBalance(o.wood, o.fire, o.earth, o.metal, o.water);
  }

  if (data.stats) {
    state.stats = new Stats(data.stats);
  }

  if (data.companions) {
    for (const { id, affinity } of data.companions) {
      if (COMPANION_DEFS[id]) {
        const c = new Companion(COMPANION_DEFS[id]);
        c.recruit();
        c.affinity = affinity;
        state.addCompanion(c);
      }
    }
  }

  if (data.endscores) {
    state.endScores = {
      extremity: data.endscores.extremity ?? 0,
      harmony: data.endscores.harmony ?? 0,
      acceptance: data.endscores.acceptance ?? 0,
    };
  }

  if (data.flags) {
    for (const [k, v] of data.flags) {
      state.storyFlags[k] = v; // 원본과 동일: 문자열로 복원
    }
  }

  return state;
}

export class SaveRepository {
  constructor(
    private readonly storage: KVStorage | null = browserStorage(),
    private readonly key: string = SAVE_KEY,
  ) {}

  exists(): boolean {
    return this.storage?.getItem(this.key) != null;
  }

  save(state: GameState): boolean {
    if (!this.storage) return false;
    try {
      this.storage.setItem(this.key, JSON.stringify(serialize(state)));
      return true;
    } catch {
      return false;
    }
  }

  load(): GameState | null {
    if (!this.storage) return null;
    const text = this.storage.getItem(this.key);
    if (!text) return null;
    try {
      return deserialize(JSON.parse(text) as SaveData);
    } catch {
      return null;
    }
  }

  delete(): boolean {
    if (!this.storage) return false;
    try {
      this.storage.removeItem(this.key);
      return true;
    } catch {
      return false;
    }
  }
}

/** 테스트용 메모리 저장소 팩토리. */
export function memoryStorage(initial: Record<string, string> = {}): KVStorage {
  const store: Record<string, string> = { ...initial };
  return {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
  };
}
