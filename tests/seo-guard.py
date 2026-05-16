"""English visible-text regression guard.

Captures or verifies the visible text of index.html and about.html so that the
i18n migration (Ticket 2 in the spec) and other structural changes cannot
silently drift English copy. Ticket 5 intentionally invalidates the baseline
and re-runs `capture` as part of its diff.

Usage:
    python3 tests/seo-guard.py capture   # write baseline
    python3 tests/seo-guard.py verify    # default; exit non-zero on drift
"""

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
BASELINE = REPO_ROOT / "tests" / "english-baseline.txt"
PAGES = ["index.html", "about.html"]


def visible_text(html: str) -> str:
    # Strip <head>: titles and meta are Search-surface metadata, not on-page body
    # content. The guard exists to catch accidental body-text drift during the
    # i18n migration and other structural changes.
    html = re.sub(r"<head\b[^>]*>.*?</head>", "", html, flags=re.S | re.I)
    html = re.sub(r"<script\b[^>]*>.*?</script>", "", html, flags=re.S | re.I)
    html = re.sub(r"<style\b[^>]*>.*?</style>", "", html, flags=re.S | re.I)
    html = re.sub(r"<!--.*?-->", "", html, flags=re.S)
    html = re.sub(r"<[^>]+>", " ", html)
    return re.sub(r"\s+", " ", html).strip()


def capture_current() -> str:
    parts = []
    for rel in PAGES:
        parts.append(visible_text((REPO_ROOT / rel).read_text(encoding="utf-8")))
    return "\n---\n".join(parts)


def main() -> int:
    mode = sys.argv[1] if len(sys.argv) > 1 else "verify"
    captured = capture_current()
    if mode == "capture":
        BASELINE.parent.mkdir(parents=True, exist_ok=True)
        BASELINE.write_text(captured + "\n", encoding="utf-8")
        print(f"baseline captured: {BASELINE.relative_to(REPO_ROOT)}")
        return 0
    if mode == "verify":
        if not BASELINE.exists():
            print("no baseline; run `python3 tests/seo-guard.py capture` first", file=sys.stderr)
            return 2
        expected = BASELINE.read_text(encoding="utf-8").rstrip("\n")
        if captured != expected:
            print("English visible text drift detected; update baseline only via Ticket 5.", file=sys.stderr)
            return 1
        print("english baseline stable")
        return 0
    print(f"unknown mode: {mode}", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
