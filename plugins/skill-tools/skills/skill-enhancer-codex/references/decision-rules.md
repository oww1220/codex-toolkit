# Decision Rules (if-then)

> **로드 시점**: references/ vs scripts/ vs templates/ 배치, 스킬 분할, 게이트 필요 여부 등 구조 결정을 내릴 때.

- IF the detail is prose/spec/component-markup/per-phase protocol that's only sometimes needed → put it in references/ behind a 'read X when…' trigger. IF it's deterministic measurement/validation/scaffolding/parsing → put it in scripts/. IF it's a structured artifact the skill produces → put a placeholder skeleton in templates/. IF it's a static/binary resource embedded in output (font, image, sfx, starter HTML) → put it in assets/.
- IF a step must be tamper-proof, repeatable, or its failure must block progress → make it a script that exits non-zero (validator-as-gate), not prose. IF it requires judgment, hypothesis, or natural-language synthesis → keep it in the agent/prose.
- IF the skill is invoked by the user → write a trigger-rich description with concrete phrases + an anti-trigger.
- IF SKILL.md exceeds ~500 lines → do NOT cut content; move detail into references/ and front it with a routing table. The ceiling is a routing signal, not a content limit.
- IF a references/ file exists → it MUST have a load-trigger sentence in SKILL.md (and the pointer must resolve). No untriggered, no dangling.
- IF the skill has more than one output type or mode → add a Step-0 selection table + decision heuristic + 'ask if ambiguous, don't pick silently.' IF it's strictly single-purpose → skip the table and use a flat numbered procedure (vg-analyze).
- IF the skill runs a multi-step process with side effects → make it a numbered Phase pipeline where each phase ends in an explicit pass condition. IF it's a one-shot transform → a flat 3-5 step list is enough.
- IF the skill must auto-pick an execution backend → detect by priority: tool presence first, then env/file Bash probes, then a single-agent fallback (first match wins). Never branch without a documented fallback.
- IF you ask the user anything → use `request_user_input` when available, or ask one concise question.
- IF the skill orchestrates other skills → it MUST dispatch (Skill/Task/Workflow) and MUST NOT write source code itself; add a Pipeline Context header and a Canonical Contract; pass every sub-agent the core artifact + rules explicitly (sub-agents share no context).
- IF the skill produces a measurable artifact and you want it to self-improve → ship a frozen judge separated from the target + a fitness gate that refuses unmeasurable problems + a resume doc; the agent must never edit the judge. IF you only want to absorb conversational corrections → use the skill-improve {section, change, reason} + backup + Edit pattern instead.
- IF one concern grows two unrelated procedures → split into sibling skills (the spec: 'one skill per concern; don't combine unrelated procedures') and link them via a thin router skill or related_skills, rather than a mega-skill.
- IF a rule is ABSOLUTE/non-negotiable → tag it with its incident/feedback provenance and a consequence ('위반 시 산출물 폐기'), and place MUST DO / MUST NOT DO above the steps.
- IF the skill writes files → write to cwd-relative artifact paths with a mkdir -p guard and ❌금지/✅필수 path pairs; never write into chat or the skill's own install dir. For session continuity, write a handoff JSON (completed_skill/next_skill/context_summary/output_files).
- IF a value must be consistent/correct (hex, token, number) → bind it verbatim from a defined source (tokens.md, business-core.yaml, :root --accent), never improvise — and forbid downstream edits of that single source of truth.
- IF the skill is the thinnest possible (a procedure over a shell helper) → keep SKILL.md a numbered list delegating to scripts/ via an absolute-path invocation (skill-improve, agent-memory), and skip references/ entirely.
