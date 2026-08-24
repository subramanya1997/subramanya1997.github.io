# Personal Website

Personal site built with Next.js (App Router, static export) and deployed on
Vercel. Content lives in the original Jekyll-era source directories
(`_posts/`, `_books/`, `_loops/`, `_data/`, `_config.yml`), which remain the
single source of truth.

- Live site: `https://subramanya.ai`

## Quickstart

```bash
bun install
bun run dev
```

## Validation

```bash
bun run build
bun run parity
node scripts/validate-content.mjs
python3 scripts/validate_api_output.py out
```

`bun run parity` diffs the build against the frozen URL manifest in
`scripts/parity/manifest.json` — every published URL must keep resolving with
no canonical drift.

Full pre-deploy steps, including post-deploy live checks: `docs/deploy-checklist.md`.

## Deployment

Pushing to `main` deploys production automatically — the Vercel project is
git-connected. Do not deploy manually.

## Documentation

- `docs/architecture.md`: system overview and change map
- `docs/development.md`: contributor and maintenance workflow
- `docs/content-model.md`: front matter and data contract

## Automation

- Scheduled analytics refresh: `.github/workflows/update-analytics.yml`
- Analytics fetch script: `scripts/fetch_analytics.py`
- Analytics data output: `_data/view_count.json`
