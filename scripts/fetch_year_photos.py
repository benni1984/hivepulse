#!/usr/bin/env python3
"""Fetch the beekeeping-year photographs from Wikimedia Commons, with their credits.

Why a script and not just files in the repo: a photograph here carries an obligation. Almost
every one is CC BY or CC BY-SA, which costs nothing but does require the author's name, the
licence and a way back to the original. Keeping the picks in code means the credit beside a
picture cannot drift from the picture, and that anyone can check where it came from or swap
one out.

Each file is picked by hand (see PICKS); the script only resolves, crops and credits. It
rewrites `lib/yearPhotos.ts` and `docs/photo-credits.md`, so those two are generated -- edit
this list, not them.

    python scripts/fetch_year_photos.py            # all of them
    python scripts/fetch_year_photos.py swarm-control migrate-linden

Only licences that permit commercial use with attribution are accepted, and the script
refuses anything else outright rather than quietly leaving a gap: an app in a store must not
carry a picture nobody checked.
"""
from __future__ import annotations

import io
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PHOTOS = ROOT / "public" / "year"
THUMBS = PHOTOS / "thumbs"
MANIFEST = ROOT / "lib" / "yearPhotos.ts"
CREDITS = ROOT / "docs" / "photo-credits.md"

# The apps carry the pictures inside the app rather than fetching them: at the apiary there
# is usually no signal, and 1.2 MB once is cheaper than 25 requests on a hilltop.
ANDROID_PHOTOS = ROOT / "android" / "app" / "src" / "main" / "assets" / "year"
ANDROID_THUMBS = ANDROID_PHOTOS / "thumbs"
ANDROID_MANIFEST = (ROOT / "android" / "app" / "src" / "main" / "java" / "com" / "hivepulse"
                    / "app" / "ui" / "calendar" / "YearPhotos.kt")
# XcodeGen adds a resource folder flattened, so Year/x.webp and Year/thumbs/x.webp would
# collide on their basename in the bundle. The iPhone files carry the size in the name.
IOS_PHOTOS = ROOT / "ios" / "HivePulse" / "Resources" / "Year"
IOS_MANIFEST = ROOT / "ios" / "HivePulse" / "Services" / "YearPhotos.swift"

API = "https://commons.wikimedia.org/w/api.php"
UA = "HivePulse/1.0 (https://hivepulse.multihead.de; beekeeping calendar illustrations)"

# 640x427 is twice the size the tooltip draws, so it stays sharp on a retina screen, and
# small enough that thirty-odd of them are about a megabyte in total.
WIDTH, HEIGHT, QUALITY = 640, 427, 70

# The phone list shows a 52-pixel tile, thirty of them at once. Sending the whole
# photograph for that is forty times the pixels it can draw and a megabyte of somebody's
# mobile data, so the tile gets its own square copy: twice 52 for a retina screen, and
# the entire set together weighs less than two of the big ones.
THUMB, THUMB_QUALITY = 128, 66

ALLOWED = re.compile(r"^(cc0|cc[ -]by([ -]sa)?([ -][0-9.]+.*)?|public domain|pd[- ])", re.I)

