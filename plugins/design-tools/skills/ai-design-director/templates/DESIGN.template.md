<!--
============================================================================
이 템플릿은 /design-system 커맨드가 채운다.
산출 경로: design/DESIGN.md
입력: design/DESIGN-DIRECTION.md + design/selection.json + design/design-profile.json
짝 산출물(같은 단계): design/TOKENS.json (값의 단일 출처), design/COMPONENTS.md,
  design/UX-PATTERNS.md, design/CONTENT-STYLE.md, design/MOTION.md,
  design/ACCESSIBILITY.md, design/ANTI-PATTERNS.md, design/REFERENCES.md
다음 단계: /design-prototype (이 시스템으로 핵심 흐름 목업)

[작성 가이드]
- 이 문서는 *철학·원칙* 문서다. 구체적 값(hex/px/폰트명/그림자 수치)은 적지 않는다.
  모든 값은 design/TOKENS.json 이 단일 출처다. 본문에서는 "토큰 그룹"을 참조한다.
  예: "강조색은 design/TOKENS.json 의 color.accent 1색만 사용" (hex 인라인 금지).
- "DON'T" 항목은 CONTRACT §7 의 안티패턴 20 과 정합. 단 *절대 금지*가 아니라
  "제품 목적/사용자 행동을 어떻게 돕는가에 답 못 하면 안 쓴다" 원칙으로 서술.
- 진부한 AI 기본값을 이 문서 안에서도 피한다: 순수 #000/#fff 금지(off-black/off-white),
  Tailwind 기본 보라/파랑 금지, 이모지 장식 금지, 가짜 수치 금지, 균등 카드 그리드 금지.
- 사용자 프로젝트 CLAUDE.md 연동 블록(CONTRACT §16) 추가를 /design-system 이 제안한다.
============================================================================
-->

# 디자인 시스템 — {{project_name}}

> 출처: `/design-system` / {{generated_at}}
> **값의 단일 출처: `design/TOKENS.json`** — 이 문서는 원칙을, 토큰 파일은 값을 가진다.
> 관련 문서: `design/COMPONENTS.md`, `design/UX-PATTERNS.md`, `design/CONTENT-STYLE.md`,
> `design/MOTION.md`, `design/ACCESSIBILITY.md`, `design/ANTI-PATTERNS.md`, `design/REFERENCES.md`

---

## 1. 디자인 철학

> <!-- 가이드: 이 제품 디자인을 한 문단으로 관통하는 명제. DESIGN-DIRECTION §6 종합 서술에서.
> "이 제품의 디자인은 ___ 를 위해 ___ 를 택한다" 형식. 장식 언어 금지. -->

{{design_philosophy}}

**핵심 명제 3가지**
1. {{philosophy_point_1}}
2. {{philosophy_point_2}}
3. {{philosophy_point_3}}

---

## 2. 브랜드 인상 (우선순위 순)

<!-- 가이드: design-profile.json 의 brand_impression 을 우선순위대로. 각 인상이
어떤 디자인 결정으로 구현되는지 한 줄. -->

| 우선순위 | 인상 | 구현 방식 (토큰/원칙 참조) |
|---------|------|---------------------------|
| 1 | {{impression_1}} | {{impression_1_impl}} |
| 2 | {{impression_2}} | {{impression_2_impl}} |
| 3 | {{impression_3}} | {{impression_3_impl}} |

---

## 3. 사용 환경

<!-- 가이드: 어디서·어떻게·얼마나 자주 쓰는가가 밀도·대비·터치 타깃을 결정한다. -->

| 항목 | 내용 | 디자인 함의 |
|------|------|------------|
| 주 디바이스 | {{primary_device}} | {{device_implication}} |
| 사용 맥락 | {{usage_context}} <!-- 장시간 업무 / 짧은 모바일 세션 --> | {{context_implication}} |
| 환경 조명·상황 | {{environment}} <!-- 사무실 / 현장 / 야외 --> | {{environment_implication}} |

---

## 4. 핵심 디자인 원칙

<!--
가이드: 이 제품만의 운영 원칙 4~6개. 일반론("일관성 있게") 금지 — 검증 가능하게.
나쁜 예: "깔끔하게". 좋은 예: "한 화면에 강조색은 1곳만 — color.accent 외 강조 금지".
각 원칙은 위반 여부를 /design-audit 에서 판정할 수 있어야 한다.
-->

1. **{{principle_1_title}}** — {{principle_1_desc}}
2. **{{principle_2_title}}** — {{principle_2_desc}}
3. **{{principle_3_title}}** — {{principle_3_desc}}
4. **{{principle_4_title}}** — {{principle_4_desc}}

---

## 5. 시각 위계 (Visual Hierarchy)

<!--
가이드: 사용자의 눈이 어디로 먼저 가야 하는가. 화면당 1개 dominant + 보조.
균등 나열(모든 요소 같은 크기/무게) 은 위계 부재 — 금지.
-->

