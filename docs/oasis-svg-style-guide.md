# Shared Oasis SVG 스타일 가이드

- 분석 대상: `SharedOasisScene`, `OasisSvgScene`, shared layer 및 tile 컴포넌트
- 목적: 현재 디자인을 유지하면서 개발자와 AI가 작은 SVG 에셋을 일관되게 추가할 수 있는 기준 제공
- 비목표: 현재 장면의 전면 교체, 사실적인 일러스트, 3D·Canvas·WebGL 도입

## 결론

현재 Shared Oasis는 엄밀한 아이소메트릭보다 **약 35~40° 높이에서 내려다보는 부드러운 3/4 top-down 스타일**에 가깝다. 형태는 둥근 Bézier 곡선과 ellipse를 중심으로 만들고, 색은 모래·청록 물·중간 채도의 초록·코랄 포인트로 제한한다.

새 에셋은 독립된 복잡한 일러스트가 아니라 다음 계약을 따르는 작은 타일이어야 한다.

- 장면 전체는 `360 × 320` 좌표계를 유지한다.
- 에셋 내부 `(0, 0)`은 오브젝트가 땅에 닿는 지점이다.
- 오브젝트 본체는 대부분 음수 Y 영역에 그린다.
- 배치는 에셋 내부가 아니라 placement config의 `x`, `y`, `scale`, `flip`, `layer`로 제어한다.
- 작은 에셋은 flat fill 2~3색, 선택적 outline, 단순한 ellipse 그림자로 끝낸다.
- 하나의 에셋에 질감용 path를 많이 추가하지 않는다.

---

## 1. 현재 SVG의 viewBox와 좌표 체계

### 마스터 좌표계

현재 활성 장면의 기준은 다음과 같다.

```text
viewBox: 0 0 360 320
X축: 왼쪽 0 → 오른쪽 360
Y축: 위 0 → 아래 320
연못 중심: (180, 171)
```

주요 영역은 대략 다음 범위에 놓인다.

| 영역 | 기준 좌표 또는 범위 |
| --- | --- |
| 모래섬 | X 20~334, Y 49~298 |
| 연못 | X 66~298, Y 78~250 |
| 깊은 물 | X 102~269, Y 107~226 |
| 돌 테두리 중심 | `(180, 171)` |
| 돌 테두리 배치 반경 | X 122, Y 75 |
| 멤버 칩 | 장면 외곽의 고정 anchor, 최대 5개 |

SVG는 CSS에서 `width: 100%`, `height: auto`로 렌더링되고 장면 컨테이너가 최대 360px로 제한된다. 따라서 새 에셋은 실제 CSS 픽셀이 아니라 viewBox 단위를 기준으로 작성해야 한다.

### 타일 로컬 좌표계

`RockTile`, `PalmTile` 같은 작은 오브젝트는 자체 viewBox를 갖지 않고 부모 SVG 안의 `<g>`로 렌더링된다.

```text
translate(x, y) scale(scaleX, scaleY)
```

타일 좌표 규칙:

- `(0, 0)`은 오브젝트의 지면 접점 또는 그림자 중심이다.
- 세로로 자라는 오브젝트는 위쪽, 즉 음수 Y로 확장한다.
- 좌우 반전은 별도 path를 만들지 않고 `scale(-scale, scale)`을 사용한다.
- 오브젝트 크기는 path 자체를 다시 그리지 않고 placement의 `scale`로 조절한다.
- 현재 일반 배치 scale은 약 `0.66~1.02`다.

이 규칙을 지키면 같은 SVG 타일을 위치·크기·방향만 바꿔 재사용할 수 있다.

### 레이어 좌표와 z-order

현재 장면 순서는 다음과 같다.

```text
모래와 지면 그림자
→ far 타일
→ 물
→ 돌 테두리
→ middle 타일과 연꽃
→ near 타일
→ 물방울·반짝임·완료 효과
→ HTML 멤버 칩과 완료 배지
```

