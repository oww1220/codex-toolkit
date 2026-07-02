# Audit Rubric

> **로드 시점**: AUDIT 결과를 사람에게 설명할 때.

`scripts/audit.py` returns HARD, WARN, and INFO findings.

## Severity

- HARD: install/runtime blocker. Do not report pass.
- WARN: quality or discovery issue. Skill may work, but fix if it affects expected use.
- INFO: recommendation only.

## Checks

| Check | Severity | Meaning |
|---|---:|---|
| `frontmatter` | HARD | Missing or malformed YAML frontmatter |
| `name` | HARD | Missing `name` |
| `description` | HARD | Missing `description` |
| `name-kebab` / `name-len` | WARN | Name is not valid Codex skill naming |
| `name-dirname` | WARN | Folder name differs from frontmatter name |
| `desc-len` | WARN | Description is too long for useful discovery |
| `discovery` | WARN | Description lacks concrete trigger phrases |
| `refs-dangling` | HARD | SKILL.md points at missing local reference files |
| `refs-untriggered` | WARN | Reference file exists but SKILL.md never routes to it |
| `script-missing` | WARN | SKILL.md names a missing bundled script |
| `gate` | WARN | Multi-phase flow lacks nearby gate criteria |
| `empty-dir` | WARN | Empty resource directory exists |
| `output-path` | WARN | Instructions tell Codex to put scratch output in a home/install directory |
| `banned-term` | WARN | Output template leaks internal process terms |

Fix the smallest real issue first. Do not rewrite the skill just to raise the score.
