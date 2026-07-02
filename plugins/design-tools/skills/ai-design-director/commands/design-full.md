---
name: design-full
description: AI Design Director 9단계 전체를 순차 오케스트레이션한다. brief→translate→research→compare→select→system→prototype→audit 를 Skill 툴로 차례로 호출하되, 매 단계 산출물 존재를 게이트로 확인하고 선택 단계는 절대 자동 skip 하지 않는다. MVP/Full 모드 구분. 트리거 — "디자인 처음부터 끝까지", "디자인 전체 파이프라인", "풀 디자인", "디자인 자동으로 다 해줘", "어디서부터 디자인할지 모르겠어", "/design-full".
allowed-tools: Read, Write, AskUserQuestion, Bash, Skill
---

# /design-full — 9단계 전체 오케스트레이션

> AI Design Director 파이프라인의 **진입점이자 지휘자**. "어디서부터 디자인을 시작해야 할지
> 모르겠다"의 기본 답이다. 이 커맨드는 디자인을 *직접 만들지 않는다* — 9개 단계 커맨드를
> 순서대로 호출하고, **각 단계 산출물이 실제로 생겼는지 게이트로 확인**하며, 사람이 판단해야 할
> 곳(선택·승인)에서 **반드시 멈춰 사용자에게 묻는다**.

## 정신 (BUILD CONTRACT §0 6원칙 — 오케스트레이터로서 특히 강하게)

- **생성보다 판단**: 전체를 한 번에 찍어내지 않는다. 단계마다 산출물을 보여주고, 다음 단계로 갈지 사용자에게 확인한다.
- **말보다 선택을 신뢰**: 후보 비교(`/design-compare`) → 선택(`/design-select`) 구간은 이 파이프라인의 *심장*이다. **사용자 선택(`selection.json`) 없이 이 두 단계를 자동 통과시키는 것은 절대 금지**.
- **모든 결정엔 이유**: 오케스트레이터가 임의로 내린 판단(모드 선택, 단계 건너뛰기, 재시도 여부)도 사용자에게 고지하고 기록한다.

> **🚫 2대 절대 게이트 (NO-SKIP · SKILL.md / CONTRACT §2 와 동기화)** — 오케스트레이터는 이 둘을 *어떤 모드에서도* 건너뛰지 않는다:
> 1. **레퍼런스 실견** — Step 3(`/design-research`)의 `design/research/`(`references.json` + 캡처) 증거 없이 후보·목업 생성 금지. 사용자가 준 레퍼런스 URL/이미지는 반드시 방문·열람. **MVP 모드 포함 필수.**
> 2. **HTML 시각 비교** — 후보 선택은 실제 렌더링 화면으로 받는다. `AskUserQuestion`·ASCII 로 시각 비교를 대체 금지(그건 방향·속성 질문 전용). MVP 라도 *순수 텍스트로만* 고르게 하지 않는다(최소한 레퍼런스 캡처 + 간이 HTML 미리보기 제시).

---

## 1. 목적

| 항목 | 내용 |
|------|------|
| **입력** | 자연어 아이디어 / 기존 PRD·소스 / 홈페이지 URL / 브랜드 자산 (있는 만큼). 또는 이미 진행된 `design/` 산출물(중간 재개). |
| **출력** | BUILD CONTRACT §3 의 `design/` 전체 트리 (단계마다 누적). 마지막에 산출물 트리 요약 + 다음 액션 제시. |
| **하는 일** | 9개 커맨드를 **Skill 툴로 순차 호출** + 단계별 **존재 게이트** + **BLOCKING 승인 게이트** + 진행 상태 요약. |
| **하지 않는 일** | 디자인 콘텐츠 자체 생성(각 단계 커맨드의 몫). 선택·승인 게이트 자동 통과. 산출물 없는데 다음 단계 강행. |

> 이 문서는 "어떤 순서로, 어디서 멈추고, 무엇을 확인하는가"의 **지휘 규약**이다. 각 단계가
> *무엇을 어떻게* 만드는지는 해당 커맨드 문서(`commands/design-*.md`)가 단일 출처다 — 여기서 중복 설명하지 않는다.

---

## 2. 단계 ↔ 커맨드 ↔ 게이트 (BUILD CONTRACT §2/§3 — 순서·경로 절대 고정)

