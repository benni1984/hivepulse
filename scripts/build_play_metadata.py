"""Turn the Google Play part of docs/store-listing.md into the folder layout the uploader sends.

The counterpart of `build_appstore_metadata.py`, for the other store. The texts live in the
listing document and nowhere else, so the console and the repository cannot drift apart, and
Play's length limits are checked here, before anything is sent.

    python scripts/build_play_metadata.py --out build/play

Writes `<out>/<locale>/{title,short_description,full_description}.txt` for the five store
languages. The release notes are not written here: they go up with the bundle from
`distribution/whatsnew/`, which the Android Release workflow already does.

Exits 1 and writes nothing when any text is missing or over its limit.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_appstore_metadata import ListingError, _blocks, _find, _sections, _table  # noqa: E402

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

LISTING = Path(__file__).resolve().parent.parent / "docs" / "store-listing.md"

# The listing's short language codes, and the locale codes the Play API expects.
LOCALES = {"en": "en-US", "de": "de-DE", "fr": "fr-FR", "es": "es-ES", "pl": "pl-PL"}

# Google Play's limits, in characters.
LIMITS = {"title": 30, "short_description": 80, "full_description": 4000}


def read_listing(text: str) -> dict[str, dict[str, str]]:
    """{'en-US': {'title': ..., ...}, ...}, validated. Raises ListingError listing every problem."""
    sections = _sections(text)
    play = "Google Play"

    per_field = {
        "title": _table(_find(sections, play, "App name")),
        "short_description": _blocks(_find(sections, play, "Short description")),
        "full_description": _blocks(_find(sections, play, "Full description")),
    }

    problems: list[str] = []
    result: dict[str, dict[str, str]] = {}
    for code, locale in LOCALES.items():
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
        result[locale] = values

    if problems:
        raise ListingError("\n".join(problems))
    return result


def write(out: Path, listing: dict[str, dict[str, str]]) -> int:
    count = 0
    for locale, values in listing.items():
        directory = out / locale
        directory.mkdir(parents=True, exist_ok=True)
        for name, value in values.items():
            (directory / f"{name}.txt").write_text(value + "\n", encoding="utf-8")
            count += 1
    return count


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--listing", type=Path, default=LISTING)
    args = parser.parse_args()

    try:
        listing = read_listing(args.listing.read_text(encoding="utf-8"))
    except ListingError as problem:
        print(f"The listing cannot be uploaded:\n{problem}", file=sys.stderr)
        return 1

    files = write(args.out, listing)
    print(f"Wrote {files} texts for {', '.join(listing)} to {args.out}")
    for locale, values in listing.items():
        print(f"  {locale}: " + ", ".join(f"{name} {len(value)}" for name, value in values.items()))
    return 0


if __name__ == "__main__":
    sys.exit(main())