# What each job looks like. A photograph of the thing itself where there is one -- a capped
# queen cell, a marked queen, a mite on a bee -- and the plant in flower for the moves, which
# is what a beekeeper is actually watching for.
PICKS: dict[str, str] = {
    # The year's flowers and flows
    "spring-bloom":        "Salix caprea and Apis mellifera TK 2022-03-19 8.jpg",
    "migrate-rapeseed":    "Rapeseed field on Ditchling Beacon 2026-05-03.jpg",
    "migrate-acacia":      "Flowers of Robinia pseudoacacia 01.jpg",
    "migrate-chestnut":    "Castanea sativa 0003.JPG",
    "migrate-linden":      "Tilia cordata flowers.jpg",
    "migrate-fir":         "Abies alba, Les Pardines, Andorra 250.jpg",
    "migrate-lavender":    "Lavender field in bloom.jpg",
    "migrate-sunflower":   "Sunflower field - panoramio (11).jpg",
    "migrate-heather":     "Calluna vulgaris (3774879800).jpg",
    "ivy-bloom":           "Hedera helix flowers.jpg",
    # At the colony
    "first-inspection":    "Beekeeper Inspecting the Hive - 51014819065.jpg",
    "winter-check":        "2016 Pasieka w Trzebieszowicach 1.jpg",
    "swarm-control":       "Honeybee queen cells 14.jpg",
    "replace-queens":      "Apis mellifera scutellata 1355021.jpg",
    "comb-renewal":        "Wax foundation - Flickr - conall...jpg",
    "honey-super":         "Absperrgitter auf Magazinzarge.jpg",
    "cleansing-flight":    "Bees at the hive entrance.JPG",
    "robbing-wasps":       "Honey bees and a wasp at the entrance to a hive, Sandy, Bedfordshire (9740989885).jpg",
        "winter-rest":         "Imkerei bienenstand magazinbeuten winter lebenswertes chemnitz 2.JPG",
    "winter-work":         "Melting beeswax.jpg",
    # Varroa and disease
    "varroa-summer":       "Varroa destructor on honeybee host.jpg",
        "drone-frame-insert":  "Drone - honeybee (8952360114).jpg",
    "drone-brood-cutting": "CSIRO ScienceImage 6961 Worker honey bees removing excess drone brood from the hive.jpg",
    "foulbrood-check":     "AFB in combs.jpg",
    # The handover from the honey year to the winter preparation: supers off, then treat
    # and feed. Filed under care, and the only entry of that kind with a photograph.
    "final-harvest":       "Uncapping honeycomb.jpg",
}

# No photograph anyone would recognise exists for these on Commons under a licence we can
# use: a tub of fondant, a syrup feeder in a hive, a brood sample on its way to the lab, a
# mouse guard, a colony being dribbled with oxalic acid -- the last two exist but are
# indistinguishable from any photograph of a hive, which illustrates nothing.
# They keep their drawn icon, which the layout allows for -- a missing picture is left out
# rather than replaced with something that illustrates nothing.
WITHOUT = ["candy-feeding", "winter-feeding", "foulbrood-sample", "winter-prep", "oxalic-acid"]

# The plant of each forage. In the ribbon the bloom, the move and the harvest of one
# forage sit on a single row, so they show one picture: the rape field runs from "move to
# the field" in April through "spin it at once" in May, and a glance down the row is the
# year of that plant. It is also the picture a beekeeper is actually looking for -- which
# of two yellow fields is rape -- where a honey extractor looks the same in every month.
#
# No extra files: these are the pictures the moves already carry.
FORAGE_PLANT = {
    "rapeseed":  "migrate-rapeseed",
    "acacia":    "migrate-acacia",
    "chestnut":  "migrate-chestnut",
    "linden":    "migrate-linden",
    "fir":       "migrate-fir",
    "lavender":  "migrate-lavender",
    "sunflower": "migrate-sunflower",
    "heather":   "migrate-heather",
}


def text(html: str | None) -> str:
    """Commons returns author and licence as HTML fragments with links in them."""
    plain = re.sub(r"<[^>]+>", " ", html or "")
    plain = (plain.replace("&amp;", "&").replace("&nbsp;", " ")
                  .replace("&quot;", '"').replace("&#039;", "'"))
    return re.sub(r"\s+", " ", plain).strip()


def get(url: str, tries: int = 4) -> bytes:
    """Commons answers 429 when asked quickly; wait longer each time rather than give up."""
    for attempt in range(tries):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(request, timeout=60) as response:
                return response.read()
        except urllib.error.HTTPError as exc:
            if exc.code not in (429, 503) or attempt == tries - 1:
                raise
            time.sleep(3 * (attempt + 1))
    raise RuntimeError("unreachable")


def describe(titles: list[str]) -> dict[str, dict]:
    """One request for every file, which is both faster and kinder than one each."""
    params = {
        "action": "query", "format": "json", "prop": "imageinfo",
        "iiprop": "url|extmetadata|size|mime", "iiurlwidth": str(WIDTH * 2),
        "titles": "|".join(f"File:{title}" for title in titles),
    }
    data = json.loads(get(f"{API}?{urllib.parse.urlencode(params)}"))
    found = {}
    for page in (data.get("query", {}).get("pages") or {}).values():
        if "missing" in page:
            raise SystemExit(f"no such file on Commons: {page['title']}")
        info = (page.get("imageinfo") or [{}])[0]
        meta = info.get("extmetadata") or {}
        found[page["title"].removeprefix("File:")] = {
            "thumb": info.get("thumburl"),
            "page": info.get("descriptionurl", ""),
            "licence": text(meta.get("LicenseShortName", {}).get("value")),
            "licence_url": text(meta.get("LicenseUrl", {}).get("value")),
            "author": text(meta.get("Artist", {}).get("value")) or "unknown",
        }
    return found


