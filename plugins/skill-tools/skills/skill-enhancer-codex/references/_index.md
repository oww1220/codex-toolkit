# skill-enhancer References — Catalog

> **로드 시점**: 어떤 reference를 읽어야 할지 모를 때 여기부터. **전부 읽지 말고**, 아래 표에서 지금 단계에 맞는 한 개만 골라 읽는다 (index-then-one-file).

| Reference | 읽는 때 | 핵심 내용 |
|---|---|---|
| [methodology.md](./methodology.md) | 설계/감사 전 전체 지도가 필요할 때. **정전(canon).** | 디렉터리 해부, frontmatter, progressive disclosure, scripts, templates/assets, 분기/게이트, 품질 머신, 오케스트레이션, 자기개선, 하우스 스타일 (A~K) |
| [recipes.md](./recipes.md) | 본문에 실제 구조를 **작성**할 때 | 복붙용 조각: description 쌍, Step-0 표, Phase 게이트, 탐지 캐스케이드(literal probe), request_user_input 분기, validator 게이트, 메트릭 계약, 라우팅 트리거, 오케스트레이터 헤더, 핸드오프, 출력 규율 |
| [frontmatter-spec.md](./frontmatter-spec.md) | frontmatter 작성/검증 | 필드별 필수/선택·허용값·패키징 길이 한계, 3종 표준 블록, spec↔코퍼스 화해 |
| [decision-rules.md](./decision-rules.md) | 구조 결정(어디에 둘지/분할 여부/게이트 필요?) | if-then 규칙 16개 |
| [audit-rubric.md](./audit-rubric.md) | AUDIT 결과를 사람에게 설명 | audit.py가 인코딩한 16개 check의 의미·심각도·fix, 출력 계약 |
| [anti-patterns.md](./anti-patterns.md) | 발견된 문제 설명 / 실수 회피 | 흔한 실패 20종 + 각 fix |
| [authoring-checklist.md](./authoring-checklist.md) | **출하 직전 최종 점검** | ship 전 체크 21항목 |
| [self-improvement.md](./self-improvement.md) | 스킬을 스스로 개선되게 / PROMOTE / skill-enhancer 단단하게 | 대화채굴·감독루프·Frozen-Metric RSI + 정직한 한계 |

스크립트(`../scripts/`)와 템플릿(`../templates/`)은 SKILL.md의 라우팅 표에서 직접 호출/복사한다.
