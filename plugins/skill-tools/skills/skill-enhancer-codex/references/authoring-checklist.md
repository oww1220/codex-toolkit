# Pre-Ship Authoring Checklist

> **로드 시점**: 스킬을 출하(ship)하기 직전 최종 점검.

- [ ] Frontmatter has exactly name + description; name is kebab-case and equals the dirname.
- [ ] Description is routing logic, not marketing: states what+how, and for user-routed skills includes quoted 'use when' trigger phrases plus a 'don't use when' / 비-트리거 anti-trigger. (Terse one-liner only if the skill is orchestrator-invoked.)
- [ ] Decided routing style: trigger phrases in the description (dominant) OR a trigger: list — not both half-done.
- [ ] Use only `name` and `description` in Codex skill frontmatter.
- [ ] SKILL.md is a router: under ~500 lines; heavy detail lives in references/ behind explicit load triggers (a 참조 라우팅 'Load When' table and/or 'read references/X before you act' sentences).
- [ ] Every references/ file has a trigger sentence in SKILL.md, and every 'read references/X' pointer resolves to a real file (run refs_check.py).
- [ ] Each references/ file opens with '> 로드 시점: <same condition>' echoing its trigger.
- [ ] If multi-mode: a Step-0 mode/output-type table (input→output→start-template) with a one-line decision heuristic and 'ask the user if ambiguous, don't pick silently.'
- [ ] If a pipeline: numbered Phases, each ending in an explicit 통과 조건 / Phase 전환 조건 gate, with a no-skip-ahead rule.
- [ ] Constraints are stated above the steps as MUST DO / MUST NOT DO (✅/⛔) and, for ABSOLUTE rules, carry a dated incident/feedback provenance tag.
- [ ] Deterministic checks are scripts that exit non-zero on failure (not prose 'verify by hand'); prose rules mirror the code checks; failure forces regression to an earlier step.
- [ ] Scripts are invoked by exact copyable command lines; judgment stays with the agent; Windows/encoding caveats noted where relevant; metric output is surface-parsable (metric_name: <number>).
- [ ] Templates use placeholder markers ({{...}}/[[ ]]/[REPLACE-*]) with a hard 'fill placeholders only, don't edit structure/CSS' rule; seeded by a script where applicable.
- [ ] No empty placeholder scripts/ or assets/ dirs; a subdir exists only if it ships files.
- [ ] Human decisions use `request_user_input` when available, otherwise one concise question.
- [ ] Outputs land in cwd-relative artifact paths with a mkdir -p guard and ❌금지/✅필수 path pairs; never the chat or the skill install dir.
- [ ] Grounding guardrails present: never fabricate numbers/features; leave honest placeholders ([확인 필요]); separate fact from interpretation; cite verified/external sources; add disclaimers/QA boundaries where stakes are high.
- [ ] A pre-output self-check question and/or a numeric self-eval rubric (with a fail floor) gates 'done.'
- [ ] If an orchestrator: a Pipeline Context header, a Canonical Contract (fixed input doc / ID format / branch & merge rules), handoff JSON for session splits, context-explosion caps (max_turns ≤15, run_in_background, one-line results, parallelism ≤3-4), and explicit pass-everything-to-sub-agents notes.
- [ ] If self-improving: a frozen judge separated from the target, a fitness/eligibility gate that refuses unmeasurable problems, append-only audit ledger, a resume doc, a stop-on-stagnation rule — and the agent never edits the judge.
- [ ] Forbidden process/tool terms (Playwright/ffmpeg/fixture/provisional//Users/…) do not leak into user-facing output (validator-scanned).
