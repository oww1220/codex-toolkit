---
name: design-system
description: 사용자가 확정한 디자인 방향(selection.json)을 AI 코딩 에이전트가 반복 사용할 디자인 시스템 문서·토큰으로 변환한다. design/selection.json + design/DESIGN-DIRECTION.md 를 입력으로 받아 DESIGN.md, TOKENS.json, COMPONENTS.md 외 9개 문서를 생성한다. 트리거 — "디자인 시스템 만들어줘", "토큰 정리", "디자인 규칙 문서화", "design system", "/design-system".
allowed-tools: Read, Write
---

# /design-system — 선택을 재사용 가능한 디자인 시스템으로

9단계 파이프라인의 **6단계**다. `/design-select`(선택 합성)가 끝났고, `/design-prototype`(목업) 직전.

> **이 단계의 한 줄 정체성**
> 사용자가 비교를 통해 *고른 것*(`design/selection.json`)을 한 번 쓰고 버리지 않는다.
> 이 커맨드는 그 선택을 **AI 코딩 에이전트와 사람이 매 UI 작업에서 반복 참조할 규칙**으로
> 박제한다. 디자인을 새로 *발명*하지 않는다 — 이미 확정된 방향을 **단일 출처 문서**로 옮긴다.

선택은 흩어진 좋아요/싫어요다. 시스템은 그것을 **일관된 토큰 + 컴포넌트 규칙 + 동작 규칙**으로
수렴시킨 것이다. 이 단계 이후의 모든 구현(목업·실제 코드)은 `design/TOKENS.json` 한 곳에서만
값을 가져오고, `design/COMPONENTS.md`·`design/UX-PATTERNS.md` 의 규칙을 따른다.

---

## 0. 목적

| | |
|---|---|
| **입력(필수)** | `design/selection.json`(확정 선택) + `design/DESIGN-DIRECTION.md`(합성된 방향) |
| **입력(참조)** | `design/design-profile.json`, `design/research/references.json`, `design/DECISION-LOG.md` |
| **사전 스키마** | `schemas/tokens.schema.json`(§4.4) + 토큰 그룹 표준(CONTRACT §5) |
| **템플릿** | `templates/` 의 동명 `*.template.md`(있는 것만 골격으로) |
| **참조 규칙** | `references/anti-patterns.md`(20안티패턴), `references/quality-gates.md`(7게이트) |
| **산출** | `design/` 아래 **9개 문서**(아래 §3) |
| **다음** | `/design-prototype`(이 시스템으로 핵심 흐름 목업) |

> 이 단계는 사용자에게 **질문하지 않는다**(`allowed-tools` 에 AskUserQuestion 없음). 모든 결정은
> 이전 단계 산출물에 이미 들어 있어야 한다. 근거가 없는 값은 *발명*하지 말고
> `design/DECISION-LOG.md` 에 "임의 결정"으로 기록한 뒤 쓴다. 입력이 비어 있으면 §1 에서 멈춘다.

---

## 1. 입력 확인 (없으면 멈춘다)

1. `design/selection.json` 을 **Read** 한다.
   - 없으면: *"확정된 선택이 없습니다. `/design-select` 로 후보 선택을 먼저 합성해 주세요. 디자인 시스템은 사용자가 고른 것을 박제하는 단계이지, 디자인을 새로 정하는 단계가 아닙니다."* 라고 안내하고 종료한다. **빈 선택을 추측으로 지어내지 않는다.**
   - `selectedCandidate`(단일) 또는 `combinedSelection`(조합) 중 무엇이 채워졌는지 확인한다. 둘 다 비어 있으면 위와 동일하게 멈춘다.
2. `design/DESIGN-DIRECTION.md` 를 **Read** 한다(없으면 `selection.json` + `references.json` 으로 방향을 복원하되, 복원했다는 사실을 `DECISION-LOG.md` 에 기록).
3. 보조 근거를 가능한 만큼 읽는다:
   - `design/design-profile.json` — `avoid[]`, `accessibility[]`, `motion_level`, `surface/radius/shadow`, `weighting`
   - `design/research/references.json` — 선택된 후보의 `apply[]`/`doNotApply[]` (→ `REFERENCES.md` 매핑 + `ANTI-PATTERNS.md` 의 "이 프로젝트에서 특히 경계할 것")
   - `design/DECISION-LOG.md` — 지금까지의 임의 결정(시스템에 반영)
4. 스키마·표준을 **Read** 한다:
   - `schemas/tokens.schema.json` — `TOKENS.json` 의 형태 계약
   - `references/anti-patterns.md` — `ANTI-PATTERNS.md` 작성의 원본 20개
   - `references/quality-gates.md` — 시스템이 통과해야 할 7게이트

