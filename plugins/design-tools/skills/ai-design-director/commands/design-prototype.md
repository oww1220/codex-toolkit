---
name: design-prototype
description: 확정된 디자인 시스템(design/TOKENS.json·DESIGN.md·COMPONENTS.md)으로 한 장의 예쁜 화면이 아니라 실제로 작동하는 제품 흐름을 목업한다. 최소 1개 핵심 작업을 처음부터 끝까지(목록→검색→상세→수정→저장→성공) 구현하고, 화면 상태 12종·반응형 3종·더미 데이터를 채운 뒤 스크린샷까지 뽑는다. 트리거 — "목업 만들어줘", "프로토타입", "화면 구현", "design prototype", "/design-prototype".
allowed-tools: Read, Write, Edit, Bash
---

# /design-prototype — 작동하는 제품 흐름 목업

9단계 파이프라인의 **7단계**. `/design-system`(디자인 시스템 확정)이 끝났고, `/design-audit`(검증) 직전.

> **이 단계의 한 줄 정체성**
> 한 장의 예쁜 화면을 만드는 단계가 아니다. **사용자가 실제로 일을 끝낼 수 있는가**를 검증하는
> 단계다. 핵심 작업 하나를 *처음부터 끝까지* — 목록을 열고, 찾고, 들어가고, 고치고, 저장하고,
> 성공을 확인하기까지 — 막힘 없이 흐르는지를 클릭 가능한 목업으로 증명한다.

이 단계는 6대 설계 원칙 중 **①생성보다 판단**과 **⑥모든 결정엔 이유**의 종착점이다. 앞 단계들이
만든 토큰·컴포넌트·UX 패턴이 **실제 흐름에서 작동하는지**를 처음으로 픽셀과 인터랙션으로 확인한다.
여기서 어색하면 시스템으로 되돌아간다.

---

## 0. 목적

| | |
|---|---|
| **입력** | `design/TOKENS.json`, `design/DESIGN.md`, `design/COMPONENTS.md` (필수 3종) + `design/UX-PATTERNS.md`, `design/CONTENT-STYLE.md`, `design/MOTION.md`, `design/ACCESSIBILITY.md`, `design/ANTI-PATTERNS.md` (있으면 모두) |
| **참조** | `references/quality-gates.md`(7대 게이트), `references/anti-patterns.md`(AI 안티패턴 20) |
| **산출** | 실행 가능한 프런트엔드 목업 + 실행 방법 문서 + 화면 목록 + 핵심 흐름 문서 + 스크린샷 |
| **다음** | `/design-audit` (이 목업을 브라우저로 열어 7영역 점수화 + 개선 루프) |

**핵심 원칙(절대):** 색·간격·폰트·모서리·그림자는 **`design/TOKENS.json` 에서만** 가져온다. 임의 값
금지. 컴포넌트는 `design/COMPONENTS.md` 의 정의를 따른다. 토큰에 없는 값이 꼭 필요하면 만들지 말고
**멈추고** `design/DECISION-LOG.md` 에 이유를 적은 뒤 진행한다(CONTRACT §16).

---

## 1. 입력 확인 (없으면 멈춘다)

1. 필수 3종을 **Read** 한다:
   - `design/TOKENS.json` — 색/타이포/간격/모서리/그림자/모션/breakpoint/zIndex 의 **단일 출처**.
   - `design/DESIGN.md` — 디자인 철학·원칙. "왜 이렇게 생겼는가"의 근거.
   - `design/COMPONENTS.md` — 버튼/입력/카드/테이블/모달/배지 등 컴포넌트 규약과 상태 정의.
2. 하나라도 없으면 멈추고 안내한다:
   > *"디자인 시스템이 아직 없습니다. 목업은 확정된 토큰·컴포넌트 위에서만 만듭니다.
   > 먼저 `/design-system` 을 돌려 `design/TOKENS.json`·`design/DESIGN.md`·`design/COMPONENTS.md` 를
   > 만들어 주세요."*
   - 임의 색·폰트로 빈 시스템을 **지어내지 않는다**. 그것이 이 스킬이 막으려는 회귀다.
3. 있으면 보조 문서도 가능한 만큼 Read 한다:
   - `design/UX-PATTERNS.md` — 내비게이션/목록/필터/상세/폼/빈·오류 상태의 패턴 규약.
   - `design/CONTENT-STYLE.md` — 라벨·버튼 문구·에러 메시지 문장 톤(더미 데이터·UI 문구의 기준).
   - `design/MOTION.md` / `design/ACCESSIBILITY.md` / `design/ANTI-PATTERNS.md`.
