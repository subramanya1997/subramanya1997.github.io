---
layout: loop
title: "Stale-safe batch release loop"
excerpt: "Review pending changes, exclude stale or unfinished work, combine only valid changes, and release from current main."
category: "Release"
trigger: "Multiple pending changes need to ship together"
cadence: "Per batch release"
tooling: "GitHub, CI, release notes, deployment dashboard"
proof: "Only current and complete changes are included in the release"
stop: "The released revision is current main with every selected change integrated"
memory: "Record included PRs, excluded work, release SHA, and validation"
attribution: "Matthew Berman"
status: curated
tags:
  - release
  - pull-request
  - ci
---

Use this when a batch release risks accidentally shipping stale work.

1. List candidate PRs and pending local changes.
2. Exclude anything stale, failing, unreviewed, or unfinished.
3. Rebase or update selected work onto current main.
4. Run CI and release checks on the integrated revision.
5. Ship only the selected current changes.
6. Record what shipped and what was deferred.

Stop when the deployed revision matches the selected batch and all excluded work is documented.
