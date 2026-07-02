---
name: design-translate
description: 사용자의 추상적 디자인 표현("차분하게", "질리지 않게", "스타트업 느낌 싫음")을 구현 가능한 디자인 기준으로 번역한다. design/DESIGN-BRIEF.md를 입력으로 받아 design/DESIGN-TRANSLATION.md와 design/design-profile.json을 생성한다. 트리거 — "디자인 번역", "내 표현을 디자인 기준으로", "design translate", "취향을 토큰으로", "/design-translate".
allowed-tools: Read, Write, AskUserQuestion
---

# /design-translate — 사용자 언어를 디자인 언어로 번역

9단계 파이프라인의 **2단계**다. `/design-brief`(이해)가 끝났고, `/design-research`(탐색) 직전.

> **이 단계의 한 줄 정체성**
> 사용자가 한 말("차분하게", "질리지 않게")은 *방향*이지 *결정*이 아니다. 이 커맨드는
> 그 말을 **레퍼런스를 평가하고 토큰을 만들 수 있는 측정 가능한 기준**으로 옮긴다.
> 디자인을 만들지 않는다 — 다음 단계들이 디자인을 *판단할 수 있는 좌표계*를 만든다.

이 단계는 6대 설계 원칙 중 **②말보다 선택을 신뢰**의 준비 작업이다. 번역은 "확정"이 아니라
"가설"이다. 확정된 것(`confirmed`)과 추정한 것(`assumed`)을 끝까지 분리해, 다음 탐색·비교
단계가 *추정을 사용자 선택으로 검증*할 수 있게 한다.

---

## 0. 목적

| | |
|---|---|
| **입력** | `design/DESIGN-BRIEF.md` (`/design-brief` 산출) + (있으면) PRD/소스코드/`~/.design-director/profile.json` |
| **참조** | `references/design-vocabulary.md` (형용사 → 토큰·속성 매핑 사전) |
| **산출** | `design/DESIGN-TRANSLATION.md` + `design/design-profile.json` |
| **다음** | `/design-research` (이 프로필을 검색 질의·후보 평가 기준으로 사용) |

번역은 **12개 항목**을 모두 다룬다(CONTRACT §10): visual tone, 브랜드 인상, 정보 밀도,
타이포 방향, 색상 방향, 레이아웃 구조, 모서리·표면, 컴포넌트 밀도, 이미지·아이콘 방향,
모션 수준, 접근성, 금지 요소.

---

## 1. 입력 확인 (없으면 멈춘다)

1. `design/DESIGN-BRIEF.md` 를 **Read** 한다.
   - 없으면: *"브리프가 없습니다. 번역의 근거가 되는 제품·사용자 정보를 먼저 `/design-brief`로 정리해 주세요."* 라고 안내하고 종료한다. **추측으로 빈 브리프를 지어내지 않는다** — 번역의 모든 줄은 근거(`sources`)를 가져야 한다.
2. 보조 근거를 가능한 만큼 읽는다(있을 때만, 없으면 건너뜀):
   - 제품 PRD / 기획 문서
   - 기존 코드의 디자인 흔적(기존 색/폰트/컴포넌트) — Read 로만
   - 프로젝트 횡단 취향 프로필 `~/.design-director/profile.json` (과거 선택 이력 → `assumed` 가중에만 사용, 확정 아님)
3. `references/design-vocabulary.md` 를 **Read** 한다. 이 문서의 매핑 표가 번역의 **사전**이다. 자의적으로 형용사를 토큰에 갖다 붙이지 말고, 사전에 있으면 그 매핑을 인용한다.

> 사전에 없는 표현이 나오면: 가장 가까운 항목 2개를 근거로 보간하고, 그 줄을 `assumed`로
> 표시한다. 사전을 무시한 즉흥 매핑은 금지.

---

## 2. 번역 작업 (12항목)

브리프에서 **원문 표현을 인용**하고 → 사전을 거쳐 → **측정 가능한 기준**으로 옮긴다.
각 항목마다 *왜 그렇게 번역했는지* 한 줄 근거를 남긴다(원칙 ⑥ 모든 결정엔 이유).

