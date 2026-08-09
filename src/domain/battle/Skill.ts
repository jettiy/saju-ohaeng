// src/domain/battle/Skill.ts
// 전투 스킬 값 객체. src/domain/battle/Skill.lua 1:1 이식.
// 유형: attack(단일) / aoe(전체) / heal(회복) / buff(버프) / status(상태이상)

export type SkillType = 'attack' | 'aoe' | 'heal' | 'buff' | 'status';
export type SkillTarget = 'enemy' | 'ally' | 'self' | 'allEnemies' | 'allAllies';

export interface StatusEffect {
  id: string;
  turns: number;
}

export interface SkillDef {
  id: string;
  name: string;
  ohaeng?: string;
  mpCost?: number;
  power?: number;
  type?: SkillType;
  target?: SkillTarget;
  status?: StatusEffect;
  desc?: string;
}

export class Skill {
  readonly id: string;
  readonly name: string;
  readonly ohaeng: string;
  readonly mpCost: number;
  readonly power: number;
  readonly type: SkillType;
  readonly target: SkillTarget;
  readonly status: StatusEffect | undefined;
  readonly desc: string;

  constructor(def: SkillDef) {
    if (!def || !def.id || !def.name) {
      throw new Error('Skill: id, name 필요');
    }
    this.id = def.id;
    this.name = def.name;
    this.ohaeng = def.ohaeng ?? 'wood';
    this.mpCost = def.mpCost ?? 0;
    this.power = def.power ?? 1.0;
    this.type = def.type ?? 'attack';
    this.target = def.target ?? 'enemy';
    this.status = def.status;
    this.desc = def.desc ?? '';
  }

  /** 공격 계열인가. */
  isOffensive(): boolean {
    return this.type === 'attack' || this.type === 'aoe';
  }

  /** 아군 대상인가. */
  targetsAlly(): boolean {
    return this.target === 'ally' || this.target === 'self' || this.target === 'allAllies';
  }
}

// MVP용 기본 스킬 세트. docs/03_gameplay/04_turn_based_battle.md 기반.
export const DEFS: Record<string, SkillDef> = {
  basic_attack: { id: 'basic_attack', name: '공격', ohaeng: 'neutral', mpCost: 0, power: 1.0, type: 'attack', target: 'enemy', desc: '기본 공격' },

  wood_cut: { id: 'wood_cut', name: '새싹 베기', ohaeng: 'wood', mpCost: 4, power: 1.3, type: 'attack', target: 'enemy', desc: '날카로운 잎새로 벤다' },
  wood_root: { id: 'wood_root', name: '뿌리 속박', ohaeng: 'wood', mpCost: 6, power: 0.8, type: 'status', target: 'enemy', status: { id: 'slow', turns: 2 }, desc: '뿌리로 묶어 늦춘다' },
  wood_breath: { id: 'wood_breath', name: '생명의 숨결', ohaeng: 'wood', mpCost: 8, power: 40, type: 'heal', target: 'ally', desc: '생명력을 불어넣어 회복' },

  fire_strike: { id: 'fire_strike', name: '불꽃 일격', ohaeng: 'fire', mpCost: 5, power: 1.4, type: 'attack', target: 'enemy', desc: '불꽃을 머금은 일격' },
  fire_burn: { id: 'fire_burn', name: '화염 작렬', ohaeng: 'fire', mpCost: 9, power: 1.2, type: 'status', target: 'enemy', status: { id: 'burn', turns: 3 }, desc: '지속 화상' },

  water_jet: { id: 'water_jet', name: '물줄기', ohaeng: 'water', mpCost: 4, power: 1.2, type: 'attack', target: 'enemy', desc: '물줄기로 타격' },
  water_heal: { id: 'water_heal', name: '생명수', ohaeng: 'water', mpCost: 7, power: 35, type: 'heal', target: 'ally', desc: '맑은 물로 회복' },

  metal_slash: { id: 'metal_slash', name: '강철 참격', ohaeng: 'metal', mpCost: 5, power: 1.5, type: 'attack', target: 'enemy', desc: '강철 같은 일격' },

  earth_quake: { id: 'earth_quake', name: '대지진', ohaeng: 'earth', mpCost: 10, power: 1.1, type: 'aoe', target: 'allEnemies', desc: '적 전체에 지진' },

  rust_bite: { id: 'rust_bite', name: '녹슨 이빨', ohaeng: 'metal', mpCost: 0, power: 1.1, type: 'attack', target: 'enemy', desc: '녹슨 이빨로 문다' },
  rust_guard: { id: 'rust_guard', name: '녹 방어', ohaeng: 'metal', mpCost: 0, power: 0, type: 'buff', target: 'self', status: { id: 'defense_up', turns: 2 }, desc: '방어 태세' },
};