| # | 단계 | Skill 호출 | 완료 게이트(이 파일들이 있어야 다음으로) | 종류 |
|---|------|-----------|------------------------------------------|------|
| 1 | 제품·사용자 인터뷰 | `/design-brief` | `design/DESIGN-BRIEF.md` | 정보 게이트 |
| 2 | 사용자 언어 번역 | `/design-translate` | `design/DESIGN-TRANSLATION.md`, `design/design-profile.json` | 정보 게이트 |
| 3 | 레퍼런스 탐색·평가 | `/design-research` | `design/research/REFERENCE-REPORT.md`, `design/research/references.json` | 정보 게이트 |
| 4 | 동일 콘텐츠 비교 UI | `/design-compare` | `design/compare/` (React/Vite 앱: `package.json`, `data/content.json`, `data/candidates.json`) | **사용자 행동 게이트** |
| 5 | 선택 합성 | `/design-select` | `design/selection.json`(+`approvedAt`), `design/DESIGN-DIRECTION.md`, `design/DECISION-LOG.md` | **BLOCKING 승인 게이트** |
| 6 | 디자인 시스템 | `/design-system` | `design/DESIGN.md`, `design/TOKENS.json`, `design/COMPONENTS.md` 외 6종 | 정보 게이트 |
| 7 | 핵심 흐름 목업 | `/design-prototype` | 실행 가능한 프런트엔드 목업 + 스크린샷 | 정보 게이트 |
| 8 | 감사·개선 루프 | `/design-audit` | `design/audit/AUDIT-REPORT.md`, `design/audit/audit-score.json`(통과까지 최대 3회) | 품질 게이트 |

**4→5 구간이 이 파이프라인의 절대 제약**이다:
- `/design-compare` 는 비교 앱을 만들 뿐, **선택은 사람이 한다**. 사용자가 `design/compare/selection.json` 을 만들기 전에는 `/design-select` 를 호출하지 않는다.
- `/design-select` 후에는 `selection.json` 의 `approvedAt` 이 채워졌는지(=사용자가 방향을 승인했는지) 확인하기 전에는 `/design-system` 으로 넘어가지 않는다.

> 게이트 확인은 `Bash` 로 파일 존재만 본다(`test -f`, `ls`). 내용 생성·수정은 각 단계 커맨드가 한다.

---

## 3. 모드 결정 (MVP vs Full — BUILD CONTRACT §19 / PRD §19.4)

작은 프로젝트에 8단계 풀 파이프라인은 과하다. **시작 직후 `AskUserQuestion` 으로 모드를 정한다.**

| 모드 | 대상 | 도는 단계 | 비고 |
|------|------|-----------|------|
| **Full** | 실제 제품, 여러 화면, 브랜드 의식, 팀 사용 | 1~8 전부 | 기본값(권장). 후보 비교 + 감사 루프 포함. |
| **MVP** | 1~2 화면 소품, 빠른 방향만 필요, 개인 도구 | 1, 2, 3, 5, 6 (compare·prototype·audit 생략) | **선택 단계는 여전히 사람이** — compare 앱 대신 `/design-select` 0단계의 AskUserQuestion 직접 선택을 쓴다. |

MVP 모드의 제약(고지 필수):
- compare 앱을 만들지 않으므로 **후보를 "보고" 고르는 경험이 약하다**(취향 발견 효과 감소). `/design-research` 산출(`references.json` + 스크린샷)만으로 `/design-select` 에서 AskUserQuestion 직접 선택.
- prototype·audit 를 생략하므로 **"schema 통과 ≠ 픽셀 통과"** 검증이 빠진다. 나중에 `/design-prototype` → `/design-audit` 를 따로 돌리도록 안내한다.
- **선택·승인 게이트는 모드와 무관하게 항상 사람이 통과**시킨다.

> 모드는 강제가 아니다. MVP 로 시작했다가 후보를 직접 보고 싶어지면 그 자리에서 `/design-compare` 로 승격한다.
> 결정한 모드와 그 이유는 진행 로그(아래 §6)와 `design/DECISION-LOG.md`(생성 이후)에 남긴다.

---

## 4. 오케스트레이션 플레이북

### Step 0 — 진입 진단 (어디서 시작할지부터 정한다)

1. **`design/` 현황 스캔** — `Bash` 로 이미 있는 산출물을 확인한다(중간 재개 지원):
   ```bash
   ls -1 design/ design/research design/compare design/audit 2>/dev/null
   ```
   §2 게이트 표 순서대로 "어느 단계까지 완료됐는지"를 판정한다. **이미 완료된 단계는 다시 돌리지 않는다**(사용자가 재실행을 명시하지 않는 한).
