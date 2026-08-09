# Codex 구현 핸드오프 — 사주팔자 오행 (웹)

> 이 문서는 이미 검증된 기반 위에 **Codex가 나머지 씬(피처)을 구현**하기 위한 명세다.
> omp가 만든 것: 도메인(14파일, 126 테스트 통과) + App/Infra + Phaser 씬 패턴(Boot/Title/SajuInput/SajuResult).
> Codex가 맡을 것: FieldScene(탐험+농사) · BattleScene(턴제 전투) · CompanionScene(동료 영입) · EndingScene(엔딩 분기 미리보기).

---

## 1. 현재 상태 (검증됨)

- **도메인**: `src/domain/**` — love/phaser 의존성 ZERO. Lua→TS 1:1 이식. 핵심 불변량 **오행 총합 = 8.0** 보존.
- **테스트**: `npx vitest run` → **126 passed**. 도메인 계약(사주 계산/오행 상성/전투 수학/농사/세이브 라운드트립) 전부 검증.
- **타입체크**: `npx tsc --noEmit` → 0 에러.
- **빌드**: `npx vite build` → `dist/` (정적 사이트, gzip 347KB). `npx vite preview` 로 서빙 가능.
- **브라우저 검증 완료**: 타이틀 → 사주 입력 → 오행 결과(컬러 막대) 플로우가 실제 키보드 입력으로 동작.

## 2. 아키텍처 (반드시 지킬 것)

DDD 4계층. **의존성은 항상 바깥→안쪽** (Presentation → Application → Domain ← Infrastructure).

```
src/
├── domain/              [DOMAIN] 순수 TS, phaser 의존성 ZERO (vitest 로 단위 테스트)
│   ├── saju/            Ohaeng · BirthDate · FourPillars · OhaengBalance · SajuCalculator
│   ├── ohaeng/          ElementInteraction(상생/상극) · StatMapping(오행→스탯)
│   ├── player/          Stats(불변 값객체) · GameState(세션 상태)
│   ├── battle/          Combatant · Skill(DEFS) · Battle(애그리거트)
│   ├── world/           FarmTile(농사)
│   └── relationship/    Companion(DEFS)
├── application/         GameSession (GameState 홀더 + applySaju + save/load 조율)
├── infrastructure/      persistence/SaveRepository (localStorage + JSON, 주입 가능)
└── presentation/        sceneKeys · scenes/* (Phaser 씬)  ← Codex 작업 영역
```

### 핵심 규칙
- **Domain 계층은 `phaser`/DOM import 금지.** 도메인 로직은 순수 TS. (전투/농사 계산은 이미 다 됨 — 씬은 이것을 "호출만" 함)
- 값 객체(OhaengBalance/Stats/BirthDate)는 불변. 변경 메서드는 새 인스턴스 반환.
- GameState는 Application 계층(GameSession)이 들고, 씬들은 **레지스트리**로 공유.

## 3. 씬 패턴 (이미 구현된 SajuInputScene/SajuResultScene 이 정답 예시)

- 씬 키: `src/presentation/sceneKeys.ts` 의 `Scenes` 상수 사용 (문자열 하드코딩 금지).
- GameSession 접근: `const session = this.game.registry.get(SESSION_KEY) as GameSession;`
- 게임 상태: `session.state` (GameState). 사주/스탯/동료/엔딩점수/스토리플래그 모두 여기.
- 디자인 해상도: 960×540 (`GAME_WIDTH/HEIGHT`). 폰트: `"'Noto Sans KR', 'Malgun Gothic', sans-serif"`.
- 키보드: `this.input.keyboard?.on('keydown-X', ...)` 또는 `.once(...)`.
- 씬 전환: `this.scene.start(Scenes.XXX)`.

## 4. 도메인 API (씬이 호출할 것)

### 사주/오행
- `SajuCalculator.calculate({year,month,day,hour,calendar})` → `{fourPillars, ohaengBalance}` (이미 GameSession.applySaju 로 처리됨)
- `ohaengBalance.total()` (==8.0), `.dominant()`, `.weakest()`, `.get(Ohaeng.WOOD)`
- `ElementInteraction.damageMultiplier(attacker, defender)` → 1.5(상극)/0.75(역극)/1.0
- `StatMapping.fromOhaeng(balance)` → 1차+2차 스탯, `deriveBattleStats(stats)` → {maxHp,maxMp,attack,defense,speed}

