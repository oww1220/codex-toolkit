---
name: skill-enhancer-codex
description: >
  새 Codex 스킬 생성, 기존 스킬 감사, 안전한 스킬 개선 계획을 위한 메타 작업 흐름이다. Codex 스킬 생성, SKILL.md 작성, 스킬 점검·감사,
  스킬 구조 개선, 참조 파일·스크립트 검증 또는 "/skill-enhancer-codex" 사용을 요청할 때 적용한다. 비-트리거: 스킬 패키지가 아닌 일반 앱·라이브러리의
  실행 성능 최적화 요청.
---

# Skill Enhancer Codex

Codex 스킬 구조, 탐색용 설명, 함께 제공하는 참조 자료, 스크립트, 템플릿에 사용한다. 변경은 작게 유지하고 실제로 쓰는 리소스만 `SKILL.md`에 추가한다.

`<skill-root>`는 현재 로드한 `SKILL.md`가 들어 있는 디렉터리로 해석한다. 전역 설치 경로를 가정하지 않는다.

## Modes

아래에서 처음으로 맞는 모드를 선택한다.

| 모드 | 사용 대상 | 수행 작업 |
|---|---|---|
| CREATE | 새 Codex 스킬 | 누락된 의도만 확인한 뒤 `scripts/scaffold.py`를 실행 |
| AUDIT | 기존 스킬 점검 | `scripts/audit.py`와 `scripts/refs_check.py` 실행 |
| IMPROVE | 감사 후 스킬 수정 | 먼저 백업하고 최소 파일만 패치한 뒤 감사를 다시 실행 |
| PROMOTE | 반복 패턴 재사용 | 오래 유지할 안내만 references/templates로 이동 |

사용자 결정이 필요하고 도구를 사용할 수 있으면 `request_user_input`을 사용한다. 그렇지 않으면 짧은 질문 하나만 한다. 공개 동작을 바꾸는 선호를 임의로 정하지 않는다.

## CREATE

1. 요청에 스킬 생성에 필요한 정보가 부족할 때만 `references/create-interview.md`를 읽는다.
2. 스킬 설치 디렉터리 밖에 작은 설정 JSON을 작성한 뒤 다음을 실행한다.

```bash
python3 <skill-root>/scripts/scaffold.py <config.json> <skill-dir>
```

3. 남은 placeholder는 생성된 `SKILL.md`에서 직접 채운다.
4. 다음으로 검증한다.

```bash
python3 <skill-root>/scripts/audit.py <skill-dir> --json
python3 <skill-root>/scripts/refs_check.py <skill-dir>
```

## AUDIT

두 스크립트를 모두 실행하고 HARD/WARN/INFO 결과를 사실대로 보고한다.

```bash
python3 <skill-root>/scripts/audit.py <skill-dir> --json
python3 <skill-root>/scripts/refs_check.py <skill-dir>
```

검사 결과 해석에는 `references/audit-rubric.md`를, 수정에는 `references/anti-patterns.md`를 사용한다.

## IMPROVE

1. 발견 사항을 `{section, change, reason}`으로 정리한다.
2. 편집 전에 대상 `SKILL.md`를 백업한다.
3. 발견 사항에 필요한 파일만 패치한다.
4. 감사 스크립트를 다시 실행한다.

## References

현재 모드에 필요한 자료만 읽는다.

| 주제 | 참고 자료 |
|---|---|
| 방법론 | `references/methodology.md` |
| 생성 인터뷰 | `references/create-interview.md` |
| 재사용 가능한 조각 | `references/recipes.md` |
| Codex frontmatter | `references/frontmatter-spec.md` |
| 배치 규칙 | `references/decision-rules.md` |
| 감사 기준 | `references/audit-rubric.md` |
| 흔한 실수 | `references/anti-patterns.md` |
| 배포 점검표 | `references/authoring-checklist.md` |
| 자체 개선 | `references/self-improvement.md` |

## Rules

- `SKILL.md`는 500줄 이하로 유지한다.
- 조건부로 로드하는 상세 내용은 `references/`에 둔다.
- 결정적 반복 실행의 가치가 있을 때만 `scripts/`를 사용한다.
- 비어 있는 리소스 디렉터리는 만들지 않는다.
- 임시 보고서와 scratch 파일은 Codex 스킬 디렉터리 밖에 둔다.
