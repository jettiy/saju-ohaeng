// src/domain/saju/Ohaeng.ts
// 오행(五行) 상수 및 헬퍼. Love2D/Lua(src/domain/saju/Ohaeng.lua)로부터 1:1 이식.
// love 의존성 ZERO. DDD Domain 계층.

export const WOOD = 'wood' as const;
export const FIRE = 'fire' as const;
export const EARTH = 'earth' as const;
export const METAL = 'metal' as const;
export const WATER = 'water' as const;

/** 오행 값의 타입. */
export type Element = typeof WOOD | typeof FIRE | typeof EARTH | typeof METAL | typeof WATER;

/** 전체 오행 목록 (상생 순서: 목->화->토->금->수). ALL 은 표준 이름. */
export const ALL: Element[] = [WOOD, FIRE, EARTH, METAL, WATER];

/** 레거시 호환 별칭. */
export const IDS = ALL;

/** 표시 이름 (한글/한자). */
export const NAME: Record<Element, string> = {
  wood: '목(木)',
  fire: '화(火)',
  earth: '토(土)',
  metal: '금(金)',
  water: '수(水)',
};

/** 짧은 이름. */
export const SHORT: Record<Element, string> = {
  wood: '목',
  fire: '화',
  earth: '토',
  metal: '금',
  water: '수',
};

/** 색 (RGB 0-1, UI에서 사용). */
export const COLOR: Record<Element, [number, number, number]> = {
  wood: [0.3, 0.65, 0.3],
  fire: [0.9, 0.35, 0.2],
  earth: [0.7, 0.55, 0.3],
  metal: [0.8, 0.8, 0.85],
  water: [0.25, 0.45, 0.85],
};

/** 유효한 오행 값인지 검증. */
export function isValid(ohaeng: unknown): ohaeng is Element {
  return typeof ohaeng === 'string' && (ALL as string[]).includes(ohaeng);
}