> 선택이 **조합**(`combinedSelection`)이면, 각 요소(색=후보 A, 타이포=후보 A, 테이블=후보 B …)를
> 어느 후보에서 가져왔는지를 끝까지 추적한다. 이 추적이 `design/REFERENCES.md` 의 핵심 산출이다.

---

## 2. 작성 순서 — 토큰을 먼저, 문서를 나중에

9개 문서는 서로 참조한다. **순환 참조를 피하려면 토큰을 먼저 확정**하고, 나머지 문서가 그것을
인용하게 한다. 권장 순서:

```
1) DESIGN.md          철학·원칙·Do/Don't (방향을 한 문장으로 압축)
2) TOKENS.json        색/간격/폰트/모서리 단일 출처 ← 가장 먼저 값 확정
3) COMPONENTS.md      25종 컴포넌트 × 상태 (TOKENS 인용)
4) UX-PATTERNS.md     동작 규칙 (templates/UX-PATTERNS.template.md 골격)
5) CONTENT-STYLE.md   문구·용어·라벨 규칙
6) MOTION.md          모션 토큰 운용·접근성
7) ACCESSIBILITY.md   대비·포커스·키보드·터치·reduced-motion
8) ANTI-PATTERNS.md   프로젝트 맞춤 안티패턴 (references/anti-patterns.md 기반)
9) REFERENCES.md      출처 ↔ 적용 요소 매핑 (복제 아님을 증명)
```

실무적으로는 `TOKENS.json` 값을 먼저 정한 뒤 `DESIGN.md` 머리말을 쓰는 것이 자연스럽다.
위 번호는 *읽는 순서*이고, 작업은 **TOKENS.json → 나머지** 로 한다.

---

## 3. 산출물 (경로 절대 고정 — CONTRACT §3)

```
design/
├── DESIGN.md          # 철학·원칙·Do/Don't
├── TOKENS.json        # 디자인 토큰 — 단일 출처 (schemas/tokens.schema.json 준수)
├── COMPONENTS.md      # 컴포넌트 25종 × 상태
├── UX-PATTERNS.md     # 동작 규칙 (templates/UX-PATTERNS.template.md 골격)
├── CONTENT-STYLE.md   # 문구·용어·라벨·숫자/날짜 규칙
├── MOTION.md          # 모션 토큰 운용 + 접근성
├── ACCESSIBILITY.md   # 대비·포커스·키보드·터치·reduced-motion
├── ANTI-PATTERNS.md   # 프로젝트 맞춤 안티패턴 (references/anti-patterns.md 기반)
└── REFERENCES.md      # 출처 ↔ 적용 요소 매핑
```

각 문서를 **Write** 로 저장한다. 9개가 전부 생성돼야 이 단계가 완료된다.

---

## 4. 산출 1 — `design/TOKENS.json` (가장 먼저, 단일 출처)

색상/간격/폰트/모서리의 **단일 출처**. 구현은 여기서만 값을 가져온다. 형태는
`schemas/tokens.schema.json`(CONTRACT §4.4)을, 그룹/키는 토큰 그룹 표준(CONTRACT §5)을 따른다.

### 4.1 토큰 값의 출처

| 토큰 그룹 | 값을 어디서 도출하나 |
|-----------|---------------------|
| `color.*` | `selection.combinedSelection.color` 후보의 색 방향 + `design-profile.color.direction` |
| `typography.fontFamily` | `selection.typography` 후보 + `design-profile.typography.direction` (display 800+ / body 400~500 분리) |
| `spacing` | `selection.spacing`/`density` 후보 + `design-profile.information_density.level` |
| `radius` / `shadow` / `surface` | `selection.radius`/`shadow` 후보 + `design-profile.surface/radius/shadow` |
| `motion` | `selection.motion` 후보 + `design-profile.motion_level` |

### 4.2 색상 규칙 (AI slop 자가검열 — 이 스킬의 상품)

