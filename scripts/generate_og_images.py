#!/usr/bin/env python3
"""
Generate Open Graph images for blog posts.

By default, this script generates cards only for posts that do not define
an explicit front-matter `image` field.

Card layout:
- Post title on the left
- Author name and date at the bottom-left
- Modern minimalist visual style
"""

from __future__ import annotations

import argparse
import random
import re
import sys
from datetime import date, datetime
from pathlib import Path
from typing import Any

import yaml
from PIL import Image, ImageDraw, ImageFont


PROJECT_ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = PROJECT_ROOT / "_posts"
OUTPUT_DIR = PROJECT_ROOT / "assets" / "images"

WIDTH = 1200
HEIGHT = 630
MARGIN_X = 90

# Minimalist Theme Colors
BG_COLOR = (255, 255, 255)
TEXT_MAIN = (15, 23, 42)       # Dark slate/black
TEXT_BRAND = (71, 85, 105)     # Slate gray
TEXT_META = (100, 116, 139)    # Lighter slate
ACCENT_LINE = (226, 232, 240)  # Very light gray for background shapes

TITLE_MAX_LINES = 5
TITLE_MAX_WIDTH = 1000

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate OG images for blog posts.",
    )
    parser.add_argument(
        "--post",
        type=str,
        help="Generate for one post only (filename or slug).",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Generate cards for all posts, including posts that already have `image`.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Regenerate images even if files already exist.",
    )
    parser.add_argument(
        "--author",
        type=str,
        default="Subramanya N",
        help="Author name shown in the footer.",
    )
    parser.add_argument(
        "--date-source",
        choices=["today", "post"],
        default="post",
        help="Use today's date or post front-matter date.",
    )
    return parser.parse_args()


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
    front_matter_yaml = match.group(1)
    loaded = yaml.safe_load(front_matter_yaml)
    if not isinstance(loaded, dict):
        raise ValueError("Front matter is not a mapping.")
    return loaded


def load_font(size: int, bold: bool) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates: list[str]
    if bold:
        candidates = [
            "DejaVuSans-Bold.ttf",
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
            "/System/Library/Fonts/Supplemental/Helvetica.ttc",
            "/Library/Fonts/Arial Bold.ttf",
        ]
    else:
        candidates = [
            "DejaVuSans.ttf",
            "/System/Library/Fonts/Supplemental/Arial.ttf",
            "/System/Library/Fonts/Supplemental/Helvetica.ttc",
            "/Library/Fonts/Arial.ttf",
        ]

    for font_path in candidates:
        try:
            return ImageFont.truetype(font_path, size=size)
        except OSError:
            continue

    return ImageFont.load_default()


def wrap_lines(
    draw: ImageDraw.ImageDraw,
    text: str,
    font: ImageFont.FreeTypeFont | ImageFont.ImageFont,
    max_width: int,
) -> list[str]:
    words = text.split()
    if not words:
        return [""]

    lines: list[str] = []
    current = words[0]
    for word in words[1:]:
        candidate = f"{current} {word}"
        if draw.textlength(candidate, font=font) <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines


def clamp_lines_with_ellipsis(
    draw: ImageDraw.ImageDraw,
    lines: list[str],
    font: ImageFont.FreeTypeFont | ImageFont.ImageFont,
    max_width: int,
    max_lines: int,
) -> list[str]:
    if len(lines) <= max_lines:
        return lines

    clamped = lines[:max_lines]
    last = clamped[-1].rstrip()
    while last and draw.textlength(f"{last}...", font=font) > max_width:
        last = last[:-1].rstrip()
    clamped[-1] = f"{last}..." if last else "..."
    return clamped


def fit_title(
    draw: ImageDraw.ImageDraw,
    title: str,
    max_width: int,
) -> tuple[ImageFont.FreeTypeFont | ImageFont.ImageFont, list[str], int]:
    # Supermemory font style: larger, bolder
    for size in (80, 72, 64, 56, 48):
        font = load_font(size=size, bold=True)
        lines = wrap_lines(draw=draw, text=title, font=font, max_width=max_width)
        if len(lines) <= TITLE_MAX_LINES:
            return font, lines, size

    fallback_size = 42
    fallback_font = load_font(size=fallback_size, bold=True)
    fallback_lines = wrap_lines(
        draw=draw,
        text=title,
        font=fallback_font,
        max_width=max_width,
    )
    fallback_lines = clamp_lines_with_ellipsis(
        draw=draw,
        lines=fallback_lines,
        font=fallback_font,
        max_width=max_width,
        max_lines=TITLE_MAX_LINES,
    )
    return fallback_font, fallback_lines, fallback_size


def date_from_front_matter(front_matter: dict[str, Any]) -> str:
    raw_date = front_matter.get("date")
    if raw_date is None:
        return datetime.now().strftime("%b %d, %Y")

    if isinstance(raw_date, datetime):
        return raw_date.strftime("%b %d, %Y")
    if isinstance(raw_date, date):
        return datetime.combine(raw_date, datetime.min.time()).strftime("%b %d, %Y")

    date_str = str(raw_date)
    for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M:%S %z"):
        try:
            return datetime.strptime(date_str, fmt).strftime("%b %d, %Y")
        except ValueError:
            continue

    try:
        iso_value = date_str.replace("Z", "+00:00")
        return datetime.fromisoformat(iso_value).strftime("%b %d, %Y")
    except ValueError:
        pass

    try:
        return datetime.strptime(date_str[:10], "%Y-%m-%d").strftime("%b %d, %Y")
    except ValueError:
        return date_str


