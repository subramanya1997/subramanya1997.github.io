#!/usr/bin/env python3
"""
Generate Open Graph / social share cards for blog posts.

Design
------
1200x630 dark editorial card:

    | accent rail
    |  subramanya.ai                                    (wordmark, top-left)
    |
    |  TOPIC                                            (eyebrow, first tag)
    |  A Dominant Title That Wraps                      (display type, bottom-
    |  Into Balanced Lines                               anchored above the rule)
    |  ------------------------------------------------ (hairline)
    |  Subramanya N                          Aug 17, 2026

The title is the only loud element. Everything else is quiet: one accent hue,
one hairline, generous and consistent margins.

Output paths never change
-------------------------
Every card is written to the exact path the post's front matter already points
at, so existing `og:image` meta tags keep resolving. A post is treated as
"has a generated card" when its front-matter `image` basename equals
``<slug>.png`` (that is how every generated card in this repo is named); posts
pointing at a hand-made illustration, diagram, or photo are skipped.
"""

from __future__ import annotations

import argparse
import re
import sys
from datetime import date, datetime
from pathlib import Path
from typing import Any, Iterable

import yaml
from PIL import Image, ImageDraw, ImageFont

PROJECT_ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = PROJECT_ROOT / "_posts"
OUTPUT_DIR = PROJECT_ROOT / "assets" / "images"
FONT_DIR = Path(__file__).resolve().parent / "fonts"

# --- canvas -----------------------------------------------------------------
WIDTH = 1200
HEIGHT = 630

RAIL_WIDTH = 10         # full-height accent rail on the left edge
MARGIN_X = 88           # content left/right margin — everything aligns here
CONTENT_WIDTH = WIDTH - (2 * MARGIN_X)

WORDMARK_TOP = 62
CONTENT_TOP = 140       # top of the eyebrow/title band
BAND_BOTTOM = 462       # bottom of the eyebrow/title band
RULE_Y = 506            # hairline above the footer
FOOTER_TOP = 536        # leaves the same optical margin at the foot as the head

# --- palette ----------------------------------------------------------------
BG = (12, 16, 24)             # near-black slate
TITLE = (244, 246, 250)
WORDMARK = (226, 232, 240)
MUTED = (129, 142, 165)
HAIRLINE = (33, 41, 56)
ACCENT = (124, 143, 255)      # muted indigo
ACCENT_DIM = (72, 86, 158)

# --- typography -------------------------------------------------------------
TITLE_SIZES = (78, 72, 66, 60, 54, 48, 44, 40)
TITLE_MAX_LINES = 4
TITLE_LEADING = 1.14

EYEBROW_SIZE = 22
EYEBROW_TRACKING = 2.6
EYEBROW_GAP = 30        # space between eyebrow baseline block and title block

WORDMARK_SIZE = 29
FOOTER_SIZE = 25


# ---------------------------------------------------------------------------
# fonts
# ---------------------------------------------------------------------------
_FONT_CACHE: dict[tuple[str, int], ImageFont.FreeTypeFont] = {}

# Bundled Inter (SIL Open Font License, see scripts/fonts/Inter-LICENSE.txt).
# These are build-time only; nothing here is served to the browser.
FONT_FILES: dict[str, tuple[str, ...]] = {
    "display": ("InterDisplay-Bold.ttf",),
    "display-semibold": ("InterDisplay-SemiBold.ttf",),
    "semibold": ("Inter-SemiBold.ttf",),
    "medium": ("Inter-Medium.ttf",),
    "regular": ("Inter-Regular.ttf",),
}

# Used only if the bundled fonts are missing.
FALLBACKS: dict[str, tuple[str, ...]] = {
    "display": ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", "DejaVuSans-Bold.ttf"),
    "display-semibold": ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", "DejaVuSans-Bold.ttf"),
    "semibold": ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", "DejaVuSans-Bold.ttf"),
    "medium": ("/System/Library/Fonts/Supplemental/Arial.ttf", "DejaVuSans.ttf"),
    "regular": ("/System/Library/Fonts/Supplemental/Arial.ttf", "DejaVuSans.ttf"),
}


def font(style: str, size: int) -> ImageFont.FreeTypeFont:
    key = (style, size)
    cached = _FONT_CACHE.get(key)
    if cached is not None:
        return cached

    candidates: list[str] = [str(FONT_DIR / name) for name in FONT_FILES[style]]
    candidates.extend(FALLBACKS[style])

    for path in candidates:
        try:
            loaded = ImageFont.truetype(path, size=size)
        except OSError:
            continue
        _FONT_CACHE[key] = loaded
        return loaded

    raise RuntimeError(
        f"No usable font for style {style!r}. Expected Inter under {FONT_DIR}."
    )


