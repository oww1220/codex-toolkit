---
name: subagent-orchestration
description: 큰 작업을 병렬 서브에이전트로 검증, 구현, 리뷰 경계를 나눠 운영할 때 사용한다. Trigger on "서브에이전트 띄워줘", "서브에이전트로 나눠줘", "병렬 에이전트로 검토해줘". Skip when a simple single-agent edit or answer is enough.
---

# Subagent Orchestration

## Scope Guard

이 스킬은 실제 서브에이전트 실행 도구가 있는 세션에서만 사용한다.

초기 도구 목록에 보이지 않더라도 `tool_search`로 `multi_agent_v1`의 `spawn_agent`, `wait_agent`, `send_input`, `close_agent` 노출 여부를 먼저 확인한다.

도구가 없으면 이 워크플로를 따르지 말고, 일반적인 단일 에이전트 작업으로 처리한다.

## When to Use

- 이슈 1개를 병렬로 쪼개서 처리할 수 있을 때
- 조사, 검증, 구현이 분리되는 작업일 때
- 사전 검증, 메인 구현, 사후 검증 흐름이 유효하고 검증 수를 작업 위험도에 맞춰 조정할 때
- 실제 서브에이전트를 실행할 수 있는 환경일 때만 사용한다
- 메인 에이전트가 실제 파일 수정과 최종 결정을 담당하고, 서브에이전트는 기본적으로 검증, 분석, 리뷰만 담당할 때
- 구현 전용 서브에이전트는 사용자가 명시적으로 허용한 경우에만 사용할 때

## Tool Map

실제 실행은 현재 세션에서 제공되는 서브에이전트 실행 도구를 사용한다. 도구명이 다르면 그 세션의 실제 도구 규약을 따른다.

시작 전에 반드시 현재 세션에서 서브에이전트 실행 도구를 먼저 탐색해서, 실제로 `spawn_agent`가 가능한지와 `spawn_agent.agent_type` 허용값이 무엇인지 확인한다.

현재 세션에서 확인해야 할 도구는 다음 네 가지다.

- `spawn_agent`
- `wait_agent`
- `send_input`
- `close_agent`

## Agent Definition Source

- 전역 전문 롤을 구성하기 전에는 반드시 `/Users/idong-geol/.codex/skills/subagent-orchestration/agents` 아래의 TOML 정의를 먼저 확인한다.
- `spawn_agent` 도구 설명은 현재 세션의 실행 가능 타입과 `agent_type` 허용값을 확인하는 용도로 쓰고, 전문 페르소나의 실제 책임과 경계는 `/Users/idong-geol/.codex/skills/subagent-orchestration/agents/*.toml`을 기준으로 맞춘다.
- `default`, `explorer`, `worker`처럼 TOML 파일이 없는 도구 기본 롤은 보조 역할로만 쓰고, 전문 롤 12개와 혼동하지 않는다. TOML 전문 롤은 `agent_type`이 아니라 `Agent label`과 메시지의 책임 범위에 매핑한다.

## Global Role Roster

TOML 기준 전역 전문 책임 롤은 다음 12개다. 실제 `spawn_agent.agent_type`으로 사용할 수 있는 값은 현재 세션의 도구 설명을 따른다.

- `architect`: TurboRepo, package boundary, side effect 분석
- `planner`: 요구사항, 범위, 우선순위 정리
- `frontend`: Next.js, React Native, Vue, Storybook, component architecture
- `backend`: NestJS API, module, service, dto 설계
- `db_designer`: Supabase, Prisma relation 설계
- `publishing`: Webpack, EJS, SCSS, Storybook publishing specialist
- `accessibility`: 웹/앱 접근성, 키보드 조작, ARIA, focus, semantic markup 검토
- `security`: 인증/권한, secret, 입력 검증, 개인정보/결제 보안 리스크 검토
- `devops_ci`: GitHub Actions, 배포, Docker, env, 패키지 매니저, CI 실패 분석
- `designer`: 사용자 흐름, 정보 구조, 화면 위계, UX writing, 제품 디자인 판단
- `tester`: lint, build, browser smoke, regression 확인
- `reviewer`: 최종 diff 리뷰

