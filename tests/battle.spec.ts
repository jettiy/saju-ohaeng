// tests/battle.spec.ts
// 전투 도메인 이식 검증. tests/domain/battle_spec.lua 의 계약을 1:1 반영.

import { describe, it, expect } from 'vitest';
import * as Ohaeng from '@/domain/saju/Ohaeng';
import { Combatant } from '@/domain/battle/Combatant';
import { Skill, DEFS } from '@/domain/battle/Skill';
import { Battle } from '@/domain/battle/Battle';

describe('Combatant 기본', () => {
  it('초기 HP / 오행 / 생존', () => {
    const c = new Combatant({ name: '주인공', ohaeng: Ohaeng.WOOD, maxHp: 100, attack: 20, defense: 5 });
    expect(c.hp).toBe(100);
    expect(c.ohaeng).toBe(Ohaeng.WOOD);
    expect(c.isAlive()).toBe(true);
  });
});

describe('데미지/회복', () => {
  const c = new Combatant({ name: '주인공', ohaeng: Ohaeng.WOOD, maxHp: 100, attack: 20, defense: 5 });
  it('데미지 30', () => {
    c.takeDamage(30);
    expect(c.hp).toBe(70);
  });
  it('과데미지 0 + 사망', () => {
    c.takeDamage(999);
    expect(c.hp).toBe(0);
    expect(c.isAlive()).toBe(false);
  });
  it('회복 + 부활', () => {
    c.heal(50);
    expect(c.hp).toBe(50);
    expect(c.isAlive()).toBe(true);
  });
});

describe('MP', () => {
  const c2 = new Combatant({ name: '마법사', maxMp: 20 });
  it('초기 MP', () => expect(c2.mp).toBe(20));
  it('10 소모 성공', () => {
    expect(c2.spendMp(10)).toBe(true);
    expect(c2.mp).toBe(10);
  });
  it('100 소모 실패 + MP 불변', () => {
    expect(c2.spendMp(100)).toBe(false);
    expect(c2.mp).toBe(10);
  });
});

describe('Skill 정의', () => {
  it('기본 공격 / 새싹 베기 정의', () => {
    expect(DEFS.basic_attack).toBeDefined();
    expect(DEFS.wood_cut).toBeDefined();
  });
  it('스킬 이름/공격계열/적대상', () => {
    const s = new Skill(DEFS.wood_cut);
    expect(s.name).toBe('새싹 베기');
    expect(s.isOffensive()).toBe(true);
    expect(s.targetsAlly()).toBe(false);
  });
});

describe('Battle 데미지 계산 (오행 상성)', () => {
  it('수공화 평균 데미지 28-40', () => {
    const attacker = new Combatant({ name: 'A', ohaeng: Ohaeng.WATER, attack: 20 });
    const defender = new Combatant({ name: 'D', ohaeng: Ohaeng.FIRE, defense: 0 });
    const battle = new Battle([attacker], [defender]);
    let total = 0;
    for (let i = 0; i < 20; i++) total += battle.computeAttack(attacker, defender, null).damage;
    const avg = total / 20;
    expect(avg).toBeGreaterThanOrEqual(28);
    expect(avg).toBeLessThanOrEqual(40);
  });

  it('역극(화공수) 데미지 일반(15) 또는 crit(27) 이하', () => {
    const attacker2 = new Combatant({ name: 'A2', ohaeng: Ohaeng.FIRE, attack: 20 });
    const defender2 = new Combatant({ name: 'D2', ohaeng: Ohaeng.WATER, defense: 0 });
    const battle2 = new Battle([attacker2], [defender2]);
    const r2 = battle2.computeAttack(attacker2, defender2, null);
    expect(r2.damage).toBeLessThanOrEqual(30);
  });
});

describe('Battle 종료 조건', () => {
  it('승리', () => {
    const p = new Combatant({ name: '용사', ohaeng: Ohaeng.WOOD, maxHp: 100, attack: 50, speed: 20 });
    const e = new Combatant({ name: '적', ohaeng: Ohaeng.METAL, maxHp: 20, attack: 5, speed: 5, isEnemy: true });
    const b = new Battle([p], [e]);
    expect(b.isOver()).toBe(false);
    b.executePlayerAction(p, new Skill(DEFS.basic_attack), e);
    expect(e.hp <= 0 || !e.isAlive()).toBe(true);
    b.checkEnd();
    expect(b.isVictory()).toBe(true);
  });

  it('패배', () => {
    const p2 = new Combatant({ name: '약자', ohaeng: Ohaeng.WOOD, maxHp: 10, attack: 1, speed: 20 });
    const e2 = new Combatant({ name: '강적', ohaeng: Ohaeng.METAL, maxHp: 100, attack: 50, speed: 5, isEnemy: true });
    const b2 = new Battle([p2], [e2]);
    b2.executePlayerAction(e2, new Skill(DEFS.basic_attack), p2);
    b2.checkEnd();
    expect(b2.isDefeat()).toBe(true);
  });
});

describe('턴 오더 (speed 순)', () => {
  it('빠른 자 먼저', () => {
    const fast = new Combatant({ name: '빠름', speed: 50 });
    const slow = new Combatant({ name: '느림', speed: 5 });
    const b3 = new Battle([fast, slow], []);
    expect(b3.turnOrder[0].name).toBe('빠름');
    expect(b3.turnOrder[1].name).toBe('느림');
  });
});

describe('스킬 MP 소모', () => {
  it('화염 일격 MP 5 소모', () => {
    const mage = new Combatant({ name: '법사', ohaeng: Ohaeng.FIRE, maxMp: 10, attack: 15 });
    const enemy = new Combatant({ name: '적', ohaeng: Ohaeng.WOOD, maxHp: 100, defense: 0, isEnemy: true });
    const b4 = new Battle([mage], [enemy]);
    const mpBefore = mage.mp;
    b4.executePlayerAction(mage, new Skill(DEFS.fire_strike), enemy);
    expect(mage.mp).toBe(mpBefore - 5);
  });

  it('MP 부족 시 실패', () => {
    const mage = new Combatant({ name: '법사', ohaeng: Ohaeng.FIRE, maxMp: 10, attack: 15 });
    const enemy = new Combatant({ name: '적', ohaeng: Ohaeng.WOOD, maxHp: 100, defense: 0, isEnemy: true });
    const b4 = new Battle([mage], [enemy]);
    mage.mp = 2;
    const r5 = b4.executePlayerAction(mage, new Skill(DEFS.fire_strike), enemy);
    expect(r5.failed).toBe(true);
  });
});
