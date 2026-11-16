"""Turn a pydantic validation error into one sentence a beekeeper can act on.

FastAPI answers a rejected body with pydantic's own report, and pydantic writes for the
developer: ``"Input should be less than or equal to 10"``. The web client passes that straight
through -- ``lib/api.ts`` joins every item's ``msg`` into the text it shows -- so somebody who
typed 12 into the brood-frame field read an English sentence about input, whatever language the
rest of the app was in. Five languages everywhere, except at the one place a user is most likely
to end up (#446).

This module rewrites each item's ``msg`` into a finished sentence in the ``Accept-Language``
language, naming the field the way the screen names it, and leaves the rest of the item exactly
as pydantic built it. That matters: the clients already read this shape, so nothing has to change
for the message to become readable, and a client that wants to highlight the offending input
still reads ``loc``, while one that wants its own wording still reads ``type`` and ``ctx``.

The sentences and the field names live in ``app/i18n.py`` on purpose. ``MESSAGES`` is already
guarded for all five languages by ``test_i18n_completeness.py``, which is parametrised over
whatever is in it, and by ``scripts/check_i18n.py`` for placeholder parity. A second dictionary in
a new module would have needed its own guard, and the one that is missing is the one that rots.
"""
import re
from typing import Any, Optional

from fastapi import Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.i18n import MESSAGES, get_message

# A pydantic error type, the message code that says it in words, and the key in pydantic's `ctx`
# that holds the limit it was measured against.
#
# Both `less_than` and `less_than_equal` map to the same sentence. The off-by-one is real but
# saying "at most 9" for `lt=10` is more useful to somebody filling in a form than explaining the
# difference, and no field in this app uses an exclusive bound anyway.
# email-validator's wording, which pydantic puts in `msg` for a failed EmailStr. Matched on the
# phrase rather than the whole sentence, because the part after the colon varies with the reason.
EMAIL_FAILURE = re.compile(r"not a valid email address", re.I)

RULES: dict[str, tuple[str, Optional[str]]] = {
    "less_than_equal": ("VALIDATION_TOO_LARGE", "le"),
    "less_than": ("VALIDATION_TOO_LARGE", "lt"),
    "greater_than_equal": ("VALIDATION_TOO_SMALL", "ge"),
    "greater_than": ("VALIDATION_TOO_SMALL", "gt"),
    "string_too_long": ("VALIDATION_TOO_LONG", "max_length"),
    "string_too_short": ("VALIDATION_TOO_SHORT", "min_length"),
    "too_long": ("VALIDATION_TOO_LONG", "max_length"),
    "too_short": ("VALIDATION_TOO_SHORT", "min_length"),
    "missing": ("VALIDATION_REQUIRED", None),
    "int_parsing": ("VALIDATION_NOT_A_NUMBER", None),
    "int_type": ("VALIDATION_NOT_A_NUMBER", None),
    "float_parsing": ("VALIDATION_NOT_A_NUMBER", None),
    "float_type": ("VALIDATION_NOT_A_NUMBER", None),
    "decimal_parsing": ("VALIDATION_NOT_A_NUMBER", None),
    "date_parsing": ("VALIDATION_NOT_A_DATE", None),
    "date_type": ("VALIDATION_NOT_A_DATE", None),
    "date_from_datetime_parsing": ("VALIDATION_NOT_A_DATE", None),
    "string_pattern_mismatch": ("VALIDATION_NOT_ALLOWED", None),
    "enum": ("VALIDATION_NOT_ALLOWED", None),
    "literal_error": ("VALIDATION_NOT_ALLOWED", None),
}


def field_label(name: str, accept_language: Optional[str] = None) -> str:
    """What the screens call this field, in the caller's language.

    A field with no entry falls back to its own name with the underscores taken out. That is
    readable English rather than a translation, which is worse than a real label and much better
    than `varroa_count` or a sentence with a hole in it. Adding the missing key to `MESSAGES` is
    all it takes, and the parity test then demands all five languages for it.
    """
    code = "FIELD_" + name.upper()
    if code in MESSAGES:
        return get_message(code, accept_language)
    return name.replace("_", " ").capitalize()


