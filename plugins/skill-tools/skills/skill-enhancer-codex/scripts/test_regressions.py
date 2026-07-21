#!/usr/bin/env python3
# pyright: strict
"""Small regression check for audit and reference exit contracts."""
import subprocess
import sys
import tempfile
from pathlib import Path


HERE = Path(__file__).resolve().parent
AUDIT = HERE / "audit.py"
REFS_CHECK = HERE / "refs_check.py"
SKILL_ROOT = HERE.parent


def run(script: Path, target: Path, *extra: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(script), str(target), *extra],
        check=False,
        capture_output=True,
        text=True,
    )


def main() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)

        missing = run(AUDIT, root, "--json")
        assert missing.returncode == 1, missing.stdout
        assert '"check": "exists"' in missing.stdout, missing.stdout

        broken = root / "broken"
        broken.mkdir()
        (broken / "SKILL.md").write_text(
            "---\nname: [broken\ndescription: broken\n---\n# Broken\n",
            encoding="utf-8",
        )
        malformed = run(AUDIT, broken, "--json")
        assert malformed.returncode == 1, malformed.stdout
        assert '"check": "frontmatter"' in malformed.stdout, malformed.stdout

        valid = root / "valid"
        (valid / "references").mkdir(parents=True)
        (valid / "SKILL.md").write_text(
            "---\nname: valid\ndescription: >\n  Use when auditing skills.\n  Skip when unrelated.\n---\n# Valid\n",
            encoding="utf-8",
        )
        (valid / "references" / "unused.md").write_text("# Unused\n", encoding="utf-8")
        valid_audit = run(AUDIT, valid, "--json")
        assert valid_audit.returncode == 0, valid_audit.stdout
        refs = run(REFS_CHECK, valid)
        assert refs.returncode == 0, refs.stdout
        assert "refs_untriggered: 1" in refs.stdout, refs.stdout

    user_specific_home = "/Users/" + "idong-geol"
    for path in SKILL_ROOT.rglob("*"):
        if path.is_file():
            assert user_specific_home not in path.read_text(encoding="utf-8", errors="ignore"), path

    print("regressions: ok")


if __name__ == "__main__":
    main()
