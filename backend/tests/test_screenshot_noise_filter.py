"""The screenshot workflow must not open a pull request for clock-only changes.

scripts/drop_insignificant_screenshots.py decides that, so its comparison is tested here
(the backend job is the one that runs pytest for the repository).
"""
import importlib.util
import io
from pathlib import Path

import pytest

PIL = pytest.importorskip("PIL")
from PIL import Image, ImageDraw  # noqa: E402

SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "drop_insignificant_screenshots.py"


def _load():
    spec = importlib.util.spec_from_file_location("drop_insignificant_screenshots", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


filter_module = _load()


def _png(boxes=(), size=(200, 400)):
    image = Image.new("RGB", size, "white")
    draw = ImageDraw.Draw(image)
    for box in boxes:
        draw.rectangle(box, fill="black")
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def test_identical_screenshots_have_no_change():
    assert filter_module.pixel_change_fraction(_png(), _png()) == 0.0


def test_a_clock_sized_change_stays_below_the_threshold():
    # A status-bar clock is a handful of glyphs in the top corner
    before = _png([(5, 5, 45, 25)])
    after = _png([(5, 5, 40, 25)])
    fraction = filter_module.pixel_change_fraction(before, after)
    assert 0 < fraction < 0.004


def test_a_repainted_screen_is_a_real_change():
    fraction = filter_module.pixel_change_fraction(_png(), _png([(0, 0, 200, 300)]))
    assert fraction > 0.004


def test_a_resized_screenshot_always_counts_as_changed():
    assert filter_module.pixel_change_fraction(_png(), _png(size=(300, 400))) == 1.0


def test_a_new_or_unreadable_file_is_kept():
    assert filter_module.pixel_change_fraction(b"", _png()) is None
    assert filter_module.pixel_change_fraction(b"not a png", _png()) is None
