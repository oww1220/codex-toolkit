## 참조 자료 (라우팅 테이블)

| Topic | Reference | Load When |
|-------|-----------|-----------|
| 타입 시스템 | references/type-system.md | 타입 힌트·Protocol·Generic 사용 시 |
| Async 패턴 | references/async-patterns.md | async/await·동시성 구현 시 |
| 에러 처리 | references/errors.md | 예외 계층·재시도 설계 시 |

<!--
규칙:
- 모든 references/*.md 는 여기(또는 본문 인라인 문장)에 Load When 조건이 있어야 한다 (refs_check.py가 강제).
- 각 reference 파일은 첫 줄을 "> **로드 시점**: <같은 조건>" 으로 시작해 트리거를 메아리친다.
- 파일이 많으면 references/_index.md 카탈로그를 두고 "index-then-one-file": 인덱스 → 정확히 한 개만 읽기.
- 글롭 포인터(references/brands/<brand>.md, references/seeds/*.html)는 그 디렉터리 전체를 커버한다.
-->
