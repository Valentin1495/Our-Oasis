# 우리들의 오아시스 핵심 경험 개선 계획

- 작성일: 2026-07-17
- 범위: 오아시스 메인 화면, 공동 달성 규칙, 물 기록 확정 흐름, 멤버 참여 표현, 결과 및 공유 경험
- 이번 문서의 상태: 구현 전 분석 및 계획
- 비범위: 이 문서 작성 외의 제품 코드 변경, 신규 외부 라이브러리 설치

## 결론

현재 구현은 75% 공동 성공과 100% 완벽 성공을 데이터로는 구분하지만, 사용자가 느끼는 변화는 작은 SVG 요소 추가와 문구 변경에 머문다. 가장 큰 문제는 확정된 새 상태가 먼저 렌더링되고 물방울 애니메이션이 나중에 실행되어, “내 행동 때문에 오아시스가 변했다”는 인과관계가 반대로 보인다는 점이다. 다른 멤버의 실시간 기여는 장면이 설명 없이 즉시 바뀌기 때문에 협업 감각도 약하다.

개선 방향은 다음 세 가지다.

1. 서버의 사실 상태, 화면용 파생 상태, 일회성 애니메이션 이벤트를 분리한다.
2. 하나의 SVG 좌표계를 유지하면서 장면을 의미 단위의 레이어 컴포넌트로 분해한다.
3. 물방울 도착 → 물 높이 변화 → 생명체 등장 → 임계점 성공 연출 순서를 보장하는 이벤트 큐를 둔다.

SVG와 CSS 애니메이션만으로 목표를 달성할 수 있다. 현재 설치된 React, TDS, CSS Modules를 유지하고 별도의 애니메이션·캔버스·파티클 라이브러리는 추가하지 않는다.

---

## 1. 현재 구현 구조 요약

### 1.1 기술 구성

| 영역 | 현재 사용 기술 |
| --- | --- |
| 앱 프레임워크 | AppsInToss WebView, Granite `@apps-in-toss/web-framework@2.10.6` |
| UI | React 18, `@toss/tds-mobile@2.5.0`, `@toss/tds-mobile-ait@2.5.0` |
| 전역 상태 | Zustand 5 `useOasisStore` |
| 서버/실시간 | Supabase JS, Postgres Changes, RPC |
| 장면 렌더링 | 단일 inline SVG, CSS Modules |
| 애니메이션 | CSS keyframes와 SVG 속성 transition |
| 테스트 | Vitest, 현재 2개 테스트 파일/30개 테스트 |

`@emotion/react`는 직접 작성한 오아시스 UI에서 사용하지 않고 TDS의 기반 의존성으로만 존재한다. Framer Motion, Lottie, Canvas, WebGL 애니메이션 라이브러리는 없다.

### 1.2 화면 컴포넌트 구조

```text
OasisMainPage
├─ 방 이름 / D-day
├─ OasisScene
│  ├─ 하늘/사막 SVG
│  ├─ WaterPond
│  ├─ Sprout | SmallPalmTree | FullPalmTree
│  ├─ PerfectOasisDecorations
│  ├─ FinalOasisDecorations
│  ├─ SpecialCharacter
│  └─ WaterDrop
├─ SharedProgressBar
├─ MemberList
│  └─ MemberItem[]
├─ 오늘 결과 / 7일 기록 링크
├─ 커스텀 fixed CTA
│  ├─ WaterLogButton
│  └─ 친구 깨우기
├─ UndoBanner(TDS Toast)
└─ DayResultModal(TDS BottomSheet)
```

`OasisScene.tsx`가 장면 파생 계산, 접근성 설명, SVG 배경, 물, 식생, 동물, 보상 장식, 물방울 애니메이션을 모두 담당한다. 파일 내부 함수로 나뉘어 있지만 상태 계약과 렌더링 생명주기는 하나의 컴포넌트에 결합돼 있다.

### 1.3 현재 달성률과 물방울 계산

개인의 하루 목표를 네 구간으로 나누며, 개인 누적 섭취량이 목표의 25/50/75/100%를 통과할 때 공동 물방울을 한 개씩 얻는다. 하루 최대 기여량은 멤버당 4개다.

```text
개인 물방울 = min(4, floor(개인 섭취량 / 개인 목표량 × 4))
공동 최대 물방울 = 당일 eligible 멤버 수 × 4
공동 달성률 = min(100, 공동 물방울 / 공동 최대 물방울 × 100)
75% 필요 물방울 = ceil(공동 최대 물방울 × 0.75)
```

`getCompletionState(totalDrops, maxDrops)`가 정수 물방울을 기준으로 다음 값을 함께 계산한다.

- `completionPercent`
- `requiredDrops`
- `isComplete`: `totalDrops >= ceil(maxDrops × 0.75)`
- `isFullComplete`: `totalDrops >= maxDrops`

멤버가 최대 5명이고 각자 최대 4개를 기여하므로 현재 가능한 `maxDrops`는 4의 배수다. 따라서 정상 데이터에서는 75%가 항상 정수 물방울 경계와 일치한다.

주의할 점은 Supabase의 `refreshCurrentDaySnapshot`은 표시 퍼센트를 반올림하지만 Mock 저장소는 `getCompletionState`의 소수값을 그대로 저장한다는 것이다. 즉, 화면 표시 계약은 저장소 구현 간 완전히 같지 않다.

### 1.4 75%와 100% 판정

| 판정 | 현재 소스 | 기준 |
| --- | --- | --- |
| 75% 공동 성공 | `getCompletionState().isComplete` | 정수 물방울이 `requiredDrops` 이상 |
| 퍼센트 기반 보조 판정 | `isDailyOasisComplete(percent)` | `percent >= 75` |
| 100% 완벽 성공 | `getCompletionState().isFullComplete` | 물방울이 `maxDrops` 이상 |
| 화면 단계 | `getOasisStage(percent)` | `<25`, `<50`, `<75`, `<100`, `>=100` |

현재 `getOasisAchievements`는 오늘의 `DayRecord`가 있으면 저장된 boolean을 우선 사용하고, 없으면 표시 퍼센트로 보조 판정한다. boolean을 우선하는 방향은 유지해야 한다. 반올림된 표시 퍼센트를 비즈니스 판정의 원본으로 사용해서는 안 된다.

README에는 “75%를 넘으면”이라고 쓰여 있지만 실제 코드는 “75% 이상”이다. 문서와 코드의 경계 표현을 통일해야 한다.

### 1.5 현재 장면 단계

| 달성률 | 현재 단계 | 현재 연출 |
| --- | --- | --- |
| 0~24.99% | 1 | 모래색 웅덩이 |
| 25~49.99% | 2 | 청록 물, 새싹 |
| 50~74.99% | 3 | 작은 야자수 |
| 75~99.99% | 4 | 풍성한 야자수, 밝아진 하늘 |
| 100% 이상 | 5 | 75% 장면 + 물결/꽃/반짝임/완성 배지 |