새 에셋은 자체 `z-index`나 임의의 SVG 중첩을 만들지 않고 `far | middle | near` 중 하나를 placement에서 선택한다.

### 레거시 좌표계 주의

`LegacyOasisScene`은 `320 × 240` viewBox의 풍경형 장면이다. 현재 Shared 장면과 시점·중심·비율이 다르므로 새 shared 타일의 좌표 기준으로 혼용하지 않는다.

---

## 2. 사용 중인 주요 색상 팔레트

### 핵심 팔레트

| 역할 | 현재 색상 | 용도 |
| --- | --- | --- |
| Sand base | `#ecd8ae` | 모래섬 기본색 |
| Sand light | `#f7e8c7` | 모래 상단, 빈 웅덩이 |
| Sand dark | `#d9bd88` | 모래 외곽선, 입자, 웅덩이 음영 |
| Stone base | `#d5c7a8` | 돌 본체 |
| Stone light | `#ebe1cc` | 돌 밝은 면 |
| Stone dark | `#ad9e80` | 돌 외곽선 |
| Water base | `#72d4d0` | 물 기본색 |
| Water deep | `#35aaa9` | 깊은 물, 물방울 |
| Water light | `#c8f2e9` | 물 상단과 highlight |
| Ripple | `#e5fff8` | 잔물결 |
| Trunk | `#9b6b3e` | 야자수 줄기 |
| Trunk light | `#bd8750` | 줄기 highlight |
| Stem | `#5d9559` | 꽃과 새싹 줄기 |
| Leaf base | `#5fa65b` | 기본 잎 |
| Leaf dark | `#377e4a` | 깊이감 있는 잎 |
| Leaf light | `#8bc772` | 밝은 잎 |
| Coral | `#ef7f84` | 꽃과 연꽃 기본색 |
| Coral light | `#ffadb0` | 밝은 꽃잎 |
| Coral dark | `#d8586d` | 꽃 외곽과 어두운 꽃잎 |
| Apricot | `#f7bf62` | 꽃술과 작은 강조 |
| Gold | `#dca82f` | 100% 완료 효과 |
| Gold light | `#ffe59a` | 100% 반짝임 |

### 현재 남아 있는 보조 하드코딩 색상

아래 색은 기존 스타일과 맞지만 공통 팔레트에서 빠져 있다. 새 에셋을 늘리기 전에 토큰으로 승격하는 편이 좋다.

- 선인장: `#65a96a`, `#4f8958`
- 수련잎: `#5da868`, `#3e8753`, `#b7df9b`
- 관목 highlight: `#d9ef9b`
- 나무다리: `#8a5b34`, `#b97d43`, `#c98d4c`, `#8b5f37`, `#744b2e`
- 연꽃 받침: `#4c9c62`, `#71b778`
- 흰 꽃과 노란 꽃: `#fff6ea`, `#ffd66b`
- 공동 성공 효과: `#8fd7a0`, `#e8ffd5`, `#a9d997`

### 팔레트 사용 규칙

- 한 에셋의 본체 색은 보통 2~3개만 사용한다.
- 새 초록색을 임의로 만들기보다 `leaf dark/base/light`를 우선 조합한다.
- 분홍·노랑은 장면의 포인트이므로 작은 면적에만 쓴다.
- 75%는 녹색 계열, 100%는 금색 계열이라는 상태 의미를 다른 오브젝트 색보다 우선한다.
- 검정 외곽선은 사용하지 않는다. 가장 어두운 외곽선도 주변 색의 저채도·저명도 변형을 쓴다.

---

## 3. 외곽선 유무와 선 굵기

현재 스타일은 모든 형태에 outline을 두르는 방식이 아니다. 재질과 크기에 따라 선택적으로 사용한다.

### 외곽선이 있는 요소