def crop(raw: bytes, width: int, height: int, quality: int) -> bytes:
    """A fixed box, filled from the middle, so nothing jumps when the picture lands.

    The middle is also where the subject of every one of these is, which is what makes a
    square tile cut from a landscape photograph work at all.
    """
    image = Image.open(io.BytesIO(raw)).convert("RGB")
    scale = max(width / image.width, height / image.height)
    image = image.resize((round(image.width * scale), round(image.height * scale)), Image.LANCZOS)
    left, top = (image.width - width) // 2, (image.height - height) // 2
    image = image.crop((left, top, left + width, top + height))
    buffer = io.BytesIO()
    image.save(buffer, "WEBP", quality=quality, method=6)
    return buffer.getvalue()


def quoted(value: str) -> str:
    """A string literal for TypeScript, Kotlin and Swift alike.

    `json.dumps` would escape a non-ASCII character as \\uXXXX. TypeScript and Kotlin accept
    that; Swift does not -- it writes \\u{XXXX} -- so an author with an accent in their name
    produced a Swift file that did not compile. The character itself is right in all three.
    """
    return json.dumps(value, ensure_ascii=False)


def write_manifest(records: dict[str, dict]) -> None:
    ordered = {key: records[key] for key in PICKS if key in records}
    missing = [f for f, key in FORAGE_PLANT.items() if key not in ordered]
    if missing:
        raise SystemExit(f"no plant picture for: {', '.join(missing)}")
    forage_rows = "\n".join(
        f"  {quoted(forage)}: YEAR_PHOTOS[{quoted(key)}],"
        for forage, key in FORAGE_PLANT.items()
    )
    rows = "\n".join(
        f"  {quoted(key)}: {{\n"
        f"    file: {quoted(value['file'])},\n"
        f"    thumb: {quoted(value['thumb'])},\n"
        f"    author: {quoted(value['author'])},\n"
        f"    licence: {quoted(value['licence'])},\n"
        f"    licenceUrl: {quoted(value['licenceUrl'])},\n"
        f"    source: {quoted(value['source'])},\n"
        f"  }},"
        for key, value in ordered.items()
    )
    MANIFEST.write_text(
        "// Generated by scripts/fetch_year_photos.py -- do not edit by hand.\n"
        "//\n"
        "// A photograph for the jobs that have one. Most are CC BY or CC BY-SA, so the author\n"
        "// and the licence travel with the picture and are shown wherever it is: that is the\n"
        "// whole of what those licences ask for, and it is also the honest thing to show.\n"
        "//\n"
        "// Jobs without a photograph are not an oversight -- see WITHOUT in the script. They\n"
        "// keep their drawn icon, and every layout here copes with a missing picture.\n\n"
        "export type YearPhoto = {\n"
        "  /** Path under /public, already cropped to 3:2 so nothing reflows when it lands. */\n"
        "  file: string;\n"
        "  /** A square tile for the phone list, a fortieth of the weight. */\n"
        "  thumb: string;\n"
        "  author: string;\n"
        "  licence: string;\n"
        "  licenceUrl: string;\n"
        "  /** The file's page on Wikimedia Commons. */\n"
        "  source: string;\n"
        "};\n\n"
        "export const YEAR_PHOTOS: Record<string, YearPhoto> = {\n"
        f"{rows}\n"
        "};\n\n"
        "/**\n"
        " * The plant of each forage, so the bloom, the move and the harvest of one forage\n"
        " * show the same picture and read as one thread through the year.\n"
        " */\n"
        "export const FORAGE_PHOTOS: Record<string, YearPhoto> = {\n"
        f"{forage_rows}\n"
        "};\n\n"
        "/**\n"
        " * The photograph for one calendar entry, or undefined when it has none.\n"
        " *\n"
        " * An entry that names a forage shows that plant, whatever the job is. Everything\n"
        " * else shows the job itself.\n"
        " */\n"
        "export function photoFor(entryKey: string, honey?: string | null): YearPhoto | undefined {\n"
        "  if (honey && FORAGE_PHOTOS[honey]) return FORAGE_PHOTOS[honey];\n"
        "  return YEAR_PHOTOS[entryKey];\n"
        "}\n\n"
        f"/* data: {json.dumps(ordered, ensure_ascii=False)} */\n",
        encoding="utf-8",
    )


