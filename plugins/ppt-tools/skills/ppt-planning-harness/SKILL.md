---
name: ppt-planning-harness
description: >
  PPTX 기획서, PRD, RFP, 요구사항, 회의록, 스토리보드, 서비스 아이디어를 단순 요약이 아니라 구현 가능한 PPTX 산출물로 검토하고 보강한다. 트리거
  — "PPT 기획 하네스", "PPT Planning Harness", "ppt-planning-harness", "기획 하네스", "Planning Harness", "PRD 검토", "요구사항 보강",
  "RFP 분석", "스토리보드 기획", "구현 가능한 기획서로 만들어줘", "기존 기획서 업데이트", "기획서 보강 반영", "테이블명세서 검토", "DB 명세서 보강".
  비-트리거: 단순 문서 요약, 번역, 맞춤법 교정은 일반 문서 작업으로 처리한다; 이미 구현만 요청한 작업은 해당 구현 흐름으로 처리한다; 디자인 시안 제작만 요청한
  작업은 디자인 또는 프론트엔드 구현 흐름으로 처리한다.
---

# PPT Planning Harness

## 무엇을 / 언제 (한 줄)
사용자가 기획 문서나 아이디어를 구현 가능한 수준으로 검토, 보강, 재구성하거나 기존 기획서에 보강 내용을 반영해 달라고 할 때 사용한다.

## 제약 (MUST DO / MUST NOT DO) — 스텝 위에 둔다
- ✅ 요약에서 멈추지 말고 누락, 모순, 정책, UX, 기술, QA 관점으로 문서를 보강한다
- ✅ 치명 정보가 부족하면 산출물 작성 전에 1-3개의 핵심 질문을 먼저 한다
- ✅ 불확실한 항목은 확정하지 않고 `확인 필요`로 표시한다
- ✅ PPTX 기획서를 기본 산출물로 두고, 22개 검토 항목은 내부 품질 기준으로만 사용하며 결과만 슬라이드/메모에 자연스럽게 반영한다
- ✅ 내부 검토 결과는 별도 체크리스트 슬라이드가 아니라 각 PPTX 페이지의 목적, 흐름, 상태, 정책, 구현 메모, 검증, 확인 필요 영역에 나눠 주입한다
- ✅ 구현 항목, 화면, API, 정책, 테스트 시나리오는 개발자가 바로 작업 단위로 쪼갤 수 있도록 목적, 동작, 예외, 완료 기준을 구체적인 description으로 작성한다
- ✅ 테이블명세서나 DB 명세서 요청은 `Table Spec` 검토 분기로 보고 PK/FK, 타입, 필수값, 기본값, 관계, 인덱스, 제약, 상태값, 개인정보/권한, API/validation 불일치를 확인한다
- ✅ PPTX 기획서를 만들거나 업데이트하면 구조 검사 스크립트를 실행하고, 실패 시 산출물을 수정한 뒤 통과할 때까지 재실행한다
- ⛔ 최종 PPTX에 `22개 검토 항목`, `Planning Harness 체크리스트`, `Executive Summary` 같은 내부 체크리스트 항목명을 그대로 노출하지 않는다
- ⛔ 제공되지 않은 정책, 수치, 일정, 법적 요구사항을 사실처럼 만들지 않는다
- ⛔ 단순 요약본이나 회의록 정리본으로 끝내지 않는다
- ⛔ 작은 아이디어에 과한 시스템 설계나 코드 수준 세부사항을 억지로 붙이지 않는다
- ⛔ 사용자가 파일 산출물을 요청하지 않았는데 임의로 파일을 만들지 않는다.

