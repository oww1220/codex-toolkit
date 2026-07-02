<!--
============================================================================
이 템플릿은 /design-select 커맨드가 채운다.
산출 경로: design/DESIGN-DIRECTION.md
입력: design/compare/selection.json (사용자 선택) + design/research/references.json
      + design/design-profile.json
짝 산출물: design/selection.json (compare/selection.json 의 승격본),
           design/DECISION-LOG.md (이후 모든 임의 결정 기록)
다음 단계: /design-system (이 방향 → DESIGN.md + TOKENS.json + 외 7종)

[작성 가이드]
- 이 문서는 "합성된 최종 디자인 방향"이다. 사용자가 비교 UI 에서 내린 선택을
  요소별 출처와 함께 하나의 일관된 방향으로 종합한다.
- 핵심: 모든 요소에 *출처(어느 후보에서 왔는가)* 와 *근거(왜 이 선택인가)* 를 붙인다.
  근거를 못 쓰는 요소는 채택하지 않는다 (6원칙 #6: "모든 결정엔 이유").
- 단일 선택(후보 A 전체) 또는 조합 선택(A 타이포 + B 테이블 + C 색상) 모두 지원.
- 충돌(예: A 색상은 어둡고 B 레이아웃은 밝은 표면 전제) 은 §4 에서 명시 해결한다.
  임의 해결은 design/DECISION-LOG.md 에도 기록.
- 아직 TOKENS.json 은 없다. 여기서는 hex 를 확정하지 말고 *방향*("후보 A 의
  warm-neutral 색 계열")으로 기술. 실제 값 확정은 /design-system 단계.
- 진부한 AI 기본값 자가검열: 선택 종합 과정에서 순수 #000/#fff·Tailwind 기본
  보라/파랑·이모지·균등 카드 그리드로 회귀하지 않는다.
============================================================================
-->

# 디자인 방향 — {{project_name}}

> 출처: `/design-select` (사용자 비교 선택 합성) / {{generated_at}}
> 입력: `design/compare/selection.json`, `design/research/references.json`, `design/design-profile.json`
> 다음 단계: `/design-system`

---

## 1. 선택 요약 (한눈에)

> <!-- 가이드: 사용자가 무엇을 선택했는지 2~3 문장. 단일/조합 여부 명시. -->

{{selection_summary}}

**선택 유형**: {{selection_type}} <!-- 단일 후보 전체 / 요소 조합 -->
**주된 출처 후보**: {{primary_candidates}} <!-- 예: candidate-a(시각) + candidate-b(UX 구조) -->

---

## 2. 요소별 채택 결과 + 출처 + 근거

<!--
가이드:
- selection.json 의 combinedSelection (15종 고정) 을 그대로 표로.
- 15종: color, typography, navigation, density, buttons, forms, cards,
  tables, modals, icons, spacing, radius, shadow, images, motion.
- "출처 후보"는 candidate-a..g. "근거"는 likes/dislikes 메모 + 제품 적합성에서.
- 근거 칸에 "예뻐서"는 금지. 제품 목적·사용자 행동·인상과 연결.
-->

| 요소 | 채택 방향 | 출처 후보 | 근거 (제품/사용자/인상과 연결) |
|------|----------|-----------|-------------------------------|
| color | {{sel_color}} | {{src_color}} | {{why_color}} |
| typography | {{sel_typography}} | {{src_typography}} | {{why_typography}} |
| navigation | {{sel_navigation}} | {{src_navigation}} | {{why_navigation}} |
| density | {{sel_density}} | {{src_density}} | {{why_density}} |
| buttons | {{sel_buttons}} | {{src_buttons}} | {{why_buttons}} |
| forms | {{sel_forms}} | {{src_forms}} | {{why_forms}} |
| cards | {{sel_cards}} | {{src_cards}} | {{why_cards}} |
| tables | {{sel_tables}} | {{src_tables}} | {{why_tables}} |
| modals | {{sel_modals}} | {{src_modals}} | {{why_modals}} |
| icons | {{sel_icons}} | {{src_icons}} | {{why_icons}} |
| spacing | {{sel_spacing}} | {{src_spacing}} | {{why_spacing}} |
| radius | {{sel_radius}} | {{src_radius}} | {{why_radius}} |
| shadow | {{sel_shadow}} | {{src_shadow}} | {{why_shadow}} |
| images | {{sel_images}} | {{src_images}} | {{why_images}} |
| motion | {{sel_motion}} | {{src_motion}} | {{why_motion}} |

---

## 3. 사용자 호불호 반영 (likes / dislikes)

<!--
가이드: selection.json 의 likes[] / dislikes[] 를 종합 방향에 어떻게 녹였는지.
"싫어요"가 방향에서 확실히 배제됐는지 확인하는 게 핵심.
-->

### 3.1 살린 선호 (likes)

| 후보 | 요소 | 사용자 메모 | 방향 반영 |
|------|------|------------|-----------|
| {{like_candidate}} | {{like_element}} | "{{like_note}}" | {{like_applied}} |

### 3.2 배제한 거부 (dislikes)

| 후보 | 요소 | 사용자 메모 | 배제 방식 |
|------|------|------------|-----------|
| {{dislike_candidate}} | {{dislike_element}} | "{{dislike_note}}" | {{dislike_excluded}} |

---

## 4. 충돌 해결 결과

<!--
가이드:
- 조합 선택은 후보 간 전제 충돌을 낳는다.
  예: A 색상(다크 표면 전제) + B 레이아웃(밝은 표면·강한 보더 전제).
- 각 충돌마다: (1) 무엇이 충돌하나 (2) 어떻게 풀었나 (3) 왜 그 방향인가.
- 임의로 결정한 사항은 design/DECISION-LOG.md 에도 항목으로 남긴다.
- 충돌이 없으면 "충돌 없음 — 선택 요소 간 전제 일관" 명시.
-->

| # | 충돌 내용 | 해결 방향 | 근거 | DECISION-LOG 기록 |
|---|----------|-----------|------|-------------------|
| 1 | {{conflict_1}} | {{resolution_1}} | {{conflict_1_why}} | {{conflict_1_logged}} |
| 2 | {{conflict_2}} | {{resolution_2}} | {{conflict_2_why}} | {{conflict_2_logged}} |

---

## 5. 제품 고유 요소 (복제 방지)

<!--
가이드:
- CONTRACT §18: 특정 서비스 통째 복제 금지. 최종 디자인엔 *프로젝트 고유 요소*를 둔다.
- 레퍼런스에서 가져온 것은 "외형"이 아니라 "원칙"임을 분명히 한다.
- 여기 적는 고유 요소는 이 제품만의 차별점. references.json 후보 어디서도 그대로
  복사하지 않은, 제품 맥락에서 발명한 요소.
-->

| 고유 요소 | 설명 | 제품 맥락 근거 |
|-----------|------|----------------|
| {{unique_1}} | {{unique_1_desc}} | {{unique_1_why}} |
| {{unique_2}} | {{unique_2_desc}} | {{unique_2_why}} |

> **복제 방지 확인**: {{anti_clone_note}}
> <!-- 가이드: 어떤 후보도 통째로 베끼지 않았음을, 원칙만 차용했음을 한 문장으로. -->

---

## 6. 종합 디자인 방향 서술 (3~5 문단)

<!--
가이드:
- 위 표들을 사람이 읽는 산문으로 종합. /design-system 작성자가 이 문단만 읽어도
  전체 방향을 잡을 수 있게.
- 시각 스타일 축과 UX 구조 축을 분리해 서술(6원칙 #3).
- 인상 우선순위(design-profile.json brand_impression) 를 관통하는 한 문장 포함.
-->

{{direction_narrative}}

---

## 7. 다음 단계 인계 사항

<!--
가이드: /design-system 이 바로 토큰화할 수 있도록 핵심을 추린다.
-->

- **색상 방향** → TOKENS.json `color.*` 로 구체화: {{handoff_color}}
- **타이포 방향** → `typography.fontFamily` (display 800+ / body 400~500 분리): {{handoff_typography}}
- **간격·밀도** → `spacing` 스케일 + 밀도 수준: {{handoff_spacing}}
- **모서리·표면·그림자** → `radius` / `surface` / `shadow`: {{handoff_surface}}
- **모션 수준** → `motion`: {{handoff_motion}}
- **반드시 피할 것** (avoid): {{handoff_avoid}}

---

## 8. 확정 상태

| 항목 | 상태 |
|------|------|
| 사용자 선택 승인 시각 | {{approved_at}} |
| 미해결 충돌 | {{unresolved_conflicts}} <!-- 없으면 "없음" --> |
| 다음 단계 차단 요인 | {{blockers}} <!-- 없으면 "없음 — /design-system 진행 가능" --> |

---

<!--
[다음 단계]
이 방향이 확정되면 /design-system 을 실행해
design/DESIGN.md + design/TOKENS.json + design/COMPONENTS.md + 외 6종을 생성한다.
TOKENS.json 이 모든 값(색/간격/폰트/모서리)의 단일 출처가 된다.
이 문서의 §2 요소별 방향과 §7 인계 사항이 그대로 토큰으로 변환된다.
-->