2. **시작 지점 제안** — `AskUserQuestion` 으로 물어 확정한다:
   - 처음부터(1단계) / 특정 단계부터 재개 / 특정 단계만 다시.
   - 동시에 **모드(MVP/Full)** 도 함께 묻는다(§3). 한 번의 AskUserQuestion 에 2~3개 묶어서.
3. **입력 자산 확인** — 아이디어/PRD/URL/브랜드 자산이 있는지 1줄로 정리해 사용자에게 보여준다(1단계 `/design-brief` 가 이걸 다시 수집하지만, 오케스트레이터도 무엇을 가지고 출발하는지 안다).

> 진단 결과를 **진행 로그 헤더**(§6)로 사용자에게 제시한 뒤 1단계로 진입한다.

### Step 1~3 — 정보 단계 (자동 진행, 단 산출물 게이트 확인)

각 단계를 **Skill 툴로 호출**하고, 끝나면 **게이트 파일 존재를 확인**한 뒤 다음으로 간다.

1. **`/design-brief` 호출** → 게이트: `design/DESIGN-BRIEF.md`.
2. **`/design-translate` 호출** → 게이트: `design/DESIGN-TRANSLATION.md` + `design/design-profile.json`.
   - 추가 검사: `design-profile.json` 의 `assumed[]` 가 `confirmed[]` 보다 과하게 많으면, "추정이 많습니다 — 인터뷰를 한 번 더 보강할까요?"를 AskUserQuestion 으로 묻는다(강제 아님).
3. **`/design-research` 호출** → 게이트: `design/research/REFERENCE-REPORT.md` + `design/research/references.json`.
   - 추가 검사: `references.json` 의 `candidates` 가 3개 미만이면 후보가 부족하다(BUILD CONTRACT §4.2: 기본 5, 최소 3). 사용자에게 알리고 `/design-research` 보강 또는 사용자 URL 추가를 권한다.

이 세 단계는 사람의 *선택*이 필요 없으므로 연속 진행한다. 단 각 단계 후 **1~2줄 요약**(무엇이 생겼는지)을 사용자에게 보여주고, 다음으로 갈지 가벼운 확인을 받는다(전부 자동 폭주 금지).

### Step 4 — 비교 UI 생성 (Full 모드) · ⚠️ 여기서 자동 진행이 멈춘다

> **이 단계는 절대 자동으로 통과시키지 않는다.** compare 는 *사람이 보고 고르는* 단계다.

1. **`/design-compare` 호출** → 게이트: `design/compare/`(앱 스캐폴드 + `data/content.json` + `data/candidates.json`).
2. **사용자에게 실행·선택을 명확히 안내**한다(오케스트레이터가 대신 고르지 않는다):
   > 비교 앱이 `design/compare/` 에 준비됐습니다. `cd design/compare && npm install && npm run dev` 로 띄운 뒤,
   > 후보들을 보고 **요소별 좋아요/싫어요**를 고르고 `selection.json` 을 **export(다운로드) 버튼**으로 내보내
   > `design/compare/selection.json` 으로 저장해 주세요. 다 고르면 알려주세요.
3. **사용자 행동 게이트** — `AskUserQuestion` 으로 "선택을 마치셨나요?"를 묻는다. 그리고 `Bash` 로 실제 파일을 확인한다:
   ```bash
   test -f design/compare/selection.json && echo OK || echo MISSING
   ```
   - `MISSING` 이면 **`/design-select` 로 넘어가지 않는다.** 다시 안내하고 대기한다(또는 사용자가 풀 비교앱을 원치 않으면, **게이트 2 를 지키는 선에서** MVP 식 경량 선택으로 전환 — 레퍼런스 캡처 + 후보 토큰을 적용한 간이 HTML 미리보기를 보여주고 고르게 하되, 순수 텍스트·ASCII 선택은 금지).
- **MVP 모드면 이 Step 4(풀 React 비교앱)를 건너뛴다.** 단 **게이트 2 는 면제가 아니다** — Step 5 의 `/design-select` 0단계에서 사용자에게 **레퍼런스 캡처 + 후보별 토큰을 적용한 간이 HTML 미리보기**를 보여주고 고르게 한다(순수 `AskUserQuestion` 텍스트·ASCII preview 만으로 선택받기 금지; AskUserQuestion 은 그 위의 보조 확인). 가짜 선택을 지어내지 않고 사용자에게 받는다. 그리고 **게이트 1(레퍼런스 실견)은 MVP 에서도 그대로 필수**다.

