# AUDIT-REPORT.md — {{project_name}}

> `/design-audit` 단계가 이 파일을 생성·갱신한다. 위치는 `design/audit/AUDIT-REPORT.md` (고정).
> 구조화된 점수는 `design/audit/audit-score.json`, 이슈 목록은 `design/audit/issues.json` 이 단일 출처이고,
> 이 문서는 그 둘을 **사람이 읽도록** 정리한 보고서다(수치는 JSON 과 정확히 일치해야 한다).
>
> **감사 대상**: `/design-prototype` 가 만든 목업을 브라우저로 검증한 결과. 스크린샷은
> `design/audit/screenshots/`(현재), 수정 전/후는 `design/audit/before/` · `design/audit/after/`.
> **검증 축**: 7대 품질 게이트(`references/quality-gates.md`) + 7영역 점수 루브릭(아래 §2).

작성 가이드: `{{...}}` 를 실제 값으로 채운다. 회차마다 §3 점수·§4 이슈·§5 통과판정을 갱신하고,
이전 회차는 §7 회차 히스토리에 누적한다. `> 가이드:` 주석은 완성 후 삭제.

---

## 1. 감사 개요

| 항목 | 값 |
|------|----|
| 프로젝트 | {{project_name}} |
| 감사 일시 | {{YYYY.MM.DD HH:MM}} |
| **현재 회차** | {{1}} / 최대 {{3}} 회 |
| 감사 대상 URL | {{http://localhost:5173 또는 빌드 산출물}} |
| 대상 화면 | {{customer-list, customer-detail, transaction-form, settings ...}} |
| 검증 뷰포트 | desktop({{1280}}) · tablet({{768}}) · mobile({{375}}) |
| 검증 모드 | light / dark {{둘 다 / light만}} |
| 도구 | 브라우저 MCP / `scripts/capture-screenshots.ts` / `scripts/audit-accessibility.ts` |
| 디자인 시스템 출처 | `design/DESIGN.md`, `design/TOKENS.json`, `design/ANTI-PATTERNS.md` |

> 가이드: 감사는 *실제로 렌더된 화면*을 본다. JSON 통과·코드 존재가 아니라 픽셀·동작·대비를 확인한다.

---

## 2. 점수 루브릭 (고정 — 감사 루브릭 §9)

7개 영역 × 100점. **통과 조건(전부 충족)**:

| 조건 | 기준 |
|------|------|
| 전체 평균 | ≥ 85 |
| 모든 항목 | ≥ 75 |
| accessibility | ≥ 80 |
| 치명적 오류 | 0 |
| AI 안티패턴 치명 항목 | 0 |

각 영역 ↔ 품질 게이트 매핑:

| 영역 키 | 의미 | 대응 게이트(`references/quality-gates.md`) |
|---------|------|----|
| product_fit | 화면이 제품 목적·핵심 작업을 지원하는가 | Gate 1 |
| information_architecture | 정보 위계·내비·찾기 쉬움 | Gate 5(일부)·구조 |
| visual_consistency | 토큰 사용, 컴포넌트 일관 | Gate 3 |
| usability | 다음 행동 예측·오류 복구·반복 효율 | Gate 5 |
| distinctiveness | 진부한 AI 기본값 회피·고유성 | Gate 2·Gate 4 |
| responsive | 모바일 재배치·잘림 없음 | Gate 6 |
| accessibility | 대비·포커스·레이블·터치·모션 | Gate 7 |

---

## 3. 점수표 (회차 {{N}})

`design/audit/audit-score.json` 과 **수치 일치 필수**.

| 영역 | 점수 | 기준 | 상태 | 한 줄 평 |
|------|-----:|:----:|:----:|---------|
| product_fit | {{85}} | ≥75 | {{✓ / ✗}} | {{핵심 작업 중심이나 대시보드 위계 약함}} |
| information_architecture | {{82}} | ≥75 | {{✓}} | {{}} |
| visual_consistency | {{90}} | ≥75 | {{✓}} | {{토큰 준수}} |
| usability | {{84}} | ≥75 | {{✓}} | {{}} |
| distinctiveness | {{78}} | ≥75 | {{✓}} | {{레퍼런스 원칙 반영, 일부 진부}} |
| responsive | {{88}} | ≥75 | {{✓}} | {{}} |
| accessibility | {{86}} | ≥80 | {{✓}} | {{대비 양호, 포커스 표시 일부 누락}} |
| **평균** | **{{84.7}}** | **≥85** | {{✗}} | |

**판정 요약**: 평균 {{84.7}} / 임계 85 → {{미달}}. 미달 영역: {{없음(평균만 미달)}}.

> 가이드: 점수는 근거가 있어야 한다 — "한 줄 평"에 *왜 그 점수인지* 이슈 ID(§4)를 연결한다.
> 점수를 후하게 주지 않는다("회의적 기본값" — 작동·통과를 입증하지 못하면 감점).

---

## 4. 이슈 목록 (severity 순)

`design/audit/issues.json` 과 1:1 대응. severity: critical > high > medium > low.
category ∈ information-hierarchy / visual-consistency / usability / distinctiveness / responsive / accessibility / product-fit / anti-pattern.

| ID | 화면 | severity | category | 설명 | 증거 | 권고 | 상태 |
|----|------|:--------:|----------|------|------|------|:----:|
| AUDIT-001 | {{customer-list}} | {{high}} | {{distinctiveness}} | {{목록을 균등 카드 그리드로 표현해 비교 스캔 불가(안티패턴 #3)}} | {{screenshots/customer-list-desktop.png}} | {{테이블로 전환, 핵심 컬럼 5개}} | {{open}} |
| AUDIT-002 | {{transaction-form}} | {{medium}} | {{accessibility}} | {{입력 포커스 링 없음(outline:none)}} | {{screenshots/form-focus.png}} | {{focus-visible 토큰 적용}} | {{open}} |
| AUDIT-003 | {{dashboard}} | {{medium}} | {{product-fit}} | {{흐름 없이 카드만 나열(안티패턴 #17)}} | {{screenshots/dashboard.png}} | {{주요 작업 진입점 1차화}} | {{open}} |
| {{...}} | | | | | | | |

**severity 정의**
- **critical**: 핵심 작업 불가·데이터 손실·치명 안티패턴·심각한 접근성 차단. → **통과 즉시 차단**.
- **high**: 사용성·일관성·고유성에 큰 손상. 다수 화면 영향.
- **medium**: 국소적 결함, 우회 가능하나 품질 저하.
- **low**: 사소·미용 수준.

> 가이드: 증거 칸은 반드시 스크린샷 경로(+필요 시 좌표)를 넣는다. "느낌"이 아니라 *보이는 것*으로 적는다.
> anti-pattern 카테고리는 `design/ANTI-PATTERNS.md` 에서 **금지**로 분류된 항목 위반에만 부여한다.

---

## 5. 통과 판정 (회차 {{N}})

`design/audit/audit-score.json` 의 `pass` 와 일치.

| 통과 조건 | 결과 |
|-----------|:----:|
| 평균 ≥ 85 | {{✗ (84.7)}} |
| 모든 항목 ≥ 75 | {{✓}} |
| accessibility ≥ 80 | {{✓ (86)}} |
| critical 이슈 0 | {{✓}} |
| 치명 안티패턴 0 | {{✓}} |
| **종합** | **{{미통과}}** |

- 실패 영역(failedAreas): {{[] (평균만 미달)}}
- 사유(reasons): {{["AUDIT-001 high 이슈로 distinctiveness 78 → 평균 끌어내림"]}}

> 가이드: 한 조건이라도 미충족이면 **미통과**다. 평균만 보지 않는다 — accessibility 하한·critical 0·치명
> 안티패턴 0 은 별도 게이트다.

---

## 6. 수정 계획 (미통과 시)

감사 루브릭 §9 의 실패 처리 절차를 따른다.

1. **중요도순 정렬**: critical → high → medium (§4 표 순서).
2. **원인 구분**: 각 이슈를 [디자인 시스템 문제] vs [구현 문제]로 분류.
3. **수정 항목**:

| ID | 원인 구분 | 조치 | 담당 단계 |
|----|----------|------|----------|
| AUDIT-001 | {{구현}} | {{카드→테이블 전환}} | `/design-prototype` |
| AUDIT-002 | {{시스템}} | {{TOKENS 에 focus-ring 추가 후 적용}} | `/design-system` → `/design-prototype` |
| AUDIT-003 | {{구현}} | {{대시보드 1차 작업 도출}} | `/design-prototype` |

4. **수정 실행** → 5. **스크린샷 재생성**(`before/` 보존, `after/` 갱신) → 6. **재평가**(회차 +1).

**시스템 vs 구현 구분 기준**: 토큰·컴포넌트 정의 자체의 결함이면 `design/TOKENS.json`·`design/COMPONENTS.md`
를 고친다(시스템). 정의는 맞는데 화면이 안 따랐으면 목업을 고친다(구현). 시스템 문제를 구현에서
임시 땜질하면 다른 화면에 재발한다.

> 가이드: 같은 이슈가 회차를 넘겨 반복되면 거의 항상 *시스템 문제를 구현에서만 고쳤기* 때문이다.
> 근본 원인을 토큰/컴포넌트에서 잡는다.

---

## 7. 수정 전/후 비교 (스크린샷)

| 이슈 ID | 화면 | 전(before/) | 후(after/) | 결과 |
|---------|------|-------------|-----------|------|
| AUDIT-001 | {{customer-list}} | {{before/customer-list-r1.png}} | {{after/customer-list-r2.png}} | {{해결}} |
| AUDIT-002 | {{transaction-form}} | {{before/form-r1.png}} | {{after/form-r2.png}} | {{해결}} |

> 가이드: before/after 는 **같은 화면·같은 뷰포트·같은 데이터**로 찍는다(동일 조건 비교, 6원칙 #4).
> 파일명에 회차를 넣어 추적한다(`-r1`, `-r2`).

---

## 8. 회차 히스토리

| 회차 | 일시 | 평균 | 통과 | open critical | open high | 비고 |
|:----:|------|-----:|:----:|:-------------:|:--------:|------|
| 1 | {{YYYY.MM.DD}} | {{84.7}} | {{✗}} | {{0}} | {{1}} | {{AUDIT-001 발견}} |
| 2 | {{YYYY.MM.DD}} | {{87.2}} | {{✓}} | {{0}} | {{0}} | {{전 항목 해결}} |

**반복 정책**: 최대 {{3}}회(사용자 조정 가능). {{3}}회 후에도 미통과면 자동 수정을 멈추고
미해결 이슈·권고를 정리해 사용자 판단을 요청한다(자동 확정 금지 — 6원칙 "생성보다 판단").

> 가이드: 회차를 늘려도 점수가 안 오르면 시스템/방향 문제다. `/design-select`·`/design-system` 으로
> 거슬러 올라가 재검토를 권한다. 무한 미세조정으로 시간을 쓰지 않는다.

---

## 9. 다음 조치

- [ ] {{미통과 → 회차 N+1: AUDIT-001 수정 후 재감사}}
- [ ] {{통과 → 사용자에게 결과 보고 + 잔여 low 이슈 백로그 정리}}
- [ ] {{시스템 변경 발생 시 design/DECISION-LOG.md 기록}}
- [ ] {{접근성 잔여 항목 → ACCESSIBILITY.md 갱신}}

---

## 작성 완료 체크리스트

- [ ] §3 점수가 `design/audit/audit-score.json` 과 정확히 일치한다.
- [ ] §4 이슈가 `design/audit/issues.json` 과 1:1 대응하고, 모든 이슈에 증거(스크린샷 경로)가 있다.
- [ ] §5 통과 판정이 5개 조건(평균·항목하한·a11y·critical 0·치명 안티패턴 0)을 모두 검사했다.
- [ ] anti-pattern 이슈가 `design/ANTI-PATTERNS.md` 의 **금지** 분류와 일치한다.
- [ ] before/after(§7)가 동일 조건(화면·뷰포트·데이터)으로 비교됐다.
- [ ] 회차·반복 정책(최대 3회)이 명시되고, 미통과 시 자동 확정하지 않는다.
- [ ] `{{...}}` 자리표시자가 남아 있지 않다.
