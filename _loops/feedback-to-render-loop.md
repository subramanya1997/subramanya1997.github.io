---
layout: loop
title: "Feedback to render loop"
excerpt: "Monitor a feedback thread, revise the artifact when comments arrive, re-render, and post the new version for review."
category: "Operations"
trigger: "A reviewer comments on a shared artifact"
cadence: "Every 15 minutes until approved"
tooling: "Slack, renderer, browser or computer control, file upload"
proof: "New artifact version addresses the latest feedback"
stop: "Reviewer approves or no new feedback remains"
memory: "Track feedback, version links, and unresolved decisions"
source_title: "Codex-maxxing"
source_url: "https://jxnl.co/writing/2026/05/10/codex-maxxing/"
attribution: "Jason Liu"
status: curated
tags:
  - feedback
  - rendering
  - slack
---

## Loop

Keep artifact review moving after the first handoff.

1. Watch the review thread at the selected cadence.
2. Summarize each new comment into a change request or question.
3. Apply changes to the source artifact.
4. Re-render or regenerate the output.
5. Upload the new version and tag the reviewer.
6. Record which comments were handled.

Stop when reviewers approve, no actionable feedback remains, or a human decision is needed.
