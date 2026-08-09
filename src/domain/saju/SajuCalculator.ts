// src/domain/saju/SajuCalculator.ts
// 사주팔자 산출 + 오행 가중치 계산. src/domain/saju/SajuCalculator.lua 1:1 이식.
//
// [중요 - 단순화 안내] (원본 Lua 주석 인용)
// 정확한 사주 산출은 만세력 데이터(절입 시각, 음력-양력 변환 테이블)가 필요하다.
// 본 구현은 MVP용 근사치. 단 오행 가중치 총합은 정확히 8.0 (천간 4.0 + 지지 4.0).

import * as Ohaeng from './Ohaeng';
import type { Element } from './Ohaeng';
import { BirthDate } from './BirthDate';
import { FourPillars, makePillar } from './FourPillars';
import { OhaengBalance } from './OhaengBalance';
import { mod } from '../util';

// 천간 -> 오행 매핑
const STEM_OHAENG: Record<string, Element> = {
  갑: Ohaeng.WOOD, 을: Ohaeng.WOOD,
  병: Ohaeng.FIRE, 정: Ohaeng.FIRE,
  무: Ohaeng.EARTH, 기: Ohaeng.EARTH,
  경: Ohaeng.METAL, 신: Ohaeng.METAL,
  임: Ohaeng.WATER, 계: Ohaeng.WATER,
};

// 지지 장간(藏干) 가중치: 본기/중기/여기. 각 지지의 오행 분해. 합이 1.0.
const BRANCH_HIDDEN: Record<string, Array<[Element, number]>> = {
  자: [[Ohaeng.WATER, 1.0]],
  축: [[Ohaeng.EARTH, 0.7], [Ohaeng.WATER, 0.2], [Ohaeng.METAL, 0.1]],
  인: [[Ohaeng.WOOD, 0.7], [Ohaeng.FIRE, 0.2], [Ohaeng.EARTH, 0.1]],
  묘: [[Ohaeng.WOOD, 1.0]],
  진: [[Ohaeng.EARTH, 0.7], [Ohaeng.WOOD, 0.2], [Ohaeng.WATER, 0.1]],
  사: [[Ohaeng.FIRE, 0.6], [Ohaeng.WOOD, 0.3], [Ohaeng.EARTH, 0.1]],
  오: [[Ohaeng.FIRE, 0.7], [Ohaeng.EARTH, 0.3]],
  미: [[Ohaeng.EARTH, 0.7], [Ohaeng.FIRE, 0.2], [Ohaeng.WATER, 0.1]],
  신: [[Ohaeng.METAL, 0.7], [Ohaeng.WATER, 0.2], [Ohaeng.EARTH, 0.1]],
  유: [[Ohaeng.METAL, 1.0]],
  술: [[Ohaeng.EARTH, 0.7], [Ohaeng.METAL, 0.3]],
  해: [[Ohaeng.WATER, 0.7], [Ohaeng.WOOD, 0.3]],
};

// 1900-01-01 은 갑자(甲子)일 (60갑자 인덱스 0).
const EPOCH_YEAR = 1900;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// 각 월의 일수 (평년). 인덱스 0=1월.
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** 1900-01-01 부터 (year, month, day) 까지의 경과 일수 (음이 아님). year >= 1900. */
export function daysSinceEpoch(year: number, month: number, day: number): number {
  let total = 0;
  for (let y = EPOCH_YEAR; y <= year - 1; y++) {
    total += isLeapYear(y) ? 366 : 365;
  }
  for (let m = 1; m <= month - 1; m++) {
    let d = MONTH_DAYS[m - 1];
    if (m === 2 && isLeapYear(year)) d = 29;
    total += d;
  }
  total += day - 1;
  return total;
}

/** 0-23 시 -> 12시진 인덱스(0=자, ..., 11=해). 자시: 23시와 0시. */
export function hourToBranchIndex(hour: number): number {
  if (hour === 23 || hour === 0) return 0;
  return Math.floor((hour + 1) / 2);
}

