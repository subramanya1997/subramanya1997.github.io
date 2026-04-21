---
layout: page
title: Development
description: "Contributor and maintenance workflow: local setup, validation commands, content update flow, and Python maintenance scripts."
permalink: /docs/development/
robots: noindex, follow
---

## Prerequisites

- Ruby 3.x with Bundler
- Python 3.11+ for maintenance scripts
- Optional: a virtual environment for Python dependencies in `scripts/requirements.txt`

## Local Setup

```bash
bundle install
bundle exec jekyll serve --livereload
```

Jekyll will print the local URL, usually `http://127.0.0.1:4000`.

## Core Validation Commands

Run these before opening a PR:

```bash
bundle exec jekyll build
bundle exec htmlproofer ./_site --disable-external --ignore-empty-alt --ignore-urls "/localhost/,/127.0.0.1/" --enforce-https
ruby scripts/validate_content.rb
```

## CI Parity

The CI workflow in `.github/workflows/code_quality.yml` runs the same three checks:

1. `bundle exec jekyll build`
2. `bundle exec htmlproofer ./_site --disable-external --ignore-empty-alt --ignore-urls "/localhost/,/127.0.0.1/" --enforce-https`
3. `ruby scripts/validate_content.rb`

If CI fails, reproduce locally with the same commands first.

## Content Update Workflow

### Blog posts

1. Create a dated Markdown file in `_posts/`.
2. Add the required front matter defined in `docs/content-model.md`.
3. Add or generate an OG image if needed.
4. If the post should participate in translation, run the translation script after the English source is stable.
5. Run the validation commands.

### Books

1. Add or update the collection entry in `_books/`.
2. Use the required front matter defined in `docs/content-model.md`.
3. Run the validation commands.

### Data-driven pages

- Homepage and work page content comes from `_data/about.yaml`.
- Stats and homepage view counts come from `_data/view_count.json`.
- Translation UI labels come from `_data/i18n.yml`.

Whenever `_data/` changes, rebuild the site and verify the affected page manually.

## Python Maintenance Scripts

Install dependencies only when needed:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r scripts/requirements.txt
```

### Analytics refresh

`scripts/fetch_analytics.py` writes `_data/view_count.json`. Run it only when you intend to refresh tracked analytics data and have the required environment variables.

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

Top-level pages can load page-specific assets using front matter arrays:

```yaml
page_stylesheets:
  - /assets/css/components/content-cards.css
  - /assets/css/pages/search.css
page_scripts:
  - /assets/js/components/discovery.js
  - /assets/js/pages/search.js
```

Use these only for page-owned behavior and styles. Shared global behavior still belongs in layouts, includes, `css/main.css`, or shared assets under `assets/css/components` and `assets/js/components`.

## Guardrails

- Do not add inline `<style>` blocks or inline page-owned `<script>` blocks back to `index.html`, `blog.md`, `books.md`, `work.md`, or `stats.md`.
- Do not introduce a JS bundler or CSS preprocessor as part of routine page changes.
- Keep shared top-level page UI inside `_includes/components/` once a repeated pattern exists in more than one page.
