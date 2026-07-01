#!/usr/bin/env python3
"""Check PPT Planning Harness planning document structure.

This intentionally checks structure only. Content quality belongs to reviewer/tester agents.
"""
from __future__ import annotations

import re
import sys
import zipfile
from xml.etree import ElementTree
from pathlib import Path


REQUIRED_HEADINGS = [
    "Executive Summary",
    "Requirement Analysis",
    "Functional Requirements",
    "Non Functional Requirements",
    "Business Rules",
    "Missing Requirements",
    "Missing Policies",
    "Edge Cases",
    "User Flow",
    "Screen List",
    "Information Architecture",
    "API Draft",
    "Database Draft",
    "Sequence Diagram",
    "Activity Diagram",
    "State Diagram",
    "Test Scenario",
    "Acceptance Criteria",
    "UX Review",
    "Accessibility Review",
    "Development Issues",
    "Final Enhanced Planning Document",
]

SCREEN_FIELD_GROUPS = [
    ("screen_name", ["화면명", "Screen"]),
    ("purpose", ["목적", "Purpose"]),
    ("description", ["description", "Description", "설명"]),
    ("user_or_permission", ["대상 사용자", "권한", "User", "Permission"]),
    ("entry_path", ["진입 경로", "Entry"]),
    ("information_area", ["주요 정보", "Information"]),
    ("cta", ["CTA"]),
    ("state", ["상태", "State"]),
    ("validation", ["validation", "Validation", "검증"]),
    ("api_or_data", ["API", "데이터", "Data"]),
    ("exception", ["예외", "Exception"]),
    ("acceptance_criteria", ["acceptance criteria", "Acceptance Criteria", "인수 조건"]),
]

PPTX_FIELD_GROUPS = [
    ("screen_or_flow", ["화면", "페이지", "Screen", "Flow", "흐름"]),
    ("purpose_or_description", ["목적", "description", "Description", "설명"]),
    ("cta_or_state", ["CTA", "상태", "State", "액션", "Action"]),
    ("implementation_note", ["권한", "데이터", "API", "예외", "확인 필요", "구현"]),
]

PPTX_FORBIDDEN_TEXT = [
    "Planning Harness 체크리스트",
    "22개 검토 항목",
    "Executive Summary",
    "Final Document",
]

PPTX_PER_SLIDE_CONTEXT = ["목적", "description", "Description", "설명", "흐름", "화면", "Route"]
PPTX_PER_SLIDE_REVIEW = [
    "확인 필요",
    "권한",
    "데이터",
    "Data",
    "API",
    "상태",
    "State",
    "예외",
    "검증",
    "validation",
    "Acceptance",
    "Verify",
    "정책",
    "Security",
    "Access",
    "인증",
    "차단",
    "구현",
]


def has_heading(text: str, heading: str) -> bool:
    return re.search(rf"^#+\s+(?:\d+\.\s+)?{re.escape(heading)}\s*$", text, re.M) is not None


def has_mermaid(text: str, marker: str) -> bool:
    return re.search(rf"```mermaid\s+[\s\S]*?{re.escape(marker)}[\s\S]*?```", text, re.M) is not None


def has_any(text: str, labels: list[str]) -> bool:
    lowered = text.lower()
    return any(label.lower() in lowered for label in labels)


def check_markdown(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    failures: list[str] = []

    missing = [heading for heading in REQUIRED_HEADINGS if not has_heading(text, heading)]
    if missing:
        failures.append("missing_headings: " + ", ".join(missing))

    missing_screen_fields = [
        name for name, labels in SCREEN_FIELD_GROUPS if not has_any(text, labels)
    ]
    if missing_screen_fields:
        failures.append("missing_screen_fields: " + ", ".join(missing_screen_fields))

    if "확인 필요" not in text:
        failures.append("missing_confirmation_needed_marker: 확인 필요")

    for label, marker in [
        ("sequence_diagram", "sequenceDiagram"),
        ("activity_diagram", "flowchart"),
        ("state_diagram", "stateDiagram"),
    ]:
        if not has_mermaid(text, marker):
            failures.append(f"missing_mermaid_{label}: {marker}")

    return failures


def pptx_text_and_slide_count(path: Path) -> tuple[str, int, list[str]]:
    with zipfile.ZipFile(path) as deck:
        names = deck.namelist()
        if "[Content_Types].xml" not in names or "ppt/presentation.xml" not in names:
            raise ValueError("not_a_valid_pptx")

        slide_names = sorted(
            name
            for name in names
            if re.fullmatch(r"ppt/slides/slide\d+\.xml", name)
        )
        text_parts: list[str] = []
        slide_texts: list[str] = []
        xml_names = slide_names + sorted(
            name
            for name in names
            if re.fullmatch(r"ppt/notesSlides/notesSlide\d+\.xml", name)
        )

        for name in slide_names:
            root = ElementTree.fromstring(deck.read(name))
            slide_parts: list[str] = []
            for node in root.iter():
                if node.tag.endswith("}t") and node.text:
                    slide_parts.append(node.text)
            slide_text = "\n".join(slide_parts)
            slide_texts.append(slide_text)
            text_parts.append(slide_text)

        for name in xml_names[len(slide_names):]:
            root = ElementTree.fromstring(deck.read(name))
            for node in root.iter():
                if node.tag.endswith("}t") and node.text:
                    text_parts.append(node.text)

    return "\n".join(text_parts), len(slide_names), slide_texts


def check_pptx(path: Path) -> list[str]:
    failures: list[str] = []
    try:
        text, slide_count, slide_texts = pptx_text_and_slide_count(path)
    except zipfile.BadZipFile:
        return ["invalid_pptx_zip"]
    except (ElementTree.ParseError, ValueError) as error:
        return [f"invalid_pptx_structure: {error}"]

    if slide_count == 0:
        failures.append("missing_slides")
    else:
        print(f"pptx_slide_count: {slide_count}")

    if not text.strip():
        failures.append("missing_pptx_text")

    missing_fields = [
        name for name, labels in PPTX_FIELD_GROUPS if not has_any(text, labels)
    ]
    if missing_fields:
        failures.append("missing_pptx_fields: " + ", ".join(missing_fields))

    forbidden = [phrase for phrase in PPTX_FORBIDDEN_TEXT if phrase in text]
    if forbidden:
        failures.append("forbidden_pptx_checklist_text: " + ", ".join(forbidden))

    missing_injection = []
    for index, slide_text in enumerate(slide_texts, start=1):
        has_context = has_any(slide_text, PPTX_PER_SLIDE_CONTEXT)
        has_review = has_any(slide_text, PPTX_PER_SLIDE_REVIEW)
        if not (has_context and has_review):
            missing_injection.append(str(index))
    if missing_injection:
        failures.append("missing_per_slide_review_injection: slide " + ", ".join(missing_injection))

    return failures


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: check_planning_doc.py <file.md|file.pptx>", file=sys.stderr)
        return 2

    path = Path(sys.argv[1])
    if not path.is_file():
        print(f"FAIL: file not found: {path}")
        print("checks_failed: 1")
        return 1

    suffix = path.suffix.lower()
    if suffix == ".md":
        failures = check_markdown(path)
    elif suffix == ".pptx":
        failures = check_pptx(path)
    elif suffix == ".ppt":
        failures = ["unsupported_ppt_binary: convert to .pptx before checking"]
    else:
        failures = [f"unsupported_extension: {suffix or '(none)'}"]

    for failure in failures:
        print("FAIL:", failure)
    print(f"checks_failed: {len(failures)}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
