---
name: git-conventional-commit
description: >
  사용자가 변경 사항 커밋, Git 커밋 메시지 작성 또는 Conventional Commits 형식의 커밋 생성을 요청할 때 사용한다. 트리거 —
  "커밋해줘", "commit 해줘", "커밋 메시지 작성해줘". 관련 파일만 스테이징하고 허용된 타입 feat, fix, refactor, test, docs,
  style, chore, build, ci를 사용하며 짧은 한국어 요약을 작성한다. 비-트리거: git status 또는 diff 요약만 요청하는 경우.
---

# Conventional Git Commit

## Workflow

1. 먼저 `git status --short`와 `git diff --cached`를 확인한다.
2. 스테이징이나 커밋 전에 다음 두 가지를 항상 사용자에게 선택받는다.
   - 커밋 범위: 현재 작업 맥락에서 변경한 파일만 포함할지, 작업 트리의 모든 변경을 포함할지 선택한다.
   - 완료 시점: 로컬 커밋 후 멈출지, 원격 저장소까지 push할지 선택한다.
   커밋 범위는 반드시 답을 받아야 한다. 완료 시점에 답이 없으면 로컬 커밋 후 멈춘다. 명시적 선택 없이 push하지 않는다.
3. 선택한 범위의 파일만 스테이징하고 범위 밖 변경은 포함하지 않는다.
4. 허용 목록에서 가장 작고 정확한 `type`을 선택한다.
5. `summary`는 마침표 없이 짧고 구체적인 한국어로 작성한다.
6. 필요한 경우 또는 변경이 단순하지 않을 때만 본문을 추가한다.
   - 2~5개의 bullet을 사용한다.
   - 실제 변경 파일이나 눈에 보이는 동작을 설명한다.
   - 검증을 실행했다면 마지막 bullet에 명령이나 결과를 쓴다.
7. 제목 한 줄과 선택적 bullet 본문으로 커밋한다. 예:
   - `git commit -m "type: summary" -m "- file or behavior\n- file or behavior\n- verification, if any"`
8. 사용자가 원격 push 완료 시점을 선택한 경우에만 push하고, 그렇지 않으면 로컬 커밋 후 멈춘다.
9. 선택한 범위에 관련 없는 변경이 섞여 있으면 커밋 전에 범위를 좁힌다.

## Message Rules

- 허용 타입: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `chore`, `build`, `ci`.
- 제목 형식: `type: summary`.
- 요약은 짧은 한국어로 쓴다.
- 본문은 사실에 근거하며, 하지 않은 변경이나 검증을 만들지 않는다.
