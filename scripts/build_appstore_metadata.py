"""Turn docs/store-listing.md into the folder layout fastlane's `deliver` uploads.

The texts live in one place, the listing document, and this reads them from there instead of
keeping a second copy that would drift. It also enforces App Store Connect's length limits,
because a console rejects an over-long text only after the upload has started.

    python scripts/build_appstore_metadata.py --out build/appstore
    python scripts/build_appstore_metadata.py --out build/appstore --release-notes

Writes `<out>/metadata/<locale>/{name,subtitle,description,keywords,promotional_text,
support_url,marketing_url,privacy_url}.txt` for the four store languages, plus the two
category files at the metadata root. `release_notes.txt` is only written with
--release-notes: Apple does not accept "What's New" on the very first version of an app.

Exits 1 and writes nothing when any text is missing or over its limit.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

LISTING = Path(__file__).resolve().parent.parent / "docs" / "store-listing.md"

# The listing's short language codes, and the folder names deliver expects.
LOCALES = {"en": "en-US", "de": "de-DE", "fr": "fr-FR", "es": "es-ES"}

# App Store Connect's limits, in characters.
LIMITS = {
    "name": 30,
    "subtitle": 30,
    "keywords": 100,
    "promotional_text": 170,
    "description": 4000,
    "release_notes": 4000,
}

PRIMARY_CATEGORY = "UTILITIES"
SECONDARY_CATEGORY = "EDUCATION"


class ListingError(Exception):
    pass


def _sections(text: str) -> dict[tuple[str, str], str]:
    """Body of every '###' section, keyed by (the '##' it sits under, its own title)."""
    found: dict[tuple[str, str], list[str]] = {}
    top = sub = None
    for line in text.splitlines():
        if line.startswith("## "):
            top, sub = line[3:].strip(), None
        elif line.startswith("### "):
            sub = line[4:].strip()
            found[(top or "", sub)] = []
        elif sub is not None:
            found[(top or "", sub)].append(line)
    return {key: "\n".join(lines) for key, lines in found.items()}


def _find(sections: dict[tuple[str, str], str], top: str, title_start: str) -> str:
    for (parent, title), body in sections.items():
        if parent == top and title.startswith(title_start):
            return body
    raise ListingError(f"section '{title_start}' under '{top}' not found in the listing")


def _blocks(body: str) -> dict[str, str]:
    """`**xx**` followed by a fenced block, per language."""
    pattern = re.compile(r"\*\*(en|de|fr|es)\*\*\s*\n```[^\n]*\n(.*?)\n```", re.DOTALL)
    return {code: text.strip() for code, text in pattern.findall(body)}


def _table(body: str) -> dict[str, str]:
    """Rows like  | en | `text` | 26 |  per language."""
    pattern = re.compile(r"^\|\s*(en|de|fr|es)\s*\|\s*`(.+?)`\s*\|", re.MULTILINE)
    return {code: text.strip() for code, text in pattern.findall(body)}


def _field(text: str, label: str) -> str:
    match = re.search(rf"^\|\s*{re.escape(label)}\s*\|\s*<([^>]+)>\s*\|", text, re.MULTILINE)
    if not match:
        raise ListingError(f"'{label}' not found in the listing's field table")
    return match.group(1).strip()


def read_listing(text: str, release_notes: bool = False) -> dict[str, dict[str, str]]:
    """{'en-US': {'name': ..., ...}, ...}, validated. Raises ListingError listing every problem."""
    sections = _sections(text)
    play, store = "Google Play", "App Store"

    per_field = {
        "name": _table(_find(sections, play, "App name")),
        "subtitle": _table(_find(sections, store, "Subtitle")),
        "description": _blocks(_find(sections, play, "Full description")),
        "keywords": _blocks(_find(sections, store, "Keywords")),
        "promotional_text": _blocks(_find(sections, store, "Promotional text")),
    }
    if release_notes:
        per_field["release_notes"] = _blocks(_find(sections, store, "What's New"))

    urls = {
        "support_url": _field(text, "Support URL"),
        "marketing_url": _field(text, "Website"),
        "privacy_url": _field(text, "Privacy policy URL"),
    }

    problems: list[str] = []
    result: dict[str, dict[str, str]] = {}
    for code, folder in LOCALES.items():
        values: dict[str, str] = {}
        for name, by_language in per_field.items():
            value = by_language.get(code)
            if not value:
                problems.append(f"{code}: no {name}")
                continue
            if len(value) > LIMITS[name]:
                problems.append(f"{code}: {name} is {len(value)} characters, the limit is "
                                f"{LIMITS[name]}")
            values[name] = value
        if "keywords" in values and ", " in values["keywords"]:
            problems.append(f"{code}: keywords have a space after a comma, which wastes characters")
        values.update(urls)
        result[folder] = values

    if problems:
        raise ListingError("\n".join(problems))
    return result


def write(out: Path, listing: dict[str, dict[str, str]]) -> int:
    metadata = out / "metadata"
    count = 0
    for folder, values in listing.items():
        directory = metadata / folder
        directory.mkdir(parents=True, exist_ok=True)
        for name, value in values.items():
            (directory / f"{name}.txt").write_text(value + "\n", encoding="utf-8")
            count += 1
    (metadata / "primary_category.txt").write_text(PRIMARY_CATEGORY + "\n", encoding="utf-8")
    (metadata / "secondary_category.txt").write_text(SECONDARY_CATEGORY + "\n", encoding="utf-8")
    return count


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--release-notes", action="store_true",
                        help="also write release_notes.txt (not accepted on a first version)")
    parser.add_argument("--listing", type=Path, default=LISTING)
    args = parser.parse_args()

    try:
        listing = read_listing(args.listing.read_text(encoding="utf-8"), args.release_notes)
    except ListingError as problem:
        print(f"The listing cannot be uploaded:\n{problem}", file=sys.stderr)
        return 1

    files = write(args.out, listing)
    print(f"Wrote {files} texts for {', '.join(listing)} to {args.out / 'metadata'}")
    for folder, values in listing.items():
        print(f"  {folder}: " + ", ".join(f"{name} {len(value)}" for name, value in values.items()
                                          if name in LIMITS))
    return 0


if __name__ == "__main__":
    sys.exit(main())
