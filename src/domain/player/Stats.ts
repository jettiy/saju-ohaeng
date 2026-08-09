// src/domain/player/Stats.ts
// 캐릭터 스탯 값 객체 (불변). src/domain/player/Stats.lua 1:1 이식.
// 1차 스탯(farming/smithing/fishing/cooking/mining) + 2차 스탯을 담는 평탄한 래퍼.

export type StatKey =
  | 'farming' | 'smithing' | 'fishing' | 'cooking' | 'mining'
  | 'vitality' | 'spirit' | 'agility' | 'dexterity' | 'wisdom';

export const KEYS: StatKey[] = [
  'farming', 'smithing', 'fishing', 'cooking', 'mining',
  'vitality', 'spirit', 'agility', 'dexterity', 'wisdom',
];

export type StatTable = Partial<Record<StatKey, number>>;

export class Stats {
  private readonly _values: Record<StatKey, number>;

  constructor(statTable: StatTable = {}) {
    this._values = {} as Record<StatKey, number>;
    for (const key of KEYS) {
      this._values[key] = Number(statTable[key]) || 0;
    }
  }

  /** 스탯 값 조회. */
  get(statName: StatKey): number {
    return this._values[statName] ?? 0;
  }

  /** 버프/보너스 적용. 불변 유지를 위해 새 Stats 반환. 결과는 0 미만 방지. */
  withBonus(statName: StatKey, amount: number): Stats {
    const copied: StatTable = {};
    for (const key of KEYS) copied[key] = this._values[key];
    const current = copied[statName] ?? 0;
    copied[statName] = Math.max(0, current + (Number(amount) || 0));
    return new Stats(copied);
  }

  /** 스탯 테이블 복사본 반환 (외부 수정으로부터 내부 보호). */
  getAll(): StatTable {
    const copy: StatTable = {};
    for (const key of KEYS) copy[key] = this._values[key];
    return copy;
  }

  /** 값 동등성. */
  equals(other: Stats): boolean {
    for (const key of KEYS) {
      if (this._values[key] !== other._values[key]) return false;
    }
    return true;
  }

  toString(): string {
    const parts = KEYS.map((key) => `${key}=${this._values[key]}`);
    return `Stats{${parts.join(', ')}}`;
  }
}
