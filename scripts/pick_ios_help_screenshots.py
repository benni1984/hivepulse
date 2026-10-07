#!/usr/bin/env python3
"""Turn the iOS screenshot run into the iPhone images of the help pages.

ScreenshotUITests writes every screen it photographs as `<number>-<name>.png`. The help pages
(components/HelpScreenshot) look for `ios-<name>.png` next to every `android-<name>.png`, so each screen
the Android script also captures gets the same name here. A screen the run did not produce is reported
and left out; the picture that was there stays.

    python scripts/pick_ios_help_screenshots.py <dir with the PNGs> [<output dir>]
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

# ScreenshotUITests name -> the help image (without extension). The same names as the Android images
# (android-<name>.png) so the two line up in the help tabs. `ios-apiaries` is what the landing page uses.
HELP_IMAGES: dict[str, list[str]] = {
    "03-apiaries": ["ios-apiary-list", "ios-apiaries"],
    "04-apiary-detail": ["ios-hive-list"],
    "05-hive-detail": ["ios-hive-detail"],
    "07-settings": ["ios-settings-account"],
    "08-qr-batches": ["ios-qr-batches"],
    "10-members-supporter": ["ios-community-stats"],
    "16-apiary-edit": ["ios-apiary-edit"],
    "17-hive-edit": ["ios-hive-edit"],
    "18-inspection-form": ["ios-inspection-form"],
    "19-inspection-frames": ["ios-inspection-frames"],
    "21-hive-stats": ["ios-hive-stats"],
    "22-hornets": ["ios-hornet-home"],
    "23-home-summary": ["ios-home-summary"],
    "24-treatments": ["ios-treatments"],
    "25-moves": ["ios-moves"],
    "26-sharing": ["ios-sharing"],
}


def pick(source: Path, destination: Path) -> tuple[list[str], list[str]]:
    """Copy the mapped screenshots; returns (written names, missing screenshot names)."""
    destination.mkdir(parents=True, exist_ok=True)
    written: list[str] = []
    missing: list[str] = []
    for name, targets in HELP_IMAGES.items():
        image = source / f"{name}.png"
        if not image.is_file():
            missing.append(name)
            continue
        for target in targets:
            shutil.copyfile(image, destination / f"{target}.png")
            written.append(target)
    return written, missing


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 2
    source = Path(argv[1])
    destination = Path(argv[2]) if len(argv) > 2 else Path("public/docs/screenshots")
    written, missing = pick(source, destination)
    for name in missing:
        print(f"::warning::{name}.png was not captured; its help image is left as it was")
    print(f"{len(written)} iPhone help images written to {destination}")
    # Nothing at all means the run did not photograph anything: a failure, not an update.
    return 0 if written else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