제품이 원하는 0%와 1~24% 구분은 현재 없다. 첫 새싹도 1%가 아니라 25%부터 등장한다. 동물은 50% 구간의 생명력 표현이 아니라 “전원 참여” 보상인 사막여우 하나뿐이다.

물 높이는 퍼센트로 연속 계산하지만 실제 ellipse의 `ry`가 약 4에서 11.2 사이로만 변해 시각적 차이가 작다. 0%에도 최소 크기의 ellipse가 남는다.

### 1.6 물 기록 후 상태 변경 흐름 (갱신됨)

현재 로컬 사용자의 한 컵 기록은 다음 순서다.

```text
WaterLogButton 클릭
→ store.logWaterCup()
→ Supabase RPC log_water_cup으로 즉시 확정
→ loadOasisState()로 전체 상태 재조회
→ 5초 되돌리기 창(undoWindow) 오픈, UndoBanner 표시
→ oasisSceneEvents가 이전/이후 스냅샷을 diff해 contribution/participation 이벤트 생성
→ actorMemberId 기준으로 origin(local/remote/aggregate/system) 판정
→ SharedOasisScene이 물방울 이동 → 임팩트 애니메이션 순서로 재생
```

되돌리기(`undoWaterCup`)는 확정 후 5초(서버는 10초까지 허용) 이내에만 가능하며, `undo_confirmed_water_cup` RPC로 롤백한다. 예전 버전에 있던 "먼저 대기(pending) → 5초 후 확정" 2단계 흐름은 더 이상 존재하지 않는다.

다른 멤버의 확정 기록은 `room_members`/`day_records`의 Postgres Changes를 받아 `loadOasisState()`로 재조회한다. `oasisSceneEvents.ts`가 재조회 전후 스냅샷을 비교해 누가(actor) 무엇을 했는지 판별하므로, 완전히 "이벤트 정보 없이 장면만 바뀌는" 문제는 해소됐다. 다만 두 테이블이 한 번의 확정으로 각각 변경되면 중복 재조회가 발생할 수 있는 점은 남아 있다.

### 1.7 멤버 참여 표현

`MemberList`는 다음 정보를 표시한다.

- 닉네임 첫 글자 아바타
- 현재 사용자 민트색 행 강조와 “나” 라벨
- 오늘 한 번이라도 확정 기록했는지 여부
- 오늘 개인 진행률의 `<50`, `<100`, `>=100` 구간 문구
- 오늘 기여한 물방울 개수
- 참여 여부를 나타내는 작은 상태 점

현재 상태 문구에는 불일치가 있다. `hasWaterRecordToday`가 true이고 개인 진행률이 25% 미만이어도 “첫 물방울 완료”라고 표시한다. 한 컵을 기록했지만 아직 첫 25% 경계를 넘지 못한 사용자는 실제 물방울을 기여하지 않았으므로 잘못된 피드백이다.

멤버별 ml와 순위는 노출하지 않는 현재 개인정보 방향은 적절하다. 장면의 `MemberLayer`에서도 ml나 순위를 새로 노출하지 않아야 한다.

### 1.8 디자인 시스템과 재사용 컴포넌트

현재 앱은 `TDSMobileAITProvider`를 사용하며 다음 TDS 요소를 이미 사용한다.

- `Button`, `TextField`, `Top`
- `ProgressBar`
- `Skeleton`
- `Toast`
- `BottomSheet`

오아시스 개선에서 유지할 수 있는 요소는 TDS `ProgressBar`, `Button`, `Toast`, `BottomSheet`, 텍스트/색상 토큰이다. 단, TDS `ProgressBar` 자체에는 75% 임계점 marker가 없으므로 기본 bar를 래핑해 marker와 상태 설명을 추가하는 방식이 필요하다.

### 1.9 모바일 대응

현재 메인 화면은 다음 방식으로 대응한다.

- `ScreenContainer`: `100dvh`
- 메인 화면: 자체 `overflowY: auto`
- fixed CTA: `ResizeObserver`로 실제 높이를 측정해 하단 스크롤 여백과 Toast 위치에 전달
- 수평 여백: 주로 20px 고정
- SVG: `viewBox="0 0 320 240"`, `width: 100%`, `max-width: 320px`
- Safe Area: 일부 커스텀 영역에서 `env(safe-area-inset-bottom)` 사용
- BottomSheet: 최대 `85vh`, 확장 `100vh`

명시적인 화면 너비/높이 breakpoint는 없다. 작은 화면, 가로 모드, 큰 글자 모드에 따른 장면 높이와 HUD 밀도 변화도 없다. 큰 화면에서도 장면은 320px에서 멈춘다.

### 1.10 접근성과 reduced motion

유지할 만한 현재 대응:

- `OasisScene`에 `role="img"`와 현재 단계/퍼센트 설명이 있다.
- 내부 장식 SVG는 `aria-hidden`이다.
- Toast와 물 기록 피드백은 `aria-live="polite"`를 사용한다.
- 전역 `prefers-reduced-motion: reduce`에서 animation/transition 시간을 0.01ms로 줄인다.
- 포커스 링과 TDS BottomSheet의 포커스 잠금이 있다.

개선이 필요한 부분:

- `role="img"`의 aria-label 변경은 상태 변화 알림을 보장하지 않는다. 완료 이벤트용 별도 live region이 필요하다.
- `aria-hidden`인 SVG 내부 장식의 `aria-label`은 의미가 없다.
- CSS 시간을 줄이는 것만으로 앞으로 추가할 JS 이벤트 큐의 대기 시간을 없앨 수 없다.
- 민트색 `#2db8af`는 현재 배경에서 텍스트 대비가 약 2.19~2.45:1로, 일반 텍스트 WCAG AA 4.5:1을 만족하지 않는다.
- `MemberItem`의 본문과 상태 점이 유사한 상태를 각각 읽어 중복 안내할 수 있다.
- 색상만으로 완료/참여를 구분하지 않고 아이콘·문구를 함께 유지해야 한다.

---

## 2. 현재 UX의 문제점

### P0: 핵심 인과관계가 반대로 보임

확정된 퍼센트와 장면이 먼저 렌더링되고 물방울이 나중에 떨어진다. 사용자의 행동이 장면을 바꾸는 것이 아니라 이미 바뀐 화면 위에 효과가 추가되는 것처럼 보인다.

### P0: 원격 협업 이벤트가 보이지 않음

친구의 기록은 기여자, 물방울 수, 이전/이후 상태를 모르는 전체 재조회로 처리한다. “친구들과 함께 채운다”는 핵심 감정이 만들어지지 않는다.

### P0: 운영 RPC 규칙을 저장소에서 검증할 수 없음

`log_water_cup`, `confirm_water_cup`, `undo_water_cup` SQL 정의와 RLS 정책이 저장소에 없다. 프론트와 Mock의 규칙은 확인할 수 있지만 실제 운영 확정 로직이 같은 정수 물방울 및 75/100 판정을 사용하는지 증명할 수 없다.

### P1: 75% 목표가 진행 바에서 보이지 않음

