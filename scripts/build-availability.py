#!/usr/bin/env python3
"""Merge OTA iCal feeds into sanitized public availability files.

The private platform export URLs are read from environment variables:

    AIRBNB_ICAL_URL
    BOOKING_ICAL_URL
    VRBO_ICAL_URL

The generated JSON and ICS outputs intentionally strip reservation summaries,
guest names, descriptions, and platform-specific metadata. Public visitors only
see which dates are unavailable.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable
from urllib.parse import unquote, urlparse
from urllib.request import Request, urlopen


DEFAULT_FEEDS = {
    "Airbnb": "AIRBNB_ICAL_URL",
    "Booking.com": "BOOKING_ICAL_URL",
    "Vrbo": "VRBO_ICAL_URL",
}


@dataclass(frozen=True, order=True)
class DateRange:
    start: date
    end: date

    def clipped(self, start_limit: date, end_limit: date) -> "DateRange | None":
        start = max(self.start, start_limit)
        end = min(self.end, end_limit)
        if end <= start:
            return None
        return DateRange(start, end)


def normalize_feed_url(url: str) -> str:
    url = url.strip()
    if url.startswith("webcal://"):
        return "https://" + url[len("webcal://") :]
    return url


def read_feed(url: str) -> str:
    url = normalize_feed_url(url)
    parsed = urlparse(url)

    if parsed.scheme == "":
        return Path(url).read_text(encoding="utf-8")

    if parsed.scheme == "file":
        return Path(unquote(parsed.path)).read_text(encoding="utf-8")

    request = Request(
        url,
        headers={
            "Accept": "text/calendar,*/*;q=0.8",
            "User-Agent": "LaSostaAvailabilityBot/1.0",
        },
    )
    with urlopen(request, timeout=30) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def unfold_ical_lines(text: str) -> list[str]:
    lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    unfolded: list[str] = []

    for line in lines:
        if line.startswith((" ", "\t")) and unfolded:
            unfolded[-1] += line[1:]
        else:
            unfolded.append(line)

    return unfolded


def iter_events(lines: Iterable[str]) -> Iterable[list[str]]:
    event: list[str] | None = None

    for raw_line in lines:
        line = raw_line.strip()
        if line == "BEGIN:VEVENT":
            event = []
            continue
        if line == "END:VEVENT" and event is not None:
            yield event
            event = None
            continue
        if event is not None:
            event.append(raw_line)


def property_name(line: str) -> str:
    return line.split(":", 1)[0].split(";", 1)[0].upper()


def property_value(line: str) -> str:
    if ":" not in line:
        return ""
    return line.split(":", 1)[1].strip()


def parse_ical_date(value: str) -> date | None:
    value = value.strip()
    if not value:
        return None

    if re.fullmatch(r"\d{8}", value):
        return datetime.strptime(value, "%Y%m%d").date()

    value = value.rstrip("Z")
    for fmt in ("%Y%m%dT%H%M%S", "%Y%m%dT%H%M", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            pass

    return None


def ranges_from_ical(text: str) -> list[DateRange]:
    ranges: list[DateRange] = []
    lines = unfold_ical_lines(text)

    for event in iter_events(lines):
        start: date | None = None
        end: date | None = None

        for line in event:
            name = property_name(line)
            if name == "DTSTART":
                start = parse_ical_date(property_value(line))
            elif name == "DTEND":
                end = parse_ical_date(property_value(line))

        if start is None:
            continue
        if end is None or end <= start:
            end = start + timedelta(days=1)

        ranges.append(DateRange(start, end))

    return ranges


def merge_ranges(ranges: Iterable[DateRange]) -> list[DateRange]:
    ordered = sorted(ranges)
    if not ordered:
        return []

    merged: list[DateRange] = [ordered[0]]
    for current in ordered[1:]:
        previous = merged[-1]
        if current.start <= previous.end:
            merged[-1] = DateRange(previous.start, max(previous.end, current.end))
        else:
            merged.append(current)

    return merged


def iso_z(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def compact_date(value: date) -> str:
    return value.strftime("%Y%m%d")


def fold_ical_line(line: str) -> str:
    max_len = 75
    if len(line) <= max_len:
        return line

    parts = [line[:max_len]]
    line = line[max_len:]
    while line:
        parts.append(" " + line[: max_len - 1])
        line = line[max_len - 1 :]
    return "\r\n".join(parts)


def build_public_ics(ranges: list[DateRange], generated_at: datetime) -> str:
    stamp = generated_at.strftime("%Y%m%dT%H%M%SZ")
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//La Sosta di Sismano//Availability Merge//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:La Sosta di Sismano Availability",
        "X-WR-TIMEZONE:Europe/Rome",
    ]

    for range_ in ranges:
        digest = hashlib.sha256(f"{range_.start}:{range_.end}".encode("utf-8")).hexdigest()[:16]
        lines.extend(
            [
                "BEGIN:VEVENT",
                f"UID:{digest}@villasosta.com",
                f"DTSTAMP:{stamp}",
                f"DTSTART;VALUE=DATE:{compact_date(range_.start)}",
                f"DTEND;VALUE=DATE:{compact_date(range_.end)}",
                "SUMMARY:Unavailable",
                "TRANSP:OPAQUE",
                "STATUS:CONFIRMED",
                "END:VEVENT",
            ]
        )

    lines.append("END:VCALENDAR")
    return "\r\n".join(fold_ical_line(line) for line in lines) + "\r\n"


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def collect_feeds(extra_feeds: list[str] | None) -> dict[str, str]:
    feeds: dict[str, str] = {}

    for name, env_name in DEFAULT_FEEDS.items():
        value = os.environ.get(env_name, "").strip()
        if value:
            feeds[name] = value

    for item in extra_feeds or []:
        if "=" not in item:
            raise ValueError(f"feed must be formatted as Name=URL: {item}")
        name, url = item.split("=", 1)
        name = name.strip()
        url = url.strip()
        if not name or not url:
            raise ValueError(f"feed must be formatted as Name=URL: {item}")
        feeds[name] = url

    return feeds


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json-out", default="data/availability.json", help="Path for the public JSON snapshot")
    parser.add_argument("--ics-out", default="calendar/la-sosta-availability.ics", help="Path for the public ICS feed")
    parser.add_argument("--feed", action="append", help="Additional feed as Name=URL; useful for local testing")
    parser.add_argument("--require-feed", action="store_true", help="Fail if no feed URLs are configured")
    parser.add_argument("--max-days", type=int, default=730, help="How many days ahead to publish")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    generated_at = datetime.now(timezone.utc)
    today = generated_at.date()
    end_limit = today + timedelta(days=args.max_days)

    try:
        feeds = collect_feeds(args.feed)
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    if args.require_feed and not feeds:
        print("No iCal feeds configured. Add AIRBNB_ICAL_URL, BOOKING_ICAL_URL, or VRBO_ICAL_URL.", file=sys.stderr)
        return 2

    all_ranges: list[DateRange] = []
    source_counts: dict[str, int] = {}

    for name, url in feeds.items():
        try:
            feed_text = read_feed(url)
            ranges = ranges_from_ical(feed_text)
        except Exception as exc:  # noqa: BLE001 - keep failed feed names visible in scheduled logs.
            print(f"Failed to read {name} feed: {exc}", file=sys.stderr)
            return 1

        clipped = [r.clipped(today, end_limit) for r in ranges]
        valid_ranges = [r for r in clipped if r is not None]
        all_ranges.extend(valid_ranges)
        source_counts[name] = len(valid_ranges)

    merged = merge_ranges(all_ranges)
    public_json = {
        "property": "La Sosta di Sismano",
        "generatedAt": iso_z(generated_at),
        "timezone": "Europe/Rome",
        "feedCount": len(feeds),
        "rangeEnd": end_limit.isoformat(),
        "unavailable": [{"start": r.start.isoformat(), "end": r.end.isoformat()} for r in merged],
    }

    write_text(Path(args.json_out), json.dumps(public_json, indent=2) + "\n")
    write_text(Path(args.ics_out), build_public_ics(merged, generated_at))

    counts = ", ".join(f"{name}: {count}" for name, count in sorted(source_counts.items())) or "no feeds"
    print(f"Wrote {len(merged)} merged ranges ({counts}).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
