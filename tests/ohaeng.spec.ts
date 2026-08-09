// tests/ohaeng.spec.ts
// 오행 시스템 이식 검증. tests/domain/ohaeng_spec.lua 의 계약을 1:1 반영.

import { describe, it, expect } from 'vitest';
import * as Ohaeng from '@/domain/saju/Ohaeng';
import { OhaengBalance } from '@/domain/saju/OhaengBalance';
import * as ElementInteraction from '@/domain/ohaeng/ElementInteraction';
import { fromOhaeng, deriveBattleStats } from '@/domain/ohaeng/StatMapping';
import { Stats } from '@/domain/player/Stats';

const { WOOD: W, FIRE: F, EARTH: E, METAL: M, WATER: Wa } = Ohaeng;

describe('ElementInteraction: 상생', () => {
  it('목생화', () => expect(ElementInteraction.generates(W, F)).toBe(true));
  it('화생토', () => expect(ElementInteraction.generates(F, E)).toBe(true));
  it('수생목', () => expect(ElementInteraction.generates(Wa, W)).toBe(true));
  it('화는 수를 낳지 않음', () => expect(ElementInteraction.generates(F, Wa)).toBe(false));
  it('목은 토를 낳지 않음', () => expect(ElementInteraction.generates(W, E)).toBe(false));
});

describe('ElementInteraction: 상극', () => {
  it('목극토', () => expect(ElementInteraction.restrains(W, E)).toBe(true));
  it('수극화', () => expect(ElementInteraction.restrains(Wa, F)).toBe(true));
  it('금극목', () => expect(ElementInteraction.restrains(M, W)).toBe(true));
  it('목은 화를 극하지 않음', () => expect(ElementInteraction.restrains(W, F)).toBe(false));
});

describe('ElementInteraction: relation', () => {
  it('수->화 상극', () => expect(ElementInteraction.relation(Wa, F)).toBe('sanggeuk'));
  it('화->수 역극', () => expect(ElementInteraction.relation(F, Wa)).toBe('reverse_sanggeuk'));
  it('목->화 상생', () => expect(ElementInteraction.relation(W, F)).toBe('sangsaeng'));
  it('목=목 동일', () => expect(ElementInteraction.relation(W, W)).toBe('same'));
  it('목->금 역극', () => expect(ElementInteraction.relation(W, M)).toBe('reverse_sanggeuk'));
  it('금->목 상극', () => expect(ElementInteraction.relation(M, W)).toBe('sanggeuk'));
});

describe('ElementInteraction: damageMultiplier', () => {
  it('수공화 1.5x', () => expect(ElementInteraction.damageMultiplier(Wa, F)).toBe(1.5));
  it('화공수 0.75x', () => expect(ElementInteraction.damageMultiplier(F, Wa)).toBe(0.75));
  it('목=목 1.0x', () => expect(ElementInteraction.damageMultiplier(W, W)).toBe(1.0));
  it('목->화(상생) 1.0x', () => expect(ElementInteraction.damageMultiplier(W, F)).toBe(1.0));
  it('목->토 상극 1.5x', () => expect(ElementInteraction.damageMultiplier(W, E)).toBe(1.5));
});

describe('StatMapping.fromOhaeng (목 강세)', () => {
  const stats = fromOhaeng(new OhaengBalance(5, 1, 1, 1, 0));
  it('wood=5 -> farming 35', () => expect(stats.farming).toBe(35));
  it('fire=1 -> smithing 15', () => expect(stats.smithing).toBe(15));
  it('water=0 -> fishing 10', () => expect(stats.fishing).toBe(10));
  it('earth=1 -> mining 15', () => expect(stats.mining).toBe(15));
  it('vitality = 20+earth*3+wood = 28', () => expect(stats.vitality).toBe(28));
  it('agility = 10+wood*3+fire = 26', () => expect(stats.agility).toBe(26));
});

describe('화 강세 사주', () => {
  const stats = fromOhaeng(new OhaengBalance(0, 5, 0, 0, 0));
  it('fire=5 -> smithing 35', () => expect(stats.smithing).toBe(35));
  it('wood=0 -> farming 10', () => expect(stats.farming).toBe(10));
});

describe('deriveBattleStats', () => {
  const battle = deriveBattleStats(fromOhaeng(new OhaengBalance(5, 1, 1, 1, 0)));
  it('maxHp = vitality*10+50 = 330', () => expect(battle.maxHp).toBe(330));
  it('maxMp = spirit*5+20 = 100', () => expect(battle.maxMp).toBe(100));
  it('attack 18.5', () => expect(battle.attack).toBeCloseTo(18.5, 2));
  it('defense = vitality*0.5 = 14', () => expect(battle.defense).toBe(14));
  it('speed = agility = 26', () => expect(battle.speed).toBe(26));
});

describe('Stats 값 객체', () => {
  it('get/생략 스탯 0', () => {
    const s1 = new Stats({ farming: 10, smithing: 20 });
    expect(s1.get('farming')).toBe(10);
    expect(s1.get('mining')).toBe(0);
  });

  it('withBonus 불변', () => {
    const s1 = new Stats({ farming: 10 });
    const s2 = s1.withBonus('farming', 5);
    expect(s2.get('farming')).toBe(15);
    expect(s1.get('farming')).toBe(10);
  });

  it('getAll 복사본 독립', () => {
    const s1 = new Stats({ farming: 10 });
    const all = s1.getAll();
    all.farming = 999;
    expect(s1.get('farming')).toBe(10);
  });

  it('음수 0 방어', () => {
    const s4 = new Stats({ farming: 5 }).withBonus('farming', -100);
    expect(s4.get('farming')).toBe(0);
  });
});
