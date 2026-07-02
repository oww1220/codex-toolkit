#!/usr/bin/env python3
"""refs_check — bidirectional resolvability between SKILL.md and references/.

Catches the most common corpus defect: a references/ file that is bundled but
never given a "read X when…" trigger (dead weight), or a pointer in SKILL.md
that resolves to no file (broken pointer).

Critique-hardened:
  - glob / parameterized pointers (references/brands/<brand>.md,
    references/seeds/*.html) cover their whole subtree — no false positives.
  - _index.md / index.md / INDEX.md are exempt (catalogs, not detail files).
  - recurses into subdirs.

Usage:  python refs_check.py <skill-dir>
Exits 1 if any untriggered file or dangling pointer is found.
"""
import os
import re
import sys
import json

GLOB_CHARS = set("<>{}*?")
INDEX_NAMES = {"_index.md", "index.md", "index"}
# doc-placeholder stems: when a skill *documents* the references/ convention it
# writes illustrative paths like `references/xxx.md` — never treat these as real.
PLACEHOLDER_STEMS = {"xxx", "yyy", "zzz", "foo", "bar", "baz", "example", "sample",
                     "name", "file", "topic", "brand", "something", "abc", "your-skill"}
# a references/ path token: letters/digits/_/-/./ plus glob/param markers
POINTER_RE = re.compile(r"references/[A-Za-z0-9_./<>{}*?\-]+")


def _is_placeholder(tok):
    stem = os.path.splitext(os.path.basename(tok))[0].lower()
    return stem in PLACEHOLDER_STEMS


# cues that a dangling pointer is NOT a local bug but a legitimate pattern:
#  - cross-skill ref: qualified path ("auto-orchestrate/references/x.md", "../sib/references/x"),
#    possessive ("manual-verification's `references/x.md`"), or a sibling-skill name right before it
#    ("cmux-harness `references/role-routing.md`")
#  - intentionally optional: an "if missing / 없으면 / optional" fallback sits next to it
_POSSESSIVE_RE = re.compile(r"['’]s[\s`'\"]*$")
_INVOKE_RE = re.compile(r"\$[a-z][a-z0-9-]{2,}")  # "$other-skill" skill-invocation qualifier
_OPTIONAL_CUES = ["없으면", "있으면", "선택", "optional", "fallback",
                  "if missing", "if absent", "if present", "if it exists", "if available"]


def _external_or_optional(before, after, siblings=()):
    if before.endswith("/"):                 # qualified path: X/references/… or ../references/…
        return True
    if _POSSESSIVE_RE.search(before):        # "<skill>'s `references/…"
        return True
    if _INVOKE_RE.search(before):            # "$other-skill → `references/…" cross-skill invocation
        return True
    for sib in siblings:                     # a sibling-skill name qualifies the path (search whole window)
        if len(sib) >= 4 and sib in before:
            return True
    a = after.lower()
    return any(cue in a for cue in _OPTIONAL_CUES)


def _strip_trailing(tok):
    # drop trailing punctuation that isn't part of the path
    return tok.rstrip(").,;:`\"'")


def check(skill_dir):
    skill_dir = os.path.abspath(skill_dir)
    skill_md = os.path.join(skill_dir, "SKILL.md")
    refs_dir = os.path.join(skill_dir, "references")
    result = {"untriggered_files": [], "dangling_pointers": [],
              "external_or_optional": [], "covered": []}

    if not os.path.isfile(skill_md):
        result["dangling_pointers"].append("SKILL.md: MISSING")
        return result
    if not os.path.isdir(refs_dir):
        # no references/ at all — nothing to check, but flag dangling pointers
        body = open(skill_md, encoding="utf-8", errors="replace").read()
        for raw in POINTER_RE.findall(body):
            tok = _strip_trailing(raw)
            if any(c in GLOB_CHARS for c in tok) or _is_placeholder(tok):
                continue
            if "." in os.path.basename(tok) and not os.path.exists(os.path.join(skill_dir, tok)):
                result["dangling_pointers"].append(tok)
        return result

    body = open(skill_md, encoding="utf-8", errors="replace").read()

    # sibling skill names (the parent skills dir) — used to recognize cross-skill refs
    parent = os.path.dirname(skill_dir)
    try:
        siblings = {d for d in os.listdir(parent)
                    if d != os.path.basename(skill_dir)
                    and os.path.isdir(os.path.join(parent, d))}
    except OSError:
        siblings = set()

    exact_pointers = set()
    exact_pos = {}   # tok -> first match start, for context classification
    glob_dirs = []   # directory subtrees covered by a glob/param pointer
    for m in POINTER_RE.finditer(body):
        tok = _strip_trailing(m.group()).rstrip("/")
        if not tok or _is_placeholder(tok):
            continue
        if any(c in GLOB_CHARS for c in tok):
            d = os.path.dirname(tok)  # subtree the glob lives in
            glob_dirs.append(d if d else "references")
        else:
            exact_pointers.add(tok)
            exact_pos.setdefault(tok, m.start())

    # dangling: exact file pointers (with extension) that don't resolve.
    # Classify cross-skill / intentionally-optional refs separately (not a local bug).
    for tok in sorted(exact_pointers):
        if "." not in os.path.basename(tok):
            continue  # bare dir mention, not a file pointer
        if os.path.exists(os.path.join(skill_dir, tok)):
            continue
        pos = exact_pos[tok]
        before = body[max(0, pos - 70):pos]   # wide enough for long sibling names (e.g. 32-char skills)
        after = body[pos:pos + len(tok) + 60]
        if _external_or_optional(before, after, siblings):
            result["external_or_optional"].append(tok)
        else:
            result["dangling_pointers"].append(tok)

    # untriggered: every real reference file must be covered
    for root, _dirs, files in os.walk(refs_dir):
        for fn in files:
            abs_p = os.path.join(root, fn)
            rel = os.path.relpath(abs_p, skill_dir).replace(os.sep, "/")
            if fn.lower() in INDEX_NAMES or fn.lower().rstrip(".md") in {"_index", "index"}:
                result["covered"].append(rel + " (index, exempt)")
                continue
            rel_dir = os.path.dirname(rel)
            covered = (
                rel in exact_pointers
                or any(rel_dir == d or rel.startswith(d + "/") for d in glob_dirs)
            )
            if covered:
                result["covered"].append(rel)
            else:
                result["untriggered_files"].append(rel)

    return result


def main():
    if len(sys.argv) < 2:
        print("usage: refs_check.py <skill-dir>", file=sys.stderr)
        sys.exit(2)
    res = check(sys.argv[1])
    print(json.dumps(res, ensure_ascii=False, indent=2))
    print(f"refs_untriggered: {len(res['untriggered_files'])}")
    print(f"refs_dangling: {len(res['dangling_pointers'])}")
    print(f"refs_external_or_optional: {len(res.get('external_or_optional', []))}")
    # exit 1 only on a dangling (broken read) pointer — untriggered is a smell,
    # not a breaker (output templates / shared refs are legitimate exceptions).
    sys.exit(1 if res["dangling_pointers"] else 0)


if __name__ == "__main__":
    main()
