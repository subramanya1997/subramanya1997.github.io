# Personal Website

Personal site built with Jekyll and hosted on GitHub Pages.

- Live site: `https://subramanya.ai`

## Quickstart

```bash
bundle install
bundle exec jekyll serve --livereload
```

## Validation

```bash
bundle exec jekyll build
bundle exec htmlproofer ./_site --disable-external --ignore-empty-alt --ignore-urls "/localhost/,/127.0.0.1/" --enforce-https
ruby scripts/validate_content.rb
```

## Documentation

- `docs/architecture.md`: system overview and change map
- `docs/development.md`: contributor and maintenance workflow
- `docs/content-model.md`: front matter and data contract

## Automation

- Scheduled analytics refresh: `.github/workflows/update-analytics.yml`
- Analytics fetch script: `scripts/fetch_analytics.py`
- Analytics data output: `_data/view_count.json`
