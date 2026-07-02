## Pipeline Context
| 항목 | 내용 |
|------|------|
| **파이프라인 위치** | [예: 최상위 오케스트레이터 — 모든 기획/빌드 스킬을 순차 호출] |
| **입력 소스** | [예: 사용자 아이디어 (1문장~상세 기획)] |
| **출력 대상** | [예: 완성된 앱 + <skill>-report.md] |
| **호출 스킬** | [예: eureka, neurion, socrates, council, screen-spec, tasks-generator, auto-orchestrate] |

## 실행 계약 (Canonical Contract)
- 입력 문서는 항상 `docs/planning/06-tasks.md` (체인된 스킬이 공유하는 인터페이스)
- Task ID 규칙: `P0-T0.1` / `P{N}-R{M}-T{X}` / `P{N}-S{M}-V`
- Phase 1+ 는 `git worktree add … -b phase-* main`; **머지/푸시는 오케스트레이터만**
- 디스패치 프리미티브: 사용 가능한 Codex tool 또는 subagent 도구를 명시한다.
- **메인 에이전트가 소스 코드 직접 작성 절대 금지** — 디스패치만 한다

## 컨텍스트 폭발 제어 + 서브에이전트 (컨텍스트 공유 안 함)
- max_turns ≤ 15 (복잡해도 15 초과 금지), 병렬 ≤ 3~4, `run_in_background: true`
- 서브에이전트 결과는 한 줄만: `DONE:<id>` / `FAIL:<id>:<reason>`
- 각 서브에이전트에 **반드시 전달** (공유 컨텍스트가 없으므로): 핵심 산출물 경로 + 규칙 + 산출 경로 + 금지 목록

## 권한 우선순위 (master ↔ sub 충돌 시)
- 충돌하면 이 파일이 이긴다. master는 단계 순서/게이트를 소유하고 생산은 위임한다.

## handoff (세션 분할 시)
```
handoff-{ts}.json:
  { "completed_skill": "...", "next_skill": "...", "context_summary": "...", "output_files": [...] }
다음 스킬은 Glob(".codex/handoffs/*.json")로 찾아 읽고, 없으면 문서 직접 읽기로 폴백.
```
