# Contributing

## Automation Loops

Automation-loop submissions are Markdown files in `_loops/`. Use the form at `/awesome-loops/` or open a pull request that adds one file to `_loops/`. The form opens a GitHub issue with a generated Markdown payload; `.github/workflows/loop-submission-pr.yml` turns that issue into a reviewable PR.

Every loop needs a title, a short description, and the actual prompt or operating instructions an agent can run. Source links, attribution, category, trigger, cadence, tooling, proof, memory, stop condition, tags, and MCP/resource links are optional.

Submissions are reviewed before merge. Maintainers may edit titles, safety language, attribution, optional metadata, or export wording before approving. Do not include secrets, private customer data, credentialed URLs, or instructions that perform destructive actions without an explicit review step.

Run these checks before requesting review:

```bash
ruby scripts/validate_content.rb
bundle exec jekyll build
```

GitHub code-owner review is enforced only when repository branch protection requires it, so keep branch protection enabled for `main` before treating approvals as mandatory.
