에셋 폴더 — Cozy Farm / Cozy People (shubibubi)
=================================================

이 폴더의 PNG 파일들이 Vite 의 public/ 을 통해 /saju-ohaeng/assets/ 경로로 서빙된다.
Phaser 씬(FieldScene 등)의 preload 에서 `this.load.image(key, 'assets/game_art/<file>.png')` 로 로드.

다운로드 절차 (사용자)
-----------------------
1. Cozy Farm (무료): https://shubibubi.itch.io/cozy-farm → "Download Now"
2. Cozy People (권장, 같은 작가): https://shubibubi.itch.io/cozy-people
3. ZIP 풀어서 아래처럼 분류해 이 폴더에 복사:
   - 타일/지형(grass, water, dirt, path) → game_art/
   - 작물/식물(crop, plant)              → game_art/
   - 캐릭터(walk + 방향)                 → sprites/
   - 건물/소품                           → game_art/
   - Tiled 맵(.tmx/.json)               → maps/

자동 인식 키워드 (원본 AssetManager 컨벤션 — Codex 가 preload 에 적용)
-------------------------------------------------------------------
잔디=grass  물=water  작물=crop/plant  캐릭터=character/walk  대화상자=dialog/textbox

참고: 원본 Love2D 프로젝트의 에셋 설치 가이드는
C:\Users\USER-PC\Desktop\사주스타듀밸리\ASSET_SETUP.md
