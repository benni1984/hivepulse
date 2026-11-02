"""Send the Play store listing — texts, screenshots, icon and feature graphic — to Google Play.

The bundle and the "What's new" notes already go up with the Android Release workflow. This is
everything else a listing consists of, in five languages, which was the last thing still typed
and dragged into the console by hand.

    python scripts/upload_play_metadata.py --metadata build/play --dry-run
    python scripts/upload_play_metadata.py --metadata build/play --screenshots build/play-screenshots

Reads the texts `build_play_metadata.py` wrote. Screenshots are `<screenshots>/<locale>/*.png`,
uploaded in file-name order because that is the order Play shows them in. The icon and the
feature graphic come from `public/brand/` and are the same for every language.

Everything happens inside one Play "edit", which is committed at the end: either all of it
arrives or none of it does. The service-account JSON comes from --service-account or
$PLAY_SERVICE_ACCOUNT_JSON.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

REPO = Path(__file__).resolve().parent.parent
PACKAGE = "com.hivepulse.app"
TEXTS = ("title", "short_description", "full_description")

# Language-independent: wordless apart from the brand name, which is the same everywhere.
GRAPHICS = {
    "icon": REPO / "public" / "brand" / "play-icon-512.png",
    "featureGraphic": REPO / "public" / "brand" / "play-feature-1024x500.png",
}

# Play accepts at most this many phone screenshots per language.
MAX_SCREENSHOTS = 8


class UploadError(Exception):
    pass


def read_metadata(metadata: Path) -> dict[str, dict[str, str]]:
    """{'de-DE': {'title': ..., 'short_description': ..., 'full_description': ...}, ...}"""
    listings: dict[str, dict[str, str]] = {}
    for directory in sorted(p for p in metadata.iterdir() if p.is_dir()):
        values = {}
        for name in TEXTS:
            path = directory / f"{name}.txt"
            if not path.exists():
                raise UploadError(f"{directory.name}: {name}.txt is missing — run build_play_metadata.py")
            values[name] = path.read_text(encoding="utf-8").strip()
        listings[directory.name] = values
    if not listings:
        raise UploadError(f"no languages found under {metadata}")
    return listings


def screenshots_for(root: Path | None, locale: str) -> list[Path]:
    """The PNGs for one language, in the order Play will show them."""
    if root is None:
        return []
    directory = root / locale
    if not directory.is_dir():
        raise UploadError(f"no screenshots for {locale} under {root}")
    shots = sorted(directory.glob("*.png"))
    if not shots:
        raise UploadError(f"no screenshots for {locale} under {root}")
    if len(shots) > MAX_SCREENSHOTS:
        raise UploadError(f"{locale}: {len(shots)} screenshots, Play accepts at most {MAX_SCREENSHOTS}")
    return shots


def service_account(raw: str) -> dict:
    try:
        info = json.loads(raw)
    except json.JSONDecodeError as problem:
        raise UploadError(f"the service account JSON cannot be read: {problem}") from problem
    if "client_email" not in info:
        raise UploadError("the service account JSON has no client_email — it is probably truncated")
    return info


def _client(info: dict):
    """The Play Developer API, authenticated as the service account."""
    from google.oauth2 import service_account as google_service_account       # noqa: PLC0415
    from googleapiclient.discovery import build                               # noqa: PLC0415

    credentials = google_service_account.Credentials.from_service_account_info(
        info, scopes=["https://www.googleapis.com/auth/androidpublisher"])
    return build("androidpublisher", "v3", credentials=credentials, cache_discovery=False)


def upload(listings: dict[str, dict[str, str]], shots: Path | None, info: dict,
           changes_not_sent_for_review: bool = False) -> None:
    from googleapiclient.http import MediaFileUpload                          # noqa: PLC0415

    service = _client(info)
    edits = service.edits()
    edit_id = edits.insert(packageName=PACKAGE, body={}).execute()["id"]

    for locale, values in listings.items():
        edits.listings().update(
            packageName=PACKAGE, editId=edit_id, language=locale,
            body={
                "language": locale,
                "title": values["title"],
                "shortDescription": values["short_description"],
                "fullDescription": values["full_description"],
            },
        ).execute()
        print(f"  {locale}: texts")

        for image_type, path in GRAPHICS.items():
            if not path.exists():
                raise UploadError(f"{path} is missing — run scripts/make_store_graphics.py")
            edits.images().deleteall(packageName=PACKAGE, editId=edit_id, language=locale,
                                    imageType=image_type).execute()
            edits.images().upload(
                packageName=PACKAGE, editId=edit_id, language=locale, imageType=image_type,
                media_body=MediaFileUpload(str(path), mimetype="image/png"),
            ).execute()
        print(f"  {locale}: icon and feature graphic")

        pictures = screenshots_for(shots, locale)
        if pictures:
            # Replacing the set outright: otherwise the old ones stay beside the new ones.
            edits.images().deleteall(packageName=PACKAGE, editId=edit_id, language=locale,
                                    imageType="phoneScreenshots").execute()
            for picture in pictures:
                edits.images().upload(
                    packageName=PACKAGE, editId=edit_id, language=locale,
                    imageType="phoneScreenshots",
                    media_body=MediaFileUpload(str(picture), mimetype="image/png"),
                ).execute()
            print(f"  {locale}: {len(pictures)} screenshots")

    edits.commit(packageName=PACKAGE, editId=edit_id,
                 changesNotSentForReview=changes_not_sent_for_review).execute()
    print(f"Committed edit {edit_id}.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--metadata", type=Path, required=True,
                        help="folder build_play_metadata.py wrote")
    parser.add_argument("--screenshots", type=Path,
                        help="folder of <locale>/*.png; leaving it out leaves the screenshots alone")
    parser.add_argument("--service-account", type=Path,
                        help="service account JSON; $PLAY_SERVICE_ACCOUNT_JSON when not given")
    parser.add_argument("--changes-not-sent-for-review", action="store_true",
                        help="pass when the console has other pending changes")
    parser.add_argument("--dry-run", action="store_true",
                        help="say what would be sent and send nothing")
    args = parser.parse_args()

    try:
        listings = read_metadata(args.metadata)
        for locale in listings:
            screenshots_for(args.screenshots, locale)      # fail before the first upload, not during

        if args.dry_run:
            print("Dry run — nothing is sent to Play.")
            for locale, values in listings.items():
                shots = len(screenshots_for(args.screenshots, locale))
                print(f"  {locale}: " + ", ".join(f"{n} {len(v)}" for n, v in values.items())
                      + f", {shots} screenshots, icon and feature graphic")
            return 0

        raw = (args.service_account.read_text(encoding="utf-8") if args.service_account
               else os.environ.get("PLAY_SERVICE_ACCOUNT_JSON", ""))
        if not raw.strip():
            raise UploadError("no service account — pass --service-account or set "
                              "$PLAY_SERVICE_ACCOUNT_JSON (see docs/android-release-setup.md)")
        info = service_account(raw)
        print(f"Uploading as {info['client_email']}")
        upload(listings, args.screenshots, info, args.changes_not_sent_for_review)
    except UploadError as problem:
        print(f"The listing was not uploaded:\n{problem}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