### 2.1 번역 원리 — 표현은 방향, 결정은 측정값

| 사용자 표현(예) | 사전 경유 | 번역 결과(측정 가능) |
|---|---|---|
| "오래 써도 질리지 않게" | 차분함 → 낮은 채도·여백 일관·장식 절제 | `visual_tone: [restrained, low-decoration]`, `motion_level: minimal` |
| "자료 많지만 복잡해 보이지 않게" | 조밀 + 가독 → compact spacing·명확한 그룹핑·카드 절제 | `information_density: {level: medium-high, notes: [compact controls, clear grouping, limited card usage]}` |
| "신뢰감 있게" | 신뢰 → 안정 타이포·장식 모션 자제·고대비 | `typography.hierarchy: strong`, `brand_impression: [{trait: 신뢰, priority: 1}]` |
| "스타트업 느낌 싫음" | (금지 방향) | `avoid: [decorative-gradients, oversized-hero, glassmorphism]` |

핵심: **형용사 1개를 토큰 1개로 1:1 치환하지 않는다.** 한 표현이 여러 항목(tone+motion+avoid)에
파급되고, 여러 표현이 한 항목으로 수렴한다. 충돌은 §3에서 명시적으로 해소한다.

### 2.2 항목별 산출 형태 (design-profile.json 필드에 직결)

| # | 번역 항목 | 프로필 필드 | 값의 형태 / 허용값 |
|---|----------|-------------|--------------------|
| 1 | visual tone | `visual_tone[]` | restrained / editorial / warm-neutral / low-decoration / high-legibility … (자유 문자열, 사전 어휘 우선) |
| 2 | 브랜드 인상 | `brand_impression[]` | `{trait, priority}` 우선순위 배열. trait ∈ 신뢰/전문성/속도/친근함/차분함/실험성/고급스러움/인간적/기술적 |
| 3 | 정보 밀도 | `information_density` | `{level: low\|medium\|medium-high\|high, notes[]}` |
| 4 | 타이포 방향 | `typography` | `{direction[], hierarchy: weak\|medium\|strong, body_readability: low\|medium\|high}` |
| 5 | 색상 방향 | `color` | `{direction[], avoid[]}` (구체 hex 아님 — *방향*만. 실제 값은 `/design-system`의 `design/TOKENS.json`이 정함) |
| 6 | 레이아웃 구조 | `layout` | `{navigation, content_width: fixed\|adaptive\|fluid, alignment, spacing: compact\|comfortable\|spacious}` |
| 7 | 모서리·표면 | `surface` + `radius` + `shadow` | surface: flat\|flat-with-border\|subtle-elevation\|elevated · radius: none\|small\|medium\|large · shadow: none\|subtle\|medium\|strong |
| 8 | 컴포넌트 밀도 | `information_density.notes[]` + `layout.spacing` | 컨트롤 크기·카드 사용량·테이블 우선 여부를 notes에 기술 |
| 9 | 이미지·아이콘 방향 | `visual_tone[]` 보강 + `avoid[]` | 사진 vs 일러스트 vs 추상, 아이콘 스타일(라인/솔리드), 장식 이미지 금지 여부 |
| 10 | 모션 수준 | `motion_level` | none \| minimal \| moderate \| expressive |
| 11 | 접근성 | `accessibility[]` | 예: 대비 AA 이상, 색에만 의존 금지, 키보드 포커스, 본문 16px 이상 |
| 12 | 금지 요소 | `avoid[]` | decorative-gradients, glassmorphism, oversized-hero, excessive-rounded-cards, purple-gradients … (CONTRACT §7 안티패턴 어휘와 정합) |

> 색상은 **방향만** 번역한다("낮은 채도의 웜 뉴트럴", "강조색 1개"). 구체 hex/OKLCH 값은
> 이 단계의 책임이 아니다 — `/design-system` 의 `design/TOKENS.json` 이 단일 출처다.

---

## 3. 충돌 해소 — 이 단계의 가장 중요한 판단

