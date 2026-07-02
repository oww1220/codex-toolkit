<!--
============================================================================
이 템플릿은 /design-system 커맨드가 채운다.
산출 경로: design/COMPONENTS.md
입력: design/DESIGN.md + design/TOKENS.json + design/selection.json
관련: design/UX-PATTERNS.md(흐름), design/ACCESSIBILITY.md(접근성 상세),
      design/MOTION.md(전이·상태 모션)
다음 단계: /design-prototype (이 컴포넌트 명세로 목업 구현)

[작성 가이드]
- 모든 컴포넌트 25종을 동일 골격으로 기술한다. 골격:
  목적 / 사용 조건 / 쓰지 말아야 할 조건 / Variant / Size / State / 접근성 / 모바일 동작 / 예제.
- 값(색/간격/폰트/모서리/그림자) 은 절대 hex/px 인라인하지 않는다.
  모두 design/TOKENS.json 의 토큰 키를 참조한다. 예: 배경 color.surface.raised,
  패딩 spacing.4, 모서리 radius.md. 임의 값 발견 시 design/DECISION-LOG.md 기록.
- §A 에 Button·Input 2종을 *완전 예시*로 푼다(구현자가 패턴을 학습).
- §B 에 나머지 23종을 같은 골격의 표로 반복(분량 관리). 각 행은 풀어쓸 수 있는 동일 구조.
- 진부한 AI 기본값 자가검열: 모든 버튼에 아이콘 금지, 균등 카드 그리드 금지,
  과도한 그림자/라운드 금지, 순수 #000/#fff 금지(토큰에서 차단됨).
- 25종 목록(고정): Button, Input, Select, Checkbox, Radio, Switch, Textarea, Search,
  Table, List, Card, Badge, Tabs, Sidebar, Header, Breadcrumb, Pagination, Modal, Drawer,
  Tooltip, Toast, Alert, Empty State, Loading State, Error State.
============================================================================
-->

# 컴포넌트 명세 — {{project_name}}

> 출처: `/design-system` / {{generated_at}}
> **모든 값은 `design/TOKENS.json` 참조** — 이 문서는 토큰 키만 인용한다(hex/px 인라인 금지).
> 원칙은 `design/DESIGN.md`, 흐름은 `design/UX-PATTERNS.md`, 접근성 상세는 `design/ACCESSIBILITY.md`.

---

## 공통 규약 (모든 컴포넌트에 적용)

<!-- 가이드: 컴포넌트별로 반복하지 않도록 공통 사항을 여기 모은다. -->

- **토큰만 사용**: 색=`color.*`, 간격=`spacing.*`, 폰트=`typography.*`, 모서리=`radius.*`, 그림자=`shadow.*`. 임의 값 금지.
- **State 5종 기본**: default / hover / active / focus(키보드 포커스 링 가시) / disabled. 인터랙티브 요소는 5종 모두 정의.
- **포커스 가시성**: 키보드 포커스는 항상 보인다(`color.accent` 또는 전용 focus 토큰). 색에만 의존하지 않는다.
- **터치 타깃**: 모바일에서 ≥44px(`spacing` 조합). 
- **모션**: 전이는 `motion.duration` / `motion.easing` 토큰. `prefers-reduced-motion` 존중(`design/MOTION.md`).
- **접근성**: 의미 있는 라벨/`aria-*`, 상태를 색만으로 표현 금지(아이콘·텍스트 병행).

---

## A. 완전 예시 (패턴 학습용 2종)

### A.1 Button

| 항목 | 내용 |
|------|------|
| **목적** | 사용자가 명시적 행동(저장/삭제/다음)을 일으키는 1차 상호작용 요소. |
| **사용 조건** | 페이지/폼/모달에서 *행동을 트리거*할 때. 화면당 1차 버튼(primary)은 원칙적으로 1개. |
| **쓰지 말아야 할 조건** | 단순 페이지 이동(→ 링크 사용), 모든 항목에 동일 비중으로 나열(→ 위계 붕괴). 장식 목적 아이콘 버튼 금지. |
| **Variant** | `primary`(color.accent.default 배경, text.inverse) · `secondary`(color.surface + border) · `ghost`(투명, hover 시 surface) · `danger`(color.semantic.danger) · `link`(텍스트형). |
| **Size** | `sm`(높이 spacing.8, padding-x spacing.3, fontSize.sm) · `md`(높이 spacing.10, padding-x spacing.4, fontSize.base) · `lg`(높이 spacing.12, padding-x spacing.6, fontSize.lg). 모서리 `radius.md`. |
| **State** | default / hover(`color.accent.hover`) / active(눌림) / focus(포커스 링) / disabled(`color.text.muted`, 커서 not-allowed) / loading(스피너 + 라벨 유지, 중복 클릭 차단). |
| **접근성** | `<button>` 사용(div 클릭 금지). 아이콘 단독 버튼은 `aria-label` 필수. loading 시 `aria-busy`. 포커스 링 항상 가시. 대비 ≥ WCAG AA. |
| **모바일 동작** | 높이 ≥44px. 가로 폭 넓은 1차 행동은 full-width 허용. hover 상태 의존 금지(터치엔 hover 없음). |
| **예제** | `<Button variant="primary" size="md">저장</Button>` — 배경 `color.accent.default`, 텍스트 `color.text.inverse`, 패딩 `spacing.4`, 모서리 `radius.md`, 전이 `motion.duration.fast`. <!-- 아이콘은 의미 보조 시에만. 장식 금지. --> |

