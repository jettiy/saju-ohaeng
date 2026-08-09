// src/domain/saju/OhaengBalance.ts
// 오행 가중치 값 객체 (불변). src/domain/saju/OhaengBalance.lua 1:1 이식.
// 정상 사주라면 4천간(각 1.0) + 4지지 장간(각 합 1.0) = 총합 8.0.

import * as Ohaeng from './Ohaeng';
import type { Element } from './Ohaeng';

export class OhaengBalance {
  readonly wood: number;
  readonly fire: number;
  readonly earth: number;
  readonly metal: number;
  readonly water: number;

  constructor(wood = 0, fire = 0, earth = 0, metal = 0, water = 0) {
    this.wood = Number(wood) || 0;
    this.fire = Number(fire) || 0;
    this.earth = Number(earth) || 0;
    this.metal = Number(metal) || 0;
    this.water = Number(water) || 0;
  }

  /** 5개 오행 가중치 합계. 정상 사주면 8.0 에 가까움. */
  total(): number {
    return this.wood + this.fire + this.earth + this.metal + this.water;
  }

  /** 특정 오행 값 반환. */
  get(ohaeng: Element): number {
    switch (ohaeng) {
      case Ohaeng.WOOD: return this.wood;
      case Ohaeng.FIRE: return this.fire;
      case Ohaeng.EARTH: return this.earth;
      case Ohaeng.METAL: return this.metal;
      case Ohaeng.WATER: return this.water;
      default:
        throw new Error(`OhaengBalance.get: invalid ohaeng '${String(ohaeng)}'`);
    }
  }

  /** 불변 변경: 지정 오행의 값을 amount 로 바꾼 새 객체 반환. */
  withValue(ohaeng: Element, amount = 0): OhaengBalance {
    const a = Number(amount) || 0;
    switch (ohaeng) {
      case Ohaeng.WOOD: return new OhaengBalance(a, this.fire, this.earth, this.metal, this.water);
      case Ohaeng.FIRE: return new OhaengBalance(this.wood, a, this.earth, this.metal, this.water);
      case Ohaeng.EARTH: return new OhaengBalance(this.wood, this.fire, a, this.metal, this.water);
      case Ohaeng.METAL: return new OhaengBalance(this.wood, this.fire, this.earth, a, this.water);
      case Ohaeng.WATER: return new OhaengBalance(this.wood, this.fire, this.earth, this.metal, a);
      default:
        throw new Error(`OhaengBalance.withValue: invalid ohaeng '${String(ohaeng)}'`);
    }
  }

  /** 불균형 점수 (모표준편차). 낮을수록 균형. 완전 균형(2,2,2,2,2) -> 0. */
  imbalanceScore(): number {
    const n = 5;
    const mean = this.total() / n;
    let sumSq = 0;
    for (const o of Ohaeng.ALL) {
      const d = this.get(o) - mean;
      sumSq += d * d;
    }
    return Math.sqrt(sumSq / n);
  }

  /** 가장 큰 오행. 동점이면 ALL 순서상 앞쪽(목->화->토->금->수) 우선. */
  dominant(): Element {
    let best: Element = Ohaeng.ALL[0];
    for (const o of Ohaeng.ALL) {
      if (this.get(o) > this.get(best)) best = o;
    }
    return best;
  }

  /** 가장 작은 오행. 동점이면 ALL 순서상 앞쪽 우선. */
  weakest(): Element {
    let worst: Element = Ohaeng.ALL[0];
    for (const o of Ohaeng.ALL) {
      if (this.get(o) < this.get(worst)) worst = o;
    }
    return worst;
  }

  /** 값 객체 동등성. */
  equals(other: OhaengBalance): boolean {
    return (
      this.wood === other.wood &&
      this.fire === other.fire &&
      this.earth === other.earth &&
      this.metal === other.metal &&
      this.water === other.water
    );
  }

  toString(): string {
    return `OhaengBalance(wood=${this.wood.toFixed(2)}, fire=${this.fire.toFixed(2)}, earth=${this.earth.toFixed(2)}, metal=${this.metal.toFixed(2)}, water=${this.water.toFixed(2)}, total=${this.total().toFixed(2)})`;
  }
}
