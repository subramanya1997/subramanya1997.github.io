# URL parity safety net

The Next.js migration must not silently drop a URL or rewrite a canonical tag.
These two scripts make that testable: `build-manifest.mjs` snapshots what a
build actually serves, and `diff-manifests.mjs` fails the run when the new
build stops serving it.

Node built-ins only — no `npm install`, no `package.json`.

## The baseline is frozen

`scripts/parity/manifest.json` was captured from the final Jekyll build
before the Jekyll toolchain (Gemfile, `_plugins/`, and all templates except
the few `_layouts/`/`_includes/` files still read at build time) was removed
from this repo. It can no longer be regenerated — there is no
Jekyll build to run it against — so it stays a fixed, permanent baseline.
New URLs are verified by diffing the Next.js build against this frozen
manifest with `diff-manifests.mjs`, below; intentional differences from the
Jekyll-era baseline (retired GitHub Pages artifacts, moved URLs, etc.) go in
`diff-allow.json` instead of a manifest regeneration.

`--timestamp` is a free-text label you pass in; the script never calls
`Date.now()`, so rebuilding the same source twice produces an identical file
and `git diff` on the manifest only shows real changes.

## Diff a Next.js build against it

```sh
npm run build        # produces out/
node scripts/parity/diff-manifests.mjs scripts/parity/manifest.json out/
```

Either argument can be a manifest `.json` **or** a build directory — a
directory is scanned in memory, so there is no temp file to clean up.

Exit codes: `0` parity holds, `1` parity broken, `2` bad usage or unreadable
input. Wire the command straight into CI.

Useful flags: `--json` (machine-readable), `--max 100` (more items per
section), `--strict` (also fail on extra URLs and on non-canonical drift),
`--allow other-allow.json`.

## What counts as broken

Fatal by default:

- **Missing URL** — served by the baseline, absent from the candidate.
- **Canonical mismatch** — a wrong canonical de-indexes the page.
- **Type change** — a URL that was an HTML page is now a plain file, or vice versa.

Reported but not fatal: title, description, `og:image`, `og:url`, `robots`,
JSON-LD `@type` list, `<h1>` count, and h2/h3 `id` attributes. Heading ids back
every in-page anchor, so read those warnings rather than skimming past them.

Extra URLs are informational unless you pass `--strict`.

## Allowing intentional differences

`scripts/parity/diff-allow.json` is picked up automatically. It supports
`ignoreMissing` / `ignoreExtra` (URL globs), `ignoreFields` (skip a field
everywhere), `ignorePageFields` (skip fields on one URL; `["*"]` skips the
page), and `renames` (baseline URL → candidate URL, for URLs that moved on
purpose — those still need a redirect). The file documents its own schema.

It ships pre-allowing `/_next/*`, since those bundle paths have no Jekyll
counterpart.

## URL normalization

- `about/index.html` → `/about/`
- root `index.html` → `/`
- everything else keeps its literal path

So `404.html` stays `/404.html`, and the markdown twins stay
`/about/index.md` — agents fetch those by that exact URL, which makes them
part of the contract, not build noise.

## Note on `scripts/parity/` itself

`_config.yml` has no `exclude:`, so Jekyll copies the entire `scripts/` tree
into `_site/` — including this directory and the manifest it writes. The
manifest builder ignores `scripts/parity/` by default so the baseline does not
contain its own output. Pass `--include-ignored` to see the raw tree.

If Next.js does not publish `scripts/`, the other files under it
(`fetch_analytics.py`, `translate_posts.py`, `validate_content.rb`,
`translation_errors.log`, …) will show up as missing URLs. That is worth an
explicit decision — they are almost certainly accidental publishes, and
`translation_errors.log` in particular should probably never have been served
— but the diff will keep failing until you either serve them or add them to
`ignoreMissing`.