## 핵심 워크플로우
1. 입력 문서와 요청 의도를 읽고 산출물 깊이를 판단한다 — 문서/아이디어 -> 비즈니스 목표, 이해관계자, 구현 준비도
2. 사전 조사를 수행한다 — 제공 문서, 첨부, 레포 문서, 기존 정책/화면/API, 필요한 최신 외부 근거 -> 확인된 사실과 공백
3. 치명 누락 정보를 확인한다 — 목표/대상/범위/제약 누락 -> 질문 1-3개 또는 `확인 필요` 표시
4. 필요하면 서브에이전트 검토를 디스패치한다 — 복잡한 PRD/RFP/권한/정책/보안/결제/운영 문서 -> Product/UX, Solution/API/DB, QA/Security 관점 검토
5. references/output-template.md를 내부 검토 체크리스트로 읽고 각 슬라이드에 주입할 검토 결과를 정리한다 — 분석 결과 -> 페이지별 목적/흐름/상태/정책/구현/검증 메모
   - 테이블명세서 요청이면 각 테이블 슬라이드에 목적, 주요 컬럼, PK/FK/관계, nullable/default, unique/index, 상태값/enum, 개인정보/민감정보, 권한, validation/API 연결, 확인 필요를 나눠 주입한다
6. PPTX 산출물이나 기존 PPTX 기획서 업데이트가 있으면 구조 검사 스크립트를 실행한다 — `python3 /Users/idong-geol/.codex/skills/ppt-planning-harness/scripts/check_planning_doc.py <file.pptx>`
7. 구조 검사 실패 시 출력된 `FAIL:` 항목을 산출물에 반영하고 같은 명령을 다시 실행한다 — PPTX 수정은 `ppt-wireframe-generator`로 라우팅하고, 실패 0개가 될 때까지 반복, 통과 전 완료 보고 금지
8. 최종 검토 서브에이전트를 스폰한다 — 초안 -> 누락, 충돌, 개발 준비도 검토 결과
9. 검증 결과를 반영한다 — reviewer/tester 결과 -> 보강된 최종 기획 문서
10. 출력: 기본 산출물은 PPTX 파일이며, 채팅에는 변경 요약과 파일 경로만 짧게 보고한다.

## 사전 조사
- 먼저 사용자가 준 문서, 첨부, 링크, 현재 repo의 README/docs/AGENTS/API/schema/test 자료를 확인한다.
- 테이블명세서 요청이면 schema, migration, model, entity, ERD, API DTO, validation, seed/test 자료를 우선 확인한다.
- 일정, 법/정책, 가격, 외부 서비스 스펙, 시장/경쟁 정보처럼 변할 수 있는 사실은 최신 근거를 확인하고 출처를 남긴다.
- 사전 조사는 확인된 사실, 추론, 미확인 공백으로 나눠 최종 기획서에 반영한다.
- 조사 범위가 크면 `planner`로 요구사항 근거 정리, `architect`로 시스템/연동 근거 정리, `security`로 정책/권한/개인정보 근거 정리를 스폰한다.
- 근거를 찾지 못한 항목은 만들지 말고 `확인 필요`로 남긴다.

## 질문 우선 조건
아래 중 하나라도 없어서 산출물 방향이 바뀌면, 작성 전에 1-3개만 묻는다.

- 대상 사용자 또는 이해관계자
- 해결하려는 핵심 문제와 성공 기준
- 필수 범위와 제외 범위
- 권한, 결제, 개인정보, 법/운영 정책처럼 되돌리기 어려운 제약
- 테이블명세서의 대상 DB/서비스 범위, 근거 스키마 위치, 실제 schema 기준인지 초안 기준인지 여부

질문하지 않아도 되는 누락은 섹션 안에 `확인 필요`로 표시하고 계속 진행한다.

