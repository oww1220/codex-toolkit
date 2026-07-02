# codex-toolkit

Installable Codex plugins and skills.

## Plugins

### `ppt-tools`

PPT 문서 작업용 Codex 스킬 플러그인입니다.

- `ppt-planning-harness`
- `ppt-wireframe-generator`

원본은 `plugins/ppt-tools`에서 관리합니다. 전역 설치는 플러그인 소스를 GitHub에 올린 뒤 별도로 진행합니다.

설치:

```bash
codex plugin marketplace add oww1220/codex-toolkit --ref main
codex plugin add ppt-tools@codex-toolkit
```

업데이트 후 재설치:

```bash
codex plugin marketplace upgrade codex-toolkit
codex plugin add ppt-tools@codex-toolkit
```

### `frontend-tools`

프론트엔드 점검용 Codex 스킬 플러그인입니다.

- `a11y-focus-audit`
- `figma-implementation-audit`
- `frontend-reuse-scout`

원본은 `plugins/frontend-tools`에서 관리합니다. 전역 설치는 플러그인 소스를 GitHub에 올린 뒤 별도로 진행합니다.

설치:

```bash
codex plugin marketplace add oww1220/codex-toolkit --ref main
codex plugin add frontend-tools@codex-toolkit
```

업데이트 후 재설치:

```bash
codex plugin marketplace upgrade codex-toolkit
codex plugin add frontend-tools@codex-toolkit
```

### `skill-tools`

스킬 제작/검증용 Codex 스킬 플러그인입니다.

- `skill-enhancer-codex`

원본은 `plugins/skill-tools`에서 관리합니다. 전역 설치는 플러그인 소스를 GitHub에 올린 뒤 별도로 진행합니다.

설치:

```bash
codex plugin marketplace add oww1220/codex-toolkit --ref main
codex plugin add skill-tools@codex-toolkit
```

업데이트 후 재설치:

```bash
codex plugin marketplace upgrade codex-toolkit
codex plugin add skill-tools@codex-toolkit
```

### `agent-tools`

서브에이전트 오케스트레이션용 Codex 스킬 플러그인입니다.

- `subagent-orchestration`

원본은 `plugins/agent-tools`에서 관리합니다. 전역 설치는 플러그인 소스를 GitHub에 올린 뒤 별도로 진행합니다.

설치:

```bash
codex plugin marketplace add oww1220/codex-toolkit --ref main
codex plugin add agent-tools@codex-toolkit
```

업데이트 후 재설치:

```bash
codex plugin marketplace upgrade codex-toolkit
codex plugin add agent-tools@codex-toolkit
```
