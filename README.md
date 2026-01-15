# Personal website (Jekyll)

This repo contains my personal website, built with **Jekyll** and hosted on **GitHub Pages**.

- **Live site**: `https://subramanya.ai`

## Local development

### Prerequisites

- Ruby + Bundler

### Install and run

```bash
bundle install
bundle exec jekyll serve --livereload
```

Then open the URL shown by Jekyll (typically `http://127.0.0.1:4000`).

## Content structure

- **Posts**: `_posts/`
- **Layouts**: `_layouts/`
- **Includes/partials**: `_includes/`
- **Static assets**: `assets/`
- **Data files**: `_data/`
- **Books collection**: `_books/`

## Automation

This repo includes a scheduled GitHub Actions workflow that updates analytics-derived data:

- **Workflow**: `.github/workflows/update-analytics.yml`
- **Script**: `scripts/fetch_analytics.py`
- **Output**: `_data/view_count.json`

It requires the following repository secrets to run:

- `GA_PROPERTY_ID`
- `GA_CREDENTIALS`