## 서브에이전트 활용
- 긴 PRD/RFP, 다중 권한, 관리자 기능, 결제, 보안, 개인정보, 운영 정책, 복잡한 API/DB 설계가 있으면 `subagent-orchestration`을 적극 사용한다.
- 기본 역할은 Product/UX, Solution/API/DB, QA/Security 중 필요한 2-3개 사전 검토와 1개 최종 검토로 제한한다.
- 작은 아이디어, 단일 화면, 단순 정책 보강은 현재 에이전트가 직접 처리한다.
- 서브에이전트 결과는 그대로 붙이지 말고 충돌, 누락, 실행 가능한 결정만 최종 PPTX 슬라이드/메모에 반영한다.
- 자체 점검, 최종 리뷰, QA처럼 분리 가능한 검토 작업은 메인 에이전트가 혼자 처리하지 말고 `reviewer` 또는 `tester` 서브에이전트로 스폰한다.
- 현재 세션에 서브에이전트 실행 도구가 없을 때만 단일 에이전트 fallback을 쓰고, 최종 답변에 fallback 사실을 밝힌다.

## 서브에이전트 페르소나
전역 롤 정의는 `/Users/idong-geol/.codex/skills/subagent-orchestration/agents/*.toml`을 기준으로 한다. 실제 스폰할 때는 `subagent-orchestration`의 도구 탐색 규칙을 먼저 따르고, 메시지 첫 줄에 `Agent label: [role]`을 넣는다.

| Role | 언제 스폰하나 | 검토 범위 |
|---|---|---|
| `planner` | 요구사항, 범위, 우선순위, 일정/의존성이 불명확할 때 | 기능 분해, 범위, 우선순위, 미정 사항, 리스크 |
| `designer` | 사용자 흐름, IA, 화면 위계, UX writing 판단이 필요할 때 | User/Admin/Exception Flow, Screen List, IA, UX Review |
| `architect` | 시스템 경계, 앱/패키지 책임, 외부 연동 구조가 큰 문서일 때 | 기술 구조, 의존성, side effect, 과설계 여부 |
| `backend` | API, validation, auth, domain logic, error handling이 핵심일 때 | API Draft, 권한, 검증, 예외 처리 |
| `db_designer` | entity, 관계, migration, index, 데이터 무결성이 필요할 때 | Database Draft, 관계, 상태값, 제약, 개인정보 필드 |
| `security` | 인증/권한, 개인정보, 결제, secret, trust boundary가 있을 때 | Security Policy, Permission/Auth, 입력 검증, 보안 리스크 |
| `tester` | 테스트 전략, acceptance criteria, 회귀 범위가 약할 때 | Test Scenario, Acceptance Criteria, Regression Checklist |
| `reviewer` | 최종 산출물의 누락/충돌/과설계를 확인할 때 | 내부 검토 결과 반영, 모순, 실행 가능성 |

기본 조합은 `planner` + `designer` 사전 검토, 기술 리스크가 있으면 `backend` 또는 `db_designer`를 추가한다. 보안/개인정보/결제가 있으면 `security`를 우선 추가한다. 최종 검토는 보통 `reviewer`, QA가 약하면 `tester`를 쓴다.

스폰 메시지 예시:

```text
Agent label: [planner]
제공된 기획 문서를 요구사항, 범위, 우선순위, 미정 사항 관점만 검토해줘. 직접 파일을 수정하지 말고, 핵심 결론 3줄과 리스크 1개만 반환해줘.
```

```text
Agent label: [designer]
사용자 흐름, 정보 구조, 화면 위계, 빈/오류/로딩 상태 관점만 검토해줘. 직접 파일을 수정하지 말고, 누락된 화면/상태와 최소 UX 개선안을 반환해줘.
```

```text
Agent label: [security]
인증/권한, 개인정보, 입력 검증, 결제/secret 리스크 관점만 검토해줘. secret 값은 추측하지 말고, 확인해야 할 근거와 영향도를 분리해줘.
```

서브에이전트 반환 계약:

- 핵심 결론 3줄
- 누락/충돌 3개 이하
- 최종 기획서에 반영할 문장 또는 결정 후보
- 리스크 1개

## 참조 자료 (라우팅 테이블)
| Topic | Reference | Load When |
|---|---|---|
| 내부 검토 항목과 Step 1-12 검토 체크리스트 | references/output-template.md | 기획 문서, PRD, RFP, 요구사항, 회의록, 스토리보드, 서비스 아이디어를 구현 준비 PPTX 산출물로 보강할 때 |
> 각 reference 파일은 첫 줄을 `> **로드 시점**: <같은 조건>`으로 시작해 트리거를 메아리친다.

