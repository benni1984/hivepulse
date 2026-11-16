"""The project-wide translation check must pass, and backend messages must cover all locales.

Runs scripts/check_i18n.py, which compares web, iOS, Android and backend translations.
Spanish was missing from Android entirely and from 15 of 16 backend error messages before
anything noticed, because a missing translation silently falls back to English everywhere.
"""
import json
import pathlib
import subprocess
import sys

import pytest

from app.i18n import MESSAGES, get_message

REPO = pathlib.Path(__file__).resolve().parents[2]
LOCALES = ("en", "de", "fr", "es", "pl")


@pytest.mark.parametrize("code", sorted(MESSAGES))
def test_every_error_message_exists_in_every_language(code):
    missing = [loc for loc in LOCALES if not MESSAGES[code].get(loc, "").strip()]
    assert not missing, f"{code} has no message for {missing}"


def test_accept_language_picks_the_spanish_message():
    assert get_message("HIVE_NOT_FOUND", "es") == MESSAGES["HIVE_NOT_FOUND"]["es"]
    assert get_message("HIVE_NOT_FOUND", "es-ES,es;q=0.9") == MESSAGES["HIVE_NOT_FOUND"]["es"]


def test_accept_language_picks_the_polish_message():
    assert get_message("HIVE_NOT_FOUND", "pl") == MESSAGES["HIVE_NOT_FOUND"]["pl"]
    assert get_message("HIVE_NOT_FOUND", "pl-PL,pl;q=0.9,en;q=0.5") == MESSAGES["HIVE_NOT_FOUND"]["pl"]


def test_unknown_language_falls_back_to_english():
    assert get_message("HIVE_NOT_FOUND", "it") == MESSAGES["HIVE_NOT_FOUND"]["en"]


def test_project_wide_translation_check_passes():
    script = REPO / "scripts" / "check_i18n.py"
    assert script.exists(), "scripts/check_i18n.py is missing"
    result = subprocess.run(
        [sys.executable, str(script), "--list"],
        cwd=REPO, capture_output=True, text=True, encoding="utf-8", errors="replace",
    )
    assert result.returncode == 0, f"translation check failed:\n{result.stdout}\n{result.stderr}"


# ── The check for labels assembled at runtime ────────────────────────────────
#
# `hiveTypeLabelRes` had a unit test from the day the hive *form* was fixed. The hive *list*
# went on upper-casing the raw value for months anyway, because the test covered the function
# and not its use, and no check could see the English: it was never written down, it was built
# at run time out of something the server sent (#428). These are the tests for the check that
# can see it -- a guard nobody has tried to break is not a guard.