진행 바는 100%를 전체 길이로 사용하지만 성공 임계점 marker가 없다. 75%에 도달해도 시각적으로는 4분의 1이 비어 있어 “완성”과 충돌한다. 성공까지 남은 퍼센트나 물방울 수도 알려주지 않는다.

### P1: 75%와 100%의 감정적 차이가 작음

100%는 75% 장면에 작은 꽃, 반짝임, 배지를 추가하는 정도다. 색, 빛, 움직임, 결과 CTA에서 명확한 등급 차이가 없다.

### P1: 현재 일일 장면과 주간 보상이 섞임

`isFinalOasisUnlocked`가 true이면 오늘의 퍼센트와 무관하게 물을 100% 높이로 만들고 풍성한 나무를 강제한다. 주간 최종 오아시스 보상이 오늘의 실제 공동 상태를 가려, 오늘 행동의 영향이 약해진다.

`showSpecialCharacter`도 오늘 전원 참여와 주간 5회 참여 보상을 하나의 boolean으로 합쳐 현재 이벤트와 영구 보상을 구분하기 어렵다.

### P1: 0%와 초기 생명 단계가 구분되지 않음

0%에도 최소 물 ellipse가 있고, 1~24%에는 새싹이 없다. 제품이 요구한 “첫 행동으로 작은 물과 첫 새싹이 생김”을 표현하지 못한다.

### P1: 물 높이 변화가 너무 작음

퍼센트는 연속 반영되지만 실제 물 ellipse의 세로 반경 변화가 작아 사용자가 차이를 알아차리기 어렵다.

### P1: 기여 없는 기록의 의미가 불명확함

한 컵이 개인 25% 경계를 넘지 않거나 이미 하루 4개를 모두 기여한 뒤라면 `dropsContributed`는 0이다. 현재는 개인 피드백만 바뀌며 장면과의 관계를 설명하지 않는다. 모든 컵이 공동 물방울을 만든다고 오해할 수 있다.

### P1: 멤버 상태 문구가 실제 기여와 불일치함

물 기록만 있으면 실제 물방울이 0개여도 “첫 물방울 완료”라고 표시한다. 참여, 개인 진행, 공동 기여를 서로 다른 개념으로 표현해야 한다.

### P2: 장면 컴포넌트의 확장성이 낮음

단일 SVG에 모든 레이어와 보상 조건이 들어 있어 단계가 늘거나 동일 레이어에 여러 변형이 생기면 조건문이 빠르게 복잡해진다.

### P2: 공유 도착점이 없음

공유 API와 초대 링크 복사 경험은 있지만, 오늘의 75%/100% 결과를 공유하는 CTA와 안전한 공유 메시지/링크 정책은 없다.

### P2: 반응형 및 큰 글자 검증 부족

작은 높이의 기기에서 장면, HUD, 멤버 리스트, 큰 fixed CTA가 경쟁한다. 현재 자동화된 브라우저/시각 회귀 테스트도 없다.

---

## 3. 유지할 부분과 제거할 부분

### 3.1 유지할 부분

| 유지 대상 | 이유 |
| --- | --- |
| `getCompletionState`의 정수 물방울 판정 | 표시 반올림과 성공 판정을 분리하는 올바른 기반 |
| 75% 공동 성공, 100% 완벽 성공 boolean | 제품 목표와 일치 |
| 멤버당 하루 최대 4개 기여 | 개인 목표 차이를 정규화하고 설명하기 쉬움 |
| 확정 전 5초 Undo | 잘못된 기록을 되돌릴 수 있는 안전장치 |
| 확정된 기록만 공동 상태와 실시간에 반영 | 팀 상태의 신뢰성 유지 |
| SVG 기반 장면 | 작은 번들, 선명한 확대, 레이어 분해 용이 |
| CSS Modules와 CSS keyframes | 새 의존성 없이 충분한 연출 가능 |
| `prefers-reduced-motion` 전역 정책 | 접근성 기반으로 확장 가능 |
| TDS Provider, ProgressBar, Toast, BottomSheet, Button | AppsInToss 비게임 앱의 일관된 UI |
| 멤버 ml/순위 비공개 | 프라이버시와 팀 협력 중심 경험 유지 |
| 실제 CTA 높이 측정 | 작은 화면에서 콘텐츠가 CTA에 가려지는 문제 방지 |

### 3.2 제거하거나 대체할 부분

| 제거/대체 대상 | 권장 대체 |
| --- | --- |
| `OasisStage = 1 | 2 | 3 | 4 | 5` | 의미 이름을 가진 6단계 `OasisPhase` |
| Repository가 반환하는 중복 파생값 `stage` | 클라이언트의 순수 파생 함수 |
| `dropAnimationTick`, `personalRecordAnimationTick` | 의미 있는 `OasisSceneEvent`와 event queue |
| 새 상태 렌더 후 효과 실행 | 이전 snapshot을 유지한 채 이벤트 연출 후 최종 상태 commit |
| 주간 보상이 오늘 장면을 강제하는 조건 | Daily scene과 persistent reward layer 분리 |
| 단일 파일 안의 모든 SVG 레이어 | 동일 SVG 안에서 `<g>`를 반환하는 layer 컴포넌트 |
| `SharedProgressBar`의 단순 100% bar | 75% marker와 남은 물방울을 포함한 `OasisProgressHUD` |
| “첫 물방울 완료” 추정 문구 | 기록 여부/기여 개수/개인 목표 상태를 사실대로 조합 |
| 완료 장식의 무조건적인 반복 재생 | threshold를 실제로 통과한 이벤트에서만 1회 재생 |
| CSS만 줄이고 JS sequence는 유지하는 reduced motion | sequence 자체를 즉시 최종 상태로 축약 |

기존 구현은 새 장면이 완성될 때까지 비교 기준으로 유지할 수 있다. `OasisScene` export를 facade로 두고 내부에서 v1/v2를 선택하면 단계별 전환과 회귀 비교가 쉽다.

---

## 4. 권장 컴포넌트 구조

### 4.1 권장 디렉터리

```text
src/features/oasis/
├─ components/
│  ├─ OasisProgressHUD.tsx
│  ├─ MemberList.tsx
│  ├─ DayResultModal.tsx
│  └─ OasisDebugPanel.tsx
├─ scene/
│  ├─ OasisScene.tsx
│  ├─ OasisScene.module.css
│  ├─ oasisScene.types.ts
│  ├─ deriveOasisSceneModel.ts
│  ├─ deriveOasisSceneModel.test.ts
│  ├─ useOasisSceneController.ts
│  ├─ oasisSceneSequence.ts
│  └─ layers/
│     ├─ SkyLayer.tsx
│     ├─ DesertLayer.tsx
│     ├─ WaterLayer.tsx
│     ├─ VegetationLayer.tsx
│     ├─ AnimalLayer.tsx
│     ├─ MemberLayer.tsx
│     └─ CelebrationLayer.tsx
├─ share/
│  └─ shareOasisResult.ts
├─ oasisRules.ts
└─ index.ts
```