def _field_name(location: tuple) -> Optional[str]:
    """The field a pydantic `loc` points at, or None when it points at the whole body.

    A `loc` is ("body", "brood_frames"), or ("body", "ratings", 0, "key") for something nested,
    or just ("body",) for a model-wide check. The last string in it is the field; integers are
    list positions and say nothing a user would recognise.
    """
    names = [part for part in location if isinstance(part, str) and part != "body"]
    return names[-1] if names else None


def message_for(error: dict[str, Any], accept_language: Optional[str] = None) -> Optional[str]:
    """One sentence for one pydantic error, or None to keep what pydantic wrote.

    None is deliberate rather than a fallback sentence: an error type nobody has thought about
    yet is better shown in pydantic's words, which at least describe it, than flattened into
    "This is not valid" -- the kind of message that makes a form unusable because it says nothing
    about which rule was broken.
    """
    name = _field_name(tuple(error.get("loc", ())))
    context = error.get("ctx") or {}

    # A custom validator raises the message code itself, optionally with the limit after a colon
    # (`VALIDATION_DATE_TOO_EARLY:1900-01-01`). Anything else that comes out of a validator is a
    # plain English sentence somebody wrote, and is left alone.
    if error.get("type") == "value_error":
        raised = str(context.get("error", "")).strip()
        code, _, limit = raised.partition(":")
        if code in MESSAGES:
            return _fill(code, name, limit or None, accept_language)
        # pydantic's EmailStr is the exception to leaving a value_error alone. It is the second
        # field of the sign-up form -- the first error a new user can possibly see -- and it
        # answers "value is not a valid email address: The part after the @-sign is a
        # special-use or reserved name...", in English, beginning with the word "value" (#447).
        # Its ctx carries `reason` rather than `error`, so the code above never catches it.
        if EMAIL_FAILURE.search(error.get("msg", "")):
            return _fill("VALIDATION_NOT_AN_EMAIL", name, None, accept_language)
        return None

    rule = RULES.get(error.get("type", ""))
    if rule is None:
        return None
    code, limit_key = rule
    limit = context.get(limit_key) if limit_key else None
    return _fill(code, name, limit, accept_language)


def _number(value: Any) -> Any:
    """0.0 reads as a mistake in "Weight: at least 0.0." — a bound on a float field is almost
    always a whole number, so show it as one when it is."""
    if isinstance(value, float) and value.is_integer():
        return int(value)
    return value


def _fill(code: str, name: Optional[str], limit: Any, accept_language: Optional[str]) -> str:
    template = get_message(code, accept_language)
    label = field_label(name, accept_language) if name else ""
    try:
        sentence = template.format(field=label, limit="" if limit is None else _number(limit))
    except (KeyError, IndexError):
        # A template with a placeholder nothing fills. Better a technical sentence than a 500
        # while somebody is only trying to find out what they typed wrong.
        return template
    # Without a field name the sentence starts with ": " or " is required." Capitalising what is
    # left keeps it a sentence instead of a fragment.
    return sentence.lstrip(" :").capitalize() if not label else sentence


async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Pydantic's report, with every `msg` replaced by a sentence for the user.

    Registered in `main.py`. The status stays 422 and the shape stays pydantic's, because the web
    client and Android were written against it and read it already.
    """
    accept_language = request.headers.get("accept-language")
    items = []
    for error in exc.errors():
        item = dict(error)
        sentence = message_for(item, accept_language)
        if sentence:
            item["msg"] = sentence
        items.append(item)
    # jsonable_encoder: a ctx can hold the original exception object, which json cannot serialise.
    return JSONResponse(status_code=422, content=jsonable_encoder({"detail": items}))
