---
layout: loop
title: "Repository cleanup loop"
excerpt: "Inspect branches, worktrees, commits, and PRs; recover valuable work and remove stale state with evidence."
category: "Engineering"
trigger: "A repository has stale branches, abandoned PRs, or unclear local state"
cadence: "Weekly or before release"
tooling: "Git, GitHub CLI, worktrees, issue tracker"
proof: "Remaining repo state is current, owned, or intentionally archived"
stop: "No valuable work is stranded and stale state is removed or documented"
memory: "Record recovered work, deleted branches, and owners"
source_title: "Forward Future Loop Library"
source_url: "https://signals.forwardfuture.ai/loop-library/#top"
attribution: "Matthew Berman"
status: curated
tags:
  - git
  - cleanup
  - maintenance
---

## Loop

Use this when repo state has become hard to trust.

1. List local branches, remote branches, open PRs, closed PRs, and worktrees.
2. Identify unmerged commits and owners.
3. Recover valuable work by opening or updating PRs.
4. Archive or delete stale branches only after confirming no useful commits remain.
5. Prune unused worktrees and stale remotes.
6. Summarize what was recovered, retained, and removed.

Stop when every remaining branch and PR has a clear owner or purpose.
