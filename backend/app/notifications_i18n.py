"""Localized templates for the messages HivePulse sends out.

Every account stores its language (``User.locale``), but reminder pushes, reminder emails
and password-reset emails were written in English for everyone. These templates are keyed
by the same four locales as the rest of the project; ``render`` falls back to English for
an unknown or missing language.

Plurals use two forms per language ("one" / "other"), which covers en/de/fr/es for the
counts we send (a number of hives).
"""
from __future__ import annotations

import html

from typing import Optional

SUPPORTED = ("en", "de", "fr", "es")
DEFAULT = "en"

# {hives} is the already-pluralized noun phrase, e.g. "3 hives" / "3 Völker".
TEMPLATES: dict[str, dict[str, str]] = {
    "hives.one": {
        "en": "{count} hive",
        "de": "{count} Volk",
        "fr": "{count} ruche",
        "es": "{count} colmena",
    },
    "hives.other": {
        "en": "{count} hives",
        "de": "{count} Völker",
        "fr": "{count} ruches",
        "es": "{count} colmenas",
    },
    "reminder.push.title": {
        "en": "Inspection due",
        "de": "Durchsicht fällig",
        "fr": "Visite à faire",
        "es": "Toca inspeccionar",
    },
    "reminder.push.body": {
        "en": "{hives} need inspection",
        "de": "{hives} warten auf eine Durchsicht",
        "fr": "{hives} attendent une visite",
        "es": "{hives} esperan una inspección",
    },
    "reminder.email.subject": {
        "en": "Inspection due",
        "de": "Durchsicht fällig",
        "fr": "Visite à faire",
        "es": "Toca inspeccionar",
    },
    "reminder.email.body": {
        "en": "<p>{hives} in your apiaries are due for inspection.</p>",
        "de": "<p>{hives} in deinen Bienenständen warten auf eine Durchsicht.</p>",
        "fr": "<p>{hives} de vos ruchers attendent une visite.</p>",
        "es": "<p>{hives} de tus colmenares esperan una inspección.</p>",
    },
    "reminder.email.cta": {
        "en": "<p><a href='{url}'>Open HivePulse</a></p>",
        "de": "<p><a href='{url}'>HivePulse öffnen</a></p>",
        "fr": "<p><a href='{url}'>Ouvrir HivePulse</a></p>",
        "es": "<p><a href='{url}'>Abrir HivePulse</a></p>",
    },
    "reminder.email.optout": {
        "en": "<p>You can turn off email reminders any time in your profile settings.</p>",
        "de": "<p>Du kannst E-Mail-Erinnerungen jederzeit in deinen Profileinstellungen abschalten.</p>",
        "fr": "<p>Vous pouvez désactiver les rappels par e-mail à tout moment dans votre profil.</p>",
        "es": "<p>Puedes desactivar los recordatorios por correo cuando quieras en tu perfil.</p>",
    },
    "reset.email.subject": {
        "en": "Reset your HivePulse password",
        "de": "HivePulse-Passwort zurücksetzen",
        "fr": "Réinitialiser votre mot de passe HivePulse",
        "es": "Restablecer tu contraseña de HivePulse",
    },
    "reset.email.intro": {
        "en": "<p>Click the link below to reset your password. It expires in {minutes} minutes.</p>",
        "de": "<p>Klicke auf den Link, um dein Passwort zurückzusetzen. Er läuft in {minutes} Minuten ab.</p>",
        "fr": "<p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe. Il expire dans {minutes} minutes.</p>",
        "es": "<p>Haz clic en el enlace para restablecer tu contraseña. Caduca en {minutes} minutos.</p>",
    },
    "reset.email.account": {
        "en": "<p>This request is for the account <strong>{email}</strong>.</p>",
        "de": "<p>Diese Anfrage betrifft das Konto <strong>{email}</strong>.</p>",
        "fr": "<p>Cette demande concerne le compte <strong>{email}</strong>.</p>",
        "es": "<p>Esta solicitud es para la cuenta <strong>{email}</strong>.</p>",
    },
    "reset.email.ignore": {
        "en": "<p>If you did not request this, you can safely ignore this email.</p>",
        "de": "<p>Wenn du das nicht angefordert hast, kannst du diese E-Mail einfach ignorieren.</p>",
        "fr": "<p>Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail.</p>",
        "es": "<p>Si no has solicitado esto, puedes ignorar este correo sin problema.</p>",
    },
    "invite.email.subject": {
        "en": "{owner} invites you to work together on HivePulse",
        "de": "{owner} lädt dich ein, gemeinsam in HivePulse zu arbeiten",
        "fr": "{owner} vous invite à travailler ensemble sur HivePulse",
        "es": "{owner} te invita a trabajar juntos en HivePulse",
    },
    "invite.email.intro": {
        "en": "<p><b>{owner}</b> would like to work with you on <b>{target}</b> in HivePulse.</p>",
        "de": "<p><b>{owner}</b> möchte mit dir gemeinsam an <b>{target}</b> in HivePulse arbeiten.</p>",
        "fr": "<p><b>{owner}</b> aimerait travailler avec vous sur <b>{target}</b> dans HivePulse.</p>",
        "es": "<p><b>{owner}</b> quiere trabajar contigo en <b>{target}</b> en HivePulse.</p>",
    },
    "invite.email.cta": {
        "en": "<p><a href='{url}'>Accept the invitation</a></p>",
        "de": "<p><a href='{url}'>Einladung annehmen</a></p>",
        "fr": "<p><a href='{url}'>Accepter l'invitation</a></p>",
        "es": "<p><a href='{url}'>Aceptar la invitación</a></p>",
    },
    "invite.email.ignore": {
        "en": "<p>If you do not know {owner}, you can ignore this email. Nothing happens until you accept.</p>",
        "de": "<p>Wenn du {owner} nicht kennst, kannst du diese E-Mail ignorieren. Es passiert nichts, solange du nicht zusagst.</p>",
        "fr": "<p>Si vous ne connaissez pas {owner}, ignorez cet e-mail. Rien ne se passe tant que vous n'acceptez pas.</p>",
        "es": "<p>Si no conoces a {owner}, puedes ignorar este correo. No pasa nada hasta que aceptes.</p>",
    }
}