def copy_into_apps(records: dict[str, dict]) -> None:
    """The same bytes the website serves, put where each app can read them."""
    for folder in (ANDROID_PHOTOS, ANDROID_THUMBS, IOS_PHOTOS):
        folder.mkdir(parents=True, exist_ok=True)

    wanted_android = {f"{key}.webp" for key in records}
    wanted_ios = {name for key in records for name in (f"year-{key}.webp", f"year-thumb-{key}.webp")}

    for key in records:
        photo = (PHOTOS / f"{key}.webp").read_bytes()
        tile = (THUMBS / f"{key}.webp").read_bytes()
        (ANDROID_PHOTOS / f"{key}.webp").write_bytes(photo)
        (ANDROID_THUMBS / f"{key}.webp").write_bytes(tile)
        (IOS_PHOTOS / f"year-{key}.webp").write_bytes(photo)
        (IOS_PHOTOS / f"year-thumb-{key}.webp").write_bytes(tile)

    # A picture dropped from PICKS has to leave the apps too, or it ships for ever as dead
    # weight -- and, worse, its credit is gone from the manifest while the file is still there.
    for stale in sorted(p for p in ANDROID_PHOTOS.glob("*.webp") if p.name not in wanted_android):
        stale.unlink()
        print(f"removed android/{stale.name}")
    for stale in sorted(p for p in ANDROID_THUMBS.glob("*.webp") if p.name not in wanted_android):
        stale.unlink()
        print(f"removed android/thumbs/{stale.name}")
    for stale in sorted(p for p in IOS_PHOTOS.glob("*.webp") if p.name not in wanted_ios):
        stale.unlink()
        print(f"removed ios/{stale.name}")


HEADER = (
    "Generated by scripts/fetch_year_photos.py -- do not edit by hand.\n"
    "\n"
    "A photograph for the jobs that have one. Most are CC BY or CC BY-SA, so the author and\n"
    "the licence travel with the picture and are shown wherever it is: that is the whole of\n"
    "what those licences ask for, and it is also the honest thing to show.\n"
    "\n"
    "Jobs without a photograph are not an oversight -- see WITHOUT in the script. They keep\n"
    "their drawn icon, and every layout copes with a missing picture."
)


def write_android(records: dict[str, dict]) -> None:
    ordered = {key: records[key] for key in PICKS if key in records}
    rows = "\n".join(
        f'        {quoted(key)} to YearPhoto(\n'
        f'            file = {quoted(f"year/{key}.webp")},\n'
        f'            thumb = {quoted(f"year/thumbs/{key}.webp")},\n'
        f'            author = {quoted(value["author"])},\n'
        f'            licence = {quoted(value["licence"])},\n'
        f'            licenceUrl = {quoted(value["licenceUrl"])},\n'
        f'            source = {quoted(value["source"])},\n'
        f'        ),'
        for key, value in ordered.items()
    )
    forage_rows = "\n".join(
        f"        {quoted(forage)} to BY_KEY.getValue({quoted(key)}),"
        for forage, key in FORAGE_PLANT.items()
    )
    comment = "\n".join(f"// {line}" if line else "//" for line in HEADER.split("\n"))
    ANDROID_MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    ANDROID_MANIFEST.write_text(
        f"package com.hivepulse.app.ui.calendar\n\n"
        f"{comment}\n\n"
        "/**\n"
        " * One photograph, with what its licence obliges us to show.\n"
        " *\n"
        " * @param file the 640x427 crop, a path inside the app's assets.\n"
        " * @param thumb a 128px square tile for the list, a fortieth of the weight.\n"
        " * @param source the file's page on Wikimedia Commons.\n"
        " */\n"
        "data class YearPhoto(\n"
        "    val file: String,\n"
        "    val thumb: String,\n"
        "    val author: String,\n"
        "    val licence: String,\n"
        "    val licenceUrl: String,\n"
        "    val source: String,\n"
        ")\n\n"
        "object YearPhotos {\n\n"
        "    val BY_KEY: Map<String, YearPhoto> = mapOf(\n"
        f"{rows}\n"
        "    )\n\n"
        "    /**\n"
        "     * The plant of each forage, so the bloom, the move and the harvest of one forage show\n"
        "     * the same picture and read as one thread through the year.\n"
        "     */\n"
        "    val BY_FORAGE: Map<String, YearPhoto> = mapOf(\n"
        f"{forage_rows}\n"
        "    )\n\n"
        "    /**\n"
        "     * The photograph for one calendar entry, or null when it has none.\n"
        "     *\n"
        "     * An entry that names a forage shows that plant, whatever the job is. Everything else\n"
        "     * shows the job itself.\n"
        "     */\n"
        "    fun of(entryKey: String, honey: String? = null): YearPhoto? =\n"
        "        honey?.let { BY_FORAGE[it] } ?: BY_KEY[entryKey]\n"
        "}\n",
        encoding="utf-8",
    )


