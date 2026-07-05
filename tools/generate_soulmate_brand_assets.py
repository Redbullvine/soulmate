from pathlib import Path
import math
import random
import shutil

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
GENERATED_BG = Path(
    r"C:\Users\redbu\.codex\generated_images\019f2e6d-e5bc-7f53-82cd-31a99cc0dc46"
    r"\ig_0759fc935f050f8b016a4953dbabec81958aec273861ebc9c1.png"
)
BACKGROUND = ASSETS / "soulmate-cosmic-background.png"

FONT_DIR = Path(r"C:\Windows\Fonts")
FONT_WORD = FONT_DIR / "bahnschrift.ttf"
FONT_BODY = FONT_DIR / "segoeui.ttf"
FONT_ROMANCE_BOLD = FONT_DIR / "Candarab.ttf"

BLUE = (49, 222, 255)
DEEP_BLUE = (26, 97, 255)
VIOLET = (129, 77, 255)
PINK = (255, 84, 184)
WHITE = (255, 255, 255)
TAGLINE = "\u201cPromise me you will always be the best part of me\u201d"

try:
    RESAMPLE = Image.Resampling.LANCZOS
except AttributeError:
    RESAMPLE = Image.LANCZOS


def lerp(a, b, t):
    return a + (b - a) * t


def mix(c1, c2, t):
    return tuple(int(lerp(c1[i], c2[i], t)) for i in range(3))


def color_ramp(p, alpha=255):
    p = max(0, min(1, p))
    if p < 0.48:
        c = mix(BLUE, VIOLET, p / 0.48)
    else:
        c = mix(VIOLET, PINK, (p - 0.48) / 0.52)
    return (*c, alpha)


def add_soft_circle(img, center, radius, color, max_alpha=160, steps=52):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer, "RGBA")
    cx, cy = center
    for i in range(steps, 0, -1):
        t = i / steps
        r = radius * t
        a = int(max_alpha * (1 - t) ** 1.8)
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(*color, a))
    img.alpha_composite(layer)


def add_vignette(img, strength=170):
    w, h = img.size
    vignette = Image.new("L", (w, h), 0)
    pix = vignette.load()
    cx, cy = w / 2, h * 0.48
    for y in range(h):
        for x in range(w):
            dx = (x - cx) / cx
            dy = (y - cy) / cy
            d = min(1, math.sqrt(dx * dx + dy * dy) / 1.05)
            pix[x, y] = int((d**1.75) * strength)
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    overlay.putalpha(vignette)
    img.alpha_composite(overlay)


def gradient_rect(size, left, right):
    w, h = size
    img = Image.new("RGBA", size)
    pix = img.load()
    for x in range(w):
        p = x / max(1, w - 1)
        c = tuple(int(lerp(left[i], right[i], p)) for i in range(4))
        for y in range(h):
            pix[x, y] = c
    return img


def ramp_rect(size):
    w, h = size
    img = Image.new("RGBA", size)
    pix = img.load()
    for x in range(w):
        c = color_ramp(x / max(1, w - 1), 255)
        for y in range(h):
            pix[x, y] = c
    return img


def text_size(text, font, stroke_width=0):
    d = ImageDraw.Draw(Image.new("RGBA", (20, 20)))
    box = d.textbbox((0, 0), text, font=font, stroke_width=stroke_width)
    return box[2] - box[0], box[3] - box[1], box


