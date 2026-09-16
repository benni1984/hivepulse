"""QR code generation with HivePulse logo overlay."""

import io
import math

import qrcode
from qrcode.constants import ERROR_CORRECT_H
from PIL import Image, ImageDraw


def _cubic(p0, p1, p2, p3, steps: int = 24):
    """Sample a cubic Bézier segment — PIL has no path primitive."""
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        yield (
            u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
            u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1],
        )


def _make_logo(size: int) -> Image.Image:
    """Draw the HivePulse mark at the given pixel size.

    Same geometry as `android/.../ic_hivepulse.xml` and the `#s-hivepulse` symbol in
    hivepulse-redesign/bundle.html (44-unit grid): amber hexagon, inner ring, three outlined
    honeycomb cells and the stats sparkline. Drawn at 4× and downsampled so the thin
    strokes stay clean at QR-overlay sizes.
    """
    scale = 4
    unit = size * scale / 44.0
    canvas = (size * scale, size * scale)

    def pts(coords):
        return [(x * unit, y * unit) for x, y in coords]

    def width(w):
        return max(1, round(w * unit))

    # Amber hex badge
    badge = Image.new("RGBA", canvas, (0, 0, 0, 0))
    ImageDraw.Draw(badge).polygon(
        pts([(22, 2), (39.12, 12), (39.12, 32), (22, 42), (4.88, 32), (4.88, 12)]),
        fill=(245, 158, 11, 255),  # #f59e0b
    )

    # Translucent details go on their own layer: ImageDraw replaces pixels instead of blending, so
    # drawing them straight onto the badge punched holes into the amber (hollow ring, white blobs).
    details = Image.new("RGBA", canvas, (0, 0, 0, 0))
    draw = ImageDraw.Draw(details)

    # Inner ring (depth)
    draw.polygon(pts([(22, 4.5), (37, 13.5), (37, 30.5), (22, 39.5), (7, 30.5), (7, 13.5)]),
                 outline=(255, 255, 255, 30), width=width(1))

    # Honeycomb cells
    for cell in (
        [(22, 11), (26.76, 13.75), (26.76, 19.25), (22, 22), (17.24, 19.25), (17.24, 13.75)],
        [(17.24, 19.25), (22, 22), (22, 27.5), (17.24, 30.25), (12.48, 27.5), (12.48, 22)],
        [(26.76, 19.25), (31.52, 22), (31.52, 27.5), (26.76, 30.25), (22, 27.5), (22, 22)],
    ):
        draw.polygon(pts(cell), fill=(255, 255, 255, 46), outline=(255, 255, 255, 255), width=width(1.4))

    # Stats sparkline
    spark = list(_cubic((6, 27), (12, 27), (15, 24), (20, 25))) \
        + list(_cubic((20, 25), (25, 26), (27, 17), (31, 15))) \
        + list(_cubic((31, 15), (34, 14), (36.5, 13.5), (36.5, 13.5)))
    draw.line(pts(spark), fill=(255, 255, 255, 230), width=width(1.5), joint="curve")

    for (x, y), r, alpha in (((6, 27), 1.5, 140), ((36.5, 13.5), 2.2, 242)):
        draw.ellipse([((x - r) * unit, (y - r) * unit), ((x + r) * unit, (y + r) * unit)],
                     fill=(255, 255, 255, alpha))

    return Image.alpha_composite(badge, details).resize((size, size), Image.LANCZOS)


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

    # Punch a white quiet zone before pasting: without it the code pattern stayed visible around and
    # between the hexagon's edges, so the logo read as a smudge instead of a mark.
    logo_size = int(qr_img.size[0] * 0.22)
    pad = max(4, logo_size // 8)
    box = logo_size + 2 * pad
    box_x = (qr_img.size[0] - box) // 2
    box_y = (qr_img.size[1] - box) // 2
    ImageDraw.Draw(qr_img).rounded_rectangle(
        [(box_x, box_y), (box_x + box, box_y + box)],
        radius=box // 6,
        fill=(255, 255, 255, 255),
    )

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