### Step 5 — 선택 합성 · 🔒 BLOCKING 승인 게이트

1. **선행 확인** — `design/compare/selection.json`(Full) 또는 사용자 직접 선택 의사(MVP)가 있는지 본다. 없으면 Step 4 로 되돌린다.
2. **`/design-select` 호출** → 게이트: `design/selection.json` + `design/DESIGN-DIRECTION.md` + `design/DECISION-LOG.md`.
3. **승인 게이트(자동 확정 금지)** — `/design-select` 자체가 6단계에서 AskUserQuestion 승인을 받는다. 오케스트레이터는 그 결과를 **`approvedAt` 으로 검증**한다:
   ```bash
   # approvedAt 이 빈 문자열("")/null 이 아니라 실제 date-time 값일 때만 APPROVED.
   # (빈 값도 APPROVED 로 새던 버그 방지 + BSD/GNU grep 양쪽 동작)
   if command -v jq >/dev/null 2>&1; then
     jq -e '(.approvedAt // "") != ""' design/selection.json >/dev/null \
       && echo APPROVED || echo PENDING
   else
     # 값이 ISO date-time(숫자로 시작)일 때만 매칭 — "approvedAt": "" 는 PENDING
     grep -Eq '"approvedAt"[[:space:]]*:[[:space:]]*"[0-9]' design/selection.json \
       && echo APPROVED || echo PENDING
   fi
   ```
   - `PENDING`(빈 `approvedAt`)이면 **`/design-system` 으로 절대 넘어가지 않는다.** 사용자에게 "방향 승인이 필요합니다"라고 알리고 `/design-select` 의 승인 단계를 다시 거치게 한다.
   - `APPROVED` 일 때만 다음으로 진행한다.

> 4→5 구간 요약: **compare 가 selection.json(사용자 선택)을 낳고, select 가 approvedAt(사용자 승인)을 낳는다.**
> 이 두 사용자 산물 없이 시스템·목업 단계로 가는 경로는 이 오케스트레이터에 존재하지 않는다.

### Step 6 — 디자인 시스템

1. **선행 확인** — `design/selection.json`(approvedAt 채워짐) + `design/DESIGN-DIRECTION.md`.
2. **`/design-system` 호출** → 게이트: `design/DESIGN.md` + `design/TOKENS.json` + `design/COMPONENTS.md` + `UX-PATTERNS.md` + `CONTENT-STYLE.md` + `MOTION.md` + `ACCESSIBILITY.md` + `ANTI-PATTERNS.md` + `REFERENCES.md`.
3. **토큰 검증(선택)** — `Bash` 로 `npx tsx scripts/validate-tokens.ts` 를 돌려 `TOKENS.json` 이 `schemas/tokens.schema.json` 에 맞고 임의 색/순수 `#000`·`#fff`/누락 토큰 그룹이 없는지 확인한다. 위반(exit 1)이면 `/design-system` 보완을 권한다.

### Step 7 — 핵심 흐름 목업 (Full 모드)

1. **선행 확인** — `design/TOKENS.json`(목업의 단일 출처) + `design/DESIGN.md` + `design/COMPONENTS.md`.
2. **`/design-prototype` 호출** → 게이트: 실행 가능한 목업 + 스크린샷.
- **MVP 모드면 생략**하고, "나중에 `/design-prototype` 로 핵심 화면을 목업화할 수 있다"고 안내한다(§5 다음 액션에 포함).

### Step 8 — 감사·개선 루프 (Full 모드)

1. **선행 확인** — 실행 가능한 목업 + `design/TOKENS.json`.
2. **`/design-audit` 호출** → 게이트: `design/audit/AUDIT-REPORT.md` + `design/audit/audit-score.json`.
3. **통과 판정**(BUILD CONTRACT §9 루브릭): 평균 ≥ 85 / 모든 항목 ≥ 75 / accessibility ≥ 80 / 치명 오류 0 / AI 안티패턴 치명 0.
   - 미통과면 `/design-audit` 가 **최대 3회**(사용자 조정 가능) 자동 개선 루프를 돈다. 오케스트레이터는 루프 횟수와 통과 여부만 추적한다.
   - 3회 후에도 미통과면 **자동으로 끝내지 않는다.** 남은 이슈를 사용자에게 보여주고 ① 추가 반복 ② 디자인 시스템으로 회귀(§6 단계 되돌리기) ③ 수동 마감 중 선택을 AskUserQuestion 으로 받는다.