### 4.2 컴포넌트 책임

#### `OasisScene`

- 하나의 responsive SVG와 HTML overlay 좌표계를 소유한다.
- 직접 비즈니스 규칙을 계산하지 않는다.
- `OasisSceneModel`, 현재 `OasisSceneEvent`, motion mode만 받는다.
- 각 layer의 z-order를 명시한다.
- 정적 aria 설명과 이벤트 live region을 분리한다.

#### `SkyLayer`

- 시간대가 아닌 달성 단계 기반 하늘 gradient, 햇빛, 구름, 광량을 표현한다.
- 75%에서는 안정적인 따뜻한 빛, 100%에서는 일회성 golden burst를 제공한다.

#### `DesertLayer`

- 모래, 지형, 마른 균열을 표현한다.
- 진행에 따라 균열 opacity를 줄이되 완전히 사라지는 시점을 단계로 제어한다.

#### `WaterLayer`

- 물 높이는 `waterLevel` 0~1에 따라 연속 변화한다.
- 물방울 impact ripple과 표면 sparkle을 별도 상태로 받는다.
- 0%에서는 빈 basin만 보이고 실제 물 shape는 보이지 않아야 한다.

#### `VegetationLayer`

- 식생의 종류와 개수는 구간별로 단계적으로 증가한다.
- 1~24% 첫 새싹, 25~49% 작은 식물군, 50~74% 야자수와 풀, 75% 이상 풍성한 식생을 표현한다.

#### `AnimalLayer`

- 50~74%부터 작은 생명체가 등장한다.
- 오늘 전원 참여 보상 캐릭터와 주간 정착 캐릭터를 서로 다른 상태로 받는다.
- 장식 애니메이션은 과도한 무한 반복을 피한다.

#### `MemberLayer`

- 최대 5명의 멤버를 장면 가장자리의 작은 marker/아바타로 표현한다.
- 현재 사용자, 오늘 참여, 공동 기여 1~4개를 형태와 문구로 구분한다.
- 로컬 이벤트는 내 marker에서, 원격 이벤트는 해당 친구 marker에서 물방울이 시작되도록 source anchor를 제공한다.
- ml, 정확한 섭취량, 순위는 표시하지 않는다.
- 상세 상태와 조작은 기존 `MemberList`가 담당하고, `MemberLayer`는 협업의 존재감을 주는 보조 시각화로 제한한다.

#### `CelebrationLayer`

- 75% 공동 성공과 100% 완벽 성공의 일회성 연출을 분리한다.
- 영구 장식 상태와 “방금 threshold를 넘은” transient event를 별도 prop으로 받는다.
- SVG particle 수를 제한하고 deterministic key를 사용한다.

#### `OasisProgressHUD`

- 장면과 가까운 위치에 현재 퍼센트, 75% marker, 성공까지 남은 물방울을 표시한다.
- 75% 이후에는 “공동 성공” 상태와 100%까지 남은 물방울을 표시한다.
- 100%에서는 “완벽 성공”과 공유 CTA를 표시한다.
- TDS `ProgressBar`를 기반으로 하되 marker와 레이블은 접근 가능한 wrapper로 구현한다.

#### `OasisDebugPanel`

- `import.meta.env.DEV`에서만 렌더링한다.
- 서버/스토어를 변경하지 않고 local preview model만 조절한다.
- percent 0/1/24/25/49/50/74/75/99/100 preset
- 멤버 수/참여 여부/로컬·원격 이벤트/다중 물방울
- 75·100 threshold crossing
- reduced motion
- 작은/큰 viewport 시나리오

프로덕션 번들에서는 조건 분기로 제거되게 하고, 디버그 상태를 Zustand의 운영 store에 넣지 않는다.

---

## 5. 권장 상태 모델과 타입

### 5.1 상태를 세 층으로 분리

1. **서버 사실 상태**: 물방울, 당일 목표 분모, 멤버 참여, 일별 boolean
2. **화면 파생 상태**: phase, waterLevel, 남은 물방울, 표시 문구, 레이어 가시성
3. **일회성 이벤트 상태**: 누가 몇 개를 기여했고 어떤 threshold를 통과했는지

애니메이션 이벤트를 서버 사실 상태에 섞거나 localStorage에 persist하지 않는다. 새로고침이나 최초 진입 시 이미 달성된 75/100 연출을 다시 재생하지 않고 완성된 정적 상태만 보여줘야 한다.

### 5.2 제안 타입

아래는 구현 방향을 설명하기 위한 타입 초안이다.

```ts
type OasisPhase =
  | "dry"                // 0%
  | "first-life"         // 1~24%
  | "growing"            // 25~49%
  | "thriving"           // 50~74%
  | "community-success"  // 75~99%
  | "perfect";           // 100%

interface OasisProgressSnapshot {
  totalDrops: number;
  maxDrops: number;
  requiredDrops: number;
  exactPercent: number;
  displayPercent: number;
  dropsToCommunitySuccess: number;
  dropsToPerfect: number;
  isCommunitySuccess: boolean;
  isPerfect: boolean;
}

interface OasisMemberView {
  id: string;
  nickname: string;
  isMe: boolean;
  hasParticipatedToday: boolean;
  contributedDropsToday: 0 | 1 | 2 | 3 | 4;
  contributionState: "none" | "participated" | "contributing" | "complete";
}

interface OasisSceneModel {
  phase: OasisPhase;
  waterLevel: number; // clamp 0..1
  vegetationLevel: 0 | 1 | 2 | 3 | 4;
  animalLevel: 0 | 1 | 2;
  lighting: "dry" | "soft" | "alive" | "success" | "perfect";
  progress: OasisProgressSnapshot;
  members: OasisMemberView[];
  todayAllParticipated: boolean;
  persistentRewards: {
    finalOasisUnlocked: boolean;
    rareFinalOasisUnlocked: boolean;
    specialCharacterSettled: boolean;
  };
}

type OasisSceneEvent =
  | {
      id: string;
      kind: "contribution-confirmed";
      origin: "local" | "remote";
      actorMemberId: string;
      dropsAdded: number;
      before: OasisProgressSnapshot;
      after: OasisProgressSnapshot;
      crossed: Array<25 | 50 | 75 | 100>;
    }
  | {
      id: string;
      kind: "participation-only";
      origin: "local" | "remote";
      actorMemberId: string;
    }
  | {
      id: string;
      kind: "goal-rebased";
      previousMaxDrops: number;
      nextMaxDrops: number;
    };
```

### 5.3 파생 규칙

- `exactPercent`는 성공 판정과 물 높이 계산에 쓰되 0~100으로 clamp한다.
- `displayPercent`는 한 곳에서 정수로 정규화한다.
- 성공 boolean은 `DayRecord.isComplete/isFullComplete` 또는 정수 물방울 규칙을 사용한다.
- `phase`는 표시 퍼센트가 아니라 정규화된 progress snapshot에서 파생한다.
- 오늘의 상태와 주간 영구 보상을 분리한다.
- 물 높이는 0~100 전체에서 연속 변화한다.
- 식생/동물/빛은 0, 1, 25, 50, 75, 100 경계에서 단계적으로 변한다.
- 한 번의 확정으로 여러 개인 threshold를 통과하면 `crossed`에 모두 담되, UI는 낮은 단계부터 순차적으로 짧게 재생한다.

