"""The App Store texts are uploaded from docs/store-listing.md.

An over-long text is only rejected by App Store Connect once the upload is under way, and a
missing language silently leaves that listing empty. These tests read the real listing, so an
edit to the document that breaks either fails here, in CI, and not in the console.
"""
import importlib.util
from pathlib import Path

import pytest
import yaml

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "build_appstore_metadata.py"
LISTING = ROOT / "docs" / "store-listing.md"

_spec = importlib.util.spec_from_file_location("build_appstore_metadata", SCRIPT)
builder = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(builder)


@pytest.fixture(scope="module")
def listing():
    return builder.read_listing(LISTING.read_text(encoding="utf-8"), release_notes=True)


def test_every_store_language_has_every_text(listing):
    assert set(listing) == {"en-US", "de-DE", "fr-FR", "es-ES", "pl"}
    wanted = {"name", "subtitle", "description", "keywords", "promotional_text",
              "release_notes", "support_url", "marketing_url", "privacy_url"}
    for folder, values in listing.items():
        assert set(values) == wanted, folder
        assert all(value.strip() for value in values.values()), folder


def test_no_text_is_over_apples_limit(listing):
    for folder, values in listing.items():
        for name, limit in builder.LIMITS.items():
            assert len(values[name]) <= limit, f"{folder} {name}"


def test_the_description_is_the_play_description_not_the_short_one(listing):
    # Both stores have a short text; reading the wrong block would publish one line as the
    # whole description.
    for values in listing.values():
        assert len(values["description"]) > 500


def test_the_urls_come_from_the_field_table(listing):
    values = listing["de-DE"]
    assert values["privacy_url"] == "https://hivepulse.multihead.de/privacy"
    assert values["support_url"].startswith("https://hivepulse.multihead.de")
    assert values["marketing_url"] == "https://hivepulse.multihead.de"


def test_the_files_are_written_where_deliver_looks(tmp_path, listing):
    builder.write(tmp_path, listing)

    metadata = tmp_path / "metadata"
    assert (metadata / "de-DE" / "subtitle.txt").read_text(encoding="utf-8").strip() \
        == listing["de-DE"]["subtitle"]
    assert (metadata / "primary_category.txt").read_text().strip() == "UTILITIES"
    assert (metadata / "secondary_category.txt").read_text().strip() == "EDUCATION"


def test_release_notes_are_left_out_unless_asked_for(tmp_path):
    # Apple refuses "What's New" on the first version, so the default must not send it.
    plain = builder.read_listing(LISTING.read_text(encoding="utf-8"))
    builder.write(tmp_path, plain)

    assert not (tmp_path / "metadata" / "en-US" / "release_notes.txt").exists()


def test_an_over_long_text_stops_the_build_with_the_language_named():
    text = LISTING.read_text(encoding="utf-8")
    too_long = text.replace("`Hive inspections, offline`", "`" + "x" * 31 + "`")

    with pytest.raises(builder.ListingError) as failure:
        builder.read_listing(too_long)

    assert "en: subtitle is 31 characters" in str(failure.value)


def test_a_missing_language_is_reported_not_skipped():
    text = LISTING.read_text(encoding="utf-8")
    without_spanish = text.replace("| es | `Revisiones, también sin red` | 27 |\n", "")

    with pytest.raises(builder.ListingError) as failure:
        builder.read_listing(without_spanish)

    assert "es: no subtitle" in str(failure.value)


def test_spaces_after_keyword_commas_are_caught():
    text = LISTING.read_text(encoding="utf-8")
    spaced = text.replace("beekeeping,beehive,apiary", "beekeeping, beehive,apiary", 1)

    with pytest.raises(builder.ListingError) as failure:
        builder.read_listing(spaced)

    assert "space after a comma" in str(failure.value)


WORKFLOW = ROOT / ".github" / "workflows" / "app-store-metadata.yml"


def test_the_workflow_fetches_the_screenshots_of_every_language():
    # The loop and the folder map once stopped at four languages, so Polish got its texts and no pictures.
    text = WORKFLOW.read_text(encoding="utf-8")
    for lang, folder in {"en": "en-US", "de": "de-DE", "fr": "fr-FR", "es": "es-ES", "pl": "pl"}.items():
        assert f"[{lang}]={folder}" in text, lang
    assert "for lang in en de fr es pl; do" in text


def test_the_pictures_are_chosen_from_a_dropdown_not_a_magic_word():
    """"latest" and "leave them alone" used to be a word, or nothing, typed into a free-text box:
    the two normal choices were the two easiest to get wrong, and an empty field silently meant
    "change the texts only" rather than "I forgot". GitHub cannot list run IDs in a choice, so the
    ID keeps its own field."""
    spec = yaml.safe_load(WORKFLOW.read_text(encoding="utf-8"))
    picker = spec[True]["workflow_dispatch"]["inputs"]["screenshots"]

    assert picker["type"] == "choice"
    assert picker["options"] == ["latest", "keep", "run_id"]
    assert picker["default"] == "latest"

    names = [step.get("name") for step in list(spec["jobs"].values())[0]["steps"]]
    assert names.index("Decide which pictures to send") < names.index("Fetch the screenshots")


def test_every_dropdown_choice_is_handled_and_each_leaves_the_run_set():
    text = WORKFLOW.read_text(encoding="utf-8")
    for choice in ("keep)", "latest)", "run_id)"):
        assert choice in text, choice
    # Every branch has to leave SHOTS_RUN set, because the steps after it are gated on it.
    assert text.count('echo "SHOTS_RUN=$RUN" >> "$GITHUB_ENV"') == 1


def test_latest_looks_for_the_artefact_not_for_a_workflow_name():
    """The screenshot workflow normally runs as a workflow_call from "Update help page
    screenshots", and a called workflow gets no run entry of its own. Asking
    `gh run list --workflow` therefore only ever found the last run somebody dispatched by hand:
    on 2026-11-03 it sent a month-old set to the store while a fresh one sat in the run from the
    same morning. The run that holds the pictures is the one worth finding."""
    text = WORKFLOW.read_text(encoding="utf-8")

    assert "actions/artifacts" in text
    assert "-f name=app-store-screenshots-en" in text
    assert "select(.expired == false)" in text
    assert "--workflow '" not in text, "back to resolving by workflow name"


def test_a_typed_run_id_is_checked_before_anything_is_downloaded():
    """A pasted number used to be taken on faith: the wrong one failed four artifact downloads
    later. It is checked for the thing that actually matters — that the run still holds the
    pictures — rather than for its workflow's name."""
    text = WORKFLOW.read_text(encoding="utf-8")

    check = text.index('actions/runs/$RUN/artifacts')
    assert 'select(.name == "app-store-screenshots-en" and .expired == false)' in text
    assert check < text.index("Fetch the screenshots")


def test_the_workflow_creates_build_before_tee_writes_into_it():
    text = WORKFLOW.read_text(encoding="utf-8")
    assert text.index("mkdir -p build\n") < text.index("tee build/summary.txt")


def test_the_workflow_gives_deliver_a_deliverfile_so_it_does_not_ask_to_set_up():
    text = WORKFLOW.read_text(encoding="utf-8")
    assert text.index("touch Deliverfile") < text.index("fastlane deliver \\")
