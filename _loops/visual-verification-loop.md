---
layout: loop
title: "Visual verification loop"
excerpt: "Compare the implemented UI against a screenshot or design, list differences, fix them, and repeat."
category: "Evaluation"
trigger: "A UI change needs visual fidelity"
cadence: "Per UI change"
tooling: "Browser screenshot, design reference, console, responsive viewports"
proof: "Screenshots show the implemented UI matches the target within agreed differences"
stop: "No material visual differences remain across target viewports"
memory: "Attach before and after screenshots to the PR"
source_title: "Claude Code best practices"
source_url: "https://code.claude.com/docs/en/best-practices"
attribution: "Anthropic"
status: curated
tags:
  - ui
  - screenshots
  - qa
---

## Loop

Use this when "looks good" needs evidence.

1. Capture or attach the target visual reference.
2. Implement the UI change.
3. Take screenshots at the required viewport sizes.
4. Compare the result against the target and list differences.
5. Fix material differences.
6. Repeat until the comparison is clean.

Stop when screenshots prove the accepted design state across target viewports.
