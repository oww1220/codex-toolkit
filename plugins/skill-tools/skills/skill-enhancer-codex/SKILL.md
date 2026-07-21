---
name: skill-enhancer-codex
description: Codex skills meta-workflow for creating new skills, auditing existing skills, and planning safe skill improvements. Use when the user asks to make a Codex skill, write SKILL.md, check or audit a skill, improve skill structure, validate references/scripts, or use "/skill-enhancer-codex". Skip when the user asks to optimize the runtime behavior of an unrelated app or library rather than the skill package itself.
---

# Skill Enhancer Codex

Use this for Codex skill structure, discovery text, bundled references, scripts, and templates. Keep changes small; prefer `SKILL.md` plus only the resources that are actually used.

Resolve `<skill-root>` to the directory containing this loaded `SKILL.md`. Never assume a global install path.

## Modes

Choose the first mode that fits:

| Mode | Use For | Action |
|---|---|---|
| CREATE | New Codex skill | Interview only for missing intent, then run `scripts/scaffold.py` |
| AUDIT | Existing skill check | Run `scripts/audit.py` and `scripts/refs_check.py` |
| IMPROVE | Fix a skill after audit | Back up first, patch the smallest set of files, then re-run audit |
| PROMOTE | Reuse a repeated pattern | Move only durable guidance into references/templates |

If a user decision is required and the tool is available, use `request_user_input`. Otherwise ask one concise question. Do not invent preferences that change public behavior.

## CREATE

1. Read `references/create-interview.md` only when the request lacks enough detail to generate the skill.
2. Write a small config JSON outside the skill install directory, then run:

```bash
python3 <skill-root>/scripts/scaffold.py <config.json> <skill-dir>
```

3. Fill any remaining placeholders directly in the generated `SKILL.md`.
4. Validate with:

```bash
python3 <skill-root>/scripts/audit.py <skill-dir> --json
python3 <skill-root>/scripts/refs_check.py <skill-dir>
```

## AUDIT

Run both scripts and report HARD/WARN/INFO honestly:

```bash
python3 <skill-root>/scripts/audit.py <skill-dir> --json
python3 <skill-root>/scripts/refs_check.py <skill-dir>
```

Use `references/audit-rubric.md` for interpreting checks and `references/anti-patterns.md` for fixes.

## IMPROVE

1. Turn findings into `{section, change, reason}`.
2. Back up the target `SKILL.md` before editing.
3. Patch only files needed for the findings.
4. Re-run the audit scripts.

## References

Read only what the current mode needs:

| Topic | Reference |
|---|---|
| Methodology | `references/methodology.md` |
| Create interview | `references/create-interview.md` |
| Reusable snippets | `references/recipes.md` |
| Codex frontmatter | `references/frontmatter-spec.md` |
| Placement rules | `references/decision-rules.md` |
| Audit rubric | `references/audit-rubric.md` |
| Common mistakes | `references/anti-patterns.md` |
| Ship checklist | `references/authoring-checklist.md` |
| Self improvement | `references/self-improvement.md` |

## Rules

- Keep `SKILL.md` under 500 lines.
- Use `references/` for detail that is loaded conditionally.
- Use `scripts/` only when deterministic repeatability is worth the file.
- Do not create empty resource directories.
- Keep temporary reports and scratch files outside the Codex skills directory.
