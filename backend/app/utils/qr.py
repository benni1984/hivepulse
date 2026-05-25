"""QR code generation with HivePulse logo overlay."""

import io
import math

import qrcode
from qrcode.constants import ERROR_CORRECT_H
from PIL import Image, ImageDraw


def _make_logo(size: int) -> Image.Image:
    """Draw the HivePulse amber hexagon logo at the given pixel size."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy, r = size / 2, size / 2, size / 2 - 1

    # Filled amber hexagon
    hex_pts = [
        (cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a)))
        for a in range(-30, 330, 60)  # flat-top orientation
    ]
    draw.polygon(hex_pts, fill=(245, 158, 11, 255))  # #f59e0b

    # Three small inner hexagons (honeycomb cells) in white/semi-transparent
    inner_r = r * 0.28
    cell_offsets = [
        (0, -r * 0.32),                          # top
        (r * 0.28, r * 0.16),                    # bottom-right
        (-r * 0.28, r * 0.16),                   # bottom-left
    ]
    for dx, dy in cell_offsets:
        pts = [
            (cx + dx + inner_r * math.cos(math.radians(a)),
             cy + dy + inner_r * math.sin(math.radians(a)))
            for a in range(-30, 330, 60)
        ]
        draw.polygon(pts, fill=(255, 255, 255, 180))

    return img


def make_qr_png(data: str) -> bytes:
    """
    Generate a QR code PNG with the HivePulse logo centred on top.

    Uses ERROR_CORRECT_H (30 % recovery) so the logo (≤20 % of the image)
    doesn't make the code unreadable.
    """
    qr = qrcode.QRCode(
        error_correction=ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    qr_img: Image.Image = qr.make_image(
        fill_color="black", back_color="white"
    ).convert("RGBA")

    # Logo: 20 % of QR width
    logo_size = qr_img.size[0] // 5
    logo = _make_logo(logo_size)

    pos = (
        (qr_img.size[0] - logo_size) // 2,
        (qr_img.size[1] - logo_size) // 2,
    )
    qr_img.paste(logo, pos, mask=logo.split()[3])

    buf = io.BytesIO()
    qr_img.convert("RGB").save(buf, format="PNG")
    buf.seek(0)
    return buf.read()
