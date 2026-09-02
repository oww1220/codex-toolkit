# codex-toolkit

Installable Codex plugins and skills.

## Plugins

마켓플레이스 등록:

```bash
codex plugin marketplace add oww1220/codex-toolkit --ref main
```

전체 설치:

```bash
codex plugin add ppt-tools@codex-toolkit
codex plugin add frontend-tools@codex-toolkit
codex plugin add skill-tools@codex-toolkit
codex plugin add agent-tools@codex-toolkit
codex plugin add design-tools@codex-toolkit
codex plugin add workflow-tools@codex-toolkit
```

개별 설치:

```bash
codex plugin add <plugin-name>@codex-toolkit
```

업데이트 후 재설치:

```bash
codex plugin marketplace upgrade codex-toolkit
codex plugin add <plugin-name>@codex-toolkit
```

## 플러그인별 스킬과 호출 조건

아래는 각 `SKILL.md`의 역할과 호출 조건을 요약한 안내입니다. 호출 예시는 요청 의도를 보여주며, 적용 여부와 세부 절차는 연결된 스킬 원문을 기준으로 합니다.

### `ppt-tools`

기획 문서의 요구사항 보강과 PPT 와이어프레임·명세서 작업용 플러그인입니다.

| 스킬 | 역할 | 호출 조건·요청 예시 | 제외·주의사항 |
|---|---|---|---|
| [ppt-planning-harness](plugins/ppt-tools/skills/ppt-planning-harness/SKILL.md) | PRD·RFP·기획서·DB 명세서의 누락과 모순을 검토하고 구현 가능한 수준으로 보강 | 기획 검토·보강이 필요할 때: “PRD 검토”, “요구사항 보강”, “기존 기획서 업데이트”, “테이블명세서 검토” | 단순 요약·번역·맞춤법 교정, 구현만 하는 작업, 디자인 시안만 만드는 작업은 제외 |
| [ppt-wireframe-generator](plugins/ppt-tools/skills/ppt-wireframe-generator/SKILL.md) | 화면 흐름·저충실도 와이어프레임·테이블 명세를 PPTX로 구성 | “PPT 와이어프레임 만들어줘”, “화면 흐름 PPT”, “테이블명세서 PPT”, “DB 명세서 PPT” | 실제 PPTX 생성은 Presentations 스킬에 위임. 일반 발표자료·기존 PPT 편집·템플릿 추종·네이티브 Google Slides·고충실도 목업·앱 구현은 별도 흐름 |

### `frontend-tools`

웹 UI 퍼블리싱과 접근성·디자인 정합성·재사용 후보 점검용 플러그인입니다.

| 스킬 | 역할 | 호출 조건·요청 예시 | 제외·주의사항 |
|---|---|---|---|
| [ui-publisher](plugins/frontend-tools/skills/ui-publisher/SKILL.md) | 마크업·스타일·접근성·표현용 인터랙션 구현 | “퍼블리싱해줘”, “UI 화면 구현해줘”, “접근성 반영해서 화면 만들어줘”, “인터랙션 스크립트 작업해줘” | API·서버 상태·인증·권한·업무 검증·계산·데이터 저장·변환·전역 상태 설계가 핵심인 요청은 제외 |
| [a11y-focus-audit](plugins/frontend-tools/skills/a11y-focus-audit/SKILL.md) | 접근성 코드 품질과 실제 키보드 Tab 포커스 이동 점검 | “접근성 확인해줘”, “탭 포커스 이동 확인해줘”, “a11y 리뷰해줘”, “키보드 접근성 봐줘” | 픽셀 비교만 하는 작업, 접근성과 무관한 서버/API 리뷰, 검토 없이 구현만 요청한 경우는 제외. 브라우저 미확인 항목은 별도 표시 |
| [figma-implementation-audit](plugins/frontend-tools/skills/figma-implementation-audit/SKILL.md) | Figma 링크·프레임·노드·스크린샷과 구현 화면의 시각·인터랙션 일치 여부 비교 | 디자인 원본과 구현 화면을 비교할 때: “피그마 정합성”, “피그마 링크랑 화면 비교”, “구현 화면 QA” | Figma 파일 편집만 하거나 디자인 원본 없이 일반 프론트엔드 디버깅만 하는 요청은 제외 |
| [frontend-reuse-scout](plugins/frontend-tools/skills/frontend-reuse-scout/SKILL.md) | 반복 스타일·컴포넌트·훅·유틸의 공통화 후보와 최소 패치·검증 방법 제안 | “공통화 후보 확인해줘”, “공통 스타일/로직 뽑을 거 있는지 봐줘”, “프론트 공통화 스카우트” | 자동 수정 없이 제안까지만 수행. 단일 버그 수정·픽셀 수정·이번 파일만 수정하도록 제한된 요청은 제외 |

### `skill-tools`

스킬 제작/검증용 Codex 스킬 플러그인입니다.

| 스킬 | 역할 | 호출 조건·요청 예시 | 제외·주의사항 |
|---|---|---|---|
| [skill-enhancer-codex](plugins/skill-tools/skills/skill-enhancer-codex/SKILL.md) | Codex 스킬 생성·감사·구조 개선과 참조 파일·스크립트 검증 | “Codex 스킬 만들어줘”, “SKILL.md 작성해줘”, “스킬 구조 검토해줘”, “참조 파일 검증해줘” | 스킬 패키지가 아닌 일반 앱·라이브러리의 실행 성능 최적화 요청은 제외 |

