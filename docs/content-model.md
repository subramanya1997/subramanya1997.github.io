---
layout: page
title: Content Model
description: Front-matter and data contracts for posts, books, data files, and top-level pages.
permalink: /docs/content-model/
robots: noindex, follow
---

## Posts

Posts live in `_posts/` and use dated filenames in the standard Jekyll format.

### Required front matter

- `layout`
- `title`
- `excerpt`
- `date`
- `tags`

### Optional front matter

- `author`
- `image`
- `slug`
- `mermaid`
- `mathjax`
- `ready`

### Notes

- `author` is optional for legacy posts because the templates already fall back to the site title when it is missing.
- `image` overrides the generated/default social image.
- `slug` is used for predictable social image paths when a custom `image` is not present.
- `mermaid` and `mathjax` enable post-only rendering features in `_layouts/post.html`.
- `ready` is a content workflow flag and is not enforced by Jekyll itself.

## Books

Books live in `_books/` and are rendered through the `books` collection.

### Required front matter

- `title`
- `excerpt`
- `date`
- `tags`
- `web_url`

### Common optional front matter

- `author`
- `ready`

## Non-publishable content

- `_posts/readme.md` is documentation, not a publishable post.
- It is intentionally excluded from automated front matter validation.

## Data Contracts

### `_data/about.yaml`

The site expects at least these keys to exist:

- `bio`
- `experience`
- `education`

### `_data/view_count.json`

The site expects:

- `last_updated`
- `view_counts` array

Each `view_counts[]` entry must contain:

- `url`
- `views`
- `avg_duration_seconds`
- `engagement_rate`

## Top-level Page Asset Contract

The refactored top-level pages can declare page-specific CSS and JS through front matter.

### Supported front matter keys

- `page_stylesheets`
- `page_scripts`

Both must be arrays of asset paths and should only be used for page-owned styles and scripts.