## Risk-Based Agent Count

검증 서브에이전트 수는 작업 위험도에 따라 조정한다. 4개 이상 필요해 보이면 검증 수를 늘리기보다 작업을 더 작은 단위로 분할한다.

- 일반 작업: 사전 검증 2개, 사후 검증 1개를 기본으로 사용한다.
- 고위험 작업: 사전 검증은 최대 3개, 사후 검증은 기본 2개까지 늘린다.
- 고위험이면서 전문 영역 리스크가 큰 작업: 사후 검증을 최대 3개까지 늘릴 수 있다.
- 4개 이상의 사전 또는 사후 검증이 필요하면 작업 범위가 큰 신호로 보고 먼저 분할한다.

고위험 작업 예시는 DB 마이그레이션, 인증/권한, 결제, 데이터 손실 가능성, 대규모 리팩터, 다중 앱/패키지 경계 변경, 운영 영향이 큰 변경이다.

## Spawn Examples

실제로 역할을 띄울 때는 아래처럼 `spawn_agent`를 명시하고, 전문 역할명은 `Agent label`과 메시지 책임 범위에 적는다. `fork_context: true`를 쓰면 `agent_type`, `model`, `reasoning_effort`는 생략한다.

```text
spawn_agent({ fork_context: true, message: "Agent label: [architect]\nTurboRepo, package boundary, side effect 분석 관점만 검토해줘. 직접 파일을 수정하지 말고, 결론 3줄과 리스크 1개로 줘." })
spawn_agent({ fork_context: true, message: "Agent label: [planner]\n요구사항, 범위, 우선순위 정리 관점만 검토해줘. 직접 파일을 수정하지 말고, 결론 3줄과 리스크 1개로 줘." })
spawn_agent({ fork_context: true, message: "Agent label: [frontend]\nNext.js, React Native, Vue, Storybook, component architecture 관점만 검토해줘. 직접 파일을 수정하지 말고, 결론 3줄과 리스크 1개로 줘." })
spawn_agent({ fork_context: true, message: "Agent label: [backend]\nNestJS API, module, service, dto 설계 관점만 검토해줘. 직접 파일을 수정하지 말고, 결론 3줄과 리스크 1개로 줘." })
spawn_agent({ fork_context: true, message: "Agent label: [db_designer]\nSupabase, Prisma relation 설계 관점만 검토해줘. 직접 파일을 수정하지 말고, 결론 3줄과 리스크 1개로 줘." })
spawn_agent({ fork_context: true, message: "Agent label: [publishing]\nWebpack, EJS, SCSS, Storybook publishing specialist 관점만 검토해줘. 직접 파일을 수정하지 말고, 결론 3줄과 리스크 1개로 줘." })
spawn_agent({ fork_context: true, message: "Agent label: [accessibility]\n웹/앱 접근성, 키보드 조작, ARIA, focus, semantic markup 검토 관점만 검토해줘. 직접 파일을 수정하지 말고, 결론 3줄과 리스크 1개로 줘." })
spawn_agent({ fork_context: true, message: "Agent label: [security]\n인증/권한, secret, 입력 검증, 개인정보/결제 보안 리스크 검토 관점만 검토해줘. 직접 파일을 수정하지 말고, 결론 3줄과 리스크 1개로 줘." })
spawn_agent({ fork_context: true, message: "Agent label: [devops_ci]\nGitHub Actions, 배포, Docker, env, 패키지 매니저, CI 실패 분석 관점만 검토해줘. 직접 파일을 수정하지 말고, 결론 3줄과 리스크 1개로 줘." })
spawn_agent({ fork_context: true, message: "Agent label: [designer]\n사용자 흐름, 정보 구조, 화면 위계, UX writing, 제품 디자인 판단 관점만 검토해줘. 직접 파일을 수정하지 말고, 결론 3줄과 리스크 1개로 줘." })
spawn_agent({ fork_context: true, message: "Agent label: [tester]\nlint, build, browser smoke, regression 확인 관점만 검토해줘. 직접 파일을 수정하지 말고, 결론 3줄과 리스크 1개로 줘." })
spawn_agent({ fork_context: true, message: "Agent label: [reviewer]\n최종 diff 리뷰 관점만 검토해줘. 직접 파일을 수정하지 말고, 결론 3줄과 리스크 1개로 줘." })
```

