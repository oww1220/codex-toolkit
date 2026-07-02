# Methodology

> **로드 시점**: 설계/감사 전 큰 그림이 필요할 때.

## Principles

- Put trigger context in `description`; the body loads only after discovery.
- Keep `SKILL.md` procedural and short.
- Put long detail in directly linked `references/` files.
- Add scripts only for repeatable checks or generation.
- Do not add placeholders, empty directories, or future-facing scaffolding.

## Create Flow

1. Define the task the skill handles.
2. Name the skill in kebab-case.
3. Write `description` with concrete trigger phrases and skip context.
4. Add only required resources.
5. Run `scripts/audit.py` and `scripts/refs_check.py`.

## Audit Flow

Report findings as evidence, not taste:

- HARD: must fix before claiming usable.
- WARN: useful but not blocking.
- INFO: optional improvement.

Prefer one small patch over broad rewrites.
