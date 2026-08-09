// src/domain/ohaeng/ElementInteraction.ts
// 오행 상생(相生)/상극(相剋) 규칙. 무상태 도메인 서비스.
// src/domain/ohaeng/ElementInteraction.lua 1:1 이식.
//
// 상생: 목 -> 화 -> 토 -> 금 -> 수 -> 목 ...
// 상극: 목 -> 토 -> 수 -> 화 -> 금 -> 목 ...

import * as Ohaeng from '../saju/Ohaeng';
import type { Element } from '../saju/Ohaeng';

/** 상생(相生): key 가 value 를 낳는다. */
export const SANGSAENG: Record<Element, Element> = {
  wood: Ohaeng.FIRE,
  fire: Ohaeng.EARTH,
  earth: Ohaeng.METAL,
  metal: Ohaeng.WATER,
  water: Ohaeng.WOOD,
};

/** 상극(相剋): key 가 value 를 극(이김)한다. */
export const SANGGEUK: Record<Element, Element> = {
  wood: Ohaeng.EARTH,
  earth: Ohaeng.WATER,
  water: Ohaeng.FIRE,
  fire: Ohaeng.METAL,
  metal: Ohaeng.WOOD,
};

/** a 가 b 를 낳는가? (상생) */
export function generates(a: Element, b: Element): boolean {
  return SANGSAENG[a] === b;
}

/** a 가 b 를 극하는가? (상극, a 가 b 를 억누름 = a 가 이김) */
export function restrains(a: Element, b: Element): boolean {
  return SANGGEUK[a] === b;
}

export type Relation = 'same' | 'sangsaeng' | 'sanggeuk' | 'reverse_sanggeuk' | 'none';

/** 공격자/방어자 오행 관계 분류. */
export function relation(attacker: Element, defender: Element): Relation {
  if (attacker === defender) return 'same';
  if (generates(attacker, defender)) return 'sangsaeng';
  if (restrains(attacker, defender)) return 'sanggeuk';
  if (restrains(defender, attacker)) return 'reverse_sanggeuk';
  return 'none';
}

/** 데미지 배율: 상극 1.5 / 역극 0.75 / 그 외 1.0. */
export function damageMultiplier(attacker: Element, defender: Element): number {
  const rel = relation(attacker, defender);
  if (rel === 'sanggeuk') return 1.5;
  if (rel === 'reverse_sanggeuk') return 0.75;
  return 1.0;
}

export const ElementInteraction = {
  SANGSAENG,
  SANGGEUK,
  generates,
  restrains,
  relation,
  damageMultiplier,
};