## Execution Rule

1. 먼저 현재 세션에서 서브에이전트 실행 도구를 찾고, 실제로 spawn 가능한지 확인한다.
2. 확인 대상 도구는 `spawn_agent`, `wait_agent`, `send_input`, `close_agent`이며, `spawn_agent.agent_type` 허용값도 함께 확인한다.
3. 실행이 불가능하면 이 스킬은 분기 판단까지만 하고 단일 에이전트로 처리한다.
4. 실행이 가능하고 병렬 이득이 있으면 아래 순서로 진행한다.
   - 일반 작업은 사전 검증 서브에이전트 2개를 동시에 실행한다.
   - 고위험 작업은 사전 검증을 최대 3개까지 늘릴 수 있다.
   - 사전 검증 결과를 반드시 회수한다.
   - 회수한 검증 결과를 합쳐 현재 메인 에이전트가 실제 구현을 수행한다.
   - 구현 전용 서브에이전트는 사용자가 명시적으로 허용한 경우에만 사용한다.
   - 구현 완료 후 일반 작업은 사후 검증 서브에이전트 1개를 실행해 최종 확인한다.
   - 고위험 작업은 사후 검증을 2개, 전문 영역 리스크가 크면 최대 3개까지 늘릴 수 있다.
5. 각 서브에이전트는 역할이 겹치지 않게 분리하고, 같은 파일을 중복 수정하지 않도록 책임 범위를 먼저 적는다.
6. 사전 검증 결과는 메인 구현 전에 반드시 회수하고, 사후 검증 결과는 최종 응답 전에 반드시 회수한다. 작업이 끝난 에이전트는 정리한다.
7. 실행 중 추가 지시가 필요하면 `send_input`을 쓰고, 종료 후에는 `close_agent`로 정리한다.
8. 전역 12개 전문 롤이 실제로 맞는 경우에는, 기본 4단계 흐름 안에서 해당 롤을 `Agent label`과 메시지 책임 범위로 우선 배치한다.
   - 구조/경계 불명확: `architect`
   - 요구사항/범위 불명확: `planner`
   - UI/마크업/SCSS: `frontend` 또는 `publishing`
   - 프론트 API 연동/query/mutation/cache/loading/error 상태: `frontend`
   - API contract/request/response/DTO/validation/auth guard: `backend`
   - 프론트-백엔드 계약이 함께 바뀌는 작업: `frontend` + `backend`
   - 스키마/관계: `db_designer`
   - 보안/권한/secret/개인정보/결제: `security`
   - CI/CD/배포/env/Docker/패키지 매니저: `devops_ci`
   - 사용자 흐름/정보 구조/UX writing/제품 디자인 판단: `designer`
   - 접근성/회귀: `accessibility` 또는 `reviewer`
   - 실행 검증/회귀 확인: `tester`
   - 같은 책임의 롤끼리는 동시에 같은 파일을 수정하지 않는다.
9. 전역 12개 전문 롤은 후보군이며, 매 작업마다 모두 사용하지 않는다. 기본은 사전 검증 2개와 사후 검증 1개이며, 고위험 작업만 위 기준에 따라 늘린다.

## Spawn Shape

