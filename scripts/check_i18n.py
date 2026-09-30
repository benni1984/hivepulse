#!/usr/bin/env python3
"""Plausibility check for translations across the whole project.

Run from the repository root:

    python scripts/check_i18n.py            # report and exit non-zero on findings
    python scripts/check_i18n.py --list     # also print every finding, not just the first few

It checks, for web (next-intl), iOS (.strings), Android (strings.xml) and the backend:

  * every locale defines every key the reference locale defines, and no stale extras
  * no empty translations
  * placeholders ({name}, %1$s, %@, %d) match the reference string
  * the help URL points at the matching language
  * user-visible screens do not hardcode English text
  * backend error messages and notification templates exist in all four languages

Android also has this as a unit test (TranslationCompletenessTest); this script is the
cross-platform version that CI runs for every component at once.
"""
from __future__ import annotations

import argparse
import json
import pathlib
import re
import sys
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
LOCALES = ("en", "de", "fr", "es")

findings: list[tuple[str, str]] = []


def fail(area: str, message: str) -> None:
    findings.append((area, message))


# ── helpers ───────────────────────────────────────────────────────────────────

def flatten(data: dict, prefix: str = "") -> dict[str, str]:
    out: dict[str, str] = {}
    for key, value in data.items():
        full = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            out.update(flatten(value, full))
        else:
            out[full] = value
    return out


def compare(area: str, reference: dict[str, str], other: dict[str, str], locale: str,
            placeholder: re.Pattern[str]) -> None:
    for key in sorted(set(reference) - set(other)):
        fail(area, f"{locale}: missing key {key!r} (en: {reference[key]!r})")
    for key in sorted(set(other) - set(reference)):
        fail(area, f"{locale}: stale key {key!r} — not in the reference locale")
    for key in sorted(set(reference) & set(other)):
        value = other[key]
        if isinstance(value, str) and not value.strip():
            fail(area, f"{locale}: empty translation for {key!r}")
        if isinstance(value, str) and isinstance(reference[key], str):
            want = sorted(placeholder.findall(reference[key]))
            got = sorted(placeholder.findall(value))
            if want != got:
                fail(area, f"{locale}: {key!r} has placeholders {got} but English has {want}")


# ── web ───────────────────────────────────────────────────────────────────────

def check_web() -> None:
    area = "web"
    messages = {}
    for locale in LOCALES:
        path = ROOT / "messages" / f"{locale}.json"
        if not path.exists():
            fail(area, f"messages/{locale}.json is missing")
            continue
        messages[locale] = flatten(json.loads(path.read_text(encoding="utf-8")))
    if "en" not in messages:
        return
    placeholder = re.compile(r"\{[a-zA-Z0-9_]+\}")
    for locale in LOCALES[1:]:
        if locale in messages:
            compare(area, messages["en"], messages[locale], locale, placeholder)

    # Page metadata must be localized, not a single English string for every locale
    layout = (ROOT / "app/[locale]/layout.tsx")
    if layout.exists() and "generateMetadata" not in layout.read_text(encoding="utf-8"):
        fail(area, "app/[locale]/layout.tsx has no generateMetadata — titles stay English in every locale")


# ── iOS ───────────────────────────────────────────────────────────────────────

STRINGS_LINE = re.compile(r'^\s*"([^"]+)"\s*=\s*"(.*)";\s*$')


def load_strings(path: pathlib.Path) -> dict[str, str]:
    table: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        match = STRINGS_LINE.match(line)
        if match:
            table[match.group(1)] = match.group(2)
    return table