def fit_font(path, text, max_width, start, min_size=18):
    size = start
    while size >= min_size:
        font = ImageFont.truetype(str(path), size)
        width, _, _ = text_size(text, font, stroke_width=max(1, size // 58))
        if width <= max_width:
            return font
        size -= 2
    return ImageFont.truetype(str(path), min_size)


def draw_gradient_text(
    img,
    text,
    font,
    xy,
    grad_left,
    grad_right,
    stroke=(8, 12, 28, 210),
    stroke_width=2,
    glow=None,
    align="left",
):
    x, y = xy
    tw, th, bbox = text_size(text, font, stroke_width)
    if align == "center":
        x -= tw // 2
    elif align == "right":
        x -= tw

    if glow:
        for color, blur, alpha, grow in glow:
            layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
            d = ImageDraw.Draw(layer)
            d.text(
                (x - bbox[0], y - bbox[1]),
                text,
                font=font,
                fill=(*color, alpha),
                stroke_width=stroke_width + grow,
                stroke_fill=(*color, alpha),
            )
            img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur)))

    d = ImageDraw.Draw(img)
    d.text(
        (x - bbox[0], y - bbox[1]),
        text,
        font=font,
        fill=(255, 255, 255, 255),
        stroke_width=stroke_width,
        stroke_fill=stroke,
    )

    mask = Image.new("L", img.size, 0)
    md = ImageDraw.Draw(mask)
    md.text((x - bbox[0], y - bbox[1]), text, font=font, fill=255)
    img.paste(gradient_rect(img.size, grad_left, grad_right), (0, 0), mask)
    return x, y, tw, th


def draw_plain_text(
    img,
    text,
    font,
    xy,
    fill,
    stroke=None,
    stroke_width=0,
    align="center",
    glow=None,
):
    x, y = xy
    tw, th, bbox = text_size(text, font, stroke_width)
    if align == "center":
        x -= tw // 2
    elif align == "right":
        x -= tw

    if glow:
        for color, blur, alpha, grow in glow:
            layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
            d = ImageDraw.Draw(layer)
            d.text(
                (x - bbox[0], y - bbox[1]),
                text,
                font=font,
                fill=(*color, alpha),
                stroke_width=stroke_width + grow,
                stroke_fill=(*color, alpha),
            )
            img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur)))

    d = ImageDraw.Draw(img)
    d.text(
        (x - bbox[0], y - bbox[1]),
        text,
        font=font,
        fill=fill,
        stroke_width=stroke_width,
        stroke_fill=stroke or fill,
    )
    return x, y, tw, th


def clip_low_alpha(img, threshold=2):
    if img.mode != "RGBA":
        return img
    r, g, b, a = img.split()
    a = a.point(lambda p: 0 if p <= threshold else p)
    return Image.merge("RGBA", (r, g, b, a))


def lemniscate_points(w, h, n=1000):
    cx, cy = w / 2, h / 2
    a = w * 0.41
    b = h * 0.74
    pts = []
    for i in range(n + 1):
        t = -math.pi + 2 * math.pi * i / n
        pts.append((cx + a * math.sin(t), cy + b * math.sin(t) * math.cos(t), t))
    return pts, cx, cy, a