### A.2 Input (Text Field)

| 항목 | 내용 |
|------|------|
| **목적** | 한 줄 텍스트/숫자를 입력받는 기본 폼 필드. |
| **사용 조건** | 짧은 자유 입력(이름/이메일/금액). 라벨과 함께 사용. |
| **쓰지 말아야 할 조건** | 긴 텍스트(→ Textarea), 정해진 선택지(→ Select/Radio), 검색 전용(→ Search). placeholder 를 라벨 대용으로 쓰지 않는다. |
| **Variant** | `default`(border, `surface.default`) · `filled`(`surface.sunken` 배경) · `with-prefix/suffix`(단위·아이콘) · `inline`(테이블 내 편집). |
| **Size** | `sm` / `md` / `lg` (Button 과 동일 높이 스케일, 폼 정렬). 모서리 `radius.md`, 보더 `borderWidth` + `color.border.default`. |
| **State** | default / hover(`border.strong`) / focus(`color.accent` 보더 + 링) / filled / error(`color.semantic.danger` 보더 + 메시지) / disabled / readonly. |
| **접근성** | `<label for>` 연결 필수. 에러는 색 + 아이콘 + 텍스트(`aria-describedby`). `aria-invalid` 표시. 자동완성 `autocomplete` 지정. |
| **모바일 동작** | 높이 ≥44px. 적절한 `inputmode`/`type`(숫자→numeric 키패드). 확대 방지 위해 fontSize ≥16px(`fontSize.base`). |
| **예제** | `<Input label="이메일" type="email" />` — 라벨 `text.secondary`/`fontSize.sm`, 필드 `surface.default` + `border.default`, 포커스 시 `color.accent` 링. 에러 시 하단 `semantic.danger` 메시지 + 경고 아이콘. |

---

## B. 동일 골격 요약 (나머지 23종)

<!--
가이드:
- 아래 표의 각 행은 §A 와 같은 9칸 골격을 한 줄로 압축한 것이다.
- 구현 시 필요한 컴포넌트는 §A 형식으로 풀어쓸 수 있다(골격 동일).
- 모든 칸은 design/TOKENS.json 토큰 키로 채운다. hex/px 인라인 금지.
- "쓰지 말 조건" 칸은 안티패턴 회귀를 막는다 — 반드시 채운다.
-->

### B.1 폼 입력 컴포넌트

| 컴포넌트 | 목적 | 쓰지 말아야 할 조건 | Variant | State 핵심 | 모바일 |
|----------|------|---------------------|---------|-----------|--------|
| Select | 정해진 선택지 1개 선택 | 선택지 2~3개(→ Radio), 다중(→ Checkbox) | default / searchable / multi | open/selected/disabled | 네이티브 시트 권장 |
| Checkbox | 독립 다중 선택·동의 | 상호배타 선택(→ Radio) | single / group / indeterminate | checked/indeterminate/disabled | ≥44px 탭 영역 |
| Radio | 상호배타 1개 선택 | 선택지 5개+ (→ Select) | vertical / horizontal / card | checked/focus/disabled | 라벨 전체 탭 |
| Switch | 즉시 적용 on/off 토글 | 제출 후 반영되는 설정(→ Checkbox) | default / with-label | on/off/disabled | ≥44px, 색+위치 동시 표시 |
| Textarea | 여러 줄 자유 텍스트 | 한 줄 입력(→ Input) | default / auto-grow / counter | focus/error/disabled | 자동 높이, 확대 방지 |
| Search | 목록·콘텐츠 탐색 입력 | 일반 폼 입력(→ Input) | inline / with-suggest / global(command) | empty/typing/results/no-result | 키보드 검색 액션 |

### B.2 데이터 표시 컴포넌트

