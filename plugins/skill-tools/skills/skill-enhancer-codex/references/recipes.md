# Recipes

> **로드 시점**: 본문에 표·게이트·분기·핸드오프를 작성할 때.

## Trigger-Rich Description

```yaml
---
name: my-skill
description: Use when Codex needs to audit, create, or improve X. Trigger phrases include "check X", "make X skill", and "fix X skill". Skip when the request is about Y.
---
```

## Mode Table

```markdown
| Mode | Use For | Action |
|---|---|---|
| CREATE | New artifact | Gather missing inputs, generate, validate |
| AUDIT | Existing artifact | Run checks and report findings |
| IMPROVE | Fix findings | Back up, patch, re-run checks |
```

## Script Gate

```markdown
Validate with:

```bash
python3 scripts/check.py <target>
```

Do not report completion while the command exits non-zero.
```

## Reference Routing

```markdown
Read only what applies:

| Topic | Reference |
|---|---|
| API details | `references/api.md` |
| Test cases | `references/tests.md` |
```

## Output Discipline

Keep scratch reports in the current workspace or `/private/tmp`. Reserve the selected `<skill-dir>` for the skill package itself.
