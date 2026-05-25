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


def test_make_qr_png_different_inputs_produce_different_outputs():
    png1 = make_qr_png("token-aaa")
    png2 = make_qr_png("token-bbb")
    assert png1 != png2


def test_make_qr_png_same_input_is_deterministic():
    png1 = make_qr_png("stable-token")
    png2 = make_qr_png("stable-token")
    assert png1 == png2
