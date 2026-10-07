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
