// src/domain/world/FarmTile.ts
// 밭 타일 하나의 상태. 씨앗 심기 -> 성장 -> 수확. 오행 연계 내장.
// src/domain/world/FarmTile.lua 1:1 이식.

import type { Element } from '../saju/Ohaeng';
import type { Stats } from '../player/Stats';

export const EMPTY_STAGE = 0;
export const MAX_STAGE = 3; // 0(빈틀), 1(새싹), 2(어린 작물), 3(수확가능)

export interface CropDef {
  name: string;
  ohaeng: Element;
  baseDays: number;
  value: number;
}

export const CROPS: Record<string, CropDef> = {
  barley: { name: '보리', ohaeng: 'wood', baseDays: 3, value: 30 },
  radish: { name: '무', ohaeng: 'earth', baseDays: 2, value: 25 },
  cabbage: { name: '양배추', ohaeng: 'wood', baseDays: 4, value: 40 },
};

export interface HarvestYield {
  crop: string;
  name: string;
  value: number;
}

export interface GrowthResult {
  grew: boolean;
  withered: boolean;
}

export class FarmTile {
  readonly tx: number;
  readonly ty: number;
  crop: string | null = null;
  stage = 0;
  growth = 0;
  watered = false;
  weeds = 0;

  constructor(tx: number, ty: number) {
    this.tx = tx;
    this.ty = ty;
  }

  /** 씨앗 심기. cropId 는 CROPS 키. */
  plant(cropId: string): void {
    if (!CROPS[cropId]) {
      throw new Error(`FarmTile.plant: 알 수 없는 작물 ${cropId}`);
    }
    this.crop = cropId;
    this.stage = 1;
    this.growth = 0;
    this.watered = false;
    this.weeds = 0;
  }

  isEmpty(): boolean {
    return this.crop === null;
  }

  isHarvestable(): boolean {
    return this.crop !== null && this.stage >= MAX_STAGE;
  }

  water(): void {
    this.watered = true;
  }

  weed(): void {
    this.weeds = 0;
  }

  /** 하루 경과 성장 갱신. playerStats 는 farming 스탯 영향 계산용. */
  onDailyGrowth(playerStats?: Stats | null): GrowthResult {
    if (this.crop === null) return { grew: false, withered: false };

    const farming = playerStats?.get('farming') ?? 10;
    let speed = 0.3 + farming * 0.01; // 기본 0.3 + farming*0.01
    if (this.watered) speed += 0.2; // 물 보너스
    speed *= 1 - this.weeds * 0.5; // 잡초(금 기운) 방해

    this.growth += speed;
    let grew = false;
    if (this.growth >= 1 && this.stage < MAX_STAGE) {
      this.stage += 1;
      this.growth = 0;
      grew = true;
    }

    if (!this.watered) {
      this.weeds = Math.min(1, this.weeds + 0.15);
    }
    this.watered = false; // 하루 지나면 다시 물 필요

    return { grew, withered: this.weeds >= 1 };
  }

  /** 수확. 작물 제거하고 보상 반환. */
  harvest(): HarvestYield | null {
    if (!this.isHarvestable()) return null;
    const cropDef = CROPS[this.crop!];
    const result: HarvestYield = { crop: this.crop!, name: cropDef.name, value: cropDef.value };
    this.crop = null;
    this.stage = 0;
    this.growth = 0;
    this.watered = false;
    this.weeds = 0;
    return result;
  }

  toString(): string {
    if (this.crop === null) return 'FarmTile(empty)';
    return `FarmTile(${this.crop} stage=${this.stage} growth=${this.growth.toFixed(2)} water=${this.watered} weeds=${this.weeds.toFixed(2)})`;
  }
}
