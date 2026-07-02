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