실제 실행이 필요한 경우에는 아래 역할 분담으로 spawn 한다.

- 사전 검증 A: 요구사항, 경계, 누락 가능성 확인
- 사전 검증 B: 구현 리스크, 대안, 충돌 가능성 확인
- 사전 검증 C: 고위험 작업에서만 전문 영역 리스크 확인
- 메인 구현: 현재 메인 에이전트가 검증 결과를 반영해 실제 코드 수정, 서브에이전트는 기본적으로 분석, 검증, 리뷰만 수행하고 직접 파일을 수정하지 않는다.
- 구현 권한이 명시적으로 허용된 경우에만 보조 구현 서브에이전트가 파일을 수정할 수 있다.
- 사후 검증: 변경 결과와 회귀 가능성 확인
- 추가 사후 검증: 고위험 작업에서 실행 검증, 최종 diff 리뷰, 전문 영역 회귀를 역할별로 분리

## Spawn Guidance

- 도구 탐색이 끝나기 전에는 spawn을 시작하지 않는다.
- `fork_context: true`를 기본으로 사용해서 현재 대화 맥락을 그대로 넘긴다. 이때 `agent_type`, `model`, `reasoning_effort`는 생략한다.
- 역할 지시는 짧게 쓰고, 담당 파일과 산출물을 명시한다.
- 모든 `spawn_agent` 메시지 첫 줄에는 `Agent label: [role]`을 포함해 UI 미리보기와 로그에 역할이 보이게 한다. `role`은 TOML 전문 롤 또는 실제 책임 범위와 일치시킨다.
- 도구 제약으로 `agent_type`을 생략해야 하는 경우에도 메시지 첫 줄의 `Agent label: [role]`은 유지한다. `agent_type`을 쓰는 경우에는 현재 도구가 노출한 허용값만 사용한다.
- 구현 권한이 없는 검증, 리뷰 계열에는 "직접 파일을 수정하지 말고, 분석 결과와 권장 수정 방향만 반환한다"를 함께 전달한다.
- 구현 전용 서브에이전트를 명시적으로 쓰는 경우에만 "서로의 변경을 되돌리지 말고, 충돌 시 조정한다"를 전달한다.
- 검증 계열에는 결론 3줄과 리스크 1개만 받는다.
- 검증 에이전트가 4개 이상 필요해 보이면 먼저 작업 분할을 제안한다.
- 전역 12개 롤을 쓰는 경우에는, 역할명을 `Agent label`에 적고 실제 책임 범위를 메시지에 적은 뒤 spawn한다.

## Output Rule

각 검증 서브에이전트는 아래 형식으로 짧게 반환한다.

- 핵심 결론 3줄
- 리스크 1개

메인 구현은 현재 메인 에이전트가 수행하며, 최종 응답에는 수정한 파일 목록과 핵심 변경점을 함께 정리한다.
구현 전용 서브에이전트를 명시적으로 사용한 경우에만 해당 서브에이전트가 수정한 파일 목록과 핵심 변경점을 반환한다.

## Constraints

- 전역 `/Users/idong-geol/.codex/skills/subagent-orchestration/agents` 아래의 agent 정의 파일은 수정하지 않는다.
- 이 스킬은 TOML에 정의된 전문 롤을 조합하고, 새 롤이 필요하면 `agents/*.toml`과 `SKILL.md`를 함께 갱신한다.
- repo 전용 경로, 검증 명령, 문서 규칙은 특정 저장소의 `AGENTS.md`와 `docs/`를 따른다.
- 서브에이전트는 기본적으로 분석, 검증, 리뷰만 수행하며, 사용자가 명시적으로 허용하지 않는 한 직접 파일을 수정하지 않는다.
- 사전 검증 결과 없이 메인 구현을 시작하지 않는다.
- 사후 검증 결과 없이 최종 완료로 판단하지 않는다.
- 전역 12개 전문 롤은 필요한 경우에만 선택적으로 사용한다.
