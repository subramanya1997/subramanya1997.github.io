---
layout: loop
title: "Production data cleanup loop"
excerpt: "Audit records against an allowed definition, clean invalid data, improve classification, and prove the retained data is valid."
category: "Data quality"
trigger: "Production data contains stale, invalid, duplicate, or disallowed records"
cadence: "Per cleanup batch"
tooling: "Database queries, classifier tests, audit report, backup"
proof: "Post-cleanup sample and tests show remaining records meet the allowed definition"
stop: "No reviewed record violates the allowed definition"
memory: "Log removed records, rules changed, and audit sample"
source_title: "Forward Future Loop Library"
source_url: "https://signals.forwardfuture.ai/loop-library/#top"
attribution: "Matthew Berman"
status: curated
tags:
  - data-quality
  - production
  - cleanup
---

## Loop

Use this when data cleanup needs repeatable proof rather than one-off deletion.

1. Define the allowed record criteria before touching data.
2. Query candidate records and sample edge cases.
3. Back up or export the affected set.
4. Remove or repair only records that fail the definition.
5. Improve classification logic so the issue is less likely to recur.
6. Run post-cleanup audits and representative tests.

Stop when retained records pass the definition and cleanup evidence is recorded.
