// src/domain/battle/Battle.ts
// 전투 애그리거트 루트. 턴 진행, 행동 처리, 승패 판정.
// src/domain/battle/Battle.lua 1:1 이식.

import { Combatant } from './Combatant';
import { Skill, DEFS as SKILL_DEFS } from './Skill';
import * as ElementInteraction from '../ohaeng/ElementInteraction';
import * as Ohaeng from '../saju/Ohaeng';

export const STATE = {
  INTRO: 'intro',
  PLAYER_TURN: 'player_turn',
  ENEMY_TURN: 'enemy_turn',
  ANIMATING: 'animating',
  VICTORY: 'victory',
  DEFEAT: 'defeat',
  FLED: 'fled',
} as const;
export type BattleState = typeof STATE[keyof typeof STATE];

export interface AttackResult {
  damage: number;
  multiplier: number;
  relation: ElementInteraction.Relation;
  crit: boolean;
  log: string;
}

export interface HitResult {
  target: Combatant;
  damage: number;
  crit: boolean;
  multiplier: number;
  relation: ElementInteraction.Relation;
}

export interface ActionResult {
  actor: Combatant;
  skill: Skill;
  type: 'action';
  log: string;
  failed?: boolean;
  hits?: HitResult[];
  heal?: { target: Combatant; amount: number };
}

export class Battle {
  playerParty: Combatant[];
  enemyParty: Combatant[];
  allCombatants: Combatant[];
  state: BattleState = STATE.INTRO;
  turn = 1;
  turnOrder: Combatant[] = [];
  currentIndex = 1;
  lastLog: string[] = [];

  constructor(playerParty: Combatant[], enemyParty: Combatant[]) {
    this.playerParty = playerParty;
    this.enemyParty = enemyParty;
    this.allCombatants = [...playerParty, ...enemyParty];
    this.buildTurnOrder();
  }

  /** 턴 오더 생성: speed 내림차순, 살아있는 자만. */
  private buildTurnOrder(): void {
    this.turnOrder = this.allCombatants.filter((c) => c.isAlive());
    this.turnOrder.sort((a, b) => b.speed - a.speed);
    this.currentIndex = 1; // Lua 1-indexed → TS 배열은 0-indexed 이지만 원본 인덱스 의미 유지용 1 시작
  }

  /**
   * 현재 행동 차례인 Combatant 반환.
   * 주의: 원본 Lua 는 1-indexed currentIndex 로 turnOrder[currentIndex] 접근.
   * TS 0-indexed 배열에 맞춰 currentIndex-1 인덱싱.
   */
  currentActor(): Combatant | null {
    while (this.currentIndex <= this.turnOrder.length) {
      const c = this.turnOrder[this.currentIndex - 1];
      if (c && c.isAlive()) return c;
      this.currentIndex += 1;
    }
    return null;
  }

  isPlayerTurn(): boolean {
    const actor = this.currentActor();
    return actor !== null && !actor.isEnemy;
  }

  isEnemyTurn(): boolean {
    const actor = this.currentActor();
    return actor !== null && actor.isEnemy;
  }

  /** 전투 종료 조건 체크. 상태 갱신. */
  checkEnd(): boolean {
    const playerAlive = this.playerParty.some((c) => c.isAlive());
    const enemyAlive = this.enemyParty.some((c) => c.isAlive());
    if (!playerAlive) {
      this.state = STATE.DEFEAT;
      return true;
    }
    if (!enemyAlive) {
      this.state = STATE.VICTORY;
      return true;
    }
    return false;
  }

  /** 스킬/공격의 데미지 계산 (도메인 로직). */
  computeAttack(attacker: Combatant, defender: Combatant, skill?: Skill | null): AttackResult {
    const usedSkill = skill ?? new Skill(SKILL_DEFS.basic_attack);
    const baseAtk = attacker.attack * usedSkill.power;

    // neutral 스킬은 공격자 자신의 오행 사용. 그 외는 스킬 오행.
    let atkOhaeng = usedSkill.ohaeng;
    if (atkOhaeng === 'neutral' || !Ohaeng.isValid(atkOhaeng)) {
      atkOhaeng = attacker.ohaeng;
    }

    let mult = 1.0;
    let rel: ElementInteraction.Relation = 'same';
    if (Ohaeng.isValid(atkOhaeng) && Ohaeng.isValid(defender.ohaeng)) {
      mult = ElementInteraction.damageMultiplier(atkOhaeng, defender.ohaeng);
      rel = ElementInteraction.relation(atkOhaeng, defender.ohaeng);
    }

    const crit = Math.random() < 0.1;
    const critMult = crit ? 1.8 : 1.0;
    let dmg = baseAtk * mult * critMult - defender.defense * 0.5;
    dmg = Math.max(1, Math.floor(dmg));

    const log = `${attacker.name}의 ${usedSkill.name}! ${defender.name}에게 ${dmg} 데미지${crit ? ' (치명타!)' : ''}${mult > 1 ? ' (상극!)' : mult < 1 ? ' (역극)' : ''}`;

    return { damage: dmg, multiplier: mult, relation: rel, crit, log };
  }

