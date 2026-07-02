# 품질 게이트 + 감사 루브릭

> `/design-prototype` 가 목업을 만들 때 자가 점검 기준으로, `/design-audit` 가 브라우저로 검증하고
> 점수를 매길 때 채점 기준으로 인용하는 단일 문서. 7대 품질 게이트(CONTRACT §8)와 감사 점수
> 루브릭(CONTRACT §9)을 합쳐 정리한다. 산출물 `design/audit/AUDIT-REPORT.md`,
> `design/audit/audit-score.json`, `design/audit/issues.json` 이 이 문서를 근거로 한다.

---

## 두 단계의 관계

| 단계 | 무엇 | 언제 |
|------|------|------|
| **7대 게이트** | 통과/실패 체크리스트(정성). "이 화면이 출시 가능한가"의 관문 | 목업 작성 중 자가 점검 + 감사 시작 시 |
| **감사 루브릭** | 7영역 100점 채점(정량) + 통과 조건 + 개선 루프 | `/design-audit` 실행 시 |

게이트는 **관문**(통과 못 하면 점수와 무관하게 보류), 루브릭은 **계기판**(얼마나 좋은가). 게이트
실패 항목은 `issues.json` 에 기록되고, 루브릭 점수는 `audit-score.json` 에 기록된다.

---

# PART 1 — 7대 품질 게이트 (CONTRACT §8)

각 게이트는 통과/실패 체크리스트다. 화면(screen)별로 적용하고, 실패 항목은 `issues.json` 의
해당 `category` 로 기록한다.

## Gate 1 — Product Fit (제품 적합성)

> 화면이 제품 목적을 지원하는가? 마케팅 패턴과 업무 패턴을 혼동하지 않는가?

- [ ] 화면이 **핵심 작업**을 first-fold 에 두는가(업무 도구인데 거대 히어로로 작업을 밀어내지 않는가 — 안티패턴 7)?
- [ ] 정보 밀도가 제품 요구와 맞는가(데이터 도구인데 과도한 여백 아닌가 — 안티패턴 12)?
- [ ] 대시보드라면 "보기"에서 "행동"으로 이어지는가(카드만 나열 아님 — 안티패턴 17)?
- [ ] 마케팅 레이아웃(히어로·feature 3카드)을 업무 화면에 잘못 적용하지 않았는가?

실패 → category: `product-fit`. 감사 영역 `product_fit` 점수에 직결.

## Gate 2 — Reference Fit (레퍼런스 적합성)

> 선택한 레퍼런스의 **원칙**을 반영하는가(외형만 흉내 X)? 특정 사이트를 복제하지 않았는가?

- [ ] `selection.json` 에서 선택된 요소들이 실제 구현에 반영됐는가?
- [ ] 가져온 것이 **원칙**(색=상태 신호, 마스터-디테일 등)이지 픽셀 복제가 아닌가(CONTRACT §18)?
- [ ] `REFERENCES.md` 에 출처 ↔ 적용 요소 매핑이 있는가?
- [ ] 프로젝트 **고유 요소**가 포함됐는가(통째 복제 차단)?

실패 → category: `anti-pattern` 또는 보고서 별도 명시.

## Gate 3 — System Consistency (시스템 일관성)

> 토큰을 사용하는가? 임의 색/간격이 없는가? 같은 컴포넌트가 페이지마다 동일한가?

- [ ] 모든 색/간격/폰트/모서리가 `design/TOKENS.json` 에서 오는가(매직넘버 0 — 안티패턴 20)?
- [ ] 순수 `#000`/`#fff` 가 없는가(off-black/off-white 사용)?
- [ ] 같은 버튼/카드/입력이 화면마다 동일한 스타일인가?
- [ ] radius·spacing 이 토큰 스케일 안에서 일관적인가(안티패턴 4·11·20)?

실패 → category: `visual-consistency`. `validate-tokens.ts` 로 정적 검증 병행.

## Gate 4 — Anti-Generic (탈-진부)

> 근거 없는 보라 그라데이션·카드 남발·거대 헤드라인·장식 우선·흔한 AI 랜딩 구조가 없는가?

- [ ] 근거 없는 보라/파랑 그라데이션 없음(안티패턴 1)?
- [ ] 모든 콘텐츠 카드화 / 반복 3열 그리드 없음(안티패턴 2·3)?
- [ ] 콘텐츠보다 장식이 먼저 보이지 않음(안티패턴 6·9·13)?
- [ ] 가짜 통계 숫자 없음(안티패턴 16)?
- [ ] 모든 섹션 동일 구조 / kicker 라벨 남발 없음(안티패턴 8·18)?
- [ ] 발견된 장식 요소마다 "제품 목적/사용자 행동을 어떻게 돕는가" 답 가능, 아니면 5개 예외 중 하나로 정당화됨?