| 요소 | 일반 선 굵기 |
| --- | --- |
| 돌, 수련잎, 다리 판자 | `1` |
| 선인장 | `1.2` |
| 모래섬, 연꽃 봉오리 | `1.5` |
| 꽃·다리 보조선 | `1.8~2` |
| 빈 웅덩이 | `2` |
| 물 highlight | `2.4` |
| 물방울 impact | `2.2` |

### 외곽선이 없는 요소

- 관목의 원형 잎
- 야자수 잎
- 꽃잎과 꽃술
- 깊은 물 영역
- 대부분의 그림자
- 완료 반짝임

### 굵은 선을 형태로 사용하는 요소

야자수와 새싹 줄기는 채워진 면 대신 round stroke를 본체로 사용한다.

- 야자수 줄기: `7`
- 새싹 줄기: `2.4`
- 작은 꽃 줄기: `1.8`

### 일관성 규칙

- 작은 타일의 일반 outline은 `1~1.5`를 기본으로 한다.
- 내부 highlight는 outline보다 같거나 약간 굵은 `1.5~2.5`를 사용할 수 있다.
- `strokeLinecap="round"`를 기본으로 한다.
- outline을 추가할 때 순수 검정, 날카로운 miter join, 3px 이상의 균일 테두리는 피한다.
- 굵은 stroke는 줄기·광선처럼 그 선 자체가 형태인 경우에만 사용한다.

---

## 4. 그림자, 투명도, 그라데이션 사용 방식

### 그림자

그림자는 두 단계로 제한되어 있다.

1. 모래섬 전체 그림자
   - 넓은 ellipse
   - 갈색 계열 약 16% 투명도
   - `feGaussianBlur stdDeviation="9"`
2. 작은 타일의 접지 그림자
   - 오브젝트 아래의 납작한 ellipse
   - 갈색 또는 녹갈색 약 12~17% 투명도
   - blur 없이 사용

새 타일의 그림자 규칙:

- 타일 그림자는 1개의 ellipse로 충분하다.
- 그림자 폭은 오브젝트 밑동 폭의 약 `70~110%`로 둔다.
- 그림자 높이는 폭의 약 `25~40%`로 납작하게 만든다.
- blur filter를 작은 에셋마다 만들지 않는다.
- 강한 검정 drop shadow나 다중 그림자는 사용하지 않는다.

### 투명도

현재 주요 투명도 범위:

- 접지 그림자: `.12~.17`
- 모래 입자: `.33`
- 빈 웅덩이 음영: `.48`
- 깊은 물: `.16~.36`
- 물 highlight와 ripple: `.72`
- 연꽃 잎: `.88`
- 애니메이션 효과: `0 → .9 → 0`

고정 오브젝트 본체는 가능한 한 불투명하게 유지하고, 깊이·반사·효과에만 opacity를 사용한다.

### 그라데이션

현재 그라데이션은 큰 면에만 사용한다.

- 모래: 밝은 모래에서 기본 모래로 가는 2-stop linear gradient
- 물: 밝은 물 → 기본 물 → 깊은 물의 3-stop linear gradient
- 공동 성공 glow: 중심에서 바깥으로 사라지는 radial gradient

새 작은 타일에는 특별한 이유가 없으면 그라데이션을 추가하지 않는다. 작은 잎이나 돌은 flat fill과 highlight 한 줄로 충분하다.

### filter 사용

- 활성 shared 장면의 filter는 섬 전체 그림자용 blur 하나뿐이다.
- 새 타일마다 filter ID를 생성하면 DOM과 렌더링 비용이 증가하므로 금지한다.
- 반짝임, bloom, ripple은 filter보다 opacity와 transform 애니메이션을 우선한다.

---

## 5. 식물, 돌, 물, 모래의 형태적 특징

### 식물

공통 특징:

- 줄기는 직선보다 `Q` 곡선으로 약간 휘게 만든다.
- 잎은 ellipse 또는 짧은 폐곡선 Bézier로 만든다.
- 한 식물은 어두운 잎·기본 잎·밝은 잎의 최대 3단계만 쓴다.
- 좌우가 완벽히 대칭되지 않게 회전과 크기를 조금씩 다르게 한다.
- 잎맥과 표면 질감은 생략하거나 1개 선으로 제한한다.

