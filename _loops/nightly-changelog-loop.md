---
layout: loop
title: "Nightly changelog loop"
excerpt: "Review the day's changes and update the changelog with user-visible updates or a recorded no-change result."
category: "Documentation"
trigger: "A development day ends"
cadence: "Nightly"
tooling: "Git history, PRs, issue tracker, changelog"
proof: "User-relevant changes are reflected in the changelog"
stop: "Changelog is updated and validated, or no user-facing changes are recorded"
memory: "Store the date, reviewed commits, and release-note decision"
attribution: "Matthew Berman"
status: curated
tags:
  - changelog
  - documentation
  - release-notes
---

Use this to keep release notes from becoming a late-stage archaeology project.

1. Inspect merged PRs, commits, and shipped issues for the day.
2. Separate internal-only changes from user-visible changes.
3. Add concise changelog entries for user-visible behavior.
4. Link source PRs or issues where useful.
5. Validate formatting and links.
6. Record a no-change note when nothing user-visible shipped.

Stop when every user-facing change has a changelog entry or an explicit no-change record exists.
