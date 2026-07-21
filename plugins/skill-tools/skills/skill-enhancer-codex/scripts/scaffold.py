#!/usr/bin/env python3
# pyright: strict
"""scaffold — render a skill from an interview-derived config.

Stdlib-only. The CREATE interview collects a config; this renderer FILLS the
SKILL.md body from it (constraints, workflow+I/O, gate, references, output) and
emits reference stubs + a gate-script stub. A COMPLETE config (every body field
provided) yields an audit-clean skill (0 HARD, and 0 WARN when triggers /
anti-triggers / a gate / references are all supplied). A minimal config still
works — missing fields become `[placeholder]` stubs the author fills.

Usage:  python scaffold.py <config.json> <skill_dir>

Config keys (all optional unless noted):
  name (req)         kebab-case == basename(skill_dir)
  routed_by (req)    "user" | "orchestrator"
  purpose            one-line; OR `description` for the full string
  triggers           list (req if routed_by==user and not thin)
  anti_triggers      list  → adds "비-트리거" to description (clears anti-trigger INFO)
  allowed_tools      ignored; Codex skills use name/description frontmatter only
  thin               bool  → numbered-delegation skeleton (thin_steps optional)
  one_liner          "무엇을/언제" 한 줄
  must_do / must_not list[str]  → ✅/⛔ constraints above the steps
  modes              list[{label,start,when}]  (>1 → Step-0 table)
  orchestrator       bool;  pipeline {position,input,output,calls}
  workflow           list[{action, io}]  → numbered steps
  gate               {type:"script"|"manual", cmd, on_fail}  (script → stub created)
  output_required    list[str]
  references         list[{file, when, summary}]  → routing table + stub files
  has_scripts/has_templates  bool  (deferred, not created empty)
"""

import json
import os
import re
import sys
from typing import Literal, NoReturn, Optional, TypedDict, cast


class Mode(TypedDict, total=False):
    label: str
    start: str
    when: str


class Pipeline(TypedDict, total=False):
    position: str
    input: str
    output: str
    calls: str


class WorkflowStep(TypedDict, total=False):
    action: str
    io: str


class Gate(TypedDict, total=False):
    type: Literal["script", "manual"]
    cmd: str
    on_fail: str
    criteria: str


class Reference(TypedDict):
    file: str
    when: str
    summary: str


class Config(TypedDict, total=False):
    name: str
    routed_by: Literal["user", "orchestrator"]
    purpose: str
    description: str
    triggers: list[str]
    anti_triggers: list[str]
    thin: bool
    thin_steps: list[str]
    one_liner: str
    must_do: list[str]
    must_not: list[str]
    modes: list[Mode]
    orchestrator: bool
    pipeline: Pipeline
    workflow: list[WorkflowStep]
    gate: Gate
    output_required: list[str]
    references: list[Reference]
    has_scripts: bool
    has_templates: bool

KEBAB_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


