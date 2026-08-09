// tests/saju.spec.ts
// 사주 계산 엔진 이식 검증. tests/domain/saju_calculator_spec.lua 의 계약을 1:1 반영.
// 핵심 불변량: 오행 가중치 총합 == 8.0.

import { describe, it, expect } from 'vitest';
import * as Ohaeng from '@/domain/saju/Ohaeng';
import { OhaengBalance } from '@/domain/saju/OhaengBalance';
import { BirthDate } from '@/domain/saju/BirthDate';
import { FourPillars, makePillar } from '@/domain/saju/FourPillars';
import { calculate, daysSinceEpoch, hourToBranchIndex } from '@/domain/saju/SajuCalculator';

describe('Ohaeng 상수', () => {
  it('WOOD 상수', () => expect(Ohaeng.WOOD).toBe('wood'));
  it('ALL 은 5개', () => expect(Ohaeng.ALL).toHaveLength(5));
  it('wood 유효', () => expect(Ohaeng.isValid('wood')).toBe(true));
  it('xxx 무효', () => expect(Ohaeng.isValid('xxx')).toBe(false));
});

describe('OhaengBalance', () => {
  const bal1 = new OhaengBalance(2, 2, 2, 1, 1);
  it('total 8.0', () => expect(bal1.total()).toBeCloseTo(8.0, 3));
  it('get WOOD', () => expect(bal1.get(Ohaeng.WOOD)).toBe(2));
  it('imbalanceScore 근사 0.49', () => expect(bal1.imbalanceScore()).toBeCloseTo(0.49, 2));

  const balanced = new OhaengBalance(1.6, 1.6, 1.6, 1.6, 1.6);
  it('균형 분포가 불균형보다 점수 낮음', () =>
    expect(balanced.imbalanceScore()).toBeLessThan(bal1.imbalanceScore()));

  it('withValue 는 새 객체 반환', () => {
    const bal2 = bal1.withValue(Ohaeng.WOOD, 5);
    expect(bal2.get(Ohaeng.WOOD)).toBe(5);
    expect(bal1.get(Ohaeng.WOOD)).toBe(2); // 원본 불변
  });

  it('dominant (동점 시 첫번째)', () => expect(bal1.dominant()).toBe(Ohaeng.WOOD));
  it('weakest (동점 시 첫번째)', () => expect(bal1.weakest()).toBe(Ohaeng.METAL));
});

describe('BirthDate', () => {
  it('기본 필드', () => {
    const bd = new BirthDate(1990, 7, 9, 12, 'solar');
    expect(bd.year).toBe(1990);
    expect(bd.month).toBe(7);
    expect(bd.calendar).toBe('solar');
  });

  it('월 13 에러', () => expect(() => new BirthDate(1990, 13, 1)).toThrow());
  it('2월 30일 에러', () => expect(() => new BirthDate(1990, 2, 30)).toThrow());
  it('1899년 범위 에러', () => expect(() => new BirthDate(1899, 1, 1)).toThrow());
  it('2020 윤년 2/29 OK', () => expect(() => new BirthDate(2020, 2, 29)).not.toThrow());
  it('2021 평년 2/29 에러', () => expect(() => new BirthDate(2021, 2, 29)).toThrow());
});

describe('FourPillars', () => {
  it('makePillar(0,0) 은 갑자', () => {
    const p = makePillar(0, 0);
    expect(p.stem).toBe('갑');
    expect(p.branch).toBe('자');
    expect(p.stemHanja).toBe('甲');
    expect(p.branchHanja).toBe('子');
  });

  it('toString 형태', () => {
    const fp = new FourPillars(makePillar(0, 0), makePillar(1, 1), makePillar(2, 2), makePillar(3, 3));
    const s = fp.toString();
    expect(s).toContain('갑자');
    expect(s).toContain('을축');
    expect(fp.getStems()).toHaveLength(4);
    expect(fp.getBranches()).toHaveLength(4);
  });
});

describe('SajuCalculator.calculate', () => {
  const result = calculate({ year: 1990, month: 7, day: 9, hour: 12, calendar: 'solar' });

  it('fourPillars non-nil', () => expect(result.fourPillars).toBeDefined());
  it('ohaengBalance non-nil', () => expect(result.ohaengBalance).toBeDefined());

  it('오행 총합 8.0', () => expect(result.ohaengBalance.total()).toBeCloseTo(8.0, 2));

  it('결정성: 같은 입력 -> 같은 결과', () => {
    const r2 = calculate({ year: 1990, month: 7, day: 9, hour: 12, calendar: 'solar' });
    expect(result.ohaengBalance.get(Ohaeng.WOOD)).toBe(r2.ohaengBalance.get(Ohaeng.WOOD));
    expect(result.ohaengBalance.get(Ohaeng.WATER)).toBe(r2.ohaengBalance.get(Ohaeng.WATER));
  });

  it('BirthDate 객체로도 동일 결과', () => {
    const r3 = calculate(new BirthDate(1990, 7, 9, 12, 'solar'));
    expect(result.ohaengBalance.get(Ohaeng.WOOD)).toBe(r3.ohaengBalance.get(Ohaeng.WOOD));
  });
});

describe('여러 날짜 크래시 테스트 (1900-2050)', () => {
  const cases: Array<[number, number, number, number]> = [
    [1900, 1, 1, 0], [1900, 1, 1, 23], [1950, 6, 15, 6],
    [1988, 2, 29, 12], [2000, 12, 31, 18], [2020, 2, 29, 3],
    [2050, 7, 4, 11], [1999, 12, 31, 23], [2024, 1, 1, 1],
    [1945, 8, 15, 9], [2030, 6, 6, 14], [1970, 1, 1, 0],
  ];
  for (const [y, m, d, h] of cases) {
    it(`${y}-${m}-${d} ${h}시 오행 총합 8.0`, () => {
      const res = calculate({ year: y, month: m, day: d, hour: h, calendar: 'solar' });
      expect(Math.abs(res.ohaengBalance.total() - 8.0)).toBeLessThan(0.01);
    });
  }
});

describe('시진 변환', () => {
  it('0시=자', () => expect(hourToBranchIndex(0)).toBe(0));
  it('23시=자', () => expect(hourToBranchIndex(23)).toBe(0));
  it('1시=축', () => expect(hourToBranchIndex(1)).toBe(1));
  it('3시=인', () => expect(hourToBranchIndex(3)).toBe(2));
  it('12시=오', () => expect(hourToBranchIndex(12)).toBe(6));
});

describe('경과 일수 (epoch=1900-01-01)', () => {
  it('1900-01-01 = 0일', () => expect(daysSinceEpoch(1900, 1, 1)).toBe(0));
  it('1900-01-02 = 1일', () => expect(daysSinceEpoch(1900, 1, 2)).toBe(1));
  it('1901-01-01 = 365일 (1900 평년)', () => expect(daysSinceEpoch(1901, 1, 1)).toBe(365));
});
