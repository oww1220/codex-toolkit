---
name: git-conventional-commit
description: Use when the user asks to commit changes, write a git commit message, or create a Conventional Commits formatted commit. Trigger on "커밋해줘", "commit 해줘", "커밋 메시지 작성해줘". Stage only the relevant files, enforce the allowed types feat, fix, refactor, test, docs, style, chore, build, ci, and write a short Korean summary. Skip when the user only asks for git status or a diff summary.
---

# Conventional Git Commit

## Workflow

1. Inspect `git status --short` and `git diff --cached` first.
2. If nothing relevant is staged, stage only the files for the requested change. Do not include unrelated work.
3. Choose the smallest accurate `type` from the allowed list.
4. Write `summary` in Korean, short and specific, with no trailing period.
5. Add a body only when needed or when the change is non-trivial.
   - Use 2-5 bullet lines.
   - Describe real changed files or visible behavior.
   - If verification ran, make the last bullet the command or result.
6. Commit with one subject line and an optional bullet body, for example:
   - `git commit -m "type: summary" -m "- file or behavior\n- file or behavior\n- verification, if any"`
7. If the request mixes unrelated changes or the scope is unclear, narrow it before committing.

## Message Rules

- Allowed types: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `chore`, `build`, `ci`.
- Subject format: `type: summary`.
- Keep the summary short and in Korean.
- Keep the body factual; do not invent changes or verification.
