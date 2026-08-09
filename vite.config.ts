import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// 웹 배포용 빌드 설정.
// base: 프로덕션은 GitHub Pages 프로젝트 경로(/saju-ohaeng/) 고정, 개발은 루트.
// (Vite 5.4 에서 base:'./' 가 HTML 스크립트 src를 상대경로로 만들지 않아 프로젝트 Pages 에서 404.)
export default defineConfig(({ mode }) => ({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  base: mode === 'production' ? '/saju-ohaeng/' : '/',
  build: {
    target: 'es2020',
    outDir: 'dist',
    // 한글 경로(사주스타듀밸리)에서 Vite 가 기존 outDir 를 비우는 단계에서 크래시하는 이슈 우회.
    emptyOutDir: false,
    chunkSizeWarningLimit: 1500,
  },
}));
