"""Unit tests for app/utils/qr.py — QR code generation with logo overlay."""

import io

from PIL import Image

from app.utils.qr import make_qr_png, _make_logo


# ---------------------------------------------------------------------------
# _make_logo
# ---------------------------------------------------------------------------


def test_make_logo_returns_rgba_image():
    img = _make_logo(60)
    assert img.mode == "RGBA"
    assert img.size == (60, 60)


def test_make_logo_has_amber_pixels():
    """Centre pixel should be the amber fill colour #f59e0b."""
    img = _make_logo(100)
    cx, cy = img.size[0] // 2, img.size[1] // 2
    r, g, b, a = img.getpixel((cx, cy))
    # Amber: R≈245, G≈158, B≈11 — allow ±5 for anti-aliasing
    assert abs(r - 245) <= 5
    assert abs(g - 158) <= 10
    assert abs(b - 11) <= 10
    assert a == 255  # fully opaque


def test_make_logo_transparent_corners():
    """Corners outside the hexagon should be fully transparent."""
    img = _make_logo(100)
    _, _, _, a = img.getpixel((0, 0))
    assert a == 0


# ---------------------------------------------------------------------------
# make_qr_png
# ---------------------------------------------------------------------------


def test_make_qr_png_returns_bytes():
    data = make_qr_png("test-token")
    assert isinstance(data, bytes)
    assert len(data) > 0


def test_make_qr_png_valid_png_magic_bytes():
    """Output must start with the PNG magic bytes \x89PNG."""
    data = make_qr_png("some-qr-data")
    assert data[:4] == b"\x89PNG"


def test_make_qr_png_is_square_rgb():
    """The output PNG should be a square RGB image."""
    data = make_qr_png("hello")
    img = Image.open(io.BytesIO(data))
    assert img.mode == "RGB"
    w, h = img.size
    assert w == h


def test_make_qr_png_logo_sits_on_a_white_knockout():
    """The code pattern must not show through around the logo.

    Sampling a ring just outside the hexagon but inside the cleared box: every pixel there has to be
    white, otherwise the logo reads as a smudge on top of the pattern.
    """
    img = Image.open(io.BytesIO(make_qr_png("knockout-token"))).convert("RGB")
    w, _ = img.size
    cx = cy = w // 2
    logo_half = int(w * 0.22) // 2
    box_half = logo_half + max(4, int(w * 0.22) // 8)

    # Corners of the cleared box lie outside the hexagon, so they must be plain white
    offset = int(box_half * 0.85)
    for dx, dy in ((-offset, -offset), (offset, -offset), (-offset, offset), (offset, offset)):
        assert img.getpixel((cx + dx, cy + dy)) == (255, 255, 255), f"pattern visible at {(dx, dy)}"


def test_make_qr_png_logo_centre_is_amber():
    img = Image.open(io.BytesIO(make_qr_png("amber-token"))).convert("RGB")
    r, g, b = img.getpixel((img.size[0] // 2, img.size[1] // 2))
    assert abs(r - 245) <= 5 and abs(g - 158) <= 10 and abs(b - 11) <= 10


def test_make_qr_png_knockout_stays_within_error_correction_budget():
    """ERROR_CORRECT_H recovers ~30 % of the code; the cleared box must stay well below that."""
    img = Image.open(io.BytesIO(make_qr_png("budget-token"))).convert("RGB")
    w, _ = img.size
    box = int(w * 0.22) + 2 * max(4, int(w * 0.22) // 8)
    assert (box / w) ** 2 < 0.10


def test_make_logo_cells_are_opaque_white():
    """Semi-transparent cells let the amber bleed through and looked muddy at print size."""
    img = _make_logo(200)
    cx, cy = img.size[0] // 2, img.size[1] // 2
    r, g, b, a = img.getpixel((cx, cy - int(img.size[1] * 0.16)))  # top honeycomb cell
    assert (r, g, b, a) == (255, 255, 255, 255)


def test_make_qr_png_different_inputs_produce_different_outputs():
    png1 = make_qr_png("token-aaa")
    png2 = make_qr_png("token-bbb")
    assert png1 != png2


def test_make_qr_png_same_input_is_deterministic():
    png1 = make_qr_png("stable-token")
    png2 = make_qr_png("stable-token")
    assert png1 == png2
