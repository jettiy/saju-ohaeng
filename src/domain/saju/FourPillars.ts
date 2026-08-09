// src/domain/saju/FourPillars.ts
// 사주팔자(四柱八字) 값 객체. src/domain/saju/FourPillars.lua 1:1 이식.
// 4개 주(柱): 년주/월주/일주/시주.

import { mod } from '../util';

/** 10 천간 (한글). 인덱스 0=갑. */
export const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'] as const;
/** 10 천간 (한자). */
export const STEMS_HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
/** 12 지지 (한글). 인덱스 0=자. */
export const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'] as const;
/** 12 지지 (한자). */
export const BRANCHES_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

export interface Pillar {
  stem: string;
  branch: string;
  stemIndex: number;
  branchIndex: number;
  stemHanja: string;
  branchHanja: string;
}

/** 개별 주(Pillar) 생성. stemIndex 0~9, branchIndex 0~11. */
export function makePillar(stemIndex: number, branchIndex: number): Pillar {
  const si = mod(stemIndex, 10);
  const bi = mod(branchIndex, 12);
  return {
    stem: STEMS[si],
    branch: BRANCHES[bi],
    stemIndex: si,
    branchIndex: bi,
    stemHanja: STEMS_HANJA[si],
    branchHanja: BRANCHES_HANJA[bi],
  };
}

function pillarToString(p: Pillar): string {
  return `${p.stem}${p.branch}(${p.stemHanja}${p.branchHanja})`;
}

export class FourPillars {
  readonly yearPillar: Pillar;
  readonly monthPillar: Pillar;
  readonly dayPillar: Pillar;
  readonly hourPillar: Pillar;

  constructor(yearPillar: Pillar, monthPillar: Pillar, dayPillar: Pillar, hourPillar: Pillar) {
    for (const [name, p] of [
      ['yearPillar', yearPillar],
      ['monthPillar', monthPillar],
      ['dayPillar', dayPillar],
      ['hourPillar', hourPillar],
    ] as const) {
      if (!p || p.stem === undefined || p.branch === undefined) {
        throw new Error(`FourPillars: ${name} 형식 오류`);
      }
    }
    this.yearPillar = yearPillar;
    this.monthPillar = monthPillar;
    this.dayPillar = dayPillar;
    this.hourPillar = hourPillar;
  }

  /** "갑자(甲子) 을축(乙丑) ..." 형태. */
  toString(): string {
    return [
      pillarToString(this.yearPillar),
      pillarToString(this.monthPillar),
      pillarToString(this.dayPillar),
      pillarToString(this.hourPillar),
    ].join(' ');
  }

  /** 4개 천간 배열 (년/월/일/시 순). */
  getStems(): string[] {
    return [this.yearPillar.stem, this.monthPillar.stem, this.dayPillar.stem, this.hourPillar.stem];
  }

  /** 4개 지지 배열 (년/월/일/시 순). */
  getBranches(): string[] {
    return [this.yearPillar.branch, this.monthPillar.branch, this.dayPillar.branch, this.hourPillar.branch];
  }

  /** 4개 주 순회 (년->월->일->시). */
  pillars(): Pillar[] {
    return [this.yearPillar, this.monthPillar, this.dayPillar, this.hourPillar];
  }
}