- **1차 (가장 먼저 보여야 할 것)**: {{hierarchy_primary}}
- **2차 (그다음)**: {{hierarchy_secondary}}
- **3차 (배경·보조)**: {{hierarchy_tertiary}}
- **위계 구현 수단**: 크기(`typography.fontSize`) · 무게(`typography.fontWeight`) · 색(`color.text`) · 간격(`spacing`). <!-- 4개를 동시에 같은 방향으로 쓰지 말 것: 1~2개로 충분 -->

---

## 6. 색상 원칙

> **값 출처: `design/TOKENS.json` 의 `color.*`**

<!--
가이드:
- hex 를 여기 적지 않는다. 토큰 그룹과 *사용 규칙*만.
- 토큰 그룹(CONTRACT §5): color.background{base,subtle,muted} / surface{default,raised,sunken}
  / text{primary,secondary,muted,inverse} / border{default,strong,subtle}
  / accent{default,hover,subtle,contrast} / semantic{success,warning,danger,info}.
- 순수 #000/#fff 는 TOKENS.json 에서부터 금지(off-black/off-white). 여기선 그 원칙만 명시.
- accent 1색 원칙: 강조색 남발 금지.
-->

| 역할 | 토큰 그룹 | 사용 규칙 |
|------|-----------|-----------|
| 배경 | `color.background` | {{color_bg_rule}} |
| 표면(카드/패널) | `color.surface` | {{color_surface_rule}} |
| 텍스트 | `color.text` | {{color_text_rule}} <!-- primary/secondary/muted 위계 분리 --> |
| 보더 | `color.border` | {{color_border_rule}} |
| 강조 | `color.accent` | {{color_accent_rule}} <!-- 한 화면 1곳 원칙 --> |
| 의미색 | `color.semantic` | {{color_semantic_rule}} <!-- success/warning/danger/info — 상태 전달에만 --> |

> **금지**: 순수 `#000`/`#fff` 직접 사용, 근거 없는 그라데이션, `color.accent` 외 추가 강조색. <!-- 안티패턴 #1, #19 -->

---

## 7. 타이포그래피 원칙

> **값 출처: `design/TOKENS.json` 의 `typography.*`**

<!--
가이드:
- 폰트명·px 를 여기 적지 않는다. 방향과 위계 규칙만.
- display 폰트 800+ / body 400~500 분리(CONTRACT §5). display + body 같은 family 금지.
- 시스템 폰트 단독(Inter/Roboto/Arial/system-ui) 으로 display 쓰지 않는다.
-->

| 역할 | 토큰 | 원칙 |
|------|------|------|
| 디스플레이/제목 | `typography.fontFamily.display` + `fontWeight.bold~black` | {{type_display_rule}} |
| 본문 | `typography.fontFamily.body` + `fontWeight.regular~medium` | {{type_body_rule}} |
| 모노/수치 | `typography.fontFamily.mono` | {{type_mono_rule}} <!-- 표·코드·정렬 필요 수치 --> |
| 크기 스케일 | `typography.fontSize` (xs~4xl) | {{type_scale_rule}} |
| 행간 | `typography.lineHeight` (tight/normal/relaxed) | {{type_leading_rule}} |

> **금지**: display+body 동일 family, `font-weight` 일률 600, 그라데이션 텍스트, 모든 텍스트 center. <!-- 진부한 기본값 -->

---

## 8. 간격 원칙

> **값 출처: `design/TOKENS.json` 의 `spacing`** (4px 기반 스케일: 0,1,2,3,4,5,6,8,10,12,16)

<!-- 가이드: 임의 px 금지 — 토큰 스케일만. 밀도 수준(compact/comfortable/spacious)을 명시. -->

- **밀도 수준**: {{spacing_density}} <!-- design-profile.json layout.spacing -->
- **그룹 간 간격 규칙**: {{spacing_group_rule}}
- **요소 내부 패딩 규칙**: {{spacing_padding_rule}}

> **금지**: 토큰 외 임의 간격, 과도한 여백(장식이 정보 압도), 불일치 간격. <!-- 안티패턴 #12, #20 -->

---

## 9. 형태 — 모서리 · 선 · 면

> **값 출처: `design/TOKENS.json` 의 `radius`, `borderWidth`, `surface`**