오브젝트별 특징:

- 새싹: 줄기 1개와 ellipse 잎 2개
- 관목: 크기가 다른 원 3개와 작은 highlight 1개
- 야자수: 굵은 곡선 줄기, 방사형 잎 6개, 중심 열매 1개
- 꽃: 줄기 1개, 네 잎 원형 꽃 3개
- 선인장: 하나의 폐곡선 path로 몸통과 가지를 함께 표현
- 연꽃: ellipse 받침과 봉오리 또는 반복 회전한 꽃잎

### 돌

- 완벽한 원이나 사각형 대신 둥근 비대칭 폐곡선을 사용한다.
- 본체 아래에 납작한 그림자 ellipse를 둔다.
- dark outline `1px`과 짧은 밝은 highlight를 사용한다.
- 개별 바위는 약 `26 × 18` 단위가 기본 크기다.
- 연못 테두리 돌은 `26 × 14`, radius `6`의 rounded rect를 타원 궤도에 반복 배치한다.

### 물

- 완전한 ellipse가 아니라 비대칭 cubic Bézier 폐곡선이다.
- 큰 물 형태, 축소된 highlight outline, 깊은 물 path의 3층 구조다.
- 수위 변화는 새 path 교체가 아니라 중심 `(180, 171)` 기준 scale로 표현한다.
- 잔물결은 짧은 `Q` 곡선 2~3개로 제한한다.
- 물 표면에 작은 점·노이즈·복잡한 파동 패턴을 채우지 않는다.

### 모래

- 섬은 둥글지만 좌우가 완전히 대칭되지 않은 큰 폐곡선이다.
- 2색 gradient와 `1.5px` 외곽선으로 입체감을 만든다.
- 질감은 반투명 원 7개 정도로만 암시한다.
- 측면 절벽이나 다층 지형을 추가하지 않고 얕은 top surface로 유지한다.

---

## 6. top-down 시점의 각도와 오브젝트 비율

### 시점

연못 돌 테두리의 X/Y 반경은 `122/75`로 세로가 가로의 약 `61%`다. 이를 원형 지면의 투영으로 보면 카메라는 대략 다음 범위다.

```text
지면 기준 올려다본 카메라 각도: 약 35~40°
수직 top-down 축 기준 기울기: 약 50~55°
```

다만 현재 장면은 엄밀한 투영법을 사용하지 않는다.

- 지면과 물은 눌린 타원 형태다.
- 나무와 선인장은 화면 위쪽으로 곧게 자란다.
- 오브젝트에 원근 축소를 자동 계산하지 않고 placement scale로 조정한다.
- 소실점이나 평행 투영 그리드는 사용하지 않는다.

따라서 새 에셋도 수학적으로 정확한 isometric보다 **읽기 쉬운 3/4 top-down 아이콘**을 목표로 한다.

### 현재 오브젝트 비율

| 오브젝트 | 로컬 기준 대략 크기 | 장면 내 역할 |
| --- | --- | --- |
| 바위 | 26 × 18 | 작은 지면 장식 |
| 선인장 | 24 × 32 | 중간 높이 식물 |
| 새싹 | 20 × 22 | 가장 작은 성장 요소 |
| 관목 | 30 × 22 | 낮고 넓은 식생 |
| 꽃 군집 | 20 × 20 | 작은 색상 포인트 |
| 야자수 | 58 × 62 | 주요 수직 landmark |
| 수련잎 | 22 × 12 | 수면 장식 |
| 나무다리 | 54 × 25 | 중간 크기 구조물 |
| 연꽃 | 52 × 30 내외 | 중앙 보상 오브젝트 |

### 비율 규칙

