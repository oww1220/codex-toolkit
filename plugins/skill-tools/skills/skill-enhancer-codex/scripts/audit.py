#!/usr/bin/env python3
# pyright: strict
"""audit — deterministic linter/scorer for a Codex skill.

Encodes references/audit-rubric.md 1:1. Severities: HARD (install/run breaker,
exit 1), WARN (quality), INFO (recommendation). Prints a JSON report plus a
parse-stable `audit_score: <n>` line so an autoresearch loop can wrap it.

Usage:  python audit.py <skill-dir> [--json]
"""

import json
import os
import re
import sys
from typing import Literal, Optional, TypedDict

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import refs_check  # pyright: ignore[reportMissingImports]  # noqa: E402


Severity = Literal["HARD", "WARN", "INFO"]
FrontmatterResult = tuple[dict[str, str], str, bool, Optional[str]]


class Finding(TypedDict):
    severity: Severity
    check: str
    message: str


class AuditReport(TypedDict):
    skill: str
    score: int
    hard_fails: list[Finding]
    warnings: list[Finding]
    infos: list[Finding]
    passed: list[str]

KEBAB_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
GATE_TOKENS = [
    "통과 조건",
    "Phase 전환 조건",
    "✅ 통과",
    "GATE",
    "pass_threshold",
    "STOP — awaiting gate verdict",
]
# a real phase HEADING — must start with at least one '#' + space (so table rows
# `| … 1단계 … |` and numbered list items `7. …(3단계)…` are not mis-read as headings).
PHASE_HEAD_RE = re.compile(r"(?im)^#{1,6}\s+.*?(Phase\s*\d+|GATE\s*\d+|\d+\s*단계)")
# tool invocation in body -> canonical tool name
TOOL_PATTERNS = {
    "Skill": r"Skill\s*\(",
    "Task": r"\bTask\s*\(",
    "Workflow": r"Workflow\s*\(",
    "request_user_input": r"request_user_input",
    "Agent": r"\bAgent\s*\(",
    "Bash": r"\bBash\b",
    "Write": r"\bWrite\s*\(",
    "Edit": r"\bEdit\s*\(",
    "WebSearch": r"\bWebSearch\b",
    "WebFetch": r"\bWebFetch\b",
}
BANNED_OUTPUT_TERMS = ["/Users/", "Playwright", "ffmpeg", "fixture", "provisional"]


def parse_frontmatter(text: str) -> FrontmatterResult:
    """Parse the supported Codex frontmatter subset.

    Returns (fields, body, valid, error). This intentionally supports only
    top-level scalar, block-scalar, and list values used by Codex skills.
    """
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}, text, False, None
    end: Optional[int] = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            end = i
            break
    if end is None:
        return {}, text, False, "frontmatter opens with `---` but has no closing `---`"
    fm_lines = lines[1:end]
    body = "\n".join(lines[end + 1 :])
    fields: dict[str, str] = {}
    i = 0
    key_re = re.compile(r"^([A-Za-z0-9_-]+):(.*)$")
    while i < len(fm_lines):
        line = fm_lines[i]
        if not line.strip():
            i += 1
            continue
        m = key_re.match(line)
        if not m:
            return {}, body, False, f"unsupported or malformed frontmatter line {i + 2}: {line!r}"
        key, rest = m.group(1), m.group(2).strip()
        if key in fields:
            return {}, body, False, f"duplicate frontmatter key: {key}"
        if rest in (">", "|", ">-", "|-", ">+", "|+", ""):
            # block scalar or list: gather indented / list lines
            block: list[str] = []
            j = i + 1
            while j < len(fm_lines):
                nxt = fm_lines[j]
                if nxt.strip() == "":
                    block.append("")
                    j += 1
                    continue
                if re.match(r"^\s+", nxt) or nxt.lstrip().startswith("- "):
                    block.append(nxt.strip().lstrip("- ").strip())
                    j += 1
                else:
                    break
            fields[key] = " ".join(x for x in block if x) if block else rest
            i = j
        else:
            if rest[0] in "[{":
                return (
                    {},
                    body,
                    False,
                    f"flow collections are not supported for frontmatter key: {key}",
                )
            if rest[0] in ("'", '"') and (len(rest) < 2 or rest[-1] != rest[0]):
                return {}, body, False, f"unterminated quoted value for frontmatter key: {key}"
            if ": " in rest and rest[0] not in ("'", '"'):
                return (
                    {},
                    body,
                    False,
                    f"plain value contains an unquoted colon for frontmatter key: {key}",
                )
            fields[key] = rest
            i += 1
    return fields, body, True, None


def add(results: list[Finding], sev: Severity, cid: str, msg: str) -> None:
    results.append({"severity": sev, "check": cid, "message": msg})