### 5.4 원격 이벤트 생성

최선의 방식은 확정된 `water_logs` 이벤트에서 `logId`, `memberId`, `dropsContributed`, 이전/이후 공동 값을 받는 것이다. 이를 위해 운영 Realtime/RLS가 허용되는지 먼저 확인해야 한다.

스키마 변경 없이 시작해야 한다면 이전 `OasisState`와 새 상태를 diff해 다음처럼 추론한다.

- 한 멤버의 `contributedDropsToday`만 증가: 해당 멤버의 원격 기여 이벤트
- 참여 여부만 false → true: participation-only 이벤트
- 여러 멤버가 동시에 변함: 개별 순서를 꾸며내지 않고 “친구들이 물방울 N개를 보탰어요” aggregate 이벤트
- `maxDrops`가 변함: contribution 이벤트가 아니라 goal-rebased 이벤트

`room_members`와 `day_records`의 중복 알림은 짧은 debounce와 snapshot version 비교로 하나의 reconciliation으로 합친다.

---

## 6. 미션 완료 애니메이션의 정확한 실행 순서

### 6.1 로컬 기록, 공동 물방울 1개 이상

| 시간 | 상태/연출 |
| --- | --- |
| 0ms | 물 기록 버튼을 loading/disabled 처리한다. |
| RPC pending 완료 | Undo Toast를 열고 기존 장면은 그대로 유지한다. 아직 공동 성공을 연출하지 않는다. |
| 5초 또는 연속 기록에 의한 확정 시작 | Undo 액션을 닫고 확정 중 상태로 전환한다. |
| 확정 응답 수신 | 현재 화면 snapshot을 `before`로 보존하고 응답/재조회 결과로 `after`와 semantic event를 만든다. |
| 0~180ms | CTA의 성공 피드백과 내 Member marker를 짧게 강조한다. |
| 180~700ms | 내 marker에서 웅덩이까지 물방울을 이동시킨다. 여러 물방울이면 100~140ms 간격으로 stagger한다. |
| 각 impact 시점 | ripple을 만들고 `totalDrops`와 HUD를 한 단계씩 증가시킨다. |
| impact 후 0~500ms | 물 높이를 해당 중간 퍼센트까지 연속 tween한다. |
| 25/50 경계 통과 | 물 변화가 끝난 뒤 식생/동물이 250~500ms fade/grow로 등장한다. |
| 75 경계 통과 | 마지막 impact 후 75% 공동 성공 연출을 실행한다. |
| 100 경계 통과 | 마지막 impact 후 완벽 성공 연출을 실행한다. |
| 종료 | 최종 `after` scene을 settle하고 멤버 리스트를 강조한 뒤 queue의 다음 이벤트를 처리한다. |

중요한 원칙은 “물방울 도착 전에는 물 높이와 phase가 바뀌지 않는다”이다.

### 6.2 기여 물방울이 0개인 로컬 기록

- 거짓 물방울 애니메이션을 만들지 않는다.
- 내 Member marker와 개인 수분 상태만 짧게 반응시킨다.
- “오늘 기록에 추가했어요”와 “다음 공동 물방울까지 …”를 구분해 안내한다.
- 이미 4/4 기여를 마쳤다면 “공동 기여 완료 · 개인 기록에 추가했어요”라고 설명한다.

### 6.3 원격 기여

- CTA나 Undo Toast를 건드리지 않는다.
- 해당 친구의 Member marker를 먼저 강조한다.
- “OO님이 물방울을 보탰어요”를 한 번만 polite live region으로 알린다.
- 이후 물방울 → ripple → 물 높이 → phase 변화 순서는 로컬과 동일하다.
- 여러 이벤트가 겹치면 queue로 직렬화하되, 3개 이상 밀리면 aggregate하여 대기 시간을 제한한다.

### 6.4 75%와 100%를 한 번에 넘는 경우

현재 최대 물방울 규칙에서는 한 확정이 여러 개의 물방울을 줄 수 있다. 이때 75%와 100%를 동시에 통과할 수 있다.

1. 각 물방울과 물 높이 변화를 순차적으로 보여준다.
2. 75% 도달 시 500~700ms의 짧은 공동 성공 bloom을 보여준다.
3. 마지막 물방울로 100%가 되면 75% 루프 상태를 길게 유지하지 않고 바로 완벽 성공 축제로 이어간다.
4. 완료 안내는 최종적으로 “100% 완벽 성공” 한 번만 live region에서 읽는다.

### 6.5 최초 로드/새로고침

- 현재 완성 상태를 즉시 정적으로 렌더링한다.
- 과거 threshold celebration과 물방울 낙하를 재생하지 않는다.
- event id는 persist하지 않으며, subscription 이후 실제 새 이벤트만 재생한다.

### 6.6 reduced motion

- 물방울 이동, camera pulse, particle, 반복 sparkle을 생략한다.
- `before`에서 `after`로 즉시 전환하되 짧은 opacity 변화만 허용한다.
- JS sequence의 timeout도 모두 건너뛴다.
- 텍스트 피드백과 live region은 동일하게 제공한다.

---

## 7. 75%와 100% 연출 차이

| 요소 | 75~99% 공동 성공 | 100% 완벽 성공 |
| --- | --- | --- |
| 의미 | 오늘의 기본 공동 목표 달성 | 모두가 채운 최고 등급 |
| 장면 상태 | 안정적으로 살아난 오아시스 | 같은 장면의 특별 축제 버전 |
| 하늘/빛 | 따뜻하고 밝은 daylight | 짧은 golden burst 후 더 선명한 빛 |
| 물 | 충분한 수위, 잔잔한 ripple | 최대 수위, 별빛 sparkle과 특별 물결 |
| 식생 | 풍성한 나무와 풀 | 추가 꽃, 열매, 색 포인트 |
| 동물 | 동물이 머물며 안정됨 | 동물의 짧은 축하 동작/등장 |
| 효과 | 1회의 부드러운 bloom | 별/빛/제한된 confetti, badge reveal |
| HUD | `공동 성공` + `완벽 성공까지 N개` | `100% 완벽 성공` |
| 사운드 | 기본적으로 사용하지 않음 | 기본적으로 사용하지 않음 |
| 햅틱 | 기존 TDS hook 검증 후 선택적 success | 검증 후 선택적 confetti/success |
| 결과 CTA | 결과 보기 | 결과 보기 + 공유하기 강조 |
| 반복 방문 | 정적 완성 상태 | 정적 특별 장식, 축제는 반복하지 않음 |

