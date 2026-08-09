// src/domain/relationship/Companion.ts
// 동료 엔티티. 영입된 NPC. 전투 참전 + 호감도.
// src/domain/relationship/Companion.lua 1:1 이식.

import type { Element } from '../saju/Ohaeng';

export interface CompanionDef {
  id: string;
  name: string;
  ohaeng?: Element | string;
  occupation?: string;
  affinity?: number;
  recruited?: boolean;
}

export class Companion {
  readonly id: string;
  readonly name: string;
  ohaeng: string;
  occupation: string;
  affinity: number;
  recruited: boolean;

  constructor(def: CompanionDef) {
    if (!def || !def.id || !def.name) {
      throw new Error('Companion: id, name 필요');
    }
    this.id = def.id;
    this.name = def.name;
    this.ohaeng = def.ohaeng ?? 'wood';
    this.occupation = def.occupation ?? '';
    this.affinity = def.affinity ?? 0;
    this.recruited = def.recruited === true;
  }

  isRecruited(): boolean {
    return this.recruited;
  }

  addAffinity(amount: number): void {
    this.affinity = Math.max(0, Math.min(10, this.affinity + amount));
  }

  recruit(): void {
    this.recruited = true;
    this.affinity = Math.max(this.affinity, 5);
  }

  toString(): string {
    return `Companion(${this.name} ${this.ohaeng} 호감도=${this.affinity} ${this.recruited ? '영입됨' : '미영입'})`;
  }
}

// MVP 동료 정의: 보리. 이후 마을 동료 뼈대(MVP 범위 외).
export const DEFS: Record<string, CompanionDef> = {
  bori: { id: 'bori', name: '보리', ohaeng: 'wood', occupation: '농부', affinity: 0, recruited: false },
  ember: { id: 'ember', name: '엠버', ohaeng: 'fire', occupation: '대장장이' },
  marlin: { id: 'marlin', name: '말린', ohaeng: 'water', occupation: '어부' },
  saffron: { id: 'saffron', name: '사프론', ohaeng: 'metal', occupation: '요리사' },
  grit: { id: 'grit', name: '그릿', ohaeng: 'earth', occupation: '광부' },
};