def draw_gradient_path(layer, pts, width, alpha=255, y_offset=0, only=None, dark=False):
    mask = Image.new("L", layer.size, 0)
    d = ImageDraw.Draw(mask)
    line = [(x, y + y_offset) for x, y, _ in pts]
    try:
        d.line(line, fill=255, width=width, joint="curve")
    except TypeError:
        d.line(line, fill=255, width=width)
    radius = width / 2
    step = max(1, len(line) // 360)
    for x, y in line[::step]:
        d.ellipse((x - radius, y - radius, x + radius, y + radius), fill=255)

    if only:
        clip = Image.new("L", layer.size, 0)
        cd = ImageDraw.Draw(clip)
        if only == "top":
            cd.rectangle((0, 0, layer.size[0], layer.size[1] // 2), fill=255)
        elif only == "bottom":
            cd.rectangle((0, layer.size[1] // 2, layer.size[0], layer.size[1]), fill=255)
        mask = ImageChops.multiply(mask, clip)

    if alpha < 255:
        mask = mask.point(lambda p: int(p * alpha / 255))

    fill = Image.new("RGBA", layer.size, (3, 8, 24, 255)) if dark else ramp_rect(layer.size)
    layer.paste(fill, (0, 0), mask)


def draw_star(draw, x, y, r, color, alpha=180):
    fill = (*color, alpha)
    draw.line((x - r, y, x + r, y), fill=fill, width=max(1, int(r * 0.12)))
    draw.line((x, y - r, x, y + r), fill=fill, width=max(1, int(r * 0.12)))
    draw.ellipse((x - r * 0.18, y - r * 0.18, x + r * 0.18, y + r * 0.18), fill=(*color, min(255, alpha + 45)))


def render_infinity_mark(w, h, simplified=False, light=False):
    scale = 3 if min(w, h) < 500 else 2
    W, H = w * scale, h * scale
    mark = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pts, cx, cy, a = lemniscate_points(W, H, n=1200 if not simplified else 720)
    base_width = int(H * (0.195 if not simplified else 0.225))

    if not simplified:
        glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        draw_gradient_path(glow, pts, int(base_width * 1.8), alpha=95)
        mark.alpha_composite(glow.filter(ImageFilter.GaussianBlur(int(H * 0.055))))

        glow2 = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        draw_gradient_path(glow2, pts, int(base_width * 1.18), alpha=120)
        mark.alpha_composite(glow2.filter(ImageFilter.GaussianBlur(int(H * 0.022))))

    if not simplified:
        shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        draw_gradient_path(
            shadow,
            pts,
            int(base_width * 1.04),
            alpha=54,
            y_offset=int(base_width * 0.12),
            only="bottom",
            dark=True,
        )
        mark.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(int(H * 0.012))))

    body = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw_gradient_path(body, pts, base_width, alpha=245 if light else 255)
    mark.alpha_composite(body)

    if not simplified:
        soft_shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        draw_gradient_path(
            soft_shadow,
            pts,
            int(base_width * 0.31),
            alpha=58,
            y_offset=int(base_width * 0.24),
            only="bottom",
            dark=True,
        )
        mark.alpha_composite(soft_shadow.filter(ImageFilter.GaussianBlur(int(H * 0.006))))

        highlight = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        draw_gradient_path(
            highlight,
            pts,
            int(base_width * 0.24),
            alpha=130,
            y_offset=-int(base_width * 0.23),
            only="top",
        )
        mark.alpha_composite(highlight.filter(ImageFilter.GaussianBlur(int(H * 0.005))))

        left_core = (cx - a * 0.68, cy + H * 0.005)
        right_core = (cx + a * 0.68, cy + H * 0.005)
        add_soft_circle(mark, left_core, H * 0.175, BLUE, max_alpha=125)
        add_soft_circle(mark, right_core, H * 0.175, PINK, max_alpha=125)
        add_soft_circle(mark, left_core, H * 0.073, (230, 255, 255), max_alpha=190)
        add_soft_circle(mark, right_core, H * 0.073, (255, 230, 250), max_alpha=190)

        d = ImageDraw.Draw(mark, "RGBA")
        for core, c in [(left_core, BLUE), (right_core, PINK)]:
            x, y = core
            r = H * 0.027
            d.ellipse((x - r, y - r, x + r, y + r), fill=(*mix(c, WHITE, 0.72), 235))
            d.ellipse((x - r * 0.38, y - r * 0.38, x + r * 0.38, y + r * 0.38), fill=(255, 255, 255, 245))
        draw_star(d, cx - a * 0.48, cy - H * 0.21, H * 0.042, (190, 250, 255), 160)
        draw_star(d, cx + a * 0.52, cy - H * 0.18, H * 0.04, (255, 205, 246), 160)

    return mark.resize((w, h), RESAMPLE)


def prepare_background():
    if not BACKGROUND.exists() and GENERATED_BG.exists():
        shutil.copy2(GENERATED_BG, BACKGROUND)

    if BACKGROUND.exists():
        bg = Image.open(BACKGROUND).convert("RGBA")
    else:
        bg = Image.new("RGBA", (1920, 1080), (6, 7, 22, 255))
        d = ImageDraw.Draw(bg, "RGBA")
        random.seed(7)
        for _ in range(160):
            x = random.randrange(1920)
            y = random.randrange(1080)
            r = random.randrange(1, 4)
            d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 255, random.randrange(80, 180)))

    bg = ImageOps.fit(bg, (1920, 1080), method=RESAMPLE, centering=(0.5, 0.5))
    bg.alpha_composite(Image.new("RGBA", bg.size, (2, 4, 15, 56)))
    add_vignette(bg, 150)

    plate = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(plate, "RGBA")
    d.ellipse((350, 195, 1570, 890), fill=(2, 7, 22, 78))
    bg.alpha_composite(plate.filter(ImageFilter.GaussianBlur(120)))
    return bg


def draw_soul_thread(img, y, width=920):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer, "RGBA")
    x0 = (img.size[0] - width) // 2
    for i in range(width):
        p = i / max(1, width - 1)
        alpha = int(110 * math.sin(math.pi * p) ** 0.7)
        d.line((x0 + i, y, x0 + i, y + 1), fill=color_ramp(p, alpha), width=2)
    img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(0.6)))


