// src/domain/ohaeng/StatMapping.ts
// 오행 가중치 -> 캐릭터 스탯 변환 도메인 서비스.
// src/domain/ohaeng/StatMapping.lua 1:1 이식.

export const STAT_PER_WEIGHT = 5;
export const BASE_PRIMARY_STAT = 10;
export const BASE_SECONDARY_STAT_VITALITY = 20;
export const BASE_SECONDARY_STAT_SPIRIT = 15;
export const BASE_SECONDARY_STAT_OTHER = 10;
export const SECONDARY_WEIGHT_PRIMARY = 3;
export const SECONDARY_WEIGHT_SECONDARY = 1;

export interface OhaengBalanceLike {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

export interface PrimaryStats {
  farming: number;
  smithing: number;
  fishing: number;
  cooking: number;
  mining: number;
}

export interface SecondaryStats {
  vitality: number;
  spirit: number;
  agility: number;
  dexterity: number;
  wisdom: number;
}

export type StatsTable = PrimaryStats & SecondaryStats;

export interface BattleStats {
  maxHp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
}

/** 오행 가중치 -> 1차/2차 스탯 통합 변환. */
export function fromOhaeng(ohaengBalance: OhaengBalanceLike): StatsTable {
  const wood = Number(ohaengBalance.wood) || 0;
  const fire = Number(ohaengBalance.fire) || 0;
  const earth = Number(ohaengBalance.earth) || 0;
  const metal = Number(ohaengBalance.metal) || 0;
  const water = Number(ohaengBalance.water) || 0;

  const BASE = BASE_PRIMARY_STAT;
  const SPW = STAT_PER_WEIGHT;
  const W3 = SECONDARY_WEIGHT_PRIMARY;
  const W1 = SECONDARY_WEIGHT_SECONDARY;

  return {
    // 1차 스탯 (생업): 오행 1:1 매핑
    farming: BASE + wood * SPW,
    smithing: BASE + fire * SPW,
    fishing: BASE + water * SPW,
    cooking: BASE + metal * SPW,
    mining: BASE + earth * SPW,
    // 2차 스탯 (전투/일상): 복수 오행 기여
    vitality: BASE_SECONDARY_STAT_VITALITY + earth * W3 + wood * W1,
    spirit: BASE_SECONDARY_STAT_SPIRIT + water * W3 + metal * W1,
    agility: BASE_SECONDARY_STAT_OTHER + wood * W3 + fire * W1,
    dexterity: BASE_SECONDARY_STAT_OTHER + metal * W3 + earth * W1,
    wisdom: BASE_SECONDARY_STAT_OTHER + fire * W3 + water * W1,
  };
}

/** 1차/2차 스탯 -> 전투 파생 스탯 변환. */
export function deriveBattleStats(stats: Pick<StatsTable, 'vitality' | 'spirit' | 'agility' | 'dexterity' | 'wisdom'>): BattleStats {
  const vitality = Number(stats.vitality) || 0;
  const spirit = Number(stats.spirit) || 0;
  const agility = Number(stats.agility) || 0;
  const dexterity = Number(stats.dexterity) || 0;
  const wisdom = Number(stats.wisdom) || 0;

  return {
    maxHp: vitality * 10 + 50,
    maxMp: spirit * 5 + 20,
    attack: (dexterity + wisdom) / 2 + 5,
    defense: vitality * 0.5,
    speed: agility,
  };
}

export const StatMapping = {
  fromOhaeng,
  deriveBattleStats,
  STAT_PER_WEIGHT,
  BASE_PRIMARY_STAT,
  BASE_SECONDARY_STAT_VITALITY,
  BASE_SECONDARY_STAT_SPIRIT,
  BASE_SECONDARY_STAT_OTHER,
  SECONDARY_WEIGHT_PRIMARY,
  SECONDARY_WEIGHT_SECONDARY,
};
