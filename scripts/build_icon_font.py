#!/usr/bin/env python3
"""Cuts the icon font down to the icons this site actually draws, and ships them with it.

Font Awesome used to arrive from cdnjs.cloudflare.com on every page view: a stylesheet fetched
from a third party, which hands that third party every visitor's IP address. The three typefaces
were self-hosted for exactly that reason (#461) -- a German court has awarded damages over a
Google Fonts stylesheet -- while the icons went on being fetched. The privacy policy named
Cloudflare, so nothing was undisclosed; it was simply inconsistent (#465).

Shipping the whole of Font Awesome would mean 300 KB of fonts for the handful of glyphs this site
draws. So this reads the source, finds the icons that are really used, and writes:

  * `web/fonts/fa-*.woff2` -- the vendor files, subset to those glyphs
  * `web/icons.css`        -- the @font-face rules, the style classes, and one rule per icon

Run it after adding or removing an icon:

    pip install fonttools brotli
    python scripts/build_icon_font.py

It is deliberately not run by CI. The output is checked in, small, and reviewable as a diff; a
build step that regenerates a font on every push would be a lot of machinery for a file that
changes when somebody picks a new icon.
"""
from __future__ import annotations

import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VENDOR = ROOT / "node_modules" / "@fortawesome" / "fontawesome-free"
SOURCES = [ROOT / "app", ROOT / "components", ROOT / "web"]
OUT_CSS = ROOT / "web" / "icons.css"
OUT_FONTS = ROOT / "web" / "fonts"

# Which style class means which font file and weight. Font Awesome Free has no light or thin,
# so a `fal`/`fat` in the source would be a mistake rather than a missing file.
FAMILIES = {
    "solid":   ("Font Awesome 6 Free", 900, "fa-solid-900.woff2", ("fas", "fa-solid")),
    "regular": ("Font Awesome 6 Free", 400, "fa-regular-400.woff2", ("far", "fa-regular")),
    "brands":  ("Font Awesome 6 Brands", 400, "fa-brands-400.woff2", ("fab", "fa-brands")),
}

# A class attribute, whatever quotes it uses.
CLASS_ATTR = re.compile(r'class(?:Name)?\s*=\s*["\'`]([^"\'`]+)["\'`]')
ICON = re.compile(r"\bfa-([a-z0-9-]+)\b")
# Sizing, spinning and layout helpers are not icons.
NOT_AN_ICON = {
    "solid", "regular", "brands", "fw", "lg", "sm", "xs", "2x", "3x", "4x", "5x", "6x", "7x",
    "8x", "9x", "10x", "spin", "pulse", "border", "pull-left", "pull-right", "stack",
    "stack-1x", "stack-2x", "inverse", "li", "ul", "rotate-90", "rotate-180", "rotate-270",
    "flip-horizontal", "flip-vertical", "flip-both", "beat", "fade", "shake", "bounce",
    "spin-reverse", "spin-pulse", "sr-only",
}


def used_icons() -> dict[str, set[str]]:
    """style -> {icon names}, read out of the source rather than kept in a list here."""
    style_of = {cls: style for style, (_, _, _, classes) in FAMILIES.items() for cls in classes}
    found: dict[str, set[str]] = {style: set() for style in FAMILIES}
    files = 0
    for root in SOURCES:
        for path in root.rglob("*"):
            if path.suffix not in {".tsx", ".ts", ".jsx", ".js", ".css", ".html"}:
                continue
            files += 1
            text = path.read_text(encoding="utf-8", errors="ignore")
            for attr in CLASS_ATTR.findall(text):
                classes = attr.split()
                style = next((style_of[c] for c in classes if c in style_of), None)
                if style is None:
                    continue
                for name in (ICON.findall(attr)):
                    if name not in NOT_AN_ICON:
                        found[style].add(name)
    print(f"read {files} files")
    return found