def write_ios(records: dict[str, dict]) -> None:
    ordered = {key: records[key] for key in PICKS if key in records}
    rows = "\n".join(
        f'        {quoted(key)}: YearPhoto(\n'
        f'            file: {quoted(f"year-{key}")},\n'
        f'            thumb: {quoted(f"year-thumb-{key}")},\n'
        f'            author: {quoted(value["author"])},\n'
        f'            licence: {quoted(value["licence"])},\n'
        f'            licenceUrl: {quoted(value["licenceUrl"])},\n'
        f'            source: {quoted(value["source"])}\n'
        f'        ),'
        for key, value in ordered.items()
    )
    forage_rows = "\n".join(
        f"        {quoted(forage)}: byKey[{quoted(key)}]!,"
        for forage, key in FORAGE_PLANT.items()
    )
    comment = "\n".join(f"// {line}" if line else "//" for line in HEADER.split("\n"))
    IOS_MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    IOS_MANIFEST.write_text(
        f"{comment}\n\n"
        "import Foundation\n\n"
        "/// One photograph, with what its licence obliges us to show.\n"
        "struct YearPhoto {\n"
        "    /// The 640x427 crop, a resource name without its extension.\n"
        "    let file: String\n"
        "    /// A 128px square tile for the list, a fortieth of the weight.\n"
        "    let thumb: String\n"
        "    let author: String\n"
        "    let licence: String\n"
        "    let licenceUrl: String\n"
        "    /// The file's page on Wikimedia Commons.\n"
        "    let source: String\n"
        "}\n\n"
        "enum YearPhotos {\n\n"
        "    static let byKey: [String: YearPhoto] = [\n"
        f"{rows}\n"
        "    ]\n\n"
        "    /// The plant of each forage, so the bloom, the move and the harvest of one forage show\n"
        "    /// the same picture and read as one thread through the year.\n"
        "    static let byForage: [String: YearPhoto] = [\n"
        f"{forage_rows}\n"
        "    ]\n\n"
        "    /// The photograph for one calendar entry, or nil when it has none.\n"
        "    ///\n"
        "    /// An entry that names a forage shows that plant, whatever the job is. Everything else\n"
        "    /// shows the job itself.\n"
        "    static func of(_ entryKey: String, honey: String? = nil) -> YearPhoto? {\n"
        "        if let honey, let plant = byForage[honey] { return plant }\n"
        "        return byKey[entryKey]\n"
        "    }\n"
        "}\n",
        encoding="utf-8",
    )


def write_credits(records: dict[str, dict]) -> None:
    lines = [
        "# Photograph credits",
        "",
        "The pictures in the beekeeping year come from Wikimedia Commons. Every one is used",
        "under a licence that permits commercial use with attribution, and every one is",
        "credited in the app itself, beside the picture, as well as here.",
        "",
        "Generated by `scripts/fetch_year_photos.py` -- edit `PICKS` there, not this file.",
        "",
        "| Entry | Photographer | Licence | Original |",
        "|-------|--------------|---------|----------|",
    ]
    for key, value in records.items():
        licence = (f"[{value['licence']}]({value['licenceUrl']})"
                   if value["licenceUrl"] else value["licence"])
        lines.append(
            f"| `{key}` | {value['author']} | {licence} | [Commons]({value['source']}) |"
        )
    lines += [
        "",
        "## Forages",
        "",
        "The bloom, the move and the harvest of one forage share the plant's picture, so the",
        "merged row of the ribbon reads as one thread through the year:",
        "",
        *[f"- `{forage}` -> the picture filed under `{key}`"
          for forage, key in FORAGE_PLANT.items()],
        "",
        "## Entries without a photograph",
        "",
        "No usable picture exists on Commons for these, so they keep their drawn icon:",
        "",
        *[f"- `{key}`" for key in WITHOUT],
        "",
        "A picture that illustrates nothing is worse than none, and every layout is built to",
        "leave a missing one out.",
        "",
    ]
    CREDITS.write_text("\n".join(lines), encoding="utf-8")


