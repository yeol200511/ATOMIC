# 자동 테스트 스펙

규칙이 촘촘한 순수 로직에 회귀 테스트를 붙인다.

**상태: 미착수** — 배포로 실제 사용 문제를 먼저 걷어낸 뒤에 붙인다.

## 왜 필요한가

지금 `package.json` 에 test 스크립트가 없고 테스트 파일도 없다. 타입 검사(`tsc --noEmit`)는 통과하지만 타입은 "점수 계산이 맞는가"를 잡아주지 않는다. 점수·채점·전자배치처럼 규칙이 촘촘한 곳은 한 줄 고치다 조용히 어긋나기 쉽다.

## 유리한 점

`src/lib` 이 이미 순수 함수로 갈려 있고, 난수를 쓰는 함수는 전부 `rand` 를 인자로 받는다 — `shuffle` · `pick` · `sampleUnique` · `kindForMode` · `buildQuestion`. `seededRandom(seed)` 로 고정 난수를 넣으면 결과가 그대로 재현된다. 날짜도 `todayKey(now = new Date())` 로 주입할 수 있어 일일 도전과제를 시간과 무관하게 검증할 수 있다.

즉 브라우저를 띄우지 않고 Node 에서 로직 대부분을 검증할 수 있다.

## 도구

Vitest 를 쓴다 — 이미 Vite 를 쓰고 있어 설정과 경로 별칭(`@`)을 그대로 물려받는다. 별도 번들러 설정이 필요 없다.

```
npm i -D vitest
npm run test
```

## 검증 범위

우선순위 순으로 적는다.

### 1. 점수 계산 `src/lib/scoring.ts`
- 난이도 배수 (Easy 1.0 / Normal 1.15 / Hard 1.3)
- 콤보 보너스가 콤보당 +20 이고 15콤보에서 멈추는지
- 시간 보너스가 남은 시간에 비례하고 최대 +50 인지, 시간 제한 OFF 면 0 인지
- `xpForLevel` · `levelFromXp` · `levelInfo` 가 서로 어긋나지 않는지 (레벨 왕복 검증)
- `xpForRun` = 점수/20 + 정답×3 + 최고 콤보×2

### 2. 채점 `src/lib/quiz.ts` · `src/lib/elements.ts`
- `gradeAnswer` 가 문제 유형별로 맞게 판정하는지
- `matchesName` 이 옛 이름을 받는지 (나트륨/소듐, 칼륨/포타슘, 요오드/아이오딘)
- `matchesSymbol` 이 대소문자를 가리지 않는지
- `normalize` 가 공백·대소문자를 지우는지
- `buildQuestion` 이 고정 시드에서 같은 문제를 내는지
- 원자모형 문제 보기 4개에 정답이 정확히 하나 있고 중복이 없는지
- `poolFor` 가 난이도별 범위(20 / 56 / 118)를 지키는지

### 3. 원소 데이터 `scripts/generate-elements.mjs` 산출물
- 원소가 118개인지
- 껍질 전자 합이 원자번호와 같은지 (118개 전부)
- 기호·이름·영문명이 겹치지 않는지
- 바닥상태 예외 21종의 전자배치가 예외표와 맞는지
- 주기율표 좌표가 `TABLE_ROWS`(10) × `TABLE_COLS`(18) 안에 들어오고 칸이 겹치지 않는지

### 4. 업적·도전과제 `src/lib/achievements.ts` · `src/lib/missions.ts`
- 업적 20종의 id 가 겹치지 않는지
- `evaluateAchievements` 가 경계값(예: 딱 조건을 채운 순간)에서 열리는지
- `newlyUnlocked` 가 이미 열린 업적을 다시 세지 않는지
- `generateDailyMissions(date)` 가 같은 날짜에 같은 과제를, 다른 날짜에 다른 과제를 주는지
- `applyMissionProgress` 가 목표를 넘겨도 진행도를 상한에서 멈추는지
- `missionRewardXp` 가 이번에 새로 달성한 과제만 세는지

### 5. 저장소 `src/lib/storage.ts`
- LocalStorage 를 못 쓰는 환경에서 메모리로 넘어가고 예외를 던지지 않는지
- `wipeSavedData` 가 두 키를 모두 지우는지

## 범위 밖

렌더링·애니메이션·오디오는 이번 범위가 아니다. 브라우저 환경이 필요하고 회귀가 나도 눈에 바로 띈다. README 에 적힌 대로 헤드리스 환경에서는 `requestAnimationFrame` 이 스스로 돌지 않아 진입 애니메이션이 끝나지 않는 문제도 있다.

## 완료 조건

- [ ] `npm run test` 로 돌아간다
- [ ] 위 1~5 범위를 덮는다
- [ ] 원소 데이터 118개를 전수 검증한다
- [ ] 난수·날짜에 기대지 않아 몇 번을 돌려도 같은 결과가 나온다
- [ ] `npm run build` 전에 테스트를 함께 돌린다
