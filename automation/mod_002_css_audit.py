#!/usr/bin/env python3
"""Report safe top-level split points for the current monolithic stylesheet."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "styles.css"


@dataclass(frozen=True)
class Block:
    start_line: int
    end_line: int
    line_count: int
    header: str


def line_number(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


def compact_header(value: str) -> str:
    return " ".join(value.strip().split())[:180]


def parse_top_level_blocks(text: str) -> list[Block]:
    blocks: list[Block] = []
    length = len(text)
    index = 0
    block_start = 0
    brace_depth = 0
    quote: str | None = None
    escaped = False
    comment = False

    while index < length:
        char = text[index]
        next_char = text[index + 1] if index + 1 < length else ""

        if comment:
            if char == "*" and next_char == "/":
                comment = False
                index += 2
                continue
            index += 1
            continue

        if quote is not None:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            index += 1
            continue

        if char == "/" and next_char == "*":
            comment = True
            index += 2
            continue
        if char in {'"', "'"}:
            quote = char
            index += 1
            continue

        if char == "{":
            if brace_depth == 0:
                header = compact_header(text[block_start:index])
            brace_depth += 1
        elif char == "}":
            brace_depth -= 1
            if brace_depth < 0:
                raise ValueError(f"Unexpected closing brace at line {line_number(text, index)}")
            if brace_depth == 0:
                end = index + 1
                while end < length and text[end] in " \t\r\n":
                    end += 1
                blocks.append(
                    Block(
                        start_line=line_number(text, block_start),
                        end_line=line_number(text, end - 1),
                        line_count=line_number(text, end - 1) - line_number(text, block_start) + 1,
                        header=header,
                    )
                )
                block_start = end
        elif char == ";" and brace_depth == 0:
            end = index + 1
            while end < length and text[end] in " \t\r\n":
                end += 1
            header = compact_header(text[block_start:end])
            if header:
                blocks.append(
                    Block(
                        start_line=line_number(text, block_start),
                        end_line=line_number(text, end - 1),
                        line_count=line_number(text, end - 1) - line_number(text, block_start) + 1,
                        header=header,
                    )
                )
            block_start = end

        index += 1

    if quote is not None or comment or brace_depth != 0:
        raise ValueError("Stylesheet ended with an unterminated string, comment, or block.")
    if text[block_start:].strip():
        raise ValueError(f"Unparsed trailing content begins at line {line_number(text, block_start)}")
    return blocks


def suggest_chunks(blocks: list[Block], target: int = 650, hard_limit: int = 900) -> list[dict[str, object]]:
    chunks: list[dict[str, object]] = []
    current: list[Block] = []

    def flush() -> None:
        if not current:
            return
        chunks.append(
            {
                "startLine": current[0].start_line,
                "endLine": current[-1].end_line,
                "lineCount": current[-1].end_line - current[0].start_line + 1,
                "firstHeader": current[0].header,
                "lastHeader": current[-1].header,
                "blockCount": len(current),
            }
        )
        current.clear()

    for block in blocks:
        if block.line_count > hard_limit:
            raise ValueError(
                f"Single top-level block exceeds {hard_limit} lines: "
                f"{block.start_line}-{block.end_line} {block.header}"
            )
        prospective = (
            block.end_line - current[0].start_line + 1 if current else block.line_count
        )
        if current and prospective > target:
            flush()
        current.append(block)
    flush()
    return chunks


def main() -> int:
    text = SOURCE.read_text(encoding="utf-8")
    blocks = parse_top_level_blocks(text)
    chunks = suggest_chunks(blocks)
    payload = {
        "schemaVersion": 1,
        "source": SOURCE.relative_to(ROOT).as_posix(),
        "sourceLineCount": len(text.splitlines()),
        "blockCount": len(blocks),
        "suggestedChunks": chunks,
        "blocks": [asdict(block) for block in blocks],
    }
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    print(
        "CWAPI_REPORT: "
        f"css_audit blocks={len(blocks)} chunks={len(chunks)} "
        f"source_lines={payload['sourceLineCount']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