| 컴포넌트 | 목적 | 쓰지 말아야 할 조건 | Variant | State 핵심 | 모바일 |
|----------|------|---------------------|---------|-----------|--------|
| Table | 다열 구조화 데이터·정렬·일괄작업 | 비교 불필요 단순 나열(→ List) | default / sortable / selectable / sticky-header | sorting/selected/empty/loading | 카드 변환 또는 가로 스크롤(축소 금지) |
| List | 동질 항목 세로 나열 | 다열 비교 필요(→ Table) | simple / two-line / with-action / grouped | hover/selected/empty | 행 ≥44px |
| Card | 연관 정보 묶음 단위 | *모든 콘텐츠* 카드화(안티패턴 #2,#3) | outlined / elevated / interactive | hover(interactive만)/selected | 1열 스택(균등 그리드 금지) |
| Badge | 상태·카테고리·카운트 라벨 | 본문 강조(→ 텍스트 스타일) | status / count / dot | — | 색+텍스트 병행(색만 금지) |

### B.3 내비게이션 컴포넌트

| 컴포넌트 | 목적 | 쓰지 말아야 할 조건 | Variant | State 핵심 | 모바일 |
|----------|------|---------------------|---------|-----------|--------|
| Tabs | 동일 맥락 내 뷰 전환 | 단계 진행(→ 별도 흐름), 페이지 이동(→ 링크) | underline / pill / segmented | active/focus/disabled | 가로 스크롤 또는 드롭다운 |
| Sidebar | 1차 내비게이션(앱 구조) | 콘텐츠 영역 차지(좁은 화면) | persistent / collapsible / icon-only | active/collapsed/hover | 오프캔버스 드로어로 전환 |
| Header | 상단 컨텍스트·전역 액션 | 모든 페이지 동일 무의미 헤더 강제 | app / page / with-search | sticky/scrolled | 핵심 액션만 노출, 나머지 메뉴 |
| Breadcrumb | 계층 위치·상위 이동 | 1~2단 얕은 구조 | default / with-dropdown | current(비링크) | 마지막 단계만 또는 뒤로가기 |
| Pagination | 대량 목록 분할 탐색 | 무한 스크롤이 맞는 피드 | numbered / prev-next / load-more | current/disabled | prev/next 또는 load-more |

### B.4 오버레이 컴포넌트

| 컴포넌트 | 목적 | 쓰지 말아야 할 조건 | Variant | State 핵심 | 모바일 |
|----------|------|---------------------|---------|-----------|--------|
| Modal | 흐름 차단·집중 결정/입력 | 비차단 알림(→ Toast), 긴 폼(→ Drawer/페이지) | default / confirm / form | open/closing | full-screen 또는 bottom-sheet |
| Drawer | 측면 슬라이드 보조 패널·긴 폼 | 짧은 확인(→ Modal) | left / right / bottom-sheet | open/closing | bottom-sheet 권장 |
| Tooltip | 보조 설명(짧은) hover/focus | 필수 정보(숨기면 안 됨) | default / with-arrow | visible/hidden | 탭(long-press) 또는 인라인 대체 |
| Toast | 비차단 일시 알림 | 사용자 결정 필요(→ Modal/Alert) | info / success / warning / error | enter/visible/exit | 상단/하단 안전영역, 자동 소멸+수동 닫기 |

### B.5 피드백·상태 컴포넌트

| 컴포넌트 | 목적 | 쓰지 말아야 할 조건 | Variant | State 핵심 | 모바일 |
|----------|------|---------------------|---------|-----------|--------|
| Alert | 맥락 내 지속 메시지(경고/안내) | 일시 알림(→ Toast) | info / success / warning / danger | dismissible/persistent | 전체 폭, 색+아이콘+텍스트 |
| Empty State | 데이터 없음 + 다음 행동 안내 | 로딩 중(→ Loading), 오류(→ Error) | first-use / no-result / cleared | — | 1차 행동 버튼 강조 |
| Loading State | 처리 중 진행 표시 | 즉시 완료 작업 | spinner / skeleton / progress | indeterminate/determinate | 스켈레톤으로 레이아웃 유지 |
| Error State | 실패 + 복구 경로 제시 | 사용자 입력 오류(→ Input error) | inline / full-page / retry | retryable/fatal | 재시도 버튼 ≥44px |

---

## C. 컴포넌트별 상세 (필요 시 §A 형식으로 확장)

<!--
가이드: 프로젝트에서 자주 쓰거나 복잡한 컴포넌트는 여기서 §A 의 9칸 골격으로 풀어쓴다.
틀:

### C.x {{component_name}}
| 항목 | 내용 |
|------|------|
| **목적** | {{purpose}} |
| **사용 조건** | {{when_to_use}} |
| **쓰지 말아야 할 조건** | {{when_not_to_use}} |
| **Variant** | {{variants}} |
| **Size** | {{sizes}} |
| **State** | {{states}} |
| **접근성** | {{a11y}} |
| **모바일 동작** | {{mobile}} |
| **예제** | {{example}} (TOKENS.json 토큰 키로) |
-->

{{expanded_components}}

---

<!--
[다음 단계]
이 명세가 완성되면 /design-prototype 으로 핵심 흐름을 목업한다.
목업의 모든 컴포넌트는 이 문서의 골격 + design/TOKENS.json 의 값만 사용한다.
구현 후 /design-audit 의 Gate 3(System Consistency)·Gate 7(Accessibility) 으로 검증한다.
-->
