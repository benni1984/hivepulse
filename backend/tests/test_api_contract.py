"""`docs/api-contract.md` is the source of truth, so something has to hold it to that.

It is described everywhere in this repository as the contract all three clients follow, and the
rule is that it is updated *before* an endpoint is written. Nothing checked that it stayed true
afterwards — and it had not: the `locale` enum still read `en, fr, de, es` months after Polish
shipped, in the one document a client author is told to trust.

This file does not try to verify the whole document against the code; most of it is prose, and a
test that demanded otherwise would be abandoned within a month. It pins the parts that are
machine-checkable and that go quietly wrong: the table of contents against the sections, and the
enums against the models they describe.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONTRACT = ROOT / "docs" / "api-contract.md"


def _text() -> str:
    return CONTRACT.read_text(encoding="utf-8")


def _sections() -> list[str]:
    """Top-level headings, minus the table of contents itself."""
    found = re.findall(r"^## (.+)$", _text(), re.M)
    return [s.strip() for s in found if s.strip() != "Table of Contents"]


def _toc() -> list[str]:
    body = _text().split("## Table of Contents", 1)[1].split("\n---", 1)[0]
    return [m.group(1).strip() for m in re.finditer(r"^\d+\.\s+\[([^\]]+)\]", body, re.M)]


def _enum(name: str) -> set[str]:
    """The values of one row of the Enums table, e.g. `locale`."""
    row = re.search(rf"^\|\s*`{re.escape(name)}`\s*\|(.+?)\|\s*$", _text(), re.M)
    assert row, f"the contract has no `{name}` enum"
    return {v.strip().strip("`") for v in row.group(1).split(",") if v.strip()}


def test_the_table_of_contents_lists_every_section_and_nothing_else():
    """A heading with no entry is a section nobody finds; an entry with no heading is a dead link
    in the document people are told to read first."""
    assert _toc() == _sections()


def test_the_locale_enum_matches_the_one_the_database_enforces():
    """The case that prompted this file. A client author reading the contract would have built a
    language picker without Polish, and nothing would have told them otherwise."""
    from app.models import User

    assert _enum("locale") == set(User.__table__.c.locale.type.enums)


def test_the_subscription_enums_are_documented():
    """Written in the contract before the code exists (#17), which is the order the house rule
    asks for. Phase 1 pins them against the model the same way `locale` is pinned above."""
    assert _enum("subscription_source") == {"apple", "google", "web", "manual"}
    assert _enum("subscription_status") == {
        "none", "active", "grace", "expired", "refunded", "revoked",
    }


def test_every_error_code_the_contract_lists_has_an_http_status():
    """The error table is what a client switches on. A row without a status is a code nobody can
    handle."""
    table = _text().split("## Error Codes", 1)[1]
    rows = re.findall(r"^\|\s*`([A-Z_]+)`\s*\|\s*([^|]+)\|", table, re.M)

    assert rows, "the error code table is empty or no longer a table"
    for code, status in rows:
        assert status.strip().isdigit(), f"{code} has no HTTP status ({status.strip()!r})"
