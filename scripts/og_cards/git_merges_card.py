#!/usr/bin/env python3
"""
Bespoke OG card for "Git Was Built for 2,500 Merges a Day".

Same type system as scripts/generate_og_images.py (wordmark, eyebrow, title,
hairline, footer, left rail, blueprint grid), but the art is on-subject: a Git
commit graph that runs the full width of the card. Sparse, long-lived branches
on the left (May 2026, ~2,500 merges a day) become a dense storm of short-lived
agent branches merging into main on the right (September, 30,000+ a day). Every
merge is a terracotta dot on main, so the main line itself turns warm as the
rate climbs.

Output is written to assets/images/git-merges-a-day-card.png, a name that does
NOT equal <slug>.png on purpose: generate_og_images.py only overwrites cards
named after their slug, so this one survives a `--all` regeneration.

    python3 scripts/og_cards/git_merges_card.py
"""

from __future__ import annotations

import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import generate_og_images as og  # noqa: E402

OUTPUT = og.PROJECT_ROOT / "assets" / "images" / "git-merges-a-day-card.png"

TITLE = "Git Was Built for 2,500 Merges a Day"
EYEBROW = "Source control"
AUTHOR = "Subramanya N"
DATE_LABEL = "Oct 16, 2026"
TITLE_MEASURE = 620  # narrower than the stock card: the right half is the graph

S = 2  # supersample factor for the art layer
W, H = og.WIDTH, og.HEIGHT
MAIN_Y = 318          # y of the main line (1x)
LANE = 24             # vertical distance between lanes (1x)


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def ramp(x: float) -> float:
    """0 at the left edge, 1 at the right, biased so the storm arrives late."""
    return 1.0 / (1.0 + math.exp(-(x - 790) / 85.0))


def bezier(p0, p1, p2, p3, n: int = 26) -> list[tuple[float, float]]:
    pts = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        x = u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0]
        y = u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1]
        pts.append((x, y))
    return pts


def branch_path(x0: float, x1: float, lane_y: float) -> list[tuple[float, float]]:
    """Fork off main at x0, ride a lane, merge back at x1. Smooth S-curves at both ends."""
    length = x1 - x0
    ramp_len = min(46.0, length * 0.38)
    a = (x0, MAIN_Y)
    b = (x0 + ramp_len, lane_y)
    c = (x1 - ramp_len, lane_y)
    d = (x1, MAIN_Y)
    out = bezier(a, (a[0] + ramp_len * 0.55, a[1]), (b[0] - ramp_len * 0.55, b[1]), b)
    out += [c]
    out += bezier(c, (c[0] + ramp_len * 0.55, c[1]), (d[0] - ramp_len * 0.55, d[1]), d)
    return out


def scale(pts):
    return [(x * S, y * S) for x, y in pts]


def draw_graph(rng) -> Image.Image:
    layer = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    # --- generate branches ----------------------------------------------
    branches: list[tuple[float, float, int]] = []  # (x0, x1, lane signed)
    x = -40.0
    while x < W + 60:
        t = ramp(x)
        spacing = lerp(140, 5, t) * rng.uniform(0.7, 1.35)
        length = lerp(260, 36, t) * rng.uniform(0.6, 1.5)
        max_lanes = 1 + int(round(lerp(0, 5, t)))
        lane = rng.randint(1, max_lanes) * rng.choice((-1, 1))
        branches.append((x, x + length, lane))
        x += spacing

    # Long, lonely branches at the left: the human era. They should read as
    # deliberate, so push them to the outer lanes and stretch them.
    for i, (x0, x1, lane) in enumerate(branches[:4]):
        branches[i] = (x0, x1 + 120, (2 if i % 2 else 1) * (1 if i % 2 else -1))

    # --- lines ---------------------------------------------------------------
    for x0, x1, lane in branches:
        t = ramp((x0 + x1) / 2)
        lane_y = MAIN_Y + lane * LANE * (1.0 if abs(lane) <= 2 else 0.92)
        pts = scale(branch_path(x0, x1, lane_y))
        alpha = int(lerp(120, 78, t))
        d.line(pts, fill=og.rgba(og.ACCENT, alpha), width=int(2.2 * S), joint="curve")

    # Main line, drawn over the branches so merges visibly land on it.
    d.line([(-10, MAIN_Y * S), ((W + 10) * S, MAIN_Y * S)], fill=og.rgba(og.ACCENT, 210), width=int(3.2 * S))

    # --- nodes ---------------------------------------------------------------
    for x0, x1, lane in branches:
        t = ramp(x1)
        # fork: hollow indigo on main
        r = lerp(6.5, 3.6, t) * S
        d.ellipse([(x0 * S - r, MAIN_Y * S - r), (x0 * S + r, MAIN_Y * S + r)], fill=og.rgba(og.PAPER, 255))
        d.ellipse([(x0 * S - r, MAIN_Y * S - r), (x0 * S + r, MAIN_Y * S + r)], outline=og.rgba(og.ACCENT, 190), width=int(1.8 * S))
        # merge: filled terracotta on main
        rm = lerp(7.5, 3.2, t) * S
        d.ellipse([(x1 * S - rm, MAIN_Y * S - rm), (x1 * S + rm, MAIN_Y * S + rm)], fill=og.rgba(og.ACCENT_WARM, 225))
        # a commit or two on the lane itself, hollow, so lanes read as work
        lane_y = MAIN_Y + lane * LANE * (1.0 if abs(lane) <= 2 else 0.92)
        n_commits = 1 if (x1 - x0) < 110 else rng.randint(1, 3)
        for _ in range(n_commits):
            cx = rng.uniform(x0 + 52, x1 - 52) if (x1 - x0) > 110 else (x0 + x1) / 2
            rc = lerp(4.6, 2.8, t) * S
            d.ellipse([(cx * S - rc, lane_y * S - rc), (cx * S + rc, lane_y * S + rc)], fill=og.rgba(og.PAPER, 255))
            d.ellipse([(cx * S - rc, lane_y * S - rc), (cx * S + rc, lane_y * S + rc)], outline=og.rgba(og.ACCENT, 170), width=int(1.6 * S))

    return layer.resize((W, H), Image.LANCZOS)