def unquote_scalar(value: str) -> str:
    if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
        return value[1:-1]
    return value


def audit(skill_dir: str) -> AuditReport:
    skill_dir = os.path.abspath(skill_dir.rstrip("/"))
    dirname = os.path.basename(skill_dir)
    skill_md = os.path.join(skill_dir, "SKILL.md")
    R: list[Finding] = []
    passed: list[str] = []

    if not os.path.isfile(skill_md):
        add(R, "HARD", "exists", f"no SKILL.md in {skill_dir}")
        return {
            "skill": dirname,
            "score": 0,
            "hard_fails": R,
            "warnings": [],
            "infos": [],
            "passed": passed,
        }

    text = open(skill_md, encoding="utf-8", errors="replace").read()
    fields, body, fm_ok, fm_error = parse_frontmatter(text)
    line_count = text.count("\n") + 1
    name = unquote_scalar(fields.get("name", ""))
    desc = unquote_scalar(fields.get("description", ""))

    if fm_ok:
        passed.append("supported frontmatter structure parses")
    elif fm_error:
        add(R, "HARD", "frontmatter", fm_error)
    else:
        add(R, "HARD", "frontmatter", "no frontmatter — Codex skills require name and description")

    if not name:
        add(R, "HARD", "name", "missing `name` in frontmatter")
    elif not KEBAB_RE.match(name):
        add(R, "WARN", "name-kebab", f"name '{name}' is not kebab-case [a-z0-9-]")
    elif len(name) > 64:
        add(R, "WARN", "name-len", f"name length {len(name)} > 64")
    else:
        passed.append("name is valid kebab-case ≤64")

    if desc:
        combined = len(desc) + len(fields.get("when_to_use", ""))
        if combined > 1536:
            add(
                R,
                "WARN",
                "desc-len",
                f"description(+when_to_use) {combined} chars > 1536 — truncated in the skill listing",
            )
        else:
            passed.append(f"description {combined} chars ≤ 1536")
    else:
        add(R, "HARD", "description", "missing `description` in frontmatter")

    # 4 WARN name == dirname (whitelist .tmpl)
    if name and name != dirname:
        if os.path.isfile(os.path.join(skill_dir, "SKILL.md.tmpl")):
            passed.append("name != dirname but SKILL.md.tmpl present (auto-generated, ok)")
        else:
            add(R, "WARN", "name-dirname", f"name '{name}' != dirname '{dirname}'")
    elif name:
        passed.append("name == dirname")

    # 6/7/8 discovery surface. Skills auto-load by `description`; quoted trigger
    # phrases sharpen matching.
    has_trigger_field = "trigger" in fields or "triggers" in fields or "when_to_use" in fields
    quoted = len(re.findall(r"[\"“][^\"”]{2,}[\"”]", desc))
    if not has_trigger_field and quoted == 0:
        add(
            R,
            "WARN",
            "discovery",
            "auto-invocable skill has no quoted triggers in description — weak self-activation",
        )
    else:
        passed.append("has discovery surface (triggers)")
    if re.search(r"Skip when|비-트리거|don't use when|사용 금지|안 함", text, re.I):
        passed.append("anti-trigger present")
    else:
        add(
            R,
            "INFO",
            "anti-trigger",
            "no 'Skip when / 비-트리거' anti-trigger clause (recommended)",
        )

    # 9 WARN line count
    if line_count > 500:
        add(
            R,
            "WARN",
            "length",
            f"SKILL.md is {line_count} lines (>500) — move detail to references/",
        )
    else:
        passed.append(f"SKILL.md {line_count} lines ≤ 500")

    # 10 HARD references bidirectional (delegate)
    rc = refs_check.check(skill_dir)
    # untriggered = a real smell, but output-templates / shared refs are legit
    # exceptions, so WARN (not a breaker). A dangling read pointer IS broken -> HARD.
    if rc["untriggered_files"]:
        add(
            R,
            "WARN",
            "refs-untriggered",
            "references with no load trigger (dead weight, or output-template/shared): "
            + ", ".join(rc["untriggered_files"]),
        )
    if rc.get("external_or_optional"):
        add(
            R,
            "WARN",
            "refs-external",
            " refs absent but cross-skill or intentionally-optional (verify): "
            + ", ".join(rc["external_or_optional"]),
        )
    if rc["dangling_pointers"]:
        add(
            R,
            "HARD",
            "refs-dangling",
            "read pointers to missing files (no fallback, local): "
            + ", ".join(rc["dangling_pointers"]),
        )
    if (
        not rc["untriggered_files"]
        and not rc["dangling_pointers"]
        and not rc.get("external_or_optional")
    ):
        passed.append("references bidirectionally resolvable")

    # 11 WARN scripts named in body resolve (shared/sibling scripts are a legit
    # pattern — vg-* family shares scripts — and placeholders like scripts/xxx.sh
    # are doc illustrations; so WARN, and skip obvious placeholder stems).
    _ph = {"xxx", "yyy", "zzz", "foo", "bar", "example", "sample", "name", "file", "your-skill"}
    for raw in set(re.findall(r"scripts/[A-Za-z0-9_./\-]+", body)):
        tok = raw.rstrip(").,;:`\"'")
        stem = os.path.splitext(os.path.basename(tok))[0].lower()
        if stem in _ph:
            continue
        if "." in os.path.basename(tok) and not os.path.exists(os.path.join(skill_dir, tok)):
            add(
                R,
                "WARN",
                "script-missing",
                f"body references {tok} but no such file in this skill (shared/sibling?)",
            )

    # 12 WARN gate proximity (only if multi-phase)
    body_lines = body.splitlines()
    phase_heads = [i for i, ln in enumerate(body_lines) if PHASE_HEAD_RE.match(ln)]
    if len(phase_heads) >= 2:
        for idx in phase_heads:
            window = "\n".join(body_lines[idx : idx + 25])
            if not any(tok in window for tok in GATE_TOKENS):
                add(
                    R,
                    "WARN",
                    "gate",
                    f"phase heading near line {idx + 1} has no gate token within 25 lines",
                )
        if not any(r["check"] == "gate" for r in R):
            passed.append("each phase has a gate token")

    # 13 WARN empty placeholder dirs
    for sub in ("references", "scripts", "templates", "assets", "examples"):
        d = os.path.join(skill_dir, sub)
        if os.path.isdir(d):
            n = sum(len(fs) for _r, _ds, fs in os.walk(d))
            if n == 0:
                add(R, "WARN", "empty-dir", f"{sub}/ exists but is empty (auto-scaffold smell)")

    # 15 WARN output-path discipline. Korean is SOV — the write verb (저장/쓰기) often
    # FOLLOWS the path — so look for a write keyword within 40 chars on EITHER side.
    _wkw = re.compile(r"Write\s*\(|쓰기|저장|write", re.I)
    _home = re.compile(r"~/\.codex/skills|/Users/|\$HOME")
    for i, ln in enumerate(body_lines):
        for m in _home.finditer(ln):
            if _wkw.search(ln[max(0, m.start() - 40) : m.end() + 40]):
                add(
                    R,
                    "WARN",
                    "output-path",
                    f"line {i + 1}: writes into install/home dir — use cwd-relative paths",
                )
                break

    # 16 WARN banned terms in OUTPUT artifacts only (templates/*.html + declared output)
    tdir = os.path.join(skill_dir, "templates")
    if os.path.isdir(tdir):
        for root, _ds, files in os.walk(tdir):
            for fn in files:
                if fn.lower().endswith((".html", ".htm")):
                    content = open(
                        os.path.join(root, fn), encoding="utf-8", errors="replace"
                    ).read()
                    for term in BANNED_OUTPUT_TERMS:
                        if term in content:
                            add(
                                R,
                                "WARN",
                                "banned-term",
                                f"templates/{fn}: leaks process term '{term}' into output",
                            )

    hard = sum(1 for r in R if r["severity"] == "HARD")
    warn = sum(1 for r in R if r["severity"] == "WARN")
    score = max(0, 100 - 12 * hard - 4 * warn)
    return {
        "skill": dirname,
        "score": score,
        "hard_fails": [r for r in R if r["severity"] == "HARD"],
        "warnings": [r for r in R if r["severity"] == "WARN"],
        "infos": [r for r in R if r["severity"] == "INFO"],
        "passed": passed,
    }


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        print("usage: audit.py <skill-dir> [--json]", file=sys.stderr)
        sys.exit(2)
    rep = audit(args[0])
    if "--json" in sys.argv:
        print(json.dumps(rep, ensure_ascii=False, indent=2))
    else:
        print(f"# audit: {rep['skill']}  score={rep['score']}")
        groups: tuple[tuple[list[Finding], str], ...] = (
            (rep["hard_fails"], "HARD"),
            (rep["warnings"], "WARN"),
            (rep["infos"], "INFO"),
        )
        for findings, label in groups:
            for r in findings:
                print(f"  [{label}] {r['check']}: {r['message']}")
        print(f"  passed: {len(rep.get('passed', []))} checks")
    print(f"audit_score: {rep['score']}")
    sys.exit(1 if rep.get("hard_fails") else 0)


if __name__ == "__main__":
    main()