  /** 플레이어 행동 실행: attacker 가 skill 로 target 에 사용. */
  executePlayerAction(attacker: Combatant, skill: Skill, target?: Combatant | null): ActionResult {
    const result: ActionResult = { actor: attacker, skill, type: 'action', log: '' };
    if (!attacker.spendMp(skill.mpCost)) {
      result.log = 'MP가 부족하다!';
      result.failed = true;
      return result;
    }

    if (skill.isOffensive()) {
      const targets: Combatant[] = [];
      if (skill.target === 'allEnemies') {
        for (const e of this.enemyParty) {
          if (e.isAlive()) targets.push(e);
        }
      } else if (target) {
        targets.push(target);
      }
      result.hits = [];
      for (const def of targets) {
        const r = this.computeAttack(attacker, def, skill);
        def.takeDamage(r.damage);
        if (skill.status) def.addStatus(skill.status.id, skill.status.turns);
        result.hits.push({ target: def, damage: r.damage, crit: r.crit, multiplier: r.multiplier, relation: r.relation });
      }
      result.log = result.hits[0] ? this.computeAttack(attacker, result.hits[0].target, skill).log : '';
    } else if (skill.type === 'heal') {
      const healed = target!.heal(skill.power);
      result.log = `${attacker.name}의 ${skill.name}! ${target!.name} HP ${healed} 회복`;
      result.heal = { target: target!, amount: healed };
    } else if (skill.type === 'buff') {
      if (skill.status) attacker.addStatus(skill.status.id, skill.status.turns);
      result.log = `${attacker.name}의 ${skill.name}!`;
    } else if (skill.type === 'status') {
      if (skill.status && target) {
        target.addStatus(skill.status.id, skill.status.turns);
        result.log = `${attacker.name}의 ${skill.name}! ${target.name} ${skill.status.id}`;
      }
    }

    return result;
  }

  /** 적 AI 행동. 가장 HP 낮은 아군을 공격 위주. */
  executeEnemyAction(attacker: Combatant): ActionResult {
    let skill = new Skill(SKILL_DEFS.basic_attack);
    if (attacker.skills.length > 0 && Math.random() < 0.3) {
      const sdef = attacker.skills[Math.floor(Math.random() * attacker.skills.length)];
      if (attacker.mp >= sdef.mpCost) skill = sdef;
    }
    let target: Combatant | null = null;
    for (const c of this.playerParty) {
      if (c.isAlive()) {
        if (!target || c.hp < target.hp) target = c;
      }
    }
    if (!target) {
      return { actor: attacker, skill, type: 'action', log: '대상 없음' };
    }
    return this.executePlayerAction(attacker, skill, target);
  }

  /** 한 행동 종료 후 다음 행동자로. 상태이상 틱, 종료 체크, 턴 종료 처리. */
  advance(): void {
    const actor = this.currentActor();
    if (actor) actor.tickStatus();
    if (this.checkEnd()) return;
    this.currentIndex += 1;
    if (this.currentIndex > this.turnOrder.length) {
      this.turn += 1;
      this.buildTurnOrder();
    }
  }

  /** 도망 시도 (플레이어만). 60% 성공. */
  tryFlee(): boolean {
    if (Math.random() < 0.6) {
      this.state = STATE.FLED;
      return true;
    }
    return false;
  }

  isVictory(): boolean { return this.state === STATE.VICTORY; }
  isDefeat(): boolean { return this.state === STATE.DEFEAT; }
  isFled(): boolean { return this.state === STATE.FLED; }
  isOver(): boolean { return this.isVictory() || this.isDefeat() || this.isFled(); }
}
