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
  * backend error messages and notification templates exist in all five languages

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
LOCALES = ("en", "de", "fr", "es", "pl")
# &amp; &lt; &gt; &quot; &#39; and friends: right in XML and JSX text, wrong in a .strings file or a JSON message.
ENTITY = re.compile(r"&(?:amp|lt|gt|quot|apos|#\d+);")

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


# ── Grammar rules that are mechanical ────────────────────────────────────────
#
# Most wording cannot be checked by a machine. Two rules can, and both were broken in ways no
# parity check could see -- the keys existed, the values were non-empty, and the text was
# genuinely in the right language. It was simply wrong (#433, #434).
#
# Spanish: `y` becomes `e` before an i- or hi- sound, and only there. The repository had
# "colmenas e revisiones" nine times and "nombre y idioma" twice -- both halves of the same rule
# broken in opposite directions, from replacing the word after the conjunction and leaving the
# conjunction alone.
#
# French: `de` elides to `d'` before a vowel or a mute h, and only there. The repository had
# "rappels d'visite" twice, in the reminder settings.

# A word beginning with an i sound: i, í, hi. `hie-`/`hia-` keep `y` ("agua y hielo"), because
# there the i is a semivowel.
ES_I_SOUND = re.compile(r"^(?:[ií]|hi(?![ae]))", re.IGNORECASE)
ES_CONJ = re.compile(r"(?<![\w])([ye])\s+([^\s<>{}\[\]]+)")

FR_VOWEL = re.compile(r"^(?:[aeiouyàâäéèêëîïôöùûüAEIOUY]|h)", re.IGNORECASE)
FR_ELISION = re.compile(r"(?<![\w])d['\u2019]\s*([a-zA-Zà-ÿ]+)")


def check_grammar(area: str, locale: str, strings: dict[str, str]) -> None:
    """The two rules above, over one platform's strings for one language."""
    for key, value in strings.items():
        if not isinstance(value, str):
            continue
        if locale == "es":
            for conj, following in ES_CONJ.findall(value):
                i_sound = bool(ES_I_SOUND.match(following))
                if conj.lower() == "e" and not i_sound:
                    fail(area, f"es: {key!r} has 'e {following}' — Spanish uses 'y' unless the "
                               f"next word starts with an i or hi sound")
                if conj.lower() == "y" and i_sound:
                    fail(area, f"es: {key!r} has 'y {following}' — becomes 'e' before an "
                               f"i or hi sound")
        elif locale == "fr":
            for following in FR_ELISION.findall(value):
                if not FR_VOWEL.match(following):
                    fail(area, f"fr: {key!r} has \"d'{following}\" — 'de' only elides before a "
                               f"vowel or a mute h")


# ── Visible text typed straight into a page ────────────────────────
#
# iOS and Android have been scanned for hardcoded English since early on. The web never was,
# which is how an English back-link came to sit at the foot of the trap page in all five
# languages (#439).
#
# A pattern looking for `>text<` on one line finds nothing, because a JSX child stands on a line
# of its own:
#
#     <Link href="/hornets">
#       ← Hornets Tracker
#     </Link>
#
# What marks it as prose is the shape: a line holding only text, between a line that ends a tag
# and a line that opens one.

_TEXT_ONLY = re.compile(r"^\s*(?![/<{}])([^<>{}]+?)\s*$")
_HAS_WORDS = re.compile(r"[A-Za-z]{3}")
_NOT_PROSE = re.compile(r"^(import|export|const|let|var|return|function|type|interface|if|"
                        r"else|for|while|case|default|await|async|new |class |\*|//|/\*|\}|"
                        r"\)|;|,|:|=)")
# A ternary inside JSX braces wraps onto its own line and reads as text until you see the
# operators: `deleteConfirmId === fd.id ? (`. No sentence shown to a reader carries these.
_CODE_SMELL = re.compile(r"===|!==|=>|&&|\|\||\($")
# Language names are written in their own language on purpose.
_ENDONYMS = {"English", "Deutsch", "Polski", "Español", "Français",
             "HivePulse", "Hive", "Pulse"}


def hardcoded_jsx_text(source: str) -> list[tuple[int, str]]:
    """Lines of one .tsx file that show text to a reader without going through a translation."""
    lines = source.splitlines()
    out: list[tuple[int, str]] = []
    for number, line in enumerate(lines, 1):
        match = _TEXT_ONLY.match(line)
        if not match:
            continue
        text = match.group(1).strip()
        if (not _HAS_WORDS.search(text) or _NOT_PROSE.match(text)
                or _CODE_SMELL.search(text) or text in _ENDONYMS or text.isupper()):
            continue
        before = next((lines[i] for i in range(number - 2, -1, -1) if lines[i].strip()), "")
        after = next((lines[i] for i in range(number, len(lines)) if lines[i].strip()), "")
        if not before.rstrip().endswith(">") or not after.lstrip().startswith("<"):
            continue
        out.append((number, text))
    return out


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
        for key, value in messages[locale].items():
            if ENTITY.search(value):
                fail(area, f"{locale}: {key} contains an HTML entity, write the character itself")
    if "en" not in messages:
        return
    placeholder = re.compile(r"\{[a-zA-Z0-9_]+\}")
    for locale in LOCALES[1:]:
        if locale in messages:
            compare(area, messages["en"], messages[locale], locale, placeholder)
            check_grammar(area, locale, messages[locale])

    for folder in ("app", "components"):
        for page in sorted((ROOT / folder).rglob("*.tsx")):
            if "/content/" in page.as_posix():
                continue  # help pages are one file per language by design
            rel = page.relative_to(ROOT).as_posix()
            for number, text in hardcoded_jsx_text(page.read_text(encoding="utf-8")):
                fail(area, f"hardcoded text {text!r} in {rel}:{number}")

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
        # A .strings file is plain text: "&amp;" shows up on screen as "&amp;" (it did, in Settings).
        for key, value in tables[locale].items():
            if ENTITY.search(value):
                fail(area, f"{locale}: {key} contains an HTML entity, write the character itself")
    if "en" not in tables:
        return
    placeholder = re.compile(r"%(?:\d+\$)?[@dfs]")
    for locale in LOCALES[1:]:
        if locale in tables:
            compare(area, tables["en"], tables[locale], locale, placeholder)
            check_grammar(area, locale, tables[locale])

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

    check_runtime_labels(area, sorted((ROOT / "ios/HivePulse/Views").rglob("*.swift")))


