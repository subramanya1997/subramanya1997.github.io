---
layout: loop
title: "Fan-out migration loop"
excerpt: "Generate a file list, test the migration prompt on a small sample, then run the same constrained task across many files."
category: "Engineering"
trigger: "A repeated migration spans many files"
cadence: "Per migration batch"
tooling: "Task list, isolated sessions, scoped permissions, test suite"
proof: "Representative samples pass before broad execution"
stop: "Every target file is migrated or explicitly marked failed"
memory: "Write an audit table of OK, skipped, and failed files"
source_title: "Claude Code best practices"
source_url: "https://code.claude.com/docs/en/best-practices"
attribution: "Anthropic"
status: curated
tags:
  - migration
  - parallel
  - batching
---

## Loop

Use this when the same transformation can be applied independently to many files.

1. Produce the complete target file list.
2. Run the migration manually on two or three representative files.
3. Refine the prompt and allowed tools until the sample produces clean diffs.
4. Execute the migration across the full list in isolated sessions or batches.
5. Collect structured OK, skipped, and failed results.
6. Run the full project verification after batches are integrated.

Stop when each target file has a recorded outcome and the integrated checks pass.
