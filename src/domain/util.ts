// src/domain/util.ts
// Lua → TypeScript 이식용 수학 헬퍼. Love2D/Lua 의존성 ZERO.

/**
 * Lua 의 `%` 연산과 동일: 항상 제수의 부호를 따라 [0, n) 범위를 반환.
 * (양수 피연산자에서는 JS `%` 와 동일하지만, 음수도 안전하게 처리.)
 * 천간/지지 인덱스 래핑 등 역학 계산에서 음수 입력을 방어하기 위해 사용.
 */
export function mod(a: number, n: number): number {
  return ((a % n) + n) % n;
}
