"""The photographs of the beekeeping year: one source, three clients, no drift.

`scripts/fetch_year_photos.py` writes four files from one set of records -- the website's
`lib/yearPhotos.ts`, Android's `YearPhotos.kt`, the iPhone's `YearPhotos.swift` and the
credits page. Most of the pictures are CC BY or CC BY-SA, which oblige us to name the
author wherever the picture is shown, so a credit that drifts between clients is a licence
breach and not a cosmetic gap.

These tests check what the generator cannot check about itself: that the three manifests
still agree, that every file they name is really on disk for that platform, and that no
platform carries a picture nobody credits.

They live here rather than in a client suite because they are the only tests that see all
three platforms at once.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]

WEB_MANIFEST = ROOT / "lib" / "yearPhotos.ts"
ANDROID_MANIFEST = (ROOT / "android" / "app" / "src" / "main" / "java" / "com" / "hivepulse"
                    / "app" / "ui" / "calendar" / "YearPhotos.kt")
IOS_MANIFEST = ROOT / "ios" / "HivePulse" / "Services" / "YearPhotos.swift"
CREDITS = ROOT / "docs" / "photo-credits.md"

WEB_PHOTOS = ROOT / "public" / "year"
ANDROID_PHOTOS = ROOT / "android" / "app" / "src" / "main" / "assets" / "year"
IOS_PHOTOS = ROOT / "ios" / "HivePulse" / "Resources" / "Year"

# Everything the generator will accept. A picture under anything else may not be shipped at
# all, so this is the one assertion that is about law and not about tidiness.
ALLOWED = re.compile(r"^(cc0|cc[ -]by([ -]sa)?([ -][0-9.]+.*)?|public domain|pd[- ])", re.I)

# The eight forages, each of which must have the picture of its plant: a forage is drawn as
# one bar named after the plant, and without it the bar would show a honey extractor, which
# looks the same in every month of the year.
FORAGES = ("rapeseed", "acacia", "chestnut", "linden", "fir", "lavender", "sunflower", "heather")


@pytest.fixture(scope="module")
def records() -> dict[str, dict]:
    """The generator's own data, which every manifest is written from."""
    text = WEB_MANIFEST.read_text(encoding="utf-8")
    stored = re.search(r"/\* data: (.*?) \*/", text, re.S)
    assert stored, "lib/yearPhotos.ts has no data comment -- regenerate it"
    return json.loads(stored.group(1))


def _entries(text: str, pattern: str) -> dict[str, dict[str, str]]:
    """Every field of every entry of a generated manifest, by entry key."""
    found: dict[str, dict[str, str]] = {}
    for block in re.finditer(pattern, text, re.S):
        key = block.group("key")
        body = block.group("body")
        found[key] = {
            field: match.group(1)
            for field in ("author", "licence", "licenceUrl", "source")
            for match in [re.search(rf'{field}\s*[:=]\s*"(.*?)"', body, re.S)]
            if match
        }
    return found


@pytest.fixture(scope="module")
def android() -> dict[str, dict[str, str]]:
    return _entries(
        ANDROID_MANIFEST.read_text(encoding="utf-8"),
        r'"(?P<key>[a-z0-9-]+)" to YearPhoto\((?P<body>.*?)\n        \),',
    )


@pytest.fixture(scope="module")
def ios() -> dict[str, dict[str, str]]:
    return _entries(
        IOS_MANIFEST.read_text(encoding="utf-8"),
        r'"(?P<key>[a-z0-9-]+)": YearPhoto\((?P<body>.*?)\n        \),',
    )


def test_all_three_manifests_carry_the_same_pictures(records, android, ios):
    assert set(android) == set(records), "Android's manifest is out of step with the website's"
    assert set(ios) == set(records), "the iPhone's manifest is out of step with the website's"


@pytest.mark.parametrize("field", ["author", "licence", "licenceUrl", "source"])
def test_the_credit_is_the_same_on_every_client(records, android, ios, field):
    # The licences oblige us to name the author wherever the picture is shown. Three
    # hand-kept copies would drift; this is what makes the generator the only way in.
    for key, record in records.items():
        assert android[key][field] == record[field], f"android {key}.{field}"
        assert ios[key][field] == record[field], f"ios {key}.{field}"


def test_every_licence_is_one_we_may_use(records):
    for key, record in records.items():
        assert ALLOWED.match(record["licence"]), f"{key}: {record['licence']!r} may not be shipped"


