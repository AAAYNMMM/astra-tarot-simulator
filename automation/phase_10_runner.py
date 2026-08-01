#!/usr/bin/env python3
"""Parse and execute the Phase 10 text-file payload without JSON escape ambiguity."""

from __future__ import annotations

import json
import runpy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source_path = ROOT / "automation" / "phase_10_refactor.py"
target_path = ROOT / "automation" / ".phase_10_refactor_runtime.py"
payload_path = ROOT / "automation" / ".phase_10_files.json"


def skip_space(text: str, index: int) -> int:
    while index < len(text) and text[index].isspace():
        index += 1
    return index


def parse_string(text: str, index: int) -> tuple[str, int]:
    if index >= len(text) or text[index] != '"':
        raise RuntimeError(f"Expected string at payload offset {index}.")
    index += 1
    output: list[str] = []
    escapes = {
        '"': '"',
        "\\": "\\",
        "/": "/",
        "b": "\b",
        "f": "\f",
        "n": "\n",
        "r": "\r",
        "t": "\t",
    }
    while index < len(text):
        character = text[index]
        if character == '"':
            return "".join(output), index + 1
        if character != "\\":
            output.append(character)
            index += 1
            continue
        if index + 1 >= len(text):
            raise RuntimeError("Payload string ends after a backslash.")
        escaped = text[index + 1]
        if escaped == "u":
            digits = text[index + 2:index + 6]
            if len(digits) != 4 or any(item not in "0123456789abcdefABCDEF" for item in digits):
                raise RuntimeError(f"Invalid unicode escape at payload offset {index}.")
            output.append(chr(int(digits, 16)))
            index += 6
            continue
        if escaped in escapes:
            output.append(escapes[escaped])
        else:
            # JavaScript regular expressions use escapes that JSON does not know,
            # such as \s and \d. Preserve them as literal regex source text.
            output.append("\\" + escaped)
        index += 2
    raise RuntimeError("Unterminated payload string.")


def parse_string_map(text: str) -> dict[str, str]:
    index = skip_space(text, 0)
    if index >= len(text) or text[index] != "{":
        raise RuntimeError("Phase 10 payload is not an object.")
    index += 1
    result: dict[str, str] = {}
    while True:
        index = skip_space(text, index)
        if index < len(text) and text[index] == "}":
            index = skip_space(text, index + 1)
            if index != len(text):
                raise RuntimeError(f"Trailing payload content at offset {index}.")
            return result
        key, index = parse_string(text, index)
        index = skip_space(text, index)
        if index >= len(text) or text[index] != ":":
            raise RuntimeError(f"Expected colon after {key!r}.")
        value, index = parse_string(text, skip_space(text, index + 1))
        result[key] = value
        index = skip_space(text, index)
        if index < len(text) and text[index] == ",":
            index += 1
            continue
        if index < len(text) and text[index] == "}":
            continue
        raise RuntimeError(f"Expected comma or object end at payload offset {index}.")


source = source_path.read_text(encoding="utf-8")
marker = "FILES = json.loads('"
suffix = "')\n\n\ndef write_lf"
if marker not in source or suffix not in source:
    raise RuntimeError("Phase 10 embedded FILES boundaries were not found.")
head, remainder = source.split(marker, 1)
payload_text, tail = remainder.split(suffix, 1)
files = parse_string_map(payload_text)
with payload_path.open("w", encoding="utf-8", newline="\n") as handle:
    json.dump(files, handle, ensure_ascii=False)
    handle.write("\n")
replacement = (
    'FILES = json.loads((ROOT / "automation" / ".phase_10_files.json")'
    '.read_text(encoding="utf-8"))\n\n\ndef write_lf'
)
fixed_source = head + replacement + tail
with target_path.open("w", encoding="utf-8", newline="\n") as handle:
    handle.write(fixed_source)
try:
    runpy.run_path(str(target_path), run_name="__main__")
finally:
    target_path.unlink(missing_ok=True)
    payload_path.unlink(missing_ok=True)