75%는 “끝”이면서도 100%를 향한 다음 동기를 제공해야 한다. 75% 연출을 실패처럼 약하게 만들지 않고, 100%는 색·빛·움직임·결과 CTA 네 축에서 추가 등급임을 분명히 한다.

공유 1차 버전은 기존 `@apps-in-toss/web-framework`의 `share()`를 사용한 텍스트 공유로 시작한다. 외부 이미지 생성 라이브러리는 추가하지 않는다. 링크가 필요하면 `getTossShareLink()`를 사용하되, 방 멤버 정보가 외부에 노출되지 않는 결과 전용 경로와 접근 정책을 먼저 설계한다. 현재 `getOasisState(roomId)`의 공개 범위가 명확하지 않으므로 room URL을 그대로 공유하면 안 된다.

---

## 8. 단계별 구현 계획

### 0단계: 규칙과 운영 계약 고정

목표: UI 구현 전에 실제 성공 판정의 단일 source of truth를 확정한다.

- 운영 Supabase의 세 RPC DDL과 RLS 정책을 저장소에서 관리하거나 별도 검증 자료로 확보한다.
- `confirm_water_cup`이 `getCompletionState`와 같은 정수 규칙을 사용하는지 확인한다.
- 표시 퍼센트의 반올림 정책을 Supabase/Mock에서 통일한다.
- README의 “75% 초과”를 “75% 이상”으로 맞춘다.
- 당일 새 멤버 합류 시 분모가 늘어 성공이 취소될 수 있는 현재 정책을 제품 결정으로 확정한다.
  - 권장: 당일 목표 snapshot을 언제 고정할지 명시한다.
  - 현재 정책을 유지한다면 `goal-rebased` UI와 단계 하락 안내가 반드시 필요하다.
- 완료 boolean은 표시 퍼센트가 아니라 정수 물방울에서만 계산한다.

완료 조건: 1~5명, 모든 물방울 수에 대한 프론트/Mock/운영 결과가 동일하다.

### 1단계: 순수 view model과 debug 기반 만들기

- `OasisPhase` 6단계를 도입한다.
- `deriveOasisProgressSnapshot`, `deriveOasisSceneModel`, snapshot diff 함수를 작성한다.
- `OasisState.stage` 의존을 제거하기 위한 adapter를 만든다.
- 경계값과 잘못된 값(음수, 100 초과, maxDrops 0)을 테스트한다.
- 운영 store를 건드리지 않는 `OasisDebugPanel`을 추가한다.

완료 조건: 0/1/24/25/49/50/74/75/99/100 상태를 데이터만으로 재현할 수 있다.

### 2단계: 장면 레이어 분해와 시각적 동등성 확보

- 기존 320×240 SVG를 하나의 좌표계로 유지한다.
- 각 layer를 `<g>` 반환 컴포넌트로 이동한다.
- `OasisScene`은 순서와 접근성만 담당하게 한다.
- 이 단계에서는 기존 모양을 최대한 그대로 유지해 구조 변경과 리디자인 위험을 분리한다.
- 오늘 상태와 주간 persistent reward props를 분리한다.

완료 조건: 기존 5개 대표 상태에서 구조 변경 전후 장면이 기능적으로 동일하다.

### 3단계: 6단계 장면과 연속 물 높이 구현

- 0%의 빈 basin과 1~24%의 첫 물/새싹을 분리한다.
- 25/50/75/100 식생·동물·빛 단계 asset을 SVG로 추가한다.
- 물 면적/높이 변화 범위를 키우고 0~100 연속 함수로 만든다.
- CSS 변수와 transform/opacity 중심으로 GPU 친화적으로 구현한다.
- 큰 화면에서는 장면을 적절히 확대하고, 작은 높이에서는 `clamp()`로 장면 높이를 줄인다.

완료 조건: 모든 경계 전후에서 요소가 튀거나 겹치지 않고 단계 차이가 즉시 인식된다.

### 4단계: 의미 이벤트와 애니메이션 순서

- tick 두 개를 semantic event로 교체한다.
- `useOasisSceneController`와 event queue를 구현한다.
- confirm 응답 시 before/after snapshot을 보존해 장면 commit 순서를 제어한다.
- `animationend` 또는 명시적인 sequence reducer를 사용하고 store 안에 장식용 timer를 늘리지 않는다.
- 기여 0개, 다중 물방울, 75/100 동시 통과를 처리한다.
- reduced motion에서는 queue를 즉시 완료한다.

완료 조건: 장면이 먼저 바뀌는 현재 역전 현상이 사라지고 항상 source → drop → water → life 순서가 보인다.

### 5단계: 협업 HUD와 멤버 표현

- `SharedProgressBar`를 `OasisProgressHUD`로 대체한다.
- 75% marker, 성공까지 남은 물방울, 75 이후 100까지 남은 물방울을 표시한다.
- MemberLayer에 최대 5명의 marker를 배치한다.
- MemberList의 잘못된 “첫 물방울” 문구를 사실 기반 상태로 수정한다.
- 원격 snapshot diff와 subscription dedupe를 구현한다.
- 친구의 기여자를 식별할 수 없는 경우 aggregate 피드백으로 안전하게 fallback한다.

완료 조건: 숫자를 읽지 않아도 누가 참여했고 다음 공동 성공까지 무엇이 남았는지 이해할 수 있다.

### 6단계: 75/100 결과와 공유

- `CelebrationLayer`에 75%와 100% 시퀀스를 분리한다.
- `DayResultModal`의 상태/문구를 새 progress model에 연결한다.
- 100% 이후 `공유하기` CTA를 제공한다.
- 1차는 `share({ message })` 텍스트 공유로 구현한다.
- 공유 링크를 넣는다면 `getTossShareLink()`와 비공개 결과 데이터 정책을 먼저 확정한다.
- 이미지/OG 공유는 서버 이미지 생성 또는 안전한 정적 결과 페이지가 준비된 후 별도 단계로 둔다.

완료 조건: 75%와 100%를 사용자 테스트에서 혼동하지 않고, 100% 결과를 네이티브 공유 시트로 보낼 수 있다.

### 7단계: 접근성·성능·회귀 검증

- live region 문구를 이벤트당 한 번으로 제한한다.
- 160%/200% 글자 크기와 VoiceOver/TalkBack을 확인한다.
- 민트색 본문 텍스트를 대비가 확보되는 adaptive foreground token으로 교체하고 민트는 배경/아이콘/큰 그래픽에 사용한다.
- reduced motion에서 JS 대기와 무한 반복이 없는지 확인한다.
- SVG node/particle 수와 저사양 Android 프레임 저하를 점검한다.
- 기존 scene과 새 scene을 feature flag/facade로 비교한 뒤 이전 구현을 제거한다.

완료 조건: 테스트 행렬과 접근성 체크리스트를 모두 통과하고 기존 규칙 테스트가 유지된다.

---

## 9. 변경이 필요한 파일 목록

### 9.1 기존 파일

