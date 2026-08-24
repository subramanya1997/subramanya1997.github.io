---
layout: page
title: Development
description: "Contributor and maintenance workflow: local setup, validation commands, content update flow, and Python maintenance scripts."
permalink: /docs/development/
robots: noindex, follow
---

## Prerequisites

- Bun 1.x (installs dependencies and runs the Next.js build)
- Python 3.11+ for maintenance scripts
- Optional: a virtual environment for Python dependencies in `scripts/requirements.txt`

## Local Setup

```bash
bun install
bun run dev
```

The dev server prints the local URL, usually `http://localhost:3000`. The
`predev` hook syncs the static content directories into `public/` first.

## Core Validation Commands

Run these before opening a PR:

```bash
bun run build
bun run build:export
bun run parity
node scripts/validate-content.mjs
python3 scripts/validate_api_output.py out
```

`bun run build` is the standard deployment build (what Vercel runs).
`bun run build:export` writes the static export to `out/`, which
`bun run parity` diffs against the frozen URL manifest in
`scripts/parity/manifest.json`; every published URL must keep resolving with
no canonical drift.

## CI Parity

The CI workflow in `.github/workflows/code_quality.yml` runs the same checks:

1. `bun run build`
2. `bun run build:export`
3. `node scripts/parity/diff-manifests.mjs scripts/parity/manifest.json out`
4. `node scripts/validate-content.mjs`
5. `python3 scripts/validate_api_output.py out`

If CI fails, reproduce locally with the same commands first.

## Content Update Workflow

### Blog posts

1. Create a dated Markdown file in `content/posts/`.
2. Add the required front matter defined in `docs/content-model.md`.
3. Add or generate an OG image if needed.
4. If the post should participate in translation, run the translation script after the English source is stable.
5. Run the validation commands.

### Books

1. Add or update the collection entry in `content/books/`.
2. Use the required front matter defined in `docs/content-model.md`.
3. Run the validation commands.

### Automation loops

1. Add or update a Markdown listing in `content/loops/`.
2. Use the required front matter defined in `docs/content-model.md`.
3. Keep the body concrete: it should be the actual prompt or operating instructions, not a vague idea.
4. Treat source, attribution, category, trigger, cadence, tooling, proof, memory, stop condition, tags, and MCP/resource links as optional metadata.
5. Community submissions should arrive as pull requests and should not be merged until safety, usefulness, and validation pass.
6. Keep exports tool-aware: Agent Skills require `SKILL.md` inside a folder whose name matches the skill `name`, Cursor project rules require `.cursor/rules/*.mdc`, and Claude/Cursor deep links only open a review step in the local app.
7. Run the validation commands.

Loop PRs are routed through `.github/CODEOWNERS` and `.github/pull_request_template.md`. CODEOWNERS review is mandatory only when `main` branch protection requires code-owner approval.

### Data-driven pages

- Homepage and work page content comes from `content/data/about.yaml`.
- Stats and homepage view counts come from `content/data/view_count.json`.
- Translation UI labels come from `content/data/i18n.yml`.

Whenever `content/data/` changes, rebuild the site and verify the affected page manually.

## Python Maintenance Scripts

Install dependencies only when needed:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r scripts/requirements.txt
```

### Analytics refresh

`scripts/fetch_analytics.py` writes `content/data/view_count.json`. Run it only when you intend to refresh tracked analytics data and have the required environment variables.

Required environment variables:

- `GA_PROPERTY_ID`
- `GA_CREDENTIALS`

### Translation generation

`scripts/translate_posts.py` writes JSON files under `assets/translations/`.

Recommended safety workflow:

1. Run with `--dry-run` first.
2. Limit scope with `--post` or `--lang` while iterating.
3. Review generated JSON before committing.

### OG image generation

`scripts/generate_og_images.py` writes PNGs into `assets/images/`.

Use `--post` or `--force` deliberately so you do not regenerate unrelated assets by accident.

## Page Asset Conventions

Top-level pages can load page-specific scripts using a front matter array:

```yaml
page_scripts:
  - /assets/js/components/discovery.js
  - /assets/js/pages/search.js
```

Use it only for page-owned behavior. Shared global behavior still belongs in
the shared React components (`components/`) or shared assets under
`assets/js/components`.

**CSS is not per-page.** There is exactly one linked stylesheet,
`css/main.css`, and every page loads it from the root layout. Page styles live
in its section 8, one commented block per page (`/* --- pages/search ... */`),
in the order the old per-page `<link>` tags were emitted. Add new page styles
to that section under their own comment, and keep selectors uniquely named or
compound-scoped to the page's own markup so they cannot leak. Do not
reintroduce a per-page stylesheet or an `assets/css/` tree.

Per-post CSS is the one exception and works differently: the sheets in
`components/post/assets/` are inlined into the post markup, not linked.

## Guardrails

- Do not add inline `<style>` blocks or inline page-owned `<script>` blocks back to `app/blog/content.md`, `app/books/content.md`, `app/work/content.md`, or `app/stats/content.md`.
- Do not swap the markdown renderer in `lib/markdown.ts` for a stock one — heading ids, rouge token classes, and smart quotes are matched byte-for-byte to the original published output.
- Never change a URL. Run `bun run parity` after any routing or build change.
- Keep shared top-level page UI inside `components/` once a repeated pattern exists in more than one page.