- 야자수보다 큰 일반 타일을 새로 만들지 않는다.
- 낮은 식생은 야자수 높이의 `25~45%`로 유지한다.
- 꽃과 열매 포인트는 야자수 잎 폭의 `10~20%` 수준으로 제한한다.
- near 레이어는 far 레이어보다 placement scale을 약 `10~20%` 크게 할 수 있다.
- 새 오브젝트가 연못 중심의 연꽃보다 강한 시각적 중심이 되지 않게 한다.

---

## 7. 새 SVG를 만들 때 지켜야 할 일관성 규칙

### 필수 규칙

1. 장면의 `360 × 320` viewBox를 변경하지 않는다.
2. 타일의 `(0, 0)`을 지면 접점으로 잡는다.
3. 위치·크기·반전·레이어는 placement config에서 관리한다.
4. 한 타일은 flat fill 2~3색과 선택적 outline만 사용한다.
5. 곡선은 `Q` 또는 짧은 `C`를 사용하고 각진 polygon 남용을 피한다.
6. outline은 검정이 아니라 재질의 어두운 색을 사용한다.
7. 그림자는 납작한 ellipse 하나로 표현한다.
8. 작은 타일에 gradient, filter, mask, clipPath를 추가하지 않는다.
9. 텍스트와 의미 있는 UI는 SVG path로 변환하지 않는다.
10. DOM 순서가 곧 z-order이므로 타일 내부 요소 순서를 `그림자 → 본체 → highlight`로 유지한다.

### AI 생성 에셋 정리 규칙

AI가 만든 SVG 초안은 그대로 사용하지 않고 다음을 정리한다.

- 불필요한 `<metadata>`, `<title>`, `<desc>`, generator 속성 제거
- inline `style`을 `fill`, `stroke`, `strokeWidth` 속성으로 정리
- 비슷한 색을 핵심 토큰으로 통합
- 과도한 decimal은 소수점 1~2자리로 축소
- 중복 path와 보이지 않는 레이어 제거
- transform을 타일 최상위 `<g>` 위주로 단순화
- 모든 path를 하나로 합치지 말고 의미 단위로 유지
- 자체 viewBox 좌표를 로컬 지면 원점 규칙에 맞게 이동

### React + Vite 관리 구조

에셋 수가 늘면 파일 하나당 오브젝트 하나로 지나치게 잘게 나누기보다 카테고리 단위로 관리한다.

```text
scene/shared/
├─ tiles/
│  ├─ plants.tsx
│  ├─ terrain.tsx
│  ├─ waterDecor.tsx
│  └─ structures.tsx
├─ layers/
├─ sharedOasisSceneConfig.ts
└─ OasisSvgScene.module.css
```

- 에셋 컴포넌트는 `x`, `y`, `scale`, `flip` 계약을 공유한다.
- 배치 정보는 에셋 JSX와 분리한다.
- 색상은 CSS 변수 또는 공통 토큰만 참조한다.
- 애니메이션은 타일 내부가 아니라 layer wrapper의 CSS class에서 적용한다.
- 에셋 컴포넌트에 달성률이나 멤버 상태 같은 비즈니스 로직을 넣지 않는다.

---

## 8. CSS 변수로 분리할 색상 토큰

현재 TypeScript 색상 상수와 JSX 하드코딩 색상을 다음 semantic token으로 통합하는 것을 권장한다.

### 지형과 물

```css
--oasis-svg-sand: #ecd8ae;
--oasis-svg-sand-highlight: #f7e8c7;
--oasis-svg-sand-edge: #d9bd88;

--oasis-svg-stone: #d5c7a8;
--oasis-svg-stone-highlight: #ebe1cc;
--oasis-svg-stone-edge: #ad9e80;

--oasis-svg-water: #72d4d0;
--oasis-svg-water-deep: #35aaa9;
--oasis-svg-water-highlight: #c8f2e9;
--oasis-svg-water-ripple: #e5fff8;
```

### 식생과 나무

