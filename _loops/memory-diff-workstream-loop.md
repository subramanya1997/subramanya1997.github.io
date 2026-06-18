---
layout: loop
title: "Memory diff workstream loop"
excerpt: "Keep a long-running workstream grounded by writing decisions and open loops to disk, then reviewing the diff."
category: "Operations"
trigger: "A persistent agent thread learns something durable"
cadence: "At the end of each meaningful work session"
tooling: "Notes repo, Git, project memory, PR diff"
proof: "Memory updates are reviewable as file diffs"
stop: "New decisions, preferences, blockers, and closed loops are recorded"
memory: "The notes repo is the source of truth"
source_title: "Codex-maxxing"
source_url: "https://jxnl.co/writing/2026/05/10/codex-maxxing/"
attribution: "Jason Liu"
status: curated
tags:
  - memory
  - workstreams
  - notes
---

## Loop

Use this when a thread or agent should survive beyond one chat.

1. Keep workstream notes in version-controlled files.
2. Ask the agent to update people, projects, decisions, and open-loop pages as it learns.
3. Keep updates concise and inspectable.
4. Review the diff before accepting memory changes.
5. Remove stale or speculative notes.

Stop when durable context is in files and the diff accurately reflects what changed.