- **순수 `#000`/`#fff` 금지.** 배경 base 는 accent hue 를 미세하게 띤 off-white, 텍스트 primary 는 톤 띤 off-black 으로. (OKLCH 권장 — 명도·채도·색상을 명시적으로 통제.)
- **Tailwind 기본 blue/violet/emerald 그대로 박지 않는다.** accent 는 제품 인상에서 도출한 1색.
- **accent 1색 원칙.** 강조색 남발 금지(안티패턴 #19). semantic(success/warning/danger/info)은 강조색과 별개 역할.
- 모든 텍스트/배경 페어는 대비를 의식한다(상세 검증은 `design/ACCESSIBILITY.md`).

### 4.3 형태 예시 (값은 프로젝트에서 도출한 실제 값으로)

> 아래는 *형태* 를 보여주는 예시다. 후보·프로필에서 도출한 실제 값으로 채운다.
> OKLCH 를 기본 표기로 쓰되, 팀이 hex 를 선호하면 hex 로 변환해 넣되 순수 흑백은 금지.

```json
{
  "color": {
    "background": {
      "base":   "oklch(0.985 0.004 75)",
      "subtle": "oklch(0.965 0.006 75)",
      "muted":  "oklch(0.940 0.008 75)"
    },
    "surface": {
      "default": "oklch(1 0 0 / 0)",
      "raised":  "oklch(0.99 0.004 75)",
      "sunken":  "oklch(0.955 0.006 75)"
    },
    "text": {
      "primary":   "oklch(0.255 0.012 70)",
      "secondary": "oklch(0.430 0.010 70)",
      "muted":     "oklch(0.585 0.008 70)",
      "inverse":   "oklch(0.985 0.004 75)"
    },
    "border": {
      "default": "oklch(0.900 0.006 75)",
      "strong":  "oklch(0.820 0.008 75)",
      "subtle":  "oklch(0.945 0.005 75)"
    },
    "accent": {
      "default":  "oklch(0.520 0.130 250)",
      "hover":    "oklch(0.470 0.135 250)",
      "subtle":   "oklch(0.945 0.030 250)",
      "contrast": "oklch(0.985 0.004 250)"
    },
    "semantic": {
      "success":         "oklch(0.560 0.120 150)",
      "success.surface": "oklch(0.955 0.030 150)",
      "warning":         "oklch(0.700 0.140 75)",
      "warning.surface": "oklch(0.965 0.040 75)",
      "danger":          "oklch(0.550 0.180 25)",
      "danger.surface":  "oklch(0.955 0.040 25)",
      "info":            "oklch(0.560 0.110 235)",
      "info.surface":    "oklch(0.955 0.030 235)"
    }
  },
  "typography": {
    "fontFamily": {
      "display": "\"Source Serif 4\", \"Noto Serif KR\", Georgia, serif",
      "body":    "Pretendard, \"Noto Sans KR\", system-ui, sans-serif",
      "mono":    "\"JetBrains Mono\", \"D2Coding\", ui-monospace, monospace"
    },
    "fontSize": {
      "xs": "0.75rem", "sm": "0.875rem", "base": "1rem", "lg": "1.125rem",
      "xl": "1.25rem", "2xl": "1.5rem", "3xl": "1.875rem", "4xl": "2.25rem"
    },
    "fontWeight": {
      "regular": "400", "medium": "500", "semibold": "600",
      "bold": "700", "black": "800"
    },
    "lineHeight": { "tight": "1.2", "normal": "1.5", "relaxed": "1.7" },
    "letterSpacing": { "tight": "-0.01em", "normal": "0", "wide": "0.02em" }
  },
  "spacing": {
    "0": "0", "1": "0.25rem", "2": "0.5rem", "3": "0.75rem", "4": "1rem",
    "5": "1.25rem", "6": "1.5rem", "8": "2rem", "10": "2.5rem",
    "12": "3rem", "16": "4rem"
  },
  "radius": { "none": "0", "sm": "4px", "md": "8px", "lg": "12px", "full": "9999px" },
  "shadow": {
    "none": "none",
    "sm": "0 1px 2px oklch(0.255 0.012 70 / 0.06)",
    "md": "0 2px 8px oklch(0.255 0.012 70 / 0.08)",
    "lg": "0 8px 24px oklch(0.255 0.012 70 / 0.10)"
  },
  "borderWidth": { "none": "0", "hairline": "0.5px", "thin": "1px", "thick": "2px" },
  "breakpoint": { "mobile": "640px", "tablet": "1024px", "desktop": "1280px" },
  "motion": {
    "duration": { "fast": "120ms", "base": "200ms", "slow": "320ms" },
    "easing": {
      "standard":   "cubic-bezier(0.2, 0, 0, 1)",
      "decelerate": "cubic-bezier(0, 0, 0, 1)",
      "accelerate": "cubic-bezier(0.3, 0, 1, 1)"
    }
  },
  "zIndex": {
    "base": "0", "dropdown": "1000", "sticky": "1100",
    "overlay": "1200", "modal": "1300", "toast": "1400"
  }
}
```

### 4.4 TOKENS.json 저장 전 체크

- [ ] `schemas/tokens.schema.json` 통과 (필수 그룹 `color/typography/spacing/radius/shadow`, color 6하위, typography 5하위)
- [ ] 순수 `#000`/`#fff` 없음 (off-black/off-white 만)
- [ ] Tailwind 기본 색 그대로 박지 않음, accent 1색 원칙
- [ ] display 폰트(800+) ↔ body 폰트(400~500) family 분리
- [ ] spacing 이 4px 기반 스케일
- [ ] 검증 도구 안내: **`scripts/validate-tokens.ts`** 로 스키마·임의색·누락 그룹을 점검하라고 사용자에게 안내한다(아래 §15).

---

## 5. 산출 2 — `design/DESIGN.md` (철학·원칙·Do/Don't)

`templates/` 에 `DESIGN.template.md` 가 있으면 골격으로 쓰고, 없으면 아래 구조로 작성한다.
이 문서는 **AI 코딩 에이전트가 UI 작업 전 가장 먼저 읽는 문서**다(CONTRACT §16). 짧고 단정적으로.

```markdown
# 디자인 시스템 — {프로젝트명}

> 모든 UI 작업 전 이 문서를 읽는다. 값은 design/TOKENS.json, 컴포넌트는 design/COMPONENTS.md,
> 동작은 design/UX-PATTERNS.md 를 따른다. 임의 색·간격·그라데이션·글로우·카드 스타일을 추가하지 않는다.

## 1. 한 문장 정체성
{선택된 방향을 한 문장으로. 예: "오래 들여다봐도 피로하지 않은, 정보 밀도 높은 편집물 같은 업무 도구."}

## 2. 디자인 원칙 (이 제품에 한정)
1. {예: 데이터가 주인공이다 — 장식이 데이터를 가리지 않는다.}
2. {예: 한 화면 한 목적 — 목록에 편집 폼을 욱여넣지 않는다.}
3. {예: 강조는 한 번만 — accent 1색으로 가장 중요한 1개만 가리킨다.}
4. {예: 상태는 색만으로 말하지 않는다 — 아이콘·텍스트 병행.}
5. {예: 모바일은 축소가 아니라 재배치.}
( 선택된 후보의 apply[] 와 design-profile 의 원칙에서 도출. 각 원칙은 제품 목적과 연결한다. )

## 3. Do / Don't
| 영역 | Do | Don't |
|------|----|----|
| 색상 | TOKENS 의 accent 1색으로 강조 | 보라/파랑 그라데이션 장식(안티패턴 #1,#19) |
| 레이아웃 | 비교·스캔 데이터는 테이블 | 모든 콘텐츠 카드화(안티패턴 #2,#3) |
| 모서리 | radius sm~md 일관 | 과도한 둥근 모서리(안티패턴 #4) |
| 표면 | flat-with-border 로 구분 | 근거 없는 글래스모피즘·글로우(안티패턴 #5,#6) |
| 히어로 | 업무 도구엔 히어로 없음 | 화면 대부분 차지하는 히어로(안티패턴 #7) |
| 수치 | 실제 데이터만 | 가짜 통계·10x/99%(안티패턴 #16) |

## 4. 이 시스템을 어기려면
토큰에 없는 값이 필요하면 design/DECISION-LOG.md 에 이유를 적고 추가한다.
선택된 레퍼런스를 그대로 복제하지 않는다(출처↔적용은 design/REFERENCES.md).
```

규칙: 원칙은 **이 제품에 한정**해 구체적으로. "좋은 디자인을 한다" 류의 공허한 문장 금지. 각 원칙은
선택된 후보의 `apply[]` 또는 `design-profile` 의 항목에서 도출되어야 한다(근거 추적성).

---

## 6. 산출 3 — `design/COMPONENTS.md` (컴포넌트 25종 × 상태)

컴포넌트별 **외형 규칙 + 상태**를 정의한다. 모든 값은 **`design/TOKENS.json` 토큰을 인용**한다
(여기에 raw hex/px 를 박지 않는다). 동작·문구는 `UX-PATTERNS.md`·`CONTENT-STYLE.md` 로 미룬다.

### 6.1 컴포넌트 25종 (전부 다룬다)

| # | 컴포넌트 | 필수 상태 |
|---|---------|----------|
| 1 | Button (primary/secondary/ghost/danger) | default · hover · active · focus · disabled · loading |
| 2 | Input (text) | default · focus · filled · error · disabled · readonly |
| 3 | Textarea | default · focus · error · disabled |
| 4 | Select / Dropdown | closed · open · selected · disabled |
| 5 | Checkbox | unchecked · checked · indeterminate · focus · disabled |
| 6 | Radio | unselected · selected · focus · disabled |
| 7 | Toggle / Switch | off · on · focus · disabled |
| 8 | Slider | default · dragging · focus · disabled |
| 9 | Tag / Chip | default · removable · selected |
| 10 | Badge | default · semantic(success/warning/danger/info) |
| 11 | Avatar | image · initials · fallback |
| 12 | Card | default · hover(클릭형) · selected |
| 13 | Table | header · row · row-hover · selected · sortable-col |
| 14 | List row | default · hover · active · disabled |
| 15 | Tabs | default · active · disabled · focus |
| 16 | Breadcrumb | default · current · truncated |
| 17 | Pagination | default · current · disabled |
| 18 | Modal / Dialog | open · closing · backdrop |
| 19 | Drawer / Sheet | open · closing(side/bottom) |
| 20 | Toast / Notification | info · success · warning · danger · 진입/이탈 |
| 21 | Tooltip | default · 위치(top/bottom/left/right) |
| 22 | Empty state | 최초 · 검색0 · 필터0 · 권한없음 |
| 23 | Skeleton / Loading | block · text · row |
| 24 | Progress | linear · 불확정(indeterminate) |
| 25 | Form field group | label · help · error · 묶음 |

### 6.2 컴포넌트당 작성 형태

각 컴포넌트는 아래 표 형태로 쓴다(예: Button).

```markdown
### 1. Button

용도: 1차/2차 동작 구분. 한 화면에 primary 는 1개 원칙.

| 변형 | 배경 | 텍스트 | 테두리 | 용도 |
|------|------|--------|--------|------|
| primary   | accent.default | accent.contrast | none | 화면의 가장 중요한 1개 동작 |
| secondary | surface.default | text.primary | border.default(thin) | 보조 동작 |
| ghost     | transparent | text.secondary | none | 저강도·반복 동작 |
| danger    | semantic.danger | accent.contrast | none | 파괴적 동작(삭제 등) |

| 상태 | 변화 |
|------|------|
| hover    | 배경 accent.hover, transition motion.duration.fast |
| active   | 살짝 눌림(translateY 1px 또는 명도↓) |
| focus    | focus ring(2px, accent.default) — outline:none 단독 금지 |
| disabled | 채도↓·커서 not-allowed, 대비 유지(읽을 수 있게) |
| loading  | 스피너 + 라벨 유지, 중복 클릭 차단 |

크기: sm(spacing.2/3) · md(기본) · lg(spacing.4/6). 모서리 radius.md. 아이콘은 **의미 있을 때만**(안티패턴 #10).
```

규칙:
- 모든 색/간격/모서리는 **토큰 키 이름으로 인용**(`accent.default`, `spacing.4`, `radius.md`). raw 값 금지.
- **모든 인터랙티브 컴포넌트에 focus 상태 필수**(Gate 7). `outline:none` 단독 금지.
- 상태를 **색만으로 구별하지 않는다**(굵기·아이콘·배경 병행).
- 아이콘은 모든 버튼에 붙이지 않는다(안티패턴 #10). 카드는 "모든 것을 카드로"(안티패턴 #2,#3)를 피한다.

---

## 7. 산출 4 — `design/UX-PATTERNS.md` (동작 규칙)

**`templates/UX-PATTERNS.template.md` 를 골격으로** 쓴다. 그 템플릿의 `{{...}}` 자리표시자를
`design/selection.json`(navigation/density)·`design/DESIGN-DIRECTION.md`(핵심 흐름)·
`design/DESIGN-BRIEF.md`(제품 유형·권한)에서 도출한 실제 값으로 채운다.

- 시각 스타일이 아니라 **동작**을 적는다(색/폰트는 TOKENS, 외형은 COMPONENTS).
- 빈 상태(#11) vs 필터 0건(#5) vs 오류(#12)를 서로 다른 문구·행동으로 구별한다.
- 삭제 확인 강도(#9)는 영향 크기에 비례. 모바일(#14)은 축소가 아니라 재배치.
- 모든 패턴 옆 **근거** 칸이 비면 채택 보류. 임의 결정은 `design/DECISION-LOG.md` 에 기록.
- 템플릿의 "작성 완료 체크리스트"를 통과시킨다. `{{...}}` 가 남아 있으면 미완성이다.

---

## 8. 산출 5 — `design/CONTENT-STYLE.md` (문구·용어 규칙)

UI 글쓰기의 단일 출처. COMPONENTS 의 라벨, UX-PATTERNS 의 메시지가 여기를 따른다.

권장 섹션:
1. **톤·인칭** — 사용자에게 말하는 방식(예: "~해요"체 vs "~합니다"체, 명령형 vs 청유형). 선택 근거는 `brand_impression`.
2. **용어 사전** — 한 개념 한 단어. 같은 객체를 "고객/거래처/클라이언트"로 섞어 쓰지 않는다.
3. **버튼·동작 라벨** — 동사 명시("삭제", "내보내기"). "확인/취소"로 뭉개지 않는다.
4. **빈 상태·오류 메시지** — 무엇이·왜·어떻게(다음 행동). 사용자를 탓하지 않는다. 스택/코드 노출 금지.
5. **숫자·날짜·통화** — 자릿수 구분, 상대시간("3일 전") vs 절대시간 기준, 통화 단위 위치.
6. **대소문자·문장부호** — 제목 표기 규칙, 마침표 사용 일관성.
7. **금지 표현** — 가짜 수치(10x/99%, 안티패턴 #16), 의미 없는 과장, 이모지 장식.

각 규칙에 예시(좋음/나쁨)를 1쌍씩 둔다.

---

## 9. 산출 6 — `design/MOTION.md` (모션 운용 + 접근성)

`design/TOKENS.json` 의 `motion`(duration/easing)을 **언제·어디에** 쓰는지 규정한다.
`design-profile.motion_level`(none/minimal/moderate/expressive)을 상한으로 삼는다.

| 상황 | 토큰 | 규칙 |
|------|------|------|
| 상태 전환(hover/focus) | duration.fast + easing.standard | 빠르고 눈에 안 띄게 |
| 진입(모달/토스트) | duration.base + easing.decelerate | 들어올 때 부드럽게 |
| 이탈 | duration.fast + easing.accelerate | 나갈 때 빠르게 |
| 레이아웃 변화 | duration.base | 점프 없이(스켈레톤으로 자리 유지) |

**절대 규칙**
- **장식용 모션 금지**(안티패턴 #6 글로우, #9 입자). 모션은 상태 변화·공간 관계를 *전달*할 때만.
- **`prefers-reduced-motion` 존중**(Gate 7) — 감소 설정 시 큰 이동/패럴랙스 제거, 페이드만 유지.
- 모션이 입력을 막지 않는다(애니메이션 중에도 클릭 가능).
- `motion_level: none`/`minimal` 이면 의미 전달용 외 모션을 추가하지 않는다.

---

## 10. 산출 7 — `design/ACCESSIBILITY.md`

`design-profile.accessibility[]` + 7게이트 중 Gate 7 을 구체 기준으로 옮긴다.

| 항목 | 기준 |
|------|------|
| 색 대비 | 본문/배경 WCAG AA(4.5:1), 큰 텍스트 3:1. `design/TOKENS.json` 페어로 검증 |
| 색 단독 의존 금지 | 상태(성공/오류/선택)는 색 + 아이콘/텍스트 병행 |
| 키보드 | 모든 인터랙티브 요소 Tab 도달·조작, 시각 순서 = Tab 순서 |
| 포커스 가시성 | focus ring 항상 보임. `outline:none` 단독 금지 |
| 레이블 | 모든 입력에 라벨(placeholder 로 대체 금지) |
| 터치 타깃 | ≥ 44px(모바일) |
| 모션 | `prefers-reduced-motion` 대응(→ `design/MOTION.md`) |
| 의미 구조 | 제목 위계(h1→h2), 랜드마크, 이미지 alt |

검증 도구 안내: **`scripts/audit-accessibility.ts`**(대비·포커스·레이블·터치·reduced-motion 정적 점검)를
목업 단계에서 돌리라고 사용자에게 안내한다(§15).

---

## 11. 산출 8 — `design/ANTI-PATTERNS.md` (프로젝트 맞춤)

`references/anti-patterns.md` 의 **20개**(CONTRACT §7)를 이 프로젝트 문맥으로 구체화한다.
**일반 목록을 복붙하지 않는다** — 이 제품에서 *특히 위험한* 것을 골라 사례화한다.

작성 형태:
```markdown
## 이 프로젝트에서 특히 경계할 것 (상위 5)
1. **모든 콘텐츠 카드화(#2,#3)** — 정보 밀도 medium-high 인데 카드 그리드를 쓰면 한 화면 정보가 절반.
   → 비교·스캔 데이터는 테이블(design/UX-PATTERNS.md §6).
2. **보라/파랑 그라데이션 장식(#1)** — 선택된 방향은 저채도 웜뉴트럴. 그라데이션은 정체성과 충돌.
3. … (선택된 후보의 doNotApply[] · design-profile.avoid[] 와 정합)

## 20개 전체 점검표 (이 프로젝트 적용 메모)
| # | 안티패턴 | 이 프로젝트 적용 메모 | 허용 예외(있다면) |
|---|---------|----------------------|-------------------|
| 1 | 의미 없는 보라/파랑 그라데이션 | 금지 — 저채도 방향과 충돌 | — |
| 2 | 모든 콘텐츠 카드화 | 목록은 테이블 기본 | 대시보드 요약 카드 한정 |
| … (20개 전부) |
```

**적용 원칙(CONTRACT §7)**: 특정 요소를 절대 금지하지 않는다. "이 요소가 제품 목적/사용자 행동을
어떻게 돕는가?"에 답 못 하면 안 쓴다. 예외 5조건(시스템 명시 포함 / 브랜드 연결 / 정보·상태 전달에
실제 필요 / 사용자 선택 승인 / 접근성·사용성 무해) 중 하나라도 해당하면 "허용 예외"에 근거와 함께 적는다.

`design-profile.avoid[]` 와 선택 후보의 `doNotApply[]` 를 이 문서의 상위 항목에 반드시 반영한다.

---

## 12. 산출 9 — `design/REFERENCES.md` (출처 ↔ 적용 매핑)

**복제가 아님을 증명하는 문서.** 어떤 레퍼런스에서 *어떤 원칙*을 가져와 *어떻게 다르게* 구현했는지
기록한다(CONTRACT §18). 특정 서비스 통째 복제·로고/일러스트/카피 복사는 금지.

작성 형태:
```markdown
# 레퍼런스 출처 ↔ 적용 매핑 — {프로젝트명}

## 선택 요약 (design/selection.json)
- 단일: {selectedCandidate} / 또는 조합: color=A, typography=A, tables=B, icons=D …

## 요소별 출처 → 가져온 원칙 → 이 프로젝트의 구현
| 요소 | 출처 후보(references.json) | 가져온 *원칙* | 우리 구현(복제 아님) | 버린 것(doNotApply) |
|------|---------------------------|---------------|---------------------|---------------------|
| 색상 | candidate-a (출처 URL) | 저채도 웜뉴트럴 + accent 1색 | 자체 OKLCH 팔레트(TOKENS) | 원본의 브랜드 블루 |
| 타이포 | candidate-a | serif display + humanist body 페어 | Source Serif 4 + Pretendard | 원본 폰트 그대로 X |
| 테이블 | candidate-b | 고밀도 행 + 정렬 가능 헤더 | 자체 컬럼 규칙(COMPONENTS §13) | 원본 색·간격 X |
| 아이콘 | candidate-d | 라인 아이콘 일관 두께 | 자체 아이콘셋/Phosphor 등 | 원본 커스텀 일러스트 X |

## 복제 방지 점검
- [ ] 특정 서비스를 통째로 베끼지 않았다(최소 2개 출처 검토).
- [ ] 로고·고유 일러스트·카피를 복사하지 않았다.
- [ ] 가져온 것은 *원칙*이고, 색/폰트/간격 값은 우리 TOKENS 로 재정의했다.
- [ ] 프로젝트 고유 요소가 최종 디자인에 포함됐다.
```

`design/research/references.json` 의 후보 `source.url`·`apply[]`·`doNotApply[]` 와 정확히 연결한다.

---

## 13. 사용자 프로젝트 CLAUDE.md 연동 (완료 시 제안)

9개 문서가 모두 생성되면, 사용자 프로젝트 루트 `CLAUDE.md` 에 아래 **Design Rules 블록** 추가를
**제안**한다(CONTRACT §16). 사용자 동의 없이 자동으로 덮어쓰지 않는다 — 블록 내용을 보여주고
"추가할까요?"라고 안내한 뒤, 사용자가 원하면 `CLAUDE.md` 끝에 덧붙인다(기존 내용 보존).

```markdown
## Design Rules
- 모든 UI 작업 전 design/DESIGN.md 를 읽는다.
- 색/간격/폰트/모서리는 design/TOKENS.json 을 사용한다.
- 새 컴포넌트 전에 design/COMPONENTS.md 를 확인한다.
- 임의 그라데이션/글로우/카드 스타일을 추가하지 않는다.
- 토큰에 없는 값 추가 시 design/DECISION-LOG.md 에 이유를 기록한다.
- 핵심 화면 구현 후 /design-audit 를 실행한다.
- 선택된 레퍼런스를 그대로 복제하지 않는다.
- UI의 목적·사용자 행동을 장식보다 우선한다.
```

> `CLAUDE.md` 가 없으면 생성, 있으면 끝에 블록을 추가한다. 이미 `## Design Rules` 가 있으면
> 중복 추가하지 말고 차이만 안내한다.

---

## 14. 토큰 ↔ 컴포넌트 규칙 충돌 검사 (저장 후)

9개 문서가 서로 모순되면 시스템이 깨진다. 저장 직후 아래 충돌을 점검한다:

| 충돌 유형 | 점검 |
|-----------|------|
| 토큰 미사용 | `COMPONENTS.md`·`UX-PATTERNS.md` 에 raw hex/px 가 있는가? → 토큰 키로 교체 |
| 토큰 부재 참조 | 문서가 인용한 토큰 키가 `TOKENS.json` 에 실제 있는가? (예: `accent.default`) |
| 상태 누락 | 인터랙티브 컴포넌트에 focus 상태가 빠졌는가?(Gate 7) |
| 밀도 모순 | `UX-PATTERNS` 밀도 ↔ `design-profile.information_density.level` 일치? |
| 모션 상한 위반 | `MOTION.md` 가 `motion_level` 상한을 넘는 장식 모션을 권하는가? |
| 안티패턴 누수 | `DESIGN.md`/`COMPONENTS.md` 예시 자체가 안티패턴(보라 그라데이션·카드 남발)을 쓰는가? |

충돌 발견 시 해당 문서를 **Edit** 로 고친다. 임의 해소는 `design/DECISION-LOG.md` 에 기록한다.

검증 도구 안내(아래 §15):
```bash
npx tsx scripts/validate-tokens.ts design/TOKENS.json
```
`TOKENS.json` 을 `schemas/tokens.schema.json` 으로 검증하고, 임의색·순수 #000/#fff·누락 그룹을
잡는다. 위반 시 exit 1.

---

## 15. 품질 체크 (완료 선언 전)

| 체크 | 통과 기준 |
|------|----------|
| 9개 문서 생성 | DESIGN.md, TOKENS.json, COMPONENTS.md, UX-PATTERNS.md, CONTENT-STYLE.md, MOTION.md, ACCESSIBILITY.md, ANTI-PATTERNS.md, REFERENCES.md 전부 |
| TOKENS 스키마 유효 | `schemas/tokens.schema.json` 통과(`scripts/validate-tokens.ts`) |
| 단일 출처 | 모든 색/간격/폰트/모서리가 `design/TOKENS.json` 에서만 나옴(다른 문서는 토큰 키 인용) |
| 컴포넌트 25종 | `COMPONENTS.md` 가 25종을 다루고, 인터랙티브 요소에 focus 상태 있음 |
| 선택 정합 | navigation/density/색/타이포가 `design/selection.json` 과 일치 |
| 출처 추적 | `REFERENCES.md` 가 모든 적용 요소를 `references.json` 후보로 역추적 + 복제 아님 증명 |
| 안티패턴 맞춤 | `ANTI-PATTERNS.md` 가 20개를 이 프로젝트 문맥으로 구체화(복붙 아님) |
| 근거 추적 | 임의 결정이 모두 `design/DECISION-LOG.md` 에 기록됨 |
| AI slop 자가검열 | 문서·예시 자체가 순수 #000/#fff·Tailwind 기본 보라파랑·이모지·가짜 수치·균등 카드 그리드를 권하지 않음 |
| CLAUDE.md 제안 | Design Rules 블록 추가를 제안함(자동 덮어쓰기 아님) |

> 이 단계는 **목업을 만들지 않는다**(`/design-prototype` 책임). 화면 React/HTML 코드를 여기서
> 생성하면 안 된다. 시스템은 *규칙*이지 *화면*이 아니다.

---

## 16. 다음 단계 안내

시스템이 완성되면 사용자에게 다음을 알린다:

> 디자인 시스템 완성 — `design/` 아래 9개 문서 생성(`DESIGN.md`·`TOKENS.json`·`COMPONENTS.md` 외 6종).
> `design/TOKENS.json` 이 색/간격/폰트/모서리의 단일 출처입니다. 사용자 프로젝트 `CLAUDE.md` 에
> Design Rules 블록 추가를 제안했습니다(원하시면 적용).
>
> 다음은 **`/design-prototype`**: 이 시스템으로 핵심 사용자 흐름을 실제 목업으로 만들고
> 상태·반응형을 구현합니다. 그 후 **`/design-audit`** 가 브라우저에서 7게이트·감사 점수로
> 검증하고 필요하면 개선 루프(최대 3회)를 돕습니다.

토큰 검증을 권한다:
```bash
npx tsx scripts/validate-tokens.ts design/TOKENS.json
```
