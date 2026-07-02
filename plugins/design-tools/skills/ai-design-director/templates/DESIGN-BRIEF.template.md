<!--
============================================================================
이 템플릿은 /design-brief 커맨드가 채운다.
산출 경로: design/DESIGN-BRIEF.md
이후 단계(/design-translate)의 입력이 된다.

[작성 가이드]
- 핵심 규칙: "사용자가 한 말"과 "AI 가 해석한 것"을 절대 섞지 않는다.
  · 사용자 표현 원문은 따옴표로 그대로 인용한다 (윤색·요약 금지).
  · AI 해석/추정은 반드시 "추정 사항" 또는 인라인 (추정) 표시와 함께 분리한다.
- 마지막 §9 "확정 vs 추정" 표는 이 문서의 신뢰도 계약이다. 비우지 말 것.
- 추정이 많다는 건 결함이 아니라 정직함이다. 모르면 (미확인) 으로 둔다.
- design/TOKENS.json 은 아직 존재하지 않는다(시스템 단계 산출물). 여기서는
  값(hex/폰트명)을 확정하지 않는다 — 인상·방향·선호만 기록한다.
- 톤: 인터뷰 기록. 추측으로 빈칸을 메우지 말 것.
============================================================================
-->

# 디자인 브리프 — {{project_name}}

> 출처: `/design-brief` 인터뷰 / {{generated_at}}
> 다음 단계: `/design-translate` (이 브리프 → 디자인 언어 번역)

---

## 1. 한 줄 요약

> <!-- 가이드: 제품을 한 문장으로. "누구를 위한, 무엇을 하는, 어떤 제품" 형식. -->

{{one_line_summary}}

---

## 2. 제품 정의

| 항목 | 내용 | 출처 구분 |
|------|------|-----------|
| 제품 유형 | {{product_type}} <!-- crm \| content \| commerce \| admin \| mobile ... --> | {{confirmed_or_assumed}} |
| 핵심 가치 | {{core_value}} | {{confirmed_or_assumed}} |
| 사용 환경 | {{usage_context}} <!-- 데스크톱 장시간 업무 / 모바일 짧은 세션 / 혼합 --> | {{confirmed_or_assumed}} |
| 사용 빈도 | {{usage_frequency}} <!-- 매일 여러 번 / 주 1회 / 비정기 --> | {{confirmed_or_assumed}} |
| 경쟁/대체재 | {{alternatives}} <!-- 현재 사용자가 대신 쓰는 것 (엑셀, 수기, 타 서비스) --> | {{confirmed_or_assumed}} |

> **사용자 원문**
> <!-- 가이드: 제품에 대해 사용자가 실제로 한 말을 그대로 인용. 여러 개면 줄바꿈. -->
> "{{user_quote_product}}"

---

## 3. 사용자 정의

| 항목 | 내용 | 출처 구분 |
|------|------|-----------|
| 주 사용자 | {{primary_user}} | {{confirmed_or_assumed}} |
| 기술 숙련도 | {{tech_literacy}} <!-- 비전문가 / 일반 / 파워유저 --> | {{confirmed_or_assumed}} |
| 사용 동기·맥락 | {{user_context}} <!-- 어떤 상황에서 왜 이 제품을 켜는가 --> | {{confirmed_or_assumed}} |
| 가장 큰 불편(JTBD) | {{user_pain}} <!-- 지금 무엇이 답답해서 이 제품이 필요한가 --> | {{confirmed_or_assumed}} |

> **사용자 원문**
> "{{user_quote_user}}"

---

## 4. 핵심 업무 (Jobs to be Done)

<!--
가이드: 사용자가 이 제품으로 *반복적으로* 하는 핵심 작업을 빈도순으로.
디자인 결정의 1순위 근거다. "매일 100건을 빠르게 입력" 같은 업무가
정보 밀도·테이블 우선·단축키 필요 여부를 결정한다.
-->

| 우선순위 | 업무 | 빈도 | 디자인 함의 (추정) |
|---------|------|------|-------------------|
| 1 | {{job_1}} | {{job_1_freq}} | {{job_1_design_hint}} |
| 2 | {{job_2}} | {{job_2_freq}} | {{job_2_design_hint}} |
| 3 | {{job_3}} | {{job_3_freq}} | {{job_3_design_hint}} |

> **사용자 원문**
> "{{user_quote_jobs}}"

---

## 5. 브랜드 인상 (우선순위 순)

<!--
가이드:
- 사용자가 원하는 "느낌"을 우선순위 배열로. 1번이 가장 중요.
- trait 예: 신뢰 / 전문성 / 속도 / 친근함 / 차분함 / 실험성 / 고급스러움 / 인간적 / 기술적.
- priority 는 design-profile.json 의 brand_impression[].priority 로 그대로 이어진다.
- "스타트업 느낌 싫음" 같은 거부 인상은 §7 에 따로 적는다 (여기는 원하는 인상만).
-->

| 우선순위 | 원하는 인상 | 사용자 표현 원문 | AI 해석 (추정) |
|---------|------------|-----------------|----------------|
| 1 | {{impression_1}} | "{{impression_1_quote}}" | {{impression_1_interpret}} |
| 2 | {{impression_2}} | "{{impression_2_quote}}" | {{impression_2_interpret}} |
| 3 | {{impression_3}} | "{{impression_3_quote}}" | {{impression_3_interpret}} |