def stored() -> dict[str, dict]:
    """What the manifest already knows, which is every field except the bytes."""
    if not MANIFEST.exists():
        raise SystemExit("nothing to sync from: lib/yearPhotos.ts does not exist yet")
    kept = re.search(r"/\* data: (.*?) \*/", MANIFEST.read_text(encoding="utf-8"), re.S)
    if not kept:
        raise SystemExit("lib/yearPhotos.ts has no data comment to sync from")
    return json.loads(kept.group(1))


def emit(records: dict[str, dict]) -> None:
    write_manifest(records)
    write_android(records)
    write_ios(records)
    write_credits(records)
    copy_into_apps(records)


def sync() -> None:
    """Re-emit everything from the stored data, without going near Commons."""
    records = stored()
    missing = [key for key in records
               if not (PHOTOS / f"{key}.webp").exists() or not (THUMBS / f"{key}.webp").exists()]
    if missing:
        raise SystemExit(f"no local file for: {', '.join(missing)} -- run without --sync")
    emit(records)
    print(f"{len(records)} photographs re-emitted for web, Android and iPhone")


def main(only: list[str]) -> None:
    if only == ["--sync"]:
        sync()
        return
    keys = only or list(PICKS)
    unknown = [key for key in keys if key not in PICKS]
    if unknown:
        raise SystemExit(f"not in PICKS: {', '.join(unknown)}")

    PHOTOS.mkdir(parents=True, exist_ok=True)
    THUMBS.mkdir(parents=True, exist_ok=True)
    meta = describe([PICKS[key] for key in keys])

    records: dict[str, dict] = {}
    if MANIFEST.exists():  # keep the entries this run was not asked about
        kept = re.search(r"/\* data: (.*?) \*/", MANIFEST.read_text(encoding="utf-8"), re.S)
        if kept:
            records = json.loads(kept.group(1))

    for key in keys:
        title = PICKS[key]
        info = meta[title]
        if not ALLOWED.match(info["licence"]):
            raise SystemExit(f"{key}: licence {info['licence']!r} is not one we may use")
        if not info["thumb"]:
            raise SystemExit(f"{key}: Commons served no thumbnail for {title}")
        raw = get(info["thumb"])
        data = crop(raw, WIDTH, HEIGHT, QUALITY)
        tile = crop(raw, THUMB, THUMB, THUMB_QUALITY)
        (PHOTOS / f"{key}.webp").write_bytes(data)
        (THUMBS / f"{key}.webp").write_bytes(tile)
        records[key] = {
            "file": f"/year/{key}.webp",
            "thumb": f"/year/thumbs/{key}.webp",
            "title": title,
            "author": info["author"],
            "licence": info["licence"],
            "licenceUrl": info["licence_url"],
            "source": info["page"],
        }
        print(f"{key:20} {len(data) // 1024:4} KB +{len(tile) // 1024:2} KB  "
              f"{info['licence']:14} {info['author'][:36]}")
        time.sleep(0.6)

    for stale in sorted(set(records) - set(PICKS)):   # an entry dropped from PICKS
        records.pop(stale)
        (PHOTOS / f"{stale}.webp").unlink(missing_ok=True)
        (THUMBS / f"{stale}.webp").unlink(missing_ok=True)
        print(f"removed {stale}")

    emit(records)
    total = sum((PHOTOS / f"{key}.webp").stat().st_size for key in records)
    tiles = sum((THUMBS / f"{key}.webp").stat().st_size for key in records)
    print(f"\n{len(records)} photographs, {total / 1024:.0f} KB, tiles {tiles / 1024:.0f} KB")
    for path in (MANIFEST, ANDROID_MANIFEST, IOS_MANIFEST, CREDITS):
        print(f"written {path.relative_to(ROOT).as_posix()}")


if __name__ == "__main__":
    main(sys.argv[1:])
