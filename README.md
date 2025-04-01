# Personal Website

This is the source for my personal website at [subramanya.ai](https://subramanya.ai).

## Development

1. Clone this repository
2. Run `bundle install` to install dependencies
3. Run `bundle exec jekyll serve` to start the local development server

## Deployment

This site is automatically built and deployed using GitHub Actions whenever changes are pushed to the main branch. The GitHub Actions workflow:

1. Builds the Jekyll site with all custom plugins enabled
2. Deploys the built site to the `gh-pages` branch
3. GitHub Pages then serves the content from the `gh-pages` branch

This allows for the use of custom Jekyll plugins even though GitHub Pages normally runs in safe mode (which would disable custom plugins).