```css
--oasis-svg-trunk: #9b6b3e;
--oasis-svg-trunk-highlight: #bd8750;
--oasis-svg-wood-dark: #744b2e;
--oasis-svg-wood: #b97d43;
--oasis-svg-wood-light: #c98d4c;

--oasis-svg-stem: #5d9559;
--oasis-svg-leaf-dark: #377e4a;
--oasis-svg-leaf: #5fa65b;
--oasis-svg-leaf-light: #8bc772;
--oasis-svg-leaf-highlight: #d9ef9b;
```

### 꽃과 성공 상태

```css
--oasis-svg-coral-dark: #d8586d;
--oasis-svg-coral: #ef7f84;
--oasis-svg-coral-light: #ffadb0;
--oasis-svg-flower-yellow: #ffd66b;
--oasis-svg-flower-white: #fff6ea;
--oasis-svg-flower-center: #f7bf62;

--oasis-svg-success: #299f78;
--oasis-svg-success-effect: #8fd7a0;
--oasis-svg-perfect: #dca82f;
--oasis-svg-perfect-light: #ffe59a;
```

### 그림자와 효과

```css
--oasis-svg-shadow-ground: rgba(86, 65, 34, 0.16);
--oasis-svg-shadow-stone: rgba(95, 75, 45, 0.16);
--oasis-svg-shadow-plant: rgba(58, 78, 40, 0.14);
--oasis-svg-impact: #ffffff;
--oasis-svg-success-glow-center: rgba(232, 255, 213, 0.3);
--oasis-svg-success-glow-edge: rgba(169, 217, 151, 0);
```

토큰은 전역 제품 색과 구분하기 위해 `--oasis-svg-` prefix를 사용한다. 멤버 칩처럼 HTML UI에 쓰는 색은 장면 재질 토큰과 섞지 않는다.

---

## 9. 개별 SVG 에셋에 권장되는 path 개수와 파일 크기

### 복잡도 예산

현재 타일은 path뿐 아니라 ellipse, circle, rect 같은 기본 도형을 적극적으로 사용한다. 품질 기준은 총 path 수보다 **총 SVG 노드 수와 형태의 읽기 쉬움**에 둔다.

| 에셋 종류 | 권장 path 수 | 권장 총 도형 수 |
| --- | --- | --- |
| 돌, 수련잎, 새싹 | `1~3` | `2~5` |
| 선인장, 관목, 꽃 군집 | `1~4` | `3~12` |
| 야자수, 작은 구조물 | `4~8` | `8~16` |
| 중앙 연꽃 같은 보상 에셋 | 최대 `10` | 최대 `18` |

원칙:

- 대부분의 에셋은 path `6개 이하`를 목표로 한다.
- 특별 보상 에셋도 path `10개`, 전체 노드 `18개`를 넘기지 않는다.
- 반복 꽃잎은 같은 ellipse를 회전해 재사용한다.
- 다리 판자는 path로 변환하지 않고 rounded rect 반복을 사용한다.
- 보이지 않는 디테일을 위해 path를 늘리지 않는다.

### 파일 크기 예산

standalone SVG로 저장할 경우의 권장 기준:

| 에셋 | 권장 원본 크기 |
| --- | --- |
| 단순 타일 | `0.5~2KB` |
| 야자수·꽃 군집·다리 | `2~3KB` |
| 중앙 보상 오브젝트 | 최대 `5KB` |

TSX 컴포넌트로 관리할 경우 주석과 타입을 제외한 실제 SVG markup이 위 크기와 비슷해야 한다. 한 카테고리 파일은 가독성을 위해 약 `250~350줄`을 넘기기 전에 분리한다.

다음 결과는 사용하지 않는다.

- 단일 에셋이 10KB 이상인 AI 생성 SVG
- 수백 개 좌표를 가진 자동 trace path
- 작은 색 차이만 있는 수십 개 path
- base64 이미지가 포함된 SVG
- 외부 폰트·필터·mask에 의존하는 SVG

---

## 10. 기존 SharedOasisScene에서 재사용 가능한 요소

### 그대로 재사용할 기반

