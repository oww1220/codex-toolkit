# Codex Frontmatter Spec

> **로드 시점**: frontmatter 작성/검증 시.

Codex skills should keep YAML frontmatter minimal:

```yaml
---
name: skill-name
description: What this skill does and when Codex should use it.
---
```

## Rules

- `name` is required. Use lowercase letters, digits, and hyphens only.
- `description` is required. Put all trigger context here because Codex reads this before loading the body.
- Do not add Claude-specific fields such as `allowed-tools`, `user-invocable`, `disable-model-invocation`, `model`, `effort`, or shell preprocessing fields.
- Keep description concrete: include task names, common user phrases, and skip conditions when useful.
- Folder name should match `name`.

## Install Locations

- Global user skills: the active Codex global skills directory
- Project skills: use the project-local skill location only when the skill should not apply globally.
