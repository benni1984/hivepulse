#!/usr/bin/env python3
"""Revert regenerated screenshots that only differ in noise.

The emulator status-bar clock and counters like "Days since last inspection" change on
every run, so a freshly captured screenshot is never byte-identical to the committed one.
Without this filter the screenshot workflow opens a new pull request (and triggers a
production deploy) every single day for pictures that look exactly the same.

A file is kept only when enough pixels actually changed; otherwise it is restored from
git, so the workflow sees no change at all.

Usage: drop_insignificant_screenshots.py [directory] [--threshold 0.004] [--dry-run]
"""
from __future__ import annotations

import argparse
import io
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops


def changed_files(directory: Path) -> list[Path]:
    out = subprocess.run(
        ["git", "diff", "HEAD", "--name-only", "--", str(directory)],
        capture_output=True, text=True, check=True,
    ).stdout
    return [Path(line) for line in out.splitlines() if line.strip().endswith(".png")]


def pixel_change_fraction(old_bytes: bytes, new_bytes: bytes) -> float | None:
    """Fraction of visibly changed pixels between two PNGs, or None if incomparable."""
    if not old_bytes or not new_bytes:
        return None
    try:
        old = Image.open(io.BytesIO(old_bytes)).convert("RGB")
        new = Image.open(io.BytesIO(new_bytes)).convert("RGB")
    except OSError:
        return None
    if old.size != new.size:
        return 1.0

    diff = ImageChops.difference(old, new).convert("L")
    # Ignore anti-aliasing jitter: count a pixel only when it visibly changed
    mask = diff.point(lambda v: 255 if v > 24 else 0)
    changed = sum(mask.histogram()[1:])
    return changed / float(old.size[0] * old.size[1])


def changed_fraction(path: Path) -> float | None:
    """Fraction of pixels that differ from the committed version, or None if incomparable."""
    old_bytes = subprocess.run(
        ["git", "show", f"HEAD:{path.as_posix()}"], capture_output=True, check=False
    ).stdout
    try:
        new_bytes = path.read_bytes()
    except OSError:
        return None
    return pixel_change_fraction(old_bytes, new_bytes)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("directory", nargs="?", default="public/docs/screenshots")
    parser.add_argument("--threshold", type=float, default=0.004,
                        help="keep the new screenshot when at least this fraction of pixels changed")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    kept, reverted = [], []
    for path in changed_files(Path(args.directory)):
        fraction = changed_fraction(path)
        if fraction is None or fraction >= args.threshold:
            kept.append((path, fraction))
            continue
        reverted.append((path, fraction))
        if not args.dry_run:
            subprocess.run(["git", "checkout", "HEAD", "--", path.as_posix()], check=True)

    for path, fraction in reverted:
        print(f"unchanged (only noise, {fraction:.4%}): {path}")
    for path, fraction in kept:
        shown = "new file" if fraction is None else f"{fraction:.2%}"
        print(f"updated ({shown}): {path}")
    print(f"\n{len(kept)} updated, {len(reverted)} reverted as noise")
    return 0


if __name__ == "__main__":
    sys.exit(main())
