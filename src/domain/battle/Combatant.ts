// src/domain/battle/Combatant.ts
// 전투 참가자(플레이어/동료/적). src/domain/battle/Combatant.lua 1:1 이식.

import type { Skill } from './Skill';

export interface CombatantDef {
  id?: string;
  name: string;
  ohaeng?: string;
  maxHp?: number;
  maxMp?: number;
  attack?: number;
  defense?: number;
  speed?: number;
  isEnemy?: boolean;
  skills?: Skill[];
}

export class Combatant {
  readonly id: string;
  readonly name: string;
  ohaeng: string;
  maxHp: number;
  hp: number;
  maxMp: number;
  mp: number;
  attack: number;
  defense: number;
  speed: number;
  readonly isEnemy: boolean;
  readonly skills: Skill[];
  alive = true;
  statusEffects: Record<string, number> = {};

  constructor(def: CombatantDef) {
    if (!def || !def.name) {
      throw new Error('Combatant: name 필요');
    }
    this.id = def.id ?? def.name;
    this.name = def.name;
    this.ohaeng = def.ohaeng ?? 'wood';
    this.maxHp = def.maxHp ?? 100;
    this.hp = def.maxHp ?? 100;
    this.maxMp = def.maxMp ?? 30;
    this.mp = def.maxMp ?? 30;
    this.attack = def.attack ?? 15;
    this.defense = def.defense ?? 5;
    this.speed = def.speed ?? 10;
    this.isEnemy = def.isEnemy === true;
    this.skills = def.skills ?? [];
  }

  takeDamage(amount: number): number {
    const dmg = Math.max(0, Math.floor(amount));
    this.hp = Math.max(0, this.hp - dmg);
    if (this.hp <= 0) this.alive = false;
    return dmg;
  }

  heal(amount: number): number {
    const h = Math.max(0, Math.floor(amount));
    this.hp = Math.min(this.maxHp, this.hp + h);
    if (this.hp > 0) this.alive = true; // 회복 시 부활
    return h;
  }

  spendMp(amount: number): boolean {
    if (this.mp < amount) return false;
    this.mp -= amount;
    return true;
  }

  restoreMp(amount: number): void {
    this.mp = Math.min(this.maxMp, this.mp + amount);
  }

  isAlive(): boolean {
    return this.alive && this.hp > 0;
  }

  addStatus(id: string, turns: number): void {
    this.statusEffects[id] = turns;
  }

  hasStatus(id: string): boolean {
    return this.statusEffects[id] !== undefined && this.statusEffects[id] > 0;
  }

  /** 매 턴 끝 호출: 상태이상 턴 감소, 만료 제거, poison HP 감소 적용. */
  tickStatus(): void {
    let poisonDmg = 0;
    const next: Record<string, number> = {};
    for (const [id, turns] of Object.entries(this.statusEffects)) {
      if (id === 'poison') {
        poisonDmg += Math.floor(this.maxHp * 0.05);
      }
      const remaining = turns - 1;
      if (remaining > 0) next[id] = remaining;
    }
    this.statusEffects = next;
    if (poisonDmg > 0) this.takeDamage(poisonDmg);
  }

  toString(): string {
    return `${this.name}(${this.ohaeng} HP=${this.hp}/${this.maxHp} MP=${this.mp}/${this.maxMp} ${this.alive ? '생존' : '쓰러짐'})`;
  }
}