| 속성 | 토큰 | 원칙 |
|------|------|------|
| 모서리 | `radius` (none/sm/md/lg/full) | {{radius_rule}} <!-- 과도한 라운드 금지(안티패턴 #4) --> |
| 보더 | `borderWidth` + `color.border` | {{border_rule}} |
| 표면 방식 | `surface` (flat / flat-with-border / subtle-elevation / elevated) | {{surface_rule}} |

---

## 10. 그림자 원칙

> **값 출처: `design/TOKENS.json` 의 `shadow`** (none/sm/md/lg)

<!-- 가이드: 그림자는 "떠 있어야 할 이유"가 있을 때만. 과도한 그림자·글로우 금지. -->

- **사용 기준**: {{shadow_usage}} <!-- 예: modal/dropdown 등 실제 부유 요소에만 --> 
- **글로우**: {{glow_policy}} <!-- 장식용 글로우 금지(안티패턴 #6) -->

> **금지**: 과도한 그림자, 장식용 글로우, 근거 없는 글래스모피즘. <!-- 안티패턴 #5, #6, #11 -->

---

## 11. 이미지 원칙

<!-- 가이드: 실사/일러스트/추상 도형 중 무엇을, 어떤 톤으로. 제품과 무관한 추상 구체·입자 금지. -->

- **이미지 방향**: {{image_direction}} <!-- 실사 / 라인 일러스트 / 추상 도형 / 없음 -->
- **처리 톤**: {{image_treatment}} <!-- 채도/대비/오버레이 -->
- **금지**: 제품과 무관한 추상 구체·입자·glow blob. <!-- 안티패턴 #9 -->

---

## 12. 아이콘 원칙

<!-- 가이드: 아이콘 세트 방향(라인/솔리드), 굵기 일관성, 의미 전달 용도. 모든 버튼/제목에 아이콘 금지. -->

- **아이콘 세트 방향**: {{icon_direction}} <!-- 일관된 한 세트(라인 또는 솔리드) -->
- **사용 기준**: {{icon_usage}} <!-- 의미 보조에만. 장식 금지 -->
- **금지**: 모든 버튼에 아이콘, 모든 제목 옆 아이콘, 혼합 아이콘 세트. <!-- 안티패턴 #8, #10 -->

---

## 13. 레이아웃 원칙

<!--
가이드: 내비게이션 구조 + 콘텐츠 폭 + 정렬. design-profile.json layout 참조.
균등 카드 그리드·모든 요소 중앙정렬·풀스크린 그라데이션 금지.
asymmetric weight(1 dominant + 보조) 권장.
-->

| 항목 | 방향 | 근거 |
|------|------|------|
| 내비게이션 | {{layout_nav}} <!-- persistent-left-sidebar / top-bar / command-search --> | {{layout_nav_why}} |
| 콘텐츠 폭 | {{layout_width}} <!-- fixed / adaptive / fluid --> | {{layout_width_why}} |
| 정렬 | {{layout_align}} | {{layout_align_why}} |
| 화면 구성 | {{layout_composition}} <!-- 1 dominant + 보조, 균등 그리드 지양 --> | {{layout_composition_why}} |

> **금지**: 반복 3열 카드 그리드, 모든 요소 중앙정렬, 풀스크린 장식 그라데이션, 흐름 없이 카드만 나열한 대시보드. <!-- 안티패턴 #2, #3, #17 -->

---

## 14. 반응형 원칙

> **값 출처: `design/TOKENS.json` 의 `breakpoint`** (mobile<640 / tablet 640-1024 / desktop>1024)

<!--
가이드: 모바일은 데스크톱 축소가 아니라 *재배치*(CONTRACT §8 Gate 6).
각 브레이크포인트에서 내비/밀도/터치 타깃이 어떻게 바뀌는지.
-->

| 브레이크포인트 | 내비게이션 | 밀도/레이아웃 변화 | 터치 타깃 |
|---------------|-----------|--------------------|-----------|
| mobile (<640) | {{rwd_mobile_nav}} | {{rwd_mobile_layout}} | ≥44px |
| tablet (640–1024) | {{rwd_tablet_nav}} | {{rwd_tablet_layout}} | ≥44px |
| desktop (>1024) | {{rwd_desktop_nav}} | {{rwd_desktop_layout}} | — |

> **금지**: 모바일 = 데스크톱 단순 축소, 잘리는 텍스트/버튼, 44px 미만 터치 타깃. <!-- 안티패턴 #14 -->

---

## 15. Do · Don't (요약 대조표)

<!-- 가이드: 위 원칙을 행동 지침으로 압축. 구현자가 빠르게 참조. -->

| ✅ Do | ❌ Don't |
|-------|---------|
| {{do_1}} | {{dont_1}} |
| {{do_2}} | {{dont_2}} |
| {{do_3}} | {{dont_3}} |
| {{do_4}} | {{dont_4}} |
| {{do_5}} | {{dont_5}} |

> 전체 안티패턴 목록은 `design/ANTI-PATTERNS.md`, 출처↔적용 매핑은 `design/REFERENCES.md` 참조.

---

## 16. 검증 연동

<!-- 가이드: 이 시스템이 어떻게 검증되는지. /design-audit 7게이트로 이어진다. -->

- 모든 UI 작업 전 이 문서(`design/DESIGN.md`)와 `design/TOKENS.json` 을 읽는다.
- 토큰에 없는 값 추가 시 `design/DECISION-LOG.md` 에 이유를 기록한다.
- 핵심 화면 구현 후 `/design-audit` 로 7대 품질 게이트를 검증한다.
- 선택한 레퍼런스를 그대로 복제하지 않는다(원칙만 차용 — `design/REFERENCES.md`).

---

<!--
[다음 단계]
이 시스템이 완성되면 /design-prototype 으로 핵심 사용자 흐름을 목업한다.
목업은 design/TOKENS.json 의 값만 사용하고, 이 문서의 원칙을 따른다.
구현 후 /design-audit 로 점수화(평균 ≥85 / 모든 항목 ≥75 / accessibility ≥80) 한다.
-->