4. 제품 유형과 핵심 작업을 확인한다. `design/DESIGN-BRIEF.md`·`design/DESIGN-DIRECTION.md` 가
   있으면 거기서 추출하고, 없으면 토큰/컴포넌트 문서의 맥락에서 추론한다.

> 토큰을 Read 한 뒤에는 **그 값들을 그대로 CSS Variables 로 옮긴다**(2.2 참조). 목업 안에서 색·간격을
> 새로 정하지 않는다 — "임의 색상 금지"는 이 스킬의 Hard Gate 다.

---

## 2. 구현 범위 — "예쁜 화면" 아니라 "끝나는 작업"

### 2.1 핵심 흐름 1개 = 처음부터 끝까지

최소 **1개 핵심 작업**을 전 구간 구현한다. 중간에서 끊기면 실패다. 제품 유형별 대표 흐름(예):

| 제품 유형 | 핵심 흐름(처음 → 끝) |
|-----------|----------------------|
| crm / admin | 고객 목록 → 검색·필터 → 상세 → 수정 → 저장 → 성공 메시지 |
| content | 홈 → 검색·분류 → 글 상세(읽기) → 저장/태그 → 확인 |
| commerce | 상품 목록 → 필터 → 상세 → 장바구니 담기 → 주문 확인 |
| mobile | 홈 → 기능 진입 → 상세 → 동작 수행 → 결과 확인 |