실패 → category: `distinctiveness` / `anti-pattern`. **치명 안티패턴(1·13·14·16)은 critical/high.**

## Gate 5 — Usability (사용성)

> 다음 행동이 예측 가능한가? 주요 기능을 찾기 쉬운가? 오류를 복구할 수 있는가?

- [ ] 사용자가 "다음에 뭘 할지" 한눈에 아는가?
- [ ] 주요 기능 진입점이 발견 가능한가(검색·내비)?
- [ ] empty/loading/error 상태가 존재하고 복구 액션을 주는가(안티패턴 15)?
- [ ] 반복 업무에 불필요한 단계가 없는가?
- [ ] 모든 버튼에 의미 없는 아이콘을 붙이지 않았는가(안티패턴 10)?

실패 → category: `usability`.

## Gate 6 — Responsive (반응형)

> 모바일에서 **재배치**되는가(단순 축소 X)? 텍스트/버튼이 잘리지 않는가? 터치 영역 충분한가?

- [ ] 모바일에서 사이드바→하단탭/햄버거, 테이블→카드/스택으로 **reflow** 되는가(안티패턴 14)?
- [ ] 가로 스크롤·텍스트 잘림이 없는가?
- [ ] 터치 타깃 ≥ 44px 인가?
- [ ] breakpoint(mobile<640 / tablet 640-1024 / desktop>1024)별로 핵심 기능이 유지되는가?

실패 → category: `responsive`. `capture-screenshots.ts` 로 뷰포트별 캡처 + 가로 스크롤 점검.

## Gate 7 — Accessibility (접근성)

> 색에만 의존한 상태표시가 없는가? 포커스가 보이는가? 입력 레이블·대비·reduced-motion?

- [ ] 상태(성공/오류 등)를 **색만으로** 구분하지 않는가(아이콘·텍스트 병행)?
- [ ] 키보드 포커스가 시각적으로 보이는가(focus ring)?
- [ ] 모든 입력에 레이블이 있는가?
- [ ] 텍스트 대비가 WCAG AA(본문 4.5:1, 큰 텍스트 3:1) 이상인가?
- [ ] `prefers-reduced-motion` 을 존중하는가?

실패 → category: `accessibility`. `audit-accessibility.ts` 로 대비·포커스·레이블·터치·reduced-motion 점검.

### 게이트 요약 매핑

| Gate | category(issues.json) | 감사 영역(audit-score.json) |
|------|----------------------|------------------------------|
| 1 Product Fit | product-fit | product_fit |
| 2 Reference Fit | anti-pattern | distinctiveness(부분) |
| 3 System Consistency | visual-consistency | visual_consistency |
| 4 Anti-Generic | distinctiveness / anti-pattern | distinctiveness |
| 5 Usability | usability | usability |
| 6 Responsive | responsive | responsive |
| 7 Accessibility | accessibility | accessibility |
| (IA 전반) | information-hierarchy | information_architecture |

---

# PART 2 — 감사 점수 루브릭 (CONTRACT §9)

`/design-audit` 가 실행 중인 목업을 브라우저로 검증하고 7개 영역을 100점 만점으로 채점한다.
결과는 `design/audit/audit-score.json`(§4.5 스키마)에 기록.

## 7개 영역 채점 기준

각 영역 0~100. 아래는 **80점 이상(양호)** 의 기준선이다.

| 영역(`scores` 키) | 무엇을 채점 | 양호(≥80)의 모습 | 주요 연결 게이트 |
|-------------------|-------------|------------------|------------------|
| **product_fit** | 제품 목적·핵심 작업 지원 | 첫 화면에 핵심 작업, 밀도 적정, 행동으로 연결 | Gate 1 |
| **information_architecture** | 정보 위계·그룹핑·탐색 경로 | 무엇이 중요한지 명확, 논리적 그룹, 드릴다운 가능 | Gate 1·5 |
| **visual_consistency** | 토큰 사용·컴포넌트 일관성 | 매직넘버 0, 동일 컴포넌트 동일 스타일, 일관 radius/spacing | Gate 3 |
| **usability** | 다음 행동 예측·기능 발견·오류 복구 | 명확한 CTA, 발견 가능 기능, 상태/복구 설계 | Gate 5 |
| **distinctiveness** | 탈-진부·고유성 | 근거 없는 generic 요소 0, 비대칭 위계, 프로젝트 고유 요소 | Gate 4 |
| **responsive** | 모바일 reflow·잘림·터치 | 재배치 동작, 잘림 0, 터치 ≥44px | Gate 6 |
| **accessibility** | 대비·포커스·레이블·색비의존·모션 | AA 대비, 포커스 가시, 레이블, reduced-motion | Gate 7 |

`average` = 7영역 평균.

## 통과 조건 (전부 충족해야 pass)