브리프의 표현들은 자주 **서로 모순**된다. 모순을 조용히 한쪽으로 뭉개지 말고 **드러내고
해석 근거를 기록**한다. 이것이 "생성보다 판단" 정신의 핵심이다.

흔한 충돌 유형:

| 충돌 | 해석 원칙 |
|---|---|
| "자료 많이"(고밀도) ↔ "복잡해 보이지 않게"(저인지부하) | 밀도는 유지하되 *시각적* 복잡도를 낮춘다 → `medium-high` + `notes:[clear grouping, limited card usage, generous line-height]`. 카드 남발(안티패턴 #2)로 정보를 쪼개지 않는다. |
| "고급스럽게"(여백·여유) ↔ "정보 많이"(조밀) | 가중치(§7)로 판정. 업무 도구면 product 비중↑ → density 우선, 여백은 `comfortable`까지만. |
| "친근하게"(둥근 모서리·따뜻) ↔ "전문적으로"(절제) | radius `small`~`medium` 절충 + 따뜻함은 색 hue로만, 모서리 과장(안티패턴 #4)은 회피. |
| "트렌디하게" ↔ "오래 질리지 않게" | 트렌드성 장식은 `avoid`로, 지속성은 `visual_tone:[restrained]`로. 트렌드는 콘텐츠 레이아웃이 아닌 *디테일*에서만. |

처리 절차:
1. 충돌 쌍을 모두 나열한다.
2. **가중치(CONTRACT §17)** 로 우선순위를 정한다:
   - 브랜드 있는 프로젝트: **제품 특성 0.5 / 사용자 취향 0.3 / 기존 브랜드 0.2**
   - 브랜드 없는 신규: **제품 특성 0.6 / 사용자 취향 0.4**
   - `weighting` 필드에 정확히 기록(합 = 1.0). 사용자 취향은 절대 규칙이 아니라 *가중 입력*.
3. 해소 결과가 **명백하면** `confirmed`, 한쪽으로 *해석*한 것이면 `assumed`에 넣는다.
4. 해석이 갈릴 여지가 크면 → **§4 사용자 확인**으로 넘긴다.

---

## 4. 사용자 확인 — `AskUserQuestion` (해석이 갈릴 때만)

번역은 자동 확정이 아니다. 그러나 **모든 항목을 다 묻지도 않는다**(질문 피로 방지).
다음 경우에만 묻고, 반드시 `AskUserQuestion` 툴을 쓴다(텍스트로 던지고 기다리지 않는다):

- 가중치로도 판정이 갈리는 **핵심 충돌**(예: 밀도 vs 여백이 제품 정체성을 가른다)
- 브리프에 근거가 없어 `assumed`가 된 **방향성 큰 항목**(예: navigation 형태, 타이포 serif 여부)
- 사용자가 "싫다"만 말하고 "대신 무엇"을 안 준 금지 항목의 **대안 방향**

질문 설계 규칙:
- 한 번에 묶어서 묻는다(2~4개 질문 한 묶음). 각 질문은 **구체적 선택지 + 짧은 결과 설명**.
- 추상어로 묻지 않는다. ❌ "어떤 분위기를 원하세요?" → ⭕ 측정 가능한 갈림길로:

```
AskUserQuestion 예시(밀도 vs 여백 충돌):
  question: "정보가 많은 화면에서 우선할 방향은?"
  options:
    - label: "한눈에 많이"   description: "compact 간격·테이블 우선. 스캔 빠름, 학습비용↑"
    - label: "차분하게 적게"  description: "comfortable 간격·그룹 분리. 여유롭지만 스크롤↑"
    - label: "상황별로"       description: "목록은 조밀, 상세는 여유 (화면별 분리)"
```

확인 결과는 즉시 해당 항목을 `assumed` → `confirmed` 로 승격하고, `sources`에
"사용자 확인(YYYY-MM-DD)"을 추가한다. 사용자가 답을 미루면 `assumed`로 두고 진행한다 —
**다음 단계 `/design-research`·`/design-compare`가 후보를 통해 다시 검증**하므로 여기서
완벽히 확정할 필요는 없다.

---

## 5. 산출 1 — `design/DESIGN-TRANSLATION.md`

사람이 읽는 번역 문서. 아래 구조를 따른다(한국어).

```markdown
# 디자인 번역 — {프로젝트명}

> 사용자의 표현을 구현 가능한 디자인 기준으로 옮긴 문서.
> 확정(confirmed)과 추정(assumed)을 분리했다. 추정은 /design-research·/design-compare에서 검증된다.

## 0. 가중치
- 제품 특성 {0.5} / 사용자 취향 {0.3} / 기존 브랜드 {0.2}   (근거: {브랜드 유무})

## 1. 표현 → 기준 매핑 (12항목)
| 항목 | 사용자 원문(인용) | 사전 경유 | 번역 결과 | 근거 | 상태 |
|------|------------------|----------|-----------|------|------|
| visual tone | "질리지 않게" | 차분→저채도·장식절제 | restrained, low-decoration | 브리프 §2 | confirmed |
| 정보 밀도 | "자료 많지만 복잡해 보이지 않게" | 조밀+가독 | medium-high / clear grouping | 브리프 §3 | confirmed |
| … (12항목 전부) |

## 2. 충돌과 해소
- **밀도 vs 여백**: "자료 많이" ↔ "복잡해 보이지 않게" → 밀도 유지·시각 복잡도↓. 카드 남발 회피. (가중치 product 우세 → 밀도 우선)
- … (모든 충돌 쌍)

## 3. 금지 요소 (avoid) + 이유
- decorative-gradients — "스타트업 느낌 싫음" + 안티패턴 #1
- glassmorphism — 근거 없음·가독 저하 + 안티패턴 #5
- … (각 항목에 사용자 발언 또는 안티패턴 번호 근거)

## 4. 추정 항목 (assumed) — 다음 단계에서 검증 대상
- navigation: persistent-left-sidebar (브리프에 명시 없음 → 업무 도구 관행으로 추정)
- typography serif 여부: 미정 → /design-compare 후보로 대조 예정
```

규칙:
- **모든 줄에 근거**. 근거 없는 단정 금지.
- `confirmed`/`assumed`를 행 상태로 명시. 추정을 확정처럼 쓰지 않는다.
- 금지 요소는 CONTRACT §7 안티패턴 번호와 연결.

---

## 6. 산출 2 — `design/design-profile.json`

기계가 읽는 프로필. **`schemas/design-profile.schema.json` 형태(CONTRACT §4.1)를 정확히
따른다.** 추가 키 금지(`additionalProperties:false`). 아래는 *형태* 예시다 — 값은 브리프에서
도출한 실제 값으로 채운다.

```json
{
  "project": "{프로젝트 식별자}",
  "generatedAt": "{ISO 8601 date-time}",
  "visual_tone": ["restrained", "editorial", "warm-neutral", "low-decoration", "high-legibility"],
  "brand_impression": [
    { "trait": "신뢰", "priority": 1 },
    { "trait": "전문성", "priority": 2 },
    { "trait": "차분함", "priority": 3 }
  ],
  "information_density": {
    "level": "medium-high",
    "notes": ["compact controls", "clear grouping", "limited card usage", "table-first for lists"]
  },
  "typography": {
    "direction": ["humanist-sans", "optional-serif-display"],
    "hierarchy": "strong",
    "body_readability": "high"
  },
  "color": {
    "direction": ["low-saturation", "warm-neutral-base", "single-accent"],
    "avoid": ["pure-black", "pure-white", "tailwind-default-blue", "purple-gradients"]
  },
  "layout": {
    "navigation": "persistent-left-sidebar",
    "content_width": "adaptive",
    "alignment": "left-aligned-with-strong-grid",
    "spacing": "comfortable"
  },
  "surface": "flat-with-border",
  "radius": "small",
  "shadow": "subtle",
  "motion_level": "minimal",
  "accessibility": [
    "contrast-AA-or-higher",
    "no-color-only-status",
    "visible-keyboard-focus",
    "body-text-16px-min",
    "respect-prefers-reduced-motion"
  ],
  "avoid": [
    "decorative-gradients",
    "glassmorphism",
    "oversized-hero",
    "excessive-rounded-cards",
    "all-content-as-cards",
    "fake-statistics"
  ],
  "weighting": { "product": 0.5, "taste": 0.3, "brand": 0.2 },
  "confirmed": [
    "visual_tone",
    "information_density.level",
    "typography.hierarchy",
    "avoid"
  ],
  "assumed": [
    "layout.navigation",
    "typography.direction.serif",
    "color.direction"
  ],
  "sources": [
    "design/DESIGN-BRIEF.md §2 사용자 인터뷰",
    "design/DESIGN-BRIEF.md §3 정보 구조",
    "사용자 확인(2026-06-20)",
    "~/.design-director/profile.json 과거 선택 이력"
  ]
}
```

### 스키마 준수 체크 (저장 전)
- [ ] `weighting.product + taste + brand == 1.0` (브랜드 없으면 brand 0)
- [ ] `confirmed` ∩ `assumed` = ∅ (같은 항목이 양쪽에 들어가지 않음)
- [ ] `brand_impression`은 `priority` 오름차순(1이 최우선) 정렬
- [ ] `information_density.level` ∈ {low, medium, medium-high, high}
- [ ] `surface`/`radius`/`shadow`/`motion_level` 모두 §4.1 허용 enum 값
- [ ] `color.direction`에 **구체 hex 없음** (방향 어휘만 — hex는 `design/TOKENS.json` 책임)
- [ ] `avoid`에 `pure-black`/`pure-white`/`tailwind-default-blue`/`purple-gradients` 등 AI slop 어휘가 적절히 포함
- [ ] `sources`에 최소 1개 실제 근거 경로/발언

> `~/.design-director/profile.json` 의 과거 취향은 `assumed`/가중에만 반영하고
> `confirmed`로 올리지 않는다(프로젝트마다 제품 특성이 우선).

---

## 7. 품질 체크 (완료 선언 전)

| 체크 | 통과 기준 |
|------|----------|
| 12항목 누락 없음 | CONTRACT §10 12항목 모두 프로필에 반영 |
| 근거 추적성 | TRANSLATION.md 모든 행에 `sources` 근거 존재 |
| confirmed/assumed 분리 | 추정을 확정으로 단정한 줄 0건 |
| 충돌 명시 | 발견된 모든 모순이 §2 충돌 표에 기록·해소 |
| 사전 정합 | 매핑이 `references/design-vocabulary.md`와 충돌 없음 |
| AI slop 자가검열 | 산출 문서·예시 자체가 순수 #000/#fff·기본 보라파랑·이모지·가짜 수치·균등 카드 그리드를 권하지 않음 |
| 스키마 유효 | `design/design-profile.json`이 `schemas/design-profile.schema.json` 통과(§6 체크리스트) |

> 이 단계는 디자인을 **만들지 않는다**. 토큰의 구체 hex 값, 컴포넌트 코드, 화면 목업을
> 여기서 생성하면 안 된다. 그것들은 `/design-system`·`/design-prototype`의 책임이다.

---

## 8. 다음 단계 안내

번역이 끝나면 사용자에게 다음을 알린다:

> 번역 완료 — `design/DESIGN-TRANSLATION.md` + `design/design-profile.json` 생성.
> 다음은 **`/design-research`**: 이 프로필을 검색 질의·후보 평가 기준으로 삼아 실제 서비스
> 레퍼런스 3~7개를 탐색·평가합니다. 특히 `assumed`로 남긴 항목
> (예: navigation 형태, serif 여부, 색 방향)은 `/design-compare`에서 후보를 나란히 비교하며
> *당신의 선택으로* 확정됩니다.

`assumed` 항목 목록을 함께 보여줘, 사용자가 "이건 지금 정하고 싶다"면 §4 확인을 한 번 더
돌릴 수 있게 한다. 강제로 모두 확정시키지 않는다 — **선택은 비교 단계의 몫**이다.