def make_cover(option="a"):
    img = prepare_background()
    mark = render_infinity_mark(900, 430)
    img.alpha_composite(mark, ((1920 - mark.size[0]) // 2, 65))

    if option == "a":
        title = "SOULMATE"
        title_font = fit_font(FONT_WORD, title, 1180, 202, 120)
        _, title_h, _ = text_size(title, title_font, stroke_width=4)
        title_y = 482
        draw_gradient_text(
            img,
            title,
            title_font,
            (960, title_y),
            (255, 255, 255, 255),
            (216, 239, 255, 255),
            stroke=(6, 10, 25, 230),
            stroke_width=4,
            align="center",
            glow=[(BLUE, 16, 98, 2), (PINK, 18, 82, 2), (WHITE, 4, 72, 0)],
        )
        draw_soul_thread(img, title_y + title_h + 12, 860)
        sub_font = ImageFont.truetype(str(FONT_ROMANCE_BOLD), 66)
        sub_y = title_y + title_h + 38
        draw_plain_text(
            img,
            "Find You Again",
            sub_font,
            (960, sub_y),
            (246, 240, 255, 242),
            stroke=(8, 10, 25, 160),
            stroke_width=1,
            glow=[(PINK, 18, 80, 1), (BLUE, 14, 58, 1)],
        )
        tag_font = fit_font(FONT_BODY, TAGLINE, 1180, 42, 30)
        draw_plain_text(
            img,
            TAGLINE,
            tag_font,
            (960, sub_y + 86),
            (242, 245, 255, 232),
            stroke=(5, 8, 21, 190),
            stroke_width=1,
            glow=[(WHITE, 7, 38, 0)],
        )

    elif option == "b":
        title = "Soulmate: Find You Again"
        title_font = fit_font(FONT_WORD, title, 1300, 124, 70)
        title_y = 520
        draw_gradient_text(
            img,
            title,
            title_font,
            (960, title_y),
            (255, 255, 255, 255),
            (255, 217, 246, 255),
            stroke=(6, 10, 25, 230),
            stroke_width=3,
            align="center",
            glow=[(BLUE, 15, 82, 1), (PINK, 17, 82, 1), (WHITE, 4, 58, 0)],
        )
        _, title_h, _ = text_size(title, title_font, stroke_width=3)
        draw_soul_thread(img, title_y + title_h + 18, 1000)
        tag_font = fit_font(FONT_BODY, TAGLINE, 1180, 44, 30)
        draw_plain_text(
            img,
            TAGLINE,
            tag_font,
            (960, title_y + title_h + 56),
            (244, 246, 255, 232),
            stroke=(5, 8, 21, 190),
            stroke_width=1,
            glow=[(WHITE, 7, 38, 0)],
        )

    elif option == "c":
        title = "soulmate"
        title_font = fit_font(FONT_WORD, title, 1020, 180, 110)
        title_y = 505
        draw_gradient_text(
            img,
            title,
            title_font,
            (960, title_y),
            (255, 255, 255, 255),
            (226, 243, 255, 255),
            stroke=(6, 10, 25, 226),
            stroke_width=4,
            align="center",
            glow=[(BLUE, 15, 92, 2), (PINK, 17, 82, 2), (WHITE, 4, 62, 0)],
        )
        _, title_h, _ = text_size(title, title_font, stroke_width=4)
        draw_soul_thread(img, title_y + title_h + 13, 720)
        sub_font = ImageFont.truetype(str(FONT_ROMANCE_BOLD), 68)
        draw_plain_text(
            img,
            "Find You Again",
            sub_font,
            (960, title_y + title_h + 42),
            (248, 240, 255, 240),
            stroke=(8, 10, 25, 160),
            stroke_width=1,
            glow=[(PINK, 18, 76, 1), (BLUE, 14, 56, 1)],
        )

    return img.convert("RGB")


def make_app_icon():
    size = 1024
    icon = Image.new("RGBA", (size, size), (5, 8, 24, 255))
    d = ImageDraw.Draw(icon, "RGBA")
    for x in range(size):
        p = x / (size - 1)
        d.line((x, 0, x, size), fill=(*mix((8, 15, 42), (47, 9, 54), p), 255))

    random.seed(42)
    for _ in range(105):
        x = random.randrange(size)
        y = random.randrange(size)
        r = random.choice([1, 1, 2, 2, 3])
        col = (210, 245, 255) if x < size // 2 else (255, 210, 245)
        d.ellipse((x - r, y - r, x + r, y + r), fill=(*col, random.randrange(55, 170)))

    add_soft_circle(icon, (size * 0.38, size * 0.49), 360, BLUE, 92)
    add_soft_circle(icon, (size * 0.62, size * 0.49), 360, PINK, 92)
    add_vignette(icon, 190)
    mark = render_infinity_mark(820, 450)
    icon.alpha_composite(mark, ((size - 820) // 2, 282))
    d = ImageDraw.Draw(icon, "RGBA")
    d.rounded_rectangle((18, 18, size - 18, size - 18), radius=190, outline=(255, 255, 255, 38), width=4)
    return icon.convert("RGB")


def make_horizontal_logo(light=False, dark_bg=False):
    if dark_bg:
        w, h = 1600, 600
        img = Image.new("RGBA", (w, h), (5, 8, 24, 255))
        d = ImageDraw.Draw(img, "RGBA")
        for x in range(w):
            p = x / (w - 1)
            d.line((x, 0, x, h), fill=(*mix((4, 11, 31), (35, 8, 43), p), 255))
        add_soft_circle(img, (w * 0.37, h * 0.48), 360, BLUE, 56)
        add_soft_circle(img, (w * 0.65, h * 0.48), 360, PINK, 58)
        add_vignette(img, 150)
        mark = render_infinity_mark(420, 230)
        img.alpha_composite(mark, (165, 162))
        font = fit_font(FONT_WORD, "soulmate", 750, 188, 130)
        draw_gradient_text(
            img,
            "soulmate",
            font,
            (620, 205),
            (255, 255, 255, 255),
            (228, 243, 255, 255),
            stroke=(5, 8, 22, 218),
            stroke_width=3,
            align="left",
            glow=[(BLUE, 12, 72, 1), (PINK, 14, 66, 1)],
        )
        sub_font = ImageFont.truetype(str(FONT_ROMANCE_BOLD), 46)
        draw_plain_text(
            img,
            "Find You Again",
            sub_font,
            (1010, 385),
            (244, 237, 255, 232),
            stroke=(5, 8, 22, 160),
            stroke_width=1,
            glow=[(PINK, 12, 55, 1)],
        )
        return img.convert("RGB")

    if light:
        w, h = 1200, 360
        img = Image.new("RGBA", (w, h), (250, 251, 255, 255))
        d = ImageDraw.Draw(img, "RGBA")
        d.rounded_rectangle((32, 32, w - 32, h - 32), radius=36, fill=(255, 255, 255, 255), outline=(218, 225, 240, 255), width=2)
        mark = render_infinity_mark(270, 160, simplified=True, light=True)
        img.alpha_composite(mark, (106, 100))
        font = fit_font(FONT_WORD, "soulmate", 650, 140, 94)
        draw_gradient_text(
            img,
            "soulmate",
            font,
            (410, 101),
            (18, 32, 54, 255),
            (78, 52, 94, 255),
            stroke=(255, 255, 255, 255),
            stroke_width=1,
            align="left",
        )
        sub_font = ImageFont.truetype(str(FONT_BODY), 30)
        draw_plain_text(img, "Find You Again", sub_font, (735, 238), (87, 75, 108, 235))
        return img.convert("RGB")

    w, h = 1500, 430
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    mark = render_infinity_mark(405, 220)
    img.alpha_composite(mark, (86, 100))
    font = fit_font(FONT_WORD, "soulmate", 860, 190, 120)
    draw_gradient_text(
        img,
        "soulmate",
        font,
        (510, 118),
        (255, 255, 255, 255),
        (227, 243, 255, 255),
        stroke=(5, 8, 21, 210),
        stroke_width=3,
        align="left",
        glow=[(BLUE, 13, 68, 1), (PINK, 15, 62, 1), (WHITE, 3, 42, 0)],
    )
    return img


def make_favicon(size=256):
    img = Image.new("RGBA", (size, size), (6, 9, 28, 255))
    d = ImageDraw.Draw(img, "RGBA")
    for x in range(size):
        p = x / (size - 1)
        d.line((x, 0, x, size), fill=(*mix((7, 16, 42), (45, 9, 54), p), 255))
    add_soft_circle(img, (size * 0.38, size * 0.5), size * 0.25, BLUE, 70, steps=22)
    add_soft_circle(img, (size * 0.62, size * 0.5), size * 0.25, PINK, 70, steps=22)
    mark = render_infinity_mark(int(size * 0.88), int(size * 0.52), simplified=True)
    img.alpha_composite(mark, ((size - mark.size[0]) // 2, (size - mark.size[1]) // 2))
    return img


def save_all():
    ASSETS.mkdir(exist_ok=True)
    if not BACKGROUND.exists() and GENERATED_BG.exists():
        shutil.copy2(GENERATED_BG, BACKGROUND)

    cover_a = make_cover("a")
    cover_a.save(ASSETS / "soulmate-cover-main.png", quality=95)
    cover_a.save(ASSETS / "soulmate-cover-option-a.png", quality=95)
    make_cover("b").save(ASSETS / "soulmate-cover-option-b.png", quality=95)
    make_cover("c").save(ASSETS / "soulmate-cover-option-c.png", quality=95)

    make_app_icon().save(ASSETS / "soulmate-app-icon.png", quality=95)
    clip_low_alpha(render_infinity_mark(1200, 720)).save(ASSETS / "soulmate-logo-mark.png")
    clip_low_alpha(make_horizontal_logo()).save(ASSETS / "soulmate-logo-horizontal.png")
    make_horizontal_logo(dark_bg=True).save(ASSETS / "soulmate-logo-dark.png", quality=95)
    make_horizontal_logo(light=True).save(ASSETS / "soulmate-logo-light-simple.png", quality=95)

    fav256 = make_favicon(256)
    fav256.save(ASSETS / "soulmate-favicon.png")
    make_favicon(64).save(ASSETS / "favicon.png")
    fav256.save(ASSETS / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])

    files = sorted(ASSETS.glob("soulmate-*.png")) + [ASSETS / "favicon.png", ASSETS / "favicon.ico"]
    for path in files:
        if not path.exists():
            continue
        try:
            img = Image.open(path)
            print(f"{path.name}\t{img.size[0]}x{img.size[1]}\t{img.mode}\t{path.stat().st_size}")
        except Exception:
            print(f"{path.name}\t{path.stat().st_size}")


if __name__ == "__main__":
    save_all()
