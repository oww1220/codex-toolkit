# 디자인 어휘 사전 — 사용자 언어 → 디자인 언어 번역

> `/design-translate` 가 사용자의 일상 표현·형용사를 **구현 가능한 디자인 토큰·속성**으로 옮길 때
> 참조하는 매핑 사전. 산출물 `design/DESIGN-TRANSLATION.md` 와 `design/design-profile.json` 의
> 근거가 된다. (BUILD CONTRACT §10)

---

## 이 사전을 쓰는 방식

1. **말을 그대로 믿지 않는다.** "미니멀하게"가 한 사람에게는 *여백 많음*, 다른 사람에게는 *장식 없음*이다.
   사전은 한 표현이 가질 수 있는 **여러 토큰 해석**을 펼쳐 보여주고, 어느 쪽인지 후보 비교(`/design-compare`)로 확인하게 한다.
2. **모든 번역은 12개 변환 항목으로 떨어진다**(CONTRACT §10): visual tone, 브랜드 인상, 정보 밀도,
   타이포 방향, 색상 방향, 레이아웃 구조, 모서리·표면, 컴포넌트 밀도, 이미지·아이콘 방향, 모션 수준, 접근성, 금지 요소.
3. **출력은 `design-profile.json` 필드로 매핑**된다. 각 어휘 항목 끝에 어떤 필드에 떨어지는지 표기.
4. **확정과 추정을 분리**한다(`profile.confirmed` vs `profile.assumed`). 사전은 *추정의 출발점*이지 확정이 아니다.

### 출력 표준 예시 (CONTRACT §10)

```yaml
입력: "오래 써도 질리지 않고 차분, 자료 많지만 복잡해 보이지 않게, 스타트업 느낌 싫음"
출력:
  visual_tone: [restrained, editorial, warm-neutral, low-decoration, high-legibility]
  information_density: { level: medium-high, notes: [compact controls, clear grouping, limited card usage] }
  typography: { direction: [humanist sans-serif, optional serif display], hierarchy: strong }
  color: { direction: [warm-neutral, low-saturation], avoid: [tech-blue, neon] }
  avoid: [decorative gradients, excessive rounded cards, oversized hero copy, glassmorphism]
```

---

## A. 핵심 어휘 → 토큰·속성 번역표

각 행: **형용사/요청어** → (정보밀도 / 타이포 / 색상 / 레이아웃 / 모서리·표면 / 모션 / 금지 요소).
값은 `design-profile.json`·`TOKENS.json` 의 enum·키와 정합한다.

### 1. 차분한 / 안정적인

| 차원 | 번역 |
|------|------|
| 정보밀도 | medium — 여백 일관, 과밀 회피 |
| 타이포 | humanist-sans, hierarchy medium~strong, body_readability high, 큰 굵기 대비 자제 |
| 색상 | 낮은 채도, neutral 베이스, accent 1색 저채도. avoid: neon, 고채도 |
| 레이아웃 | 예측 가능한 정렬, 그리드 정연, 급격한 비대칭 자제 |
| 모서리·표면 | radius sm~md, surface flat / flat-with-border, shadow subtle |
| 모션 | motion_level minimal — duration base/slow, easing standard. 튀는 바운스 금지 |
| 금지 | decorative-gradients, 장식 glow, 빠른 과장 모션 |

→ `visual_tone:[restrained]`, `brand_impression: 차분함`, `motion_level: minimal`

### 2. 신뢰가는 / 믿음직한 / 안전한

| 차원 | 번역 |
|------|------|
| 정보밀도 | medium~medium-high — 명확한 그룹핑, 정보 은폐 회피 |
| 타이포 | 안정적 sans(또는 serif display 약간), hierarchy strong, 일관된 사이즈 스케일 |
| 색상 | 절제된 팔레트, accent 1색, semantic 색 의미 고정. 과한 색 변주 금지 |
| 레이아웃 | 정렬 일관, 표준 패턴(예측 가능성↑), 비표준 인터랙션 자제 |
| 모서리·표면 | radius none~md, surface flat-with-border, shadow none~subtle |
| 모션 | minimal — 상태 전달 모션만, 장식 모션 자제 |
| 금지 | 가짜 수치(패턴 16), 글래스모피즘, 과장된 마케팅 히어로 |

→ `brand_impression: 신뢰/전문성`, `surface: flat-with-border`

### 3. 조밀한 / 밀도 높은 / 정보 많은

