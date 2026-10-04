"""The accounts the store screenshots are taken from.

These exist because the demo account cannot be photographed: the staging E2E suite signs in
as demo and leaves its apiaries behind, so the list reads "e2e-apiary-1790951543272" seven
times over. A listing shot of that would cost more installs than no screenshot at all.

What matters here is not that rows are written but that they are the *right* rows: in the
reader's language, not on the public map, and showing a colony somebody would want to keep.
"""
import importlib
import os
import sys
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from app.models import Apiary, Base, Hive, Inspection, QrBatch, User  # noqa: E402


@pytest.fixture(scope="module")
def seeded(tmp_path_factory):
    """Run the screenshot part of the seed against a throwaway database."""
    database = tmp_path_factory.mktemp("seed") / "seed.db"
    os.environ["DATABASE_URL"] = f"sqlite:///{database}"

    seed = importlib.import_module("scripts.seed_staging")
    importlib.reload(seed)  # pick up the DATABASE_URL above

    engine = create_engine(f"sqlite:///{database}")
    Base.metadata.create_all(engine)

    with Session(engine) as db:
        for language in seed.SCREENSHOT_ACCOUNTS:
            seed.seed_screenshot_account(db, language)
        db.commit()

    with Session(engine) as db:
        yield seed, db


def test_every_store_language_has_its_own_account(seeded):
    seed, db = seeded
    for language in ("de", "en", "fr", "es"):
        user = db.query(User).filter_by(email=f"screenshots-{language}@apiscan.app").one()
        assert user.is_supporter, "supporter screens are part of the listing"


def test_the_apiaries_are_named_in_the_language_of_the_listing(seeded):
    seed, db = seeded
    german = db.query(User).filter_by(email="screenshots-de@apiscan.app").one()
    spanish = db.query(User).filter_by(email="screenshots-es@apiscan.app").one()

    assert {a.name for a in db.query(Apiary).filter_by(user_id=german.id)} == {
        "Hausgarten", "Streuobstwiese", "Waldrand"
    }
    # A German apiary name in the Spanish listing is the same mistake as an English interface.
    assert {a.name for a in db.query(Apiary).filter_by(user_id=spanish.id)} == {
        "Huerto", "Olivar viejo", "Linde del bosque"
    }


def test_the_hives_are_named_in_that_language_too(seeded):
    seed, db = seeded
    french = db.query(User).filter_by(email="screenshots-fr@apiscan.app").one()
    names = {h.name for h in db.query(Hive).filter_by(user_id=french.id)}
    assert names, "the French account has no hives"
    assert all(name.startswith("Ruche ") for name in names), names


def test_the_props_stay_off_the_community_map(seeded):
    seed, db = seeded
    for language in seed.SCREENSHOT_ACCOUNTS:
        user = db.query(User).filter_by(email=f"screenshots-{language}@apiscan.app").one()
        for apiary in db.query(Apiary).filter_by(user_id=user.id):
            # These colonies are props. Counting them would move the public map, the heatmap
            # and the member statistics that real beekeepers are shown.
            assert apiary.is_public is False, f"{apiary.name} would appear on the public map"


def test_the_most_recent_visit_shows_a_colony_worth_keeping(seeded):
    seed, db = seeded
    german = db.query(User).filter_by(email="screenshots-de@apiscan.app").one()
    hive = db.query(Hive).filter_by(user_id=german.id).first()

    visits = (
        db.query(Inspection)
        .filter_by(hive_id=hive.id)
        .order_by(Inspection.date.desc())
        .all()
    )
    assert len(visits) == len(seed.SCREENSHOT_VISITS)

    newest = visits[0]
    # The demo data showed six "aggressive, high varroa" rows in a row, which reads as a
    # warning rather than an advertisement.
    assert newest.mood == "calm"
    assert newest.varroa_count <= 2
    assert newest.brood_frames >= 6
    assert newest.notes, "the top row is the one a reader actually reads"


def test_the_visits_are_the_same_every_run(seeded):
    seed, db = seeded
    german = db.query(User).filter_by(email="screenshots-de@apiscan.app").one()
    hives = db.query(Hive).filter_by(user_id=german.id).all()

    series = []
    for hive in hives:
        visits = (
            db.query(Inspection)
            .filter_by(hive_id=hive.id)
            .order_by(Inspection.date.desc())
            .all()
        )
        series.append([(v.mood, v.varroa_count, v.brood_frames) for v in visits])

    # Random data would mean every capture quietly changes the listing.
    expected = [(m, v, b) for _, b, _, v, m, _ in seed.SCREENSHOT_VISITS]
    for one_hive in series:
        assert one_hive == expected


def test_there_is_a_qr_batch_worth_photographing(seeded):
    seed, db = seeded
    for language in seed.SCREENSHOT_ACCOUNTS:
        user = db.query(User).filter_by(email=f"screenshots-{language}@apiscan.app").one()
        # Each hive brings a batch of one; a screen full of ones shows nothing.
        assert db.query(QrBatch).filter_by(user_id=user.id, count=12).count() == 1


def test_running_it_twice_changes_nothing(seeded):
    seed, db = seeded
    german = db.query(User).filter_by(email="screenshots-de@apiscan.app").one()
    before = (
        db.query(Apiary).filter_by(user_id=german.id).count(),
        db.query(Hive).filter_by(user_id=german.id).count(),
        db.query(Inspection).count(),
        db.query(QrBatch).filter_by(user_id=german.id).count(),
    )

    seed.seed_screenshot_account(db, "de")
    db.commit()

    after = (
        db.query(Apiary).filter_by(user_id=german.id).count(),
        db.query(Hive).filter_by(user_id=german.id).count(),
        db.query(Inspection).count(),
        db.query(QrBatch).filter_by(user_id=german.id).count(),
    )
    # Seeding runs on every staging refresh; a second run must not double the data.
    assert before == after


def test_the_capture_workflow_signs_in_with_the_password_the_seed_sets():
    """Drift between these two is invisible until four emulator runs fail at once.

    It happened: the workflow pointed at STAGING_DEMO_PASSWORD, the seed wrote its own
    literal, and every language failed with "login failed" while the accounts were fine.
    """
    import yaml

    seed = importlib.import_module("scripts.seed_staging")
    workflow = yaml.safe_load(
        (BACKEND.parent / ".github/workflows/android-store-screenshots.yml").read_text(
            encoding="utf-8"
        )
    )

    # Read the parsed value, not the file text: the first attempt at this test matched the
    # comment that explains why STAGING_DEMO_PASSWORD is not used.
    capture = next(
        step for step in workflow["jobs"]["capture"]["steps"]
        if step.get("name") == "Capture"
    )
    environment = capture["env"]

    assert environment["DEMO_PASSWORD"] == seed.SCREENSHOT_PASSWORD, (
        f"the workflow signs in with {environment['DEMO_PASSWORD']!r} but the seed writes "
        f"{seed.SCREENSHOT_PASSWORD!r}"
    )
    assert "screenshots-" in environment["DEMO_EMAIL"], (
        "the capture must use the screenshot accounts, not the demo account the E2E suite "
        "fills with its leftovers"
    )
