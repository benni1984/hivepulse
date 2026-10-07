"""The iPhone help images come from ScreenshotUITests by name, so the names have to stay in step."""
import importlib.util
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "pick_ios_help_screenshots.py"


def _load():
    spec = importlib.util.spec_from_file_location("pick_ios_help_screenshots", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


picker = _load()


def _png(path: Path, content: bytes = b"png") -> None:
    path.write_bytes(content)


def test_every_mapped_screen_is_one_the_ui_test_photographs():
    tests = (ROOT / "ios/HivePulseUITests/ScreenshotUITests.swift").read_text(encoding="utf-8")
    snapped = set(re.findall(r'snap\("([^"]+)"', tests))

    unknown = sorted(set(picker.HELP_IMAGES) - snapped)
    assert not unknown, f"ScreenshotUITests no longer photographs {unknown}"


def test_the_names_line_up_with_the_android_images():
    """Help pages put the iPhone and Android pictures side by side by swapping the prefix."""
    android_script = (ROOT / "scripts/android-screenshots.py").read_text(encoding="utf-8")
    android = set(re.findall(r'"android-([a-z-]+)"', android_script))

    shared = {t.removeprefix("ios-") for targets in picker.HELP_IMAGES.values() for t in targets}
    assert all(t.startswith("ios-") for targets in picker.HELP_IMAGES.values() for t in targets)
    # The screens both platforms show for the newer features carry the same name.
    for name in ("home-summary", "treatments", "moves", "sharing"):
        assert name in shared and name in android, f"{name} is not captured on both platforms"


def test_pick_copies_what_exists_and_names_what_is_missing(tmp_path):
    source, destination = tmp_path / "in", tmp_path / "out"
    source.mkdir()
    _png(source / "03-apiaries.png", b"list")
    _png(source / "23-home-summary.png", b"home")

    written, missing = picker.pick(source, destination)

    assert sorted(written) == ["ios-apiaries", "ios-apiary-list", "ios-home-summary"]
    assert (destination / "ios-apiary-list.png").read_bytes() == b"list"
    assert (destination / "ios-apiaries.png").read_bytes() == b"list"
    assert "05-hive-detail" in missing
    assert not (destination / "ios-hive-detail.png").exists()


def test_an_empty_run_is_a_failure(tmp_path):
    source = tmp_path / "in"
    source.mkdir()

    assert picker.main(["pick", str(source), str(tmp_path / "out")]) == 1
