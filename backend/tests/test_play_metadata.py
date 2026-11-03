"""The Play listing — texts, screenshots, icon and feature graphic — is uploaded from the repository.

The bundle and the release notes were automated long before the listing itself was: the title,
the descriptions and the pictures were still typed and dragged into the console, in five
languages, which is where a Polish listing full of English text comes from. These tests read the
real listing document and the real workflow, so a breaking edit fails here and not in the console.
"""
import importlib.util
from pathlib import Path

import pytest
import yaml

ROOT = Path(__file__).resolve().parents[2]
BUILDER = ROOT / "scripts" / "build_play_metadata.py"
UPLOADER = ROOT / "scripts" / "upload_play_metadata.py"
LISTING = ROOT / "docs" / "store-listing.md"
WORKFLOW = ROOT / ".github" / "workflows" / "play-metadata.yml"

LOCALES = ("en-US", "de-DE", "fr-FR", "es-ES", "pl-PL")


def _load(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


builder = _load(BUILDER, "build_play_metadata")
uploader = _load(UPLOADER, "upload_play_metadata")


@pytest.fixture(scope="module")
def listing():
    return builder.read_listing(LISTING.read_text(encoding="utf-8"))


# ── The texts ────────────────────────────────────────────────────────────────────────────────

def test_every_store_language_has_every_text(listing):
    assert set(listing) == set(LOCALES)
    for locale, values in listing.items():
        for name in ("title", "short_description", "full_description"):
            assert values.get(name), f"{locale} has no {name}"


def test_no_text_is_over_plays_limit(listing):
    for locale, values in listing.items():
        for name, limit in builder.LIMITS.items():
            assert len(values[name]) <= limit, f"{locale}: {name} is {len(values[name])}"


def test_the_short_description_is_not_the_full_one(listing):
    # Both live under "Google Play" and both are fenced blocks; picking the wrong section would
    # put 2000 characters into an 80-character field and fail only at the console.
    for locale, values in listing.items():
        assert len(values["short_description"]) < len(values["full_description"]), locale


def test_polish_is_really_polish(listing):
    # The listing is the one place these texts exist, so a copied English block would ship.
    assert listing["pl-PL"]["short_description"] != listing["en-US"]["short_description"]
    assert listing["pl-PL"]["full_description"] != listing["en-US"]["full_description"]


def test_an_over_long_text_stops_the_build_with_the_language_named():
    text = LISTING.read_text(encoding="utf-8").replace(
        "| de | `HivePulse — Imker-Journal` | 25 |",
        "| de | `" + "x" * 31 + "` | 31 |")
    with pytest.raises(builder.ListingError) as failure:
        builder.read_listing(text)
    assert "de: title is 31 characters" in str(failure.value)


def test_a_missing_language_is_reported_not_skipped():
    text = LISTING.read_text(encoding="utf-8").replace(
        "| pl | `HivePulse — Dziennik pasieki` | 28 |", "")
    with pytest.raises(builder.ListingError) as failure:
        builder.read_listing(text)
    assert "pl: no title" in str(failure.value)


def test_the_files_are_written_where_the_uploader_looks(tmp_path, listing):
    builder.write(tmp_path, listing)

    for locale in LOCALES:
        assert (tmp_path / locale / "title.txt").exists()
    read_back = uploader.read_metadata(tmp_path)
    assert read_back["pl-PL"]["title"] == listing["pl-PL"]["title"]
    assert read_back["en-US"]["full_description"] == listing["en-US"]["full_description"]


# ── The upload ───────────────────────────────────────────────────────────────────────────────

def test_a_half_written_folder_is_refused_before_anything_is_sent(tmp_path, listing):
    builder.write(tmp_path, listing)
    (tmp_path / "de-DE" / "short_description.txt").unlink()

    with pytest.raises(uploader.UploadError) as failure:
        uploader.read_metadata(tmp_path)
    assert "de-DE" in str(failure.value) and "short_description" in str(failure.value)


def test_screenshots_are_sent_in_file_name_order(tmp_path):
    folder = tmp_path / "de-DE"
    folder.mkdir(parents=True)
    for name in ("3-form.png", "1-apiaries.png", "2-hive.png"):
        (folder / name).write_bytes(b"x")

    order = [p.name for p in uploader.screenshots_for(tmp_path, "de-DE")]
    # Play shows them in upload order, so the numbers in the file names have to decide it.
    assert order == ["1-apiaries.png", "2-hive.png", "3-form.png"]


def test_more_screenshots_than_play_accepts_are_refused(tmp_path):
    folder = tmp_path / "en-US"
    folder.mkdir(parents=True)
    for index in range(uploader.MAX_SCREENSHOTS + 1):
        (folder / f"{index}.png").write_bytes(b"x")

    with pytest.raises(uploader.UploadError) as failure:
        uploader.screenshots_for(tmp_path, "en-US")
    assert "at most 8" in str(failure.value)


def test_a_language_without_screenshots_is_named(tmp_path):
    (tmp_path / "en-US").mkdir(parents=True)
    (tmp_path / "en-US" / "1.png").write_bytes(b"x")

    with pytest.raises(uploader.UploadError) as failure:
        uploader.screenshots_for(tmp_path, "pl-PL")
    assert "pl-PL" in str(failure.value)


def test_no_screenshot_folder_means_leave_them_alone(tmp_path):
    # Texts can be corrected without having to retake every picture.
    assert uploader.screenshots_for(None, "de-DE") == []


def test_a_truncated_service_account_is_caught_before_the_upload():
    with pytest.raises(uploader.UploadError):
        uploader.service_account('{"type": "service_account"')
    with pytest.raises(uploader.UploadError) as failure:
        uploader.service_account('{"type": "service_account"}')
    assert "client_email" in str(failure.value)


def test_the_graphics_it_uploads_exist_in_the_repository():
    # Play refuses a listing without them, and they are generated, not hand-made.
    for image_type, path in uploader.GRAPHICS.items():
        assert path.exists(), f"{image_type}: {path} is missing"


# ── The workflow ─────────────────────────────────────────────────────────────────────────────

def test_the_workflow_fetches_the_screenshots_of_every_language():
    text = WORKFLOW.read_text(encoding="utf-8")
    for lang, locale in {"en": "en-US", "de": "de-DE", "fr": "fr-FR", "es": "es-ES",
                         "pl": "pl-PL"}.items():
        assert f"[{lang}]={locale}" in text, lang
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
    assert "-f name=play-screenshots-en" in text
    assert "select(.expired == false)" in text
    assert "--workflow '" not in text, "back to resolving by workflow name"


def test_a_typed_run_id_is_checked_before_anything_is_downloaded():
    """A pasted number used to be taken on faith: the wrong one failed four artifact downloads
    later. It is checked for the thing that actually matters — that the run still holds the
    pictures — rather than for its workflow's name."""
    text = WORKFLOW.read_text(encoding="utf-8")

    check = text.index('actions/runs/$RUN/artifacts')
    assert 'select(.name == "play-screenshots-en" and .expired == false)' in text
    assert check < text.index("Fetch the screenshots")


def test_the_workflow_creates_build_before_tee_writes_into_it():
    text = WORKFLOW.read_text(encoding="utf-8")
    assert text.index("mkdir -p build\n") < text.index("tee build/summary.txt")


def test_the_workflow_defaults_to_a_dry_run():
    # Sending a listing is not something a mis-click should do.
    text = WORKFLOW.read_text(encoding="utf-8")
    start = text.index("dry_run:")
    assert "default: true" in text[start:start + 200]


def test_the_workflow_installs_the_play_client_before_uploading():
    text = WORKFLOW.read_text(encoding="utf-8")
    assert text.index("google-api-python-client") < text.index("Send to Play")


def test_the_workflow_checks_the_secret_before_it_uploads():
    text = WORKFLOW.read_text(encoding="utf-8")
    assert text.index("PLAY_SERVICE_ACCOUNT_JSON is not set") < text.index("Send to Play")