각 단계 전환이 **클릭 한 번으로** 다음으로 이어져야 한다. "저장" 버튼이 누르면 아무 일도 안 일어나는
정적 화면은 흐름이 아니다(안티패턴 #15: 실제 상태 없는 정적 예시 화면).

### 2.2 구현 우선순위 (위에서부터, 시간이 모자라면 아래를 버린다)

1. **핵심 흐름** — 위 1개 작업의 전 구간(이게 0순위, 없으면 이 단계 실패).
2. **주요 데이터 화면** — 목록/테이블/상세 등 사용자가 가장 오래 머무는 화면.
3. **생성·편집 화면** — 폼, 모달, 인라인 편집.
4. **오류·빈 상태** — Empty / Error / Validation Error / Permission Denied.
5. **모바일 재배치** — 단순 축소가 아니라 우선순위 재배열(안티패턴 #14).
6. **부가 화면** — 설정·도움말 등 흐름의 가지.

### 2.3 화면 상태 12종 (핵심 컴포넌트에 구현)

CONTRACT 가 정한 필수 상태. 모든 화면에 12종을 다 넣을 필요는 없지만, **핵심 인터랙션 컴포넌트**
(목록 행/입력 필드/버튼/제출 폼)는 해당하는 상태를 실제로 보여줘야 한다.

| # | 상태 | 무엇을 보이는가 |
|---|------|-----------------|
| 1 | Default | 평상시 |
| 2 | Hover | 포인터 올렸을 때 |
| 3 | Focus | 키보드 포커스 — **링이 반드시 보임**(접근성) |
| 4 | Active | 누르는 순간 |
| 5 | Selected | 선택된 행/항목 |
| 6 | Disabled | 비활성(이유가 읽혀야 함) |
| 7 | Loading | 저장·조회 중(스켈레톤/스피너, 토큰의 motion 사용) |
| 8 | Empty | 데이터 0건 — 다음 행동 유도(빈 화면에 안내·CTA) |
| 9 | Error | 조회/저장 실패 — 복구 경로 제시 |
| 10 | Success | 저장 성공 — 명확한 피드백(흐름의 끝) |
| 11 | Validation Error | 입력값 오류 — 어느 필드가 왜 틀렸는지, 색만으로 표시 X(접근성) |
| 12 | Permission Denied | 권한 없음 — 막다른 길 대신 설명·대안 |

> 상태는 **장식이 아니라 진실**이다. "실제 상태 없는 정적 예시 화면"(안티패턴 #15)을 피하려면
> Loading→Success, Validation Error→수정→저장이 실제로 토글되게 만든다.

### 2.4 반응형 3종

| 뷰포트 | 폭(토큰 breakpoint) | 요구 |
|--------|---------------------|------|
| Desktop | > 1024 | 기준 레이아웃 |
| Tablet | 640–1024 | 사이드바 접힘/2열→1열 등 재배치 |
| Mobile | < 640 | **재배치**(우선순위 재배열). 단순 축소·텍스트/버튼 잘림 금지. 터치 영역 ≥ 44px |

breakpoint 값은 `design/TOKENS.json` 의 `breakpoint` 토큰을 쓴다(직접 px 박지 않음).

---

## 3. 더미 데이터 — 제품 특성에 맞게, 진짜처럼

목업의 신뢰도는 데이터에서 갈린다. 회귀 신호를 피한다:

- **금지**: "고객 1 / 고객 2 / 고객 3" 같은 placeholder 나열, `Lorem ipsum`, 가짜 통계 수치
  (99% / 10x / 100% — 안티패턴 #16).
- **권장**: 제품 도메인에 맞는 그럴듯한 이름·금액·날짜·상태값. CRM이면 실제 소상공인 거래처처럼,
  콘텐츠면 실제 글 제목처럼. 단, **실존 인물/상표/고유 카피를 복제하지 않는다**(CONTRACT §18).
- 데이터는 **여러 상태**를 담는다: 정상 행 + 경고 상태 행 + 빈 값 + 긴 텍스트(말줄임 확인) + 0건 케이스.
- 문구 톤은 `design/CONTENT-STYLE.md` 를 따른다(라벨·버튼·에러 메시지 문장).
- 데이터는 코드에 흩지 말고 `src/data/` 같은 한 곳(JSON/TS)에 모아 화면들이 공유하게 한다.

---

## 4. 프레임워크 선택 — 사용자 프로젝트 스택을 따른다

목업은 **사용자 프로젝트가 이미 쓰는 스택**에 맞춘다. 새 스택을 강요하지 않는다.

1. 프로젝트 루트를 살펴 스택을 감지한다(`package.json` 의 의존성, 기존 `app/`·`src/` 구조).
   - Next.js / Vite+React / SvelteKit / 정적 HTML 등.
2. 스택이 모호하거나 신규 프로젝트면 **MVP 기본값**(CONTRACT §19): **CSS Variables + Tailwind**,
   필요 시 shadcn 스타일 컴포넌트. 토큰은 CSS Variables 로 주입한다(아래).
3. 어떤 스택이든 **토큰을 CSS Variables 로 노출**하는 레이어를 둔다. 컴포넌트는 raw 값이 아니라
   변수를 참조한다:
   ```css
   /* design/TOKENS.json → :root 변수 (값은 TOKENS.json 에서 그대로 복사) */
   :root {
     --color-bg-base: <TOKENS.color.background.base>;
     --color-surface-default: <TOKENS.color.surface.default>;
     --color-text-primary: <TOKENS.color.text.primary>;
     --color-border-default: <TOKENS.color.border.default>;
     --color-accent-default: <TOKENS.color.accent.default>;
     --radius-md: <TOKENS.radius.md>;
     --space-4: <TOKENS.spacing.4>;
     /* … 필요한 토큰만, 전부 TOKENS.json 에서 복사 */
   }
   ```
   > 위 `<…>` 는 자리표시다. **실제 값은 `design/TOKENS.json` 을 Read 해서 그대로** 넣는다.
   > 여기서 색을 새로 고르지 않는다. Tailwind 를 쓴다면 `tailwind.config` 의 theme 를 이 변수로 매핑한다.

목업 위치(권장): 사용자 프로젝트 안의 별도 폴더(예: `prototype/` 또는 기존 앱 라우트). 산출 경로는
프로젝트 구조에 맞추되, **실행 방법·화면 목록·흐름 문서**(아래 6)는 반드시 남긴다.

---

## 5. 자가 게이트 — 작성하면서 계속 본다

`references/quality-gates.md` 의 7대 게이트를 **구현 중에** 자가 점검한다(완성 후가 아니라).

| Gate | 핵심 질문 |
|------|-----------|
| 1 Product Fit | 화면이 제품 목적을 돕나? 마케팅 패턴을 업무 도구에 끼우지 않았나? |
| 2 Reference Fit | 선택 레퍼런스의 *원칙*을 반영했나(외형 흉내·복제 X)? |
| 3 System Consistency | **모든 값이 `design/TOKENS.json` 에서 왔나?** 같은 컴포넌트가 화면마다 동일한가? |
| 4 Anti-Generic | 근거 없는 보라/파랑 그라데이션·카드 남발·거대 헤드라인·장식 우선 없음? |
| 5 Usability | 다음 행동이 예측되나? 핵심 기능을 쉽게 찾나? 오류에서 복구되나? |
| 6 Responsive | 모바일이 **재배치**인가(축소 X)? 텍스트/버튼 안 잘림? 터치 ≥ 44px? |
| 7 Accessibility | 색에만 의존한 상태 X? 포커스 링 보임? 입력 레이블? 대비 충분? `prefers-reduced-motion` 고려? |

특히 **Gate 3·4·7** 은 이 단계에서 가장 자주 깨진다. AI 안티패턴 20(`references/anti-patterns.md`)
중 이 단계의 단골: #2 모든 콘텐츠 카드화, #3 반복 3열 카드 그리드, #15 상태 없는 정적 화면,
#16 의미 없는 통계, #17 흐름 없이 카드만 배치한 대시보드.

> **안티패턴 적용 원칙(CONTRACT §7):** 특정 요소를 절대 금지하지 않는다. "이 요소가 제품 목적이나
> 사용자 행동을 어떻게 돕는가?"에 답하지 못하면 쓰지 않는다.

---

## 6. 산출 문서 작성

목업 코드 외에 아래 3종을 남긴다(사람이 읽고 다음 단계가 입력으로 쓴다).

### (1) 실행 방법 — 목업 폴더의 `README.md`
```markdown
# 프로토타입 실행
## 설치 & 구동
npm install
npm run dev        # → http://localhost:5173  (스택에 맞춰 실제 명령/포트 기재)
## 핵심 흐름
- 시작 화면: <경로/라우트>
- 흐름: 목록 → 검색 → 상세 → 수정 → 저장 → 성공
```

### (2) 화면 목록 — `SCREENS.md`
구현한 화면과 각 화면이 보여주는 상태를 표로 남긴다.
```markdown
| 화면 | 라우트 | 구현 상태(12종 중) | 반응형 | 우선순위 |
|------|--------|--------------------|--------|----------|
| 고객 목록 | /customers | Default/Loading/Empty/Selected | D/T/M | 1 핵심 |
| 고객 상세 | /customers/:id | Default/Error/PermissionDenied | D/T/M | 1 핵심 |
| 고객 수정 | /customers/:id/edit | Default/Focus/ValidationError/Loading/Success | D/T/M | 1 핵심 |
| … | | | | |
```

### (3) 핵심 흐름 문서 — `FLOW.md`
핵심 작업이 처음부터 끝까지 어떻게 이어지는지, 각 전환에서 무엇이 바뀌는지 서술한다.
```markdown
# 핵심 흐름 — <작업명>
1. 목록 진입 (Loading → Default, 데이터 N건)
2. 검색/필터 (입력 → 결과 갱신, 0건이면 Empty)
3. 행 선택 → 상세 (Selected → 상세 화면)
4. 수정 진입 (폼 Default → Focus)
5. 잘못된 입력 (Validation Error: 어느 필드·왜)
6. 저장 (Loading → Success 피드백)
7. 실패 경로 (Error → 복구 안내)
각 단계가 토큰/컴포넌트 어디를 쓰는지, 어떤 안티패턴을 의식적으로 피했는지 1줄씩.
```

---

## 7. 스크린샷 — `scripts/capture-screenshots.ts`

목업이 **구동 중일 때** 뷰포트별 스크린샷을 뽑는다. CONTRACT §14 의 `capture-screenshots.ts`
(Playwright 가정)를 쓴다.

```bash
# 1) 목업을 띄운다 (스택에 맞는 명령)
npm run dev    # 예: http://localhost:5173

# 2) 별도 셸에서 캡처 — 실행 URL(base) + 캡처할 라우트들을 인자로
npx tsx scripts/capture-screenshots.ts \
  --url http://localhost:5173 \
  --routes /customers,/customers/1,/customers/1/edit \
  --viewports desktop,tablet,mobile \
  --out design/audit/screenshots \
  --check-console --check-overflow
```

- `--routes` 는 각 경로를 `--url`(base) 에 결합해 **경로 × 뷰포트마다** 한 장씩 캡처한다.
  파일명은 `{screen}-{viewport}.png` 로, `{screen}` 은 경로를 sanitize 한 라벨이다
  (`/customers` → `customers`, `/customers/1/edit` → `customers-1-edit`, `/` → `home`).
  위 예시는 `customers-desktop.png`, `customers-1-edit-mobile.png` … 9장을 만든다.
- 캡처본은 `/design-audit` 가 쓰도록 `design/audit/screenshots/` 에 저장한다(CONTRACT §3).
- 스크립트는 **콘솔 오류·가로 스크롤 발생**을 함께 점검한다(`--check-console`/`--check-overflow`).
- Playwright/브라우저가 환경에 없으면 스크립트가 **graceful 하게 안내**하고 종료한다. 가짜
  스크린샷 경로를 지어내지 않는다 — 캡처 미수행을 `SCREENS.md` 에 명시한다.

> 스크린샷은 *증거*다. 다음 단계 `/design-audit` 가 이 이미지를 보고 7영역을 점수화한다. 캡처 없이는
> 감사가 추측이 된다.

---

## 산출물 경로 (CONTRACT §3 정합)

```
<프로젝트 목업 폴더>/        # 스택에 맞는 위치 (예: prototype/ 또는 기존 앱 라우트)
├── README.md               # 실행 방법
├── SCREENS.md              # 화면 목록 + 상태/반응형
├── FLOW.md                 # 핵심 흐름
└── (src/ … 토큰 CSS Variables + 컴포넌트 + 화면 + src/data/ 더미 데이터)

design/audit/screenshots/   # 뷰포트별 캡처 (capture-screenshots.ts 산출 → /design-audit 입력)
```

> 목업 코드의 정확한 트리는 스택에 따라 다르다. **고정되는 것**은 ① 토큰을 CSS Variables 로만
> 쓰는 레이어, ② 위 3종 문서(README/SCREENS/FLOW), ③ 스크린샷 출력 경로다.

---

## 품질 체크 (완료 선언 전)

- [ ] 핵심 작업 **1개를 처음부터 끝까지** 클릭으로 완주할 수 있다(목록→…→저장→성공).
- [ ] 색/간격/폰트/모서리/그림자가 **전부 `design/TOKENS.json` 에서** 왔다. 임의 값 0건.
- [ ] 토큰에 없는 값을 추가했다면 `design/DECISION-LOG.md` 에 이유를 적었다.
- [ ] 컴포넌트가 `design/COMPONENTS.md` 정의와 일치하고, 같은 컴포넌트는 화면마다 동일하다(Gate 3).
- [ ] 화면 상태 12종 중 흐름에 필요한 상태가 **실제로 토글**된다(특히 Loading/Empty/Error/Success/Validation Error/Permission Denied).
- [ ] 반응형 3종이 **재배치**다(모바일=축소 아님). 텍스트/버튼 안 잘림, 터치 영역 ≥ 44px(Gate 6).
- [ ] 포커스 링이 보이고, 상태를 **색에만 의존**하지 않으며, 입력에 레이블이 있다(Gate 7).
- [ ] 더미 데이터가 제품 도메인에 맞게 그럴듯하다. placeholder 나열·Lorem ipsum·가짜 수치 0건.
- [ ] 안티패턴 자가검열: 근거 없는 보라/파랑 그라데이션, 모든 콘텐츠 카드화, 반복 3열 카드 그리드,
      장식 우선, 흐름 없는 카드 대시보드, 이모지 장식, 순수 `#000`/`#fff` — 없다(Gate 4).
- [ ] README/SCREENS/FLOW 3종 문서가 있고 실행 명령이 실제로 동작한다.
- [ ] 스크린샷이 `design/audit/screenshots/` 에 있다(또는 캡처 미수행을 `SCREENS.md` 에 명시).
- [ ] "생성보다 판단": 시스템 단계를 건너뛰고 임의로 디자인을 지어내지 않았다.

---

## 다음 단계

`/design-audit` — 이 목업을 브라우저로 **실제로 열어** 7영역(product_fit / information_architecture /
visual_consistency / usability / distinctiveness / responsive / accessibility)을 100점 만점으로
점수화하고, 통과 기준(평균 ≥ 85 · 모든 항목 ≥ 75 · accessibility ≥ 80 · 치명 오류 0 · 치명
안티패턴 0)에 못 미치면 **최대 3회** 개선 루프를 돈다. 입력은 `design/audit/screenshots/` 의 캡처와
목업 URL 이다.

> 목업이 돌아간다고 끝이 아니다. **사용자가 일을 끝낼 수 있는지**, 그리고 그게 **흔한 AI 화면이
> 아닌지**를 감사가 확인하기 전까지 완료가 아니다.
