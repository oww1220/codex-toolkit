# Anti Patterns

> **로드 시점**: 문제 설명 / 작성 중 실수 회피.

- Vague description: Codex will not discover the skill reliably. Fix by adding concrete task phrases.
- Long `SKILL.md`: move conditional detail into `references/`.
- Unlinked reference file: add a routing row in `SKILL.md` or delete the file.
- Missing script: either add the script or remove the instruction.
- Empty resource directory: delete it until a real file exists.
- Broad rewrite after audit: fix the smallest finding first.
- Scratch output in the skill install directory: use workspace paths or `/private/tmp`.
