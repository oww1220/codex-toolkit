---
name: design-audit
description: 구현된 목업을 브라우저에서 실제로 띄워 화면별 스크린샷을 찍고, 선택한 디자인 방향·디자인 시스템과 대조해 7개 영역 점수로 정량·정성 평가한 뒤 이슈를 수정·재평가하는 개선 루프. design/audit/* 산출. 트리거 — "디자인 감사", "목업 검증해줘", "이 화면 디자인 평가", "/design-audit".
allowed-tools: Read, Write, Bash, AskUserQuestion
---

# /design-audit — 브라우저 기반 디자인 검증 + 개선 루프

9단계 파이프라인의 마지막 단계. 앞 단계들이 *판단의 재료를 만들고 시스템을 세웠다면*, 이 단계는
**"만든 것이 실제로 그렇게 됐는가"** 를 픽셀로 확인한다. 토큰 파일이 멀쩡하다고 화면이 멀쩡한 건
아니다 — 구현이 선택한 방향(`design/DESIGN-DIRECTION.md`)과 디자인 시스템(`design/DESIGN.md`,
`design/TOKENS.json`)에 실제로 부합하는지 **브라우저에서 띄워 보고**, 어긋난 곳을 이슈로 잡아
고치고, 다시 띄워서 재평가한다.

> 이 단계의 정신: **schema 통과는 출발점이지 도착점이 아니다.** JSON 이 아니라 픽셀을 본다.
> 그리고 점수를 매기는 목적은 "통과 도장"이 아니라 *무엇을 어떻게 고칠지*를 끌어내는 것이다.

---

## 목적 (PRD §9.9)

- 구현된 목업을 **실제 브라우저에서 실행**해 주요 화면을 이동하며 **화면별 스크린샷**을 확보한다.
- 그 스크린샷을 `design/DESIGN-DIRECTION.md` + `design/DESIGN.md` + `design/TOKENS.json` 과 **대조**해 정량·정성 평가한다.
- 7개 영역 점수(`design/audit/audit-score.json`)와 구체 이슈 목록(`design/audit/issues.json`)을 만든다.
- 통과 못 하면 이슈를 **중요도순으로 고치고 → 스크린샷 재생성 → 재평가**하는 루프를 돌린다(기본 최대 3회).

이 단계는 디자인을 새로 만들지 않는다. **이미 만든 것을 측정하고 교정**한다.

---

## 입력

| 입력 | 경로 | 없을 때 |
|------|------|---------|
| 구현된 목업 (필수) | `/design-prototype` 산출물 (프로젝트 프런트엔드) | `/design-prototype` 를 먼저 돌리도록 안내. 감사할 대상이 없으면 진행 불가 |
| 최종 방향 (필수) | `design/DESIGN-DIRECTION.md` | 없으면 `/design-select` 를 먼저 권한다. 그래도 진행 시 사용자에게 핵심 방향을 AskUserQuestion 으로 확인 |
| 디자인 시스템 (필수) | `design/DESIGN.md` | 없으면 `/design-system` 을 먼저 권한다 |
| 디자인 토큰 (필수) | `design/TOKENS.json` | 없으면 `/design-system` 을 먼저 권한다 (임의 색/간격 판정의 기준) |
| 선택 합성 (참고) | `design/selection.json` | 없어도 진행 (방향 문서에 요약됨) |
| 프로젝트 안티패턴 (참고) | `design/ANTI-PATTERNS.md` | 없으면 패키지 `references/anti-patterns.md` 의 20개 기본 목록 사용 |
| 품질 게이트 정의 (참고) | `references/quality-gates.md` | 7대 게이트 정의. 평가 영역 매핑의 근거 |

먼저 위 필수 입력을 **Read** 한다. 특히:
- `design/TOKENS.json` → **임의 색/간격/폰트/모서리**를 잡는 단일 기준. 화면에 토큰에 없는 값이 있으면 일관성 위반.
- `design/DESIGN-DIRECTION.md` / `design/selection.json` → 사용자가 *실제로 선택한* 요소(타이포/색/내비/밀도 …). "구현이 그 선택대로인가"가 product_fit·distinctiveness 평가의 축.
- `design/ANTI-PATTERNS.md`(또는 `references/anti-patterns.md`) → 화면에서 잡아야 할 진부함 20종.
- `references/quality-gates.md` → 7대 게이트(Product Fit / Reference Fit / System Consistency / Anti-Generic / Usability / Responsive / Accessibility)를 7개 평가 영역으로 잇는 근거.

---

## 단계

### 0단계 — 선행 산출물 확인 + 감사 대상 확정

1. 위 "입력" 표대로 필수 산출물 존재를 확인한다. 없으면 해당 선행 커맨드를 권하고, 사용자가 그래도 진행을 원하면 **AskUserQuestion** 으로 최소 기준(방향 핵심·토큰 위치)을 확보한 뒤 진행한다.
2. 감사할 **목업 실행 방법**과 **주요 화면 목록**을 확정한다. 모호하면 **AskUserQuestion** 으로 한 번에 묻는다:
   - 실행 커맨드 (예: `npm run dev`) 와 접속 URL (예: `http://localhost:5173`)
   - 감사할 화면 목록 (제품 유형 기본값을 제안하되 사용자가 조정):
     - SaaS/CRM: `dashboard`, `customer-list`(목록), `customer-detail`(상세), `transaction-form`(폼)
     - 콘텐츠: `home`, `article-list`, `article-detail`, `search`
     - 커머스: `product-list`, `product-detail`, `cart`, `checkout`
     - 모바일: `home`, `feature`, `detail`, `settings`
   - **최대 반복 횟수** (기본 3, 사용자 조정 가능)
3. `screen` 이름은 `issues.json` 의 `screen` 필드와 일관되게 쓴다(`customer-list` 처럼 kebab-case).

> 화면은 **정적 예시가 아니라 실제 상태**로 봐야 한다(안티패턴 15). 가능하면 빈 상태/로딩/오류/채워진 상태를 화면 목록에 포함한다.

### 1단계 — 목업 실행 + 화면 이동 + 스크린샷

브라우저에서 실제로 띄워 **화면별·뷰포트별** 스크린샷을 `design/audit/screenshots/` 에 저장한다.

폴더 생성:
```bash
mkdir -p design/audit/screenshots design/audit/before design/audit/after
```

**캡처 수단 (우선순위, graceful fallback):**

| 순위 | 수단 | 사용 조건 |
|------|------|-----------|
| 1 | 브라우저 MCP (Chrome MCP 등) | 환경에 연결돼 있을 때. 화면 이동·클릭·스크롤 후 캡처 |
| 2 | `scripts/capture-screenshots.ts` (Playwright 가정) | MCP 가 없고 Playwright 가용할 때 |
| 3 | 사용자 수동 캡처 | 위 둘 다 불가 시 — 사용자가 직접 찍어 폴더에 넣도록 AskUserQuestion 으로 안내 |

- 실행 커맨드는 **Bash** 로 목업 서버를 띄운다(백그라운드 실행 + 헬스체크). 띄운 뒤 각 화면 URL 로 이동한다.
- **뷰포트 3종**으로 찍는다: desktop(>1024), tablet(640–1024), mobile(<640). 반응형 영역(`responsive`) 평가는 이 세 장이 근거다.
- `scripts/capture-screenshots.ts` 활용 예 — `--url`(base) + 화면별 라우트를 `--routes` 로 전달:
  ```bash
  npx tsx scripts/capture-screenshots.ts \
    --url http://localhost:5173 \
    --routes /dashboard,/customers,/customers/1,/customers/1/edit \
    --viewports desktop,tablet,mobile \
    --out design/audit/screenshots \
    --check-console --check-overflow
  ```
  - `--routes` 는 각 경로를 base URL 에 결합해 **경로 × 뷰포트마다** 한 장씩 캡처한다.
    `/design-prototype` 과 동일한 호출 규약(`--routes`)이다.
  - `--check-console` 콘솔 오류, `--check-overflow` 가로 스크롤 발생을 함께 점검한다(둘 다 이슈 후보).
  - 스크립트는 Playwright 미설치 시 설치 안내 후 종료한다(가짜 캡처 생성 금지).
- 파일명 규칙: `{screen}-{viewport}.png`. `{screen}` 은 라우트를 sanitize 한 라벨이다
  (`/customers` → `customers`, `/customers/1/edit` → `customers-1-edit`, `/` → `home`).
  예: `customers-desktop.png`, `customers-1-edit-mobile.png`.
- 캡처 수단이 전혀 없으면: 디렉토리만 만들고 사용자 수동 캡처를 안내한다. **가짜 이미지 경로를 만들지 않는다.** 캡처가 없으면 그 화면 영역은 "미검증"으로 명시한다.

> **첫 회차 캡처는 `before/` 에도 복사**해 둔다(`design/audit/before/{screen}-{viewport}.png`). 수정 후 `after/` 와 나란히 비교하기 위해서다.

### 2단계 — 접근성 정적 점검

`scripts/audit-accessibility.ts` 로 `accessibility` 영역의 객관 근거를 모은다(이 영역은 통과 하한이 80으로 가장 엄격하다).

```bash
npx tsx scripts/audit-accessibility.ts --url http://localhost:5173 --routes /dashboard,/customers,/customers/1,/customers/1/edit
```

`--routes` 는 각 경로를 base URL 에 결합해 화면별로 순회 점검한다(캡처 스크립트와 동일한 호출 규약).

점검 항목(가능 범위 정적 검사 + 안내):
- 텍스트/배경 **대비비 WCAG AA**(본문 4.5:1, 큰 텍스트 3:1)
- **키보드 포커스 가시성**(focus 링이 보이는가)
- 입력 요소 **레이블** 존재
- **터치 타깃 ≥ 44px**
- 상태를 **색에만 의존**하지 않는가(아이콘/텍스트 병행)
- `prefers-reduced-motion` 고려 여부

여기서 잡힌 항목은 곧장 `issues.json` 의 `category: accessibility` 이슈가 된다.

### 3단계 — 디자인 시스템·방향과 대조 (정량·정성 평가)

각 스크린샷을 **Read** 로 직접 보고, `design/TOKENS.json` · `design/DESIGN-DIRECTION.md` · `design/DESIGN.md` · 안티패턴 목록과 대조한다. 7개 영역을 0~100 으로 채점하되, **점수마다 근거 1줄**을 남긴다(가짜 정밀도 금지 — 5단위 반올림 권장).

평가 7영역 ↔ 7대 품질 게이트(`references/quality-gates.md`) 매핑:

| 영역(`audit-score.json` 키) | 묻는 질문 | 대응 게이트 |
|------|-----------|-------------|
| `product_fit` | 화면이 제품 목적/핵심 작업을 돕나? 마케팅 톤을 업무 도구에 끼우지 않았나? 선택한 방향과 맞나? | Gate 1 Product Fit / Gate 2 Reference Fit |
| `information_architecture` | 정보 위계가 분명한가? 다음 행동이 예측되나? 카드만 흩뿌린 대시보드는 아닌가? | Gate 1 / Gate 5 |
| `visual_consistency` | **토큰만** 썼나(임의 색·간격·폰트·모서리 없음)? 같은 컴포넌트가 화면마다 동일한가? | Gate 3 System Consistency |
| `usability` | 주요 기능 찾기 쉬운가? 오류 복구 가능? 반복 업무에 불필요한 단계 없나? | Gate 5 Usability |
| `distinctiveness` | 근거 없는 보라 그라데이션·카드 남발·거대 헤드라인·장식 우선이 없나? 진부한 AI 랜딩 구조가 아닌가? | Gate 4 Anti-Generic |
| `responsive` | 모바일이 단순 축소가 아니라 **재배치**됐나? 텍스트/버튼 안 잘림? 터치 영역 충분? 핵심 기능 유지? | Gate 6 Responsive |
| `accessibility` | 색 의존 상태표시 없음? 포커스 보임? 레이블? 대비 충분? reduced-motion 고려? | Gate 7 Accessibility |

**대조 시 구체 체크(예시):**
- 화면에 쓰인 색을 `design/TOKENS.json` 의 `color.*` 값과 대조 → 토큰에 없는 색이면 `visual-consistency` 이슈.
- 순수 `#000`/`#fff` 사용 흔적 → off-black/off-white 로 교정 권고(안티패턴·자가검열 기준).
- 사용자가 선택한 타이포/내비/밀도(방향 문서)와 실제 구현 대조 → 어긋나면 `product-fit` 또는 `distinctiveness` 이슈.
- 안티패턴 20종(`references/anti-patterns.md`)을 화면별로 훑어 해당 항목을 `category: anti-pattern` 이슈로 기록.

> **안티패턴 판정 원칙(CONTRACT §7):** 특정 요소를 무조건 금지하지 않는다. "이 요소가 제품 목적/사용자 행동을 어떻게 돕는가?"에 답할 수 있으면(시스템에 명시·브랜드 연결·상태 전달에 필요·사용자 승인·접근성 무해) 통과. 답 못 하면 이슈. 장식인지 기능인지로 가른다.

### 4단계 — 이슈 목록 작성 (`issues.json`)

발견한 모든 문제를 `design/audit/issues.json` 에 **`schemas/audit.schema.json`(Audit Issue[])** 형태로 적는다.

```jsonc
[
  {
    "id": "AUDIT-001",
    "screen": "customer-list",
    "severity": "high",                         // critical | high | medium | low
    "category": "visual-consistency",           // information-hierarchy | visual-consistency | usability | distinctiveness | responsive | accessibility | product-fit | anti-pattern
    "description": "목록 헤더의 강조색 #7C3AED 가 TOKENS.json color.accent(oklch 기준)와 불일치 — 임의 보라 사용",
    "evidence": "design/audit/screenshots/customer-list-desktop.png 상단 헤더",
    "recommendation": "color.accent.default 토큰으로 교체. 보라 그라데이션 제거(안티패턴 1)",
    "status": "open"                            // open | fixed | wontfix
  }
]
```

작성 규칙:
- `id` 는 `AUDIT-001` 형식(`^AUDIT-[0-9]{3,}$`), 연속 번호.
- `evidence` 는 **실제 스크린샷 경로**(없으면 미검증을 명시한 좌표/설명). 가짜 경로 금지.
- `severity` 기준: **critical** = 통과 불가 결함(핵심 기능 작동 불가, 콘솔 치명 오류, 가로 스크롤로 콘텐츠 잘림, 치명 안티패턴) / **high** = 일관성·사용성 명백 저해 / **medium** = 개선 권장 / **low** = 사소.
- `recommendation` 은 **시스템 문제 vs 구현 문제**를 구분해 적는다(5단계 처리에서 갈린다).
- 이슈가 0건이면 빈 배열 `[]` 을 쓴다(거짓 이슈를 지어내지 않는다).

### 5단계 — 점수·통과 판정 작성 (`audit-score.json`)

회차 점수를 `design/audit/audit-score.json` 에 **`schemas/audit.schema.json`(auditScore)** 형태로 적는다.

```jsonc
{
  "iteration": 1,
  "scores": {
    "product_fit": 85, "information_architecture": 82, "visual_consistency": 78,
    "usability": 84, "distinctiveness": 80, "responsive": 88, "accessibility": 86
  },
  "average": 83.3,                               // 7개 평균(소수 1자리)
  "pass": {
    "passed": false,
    "failedAreas": ["visual_consistency"],
    "reasons": [
      "visual_consistency 78점 — customer-list 헤더에 토큰 외 보라색 사용(AUDIT-001)",
      "전체 평균 83.3 < 85 — 통과 기준 미달"
    ]
  }
}
```

**통과 조건(전부 충족 — CONTRACT §9):**

| 조건 | 기준 |
|------|------|
| 전체 평균 | ≥ 85 |
| 모든 항목 | ≥ 75 |
| accessibility | ≥ 80 |
| 치명적 오류 | 0건 (`severity: critical` 이슈 0) |
| AI 안티패턴 치명 항목 | 0건 (`category: anti-pattern` 중 critical 0) |

- `failedAreas` 는 `scores` 의 키만(영역 미달 시). 평균/치명오류/안티패턴 사유는 `reasons` 에 문장으로.
- `average` 는 7개 점수의 실제 평균이어야 한다(임의 조정 금지).

### 6단계 — 실패 처리 6단계 루프

`pass.passed === false` 이면 아래 6단계를 돈다(CONTRACT §9 실패 처리).

```
① 중요도순 정렬   issues.json 을 severity(critical→high→medium→low)로 정렬. critical 부터 처리.
② 분류           각 이슈가 "디자인 시스템 문제"인지 "구현 문제"인지 구분.
                  - 시스템 문제: 토큰/원칙 자체가 모호·부족 → design/TOKENS.json·design/DESIGN.md 수정 필요.
                    이 경우 design/DECISION-LOG.md 에 변경 이유 기록(임의 결정 추적).
                  - 구현 문제: 시스템은 맞는데 코드가 안 따름 → 목업 코드만 수정.
③ 수정계획        무엇을·어디를·어떻게 고칠지 1줄씩. critical/high 우선, low 는 시간 허락 시.
④ 수정           목업 코드(또는 시스템 문서) 수정. 토큰 외 값을 토큰으로, 안티패턴 제거 등.
                  ※ 수정은 이 커맨드 범위 밖의 코드 편집을 동반할 수 있다 — 사용자 프로젝트 구현 파일을
                    고친다. 시스템 문서(TOKENS.json/DESIGN.md) 변경 시 DECISION-LOG.md 갱신 필수.
⑤ 스크린샷 재생성  수정된 화면을 1단계 방식으로 다시 캡처해 design/audit/after/ 에 저장.
⑥ 재평가         iteration 을 +1 한 새 audit-score.json 으로 다시 채점. 처리한 이슈는 status: fixed.
```

- 매 회차 `audit-score.json` 의 `iteration` 을 올려 **갱신**한다(회차 기록 보존이 필요하면 `audit-score.iter-N.json` 로 사본을 둘 수 있으나 최종본은 `audit-score.json`).
- 고친 이슈는 `issues.json` 에서 `status: "fixed"`, 의도적으로 안 고치는 건 `status: "wontfix"`(사유를 `recommendation` 에 명시).
- **최대 반복 횟수(기본 3) 도달 후에도 미통과**면: 자동으로 더 돌리지 않는다. 남은 이슈·미달 영역·권장 후속(시스템 재검토 등)을 정리해 **AskUserQuestion** 으로 사용자에게 추가 반복/중단/시스템 단계 회귀를 묻는다("생성보다 판단" — 자동 확정 금지).

### 7단계 — 감사 리포트 작성 (`AUDIT-REPORT.md`)

사람이 읽는 종합 보고서 `design/audit/AUDIT-REPORT.md` 를 쓴다. 권장 구조:

```markdown
# 디자인 감사 리포트 — <project>

## 요약
- 감사 대상: <목업 URL>  | 화면: <목록>  | 뷰포트: desktop/tablet/mobile
- 최종 회차: <iteration>  | 통과 여부: <통과/미통과>
- 전체 평균: <average>  | accessibility: <점수>

## 영역별 점수 (최종 회차)
| 영역 | 점수 | 기준 | 판정 | 핵심 근거 |
|------|------|------|------|-----------|
| product_fit | 85 | ≥75 | 통과 | ... |
| information_architecture | 82 | ≥75 | 통과 | ... |
| visual_consistency | 88 | ≥75 | 통과 | ... |
| usability | 84 | ≥75 | 통과 | ... |
| distinctiveness | 82 | ≥75 | 통과 | ... |
| responsive | 88 | ≥75 | 통과 | ... |
| accessibility | 86 | ≥80 | 통과 | ... |
| **평균** | **85.0** | **≥85** | **통과** | |

## 회차별 변화
| 회차 | 평균 | 미달 영역 | 처리한 이슈 |
|------|------|-----------|-------------|
| 1 | 83.3 | visual_consistency | AUDIT-001, AUDIT-003 |
| 2 | 85.7 | (없음) | AUDIT-002 |

## 주요 이슈와 처리 (before/after)
### AUDIT-001 — customer-list 임의 보라색 (high · visual-consistency)
- 근거: design/audit/before/customer-list-desktop.png → after/customer-list-desktop.png
- 처리: color.accent 토큰으로 교체, 보라 그라데이션 제거 → status: fixed

## 안티패턴 점검 결과
- 20종 중 발견: <목록>  | 치명: <0건이어야 통과>

## 미해결·후속
- 남은 이슈(있다면) + 권장 후속(시스템 재검토 / 추가 반복 등)

## 산출물
- design/audit/audit-score.json · issues.json · before/ · after/ · screenshots/
```

리포트는 **before/after 스크린샷 경로**로 변화를 증명한다(말로만 "개선됨" 금지).

---

## 산출물 경로 (절대 고정 — CONTRACT §3)

```
design/audit/
├── AUDIT-REPORT.md      # 사람이 읽는 종합 감사 보고서 (7단계)
├── audit-score.json     # 회차 점수 + 통과 판정 (schema §4.5 auditScore)
├── issues.json          # Audit Issue[] (schema §4.5 issues)
├── before/              # 수정 전 스크린샷 ({screen}-{viewport}.png)
├── after/               # 수정 후 스크린샷
└── screenshots/         # 화면별·뷰포트별 캡처
```

---

## 품질 체크 (저장 전)

- [ ] `audit-score.json` 이 `schemas/audit.schema.json` auditScore 형태와 정확히 일치(7개 영역 키·`average`·`pass.{passed,failedAreas,reasons}`).
- [ ] `issues.json` 이 Audit Issue[] 형태와 일치(`id` 패턴 `AUDIT-NNN`·`severity`/`category` enum·`status`).
- [ ] 점수마다 근거가 있고, `average` 는 7개의 실제 평균이다(임의 조정 없음).
- [ ] 통과 판정이 5개 조건(평균≥85 / 모든 항목≥75 / accessibility≥80 / critical 0 / 안티패턴 critical 0)을 모두 적용했다.
- [ ] 스크린샷은 **실제 캡처**다(가짜 경로 없음). 캡처 불가 영역은 "미검증"으로 명시했다.
- [ ] 화면은 정적 예시가 아니라 **실제 상태**(빈/오류/채워진)로 검수했다(안티패턴 15).
- [ ] 이슈마다 시스템 문제 vs 구현 문제를 구분했고, 시스템 변경은 `design/DECISION-LOG.md` 에 기록했다.
- [ ] 자기 문서·권고 예시에도 진부한 AI 기본값(순수 #000/#fff, Tailwind 기본 보라/파랑, 이모지 장식, 가짜 수치)을 쓰지 않았다.
- [ ] 최대 반복 도달 후에도 미통과면 자동 확정·강제 통과하지 않고 **AskUserQuestion** 으로 사용자에게 다음 행동을 물었다("생성보다 판단").

---

## 다음 단계

- **통과 시**: 디자인 시스템·목업이 검증됐다. 이후 모든 UI 작업 전 `design/DESIGN.md` 를 읽고 `design/TOKENS.json` 으로 값을 가져온다(사용자 프로젝트 `CLAUDE.md` 의 Design Rules 블록, CONTRACT §16). 새 핵심 화면을 만들면 다시 `/design-audit` 를 돌린다.
- **미통과 + 시스템 문제 다수**: `design/DESIGN-DIRECTION.md`·`design/TOKENS.json` 을 다시 손봐야 한다 — `/design-system` 으로 회귀를 권한다.
- **미통과 + 방향 자체 의심**: 사용자가 선택을 바꾸고 싶다면 `/design-select` 부터 다시 본다.

> 감사의 목적은 점수가 아니라 **고칠 곳을 드러내는 것**이다. 통과는 끝이 아니라, "이제 이 시스템을 믿고 쌓아도 된다"는 신호다.
