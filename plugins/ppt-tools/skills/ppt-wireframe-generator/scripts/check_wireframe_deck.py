#!/usr/bin/env python3
"""Check PPT Wireframe Generator deck structure.

This checks deck structure and implementation-readiness signals only.
"""
from __future__ import annotations

import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree


FIELD_GROUPS = [
    ("screen_or_table", ["화면", "페이지", "Screen", "Table", "테이블"]),
    ("flow_or_route", ["흐름", "Flow", "Route", "경로", "Sequence"]),
    ("action_or_state", ["CTA", "Action", "상태", "State", "액션"]),
    ("implementation_note", ["API", "Data", "데이터", "Validation", "검증", "권한", "Access", "구현"]),
]

PER_SLIDE_CONTEXT = ["화면", "페이지", "Screen", "Table", "테이블", "Flow", "Route", "흐름"]
PER_SLIDE_DETAIL_GROUPS = [
    ("purpose_or_sequence", ["목적", "Purpose", "Sequence", "Business Rules"]),
    ("state_or_question", ["State", "상태", "예외", "확인 필요", "Open Questions"]),
    ("implementation_or_verify", ["CTA", "API", "Data", "데이터", "Validation", "검증", "Access", "권한", "Verify", "구현"]),
]

SUMMARY_GROUPS = [
    ("cta", ["CTA", "Action", "액션"]),
    ("api_or_data", ["API", "Data", "데이터"]),
    ("validation_or_verify", ["Validation", "검증", "Verify"]),
]

TABLE_SPEC_MARKERS = ["Table Spec", "테이블명세서", "DB 명세서", "컬럼", "PK", "FK"]
TABLE_SPEC_REQUIRED = ["컬럼", "타입", "필수", "키", "설명", "ERD"]

MIN_SLIDE_TEXT_CHARS = 40
WIDESCREEN_RATIO = 16 / 9
RATIO_TOLERANCE = 0.02

FORBIDDEN_TEXT = [
    "Planning Harness 체크리스트",
    "22개 검토 항목",
    "22가지 요구사항",
    "Executive Summary",
    "Final Document",
]


def has_any(text: str, labels: list[str]) -> bool:
    lowered = text.lower()
    return any(label.lower() in lowered for label in labels)


def pptx_text_size_and_slides(path: Path) -> tuple[str, tuple[int, int], list[str]]:
    with zipfile.ZipFile(path) as deck:
        names = deck.namelist()
        if "[Content_Types].xml" not in names or "ppt/presentation.xml" not in names:
            raise ValueError("not_a_valid_pptx")

        presentation = ElementTree.fromstring(deck.read("ppt/presentation.xml"))
        size_node = next((node for node in presentation.iter() if node.tag.endswith("}sldSz")), None)
        if size_node is None:
            raise ValueError("missing_slide_size")
        slide_size = (int(size_node.attrib["cx"]), int(size_node.attrib["cy"]))

        slide_names = sorted(
            (name for name in names if re.fullmatch(r"ppt/slides/slide\d+\.xml", name)),
            key=lambda name: int(re.search(r"\d+", name).group()),
        )
        slide_texts: list[str] = []

        for name in slide_names:
            root = ElementTree.fromstring(deck.read(name))
            parts = [
                node.text
                for node in root.iter()
                if node.tag.endswith("}t") and node.text
            ]
            slide_texts.append("\n".join(parts))

    return "\n".join(slide_texts), slide_size, slide_texts


def check_pptx(path: Path) -> list[str]:
    try:
        text, slide_size, slide_texts = pptx_text_size_and_slides(path)
    except zipfile.BadZipFile:
        return ["invalid_pptx_zip"]
    except (ElementTree.ParseError, KeyError, ValueError) as error:
        return [f"invalid_pptx_structure: {error}"]

    failures: list[str] = []
    width, height = slide_size
    print(f"pptx_slide_size: {width}x{height}")
    if height == 0 or abs((width / height) - WIDESCREEN_RATIO) > RATIO_TOLERANCE:
        failures.append("non_widescreen_slide_size: expected 16:9")

    if not slide_texts:
        failures.append("missing_slides")
    else:
        print(f"pptx_slide_count: {len(slide_texts)}")

    if not text.strip():
        failures.append("missing_pptx_text")

    missing_fields = [name for name, labels in FIELD_GROUPS if not has_any(text, labels)]
    if missing_fields:
        failures.append("missing_wireframe_fields: " + ", ".join(missing_fields))

    missing_summary = [name for name, labels in SUMMARY_GROUPS if not has_any(text, labels)]
    if missing_summary:
        failures.append("missing_summary_signals: " + ", ".join(missing_summary))

    forbidden = [phrase for phrase in FORBIDDEN_TEXT if phrase in text]
    if forbidden:
        failures.append("forbidden_internal_text: " + ", ".join(forbidden))

    weak_slides = []
    sparse_slides = []
    for index, slide_text in enumerate(slide_texts, start=1):
        if len(slide_text.strip()) < MIN_SLIDE_TEXT_CHARS:
            sparse_slides.append(str(index))
        missing_detail = [
            name for name, labels in PER_SLIDE_DETAIL_GROUPS if not has_any(slide_text, labels)
        ]
        if not has_any(slide_text, PER_SLIDE_CONTEXT) or missing_detail:
            weak_slides.append(str(index))
    if sparse_slides:
        failures.append("too_little_slide_text: slide " + ", ".join(sparse_slides))
    if weak_slides:
        failures.append("missing_per_slide_wireframe_detail: slide " + ", ".join(weak_slides))

    if has_any(text, TABLE_SPEC_MARKERS):
        missing_table_fields = [label for label in TABLE_SPEC_REQUIRED if label not in text]
        if missing_table_fields:
            failures.append("missing_table_spec_fields: " + ", ".join(missing_table_fields))

    return failures


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: check_wireframe_deck.py <file.pptx>", file=sys.stderr)
        return 2

    path = Path(sys.argv[1])
    if not path.is_file():
        print(f"FAIL: file not found: {path}")
        print("checks_failed: 1")
        return 1

    if path.suffix.lower() != ".pptx":
        print(f"FAIL: unsupported_extension: {path.suffix.lower() or '(none)'}")
        print("checks_failed: 1")
        return 1

    failures = check_pptx(path)
    for failure in failures:
        print("FAIL:", failure)
    print(f"checks_failed: {len(failures)}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