def die(msg: str) -> NoReturn:
    print(f"scaffold: ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def _wrap(s: str, width: int) -> list[str]:
    words = s.split()
    line = ""
    out: list[str] = []
    for w in words:
        if len(line) + len(w) + 1 > width:
            out.append(line)
            line = w
        else:
            line = (line + " " + w).strip()
    if line:
        out.append(line)
    return out


def build_description(cfg: Config) -> str:
    description = cfg.get("description")
    if description:
        return description.strip()
    purpose = (cfg.get("purpose") or "").strip()
    if not purpose:
        die("config needs `description` or `purpose`")
    parts = [purpose]
    triggers = cfg.get("triggers")
    if triggers:
        parts.append("트리거 — " + ", ".join(f'"{t}"' for t in triggers) + ".")
    anti_triggers = cfg.get("anti_triggers")
    if anti_triggers:
        parts.append("비-트리거: " + "; ".join(anti_triggers) + ".")
    return " ".join(parts)


def render_thin(cfg: Config, name: str) -> str:
    steps = cfg.get("thin_steps") or [
        "`scripts/[helper].sh [args]` 를 실행해 [무엇]을 얻는다.",
        "[판단/사용자 확인 단계].",
        "[다음 스크립트 호출 또는 Edit].",
        "[완료 보고 — 산출 경로/결과].",
    ]
    out = ["[셸/스크립트 헬퍼 위의 얇은 절차 — 본문은 번호 목록으로 위임만 한다.]", ""]
    out += [f"{i}. {s}" for i, s in enumerate(steps, 1)]
    return "\n".join(out) + "\n"


def render_body(cfg: Config, name: str) -> str:
    title = name.replace("-", " ").title()
    S = [f"# {title}", ""]

    S += [
        "## 무엇을 / 언제 (한 줄)",
        cfg.get("one_liner") or "[이 스킬이 하는 일 한 문장 — description과 일관되게.]",
        "",
    ]

    must_do = cfg.get("must_do") or ["[반드시 하는 것]"]
    must_not = cfg.get("must_not") or ["[절대 안 하는 것]"]
    S += ["## 제약 (MUST DO / MUST NOT DO) — 스텝 위에 둔다"]
    S += [f"- ✅ {x}" for x in must_do]
    S += [f"- ⛔ {x}" for x in must_not]
    S += ["- ⛔ 출력은 cwd 상대 경로 + `mkdir -p` 가드로만 한다. 채팅 덤프 금지.", ""]

    modes = cfg.get("modes") or []
    if len(modes) > 1:
        S += ["## Step 0 — 무엇을 만들지 고른다", "| 모드 | 시작점 | 언제 |", "|---|---|---|"]
        for m in modes:
            S.append(
                f"| **{m.get('label', '[모드]')}** | {m.get('start', '-')} | {m.get('when', '[조건]')} |"
            )
        S += [
            "판단: [한 줄 휴리스틱]. **애매하면 `request_user_input`으로 묻는다 — 임의로 고르지 말 것.**",
            "",
        ]

    if cfg.get("orchestrator") or cfg.get("routed_by") == "orchestrator":
        pc: Pipeline = cfg.get("pipeline") or {}
        S += [
            "## Pipeline Context",
            "| 항목 | 내용 |",
            "|------|------|",
            f"| **파이프라인 위치** | {pc.get('position', '[위치]')} |",
            f"| **입력 소스** | {pc.get('input', '[입력]')} |",
            f"| **출력 대상** | {pc.get('output', '[출력]')} |",
            f"| **호출 스킬/에이전트** | {pc.get('calls', '[목록]')} |",
            "- 필요하면 사용 가능한 Codex tool 또는 subagent 도구로 디스패치한다.",
            "- 서브에이전트엔 핵심 산출물 경로 + 규칙 + 산출 경로 + 금지목록을 매번 명시.",
            "",
        ]

    S += ["## 핵심 워크플로우"]
    i = 1
    for step in cfg.get("workflow") or []:
        line = f"{i}. {step.get('action', '[단계]')}"
        if step.get("io"):
            line += f" — {step['io']}"
        S.append(line)
        i += 1
    if i == 1:
        S += ["1. [입력 파악/판단]", "2. [작업]"]
        i = 3
    gate: Gate = cfg.get("gate") or {}
    if gate.get("type") == "script":
        cmd = gate.get("cmd", "python scripts/validate.py <dir>")
        S.append(
            f"{i}. 검증(게이트): `{cmd}` 실행 — exit 0이어야 다음 단계. "
            f"exit 1 → {gate.get('on_fail', '직전 단계 재실행')}. **통과 전 진행 금지.**"
        )
    else:
        S.append(f"{i}. 검증: {gate.get('criteria', '[통과 기준]')} 를 확인한다.")
    i += 1
    S += [f"{i}. 출력: 산출물을 cwd 상대 경로에 둔다.", ""]

    refs = cfg.get("references") or []
    if refs:
        S += ["## 참조 자료 (라우팅 테이블)", "| Topic | Reference | Load When |", "|---|---|---|"]
        for r in refs:
            S.append(
                f"| {r.get('summary', '[주제]')} | references/{r['file']} | {r.get('when', '[조건]')} |"
            )
        S += [
            "> 각 reference 파일은 첫 줄을 `> **로드 시점**: <같은 조건>`으로 시작해 트리거를 메아리친다.",
            "",
        ]

    S += ["## 출력 위치 (필수)"]
    for o in cfg.get("output_required") or ["`output/{slug}/` 등 cwd 상대 + `mkdir -p` 가드"]:
        S.append(f"- ✅ {o}")
    S += ["- ⛔ 채팅 코드 덤프 / 스킬 설치 디렉터리 안 임시 산출물 / 홈 절대경로"]
    return "\n".join(S).rstrip() + "\n"


def _gate_stub(cmd: str) -> tuple[Optional[str], Optional[str]]:
    m = re.search(
        r"scripts/([A-Za-z0-9_./\-]+)", cmd or ""
    )  # '/' so subdir paths (scripts/sub/x.sh) survive
    if not m:
        return None, None
    fname = m.group(1)
    if fname.endswith(".py"):
        content = (
            "#!/usr/bin/env python3\n"
            '"""Validation gate — exit non-zero on failure (TODO: implement real checks)."""\n'
            "import sys\n\n"
            "def main():\n"
            '    target = sys.argv[1] if len(sys.argv) > 1 else "."\n'
            "    fails = []\n"
            "    # TODO: append a message to fails for each check that does not hold.\n"
            "    for f in fails:\n"
            '        print("FAIL:", f)\n'
            '    print(f"checks_failed: {len(fails)}")\n'
            "    sys.exit(1 if fails else 0)\n\n"
            'if __name__ == "__main__":\n    main()\n'
        )
    else:
        content = (
            "#!/usr/bin/env bash\n"
            "# Validation gate — exit non-zero on failure (TODO: implement real checks).\n"
            "set -euo pipefail\n"
            'TARGET="${1:-.}"\n'
            "fails=0\n"
            "# TODO: increment fails for each check that does not hold.\n"
            'echo "checks_failed: $fails"\n'
            "exit $(( fails > 0 ? 1 : 0 ))\n"
        )
    return fname, content


def main() -> None:
    if len(sys.argv) != 3:
        die("usage: scaffold.py <config.json> <skill_dir>")
    cfg = cast(Config, json.load(open(sys.argv[1], encoding="utf-8")))
    skill_dir = sys.argv[2].rstrip("/")

    name = cfg.get("name", "")
    if not name:
        die("config missing `name`")
    if not KEBAB_RE.match(name):
        die(f"name '{name}' must be kebab-case [a-z0-9-]")
    if len(name) > 64:
        die(f"name length {len(name)} > 64")
    routed_by = cfg.get("routed_by")
    if routed_by not in ("user", "orchestrator"):
        die("routed_by must be 'user' or 'orchestrator'")
    thin = bool(cfg.get("thin"))
    if routed_by == "user" and not thin and not cfg.get("triggers") and not cfg.get("description"):
        die("user-routed skill needs `triggers` (or a full `description`)")

    description = build_description(cfg)
    if len(description) > 1024:
        die(f"assembled description is {len(description)} chars > 1024")

    basename = os.path.basename(os.path.abspath(skill_dir))
    if basename != name:
        print(
            f"scaffold: WARN: dirname '{basename}' != name '{name}' (audit will flag)",
            file=sys.stderr,
        )

    os.makedirs(skill_dir, exist_ok=True)
    skill_md = os.path.join(skill_dir, "SKILL.md")
    if os.path.exists(skill_md):
        die(f"{skill_md} already exists — refusing to overwrite")

    body = render_thin(cfg, name) if thin else render_body(cfg, name)

    # frontmatter
    desc_block = (
        (">\n  " + "\n  ".join(_wrap(description, 92))) if len(description) > 90 else description
    )
    fm = [f"name: {name}", f"description: {desc_block}"]
    out = "---\n" + "\n".join(fm) + "\n---\n\n" + body
    open(skill_md, "w", encoding="utf-8").write(out)
    created = ["SKILL.md"]

    # reference stub files (each triggered by the routing table → no untriggered, no dangling)
    for r in cfg.get("references") or []:
        if thin:
            break
        rpath = os.path.join(skill_dir, "references", r["file"])
        os.makedirs(os.path.dirname(rpath), exist_ok=True)
        if not os.path.exists(rpath):
            title = os.path.splitext(os.path.basename(r["file"]))[0].replace("-", " ").title()
            open(rpath, "w", encoding="utf-8").write(
                f"# {title}\n\n> **로드 시점**: {r.get('when', '[조건]')}\n\n{r.get('summary', '[요약]')}\n\n[상세 내용을 채운다.]\n"
            )
        created.append("references/" + r["file"])

    # gate-script stub (so the body's `scripts/X` pointer resolves → no script-missing)
    gate: Gate = cfg.get("gate") or {}
    if not thin and gate.get("type") == "script":
        fname, content = _gate_stub(gate.get("cmd", "python scripts/validate.py <dir>"))
        if fname and content is not None:
            spath = os.path.join(skill_dir, "scripts", fname)
            os.makedirs(os.path.dirname(spath), exist_ok=True)
            if not os.path.exists(spath):
                open(spath, "w", encoding="utf-8").write(content)
                os.chmod(spath, 0o755)
            created.append("scripts/" + fname)

    # thin-helper stub: a thin delegator names a real scripts/<helper>.sh in its
    # steps — back it with a stub so the body's pointer resolves (no script-missing).
    thin_steps = cfg.get("thin_steps")
    if thin and thin_steps:
        m = re.search(r"scripts/([A-Za-z0-9_./\-]+\.(?:sh|py))", "\n".join(thin_steps))
        if m:
            fname = m.group(1)
            _, content = _gate_stub("scripts/" + fname)
            if content is not None:
                spath = os.path.join(skill_dir, "scripts", fname)
                os.makedirs(os.path.dirname(spath), exist_ok=True)
                if not os.path.exists(spath):
                    open(spath, "w", encoding="utf-8").write(content)
                    os.chmod(spath, 0o755)
                created.append("scripts/" + fname)

    deferred: list[str] = []
    if cfg.get("has_scripts") and not os.path.isdir(os.path.join(skill_dir, "scripts")):
        deferred.append("scripts")
    if cfg.get("has_templates") and not os.path.isdir(os.path.join(skill_dir, "templates")):
        deferred.append("templates")

    print(f"scaffold: created skill '{name}' at {skill_dir}")
    for c in created:
        print("  +", c)
    missing = _audit_gaps(cfg, thin)
    if missing:
        print("\n남은 인터뷰 항목 (채우면 audit-clean에 가까워짐):")
        for m in missing:
            print("  -", m)
    if deferred:
        print(
            f"\n필요 시 {'/'.join(s + '/' for s in deferred)} 디렉터리는 첫 파일을 넣을 때 만든다 (빈 디렉터리 금지)."
        )
    audit_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audit.py")
    print("\n출하 게이트: python3", audit_path, skill_dir)


def _audit_gaps(cfg: Config, thin: bool) -> list[str]:
    """Body fields still unanswered — surfaced so the interview can keep asking."""
    if thin:
        return [] if cfg.get("thin_steps") else ["thin_steps (위임 절차 단계)"]
    gaps: list[str] = []
    if not cfg.get("one_liner"):
        gaps.append("one_liner (무엇을/언제 한 줄)")
    if not cfg.get("must_not"):
        gaps.append("must_not (절대 안 하는 것)")
    if not cfg.get("must_do"):
        gaps.append("must_do (반드시 하는 것)")
    if not cfg.get("workflow"):
        gaps.append("workflow (단계 + 각 단계 입출력)")
    if not cfg.get("gate"):
        gaps.append("gate (검증 방식: script/manual)")
    if cfg.get("routed_by") == "user" and not cfg.get("anti_triggers"):
        gaps.append("anti_triggers (Skip when / 비-트리거)")
    return gaps


if __name__ == "__main__":
    main()