/** 음력 입력을 양력으로 단순 변환 (MVP 근사). */
function lunarToSolarApprox(year: number, month: number, day: number): { year: number; month: number; day: number } {
  let solarMonth = month;
  let solarDay = day + Math.floor(month * 0.5);
  let y = year;
  while (solarDay > MONTH_DAYS[solarMonth - 1]) {
    solarDay -= MONTH_DAYS[solarMonth - 1];
    solarMonth += 1;
    if (solarMonth > 12) {
      solarMonth = 1;
      y += 1;
    }
  }
  return { year: y, month: solarMonth, day: solarDay };
}

export interface SajuResult {
  fourPillars: FourPillars;
  ohaengBalance: OhaengBalance;
}

type BirthDateLike = BirthDate | { year: number; month: number; day: number; hour?: number; calendar?: string; isLeapMonth?: boolean };

/** 메인 계산. BirthDate 객체 또는 {year,month,day,hour,calendar,isLeapMonth} 테이블. */
export function calculate(birthDate: BirthDateLike): SajuResult {
  let bd: BirthDate;
  if (birthDate instanceof BirthDate) {
    bd = birthDate;
  } else {
    bd = new BirthDate(
      birthDate.year,
      birthDate.month,
      birthDate.day,
      birthDate.hour ?? 12,
      (birthDate.calendar as 'solar' | 'lunar') ?? 'solar',
      birthDate.isLeapMonth ?? false,
    );
  }

  let { year, month, day } = bd;
  const hour = bd.hour;

  // 음력이면 양력 근사 변환
  if (bd.calendar === 'lunar') {
    ({ year, month, day } = lunarToSolarApprox(year, month, day));
  }

  // 년주: (year - 4) % 60 으로 60갑자 인덱스. 갑자가 인덱스 0.
  const yearStemIndex = mod(year - 4, 10);
  const yearBranchIndex = mod(year - 4, 12);
  const yearPillar = makePillar(yearStemIndex, yearBranchIndex);

  // 월주: (month + 1) % 12 를 월지로. 월간은 (yearStemIndex*12 + month) % 10 근사.
  const monthBranchIndex = mod(month + 1, 12);
  const monthStemIndex = mod(yearStemIndex * 12 + month, 10);
  const monthPillar = makePillar(monthStemIndex, monthBranchIndex);

  // 일주: 1900-01-01(갑자) 기준 경과 일수 mod 60.
  const days = daysSinceEpoch(year, month, day);
  const dayPillarIndex = mod(days, 60);
  const dayStemIndex = mod(dayPillarIndex, 10);
  const dayBranchIndex = mod(dayPillarIndex, 12);
  const dayPillar = makePillar(dayStemIndex, dayBranchIndex);

  // 시주: 일간 기준 "五鼠遁" 근사.
  const hourBranchIndex = hourToBranchIndex(hour);
  const hourStemIndex = mod(mod(dayStemIndex, 5) * 2 + hourBranchIndex, 10);
  const hourPillar = makePillar(hourStemIndex, hourBranchIndex);

  const fourPillars = new FourPillars(yearPillar, monthPillar, dayPillar, hourPillar);
  const ohaengBalance = calculateOhaeng(fourPillars);

  return { fourPillars, ohaengBalance };
}

/** 사주팔자 -> 오행 가중치. 천간 4개 각 1.0 + 지지 4개 장간(합 1.0) = 총합 8.0. */
export function calculateOhaeng(fourPillars: FourPillars): OhaengBalance {
  const w: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };

  for (const pillar of fourPillars.pillars()) {
    const o = STEM_OHAENG[pillar.stem];
    if (o) w[o] += 1.0;
  }

  for (const pillar of fourPillars.pillars()) {
    const hidden = BRANCH_HIDDEN[pillar.branch];
    if (hidden) {
      for (const [o, weight] of hidden) {
        w[o] += weight;
      }
    }
  }

  return new OhaengBalance(w.wood, w.fire, w.earth, w.metal, w.water);
}

export const SajuCalculator = {
  calculate,
  calculateOhaeng,
  daysSinceEpoch,
  hourToBranchIndex,
};