def mono(size: int):
    for path in ("/System/Library/Fonts/SFNSMono.ttf", "/System/Library/Fonts/Menlo.ttc"):
        try:
            from PIL import ImageFont
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    return og.font("medium", size)


def main() -> None:
    image = Image.new("RGB", (W, H), og.PAPER)
    draw = ImageDraw.Draw(image)

    # --- type layout first (same rules as the stock card) --------------------
    band_height = og.BAND_BOTTOM - og.CONTENT_TOP
    eyebrow_block = og.EYEBROW_SIZE + og.EYEBROW_GAP
    title_font, title_lines, title_size = og.layout_title(
        draw, og.smarten(TITLE), TITLE_MEASURE, band_height - eyebrow_block
    )
    line_height = round(title_size * og.TITLE_LEADING)
    title_height = line_height * len(title_lines)
    group_height = eyebrow_block + title_height
    title_top = og.CONTENT_TOP + ((band_height - group_height) // 2) + eyebrow_block
    widest = max(og.text_width(draw, line, title_font) for line in title_lines)

    title_box = (
        og.MARGIN_X - 34,
        title_top - eyebrow_block - 26,
        og.MARGIN_X + widest + 44,
        title_top + title_height + 18,
    )
    type_boxes = [
        title_box,
        (og.MARGIN_X - 34, og.WORDMARK_TOP - 20, og.MARGIN_X + 240, og.WORDMARK_TOP + og.WORDMARK_SIZE + 20),
        (og.MARGIN_X - 34, og.RULE_Y - 14, W - og.MARGIN_X + 34, og.FOOTER_TOP + og.FOOTER_SIZE + 22),
    ]

    # --- background: grid, then the commit graph veiled behind type ----------
    grid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    og.draw_grid(ImageDraw.Draw(grid))
    image.paste(grid, (0, 0), grid)

    rng = og.seeded_rng("git-was-built-for-2500-merges-a-day")
    graph = og.veil(draw_graph(rng), type_boxes)
    image.paste(graph, (0, 0), graph)

    draw.rectangle([(0, 0), (og.RAIL_WIDTH - 1, H)], fill=og.ACCENT)

    # --- the two numbers, as annotations on the graph ------------------------
    label_font = mono(15)
    num_font = og.font("display-semibold", 30)
    unit_font = mono(13)

    def annotate(x_anchor: float, align: str, eyebrow: str, number: str, unit: str, y: int) -> None:
        eb_w = sum(draw.textlength(ch, font=label_font) + 2.0 for ch in eyebrow)
        num_w = draw.textlength(number, font=num_font)
        unit_w = sum(draw.textlength(ch, font=unit_font) + 1.6 for ch in unit)
        block_w = max(eb_w, num_w + 10 + unit_w)
        if align == "left":
            x_eb = x_num = x_anchor
        else:
            x_eb = x_anchor - eb_w
            x_num = x_anchor - (num_w + 10 + unit_w)
        og.draw_tracked_text(draw, (x_eb, y), eyebrow, label_font, og.MUTED, 2.0)
        draw.text((x_num, y + 24), number, font=num_font, fill=og.ACCENT_WARM)
        og.draw_tracked_text(draw, (x_num + num_w + 10, y + 24 + 13), unit, unit_font, og.MUTED, 1.6)

    annotate(640, "left", "MAY 2026 · MERGES", "~2,500", "/ DAY", 110)
    annotate(W - og.MARGIN_X, "right", "SEPTEMBER 2026 · MERGES", "30,000+", "/ DAY", 110)

    # --- type ----------------------------------------------------------------
    draw.text((og.MARGIN_X, og.WORDMARK_TOP), "subramanya.ai", font=og.font("semibold", og.WORDMARK_SIZE), fill=og.INK_SOFT)
    og.draw_tracked_text(
        draw,
        (og.MARGIN_X, title_top - og.EYEBROW_GAP - og.EYEBROW_SIZE),
        EYEBROW.upper(),
        og.font("semibold", og.EYEBROW_SIZE),
        og.ACCENT,
        og.EYEBROW_TRACKING,
    )
    y = title_top
    for line in title_lines:
        draw.text((og.MARGIN_X, y), line, font=title_font, fill=og.INK)
        y += line_height

    draw.rectangle([(og.MARGIN_X, og.RULE_Y), (W - og.MARGIN_X, og.RULE_Y)], fill=og.HAIRLINE)
    draw.rectangle([(og.MARGIN_X, og.RULE_Y), (og.MARGIN_X + 72, og.RULE_Y)], fill=og.ACCENT)
    footer_font = og.font("medium", og.FOOTER_SIZE)
    draw.text((og.MARGIN_X, og.FOOTER_TOP), AUTHOR, font=footer_font, fill=og.INK_SOFT)
    date_w = og.text_width(draw, DATE_LABEL, footer_font)
    draw.text((W - og.MARGIN_X - date_w, og.FOOTER_TOP), DATE_LABEL, font=footer_font, fill=og.MUTED)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    image.save(OUTPUT, format="PNG", optimize=True)
    print(f"Wrote {OUTPUT.relative_to(og.PROJECT_ROOT)}  ({title_size}px title, {len(title_lines)} lines)")


if __name__ == "__main__":
    main()