# ---------------------------------------------------------------------------
# text layout
# ---------------------------------------------------------------------------
def smarten(text: str) -> str:
    """Straight quotes look like a bug at 78px. Match the site's kramdown output."""
    text = re.sub(r'"(?=[^\s])', "“", text)
    text = text.replace('"', "”")
    text = re.sub(r"(?<=[A-Za-z])'(?=[A-Za-z])", "’", text)
    text = re.sub(r"'(?=[^\s])", "‘", text)
    return text.replace("'", "’")


def text_width(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont) -> float:
    return draw.textlength(text, font=fnt)


def break_long_word(
    draw: ImageDraw.ImageDraw,
    word: str,
    fnt: ImageFont.FreeTypeFont,
    max_width: float,
) -> list[str]:
    """Hard-split a single token that cannot fit on one line (long URLs, etc.)."""
    parts: list[str] = []
    current = ""
    for char in word:
        candidate = current + char
        if current and text_width(draw, candidate, fnt) > max_width:
            parts.append(current)
            current = char
        else:
            current = candidate
    if current:
        parts.append(current)
    return parts or [word]


def greedy_wrap(
    draw: ImageDraw.ImageDraw,
    text: str,
    fnt: ImageFont.FreeTypeFont,
    max_width: float,
) -> list[str]:
    words = text.split()
    if not words:
        return []

    lines: list[str] = []
    current = ""
    for word in words:
        if text_width(draw, word, fnt) > max_width:
            if current:
                lines.append(current)
                current = ""
            chunks = break_long_word(draw, word, fnt, max_width)
            lines.extend(chunks[:-1])
            current = chunks[-1]
            continue

        candidate = f"{current} {word}" if current else word
        if text_width(draw, candidate, fnt) <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def balanced_wrap(
    draw: ImageDraw.ImageDraw,
    text: str,
    fnt: ImageFont.FreeTypeFont,
    max_width: float,
) -> list[str]:
    """Wrap, then even out the ragged edge.

    Greedy wrapping loves to leave a one-word orphan on the last line. Binary
    search for the narrowest measure that still produces the same number of
    lines: that redistributes words upward and produces lines of similar
    length without changing the type size.
    """
    lines = greedy_wrap(draw, text, fnt, max_width)
    if len(lines) < 2:
        return lines

    target = len(lines)
    lo, hi = max_width * 0.55, max_width
    best = lines
    for _ in range(12):
        mid = (lo + hi) / 2
        candidate = greedy_wrap(draw, text, fnt, mid)
        if len(candidate) <= target:
            best = candidate
            hi = mid
        else:
            lo = mid
    return best


def split_at_colon(title: str) -> list[str] | None:
    """Prefer a line break after a title's colon — it is the natural caesura.

    Only when both halves carry real weight, so `Beyond "X": Y` breaks but
    `Note: hi` does not.
    """
    match = re.search(r":\s+", title)
    if not match:
        return None
    head = title[: match.start() + 1].strip()
    tail = title[match.end():].strip()
    if len(head) < 8 or len(tail) < 8:
        return None
    return [head, tail]


def layout_title(
    draw: ImageDraw.ImageDraw,
    title: str,
    max_width: float,
    max_height: float,
) -> tuple[ImageFont.FreeTypeFont, list[str], int]:
    """Pick the largest size at which the title fits the box, then wrap it well."""
    segments = split_at_colon(title)

    def wrap_at(size: int, use_segments: bool) -> list[str] | None:
        fnt = font("display", size)
        if use_segments and segments:
            lines: list[str] = []
            for segment in segments:
                lines.extend(balanced_wrap(draw, segment, fnt, max_width))
        else:
            lines = balanced_wrap(draw, title, fnt, max_width)
        if not lines:
            return None
        if len(lines) > TITLE_MAX_LINES:
            return None
        if len(lines) * round(size * TITLE_LEADING) > max_height:
            return None
        return lines

    # A colon break is worth one size step, not more: legibility beats phrasing.
    for index, size in enumerate(TITLE_SIZES):
        if segments:
            lines = wrap_at(size, use_segments=True)
            if lines is not None:
                return font("display", size), lines, size
        plain_size = TITLE_SIZES[max(0, index - 1)] if segments else size
        lines = wrap_at(plain_size, use_segments=False)
        if lines is not None:
            return font("display", plain_size), lines, plain_size

    # Nothing fits: smallest size, hard-clamped with an ellipsis.
    size = TITLE_SIZES[-1]
    fnt = font("display", size)
    lines = balanced_wrap(draw, title, fnt, max_width)[:TITLE_MAX_LINES]
    last = lines[-1].rstrip()
    while last and text_width(draw, last + "…", fnt) > max_width:
        last = last[:-1].rstrip()
    lines[-1] = (last + "…") if last else "…"
    return fnt, lines, size


