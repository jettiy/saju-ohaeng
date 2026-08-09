// src/domain/saju/BirthDate.ts
// 생년월일시 값 객체 (Value Object). src/domain/saju/BirthDate.lua 1:1 이식.
// 생성 시 검증, 이후 불변.

export type Calendar = 'solar' | 'lunar';

export interface BirthDateInit {
  year: number;
  month: number;
  day: number;
  hour?: number;
  calendar?: Calendar;
  isLeapMonth?: boolean;
}

/** 평년 기준 월별 최대 일수 (2월은 isLeapYear 로 보정). */
function daysInMonth(year: number, month: number): number {
  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  return days[month - 1];
}

/** 윤년 판정. */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function assertInt(value: number, name: string): void {
  if (!Number.isInteger(value)) {
    throw new Error(`BirthDate: ${name} 는 정수여야 합니다. got=${value}`);
  }
}

export class BirthDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly calendar: Calendar;
  readonly isLeapMonth: boolean;

  constructor(year: number, month: number, day: number, hour = 12, calendar: Calendar = 'solar', isLeapMonth = false) {
    assertInt(year, 'year');
    assertInt(month, 'month');
    assertInt(day, 'day');

    if (year < 1900 || year > 2100) {
      throw new Error(`BirthDate: year 범위는 1900~2100 입니다. got=${year}`);
    }
    if (month < 1 || month > 12) {
      throw new Error(`BirthDate: month 범위는 1~12 입니다. got=${month}`);
    }

    const dim = daysInMonth(year, month);
    if (day < 1 || day > dim) {
      throw new Error(`BirthDate: day 범위는 1~${dim} (month=${month}, year=${year}). got=${day}`);
    }

    assertInt(hour, 'hour');
    if (hour < 0 || hour > 23) {
      throw new Error(`BirthDate: hour 범위는 0~23 입니다. got=${hour}`);
    }

    if (calendar !== 'solar' && calendar !== 'lunar') {
      throw new Error(`BirthDate: calendar 는 'solar' 또는 'lunar' 여야 합니다. got=${calendar}`);
    }

    // 양력인 경우 윤월 플래그는 의미 없음 - 강제 false
    const leap = calendar === 'solar' ? false : Boolean(isLeapMonth);

    this.year = year;
    this.month = month;
    this.day = day;
    this.hour = hour;
    this.calendar = calendar;
    this.isLeapMonth = leap;
  }

  /** 값 객체 동등성. */
  equals(other: BirthDate): boolean {
    return (
      this.year === other.year &&
      this.month === other.month &&
      this.day === other.day &&
      this.hour === other.hour &&
      this.calendar === other.calendar &&
      this.isLeapMonth === other.isLeapMonth
    );
  }

  toString(): string {
    const leap = this.isLeapMonth ? '(윤)' : '';
    const y = String(this.year).padStart(4, '0');
    const mo = String(this.month).padStart(2, '0');
    const d = String(this.day).padStart(2, '0');
    const h = String(this.hour).padStart(2, '0');
    return `BirthDate(${y}-${mo}-${d} ${h}시 ${this.calendar}${leap})`;
  }
}
