import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

// 도메인 계층은 love/phaser 의존성 ZERO → node 환경에서 순수 단위 테스트.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
  },
});