| 차원 | 번역 |
|------|------|
| 정보밀도 | high — compact spacing, 테이블·리스트 우선, 카드 최소화 |
| 타이포 | fontSize sm~base 본문, lineHeight tight~normal, hierarchy 명확하되 컴팩트 |
| 색상 | 저채도 배경(눈 피로↓), 구분선·미세 배경톤으로 그룹. 강조색 절제 |
| 레이아웃 | 다열·테이블·고정/적응 폭, 한 화면 많은 정보, 스크롤 최소 |
| 모서리·표면 | radius none~sm, surface flat / flat-with-border, shadow none(구분은 border) |
| 모션 | minimal — 대량 데이터에서 모션은 방해 |
| 금지 | 과도한 여백(패턴 12), 모든 콘텐츠 카드화(패턴 2), 큰 radius |

→ `information_density:{level:high}`, `layout.spacing: compact`

### 4. 고급스러운 / 프리미엄 / 세련된

| 차원 | 번역 |
|------|------|
| 정보밀도 | low~medium — 의도적 여백, 선택과 집중 |
| 타이포 | serif-display 또는 정제된 sans, letterSpacing 미세 조정, hierarchy strong, 큰 사이즈 대비 |
| 색상 | 절제된 단색·뉴트럴 + 깊은 톤, off-black(#08060D 류)·off-white, 금속/딥 1 accent |
| 레이아웃 | 비대칭 위계, 넉넉한 마진, 정밀한 정렬 |
| 모서리·표면 | radius none~sm(샤프) 또는 일관된 md, surface flat, shadow subtle |
| 모션 | minimal~moderate — 느리고 부드러운 ease, 절제된 전환 |
| 금지 | 순수 #000/#fff, 과한 그림자, 컬러풀 그라데이션, 균등 카드 그리드 |

→ `visual_tone:[refined]`, `brand_impression: 고급스러움`, `color.avoid:[pure-black, pure-white]`

### 5. 친근한 / 따뜻한 / 다가가기 쉬운

| 차원 | 번역 |
|------|------|
| 정보밀도 | low~medium — 부담 없는 양, comfortable spacing |
| 타이포 | rounded/humanist sans, hierarchy medium, body high, 친근한 본문 크기 |
| 색상 | warm-neutral, 부드러운 채도, 따뜻한 accent 1색 |
| 레이아웃 | 여유 있는 간격, 부드러운 구획, 둥근 컨테이너 |
| 모서리·표면 | radius md~lg, surface subtle-elevation, shadow sm |
| 모션 | moderate — 부드러운 ease, 작은 환영 인터랙션(과하지 않게) |
| 금지 | 차가운 tech-blue 일색, 날카로운 0 radius 일색, 딱딱한 표 위주 |

→ `visual_tone:[warm-neutral]`, `radius: large`, `brand_impression: 친근함`

### 6. 전문적인 / 업무용 / 비즈니스

| 차원 | 번역 |
|------|------|
| 정보밀도 | medium-high~high — 효율 우선, 핵심 작업 중심 |
| 타이포 | 가독성 높은 sans, hierarchy strong, 명확한 라벨, mono(데이터/코드) 보조 |
| 색상 | 뉴트럴 + accent 1색, semantic 색 의미 고정, 차분한 채도 |
| 레이아웃 | persistent-left-sidebar 또는 top-bar, 테이블·필터·일괄작업, 적응형 폭 |
| 모서리·표면 | radius sm~md, surface flat-with-border, shadow subtle |
| 모션 | minimal — 작업 흐름을 방해하지 않는 즉각 피드백 |
| 금지 | 마케팅 히어로(패턴 7), 장식 우선(패턴 13), pill·큰 radius 남발 |

→ `layout.navigation: persistent-left-sidebar`, `information_density: medium-high`

### 7. 빠른 / 즉각적인 / 효율적인

| 차원 | 번역 |
|------|------|
| 정보밀도 | medium-high — 한눈에 파악, 클릭 최소 |
| 타이포 | 명료한 sans, 강한 위계로 즉시 스캔, 핵심 강조 |
| 색상 | 고대비 핵심 액션(accent), 나머지 절제로 액션 부각 |
| 레이아웃 | command-search 보조, 단축경로, 핵심 작업 first-fold, 불필요 단계 제거 |
| 모서리·표면 | radius sm, surface flat, shadow none~subtle |
| 모션 | minimal — duration fast, 지연 없는 즉각 피드백, 긴 전환 금지 |
| 금지 | 느린 장식 모션, 다단계 마법사 남용, fold 아래로 핵심 밀기 |

→ `layout.navigation: command-search`, `motion.duration: fast`

### 8. 실험적인 / 대담한 / 개성있는

| 차원 | 번역 |
|------|------|
| 정보밀도 | 콘텐츠에 따라 가변 — 단 의미 있는 비대칭 |
| 타이포 | display 800+ 큰 대비, serif+sans pair, 독특한 위계(근거 있는 파격) |
| 색상 | 강한 1 accent + 절제된 나머지(컬러풀≠개성), 의외의 뉴트럴 |
| 레이아웃 | 비대칭 dominant, 파격 그리드, 섹션마다 다른 리듬(패턴 18 회피) |
| 모서리·표면 | 일관된 극단(전부 0 또는 명확한 곡률), 의도된 표면 대비 |
| 모션 | moderate~expressive — 단 의미·상태 전달과 결합 |
| 금지 | 균등 그리드(개성처럼 보이나 평범), 무의미한 글로우/입자, 가짜 파격 |

→ `visual_tone:[bold, editorial]`, `motion_level: expressive`(단 접근성 reduced-motion 대응)

### 9. 인간적인 / 손맛 / 유기적인

| 차원 | 번역 |
|------|------|
| 정보밀도 | low~medium — 읽기 리듬 중심 |
| 타이포 | humanist-sans / serif, 자연스러운 lineHeight relaxed, 큰 본문 가독 |
| 색상 | warm-neutral, 종이 같은 off-white, 흙/잉크 톤 accent |
| 레이아웃 | editorial 흐름, 비대칭 자연스러움, 손그림/실사 이미지 |
| 모서리·표면 | radius sm~md, surface flat, 미세 텍스처(과하지 않게) |
| 모션 | moderate — 자연스러운 ease(기계적 linear 회피) |
| 금지 | 차가운 grid 일색, 합성 그라데이션, 기계적 균일 모션 |

→ `visual_tone:[warm-neutral, editorial, human]`

### 10. 기술적인 / 정밀한 / 엔지니어링

| 차원 | 번역 |
|------|------|
| 정보밀도 | high — 데이터·상태·정밀 정보 노출 |
| 타이포 | sans + mono(데이터/코드/ID), hierarchy strong, 정확한 사이즈 스케일 |
| 색상 | 뉴트럴 + 기능적 semantic 색, 저채도, 상태=색 일관 |
| 레이아웃 | 격자 정밀, 테이블·로그·차트, monospace 정렬, 고정폭 |
| 모서리·표면 | radius none~sm(샤프), surface flat-with-border, shadow none |
| 모션 | minimal — 결정론적, 상태 전이 명확 |
| 금지 | 둥글둥글 친근 톤, 장식 글로우, 마케팅 카피 |

→ `typography.direction:[humanist-sans, mono]`, `surface: flat-with-border`

---

## B. 추가 어휘 (10+ 더 — 빠른 매핑)

| 어휘 | 핵심 번역 (밀도 / 타이포 / 색 / 레이아웃 / 표면 / 모션) | profile 매핑 |
|------|--------|------|
| **깔끔한/정돈된** | medium · 강한 위계 · 뉴트럴 · 정연 그리드 · flat · minimal | visual_tone:[restrained, clean] |
| **모던한** | medium · sans 강한 대비 · 뉴트럴+1 accent · 비대칭 · flat · minimal. 단 "modern"=보라그라데이션 함정 경계 | avoid:[generic-saas-gradient] |
| **클래식/전통적** | medium · serif display · 깊은 뉴트럴 · 정렬 위계 · flat-border · minimal | typography.direction:[serif-display] |
| **에너지틱/활기찬** | medium · 굵은 display · 선명 1 accent · 동적 비대칭 · subtle-elevation · moderate | motion_level: moderate |
| **미니멀** | (모호!) → 두 갈래 확인: ⓐ 여백형(low density, spacious) ⓑ 무장식형(medium density, low-decoration) | compare 로 확정 |
| **럭셔리** | low · serif/정제 sans · 딥+메탈 1색 · 넉넉 마진 비대칭 · flat · minimal-moderate | =고급스러운 |
| **플레이풀/재미있는** | low-medium · rounded · 따뜻 다소 채도 · 둥근 컨테이너 · subtle-elevation · moderate-expressive | radius: large, motion: moderate |
| **시리어스/진중한** | medium-high · 안정 sans/serif · 뉴트럴 · 정연 · flat-border · minimal | brand_impression: 전문성 |
| **밝은/경쾌한** | low-medium · 가벼운 weight · 밝은 뉴트럴+따뜻 accent · 여유 · subtle-elevation · moderate | color.direction:[warm-light] |
| **다크/무게있는** | medium · 강한 대비 · off-black 베이스 · 비대칭 dominant · flat · minimal | color.direction:[dark-neutral] |
| **데이터 중심** | high · sans+mono · 기능 semantic · 테이블/차트 · flat-border · minimal | =기술적 |
| **읽기 편한/가독성** | low-medium · 큰 본문 humanist/serif · 고대비 텍스트 · 단일 칼럼 흐름 · flat · minimal | typography.body_readability: high |

---

## C. 금지 요소 어휘 → `profile.avoid` 매핑

사용자가 "~느낌 싫다" 고 말한 것을 구체적 금지 토큰으로.

| 사용자 표현 | profile.avoid 값 |
|-------------|------------------|
| "스타트업/AI 느낌 싫음" | decorative-gradients, generic-saas-gradient, oversized-hero, glow |
| "유치한 거 싫음" | oversized-rounded-cards, neon, excessive-emoji-ish-decoration |
| "차가운 느낌 싫음" | pure-tech-blue, sharp-0-radius-everywhere, cold-gray-only |
| "복잡해 보이는 거 싫음" | every-content-as-card, too-many-accent-colors, dense-decoration |
| "촌스러운 거 싫음" | gradient-text, drop-shadow-everywhere, inconsistent-radius |
| "떠 있는/유리 느낌 싫음" | glassmorphism, floating-cards, heavy-shadows |
| "정신없는 거 싫음" | decorative-particles, full-screen-gradient, animation-everywhere |

→ 이 값들은 그대로 안티패턴 카탈로그(`references/anti-patterns.md`)와 연결된다.

---

## D. 상충 표현 충돌 해결 가이드

사용자는 흔히 양립 어려운 표현을 함께 쓴다. 사전은 충돌을 **자동으로 한쪽 편들지 않고**,
*조정안 + 확인 질문*으로 처리한다(`AskUserQuestion`).

| 충돌 쌍 | 왜 충돌 | 조정 원칙 | 확인 질문(요지) |
|---------|---------|-----------|-----------------|
| **고급스러운 ↔ 친근한** | 절제·여백 vs 따뜻·둥근 | warm-neutral 팔레트 + 정제 타이포 + radius md(극단 회피) | "딱 떨어지는 정제 쪽 vs 말랑 따뜻 쪽, 어디에 더 가깝나요?" |
| **조밀한 ↔ 여백 많은/미니멀** | high density vs spacious | 핵심 작업은 조밀, 진입/요약 화면은 여백. 밀도를 화면별로 분리 | "데이터 화면은 빽빽, 첫 화면은 여유 — 이 분리 괜찮나요?" |
| **신뢰가는 ↔ 실험적인** | 예측가능 표준 vs 파격 | 구조·인터랙션은 표준(신뢰), 시각 톤만 개성(타이포/색) | "구조는 익숙하게, 비주얼만 개성 — 이 균형?" |
| **빠른 ↔ 인간적인** | 즉각·효율 vs 손맛·여유 모션 | 작업 흐름은 빠르게(즉각 피드백), 톤·이미지는 인간적 | "속도 우선이되 따뜻한 디테일 — 동의?" |
| **모던한 ↔ 클래식** | 비대칭/sans vs 정렬/serif | serif display + 정렬 위계 + 절제 색(둘의 교집합) | "현대적 정돈 vs 전통적 묵직 — 비중은?" |
| **미니멀 ↔ 정보 많은** | 무장식 vs 고밀도 | "미니멀=무장식"으로 해석, density 는 medium-high 유지 | "장식을 줄이는 미니멀이지, 정보를 줄이는 건 아니죠?" |

### 충돌 처리 절차

1. 충돌 쌍 감지 → 어느 차원에서 충돌하는지 명시(밀도/모션/타이포 등).
2. **둘 다 만족하는 조정안**을 먼저 제시(한쪽 폐기 금지).
3. 그래도 트레이드오프가 남으면 `AskUserQuestion` 으로 비중 확인 → `profile.weighting` 반영.
4. 결과를 `profile.confirmed`(사용자 답) / `profile.assumed`(조정 추정)로 분리 기록.

---

## E. 번역 → `design-profile.json` 체크리스트

번역을 끝내기 전 아래가 모두 채워졌는지 확인:

- [ ] `visual_tone[]` — 2~5개, 서로 모순 없음(또는 D로 해소)
- [ ] `brand_impression[]` — 우선순위(`priority`) 부여, 1~4개
- [ ] `information_density.level` — low/medium/medium-high/high 중 1 + notes
- [ ] `typography.direction/hierarchy/body_readability` — 진부 폰트 단독 금지(Inter/Roboto 단독 회피)
- [ ] `color.direction[]` + `color.avoid[]` — 순수 #000/#fff·tech-blue 일색 회피
- [ ] `layout.navigation/content_width/alignment/spacing`
- [ ] `surface / radius / shadow / motion_level`
- [ ] `accessibility[]` — 색 비의존 상태표시, 대비, reduced-motion 등
- [ ] `avoid[]` — C·D 에서 도출된 금지 요소(안티패턴 연결)
- [ ] `weighting{product,taste,brand}` 합=1.0 (CONTRACT §17: 브랜드有 50/30/20, 신규 60/40)
- [ ] `confirmed[] / assumed[]` 분리, `sources[]` 명시

> **핵심 정신**: 사전은 *추정의 출발점*이다. 최종 확정은 사용자가 후보를 보고 선택할 때(`/design-compare` → `/design-select`) 이뤄진다. 번역은 "말"을 "비교 가능한 디자인 가설"로 바꾸는 단계다.
