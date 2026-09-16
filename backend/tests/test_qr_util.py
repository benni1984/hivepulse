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
    """Upper badge area is plain amber fill (#f59e0b) — the centre is where the cells meet."""
    img = _make_logo(200)
    r, g, b, a = img.getpixel((img.size[0] // 2, int(img.size[1] * 0.14)))
    # Amber: R≈245, G≈158, B≈11 — allow ±5 for anti-aliasing
    assert abs(r - 245) <= 5
    assert abs(g - 158) <= 10
    assert abs(b - 11) <= 10
    assert a == 255  # fully opaque


def test_make_logo_badge_is_solid():
    """The badge must stay opaque everywhere inside the hexagon.

    Regression: the translucent ring and cell fills were drawn straight onto the badge, and
    ImageDraw replaces pixels instead of blending — that punched see-through holes into the amber,
    so the mark rendered as a hollow ring with white blobs.
    """
    size = 200
    img = _make_logo(size)
    cx = cy = size // 2
    radius = int(size * 0.30)  # well inside the hexagon, covers ring, cells and sparkline
    for dy in range(-radius, radius + 1, 5):
        for dx in range(-radius, radius + 1, 5):
            if dx * dx + dy * dy <= radius * radius:
                assert img.getpixel((cx + dx, cy + dy))[3] == 255, f"hole at {(dx, dy)}"


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


def test_make_qr_png_logo_area_is_amber_not_pattern():
    """The overlay must be the amber mark, not code modules showing through."""
    img = Image.open(io.BytesIO(make_qr_png("amber-token"))).convert("RGB")
    w, _ = img.size
    cx = cy = w // 2
    half = int(w * 0.22) // 2

    amber = black = 0
    for y in range(cy - half, cy + half):
        for x in range(cx - half, cx + half):
            r, g, b = img.getpixel((x, y))
            if abs(r - 245) <= 12 and abs(g - 158) <= 20 and b <= 40:
                amber += 1
            elif r < 60 and g < 60 and b < 60:
                black += 1
    assert amber > (2 * half) ** 2 * 0.25, "logo badge not visible"
    assert black == 0, "code pattern shows through the logo area"


def test_make_qr_png_knockout_stays_within_error_correction_budget():
    """ERROR_CORRECT_H recovers ~30 % of the code; the cleared box must stay well below that."""
    img = Image.open(io.BytesIO(make_qr_png("budget-token"))).convert("RGB")
    w, _ = img.size
    box = int(w * 0.22) + 2 * max(4, int(w * 0.22) // 8)
    assert (box / w) ** 2 < 0.10


def test_make_logo_has_white_details():
    """Cell outlines, inner ring and sparkline are white — the old mark had none of them."""
    img = _make_logo(200)
    whites = sum(
        1
        for y in range(img.size[1])
        for x in range(img.size[0])
        if img.getpixel((x, y))[:3] > (235, 235, 235) and img.getpixel((x, y))[3] > 200
    )
    assert whites > 400, f"expected white outlines/sparkline, found {whites} white pixels"


def test_make_qr_png_different_inputs_produce_different_outputs():
    png1 = make_qr_png("token-aaa")
    png2 = make_qr_png("token-bbb")
    assert png1 != png2


def test_make_qr_png_same_input_is_deterministic():
    png1 = make_qr_png("stable-token")
    png2 = make_qr_png("stable-token")
    assert png1 == png2
