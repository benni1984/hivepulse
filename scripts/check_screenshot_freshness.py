"""Warn when the interface changed but the screenshots did not.

Store screenshots and help-page screenshots both go stale silently: the app gets a new
button, the pictures keep showing the old one, and nobody notices until a reviewer or a
beekeeper does. Nothing in the build knew about it.

This hashes the files that decide what a screenshot looks like — views, strings, styles —
and compares that against the hash recorded when the screenshots were last captured.

    python scripts/check_screenshot_freshness.py            # report, exit 0 or 1
    python scripts/check_screenshot_freshness.py --update   # after capturing: record the state
    python scripts/check_screenshot_freshness.py --list-stale
                                                            # which sets to retake, for the pipeline
    python scripts/check_screenshot_freshness.py --update --platform ios
                                                            # record only what was retaken

The "Update screenshots" workflow runs --list-stale after every green CI on main, retakes the sets it names
(web, Android, iPhone) and records them with --update --platform in the same pull request.

In CI it prints GitHub warning annotations and never fails the build: a stale screenshot is
worth a notice, not a blocked merge. Pass --strict to make it fail.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from datetime import date
from pathlib import Path

# A Windows console defaults to cp1252 and chokes on the dashes below.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

REPO = Path(__file__).resolve().parents[1]
MANIFEST = REPO / "docs" / "screenshot-manifest.json"

# What each set of screenshots actually shows. A change under these paths can change a
# picture; a change anywhere else cannot.
WATCHED: dict[str, list[str]] = {
    "ios": [
        "ios/HivePulse/Views",
        "ios/HivePulse/Resources/en.lproj/Localizable.strings",
        "ios/HivePulse/Resources/de.lproj/Localizable.strings",
        "ios/HivePulse/Resources/fr.lproj/Localizable.strings",
        "ios/HivePulse/Resources/es.lproj/Localizable.strings",
    ],
    "android": [
        "android/app/src/main/java/com/hivepulse/app/ui",
        "android/app/src/main/res/values/strings.xml",
        "android/app/src/main/res/values-de/strings.xml",
        "android/app/src/main/res/values-fr/strings.xml",
        "android/app/src/main/res/values-es/strings.xml",
    ],
    "web": [
        "app",
        "components",
        "web/style.css",
        "web/landing.css",
        "messages",
    ],
}

# Help pages embed the web and app screenshots; the store listing uses its own set.
PURPOSE = {
    "ios": "App Store screenshots (Actions → iOS Store Screenshots) and the iOS help images",
    "android": "Play Store screenshots and the Android help images",
    "web": "the help-page screenshots under public/docs/screenshots",
}


def _hash_path(path: Path) -> list[tuple[str, str]]:
    """(relative path, sha256) for a file, or for every file under a directory."""
    if path.is_file():
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        return [(path.relative_to(REPO).as_posix(), digest)]
    if not path.is_dir():
        return []
    entries: list[tuple[str, str]] = []
    for child in sorted(path.rglob("*")):
        if child.is_file() and not any(part.startswith(".") for part in child.parts):
            entries.append(
                (child.relative_to(REPO).as_posix(), hashlib.sha256(child.read_bytes()).hexdigest())
            )
    return entries


def fingerprint(platform: str) -> tuple[str, dict[str, str]]:
    """One hash over everything watched for a platform, plus the per-file hashes."""
    files: dict[str, str] = {}
    for watched in WATCHED[platform]:
        for relative, digest in _hash_path(REPO / watched):
            files[relative] = digest
    combined = hashlib.sha256()
    for relative in sorted(files):
        combined.update(relative.encode())
        combined.update(files[relative].encode())
    return combined.hexdigest(), files


def load_manifest() -> dict:
    if not MANIFEST.exists():
        return {}
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


def write_manifest(data: dict) -> None:
    MANIFEST.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def stale_platforms() -> list[str]:
    """The platforms whose screenshots no longer match the interface. A platform that was never
    recorded counts as stale: nothing says its pictures are current."""
    data = load_manifest()
    stale = []
    for platform in WATCHED:
        recorded = data.get(platform)
        combined, _ = fingerprint(platform)
        if not recorded or combined != recorded["fingerprint"]:
            stale.append(platform)
    return stale


def list_stale() -> int:
    stale = stale_platforms()
    print(" ".join(stale))
    output = os.environ.get("GITHUB_OUTPUT")
    if output:
        with open(output, "a", encoding="utf-8") as handle:
            handle.write(f"stale={' '.join(stale)}\n")
            for platform in WATCHED:
                handle.write(f"{platform}={'true' if platform in stale else 'false'}\n")
    return 0


def update(platforms: list[str] | None = None) -> int:
    data = load_manifest()
    for platform in platforms or list(WATCHED):
        combined, files = fingerprint(platform)
        if data.get(platform, {}).get("fingerprint") == combined:
            print(f"{platform}: unchanged, {combined[:12]}")
            continue
        data[platform] = {
            "captured": date.today().isoformat(),
            "fingerprint": combined,
            "files": files,
        }
        print(f"{platform}: recorded {len(files)} files, {combined[:12]}")
    write_manifest(data)
    print(f"\nwrote {MANIFEST.relative_to(REPO)}")
    return 0


def check(strict: bool) -> int:
    data = load_manifest()
    if not data:
        print("No manifest yet — run with --update after capturing screenshots.")
        return 0

    in_ci = bool(os.environ.get("GITHUB_ACTIONS"))
    summary_lines: list[str] = []
    stale = []

    for platform in WATCHED:
        recorded = data.get(platform)
        if not recorded:
            continue
        combined, files = fingerprint(platform)
        if combined == recorded["fingerprint"]:
            summary_lines.append(f"- **{platform}**: screenshots match the interface")
            continue

        old_files = recorded.get("files", {})
        changed = sorted(
            set(k for k in files if old_files.get(k) != files[k])
            | set(k for k in old_files if k not in files)
        )
        stale.append(platform)
        message = (
            f"{platform}: the interface changed since the screenshots were taken on "
            f"{recorded['captured']} — {len(changed)} file(s). After the merge the "
            f"\"Update help page screenshots\" workflow retakes them ({PURPOSE[platform]})."
        )
        print(("::warning::" if in_ci else "WARNING: ") + message)
        for name in changed[:8]:
            print(f"    {name}")
        if len(changed) > 8:
            print(f"    … and {len(changed) - 8} more")
        summary_lines.append(
            f"- **{platform}**: {len(changed)} file(s) changed since {recorded['captured']} — "
            f"screenshots may be out of date"
        )

    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as handle:
            handle.write("### Screenshot freshness\n\n" + "\n".join(summary_lines) + "\n")

    if not stale:
        print("All screenshot sets match the current interface.")
        return 0
    if strict:
        print(f"\n{len(stale)} screenshot set(s) are stale and --strict was given.")
        return 1
    print("\nA notice, not a failure. The screenshot workflow retakes what is listed after the merge.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--update", action="store_true", help="record the current state")
    parser.add_argument("--strict", action="store_true", help="exit 1 when something is stale")
    parser.add_argument("--list-stale", action="store_true", help="print the stale platforms")
    parser.add_argument(
        "--platform", action="append", choices=sorted(WATCHED),
        help="with --update: record only this platform (repeatable)",
    )
    args = parser.parse_args()
    if args.list_stale:
        return list_stale()
    return update(args.platform) if args.update else check(args.strict)


if __name__ == "__main__":
    sys.exit(main())
