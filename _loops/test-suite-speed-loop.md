---
layout: loop
title: "Test-suite speed loop"
excerpt: "Make a test suite faster without losing coverage or behavior, proving each improvement with repeatable timing."
category: "Engineering"
trigger: "Test runtime slows development or CI"
cadence: "Per performance improvement batch"
tooling: "Test runner, coverage report, profiler, CI"
proof: "Suite is faster with no coverage or behavior regression"
stop: "Timing target is met or remaining slowness has owners"
memory: "Record baseline, changes, timing method, and final runtime"
source_title: "Forward Future Loop Library"
source_url: "https://signals.forwardfuture.ai/loop-library/#top"
attribution: "Matthew Berman"
status: curated
tags:
  - tests
  - performance
  - ci
---

## Loop

Use this when slow tests are causing real workflow drag.

1. Capture a timing baseline under repeatable conditions.
2. Identify the slowest tests or setup phases.
3. Improve one bottleneck at a time without deleting coverage.
4. Run the full suite and coverage report after each meaningful change.
5. Compare against the baseline with the same timing method.
6. Document any tradeoffs.

Stop when the target runtime is reached or remaining work is explicit and owned.