| 파일 | 예상 변경 |
| --- | --- |
| `src/pages/OasisMainPage.tsx` | scene view model/controller 연결, HUD 배치, event source 전달 |
| `src/features/oasis/components/OasisScene.tsx` | 새 scene facade로 축소하거나 `scene/`로 이동 |
| `src/features/oasis/components/OasisScene.module.css` | 레이어/sequence 스타일로 분해 |
| `src/features/oasis/components/SharedProgressBar.tsx` | `OasisProgressHUD`로 대체 후 제거 |
| `src/features/oasis/components/MemberList.tsx` | 참여/기여 문구 수정, 내/원격 이벤트 강조 |
| `src/features/oasis/components/DayResultModal.tsx` | 새 75/100 상태와 공유 CTA 연결 |
| `src/features/oasis/oasisRules.ts` | 표시 단계와 도메인 판정 분리, snapshot helper 정리 |
| `src/features/oasis/oasisRules.test.ts` | 전체 인원/경계/분모 변경 테스트 확대 |
| `src/features/oasis/index.ts` | 새 scene/HUD/model export |
| `src/features/water/WaterLogButton.tsx` | semantic feedback와 다음 물방울 안내 |
| `src/features/water/UndoBanner.tsx` | 확정 window/scene event와 닫힘 타이밍 조율 |
| `src/lib/store/useOasisStore.ts` | semantic event, before/after reconciliation, realtime dedupe |
| `src/lib/repository/OasisRepository.ts` | 필요 시 snapshot/event 계약 보강 |
| `src/lib/supabase/SupabaseOasisRepository.ts` | 표시값 정규화, 원격 이벤트 데이터, 운영 규칙 검증 |
| `src/mocks/MockOasisRepository.ts` | Supabase와 같은 반올림/이벤트 계약 |
| `src/mocks/MockOasisRepository.test.ts` | 확정·취소·다중 멤버·threshold 계약 테스트 |
| `src/types/index.ts` | `OasisStage` 제거/호환, maxDrops/requiredDrops 노출 검토 |
| `src/index.css` | 접근 가능한 색상 token, reduced motion 보강 |
| `README.md` | 75% 경계와 새 경험 설명 수정 |

### 9.2 신규 파일

```text
src/features/oasis/components/OasisProgressHUD.tsx
src/features/oasis/components/OasisDebugPanel.tsx
src/features/oasis/scene/OasisScene.tsx
src/features/oasis/scene/OasisScene.module.css
src/features/oasis/scene/oasisScene.types.ts
src/features/oasis/scene/deriveOasisSceneModel.ts
src/features/oasis/scene/deriveOasisSceneModel.test.ts
src/features/oasis/scene/oasisSceneSequence.ts
src/features/oasis/scene/oasisSceneSequence.test.ts
src/features/oasis/scene/useOasisSceneController.ts
src/features/oasis/scene/layers/SkyLayer.tsx
src/features/oasis/scene/layers/DesertLayer.tsx
src/features/oasis/scene/layers/WaterLayer.tsx
src/features/oasis/scene/layers/VegetationLayer.tsx
src/features/oasis/scene/layers/AnimalLayer.tsx
src/features/oasis/scene/layers/MemberLayer.tsx
src/features/oasis/scene/layers/CelebrationLayer.tsx
src/features/oasis/share/shareOasisResult.ts
```

### 9.3 조건부 백엔드 파일

운영 RPC와 RLS가 저장소 밖에서 관리되고 있으므로 먼저 원본을 확보해야 한다. 차이가 있거나 원격 이벤트 식별 정보가 부족한 경우에만 Supabase migration을 추가한다.

```text
supabase/migrations/<timestamp>_align_oasis_completion_rules.sql
supabase/migrations/<timestamp>_expose_confirmed_oasis_events.sql
```

새 migration은 운영 스키마를 확인하기 전에 추측으로 작성하면 안 된다.

---

## 10. 예상 위험 요소와 회귀 가능성

| 위험 | 영향 | 대응 |
| --- | --- | --- |
| 운영 RPC 소스 부재 | 프론트/Mock과 실제 75/100 판정 불일치 | 0단계에서 DDL/RLS 확보 및 contract test |
| 당일 새 멤버 합류로 `maxDrops` 증가 | 이미 달성한 75%가 다시 미달로 내려갈 수 있음 | snapshot 고정 정책 결정 또는 goal-rebased 이벤트 |
| Supabase/Mock 퍼센트 반올림 차이 | 디버그·테스트와 운영 화면 불일치 | exact/display 분리 및 repository contract 통일 |
| `room_members`/`day_records` 중복 Realtime | 중복 물방울과 중복 celebration | event id, snapshot version, debounce |
| pendingUndo 동안 원격 이벤트 무시 | 여러 친구 기여가 한 번에 점프 | 확정 후 diff aggregate, 향후 event stream |
| 확정/취소 경쟁 상태 | 확정 중 실행 취소가 겹칠 수 있음 | undo window 상태를 pending/confirming으로 분리 |
| 이벤트 queue 누적 | 화면이 실제 상태보다 오래 뒤처짐 | 최대 queue 길이, aggregate, 즉시 catch-up 정책 |
| 새로고침 시 과거 연출 재생 | 반복 축하와 피로 | 초기 hydration은 event를 생성하지 않음 |
| 75와 100을 한 번에 통과 | 두 축하가 길게 중복 | 75 mini-bloom 후 100 단일 최종 announcement |
| 주간 보상과 일일 상태 혼합 | 오늘 진행 상태가 가려짐 | daily layer와 persistent reward layer 분리 |
| SVG 요소/particle 증가 | 저사양 Android 프레임 저하 | node 제한, transform/opacity 위주, 무한 loop 최소화 |
| 작은 화면과 큰 CTA | 핵심 scene/HUD가 첫 화면에서 밀림 | 높이 `clamp`, short viewport variant, 기기 행렬 |
| 큰 글자 | HUD/멤버/BottomSheet overflow | wrapping, TDS text, 160/200% 검증 |
| 색 대비 | 완료 문구 인지와 심사 위험 | adaptive foreground token, 색 외 아이콘/문구 |
| 포털과 z-index | Toast/BottomSheet/축하 효과 겹침 | scene 내부 clipping, TDS overlay 우선, z-index 표 |
| 결과 공유의 개인정보 | roomId로 멤버 정보 노출 가능 | 1차 text-only, 결과 전용 안전 경로 후 링크 |
| HashRouter와 Toss deep link | 공유 링크가 원하는 방으로 이동하지 않음 | 출시/테스트 scheme과 route mapping 실기기 검증 |
| TDS `latest` 선언 | 재설치 시 UI/API 변동 | 구현 시작 전 2.5.0 기준 lockfile 유지 및 업그레이드 분리 |

---

## 11. 테스트 계획

### 11.1 현재 기준선

2026-07-17 기준:

- `npm run lint`: 통과
- `npm test`: 2개 파일, 30개 테스트 통과
- UI 컴포넌트 테스트: 없음
- Zustand store 타이밍 테스트: 없음
- Supabase RPC contract/integration test: 없음
- 브라우저 E2E/시각 회귀 도구: 없음

