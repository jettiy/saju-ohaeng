import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// 웹 배포용 빌드 설정. base: './' 로 서브경로 호스팅(GitHub Pages / itch.io) 대응.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    // 한글 경로(사주스타듀밸리)에서 Vite 가 기존 outDir 를 비우는 단계에서 크래시하는 이슈 우회.
    // 빌드 직후 index.html 이 최신 해시를 가리키므로 일일 clean 은 불필요. 배포 전 수동 clean.
    emptyOutDir: false,
    chunkSizeWarningLimit: 1500,
  },
});