- **MVP 모드면 생략**하고, "목업 후 `/design-audit` 로 검증하라"고 안내한다.

---

## 5. 실패·재시도·되돌리기 처리

각 단계 호출 후 **게이트 파일이 안 생겼으면** 자동으로 다음으로 가지 않는다:

| 상황 | 처리 |
|------|------|
| 게이트 파일 부재 | 그 단계를 1회 **재시도**(Skill 재호출). 그래도 없으면 사용자에게 원인(입력 부족·중단 등)을 보고하고 **AskUserQuestion** 으로 재시도/입력 보강/중단 선택. |
| 선행 산출물 부재(건너뛰고 진입한 경우) | 해당 선행 단계를 먼저 돌리도록 안내하고, 사용자 동의 시 그 단계를 호출한 뒤 복귀. |
| compare 선택 미완(Step 4) | 다음으로 가지 않고 대기. "직접 선택(MVP 식)으로 전환" 옵션 제시. |
| 승인 미완(Step 5 approvedAt 빈 값) | `/design-system` 차단. `/design-select` 승인 단계로 되돌림. |
| 감사 3회 후 미통과(Step 8) | 자동 종료 금지. 추가 반복 / 시스템 회귀 / 수동 마감 중 사용자 선택. |
| 사용자가 "이전 단계가 잘못됐다" | 해당 단계로 되돌린다. 이후 단계 산출물은 **무효화 고지**(예: 토큰이 바뀌면 목업·감사 재실행 필요)하고 DECISION-LOG 에 기록. |

> 되돌리기 원칙: **앞 단계를 고치면 그에 의존한 뒤 단계는 재검증이 필요하다.** 토큰(6) 변경 → 목업(7) 재생성 → 감사(8) 재실행. 이 의존성을 사용자에게 명확히 알린다.

---

## 6. 진행 상태 보고 (매 단계 전환 시)

사용자가 "지금 어디까지 왔는지"를 항상 알게 한다. 단계 전환마다 아래 형태의 **진행 로그**를 보여준다:

```
AI Design Director · 진행 상태 (모드: Full)
[✔] 1 brief       design/DESIGN-BRIEF.md
[✔] 2 translate   design/DESIGN-TRANSLATION.md · design-profile.json
[✔] 3 research    references.json (후보 5)
[▶] 4 compare     비교 앱 생성됨 — 사용자 선택 대기 중 🔒
[ ] 5 select
[ ] 6 system
[ ] 7 prototype
[ ] 8 audit
```

- `✔` 완료(게이트 통과) · `▶` 진행/대기 · `🔒` 사용자 행동·승인 대기 · `✖` 실패(재시도 필요).
- MVP 모드면 생략 단계를 `—(MVP 생략)` 으로 표시한다.
- 이 로그는 텍스트로 충분하다(별도 파일 생성 불필요). 다만 임의 판단(모드 결정, 단계 건너뜀, 되돌리기)은 `design/DECISION-LOG.md` 가 생성된 뒤 거기에 항목으로 남긴다.

---

## 7. 산출물 경로 (BUILD CONTRACT §3 — 절대 고정)

`/design-full` 은 새 파일을 직접 만들지 않는다 — 각 단계 커맨드가 만든 아래 트리를 **누적·검증**한다.
완료 시 사용자에게 이 트리(존재하는 항목만 `✔` 표시)를 제시한다.

```
design/
├── DESIGN-BRIEF.md              # 1 /design-brief
├── DESIGN-TRANSLATION.md        # 2 /design-translate
├── design-profile.json          # 2 /design-translate
├── research/
│   ├── REFERENCE-REPORT.md      # 3 /design-research
│   ├── references.json          # 3 /design-research
│   └── screenshots/             # 3 /design-research
├── compare/                     # 4 /design-compare (Full 모드)
│   ├── data/content.json
│   ├── data/candidates.json
│   └── selection.json           #   ← 사용자가 export
├── DESIGN-DIRECTION.md          # 5 /design-select
├── selection.json               # 5 /design-select (approvedAt 채워짐)
├── DECISION-LOG.md              # 5 이후 누적
├── DESIGN.md                    # 6 /design-system
├── TOKENS.json                  # 6 /design-system (모든 값의 단일 출처)
├── COMPONENTS.md / UX-PATTERNS.md / CONTENT-STYLE.md / MOTION.md
├── ACCESSIBILITY.md / ANTI-PATTERNS.md / REFERENCES.md   # 6 /design-system
└── audit/                       # 8 /design-audit (Full 모드)
    ├── AUDIT-REPORT.md
    ├── audit-score.json
    ├── issues.json
    └── before/ after/ screenshots/
```

