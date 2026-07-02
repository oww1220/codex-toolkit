---
name: frontend-reuse-scout
description: >
  프론트 작업 후 공통 스타일, 컴포넌트, 훅, 유틸 로직 후보를 찾아 최소 패치 제안과 검증 방법을 정리한다. 트리거 — "공통화 후보 확인해줘", "공통
  스타일/로직 뽑을 거 있는지 봐줘", "작업물 늘었는데 재사용할 부분 자동으로 찾아줘", "프론트 공통화 스카우트". 비-트리거: 특정 버그 하나만 고치는 요청;
  디자인 픽셀 수정만 원하는 요청; 사용자가 이번 파일만 건드리라고 범위를 좁힌 요청.
---

# Frontend Reuse Scout

## 무엇을 / 언제 (한 줄)
프론트 변경이 쌓였을 때 반복 UI, 스타일, 로직을 찾아 공통화 후보와 안전한 최소 패치 방향을 제안한다.

## 제약 (MUST DO / MUST NOT DO) — 스텝 위에 둔다
- ✅ 작업 전 `git status --short`로 현재 변경 상태를 확인하고 사용자 변경을 되돌리지 않는다.
- ✅ 기존 컴포넌트, 스타일 구조, 네이밍, 접근성/테스트/runtime hook을 먼저 확인한다.
- ✅ 후보는 근거, 최소 변경 방향, 제거할 도메인 override, 검증 명령까지 함께 낸다.
- ⛔ v1에서는 코드 자동 수정을 하지 않고 후보와 패치 제안까지만 한다.
- ⛔ 1회성 코드나 화면 전용 spacing wrapper를 억지로 공통화하지 않는다.
- ⛔ 새 dependency, 새 디자인 시스템, 새 추상화를 먼저 제안하지 않는다.
- ⛔ 출력은 cwd 상대 경로 + `mkdir -p` 가드로만 한다. 채팅 덤프 금지.

## 핵심 워크플로우
1. 현재 변경과 repo 규칙을 확인한다 — 입력: cwd, 사용자 요청, git status/diff, AGENTS.md 또는 repo docs → 출력: 건드리면 안 되는 사용자 변경과 적용 범위
2. 기존 프론트 구조를 찾는다 — 입력: package 구조, components/styles/hooks/utils 디렉터리, 기존 naming → 출력: 이 repo에서 공통 코드가 놓이는 실제 위치
3. 반복 후보를 `rg` 중심으로 탐색한다 — 입력: 변경 파일의 selector, class prefix, token, 함수명, hook/composable 이름 → 출력: 중복 위치와 사용 맥락
4. 후보를 분류한다 — 입력: 중복 근거와 변경 위험 → 출력: extract now, leave local, remove stale override, needs decision
5. 가능하면 서브에이전트로 검증만 분리한다 — 입력: 후보 목록과 repo 경계 → 출력: frontend/publishing/reviewer의 짧은 리스크 검토. 서브에이전트는 파일을 수정하지 않는다
6. 최소 패치 제안을 작성한다 — 입력: 확정 후보 → 출력: 바꿀 파일, 보존할 hook, 제거할 도메인 스타일/class, 실행할 검증
7. 검증: 각 extract now 후보에 2곳 이상 반복 근거, 기존 구조상 배치 위치, 보존할 hook, 제거할 stale override, 검증 명령이 모두 있는지 를 확인한다.
8. 출력: 산출물을 cwd 상대 경로에 둔다.

## 출력 위치 (필수)
- ✅ `extract now`, `leave local`, `remove stale override`, `needs decision` 네 묶음의 후보 리포트
- ✅ 각 후보별 파일 경로, 반복 근거, 최소 변경 방향, 검증 명령
- ✅ 코드 자동 수정이 필요하면 사용자의 별도 구현 지시를 받는다는 명시
- ⛔ 채팅 코드 덤프 / `/Users/idong-geol/.codex/skills/`(설치 디렉터리) 안 임시 산출물 / 홈 절대경로