```
✅ 전체 평균(average) ≥ 85
✅ 모든 영역 ≥ 75
✅ accessibility ≥ 80
✅ 치명적(critical) 오류 0건
✅ AI 안티패턴 치명 항목 0건 (anti-patterns.md 의 1·13·14·16 등 근거 없는 등장)
```

`audit-score.json.pass`:
```jsonc
{ "passed": false, "failedAreas": ["distinctiveness"], "reasons": ["근거 없는 보라 그라데이션 헤더(안티패턴 1)"] }
```

하나라도 미충족이면 `passed: false`. failedAreas 에 미달 영역, reasons 에 사유.

## 이슈 기록 규칙 (`issues.json`, §4.5)

각 발견은 Audit Issue 로 기록:

```jsonc
{ "id": "AUDIT-001", "screen": "customer-list",
  "severity": "critical | high | medium | low",
  "category": "information-hierarchy | visual-consistency | usability | distinctiveness | responsive | accessibility | product-fit | anti-pattern",
  "description": "...", "evidence": "screenshots/customer-list-mobile.png 우측 잘림",
  "recommendation": "...", "status": "open | fixed | wontfix" }
```

### severity 기준

| severity | 기준 | 예 |
|----------|------|-----|
| **critical** | 핵심 기능 사용 불가 / 접근성 차단 / 신뢰 훼손 | 모바일 핵심 버튼 잘림, 색만으로 오류 표시, 가짜 통계 |
| **high** | 주요 사용성·일관성 저해, 통과 막음 | 근거 없는 generic 패턴, 테이블 모바일 미reflow |
| **medium** | 경험 저하하나 우회 가능 | 일부 간격 불일치, 약한 위계 |
| **low** | 다듬기 수준 | 미세 정렬, 아이콘 굵기 불일치 |

## 실패 처리 — 개선 루프 (최대 3회)

`passed: false` 일 때:

1. **중요도순 정렬** — issues 를 severity(critical→low) 순으로.
2. **원인 구분** — 디자인 시스템 문제(`TOKENS.json`/`DESIGN.md` 수정 필요) vs 구현 문제(목업 코드만 수정).
3. **수정 계획 수립** — 어떤 이슈를 어떻게 고칠지, 어느 파일을 건드릴지.
4. **수정 적용** — 시스템 문제면 토큰/문서부터, 구현 문제면 목업 코드.
5. **스크린샷 재생성** — `before/`(수정 전), `after/`(수정 후), `screenshots/`(화면별). `capture-screenshots.ts` 사용.
6. **재평가** — 다시 채점, `audit-score.json.iteration` 증가, 이슈 `status: fixed` 갱신.

```
iteration 1 → 수정 → iteration 2 → 수정 → iteration 3
```

- **기본 최대 3회**(사용자 조정 가능). 3회 후에도 미통과면 남은 이슈를 `AUDIT-REPORT.md` 에
  "잔여 이슈 + 권고"로 정리하고 사용자에게 결정을 넘긴다(자동 확정·자동 종료 금지 — 생성보다 판단).
- 각 iteration 의 점수 변화·수정 내역을 `AUDIT-REPORT.md` 에 기록(추적 가능).

## 디자인 시스템 문제 vs 구현 문제 구분 가이드

| 신호 | 분류 | 고칠 파일 |
|------|------|-----------|
| 여러 화면에서 같은 색/간격 오류 반복 | 시스템 | `TOKENS.json`, `DESIGN.md` |
| 토큰엔 맞는데 한 화면만 어긋남 | 구현 | 목업 코드 |
| 안티패턴이 시스템에 규칙으로 박혀 있음 | 시스템 | `ANTI-PATTERNS.md`, `DESIGN.md` |
| 특정 화면의 상태 누락(empty/error) | 구현 | 해당 화면 코드 |
| 접근성 토큰(대비·포커스) 자체 미비 | 시스템 | `TOKENS.json`, `ACCESSIBILITY.md` |

→ **시스템 문제를 구현에서 땜질하지 않는다.** 근원을 고치면 모든 화면에 전파된다.

---

## 게이트·루브릭 자가 점검 순서 (감사 1회 분량)

1. 화면별로 **7대 게이트** 체크리스트 적용 → 실패를 `issues.json` 에 기록(severity·category).
2. 7영역 **점수** 산정 → `audit-score.json`.
3. **통과 조건** 5개 평가 → `pass{passed,failedAreas,reasons}`.
4. `passed:false` 면 **개선 루프**(원인 구분 → 수정 → 재캡처 → 재평가, 최대 3회).
5. `AUDIT-REPORT.md` 에 점수·이슈·iteration 이력·잔여 권고 정리.

> **핵심 정신**: 점수가 목표가 아니라 **출발점**이다. schema·게이트 통과가 곧 좋은 디자인은 아니므로,
> 실제 브라우저에서 화면을 보고(스크린샷 검수) 사람이 판단한다. 자동 확정은 없다 — 마지막 결정은 사용자.
