"""Draw the Play Store graphics from the brand logo.

Google Play wants a 512x512 icon and a 1024x500 feature graphic as bitmaps, and neither
exists as such — public/brand/ holds SVGs and the Android launcher is a vector drawable.
Rather than exporting by hand once and losing the recipe, this redraws both from the same
geometry as public/brand/hivepulse-logo.svg.

    python scripts/make_store_graphics.py

Writes public/brand/play-icon-512.png and public/brand/play-feature-1024x500.png.

Deliberately wordless apart from the brand name: text on a feature graphic would need one
version per language, and "HivePulse" is the same in all four.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

AMBER = (245, 158, 11)
FOREST = (15, 45, 28)
WHITE = (255, 255, 255)

REPO = Path(__file__).resolve().parents[1]
BRAND = REPO / "public" / "brand"
FONTS = REPO / "android" / "app" / "src" / "main" / "res" / "font"

# The logo lives in a 44x44 box; every coordinate below is from that SVG.
BOX = 44.0
OUTER_HEX = [(22, 2), (39.12, 12), (39.12, 32), (22, 42), (4.88, 32), (4.88, 12)]
INNER_RULE = [(22, 4.5), (37, 13.5), (37, 30.5), (22, 39.5), (7, 30.5), (7, 13.5)]
CELLS = [
    [(22, 11), (26.76, 13.75), (26.76, 19.25), (22, 22), (17.24, 19.25), (17.24, 13.75)],
    [(17.24, 19.25), (22, 22), (22, 27.5), (17.24, 30.25), (12.48, 27.5), (12.48, 22)],
    [(26.76, 19.25), (31.52, 22), (31.52, 27.5), (26.76, 30.25), (22, 27.5), (22, 22)],
]
PULSE = [
    ((6, 27), (12, 27), (15, 24), (20, 25)),
    ((20, 25), (25, 26), (27, 17), (31, 15)),
    ((31, 15), (34, 14), (36.5, 13.5), (36.5, 13.5)),
]
PULSE_DOT = (36.5, 13.5, 2)


def _bezier(p0, p1, p2, p3, steps=48):
    """Cubic Bezier as a polyline — Pillow draws lines, not curves."""
    points = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        x = u**3 * p0[0] + 3 * u**2 * t * p1[0] + 3 * u * t**2 * p2[0] + t**3 * p3[0]
        y = u**3 * p0[1] + 3 * u**2 * t * p1[1] + 3 * u * t**2 * p2[1] + t**3 * p3[1]
        points.append((x, y))
    return points


def draw_mark(base, size, offset=(0, 0)):
    """Draw the hex mark `size` wide with its top-left corner at `offset`, onto `base`.

    Two layers, composited: ImageDraw with an RGBA ink *replaces* the pixel including its
    alpha instead of blending it, so the translucent comb would come out solid white if it
    were drawn straight onto the amber.
    """
    k = size / BOX

    def pt(p):
        return (offset[0] + p[0] * k, offset[1] + p[1] * k)

    def scaled(points):
        return [pt(p) for p in points]

    hex_layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    ImageDraw.Draw(hex_layer).polygon(scaled(OUTER_HEX), fill=AMBER + (255,))
    base.alpha_composite(hex_layer)

    detail = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(detail)

    draw.line(scaled(INNER_RULE) + [pt(INNER_RULE[0])], fill=(255, 255, 255, 46),
              width=max(1, round(1.0 * k)), joint="curve")

    for cell in CELLS:
        draw.polygon(scaled(cell), fill=(255, 255, 255, 42))
    for cell in CELLS:
        draw.line(scaled(cell) + [pt(cell[0])], fill=(255, 255, 255, 225),
                  width=max(1, round(1.1 * k)), joint="curve")

    for segment in PULSE:
        draw.line([pt(p) for p in _bezier(*segment)], fill=(255, 255, 255, 235),
                  width=max(1, round(1.4 * k)), joint="curve")

    cx, cy, r = PULSE_DOT
    centre = pt((cx, cy))
    radius = r * k
    draw.ellipse(
        [centre[0] - radius, centre[1] - radius, centre[0] + radius, centre[1] + radius],
        fill=(255, 255, 255, 243),
    )

    base.alpha_composite(detail)


def _render(size, paint, supersample=4):
    """Draw at 4x and downscale: Pillow has no antialiasing of its own."""
    big = (size[0] * supersample, size[1] * supersample)
    image = Image.new("RGBA", big, FOREST + (255,))
    paint(image, supersample)
    return image.resize(size, Image.LANCZOS)


def build_icon(path, size=512):
    def paint(image, s):
        mark = 0.78 * size * s
        inset = ((size * s) - mark) / 2
        draw_mark(image, mark, (inset, inset))

    icon = _render((size, size), paint)
    icon.convert("RGB").save(path, "PNG")
    print(f"{path.relative_to(REPO)}  {size}x{size}")


def build_feature(path, size=(1024, 500)):
    width, height = size

    def paint(image, s):
        # A faint comb across the background, so the panel is not a flat slab.
        pattern = Image.new("RGBA", image.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(pattern)
        step = 118 * s
        for row in range(-1, int(height * s / (step * 0.75)) + 2):
            for col in range(-1, int(width * s / step) + 2):
                x = col * step + (step / 2 if row % 2 else 0)
                y = row * step * 0.75
                pts = [
                    (x + step * 0.5, y), (x + step, y + step * 0.28),
                    (x + step, y + step * 0.75), (x + step * 0.5, y + step),
                    (x, y + step * 0.75), (x, y + step * 0.28),
                ]
                draw.line(pts + [pts[0]], fill=(255, 255, 255, 14), width=max(1, round(1.4 * s)))
        image.alpha_composite(pattern)

        mark = 196 * s
        mark_x = 104 * s
        draw_mark(image, mark, (mark_x, (height * s - mark) / 2))

        text = Image.new("RGBA", image.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(text)
        text_x = mark_x + mark + 58 * s
        bold = ImageFont.truetype(str(FONTS / "dm_sans_extrabold.ttf"), int(108 * s))
        baseline = height * s / 2 - 74 * s
        draw.text((text_x, baseline), "Hive", font=bold, fill=WHITE + (255,))
        hive_width = draw.textlength("Hive", font=bold)
        draw.text((text_x + hive_width, baseline), "Pulse", font=bold, fill=AMBER + (255,))

        medium = ImageFont.truetype(str(FONTS / "dm_sans_medium.ttf"), int(40 * s))
        draw.text((text_x + 4 * s, baseline + 142 * s), "hivepulse.multihead.de",
                  font=medium, fill=(255, 255, 255, 160))
        image.alpha_composite(text)

    feature = _render(size, paint)
    # Play rejects alpha on the feature graphic.
    feature.convert("RGB").save(path, "PNG")
    print(f"{path.relative_to(REPO)}  {width}x{height}")


if __name__ == "__main__":
    BRAND.mkdir(parents=True, exist_ok=True)
    build_icon(BRAND / "play-icon-512.png")
    build_feature(BRAND / "play-feature-1024x500.png")