def codepoints() -> dict[str, str]:
    """icon name -> the character it maps to, taken from the vendor's own stylesheet.

    Parsed rather than looked up in the metadata because the stylesheet carries the Font Awesome 5
    aliases too -- `fa-times`, `fa-sign-out-alt`, `fa-th-large` -- which this codebase still uses
    and which no `icons.json` lists under those names.
    """
    css = (VENDOR / "css" / "all.css").read_text(encoding="utf-8")
    # Both spellings live in the same file: the solid and regular blocks write `::before`, the
    # brands block writes `:before`. Matching only one of them loses every brand icon, silently.
    rules = re.findall(r"\.fa-([a-z0-9-]+):{1,2}before\s*\{\s*content:\s*\"\\([0-9a-f]+)\";", css)
    return {name: chr(int(point, 16)) for name, point in rules}


def subset(source: Path, target: Path, glyphs: str) -> None:
    with tempfile.TemporaryDirectory() as tmp:
        flat = Path(tmp) / source.name
        shutil.copyfile(source, flat)
        subprocess.run(
            [sys.executable, "-m", "fontTools.subset", str(flat),
             f"--text={glyphs}", "--flavor=woff2", "--layout-features=",
             "--no-hinting", "--desubroutinize", f"--output-file={target}"],
            check=True, capture_output=True,
        )


def main() -> None:
    if not VENDOR.exists():
        raise SystemExit("npm install @fortawesome/fontawesome-free first")

    found = used_icons()
    points = codepoints()

    unknown = {name for names in found.values() for name in names if name not in points}
    if unknown:
        raise SystemExit(f"not Font Awesome icons: {', '.join(sorted(unknown))}")

    OUT_FONTS.mkdir(parents=True, exist_ok=True)
    blocks, rules, total = [], [], 0

    for style, (family, weight, filename, classes) in FAMILIES.items():
        names = sorted(found[style])
        if not names:
            print(f"{style:8} unused, no file shipped")
            continue
        glyphs = "".join(points[name] for name in names)
        target = OUT_FONTS / filename
        subset(VENDOR / "webfonts" / filename, target, glyphs)
        size = target.stat().st_size
        total += size
        before = (VENDOR / "webfonts" / filename).stat().st_size
        print(f"{style:8} {len(names):3} icons  {size / 1024:6.1f} KB  (was {before / 1024:.0f} KB)")

        blocks.append(
            f"@font-face {{\n"
            f"  font-family: '{family}';\n"
            f"  font-style: normal;\n"
            f"  font-weight: {weight};\n"
            f"  font-display: block;\n"
            f"  src: url('./fonts/{filename}') format('woff2');\n"
            f"}}\n\n"
            + ",\n".join(f".{c}" for c in classes) + " {\n"
            f"  font-family: '{family}';\n"
            f"  font-weight: {weight};\n"
            f"}}"
        )
        for name in names:
            rules.append(f".fa-{name}::before {{ content: '\\{ord(points[name]):x}'; }}")

    header = f"""/*
 * The icons, shipped with the site. Generated by scripts/build_icon_font.py -- do not edit.
 *
 * Font Awesome arrived from cdnjs.cloudflare.com on every page view until #465: a stylesheet
 * from a third party, which hands that third party every visitor's IP address. The three
 * typefaces had been self-hosted for exactly that reason since #461; the icons had not. The
 * privacy policy named Cloudflare, so nothing was hidden -- it was inconsistent.
 *
 * Only the icons this site draws are in here. The vendor's three files are about 300 KB
 * together; what is shipped below is a fraction of that, because a site that draws
 * {sum(len(v) for v in found.values())} icons has no use for {len(points)}.
 *
 * Font Awesome Free {(VENDOR / 'package.json').exists() and __import__('json').loads((VENDOR / 'package.json').read_text(encoding='utf-8'))['version']}
 * Icons: CC BY 4.0 -- https://creativecommons.org/licenses/by/4.0/
 * Fonts: SIL OFL 1.1 -- https://scripts.sil.org/OFL
 * https://fontawesome.com
 */

.fa,
.fas, .fa-solid,
.far, .fa-regular,
.fab, .fa-brands {{
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  display: var(--fa-display, inline-block);
  font-style: normal;
  font-variant: normal;
  line-height: 1;
  text-rendering: auto;
}}

.fa-fw {{ text-align: center; width: 1.25em; }}

"""

    OUT_CSS.write_text(header + "\n\n".join(blocks) + "\n\n" + "\n".join(sorted(rules)) + "\n",
                       encoding="utf-8")
    print(f"\n{total / 1024:.1f} KB of fonts, {len(rules)} icons -> {OUT_CSS.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