def draw_tracked_text(
    draw: ImageDraw.ImageDraw,
    xy: tuple[float, float],
    text: str,
    fnt: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int],
    tracking: float,
) -> float:
    """Draw text with manual letter-spacing. Returns the advance width."""
    x, y = xy
    start = x
    for char in text:
        draw.text((x, y), char, font=fnt, fill=fill)
        x += draw.textlength(char, font=fnt) + tracking
    return (x - tracking) - start if text else 0.0


# ---------------------------------------------------------------------------
# the card
# ---------------------------------------------------------------------------
def create_card_image(
    title: str,
    eyebrow: str | None,
    author: str,
    date_label: str,
    output_path: Path,
) -> None:
    image = Image.new("RGB", (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(image)

    # The one accent gesture: a full-height rail on the left edge.
    draw.rectangle([(0, 0), (RAIL_WIDTH - 1, HEIGHT)], fill=ACCENT)

    # Wordmark, top-left, on the same left edge as everything else.
    draw.text(
        (MARGIN_X, WORDMARK_TOP),
        "subramanya.ai",
        font=font("semibold", WORDMARK_SIZE),
        fill=WORDMARK,
    )

    # Title band: eyebrow + title, optically centred in the band so a one-line
    # title and a four-line title both look deliberate.
    band_height = BAND_BOTTOM - CONTENT_TOP
    eyebrow_block = (EYEBROW_SIZE + EYEBROW_GAP) if eyebrow else 0

    title_font, title_lines, title_size = layout_title(
        draw,
        smarten(title),
        max_width=CONTENT_WIDTH,
        max_height=band_height - eyebrow_block,
    )

    line_height = round(title_size * TITLE_LEADING)
    title_height = line_height * len(title_lines)
    group_height = eyebrow_block + title_height
    title_top = CONTENT_TOP + ((band_height - group_height) // 2) + eyebrow_block

    if eyebrow:
        draw_tracked_text(
            draw,
            (MARGIN_X, title_top - EYEBROW_GAP - EYEBROW_SIZE),
            eyebrow.upper(),
            font("semibold", EYEBROW_SIZE),
            ACCENT,
            EYEBROW_TRACKING,
        )

    y = title_top
    for line in title_lines:
        draw.text((MARGIN_X, y), line, font=title_font, fill=TITLE)
        y += line_height

    # Hairline + footer.
    draw.rectangle([(MARGIN_X, RULE_Y), (WIDTH - MARGIN_X, RULE_Y)], fill=HAIRLINE)
    draw.rectangle([(MARGIN_X, RULE_Y), (MARGIN_X + 72, RULE_Y)], fill=ACCENT_DIM)

    footer_font = font("medium", FOOTER_SIZE)
    draw.text((MARGIN_X, FOOTER_TOP), author, font=footer_font, fill=WORDMARK)

    date_width = text_width(draw, date_label, footer_font)
    draw.text(
        (WIDTH - MARGIN_X - date_width, FOOTER_TOP),
        date_label,
        font=footer_font,
        fill=MUTED,
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(output_path, format="PNG", optimize=True)


# ---------------------------------------------------------------------------
# content
# ---------------------------------------------------------------------------
def post_slug_from_filename(filename: str) -> str:
    match = re.match(r"^\d{4}-\d{2}-\d{2}-(.+)\.md$", filename)
    if match:
        return match.group(1)
    return filename.replace(".md", "")


def parse_front_matter(content: str) -> dict[str, Any]:
    pattern = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
    match = pattern.match(content)
    if not match:
        raise ValueError("No valid YAML front matter found.")
    loaded = yaml.safe_load(match.group(1))
    if not isinstance(loaded, dict):
        raise ValueError("Front matter is not a mapping.")
    return loaded


def date_from_front_matter(front_matter: dict[str, Any]) -> str:
    raw_date = front_matter.get("date")
    if raw_date is None:
        return datetime.now().strftime("%b %-d, %Y")

    if isinstance(raw_date, datetime):
        return raw_date.strftime("%b %-d, %Y")
    if isinstance(raw_date, date):
        return datetime.combine(raw_date, datetime.min.time()).strftime("%b %-d, %Y")

    date_str = str(raw_date)
    for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M:%S %z"):
        try:
            return datetime.strptime(date_str, fmt).strftime("%b %-d, %Y")
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00")).strftime("%b %-d, %Y")
    except ValueError:
        pass
    try:
        return datetime.strptime(date_str[:10], "%Y-%m-%d").strftime("%b %-d, %Y")
    except ValueError:
        return date_str


def eyebrow_from_front_matter(front_matter: dict[str, Any]) -> str | None:
    """A topic eyebrow drawn from the post's tags.

    The first tag is usually the broadest one ("AI"), which tells a reader
    nothing. Prefer the first tag that actually names a subject: a multi-word
    tag beats a single word, and a single word beats an acronym.
    """
    raw: Iterable[Any] = front_matter.get("tags") or front_matter.get("categories") or []
    if isinstance(raw, str):
        raw = [raw]
    tags = [str(tag).strip() for tag in raw if str(tag).strip()]
    if not tags:
        return None

    for tag in tags:
        if " " in tag:
            return tag
    for tag in tags:
        if len(tag) >= 5:
            return tag
    return tags[0]


def resolve_card_path(front_matter: dict[str, Any], slug: str) -> Path | None:
    """Where this post's generated card lives, or None if the image is bespoke.

    The card filename must never change: existing meta tags point at it. So we
    only ever write back to the path front matter already names, and only when
    that path is recognisably a generated card (``<slug>.png``).
    """
    image = front_matter.get("image")
    if not image:
        return OUTPUT_DIR / f"{slug}.png"

    image_path = str(image).strip()
    if Path(image_path).name != f"{slug}.png":
        return None
    return PROJECT_ROOT / image_path.lstrip("/")


def selected_posts(post_filter: str | None) -> list[Path]:
    posts = sorted(
        path for path in POSTS_DIR.glob("*.md") if path.name.lower() != "readme.md"
    )
    if not post_filter:
        return posts
    return [
        path
        for path in posts
        if post_filter in (path.name, post_slug_from_filename(path.name))
        or post_filter in path.name
    ]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate OG cards for blog posts.")
    parser.add_argument("--post", type=str, help="Generate for one post only (filename or slug).")
    parser.add_argument(
        "--all",
        action="store_true",
        help="Also generate cards for posts whose `image` is a bespoke illustration "
        "(written to assets/images/<slug>.png; front matter is not modified).",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        help="Write cards here instead of their real paths (for previewing a redesign).",
    )
    parser.add_argument("--author", type=str, default="Subramanya N", help="Footer author name.")
    parser.add_argument(
        "--date-source",
        choices=["today", "post"],
        default="post",
        help="Use today's date or the post front-matter date.",
    )
    parser.add_argument("--no-eyebrow", action="store_true", help="Omit the topic eyebrow.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    posts = selected_posts(args.post)
    if not posts:
        print("No matching posts found.")
        sys.exit(1)

    generated = 0
    skipped = 0

    for post_path in posts:
        front_matter = parse_front_matter(post_path.read_text(encoding="utf-8"))
        slug = post_slug_from_filename(post_path.name)

        output_path = resolve_card_path(front_matter, slug)
        if output_path is None:
            if not args.all:
                skipped += 1
                continue
            output_path = OUTPUT_DIR / f"{slug}.png"

        if args.out_dir:
            output_path = args.out_dir / output_path.name

        title = str(front_matter.get("title", slug.replace("-", " ").title()))
        eyebrow = None if args.no_eyebrow else eyebrow_from_front_matter(front_matter)
        date_label = (
            date_from_front_matter(front_matter)
            if args.date_source == "post"
            else datetime.now().strftime("%b %-d, %Y")
        )

        create_card_image(
            title=title,
            eyebrow=eyebrow,
            author=args.author,
            date_label=date_label,
            output_path=output_path,
        )
        generated += 1
        try:
            shown = output_path.relative_to(PROJECT_ROOT)
        except ValueError:
            shown = output_path
        print(f"Generated: {shown}")

    print(f"\nDone. Generated: {generated}, Skipped (bespoke image): {skipped}")


if __name__ == "__main__":
    main()
