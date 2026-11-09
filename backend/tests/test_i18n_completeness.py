"""The project-wide translation check must pass, and backend messages must cover all locales.

Runs scripts/check_i18n.py, which compares web, iOS, Android and backend translations.
Spanish was missing from Android entirely and from 15 of 16 backend error messages before
anything noticed, because a missing translation silently falls back to English everywhere.
"""
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
