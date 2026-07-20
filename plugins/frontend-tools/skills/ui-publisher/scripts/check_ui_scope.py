#!/usr/bin/env python3
# pyright: strict
"""Check added UI-publisher lines for obvious domain-logic boundaries."""

import os
import re
import subprocess
import sys
from collections.abc import Sequence
from pathlib import Path
from typing import Literal, Optional

Rule = tuple[str, str]
Severity = Literal["FAIL", "WARN"]
SourceLine = tuple[int, str]
LineFinding = tuple[Severity, str]
FileFinding = tuple[Severity, str, str, int, str]


FAIL_RULES: tuple[Rule, ...] = (
    ("network-fetch", r"\bfetch\s*\("),
    ("network-axios", r"\baxios(?:\s*\(|\s*\.)|(?:from|require\s*\()\s*['\"]axios['\"]"),
    ("network-stream", r"\b(?:WebSocket|EventSource)\s*\("),
    (
        "server-state",
        r"\b(?:useQuery|useMutation)\s*\(|\bqueryClient\s*\.|['\"]@tanstack/(?:react|vue)-query['\"]",
    ),
    ("storage", r"\b(?:localStorage|sessionStorage|indexedDB)\b|\bdocument\.cookie\b"),
    (
        "form-submit",
        r"\bonSubmit\s*=|addEventListener\s*\(\s*['\"]submit['\"]|\.submit\s*\(|\bnew\s+FormData\s*\(",
    ),
    ("payload", r"\bpayload\s*[:=]"),
    (
        "routing",
        r"\b(?:router|history)\.(?:push|replace|pushState|replaceState)\s*\(|\b(?:redirect|navigate)\s*\(",
    ),
    (
        "global-state",
        r"(?:from|require\s*\()\s*['\"](?:zustand|pinia|redux|react-redux|@reduxjs/toolkit)['\"]|\b(?:createContext|useContext|createPinia|defineStore|createStore|configureStore)\s*\(",
    ),
    ("analytics", r"\banalytics\.(?:track|identify)\s*\(|\btrackEvent\s*\("),
    ("feature-flag", r"\b(?:isFeatureEnabled|useFeatureFlag)\s*\(|\bfeatureFlags?\s*\."),
)

WARN_RULES: tuple[Rule, ...] = (
    ("react-effect", r"\buseEffect\s*\("),
    ("vue-watch", r"\bwatch(?:Effect)?\s*\("),
    ("serialization", r"\bJSON\.stringify\s*\(|\bURLSearchParams\s*\(|\bserialize\s*\("),
)

COMMENT_ONLY: re.Pattern[str] = re.compile(r"^\s*(?://|#|/\*|\*/|\*|<!--|\{?/\*)")


def run_git(
    args: Sequence[str], cwd: Path, check: bool = True
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=cwd,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=check,
    )


def classify(line: str) -> list[LineFinding]:
    if not line.strip() or COMMENT_ONLY.match(line):
        return []
    findings: list[LineFinding] = []
    checks: tuple[tuple[Severity, tuple[Rule, ...]], ...] = (
        ("FAIL", FAIL_RULES),
        ("WARN", WARN_RULES),
    )
    for severity, rules in checks:
        for rule_id, pattern in rules:
            if re.search(pattern, line):
                findings.append((severity, rule_id))
    return findings


def parse_added_lines(diff: str) -> list[SourceLine]:
    added: list[SourceLine] = []
    new_line: Optional[int] = None
    for line in diff.splitlines():
        match = re.match(r"@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@", line)
        if match:
            new_line = int(match.group(1))
            continue
        if new_line is None or line.startswith("+++"):
            continue
        if line.startswith("+"):
            added.append((new_line, line[1:]))
            new_line += 1
        elif not line.startswith("-"):
            new_line += 1
    return added


def is_tracked(repo_root: Path, relative_path: str) -> bool:
    result = run_git(
        ["ls-files", "--error-unmatch", "--", relative_path],
        repo_root,
        check=False,
    )
    return result.returncode == 0


def has_head(repo_root: Path) -> bool:
    return run_git(["rev-parse", "--verify", "HEAD"], repo_root, check=False).returncode == 0


def lines_to_check(repo_root: Path, relative_path: str) -> list[SourceLine]:
    path = repo_root / relative_path
    tracked = is_tracked(repo_root, relative_path)
    if not path.exists() and not tracked:
        raise ValueError(f"path does not exist or belong to git: {relative_path}")

    if tracked and has_head(repo_root):
        result = run_git(
            ["diff", "--no-ext-diff", "--no-color", "--unified=0", "HEAD", "--", relative_path],
            repo_root,
        )
        return parse_added_lines(result.stdout)

    if not path.is_file():
        return []
    return list(enumerate(path.read_text(encoding="utf-8", errors="replace").splitlines(), 1))


def resolve_paths(repo_root: Path, args: Sequence[str]) -> list[str]:
    resolved: list[str] = []
    for arg in args:
        path = Path(arg)
        if path.is_absolute():
            raise ValueError(f"path must be cwd-relative: {arg}")
        absolute = (Path.cwd() / path).resolve()
        if os.path.commonpath((str(repo_root), str(absolute))) != str(repo_root):
            raise ValueError(f"path escapes repository: {arg}")
        resolved.append(absolute.relative_to(repo_root).as_posix())
    return resolved


def self_test() -> None:
    allowed: list[str] = [
        "button.classList.toggle('is-open')",
        "dialog.focus()",
        "trigger.setAttribute('aria-expanded', 'true')",
        "// fetch('/api') is developer-owned",
    ]
    blocked: list[str] = [
        "fetch('/api/items')",
        "localStorage.setItem('draft', value)",
        "<form onSubmit={handleSubmit}>",
        "router.push('/checkout')",
        "import { create } from 'zustand'",
    ]
    warned: list[str] = ["useEffect(() => dialog.focus(), [])"]
    assert all(not classify(line) for line in allowed)
    assert all(any(level == "FAIL" for level, _ in classify(line)) for line in blocked)
    assert all(classify(line) == [("WARN", "react-effect")] for line in warned)
    diff = "@@ -3 +3 @@\n-fetch('/old')\n+button.classList.toggle('is-open')\n"
    assert parse_added_lines(diff) == [(3, "button.classList.toggle('is-open')")]
    print("self_test: pass")


def main(argv: Sequence[str]) -> int:
    if argv == ["--self-test"]:
        self_test()
        return 0
    if not argv:
        print("scope_check: error: pass at least one cwd-relative changed file", file=sys.stderr)
        return 2

    try:
        repo_root = Path(
            run_git(["rev-parse", "--show-toplevel"], Path.cwd()).stdout.strip()
        ).resolve()
        paths = resolve_paths(repo_root, argv)
        findings: list[FileFinding] = []
        for path in paths:
            for line_number, line in lines_to_check(repo_root, path):
                for severity, rule_id in classify(line):
                    findings.append((severity, rule_id, path, line_number, line.strip()))
    except (OSError, subprocess.CalledProcessError, ValueError) as error:
        print(f"scope_check: error: {error}", file=sys.stderr)
        return 2

    for severity, rule_id, path, line_number, line in findings:
        print(f"{severity} [{rule_id}] {path}:{line_number}: {line}")

    fail_count = sum(finding[0] == "FAIL" for finding in findings)
    warn_count = sum(finding[0] == "WARN" for finding in findings)
    if fail_count:
        print(f"scope_check: fail ({fail_count} fail, {warn_count} warn)")
        return 1
    if warn_count:
        print(f"scope_check: pass ({warn_count} warn)")
        return 0
    print("scope_check: pass")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