def _checker():
    """Import scripts/check_i18n.py as a module; it does nothing at import time."""
    import importlib.util

    path = REPO / "scripts" / "check_i18n.py"
    spec = importlib.util.spec_from_file_location("check_i18n", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.mark.parametrize("line", [
    'AssistChip(label = { Text(hive.hiveType.replace("_", " ").replaceFirstChar { it.uppercase() }) })',
    'InfoRow(stringResource(R.string.field_queen_color), it.replaceFirstChar { c -> c.uppercase() })',
])
def test_the_check_sees_a_kotlin_label_built_from_a_raw_value(line):
    module = _checker()
    assert module.RUNTIME_LABEL["android"].search(line)
    assert not module.LOCALE_AWARE.search(line)


@pytest.mark.parametrize("line", [
    "Label(mood.capitalized, systemImage: moodIcon(mood))",
    '.foregroundStyle(by: .value("Mood", entry.key.capitalized))',
])
def test_the_check_sees_a_swift_label_built_from_a_raw_value(line):
    module = _checker()
    assert module.RUNTIME_LABEL["ios"].search(line)
    assert not module.LOCALE_AWARE.search(line)


@pytest.mark.parametrize("line", [
    # Formatting a month or a date for the reader is the one legitimate use, and both apps do it.
    "date.month.getDisplayName(TextStyle.FULL_STANDALONE, locale).replaceFirstChar { it.titlecase(locale) }",
    "return formatter.string(from: date).capitalized(with: formatter.locale)",
])
def test_the_check_leaves_locale_aware_date_formatting_alone(line):
    module = _checker()
    assert module.LOCALE_AWARE.search(line), "would be a false positive"


@pytest.mark.parametrize("line", [
    "StatusBadge(stringResource(hiveTypeLabelRes(hive.hiveType)))",
    'Label(NSLocalizedString("mood.\\(mood)", comment: ""), systemImage: moodIcon(mood))',
])
def test_the_check_is_quiet_about_a_label_that_is_looked_up(line):
    module = _checker()
    assert not module.RUNTIME_LABEL["android"].search(line)
    assert not module.RUNTIME_LABEL["ios"].search(line)


# ── The two grammar rules that are mechanical ────────────────────────────────
#
# Spanish `y`/`e` and French `de`/`d'` both depend only on the sound that follows, so both can be
# checked. Both were broken: "colmenas e revisiones" nine times across three platforms (#433) and
# "rappels d\'visite" twice in the Android reminder settings (#434). A key-parity check sees
# nothing -- the keys exist, the values are filled, the language is right, the grammar is wrong.
#
# These feed the checker the real lines that were in the repository, plus the ones that are
# correct and must stay quiet. A guard nobody has tried to break is not a guard.


@pytest.mark.parametrize("value", [
    "Amplía tus formularios de colmenas e revisiones con campos personalizados.",
    "Colmenas e revisiones ilimitadas",
    "Todos tus datos — colmenares, colmenas e revisiones — se eliminarán definitivamente.",
])
def test_the_check_sees_e_before_a_consonant(value):
    module = _checker()
    module.findings.clear()
    module.check_grammar("test", "es", {"k": value})
    assert module.findings, f"should have been flagged: {value}"
    assert "uses 'y'" in module.findings[0][1]


@pytest.mark.parametrize("value", [
    "Actualice su nombre y idioma, cambie su contraseña.",
    "nombre de display y idioma preferido",
])
def test_the_check_sees_y_before_an_i_sound(value):
    module = _checker()
    module.findings.clear()
    module.check_grammar("test", "es", {"k": value})
    assert module.findings, f"should have been flagged: {value}"
    assert "becomes 'e'" in module.findings[0][1]


@pytest.mark.parametrize("value", [
    # `e` is right before an i sound, which is the whole point of the rule.
    "Comprueba tu red e inténtalo de nuevo.",
    "Elige un día e intervalos de aviso.",
    # `y` is right before anything else, including an h that is not followed by i.
    "Desliza hacia arriba y hacia abajo.",
    "Regístrate y hazte colaborador.",
    "Colmenas y revisiones ilimitadas",
])
def test_the_check_is_quiet_about_correct_spanish(value):
    module = _checker()
    module.findings.clear()
    module.check_grammar("test", "es", {"k": value})
    assert not module.findings, f"false positive: {value} -> {module.findings}"


@pytest.mark.parametrize("value", [
    "Rappels d\'visite",
    "Envoyer des rappels d\'visite",
])
def test_the_check_sees_a_french_elision_before_a_consonant(value):
    module = _checker()
    module.findings.clear()
    module.check_grammar("test", "fr", {"k": value})
    assert module.findings, f"should have been flagged: {value}"
    assert "only elides" in module.findings[0][1]


@pytest.mark.parametrize("value", [
    # A vowel, so the elision is required rather than wrong.
    "Rappels d\'inspection",
    "Code d\'accès",
    "Impossible d\'obtenir la position GPS",
    # A mute h takes the elision too.
    "Pas d\'heure définie",
    # The typographic apostrophe, which both apps use in places.
    "Code d\u2019accès",
])
def test_the_check_is_quiet_about_correct_french(value):
    module = _checker()
    module.findings.clear()
    module.check_grammar("test", "fr", {"k": value})
    assert not module.findings, f"false positive: {value} -> {module.findings}"


# ── Visible text typed straight into a web page ──────────────────────────────
#
# iOS and Android were scanned for hardcoded English from early on; the web never was, so an
# English back-link sat at the foot of the trap page in all five languages (#439).
#
# The first attempt at a scanner missed it, which is the part worth pinning: a pattern looking
# for `>text<` on a single line finds nothing, because a JSX child stands on a line of its own.


def test_the_check_sees_a_jsx_child_on_its_own_line():
    module = _checker()
    source = '<Link href="/hornets">\n  ← Hornets Tracker\n</Link>'
    assert module.hardcoded_jsx_text(source) == [(2, "← Hornets Tracker")]


def test_the_check_sees_prose_in_a_heading():
    module = _checker()
    source = "<h2>\n  Manage your hornet traps\n</h2>"
    assert module.hardcoded_jsx_text(source) == [(2, "Manage your hornet traps")]


@pytest.mark.parametrize("source", [
    # A translated child is the correct form and must stay quiet.
    '<Link href="/hornets">\n  {t("title")}\n</Link>',
    # A ternary inside JSX braces wraps onto its own line and reads as text. Both of these are
    # real lines from the dashboard; they were the only false positives the scan produced.
    "{deleteConfirmId === fd.id ? (\n  <span>x</span>\n)}",
    "{deleteFieldConfirmId === fd.id ? (\n  <span>x</span>\n)}",
    # Language names are written in their own language on purpose.
    '<option value="de">\n  Deutsch\n</option>',
    # Text that is not between tags is not shown to a reader.
    "const title = 'Hornet Tracker';",
])
def test_the_check_is_quiet_about_what_it_should_be(source):
    module = _checker()
    assert module.hardcoded_jsx_text(source) == []


def test_the_whole_web_app_is_free_of_hardcoded_text():
    """The repository itself, so a new page cannot add one without failing here."""
    module = _checker()
    offenders = []
    for folder in ("app", "components"):
        for page in sorted((REPO / folder).rglob("*.tsx")):
            if "/content/" in page.as_posix():
                continue
            for number, text in module.hardcoded_jsx_text(page.read_text(encoding="utf-8")):
                offenders.append(f"{page.relative_to(REPO).as_posix()}:{number} {text!r}")
    assert not offenders, "hardcoded text on the website:\n  " + "\n  ".join(offenders)


# ── The two apps must read alike ─────────────────────────────────────────────
#
# 103 strings showed the identical English on both apps and said different things in German,
# French or Spanish (#436) — including the project's own vocabulary being ignored, and each app
# contradicting itself about whether a frame of brood is a "Brutwabe" or a "Bruträhmchen".
#
# The rule was in CLAUDE.md and in no test. Key names differ by platform, so a key-based check
# cannot see it; matching on the English value needs no mapping.


def test_the_check_sees_two_apps_saying_different_things():
    module = _checker()
    module.findings.clear()
    module.check_app_wording(
        {"en": {"label_never_inspected": "Never inspected before"},
         "de": {"label_never_inspected": "Noch nie kontrolliert"}},
        {"en": {"label.neverInspected": "Never inspected before"},
         "de": {"label.neverInspected": "Noch nie besucht"}},
    )
    assert module.findings, "the drift should have been reported"
    assert "same English but differ" in module.findings[0][1]


def test_the_check_is_quiet_when_they_agree():
    module = _checker()
    module.findings.clear()
    module.check_app_wording(
        {"en": {"k": "Never inspected before"}, "de": {"k": "Noch nie kontrolliert"}},
        {"en": {"k.ios": "Never inspected before"}, "de": {"k.ios": "Noch nie kontrolliert"}},
    )
    assert not module.findings


def test_the_check_ignores_single_words():
    """"Save" labels twenty buttons; two platforms putting it elsewhere proves nothing."""
    module = _checker()
    module.findings.clear()
    module.check_app_wording(
        {"en": {"k": "Save"}, "de": {"k": "Speichern"}},
        {"en": {"k.ios": "Save"}, "de": {"k.ios": "Sichern"}},
    )
    assert not module.findings


def test_the_check_ignores_an_english_phrase_used_twice_on_one_side():
    """Two keys with the same English are two different places, not one to compare."""
    module = _checker()
    module.findings.clear()
    module.check_app_wording(
        {"en": {"a": "Delete this entry", "b": "Delete this entry"},
         "de": {"a": "Eintrag löschen", "b": "Diesen Eintrag löschen"}},
        {"en": {"a.ios": "Delete this entry"}, "de": {"a.ios": "Eintrag entfernen"}},
    )
    assert not module.findings


def test_the_repository_itself_has_no_drift():
    """The real strings, so a new screen cannot add a difference without failing here."""
    module = _checker()
    module.findings.clear()
    locales = ("en", "de", "fr", "es", "pl")
    android = {
        loc: module.load_xml(REPO / "android/app/src/main/res" /
                             ("values" if loc == "en" else f"values-{loc}") / "strings.xml")
        for loc in locales
    }
    ios = {
        loc: module.load_strings(REPO / "ios/HivePulse/Resources" / f"{loc}.lproj/Localizable.strings")
        for loc in locales
    }
    module.check_app_wording(android, ios)
    assert not module.findings, (
        "Android and the iPhone disagree:\n  " + "\n  ".join(m for _, m in module.findings))


# ── Short labels, and one feature's name ─────────────────────────────────────
#
# check_app_wording compares only phrases of 12 characters or more, because one English word
# is not a sentence: "Save" labels twenty different buttons. A tab label is one word, so the
# sweep could never see the bottom navigation — and that is where #435 sat. Android's Spanish
# tab said "Avispones", the iPhone's said "Avispas", and "avispa" is a common wasp, not the
# hornet the whole feature is about. Nothing was missing and nothing was empty; one of the two
# phones simply named the wrong insect, in its most prominent place.

SPANISH_TABS = {
    "tab_apiaries": "Colmenares", "tab_scan_short": "Escanear", "tab_hornets": "Avispones",
    "tab_members": "Miembros", "tab_settings": "Ajustes",
}


def _tabs(**overrides):
    """A complete pair of tab tables, so that an empty label is only ever deliberate."""
    android = dict(SPANISH_TABS, **{k: v for k, v in overrides.items() if k.startswith("tab_")})
    ios = {
        ios_key: overrides.get(ios_key, SPANISH_TABS[android_key])
        for android_key, ios_key in (("tab_apiaries", "tab.apiaries"),
                                     ("tab_scan_short", "tab.scan"),
                                     ("tab_hornets", "tab.hornets"),
                                     ("tab_members", "tab.members"),
                                     ("tab_settings", "tab.settings"))
    }
    return {"es": android}, {"es": ios}


def test_the_check_sees_two_apps_naming_a_tab_differently():
    module = _checker()
    module.findings.clear()
    module.check_tab_labels(*_tabs(**{"tab.hornets": "Avispas"}))
    assert module.findings, "a tab reading differently on the two apps must be flagged"
    assert "bottom tab" in module.findings[0][1]
    assert "Avispas" in module.findings[0][1]


def test_the_check_is_quiet_when_the_tabs_agree():
    module = _checker()
    module.findings.clear()
    module.check_tab_labels(*_tabs())
    assert not module.findings, f"false positive: {module.findings}"


def test_the_check_reads_the_android_tab_from_the_short_string():
    """Android draws the tab from tab_scan_short; tab_scan is the screen's own title."""
    module = _checker()
    assert ("tab_scan_short", "tab.scan") in module.TAB_LABELS
    assert not any(a == "tab_scan" for a, _ in module.TAB_LABELS)


def test_the_check_sees_an_empty_tab_label():
    module = _checker()
    module.findings.clear()
    module.check_tab_labels(*_tabs(tab_hornets=""))
    assert module.findings
    assert "no text" in module.findings[0][1]


# One feature, one name per language (#440). The website carried three names for the hornet
# tracker — its navigation, its page title and its help index — and the apps a fourth. The
# name has to say which species: the European hornet is protected and must not be trapped, so
# a label reading only "hornets" tells a beekeeper nothing about what to catch.

def test_the_check_sees_a_navigation_entry_that_renames_the_feature():
    module = _checker()
    module.findings.clear()
    module.check_feature_name(
        {"en": {"hornets.title": "Asian Hornet Tracker", "nav.hornets": "Hornet Tracker"}},
        {}, {},
    )
    assert module.findings, "a second name for the same feature must be flagged"
    assert "one name per language" in module.findings[0][1]


def test_the_check_sees_an_app_that_renames_the_feature():
    module = _checker()
    module.findings.clear()
    module.check_feature_name(
        {"es": {"hornets.title": "Rastreador de avispa asiática"}},
        {"es": {"hornet_title": "Rastreador de avispones"}},
        {"es": {"hornets.title": "Seguimiento de avispas"}},
    )
    areas = {area for area, _ in module.findings}
    assert areas == {"android", "ios"}, f"both apps must be named, got {areas}"


def test_the_check_is_quiet_when_every_client_agrees():
    module = _checker()
    module.findings.clear()
    name = "Suivi du frelon asiatique"
    module.check_feature_name(
        {"fr": {"hornets.title": name, "nav.hornets": name, "meta.hornetsTitle": name,
                "helpIndex.topics.hornet-tracker.title": name}},
        {"fr": {"hornet_title": name}}, {"fr": {"hornets.title": name}},
    )
    assert not module.findings, f"false positive: {module.findings}"


def test_the_check_notices_the_feature_has_no_name_at_all():
    module = _checker()
    module.findings.clear()
    module.check_feature_name({"en": {"nav.hornets": "Hornet Tracker"}}, {}, {})
    assert module.findings
    assert "no name to follow" in module.findings[0][1]


# The Spanish vocabulary rule, which catches the same mistake from the other side: not by
# comparing two platforms, but by reading one string. "avispa asiática" is the species this
# app tracks, "avispón" its genus for the short slots, and "avispa común" the deliberate
# contrast that tells them apart. A bare "avispa" is none of those.

@pytest.mark.parametrize("value", [
    "Avispas capturadas",
    "Rastreador de avispas",
    "No es una avispa",
    "¿Cuántas avispas capturaste?",
])
def test_the_check_sees_a_bare_spanish_wasp(value):
    module = _checker()
    module.findings.clear()
    module.check_grammar("web", "es", {"k": value})
    assert module.findings, f"should have been flagged: {value}"
    assert "common wasp" in module.findings[0][1]


@pytest.mark.parametrize("value", [
    "Rastreador de avispa asiática",
    "Avispones capturados",
    "Distingue la avispa asiática de una avispa común o del avispón europeo",
    "Las avispas asiáticas llegan en otoño",
    "Un avispero bajo el tejado",
    "Vespa velutina",
])
def test_the_check_is_quiet_about_correct_spanish_hornet_wording(value):
    module = _checker()
    module.findings.clear()
    module.check_grammar("web", "es", {"k": value})
    assert not module.findings, f"false positive: {value} -> {module.findings}"


def test_the_wasp_rule_applies_to_spanish_only():
    """French "guêpe" and German "Wespe" are nobody's business here."""
    module = _checker()
    module.findings.clear()
    module.check_grammar("web", "fr", {"k": "Piège à guêpes et avispas"})
    assert not module.findings


def test_the_repository_itself_names_the_tracker_once_per_language():
    """The real strings, so a new screen cannot invent a fifth name without failing here."""
    module = _checker()
    module.findings.clear()
    locales = ("en", "de", "fr", "es", "pl")
    android = {
        loc: module.load_xml(REPO / "android/app/src/main/res" /
                             ("values" if loc == "en" else f"values-{loc}") / "strings.xml")
        for loc in locales
    }
    ios = {
        loc: module.load_strings(REPO / "ios/HivePulse/Resources" / f"{loc}.lproj/Localizable.strings")
        for loc in locales
    }
    web = {
        loc: module.flatten(json.loads(
            (REPO / "messages" / f"{loc}.json").read_text(encoding="utf-8")))
        for loc in locales
    }
    module.check_feature_name(web, android, ios)
    module.check_tab_labels(android, ios)
    assert not module.findings, (
        "the clients disagree:\n  " + "\n  ".join(m for _, m in module.findings))
