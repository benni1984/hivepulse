"""Reminders and password-reset emails must use the account's language.

Every user row stores a locale, but the reminder push, the reminder email and the
password-reset email were written in English for everyone.
"""
import pytest

from app.notifications_i18n import (
    SUPPORTED,
    hive_count,
    normalize,
    reminder_email,
    reminder_push,
    render,
    reset_email,
    TEMPLATES,
)


@pytest.mark.parametrize("key", sorted(TEMPLATES))
def test_every_template_exists_in_every_language(key):
    missing = [loc for loc in SUPPORTED if not TEMPLATES[key].get(loc, "").strip()]
    assert not missing, f"{key} has no text for {missing}"


@pytest.mark.parametrize("key", sorted(TEMPLATES))
def test_placeholders_match_the_english_template(key):
    import re

    placeholder = re.compile(r"\{[a-z_]+\}")
    english = sorted(placeholder.findall(TEMPLATES[key]["en"]))
    for locale in SUPPORTED:
        assert sorted(placeholder.findall(TEMPLATES[key][locale])) == english, f"{key}/{locale}"


def test_normalize_maps_tags_and_falls_back():
    assert normalize("de") == "de"
    assert normalize("es-ES") == "es"
    assert normalize("fr-CA,fr;q=0.9") == "fr"
    assert normalize("it") == "en"
    assert normalize(None) == "en"


def test_hive_count_uses_singular_and_plural():
    assert hive_count(1, "de") == "1 Volk"
    assert hive_count(3, "de") == "3 Völker"
    assert hive_count(1, "en") == "1 hive"
    assert hive_count(2, "fr") == "2 ruches"
    assert hive_count(2, "es") == "2 colmenas"


def test_reminder_push_is_translated():
    title_de, body_de = reminder_push(2, "de")
    assert title_de == "Durchsicht fällig"
    assert "2 Völker" in body_de

    title_en, body_en = reminder_push(1, None)
    assert title_en == "Inspection due"
    assert "1 hive" in body_en


def test_reminder_email_is_translated_and_keeps_the_link():
    subject, html = reminder_email(3, "https://hivepulse.example", "fr")
    assert subject == "Visite à faire"
    assert "3 ruches" in html
    assert "https://hivepulse.example/dashboard" in html
    assert "e-mail" in html  # opt-out line came along


def test_reset_email_is_translated_and_keeps_the_link():
    url = "https://hivepulse.example/reset?token=abc"
    subject, html = reset_email(url, 30, "es")
    assert subject == "Restablecer tu contraseña de HivePulse"
    assert "30 minutos" in html
    assert url in html


def test_unknown_language_falls_back_to_english():
    subject, html = reminder_email(1, "https://x.test", "it")
    assert subject == "Inspection due"
    assert "1 hive" in html


def test_render_rejects_an_unknown_key():
    with pytest.raises(KeyError):
        render("does.not.exist", "en")