### `agent-tools`

서브에이전트 오케스트레이션용 Codex 스킬 플러그인입니다.

| 스킬 | 역할 | 호출 조건·요청 예시 | 제외·주의사항 |
|---|---|---|---|
| [subagent-orchestration](plugins/agent-tools/skills/subagent-orchestration/SKILL.md) | 큰 작업의 조사·검증·구현·리뷰 경계를 나눠 병렬 운영 | “서브에이전트 띄워줘”, “서브에이전트로 나눠줘”, “병렬 에이전트로 검토해줘” | 실제 서브에이전트 실행 도구가 필요. 단일 에이전트로 충분한 작업은 제외하며, 구현 전용 서브에이전트는 사용자 명시 허용 시에만 사용 |

### `design-tools`

디자인 방향 설정/오케스트레이션용 Codex 스킬 플러그인입니다.

| 스킬 | 역할 | 호출 조건·요청 예시 | 제외·주의사항 |
|---|---|---|---|
| [ai-design-director](plugins/design-tools/skills/ai-design-director/SKILL.md) | 실제 레퍼런스 비교·선택으로 취향과 방향을 정하고 디자인 시스템·토큰·목업으로 연결 | “디자인 방향 잡아줘”, “레퍼런스 찾아줘”, “디자인 후보 비교”, “내 취향 찾아줘”, “디자인 시스템 만들어줘”, “UI 목업 만들어줘” | 곧바로 화면을 생성하는 흐름이 아니라 실제 레퍼런스 탐색과 사용자의 비교·선택을 선행 |
| [design-orchestrator](plugins/design-tools/skills/design-orchestrator/SKILL.md) | 레이아웃·색상·타이포·접근성 등 필요한 역할 관점으로 디자인 검토 | “디자인 관점별로 검토해줘”, “레이아웃 색상 타이포 접근성 같이 봐줘”, “디자인 역할 나눠서 봐줘” | 디자인 판단이 필요 없는 단순 CSS 수정·명확한 구현 지시·디자인과 무관한 버그·빌드·백엔드·데이터 작업은 제외. 모든 역할을 무조건 실행하지 않음 |

### `workflow-tools`

코드 주석, 문서 가독성, 작업 완료, 토큰 절약, 커밋 워크플로우용 Codex 스킬 플러그인입니다.

| 스킬 | 역할 | 호출 조건·요청 예시 | 제외·주의사항 |
|---|---|---|---|
| [code-context-comments](plugins/workflow-tools/skills/code-context-comments/SKILL.md) | 역할·계약·데이터 흐름·부작용·실패 처리·이유를 주석으로 설명 | 코드 이해나 Javadoc·JSDoc·docstring 보강이 필요할 때: “이 코드의 역할과 흐름을 주석으로 설명해줘” | 작업 범위가 없으면 현재 변경분 또는 전체 대상 중 선택을 확인. 생성 코드·외부 라이브러리·마이그레이션 산출물은 수정하지 않음 |
| [document-visual-readability](plugins/workflow-tools/skills/document-visual-readability/SKILL.md) | 자료의 사실과 정보 밀도를 보존하며 문서 생성·구조 편집·가독성 검수 | “이 자료로 문서 만들어줘”, “문서 가독성 개선해줘”, “내용은 유지하고 구조만 정리해줘”, “문서 구조를 검수해줘” | 단순 요약·번역·맞춤법 교정·근거 없는 신규 내용·PPT 디자인은 제외. 생성·편집은 HTML 기본, 지정 형식 우선; 검수 요청은 수정 없이 결과만 반환 |
| [completion-summary](plugins/workflow-tools/skills/completion-summary/SKILL.md) | 완료된 변경과 이유를 쉽게 설명하고 관련 수정 방법 안내 | “완료 요약해줘”, “변경사항 정리해줘”, “왜 이렇게 작업했는지 설명해줘”, 변경 맥락에서 “그러면 어디를 어떻게 고쳐야 해?” | 신규 기능 전체 계획·맥락 없는 일반 설명·단순 Git 상태/diff 확인·커밋 생성·HTML 문서 생성은 제외. 설명 요청만으로 파일을 수정하지 않음 |
| [quota-saver](plugins/workflow-tools/skills/quota-saver/SKILL.md) | 필수 품질은 유지하면서 선택적 조사·도구 호출·검증 범위·설명을 줄여 사용량 절약 | 사용자가 `$quota-saver`를 명시했을 때만 적용: “$quota-saver로 처리해줘” | 단순히 짧게 답해 달라는 요청에는 적용하지 않음. 안전성·정확성·데이터 손실 방지·필수 절차는 생략하지 않음 |
| [git-conventional-commit](plugins/workflow-tools/skills/git-conventional-commit/SKILL.md) | 한국어 요약의 Conventional Commits 메시지 작성과 요청 범위 커밋 | “커밋해줘”, “commit 해줘”, “커밋 메시지 작성해줘” | 단순 Git 상태·diff 요약은 제외. 스테이징·커밋 전 범위와 로컬 커밋/원격 push 여부를 확인하며, 명시 선택 없이 push하지 않음 |
