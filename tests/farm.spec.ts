// tests/farm.spec.ts
// 농사(FarmTile) 도메인 이식 검증. tests/domain/farm_spec.lua 의 계약을 1:1 반영.

import { describe, it, expect } from 'vitest';
import { FarmTile, CROPS } from '@/domain/world/FarmTile';
import { Stats } from '@/domain/player/Stats';

describe('기본 상태', () => {
  const t = new FarmTile(5, 3);
  it('새 타일은 빈 상태', () => expect(t.isEmpty()).toBe(true));
  it('빈 타일 수확 불가', () => expect(t.isHarvestable()).toBe(false));
  it('초기 stage 0', () => expect(t.stage).toBe(0));
});

describe('씨앗 심기', () => {
  const t = new FarmTile(5, 3);
  t.plant('barley');
  it('심은 후 비어있지 않음', () => expect(t.isEmpty()).toBe(false));
  it('crop=barley', () => expect(t.crop).toBe('barley'));
  it('심으면 stage 1', () => expect(t.stage).toBe(1));
});

describe('성장 (farming 스탯 영향)', () => {
  it('약한 스탯 1일차 stage 변화 없음(게이지만 오름)', () => {
    const weakStats = new Stats({ farming: 10 });
    const t2 = new FarmTile(1, 1);
    t2.plant('barley');
    const before = t2.stage;
    t2.onDailyGrowth(weakStats);
    expect(t2.stage).toBe(before);
    expect(t2.growth).toBeGreaterThan(0);
  });
});

describe('강한 스탯 + 물주기: 빠른 성장', () => {
  const strongStats = new Stats({ farming: 50 }); // speed 0.3+0.5=0.8 + 물 0.2 = 1.0
  it('1일차 stage 2', () => {
    const t3 = new FarmTile(2, 2);
    t3.plant('barley');
    t3.water();
    const res = t3.onDailyGrowth(strongStats);
    expect(t3.stage).toBe(2);
    expect(res.grew).toBe(true);
  });

  it('2일차 stage 3(수확가능)', () => {
    const t3 = new FarmTile(2, 2);
    t3.plant('barley');
    t3.water();
    t3.onDailyGrowth(strongStats);
    t3.water();
    t3.onDailyGrowth(strongStats);
    expect(t3.stage).toBe(3);
    expect(t3.isHarvestable()).toBe(true);
  });
});

describe('수확', () => {
  it('수확 반환 후 빈 타일', () => {
    const strongStats = new Stats({ farming: 50 });
    const t3 = new FarmTile(2, 2);
    t3.plant('barley');
    t3.water();
    t3.onDailyGrowth(strongStats);
    t3.water();
    t3.onDailyGrowth(strongStats);
    const yield_ = t3.harvest();
    expect(yield_).not.toBeNull();
    expect(yield_!.crop).toBe('barley');
    expect(yield_!.value).toBeGreaterThan(0);
    expect(t3.isEmpty()).toBe(true);
  });
});

describe('잡초(금 기운) 방해', () => {
  const strongStats = new Stats({ farming: 50 });
  it('잡초 50% 시 1일차 성장 지연', () => {
    const t4 = new FarmTile(3, 3);
    t4.plant('barley');
    t4.weeds = 0.5;
    t4.water();
    const beforeStage = t4.stage;
    t4.onDailyGrowth(strongStats);
    expect(t4.stage).toBe(beforeStage);
  });

  it('제초 후 weeds=0', () => {
    const t4 = new FarmTile(3, 3);
    t4.weeds = 0.5;
    t4.weed();
    expect(t4.weeds).toBe(0);
  });
});

describe('작물 정의', () => {
  it('보리/무 존재, 보리 가격 > 0', () => {
    expect(CROPS.barley).toBeDefined();
    expect(CROPS.radish).toBeDefined();
    expect(CROPS.barley.value).toBeGreaterThan(0);
  });

  it('알 수 없는 작물 -> 에러', () => {
    expect(() => new FarmTile(1, 1).plant('xxx')).toThrow();
  });
});