### 전투 (이미 완전 구현됨 — 씬은 UI만)
```ts
const battle = new Battle([playerCombatant], [enemyCombatant]);
battle.computeAttack(attacker, defender, skill);   // {damage, multiplier, relation, crit, log}
battle.executePlayerAction(actor, skill, target);  // ActionResult (hits/heal/failed)
battle.executeEnemyAction(actor);
battle.advance();      // 다음 행동자로; 상태이상 틱 + 종료 체크
battle.isVictory()/isDefeat()/isOver();
```
- `Combatant.new({name, ohaeng, maxHp, maxMp, attack, defense, speed, isEnemy, skills})`
- `Skill.DEFS` (basic_attack, wood_cut, fire_strike, ... + rust_bite/rust_guard 보스용). `new Skill(Skill.DEFS.fire_strike)`.

### 농사 (FarmTile 완전 구현됨)
```ts
tile.plant('barley'); tile.water(); tile.onDailyGrowth(playerStats); tile.harvest();
// CROPS: barley/radish/cabbage. MAX_STAGE=3.
```

### 동료 (Companion)
- `Companion.DEFS` (bori/ember/marlin/saffron/grit). `new Companion(Companion.DEFS.bori)`, `.recruit()`, `.addAffinity(n)`.

### GameState
- `state.stats.get('farming')`, `state.addCompanion(c)`, `state.hasCompanion(id)`, `state.addEndScore('harmony',1)`, `state.dominantEnding()`, `state.setFlag('k',v)`, `state.getFlag('k')`.

## 5. 구현할 씬 명세 (수직 슬라이스 범위)

> 원본 Lua 씬: `C:\Users\USER-PC\Desktop\사주스타듀밸리\src\presentation\scenes\*.lua` 참고 (로직은 이식됨, UI만 다시).

### A. FieldScene (Greenfield 마을) — 최우선
- **역할**: 탑다운 탐험 + 농사 상호작용 + 던전입구(전투 진입) + 역술원(사주 확인) + 보리(동료 진입).
- **입력**: WASD/화살표 이동, E 상호작용, I 메뉴, S 저장.
- **도메인 사용**: `FarmTile` (밭 타일들), `GameState` 위치/플래그.
- **맵**: 타일 데이터가 아직 없음 → 우선 도형(사각형) 플레이스홀더로 구역 배치(밭 구역/던전입구/NPC/역술원). 에셋 들어오면 교체.
- **완료 조건**: 플레이어 이동 + 밭에서 심기/물주기/수확 1사이클 + 던전입구 진입 시 BattleScene 으로 전환.

### B. BattleScene (턴제 전투) — 최우선
- **역할**: 미니 보스(녹슨파수견, Combatant ohaeng=metal, skills=[rust_bite, rust_guard]) vs 플레이어.
- **플레이어 Combatant**: `GameState.stats` → `deriveBattleStats` 로 maxHp/attack 등 산출. ohaeng = `ohaengBalance.dominant()`.
- **입력**: 스킬 선택(↑↓) + Enter 실행. 적 턴 자동(`executeEnemyAction`).
- **도메인 사용**: `Battle.executePlayerAction/executeEnemyAction/advance`, `Skill.DEFS`.
- **완료 조건**: 승리→FieldScene 복귀(보상), 패배→타이틀, 도망 시도.

### C. CompanionScene (보리 영입)
- **역할**: 보리 대화 → 선택 → 영입 플로우. 영입 시 `GameState.addCompanion`.
- **완료 조건**: 대화 진행 + 영입 선택 시 `state.hasCompanion('bori')==true` + 호감도/엔딩점수 가산.

### D. EndingScene (엔딩 분기 미리보기)
- **역할**: `state.dominantEnding()` (extremity/harmony/acceptance) 에 따른 미리보기 텍스트.
- **완료 조건**: 3축 점수 기반 분기 표시 + 타이틀로 복귀.

## 6. 빌드/테스트/실행

```bash
cd web
npm install            # 주의: pnpm 사용 불가 (한글 경로 junction 이슈)
npx vitest run         # 도메인 단위 테스트 (126개)
npx tsc --noEmit       # 타입체크
npx vite build         # 정적 빌드 → dist/
npx vite preview       # 빌드 서빙 (또는 npx vite dev 로 HMR 개발)
```

## 7. 제약 (반드시 숙지)

- **npm 전용**: 이 프로젝트 경로(`사주스타듀밸리`)에 한글이 있어 pnpm junction 생성이 실패함. 패키지 관리자는 npm 만 사용.
- **vite emptyOutDir=false**: 한글 경로에서 dist 삭제 단계가 크래시. 배포 전 수동 clean (`cmd //c "rmdir /s /q dist"`).
- **새 도메인 로직 추가 시**: 반드시 `tests/` 에 vitest 케이스 추가. 도메인은 phaser import 없이 테스트 가능해야 함.
- **디자인 문서**: `C:\Users\USER-PC\Desktop\사주스타듀밸리\docs\` (엔진 무관, 시스템/스토리 상세).