# ── Labels assembled at runtime ───────────────────────────────────────────────
#
# The checks above read the source for English that was typed in. They cannot see a label that
# is *computed*: the backend sends `top_bar`, the screen swaps the underscore for a space and
# upper-cases the first letter, and "Top Bar" appears in every language. Nothing English is ever
# written down, so nothing is ever flagged -- and in English the result is indistinguishable from
# the real label, so nobody notices either. Four screens did this for months (#428).

# The shape of the mistake, per platform.
RUNTIME_LABEL = {
    "ios": re.compile(r"\.capitalized\b|replacingOccurrences\(of:\s*\"_\""),
    "android": re.compile(r"replaceFirstChar|\.replace\(\"_\",\s*\" \"\)"),
}

# A locale in the same breath means a date or a month being formatted for the reader, which is
# the one legitimate use: `getDisplayName(TextStyle.FULL_STANDALONE, locale)`,
# `capitalized(with: formatter.locale)`.
LOCALE_AWARE = re.compile(r"locale|Locale|formatter|Formatter|DisplayName")


def check_runtime_labels(area: str, files: list[pathlib.Path]) -> None:
    pattern = RUNTIME_LABEL[area]
    for path in files:
        for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            stripped = line.strip()
            if stripped.startswith(("//", "*", "/*")):
                continue
            if not pattern.search(line) or LOCALE_AWARE.search(line):
                continue
            fail(area, f"label built from a raw value in {path.name}:{number} — "
                       f"look the translation up instead")


# ── Android ───────────────────────────────────────────────────────────────────

def load_xml(path: pathlib.Path) -> dict[str, str]:
    root = ET.fromstring(path.read_text(encoding="utf-8"))
    return {node.get("name"): (node.text or "") for node in root.iter("string")}


def check_android() -> None:
    area = "android"
    res = ROOT / "android/app/src/main/res"
    folders = {"en": "values", "de": "values-de", "fr": "values-fr", "es": "values-es", "pl": "values-pl"}
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
            check_grammar(area, locale, tables[locale])

    literal = re.compile(r'(?:contentDescription\s*=\s*|Text\(\s*)"([A-Z][A-Za-z ]{3,})"')
    for kotlin in sorted((ROOT / "android/app/src/main/java/com/hivepulse/app/ui").rglob("*.kt")):
        for number, line in enumerate(kotlin.read_text(encoding="utf-8").splitlines(), 1):
            if "stringResource" in line:
                continue
            for match in literal.finditer(line):
                text = match.group(1)
                if text != "HivePulse" and not text.isupper():
                    fail(area, f"hardcoded English {text!r} in {kotlin.name}:{number}")

    check_runtime_labels(area, sorted((ROOT / "android/app/src/main/java/com/hivepulse/app/ui")
                                      .rglob("*.kt")))


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
        have = set(re.findall(r'"(en|de|fr|es|pl)":', body))
        for locale in sorted(set(LOCALES) - have):
            fail(area, f"error {code} has no {locale} message")

    if "SUPPORTED_LANGUAGES" in source:
        accepted = set(re.findall(r'"(en|de|fr|es|pl)"', source.split("SUPPORTED_LANGUAGES")[1][:80]))
        for locale in sorted(set(LOCALES) - accepted):
            fail(area, f"get_message never selects {locale!r} — that language is served in English")

    # Outgoing messages: reminder push, reminder email, password-reset email
    templates = ROOT / "backend/app/notifications_i18n.py"
    if not templates.exists():
        fail(area, "backend/app/notifications_i18n.py is missing")
        return
    source = templates.read_text(encoding="utf-8")
    entries = re.findall(r'^    "([a-z.]+)": \{\n(.*?)^    \},', source, re.S | re.M)
    if not entries:
        fail(area, "no notification templates found — has the format changed?")
    placeholder = re.compile(r"\{[a-z_]+\}")
    for key, body in entries:
        variants = dict(re.findall(r'"(en|de|fr|es|pl)":\s*"(.*)",', body))
        for locale in sorted(set(LOCALES) - set(variants)):
            fail(area, f"notification template {key} has no {locale} text")
        english = sorted(placeholder.findall(variants.get("en", "")))
        for locale, text in sorted(variants.items()):
            if sorted(placeholder.findall(text)) != english:
                fail(area, f"notification template {key}/{locale} has different placeholders")


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