## 출력 위치 (필수)
- ✅ 기획서 산출물은 기본적으로 cwd 상대 경로 아래 `.pptx` 파일로 만든다
- ✅ 사용자가 기존 PPTX 기획서 업데이트를 요청한 경우 해당 파일을 직접 수정하고, 원문 흐름을 가능한 한 유지한다
- ✅ 채팅 답변과 PPTX에는 내부 체크리스트 전문을 덤프하지 말고 변경 요약, 확인 필요, 산출 경로만 짧게 제공한다
- ✅ PPT 와이어프레임이나 화면 흐름 PPT를 생성/수정할 때는 `ppt-wireframe-generator` 스킬로 라우팅한다
- ✅ 테이블명세서 PPTX를 생성/수정할 때도 `ppt-wireframe-generator`의 `Table Spec` 분기로 라우팅한다
- ✅ PPTX 산출물이나 기존 PPTX 기획서 업데이트 후에는 `scripts/check_planning_doc.py <file.pptx>`를 실행한다
- ⛔ `/Users/idong-geol/.codex/skills/`(설치 디렉터리) 안 임시 산출물 / 홈 절대경로

## 구조 검사 스크립트
`scripts/check_planning_doc.py`는 기획서 초안이나 업데이트된 PPTX 파일이 있을 때 실행한다. 이 스크립트는 내용 품질을 판단하지 않고, PPTX의 열기 가능한 deck 구조, 슬라이드 수, 화면/흐름/목적/description/CTA/상태/구현 메모 신호를 검사한다. `.md` 검사는 사용자가 Markdown 산출물을 명시적으로 요청한 경우에만 쓰는 호환 분기다.

검증/수정 루프:

```bash
python3 /Users/idong-geol/.codex/skills/ppt-planning-harness/scripts/check_planning_doc.py <file.pptx>
```

- 실패하면 출력된 `FAIL:` 항목만 기준으로 deck을 보강한다.
- PPTX 수정은 `ppt-wireframe-generator`를 사용해 deck을 재수정한다.
- 보강 후 같은 명령을 다시 실행한다.
- `checks_failed: 0`이 나오기 전에는 완료로 보고하지 않는다.
- 구조 검사를 통과한 뒤에도 내용 품질 검토가 필요하면 `reviewer` 또는 `tester`를 스폰한다.

## 최종 검토 스폰 게이트
최종 답변 전에 `reviewer`를 스폰해 아래 5개를 검토시킨다. 테스트/acceptance criteria가 약하면 `tester`도 추가한다. 하나라도 실패하면 해당 섹션을 보강한 뒤 필요 시 다시 검토시킨다.

- 내부 검토 결과가 각 PPTX 페이지의 목적, 흐름, 상태, 정책, 구현 메모, 검증, 확인 필요 영역에 나눠 반영됐고 체크리스트 항목명은 노출되지 않았다.
- 누락 요구사항과 누락 정책을 별도 섹션에 분리했다.
- API/DB/권한/검증/예외/상태/테스트가 최소 1회씩 점검됐고, 테이블명세서에서는 PK/FK/타입/필수값/기본값/인덱스/제약/개인정보가 점검됐다.
- 추정과 확인된 사실을 섞지 않았고, 불확실한 내용은 `확인 필요`로 표시했다.
- 개발자가 다음 작업을 이슈나 태스크로 바로 나눌 수 있다.

```text
Agent label: [reviewer]
최종 PPTX 기획서 초안을 페이지별 내부 검토 결과 주입, 체크리스트 항목명 노출 여부, 누락 요구사항/정책, API/DB/권한/검증/예외/상태/테스트 점검 여부, 추정과 사실 분리 관점으로만 검토해줘. 직접 수정하지 말고, 실패 항목과 반영 문장만 반환해줘.
```