프로젝트 횡단 취향 프로필: `~/.design-director/profile.json` (단계 진행 중 갱신될 수 있음 — BUILD CONTRACT §4.6).

---

## 8. 품질 체크 (오케스트레이션 종료 전)

- [ ] **선택 단계 자동 skip 0건** — `/design-compare`→`/design-select` 사이에서 `design/compare/selection.json`(또는 MVP 직접 선택) 없이 진행한 적이 없다.
- [ ] **승인 없는 다음 단계 진입 0건** — `selection.json` 의 `approvedAt` 이 빈 채로 `/design-system` 을 호출하지 않았다.
- [ ] 각 단계 후 **게이트 파일 존재를 실제로 확인**(`test -f`/`ls`)했고, 부재 시 다음으로 가지 않았다.
- [ ] 모드(MVP/Full)를 **AskUserQuestion 으로 사용자에게 받았고**, MVP 생략 단계의 손실(취향 발견 약화·픽셀 검증 누락)을 고지했다.
- [ ] 단계 전환마다 **진행 상태 로그**를 보여줬다(사용자가 현재 위치를 안다).
- [ ] 실패한 단계는 **재시도 → 사용자 선택**으로 처리했고, 조용히 폭주하거나 자동 종료하지 않았다.
- [ ] 앞 단계 수정 시 **의존하는 뒤 단계 재검증 필요**를 사용자에게 알렸다(토큰 변경 → 목업·감사 재실행).
- [ ] 오케스트레이터의 임의 판단(모드·건너뜀·되돌리기)을 `design/DECISION-LOG.md` 에 기록했다(생성 이후).
- [ ] 진부한 AI 기본값(순수 `#000/#fff`, Tailwind 기본 보라/파랑, 이모지 장식, 가짜 수치, 균등 카드 그리드)을 자기 보고·요약에서도 쓰지 않았다(BUILD CONTRACT §1 자가검열). 진행 로그의 상태 마커(`✔ ▶ 🔒`)는 장식이 아니라 상태 전달 기능이므로 허용.

---

## 9. 종료 안내 (마지막에 사용자에게)

오케스트레이션이 끝나면(또는 사용자가 중단하면) 아래를 제시한다:

1. **완료 단계 요약** — §6 진행 로그 최종본(어디까지 됐는지).
2. **산출물 트리** — §7 트리에서 실제 생성된 항목만 `✔` 로 표시.
3. **다음 액션 제안**(상황별):
   - Full 완료 + 감사 통과 → "이제 `design/TOKENS.json` 과 `design/DESIGN.md` 를 기준으로 실제 화면을 구현하세요. 사용자 프로젝트 `CLAUDE.md` 에 Design Rules 블록(BUILD CONTRACT §16)을 추가할까요?" (AskUserQuestion).
   - MVP 완료 → "방향과 시스템이 섰습니다. 핵심 화면을 검증하려면 `/design-prototype` → `/design-audit` 를 이어서 돌리세요."
   - 감사 3회 미통과 → 남은 critical 이슈 목록 + 권장 회귀 단계.
   - 중간 중단 → 다음에 재개할 단계(`/design-full` 재호출 시 Step 0 가 자동 감지) 안내.

> `/design-full` 의 성공은 "전부 자동으로 끝냈다"가 아니라, **"사용자가 매 갈림길에서 판단했고,
> 그 판단이 일관된 시스템으로 누적됐다"** 이다. 마지막까지 결정권은 사용자에게 둔다.

---

## 참고 — 단독 호출 vs 오케스트레이션

- 특정 단계만 필요하면 해당 커맨드를 **직접** 호출한다(`/design-research` 만, `/design-audit` 만 등). 각 커맨드는 선행 산출물 부재를 스스로 안내한다.
- 전체 흐름을 모르거나 "어디서부터"가 막막하면 이 `/design-full` 로 진입한다 — Step 0 진단이 현재 `design/` 상태를 읽어 알맞은 시작점을 제안한다.
- 이미 일부가 진행된 프로젝트에서 `/design-full` 을 다시 호출하면, 완료된 단계는 건너뛰고 **다음 미완 단계부터** 재개한다(중복 재생성하지 않음).