def normalize(locale: Optional[str]) -> str:
    """Map a stored locale or Accept-Language tag onto a supported language."""
    if not locale:
        return DEFAULT
    tag = locale.strip().split(",")[0].split(";")[0].strip()[:2].lower()
    return tag if tag in SUPPORTED else DEFAULT


def render(key: str, locale: Optional[str] = None, **params) -> str:
    """Render one template in the given language, falling back to English."""
    variants = TEMPLATES[key]
    text = variants.get(normalize(locale)) or variants[DEFAULT]
    return text.format(**params) if params else text


def hive_count(count: int, locale: Optional[str] = None) -> str:
    """"3 hives" / "1 Volk" — the noun phrase the reminder templates embed."""
    key = "hives.one" if count == 1 else "hives.other"
    return render(key, locale, count=count)


def reminder_push(count: int, locale: Optional[str] = None) -> tuple[str, str]:
    return (
        render("reminder.push.title", locale),
        render("reminder.push.body", locale, hives=hive_count(count, locale)),
    )


def reminder_email(count: int, app_url: str, locale: Optional[str] = None) -> tuple[str, str]:
    body = (
        render("reminder.email.body", locale, hives=hive_count(count, locale))
        + render("reminder.email.cta", locale, url=f"{app_url}/dashboard")
        + render("reminder.email.optout", locale)
    )
    return render("reminder.email.subject", locale), body


def reset_email(reset_url: str, minutes: int, locale: Optional[str] = None,
                account: Optional[str] = None) -> tuple[str, str]:
    """The mail has to say which account it is for.

    Without it the reader cannot tell whether it concerns them. Three of these arrived at
    once and the only honest answer to "what is this" was "the mail does not say".
    """
    body = render("reset.email.intro", locale, minutes=minutes)
    if account:
        # Goes into HTML; an address is validated on the way in, but escaping is not optional.
        body += render("reset.email.account", locale, email=html.escape(account))
    body += (
        f"<p><a href='{reset_url}'>{reset_url}</a></p>"
        + render("reset.email.ignore", locale)
    )
    return render("reset.email.subject", locale), body


def invitation_email(owner: str, target: str, url: str, locale: Optional[str] = None) -> tuple[str, str]:
    """The mail that invites somebody to work on an apiary or a hive.

    The names are chosen by users and go into HTML, so they are escaped. The link carries the
    one-time token and is the only way an address without an account can take the invitation.
    """
    owner_html = html.escape(owner)
    target_html = html.escape(target)
    body = (
        render("invite.email.intro", locale, owner=owner_html, target=target_html)
        + render("invite.email.cta", locale, url=url)
        + render("invite.email.ignore", locale, owner=owner_html)
    )
    return render("invite.email.subject", locale, owner=owner), body