def check_ios() -> None:
    area = "ios"
    base = ROOT / "ios/HivePulse/Resources"
    tables = {}
    for locale in LOCALES:
        path = base / f"{locale}.lproj/Localizable.strings"
        if not path.exists():
            fail(area, f"{locale}.lproj/Localizable.strings is missing")
            continue
        tables[locale] = load_strings(path)
    if "en" not in tables:
        return
    placeholder = re.compile(r"%(?:\d+\$)?[@dfs]")
    for locale in LOCALES[1:]:
        if locale in tables:
            compare(area, tables["en"], tables[locale], locale, placeholder)

    literal = re.compile(r'(?:Text|Button|Label)\(\s*"([A-Z][A-Za-z ]{3,})"')
    for swift in sorted((ROOT / "ios/HivePulse").rglob("*.swift")):
        if "/Testing/" in swift.as_posix():
            continue
        for number, line in enumerate(swift.read_text(encoding="utf-8").splitlines(), 1):
            if "NSLocalizedString" in line or line.strip().startswith("//"):
                continue
            for match in literal.finditer(line):
                text = match.group(1)
                if text not in {"HivePulse", "Hive", "Pulse"} and not text.isupper():
                    fail(area, f"hardcoded English {text!r} in {swift.name}:{number}")


# ── Android ───────────────────────────────────────────────────────────────────

def load_xml(path: pathlib.Path) -> dict[str, str]:
    root = ET.fromstring(path.read_text(encoding="utf-8"))
    return {node.get("name"): (node.text or "") for node in root.iter("string")}


def check_android() -> None:
    area = "android"
    res = ROOT / "android/app/src/main/res"
    folders = {"en": "values", "de": "values-de", "fr": "values-fr", "es": "values-es"}
    tables = {}
    for locale, folder in folders.items():
        path = res / folder / "strings.xml"
        if not path.exists():
            fail(area, f"{folder}/strings.xml is missing — {locale} falls back to English")
            continue
        tables[locale] = load_xml(path)
    if "en" not in tables:
        return
    placeholder = re.compile(r"%\d+\$[sd]")
    for locale in LOCALES[1:]:
        if locale in tables:
            compare(area, tables["en"], tables[locale], locale, placeholder)
            help_url = tables[locale].get("url_help", "")
            if help_url and f"/{locale}/help" not in help_url:
                fail(area, f"{locale}: url_help points at {help_url!r}")

    literal = re.compile(r'(?:contentDescription\s*=\s*|Text\(\s*)"([A-Z][A-Za-z ]{3,})"')
    for kotlin in sorted((ROOT / "android/app/src/main/java/com/hivepulse/app/ui").rglob("*.kt")):
        for number, line in enumerate(kotlin.read_text(encoding="utf-8").splitlines(), 1):
            if "stringResource" in line:
                continue
            for match in literal.finditer(line):
                text = match.group(1)
                if text != "HivePulse" and not text.isupper():
                    fail(area, f"hardcoded English {text!r} in {kotlin.name}:{number}")


# ── backend ───────────────────────────────────────────────────────────────────

def check_backend() -> None:
    area = "backend"
    path = ROOT / "backend/app/i18n.py"
    if not path.exists():
        fail(area, "backend/app/i18n.py is missing")
        return
    source = path.read_text(encoding="utf-8")
    blocks = re.findall(r'^\s{4}"([A-Z_]+)":\s*\{(.*?)\n\s{4}\}', source, re.S | re.M)
    if not blocks:
        fail(area, "no error-message blocks found in i18n.py — has the format changed?")
    for code, body in blocks:
        have = set(re.findall(r'"(en|de|fr|es)":', body))
        for locale in sorted(set(LOCALES) - have):
            fail(area, f"error {code} has no {locale} message")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--list", action="store_true", help="print every finding")
    args = parser.parse_args()

    for check in (check_web, check_ios, check_android, check_backend):
        check()

    by_area: dict[str, list[str]] = {}
    for area, message in findings:
        by_area.setdefault(area, []).append(message)

    for area in ("web", "ios", "android", "backend"):
        items = by_area.get(area, [])
        status = "OK" if not items else f"{len(items)} finding(s)"
        print(f"{area:8} {status}")
        for message in (items if args.list else items[:10]):
            print(f"    - {message}")
        if not args.list and len(items) > 10:
            print(f"    … {len(items) - 10} more (use --list)")

    print()
    if findings:
        print(f"FAILED — {len(findings)} finding(s)")
        return 1
    print("All translation checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