| 요소 | 재사용 방법 |
| --- | --- |
| `SHARED_OASIS_VIEW_BOX` | 모든 shared 장면의 마스터 좌표계로 유지 |
| `SHARED_OASIS_GEOMETRY` | 연못 중심과 scale transform 기준으로 유지 |
| `SHARED_OASIS_PATHS.sand` | 모래섬 기본 실루엣으로 유지 |
| `SHARED_OASIS_PATHS.pond` | 수위 변화의 공통 물 실루엣으로 유지 |
| `SHARED_OASIS_PATHS.deepWater` | 50% 이후 깊은 물 표현으로 유지 |
| `TileGroup` 패턴 | 모든 작은 타일의 위치·scale·flip adapter로 사용 |
| `OASIS_TILE_PLACEMENTS` | 그래픽과 배치 데이터를 분리하는 기준으로 사용 |
| `far/middle/near` | 새 타일의 z-order 분류로 유지 |
| `BasinRimLayer`의 반복 배치 | 돌 하나를 궤도에 반복하는 재사용 사례로 유지 |
| `PondLayer`의 ripple path | 물 표면의 기본 장식으로 재사용 |
| `SceneEffectsLayer`의 `Sparkle` | 100% 효과의 제한된 파티클 primitive로 재사용 |
| 물방울 motion path | 멤버 anchor에서 연못 중심까지의 기여 애니메이션에 유지 |
| `.tileReveal` | 새 식생과 장식의 공통 등장 애니메이션으로 유지 |
| reduced motion 처리 | 새 SVG 애니메이션에도 동일하게 적용 |

### 현재 타일에서 직접 재사용 가능한 요소

- `RockTile`: 독립 바위와 돌 군집의 기본 단위
- `CactusTile`: 좌우 반전 가능한 건조 식생
- `SproutTile`: 1~24% 초기 성장 요소
- `PalmTile`과 `PalmLeaf`: 크기·방향만 바꿔 주요 식생으로 반복
- `ShrubTile`: 낮은 배경 식생
- `FlowerTile`과 내부 `Flower`: 색상 포인트 군집
- `LilyTile`: 연못 표면 장식
- `BridgeTile`: 구조물의 복잡도 상한 사례
- `Lotus`: 75% 봉오리와 100% 개화 상태의 공통 보상 에셋

### 재사용 시 주의할 요소

- `EdgeLifeLayer`는 현재 `OasisSvgScene` 렌더 순서에 포함되지 않는다. 활성 스타일의 필수 레이어가 아니라 이전 형태의 참고 구현으로 취급한다.
- `LegacyOasisScene`, `ConceptATerrarium`, `ConceptBWatercolor`는 viewBox와 시각 언어가 다르므로 shared 타일에 직접 섞지 않는다.
- HTML 완료 배지와 멤버 칩은 SVG 에셋 시스템이 아니다. 색상 의미는 참고하되 SVG path로 변환하지 않는다.

---

## 새 에셋 검수 체크리스트

- [ ] 로컬 `(0, 0)`이 지면 접점인가?
- [ ] `x`, `y`, `scale`, `flip`만으로 재배치할 수 있는가?
- [ ] 기존 360 × 320 장면에서 `0.66~1.02` scale로 읽히는가?
- [ ] 색상이 공통 토큰 안에서 해결되는가?
- [ ] 검정 outline이나 강한 drop shadow가 없는가?
- [ ] 그림자가 ellipse 1개 이하인가?
- [ ] path가 일반 에셋 6개, 보상 에셋 10개 이하인가?
- [ ] 전체 SVG 노드가 18개 이하인가?
- [ ] gradient·filter·mask 없이도 형태가 읽히는가?
- [ ] far/middle/near 중 어느 레이어에 들어갈지 명확한가?
- [ ] 320px 이하 모바일 화면에서도 디테일이 뭉개지지 않는가?
- [ ] reduced motion에서 정적인 최종 형태가 자연스러운가?