def test_a_licence_with_a_deed_links_to_it(records):
    # Public domain has no deed to link to -- there is no licence, which is the point.
    for key, record in records.items():
        if record["licence"].lower().startswith(("public domain", "pd")):
            assert record["licenceUrl"] == "", f"{key} is public domain and needs no deed"
        else:
            assert record["licenceUrl"].startswith("http"), f"{key} has no licence link"


def test_every_picture_names_an_author_and_its_source(records):
    for key, record in records.items():
        assert record["author"].strip(), f"{key} has no author"
        assert record["source"].startswith("https://commons.wikimedia.org/"), f"{key} has no source page"


def test_every_file_the_web_manifest_names_is_on_disk(records):
    for key in records:
        assert (WEB_PHOTOS / f"{key}.webp").is_file(), f"public/year/{key}.webp is missing"
        assert (WEB_PHOTOS / "thumbs" / f"{key}.webp").is_file(), f"public/year/thumbs/{key}.webp is missing"


def test_every_file_the_apps_need_is_in_the_apps(records):
    # A manifest naming a file the app does not carry ships a blank space where a picture
    # should be, and neither a build nor a lint run notices.
    for key in records:
        assert (ANDROID_PHOTOS / f"{key}.webp").is_file(), f"android asset {key}.webp is missing"
        assert (ANDROID_PHOTOS / "thumbs" / f"{key}.webp").is_file(), f"android thumb {key}.webp is missing"
        # XcodeGen flattens a resource folder into the bundle, so Year/x.webp and
        # Year/thumbs/x.webp would collide on their basename. The iPhone files are flat and
        # carry the size in the name instead.
        assert (IOS_PHOTOS / f"year-{key}.webp").is_file(), f"ios resource year-{key}.webp is missing"
        assert (IOS_PHOTOS / f"year-thumb-{key}.webp").is_file(), f"ios resource year-thumb-{key}.webp is missing"


def test_no_platform_carries_a_picture_nobody_credits(records):
    # The other direction: a file left behind after it was dropped from PICKS ships for ever
    # as dead weight, with no credit anywhere -- the licence problem in reverse.
    wanted = set(records)
    assert {p.stem for p in WEB_PHOTOS.glob("*.webp")} == wanted
    assert {p.stem for p in (WEB_PHOTOS / "thumbs").glob("*.webp")} == wanted
    assert {p.stem for p in ANDROID_PHOTOS.glob("*.webp")} == wanted
    assert {p.stem for p in (ANDROID_PHOTOS / "thumbs").glob("*.webp")} == wanted

    ios_names = {p.stem for p in IOS_PHOTOS.glob("*.webp")}
    expected = {f"year-{key}" for key in wanted} | {f"year-thumb-{key}" for key in wanted}
    assert ios_names == expected


def test_every_forage_has_the_picture_of_its_plant(records):
    for forage in FORAGES:
        assert f"migrate-{forage}" in records, f"{forage} has no plant picture"


def test_every_forage_is_wired_up_on_every_client():
    android = ANDROID_MANIFEST.read_text(encoding="utf-8")
    ios = IOS_MANIFEST.read_text(encoding="utf-8")
    web = WEB_MANIFEST.read_text(encoding="utf-8")
    for forage in FORAGES:
        assert f'"{forage}" to BY_KEY.getValue("migrate-{forage}")' in android, f"android {forage}"
        assert f'"{forage}": byKey["migrate-{forage}"]!' in ios, f"ios {forage}"
        assert f'"{forage}": YEAR_PHOTOS["migrate-{forage}"]' in web, f"web {forage}"


def test_the_credits_page_lists_every_picture(records):
    text = CREDITS.read_text(encoding="utf-8")
    for key, record in records.items():
        assert record["author"] in text, f"{key}: {record['author']} is not on the credits page"
        assert record["source"] in text, f"{key}: its Commons page is not linked"


def test_the_generated_files_say_they_are_generated():
    # Somebody will eventually fix a typo in one of these by hand, and that is how a credit
    # starts drifting. All three say where to go instead.
    for path in (WEB_MANIFEST, ANDROID_MANIFEST, IOS_MANIFEST):
        head = path.read_text(encoding="utf-8")[:600]
        assert "scripts/fetch_year_photos.py" in head, f"{path.name} does not name its generator"
        assert "do not edit by hand" in head, f"{path.name} does not warn against hand edits"