---

## 6. 기존 브랜드 자산

<!--
가이드: 이미 있는 로고/색/폰트/가이드라인을 기록. 없으면 "없음(신규)" 명시.
이 값들은 §17 가중치 분기(브랜드 유 50/30/20 vs 무 60/40)를 결정한다.
-->

| 자산 | 보유 여부 | 값/설명 |
|------|----------|---------|
| 로고 | {{has_logo}} | {{logo_note}} |
| 브랜드 색 | {{has_brand_color}} | {{brand_color_note}} <!-- hex 가 있으면 인용만, 확정은 시스템 단계 --> |
| 지정 폰트 | {{has_font}} | {{font_note}} |
| 가이드라인 문서 | {{has_guideline}} | {{guideline_note}} |

> **가중치 결정**: {{weighting_decision}} <!-- 예: 브랜드 색만 있음 → 브랜드 유(50/30/20) 적용 -->

---

## 7. 선호 · 거부 (Likes / Dislikes)

<!--
가이드:
- "좋아함"과 "싫어함"을 분리. 거부 항목이 더 강한 신호인 경우가 많다.
- 가능하면 *이유*까지. "보라색 싫음"보다 "보라색은 우리 고객층(시니어)에 안 맞음"이 유용.
- 여기서 나온 거부 항목은 design-profile.json 의 avoid[] 로 이어진다.
- 진부한 AI 기본값(순수 #000/#fff, Tailwind 보라/파랑, 이모지, 가짜 수치,
  균등 카드 그리드)을 사용자가 명시 거부했다면 강조 표기.
-->

### 7.1 선호

| 항목 | 사용자 표현 원문 | 이유 (확정/추정) |
|------|-----------------|-----------------|
| {{like_1}} | "{{like_1_quote}}" | {{like_1_reason}} |
| {{like_2}} | "{{like_2_quote}}" | {{like_2_reason}} |

### 7.2 거부

| 항목 | 사용자 표현 원문 | 이유 (확정/추정) |
|------|-----------------|-----------------|
| {{dislike_1}} | "{{dislike_1_quote}}" | {{dislike_1_reason}} |
| {{dislike_2}} | "{{dislike_2_quote}}" | {{dislike_2_reason}} |

### 7.3 참고로 보여준 레퍼런스 (있으면)

<!-- 가이드: 사용자가 "이런 거" 하고 든 URL/스크린샷/서비스명. 호불호 메모와 함께. -->

| 레퍼런스 | URL/출처 | 사용자 반응 |
|----------|----------|------------|
| {{ref_example_1}} | {{ref_example_1_url}} | {{ref_example_1_reaction}} |

---

## 8. 제약 조건

<!--
가이드: 기술/일정/접근성/플랫폼/규제 제약. 디자인 자유도를 좁히는 외부 요인.
-->

| 제약 | 내용 | 출처 구분 |
|------|------|-----------|
| 플랫폼 | {{constraint_platform}} <!-- 웹만 / 웹+모바일 / 반응형 필수 --> | {{confirmed_or_assumed}} |
| 접근성 요구 | {{constraint_a11y}} <!-- WCAG AA / 고대비 / 시니어 사용자 등 --> | {{confirmed_or_assumed}} |
| 기술 스택 | {{constraint_stack}} <!-- 정해진 프레임워크/CSS 방식 --> | {{confirmed_or_assumed}} |
| 기타 | {{constraint_other}} | {{confirmed_or_assumed}} |

---

## 9. 확정 사항 vs 추정 사항 (신뢰도 계약)

<!--
가이드: 이 섹션이 이 문서의 핵심이다. 비우면 안 된다.
- "확정"은 사용자가 명시적으로 말했거나 자료(PRD/소스)로 검증된 것만.
- "추정"은 AI 가 인터뷰 맥락에서 유추한 것. 다음 단계에서 사용자 검증 대상.
- design-profile.json 의 confirmed[] / assumed[] / sources[] 로 1:1 이어진다.
-->

### 9.1 확정 사항 (사용자 명시 / 자료 검증)

- {{confirmed_item_1}}
- {{confirmed_item_2}}
- {{confirmed_item_3}}

### 9.2 추정 사항 (AI 유추 — 다음 단계 검증 필요)

- {{assumed_item_1}} <!-- 근거: ... -->
- {{assumed_item_2}} <!-- 근거: ... -->
- {{assumed_item_3}} <!-- 근거: ... -->

### 9.3 근거 출처

<!-- 가이드: 이 브리프가 무엇에 기반했는지. 인터뷰 답변/기존 PRD/소스코드/사용자 발언 등. -->

- {{source_1}}
- {{source_2}}

---

## 10. 미해결 질문 (다음 단계로 넘김)

<!--
가이드: 인터뷰에서 답을 못 받았지만 디자인 결정에 중요한 것.
/design-translate 또는 /design-research 시작 시 다시 물을 후보.
-->

- [ ] {{open_question_1}}
- [ ] {{open_question_2}}

---

<!--
[다음 단계]
이 브리프가 채워지면 /design-translate 를 실행해
DESIGN-TRANSLATION.md + design-profile.json 으로 번역한다.
이 문서의 §5 인상 / §7 거부 / §9 확정·추정이 그대로 매핑된다.
-->
