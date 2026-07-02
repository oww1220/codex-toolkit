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

로컬 소스는 `plugins/<plugin-name>`에서 관리합니다.

### `ppt-tools`

PPT 문서 작업용 Codex 스킬 플러그인입니다.

- `ppt-planning-harness`
- `ppt-wireframe-generator`

### `frontend-tools`

프론트엔드 점검용 Codex 스킬 플러그인입니다.

- `a11y-focus-audit`
- `figma-implementation-audit`
- `frontend-reuse-scout`

### `skill-tools`

스킬 제작/검증용 Codex 스킬 플러그인입니다.

- `skill-enhancer-codex`

### `agent-tools`

서브에이전트 오케스트레이션용 Codex 스킬 플러그인입니다.

- `subagent-orchestration`

### `design-tools`

디자인 방향 설정/오케스트레이션용 Codex 스킬 플러그인입니다.

- `ai-design-director`
- `design-orchestrator`

### `workflow-tools`

작업 완료/커밋 워크플로우용 Codex 스킬 플러그인입니다.

- `completion-summary`
- `git-conventional-commit`
