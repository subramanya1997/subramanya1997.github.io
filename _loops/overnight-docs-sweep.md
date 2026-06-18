---
layout: loop
title: "Overnight docs sweep"
excerpt: "Review recent code changes, update stale documentation, and open a focused PR before the next workday."
category: "Documentation"
trigger: "Code changes landed since the last docs sweep"
cadence: "Nightly"
tooling: "Git diff, docs, build, link checker, GitHub"
proof: "Docs match the current implementation and checks pass"
stop: "A focused docs PR is open or no stale docs are found"
memory: "Record reviewed commits and unchanged docs areas"
source_title: "Forward Future Loop Library"
source_url: "https://signals.forwardfuture.ai/loop-library/#top"
attribution: "Matthew Berman"
status: curated
tags:
  - documentation
  - pull-request
  - maintenance
---

## Loop

Use this when code moves faster than docs.

1. Inspect commits, merged PRs, and changed files since the last sweep.
2. Identify docs that mention changed behavior, APIs, commands, or workflows.
3. Update only the docs affected by those changes.
4. Run the docs build, link check, or project validation.
5. Open a PR with the evidence and reviewed commit range.

Stop when the docs are current for the reviewed range or the sweep records that no docs changed.