import random

# ... existing code ...

def draw_pattern_1(draw: ImageDraw.ImageDraw, line_width: int):
    """Original chevron pattern"""
    draw.line(
        [(WIDTH - 350, -50), (WIDTH - 150, 150), (WIDTH - 350, 350)],
        fill=ACCENT_LINE,
        width=line_width
    )
    draw.line(
        [(WIDTH - 280, -50), (WIDTH - 80, 150), (WIDTH - 280, 350)],
        fill=ACCENT_LINE,
        width=line_width
    )
    draw.line(
        [(50, HEIGHT - 350), (250, HEIGHT - 150), (50, HEIGHT + 50)],
        fill=ACCENT_LINE,
        width=line_width
    )

def draw_pattern_2(draw: ImageDraw.ImageDraw, line_width: int):
    """Grid of dots"""
    for x in range(0, WIDTH, 60):
        for y in range(0, HEIGHT, 60):
            draw.ellipse(
                [(x, y), (x + line_width, y + line_width)],
                fill=ACCENT_LINE
            )

def draw_pattern_3(draw: ImageDraw.ImageDraw, line_width: int):
    """Diagonal stripes (top right)"""
    step = 40
    for i in range(-WIDTH, WIDTH, step):
        start = (WIDTH + i, -50)
        end = (WIDTH + i - 300, 300)
        draw.line([start, end], fill=ACCENT_LINE, width=line_width // 2)

def draw_pattern_4(draw: ImageDraw.ImageDraw, line_width: int):
    """Large Circles"""
    draw.ellipse(
        [(WIDTH - 400, -100), (WIDTH + 100, 400)],
        outline=ACCENT_LINE,
        width=line_width
    )
    draw.ellipse(
        [(WIDTH - 250, 100), (WIDTH - 50, 300)],
        outline=ACCENT_LINE,
        width=line_width
    )
    draw.ellipse(
        [(-100, HEIGHT - 300), (200, HEIGHT)],
        outline=ACCENT_LINE,
        width=line_width
    )

def create_card_image(title: str, footer_text: str, output_path: Path) -> None:
    # 1. Solid white background
    image = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(image)

    # 2. Subtle Geometric Background (Randomized deterministically based on title)
    # Use title length + first char code to pick a stable random seed
    seed = sum(ord(c) for c in title)
    random.seed(seed)
    
    line_width = 3
    patterns = [draw_pattern_1, draw_pattern_2, draw_pattern_3, draw_pattern_4]
    selected_pattern = random.choice(patterns)
    selected_pattern(draw, line_width)
    
    # 3. Branding (Top Left) - REMOVED per user request
    # ...

    # 4. Title (Vertically Centered, Left Aligned)
    title_font, title_lines, title_size = fit_title(draw=draw, title=title, max_width=TITLE_MAX_WIDTH)
    
    # Calculate vertical center for the text block
    line_height = int(title_size * 1.2)
    total_text_height = line_height * len(title_lines)
    
    # Optical center
    start_y = (HEIGHT - total_text_height) // 2 - 20 
    
    for line in title_lines:
        draw.text((MARGIN_X, start_y), line, font=title_font, fill=TEXT_MAIN)
        start_y += line_height

    # 5. Footer (Bottom Left)
    meta_font = load_font(size=32, bold=False)
    draw.text((MARGIN_X, HEIGHT - 90), footer_text, font=meta_font, fill=TEXT_META)

    # Save
    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(output_path, format="PNG", optimize=True)


def selected_posts(post_filter: str | None) -> list[Path]:
    posts = sorted(path for path in POSTS_DIR.glob("*.md") if path.name.lower() != "readme.md")
    if not post_filter:
        return posts

    filtered: list[Path] = []
    for post_path in posts:
        slug = post_slug_from_filename(post_path.name)
        if post_filter == post_path.name or post_filter == slug or post_filter in post_path.name:
            filtered.append(post_path)
    return filtered


def main() -> None:
    args = parse_args()
    posts = selected_posts(args.post)
    if not posts:
        print("No matching posts found.")
        sys.exit(1)

    generated = 0
    skipped = 0

    for post_path in posts:
        content = post_path.read_text(encoding="utf-8")
        front_matter = parse_front_matter(content)
        slug = post_slug_from_filename(post_path.name)

        if not args.all and front_matter.get("image"):
            skipped += 1
            continue

        output_path = OUTPUT_DIR / f"{slug}-og.png"
        if output_path.exists() and not args.force:
            skipped += 1
            continue

        title = str(front_matter.get("title", slug.replace("-", " ").title()))
        if args.date_source == "post":
            date_label = date_from_front_matter(front_matter)
        else:
            date_label = datetime.now().strftime("%b %d, %Y")

        footer = f"{args.author}  |  {date_label}"
        create_card_image(title=title, footer_text=footer, output_path=output_path)
        generated += 1
        print(f"Generated: {output_path.relative_to(PROJECT_ROOT)}")

    print(f"\nDone. Generated: {generated}, Skipped: {skipped}")


if __name__ == "__main__":
    main()