신규 외부 테스트 라이브러리를 이번 핵심 작업에 추가하지 않는다. 우선 Vitest로 순수 함수, sequence reducer, Mock repository 계약을 최대한 검증하고 실기기 시각/접근성 체크리스트를 병행한다.

### 11.2 규칙 단위 테스트

- 0, 1, 24.99, 25, 49.99, 50, 74.99, 75, 99.99, 100, 100 초과
- 음수 percent, `maxDrops <= 0`
- 1~5명 각각의 모든 `totalDrops`
- `requiredDrops = ceil(maxDrops × 0.75)`
- 75%에서 `isComplete=true`, `isFullComplete=false`
- 100%에서 두 boolean 모두 true
- exact percent와 display percent 분리
- Mock/Supabase mapping의 표시 반올림 일치
- 오늘 성공과 주간 최종 보상의 독립성

### 11.3 Scene model 테스트

- 각 phase의 water/vegetation/animal/lighting 값
- 0% 물 shape 비표시
- 1% 첫 물/새싹 표시
- 75% 공동 성공 장식
- 100% 완벽 성공 장식
- 오늘 0%인데 주간 최종 보상만 있는 상태
- 전원 참여 today와 주간 settled의 구분
- 5명 Member marker 배치와 현재 사용자 표시
- 개인정보 필드가 scene model에 포함되지 않는지 확인

### 11.4 이벤트 diff 및 sequence 테스트

- 로컬 한 물방울
- 원격 한 물방울과 actor 식별
- 참여만 하고 물방울은 0개
- 한 번에 2~4개 물방울
- 24→25, 49→50, 74→75, 99→100
- 한 이벤트에서 75와 100 동시 통과
- 여러 멤버가 동시에 바뀐 aggregate fallback
- `maxDrops`만 증가한 goal-rebased
- 이벤트 중 새 이벤트 유입 및 queue 순서
- queue 초과 aggregate
- 초기 로드는 이벤트를 만들지 않음
- reduced motion에서 즉시 settle

순서는 reducer 상태로 검증한다.

```text
idle
→ source-highlight
→ drop-flight
→ impact
→ water-rise
→ phase-reveal
→ community-success | perfect
→ settled
```

### 11.5 Store 테스트

Vitest fake timer와 Mock repository를 사용한다.

- 클릭 직후 oasisState가 바뀌지 않고 pendingUndo만 생김
- 5초 전 undo 시 집계/이벤트 없음
- 5초 후 confirm 시 semantic event가 최종 state commit 전에 생성됨
- 연속 기록 시 이전 pending 확정 후 새 pending 생성
- confirm 실패/재조회 실패 시 scene이 거짓 성공을 보여주지 않음
- confirming 중 undo 경쟁 처리
- pending 중 원격 변경 후 reconciliation
- 같은 Realtime 변경의 중복 제거
- `dropsContributed=0`이면 scene drop event를 만들지 않음
- store reset/unmount에서 timer와 subscription 정리

### 11.6 Repository contract 테스트

- Mock과 Supabase가 같은 입력에서 같은 `totalDrops/maxDrops/requiredDrops/boolean/displayPercent` 계약을 반환
- 당일 신규 멤버 합류
- eligible 멤버만 분모/참여에 포함
- 한 번 이상의 confirmed log가 참여로 계산됨
- 취소 log는 참여로 계산되지 않음
- 개인 하루 최대 4개
- 100% 이후 개인 기록이 공동 퍼센트를 100 초과시키지 않음
- RPC idempotency와 같은 `logId` 중복 확정 처리

Supabase integration test는 운영 데이터가 아닌 별도 테스트 프로젝트 또는 transaction 가능한 환경에서 실행해야 한다.

### 11.7 수동 시각 회귀 행렬

DebugPanel preset으로 다음을 캡처하고 비교한다.

| 화면 | 확인 상태 |
| --- | --- |
| 320×568 | 0, 1, 24, 25, 50, 74, 75, 99, 100 |
| 360×800 | 동일 |
| 375×812 | 동일 |
| 390×844 | 동일 |
| 430×932 | 동일 |
| 가로 844×390 | 장면 축소, HUD/CTA 겹침 |

각 화면에서 멤버 1명/5명, 긴 8자 닉네임, achievement 문구, Toast, BottomSheet, fixed CTA를 함께 확인한다.

### 11.8 접근성 테스트

- iOS VoiceOver, Android TalkBack
- 100%, 160%, 200% 글자 크기
- 75%와 100% 이벤트당 live announcement가 정확히 한 번인지
- 동적 role img 설명이 현재 정적 상태를 정확히 읽는지
- 색 없이도 75/100/참여/대기 상태를 구분할 수 있는지
- 모든 텍스트 대비 AA 확인
- reduced motion에서 이동/particle/loop가 없고 결과 정보는 동일한지
- BottomSheet focus lock, 뒤로가기, dimmer close
- CTA, 결과 보기, 공유하기의 focus order와 최소 touch target

### 11.9 성능과 안정성

- 저사양 Android WebView에서 4개 물방울 + 100% celebration
- Realtime 이벤트 5개 연속 수신
- background/foreground 복귀 중 confirm
- 느린 네트워크에서 pending → confirming → result
- SVG DOM node 수와 장시간 loop 여부
- scene이 보이지 않는 동안 animation 일시 중지 가능성 검토
- `npm run lint`, `npm test`, `npm run build`를 각 단계의 완료 조건으로 실행

---

## 구현 전 반드시 결정할 제품 질문

1. 당일 새 멤버가 합류해 공동 목표 분모가 커질 때 이미 얻은 75% 성공을 취소할 것인가?
2. 한 컵이 물방울 경계를 넘지 못했을 때 어떤 문구로 “개인 기록은 됐지만 공동 물방울은 아직”을 설명할 것인가?
3. 75% 도달 시 결과 BottomSheet를 자동으로 열 것인가? 권장은 장면을 가리지 않고 사용자가 `결과 보기`를 선택하게 하는 것이다.
4. 100% 공유는 text-only로 먼저 출시할 것인가, 공개 가능한 결과 링크/이미지를 함께 준비할 것인가?
5. 오늘의 특별 캐릭터와 주간 정착 캐릭터를 같은 캐릭터의 상태 변화로 볼 것인가, 별도 보상으로 볼 것인가?

이 다섯 항목 중 1번과 4번은 데이터 모델 및 보안 범위에 영향을 주므로 0단계에서 확정해야 한다.

## 참고한 공식 문서

- [TDS Mobile ProgressBar](https://tossmini-docs.toss.im/tds-mobile/components/progress-bar/)
- [TDS Mobile BottomSheet](https://tossmini-docs.toss.im/tds-mobile/components/bottom-sheet/)
- [TDS Mobile Toast](https://tossmini-docs.toss.im/tds-mobile/components/toast/)
- [AppsInToss 메시지 공유](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/공유/share.md)
- [AppsInToss 토스앱 공유 링크](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/공유/getTossShareLink.md)
