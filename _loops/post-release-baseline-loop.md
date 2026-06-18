---
layout: loop
title: "Post-release baseline loop"
excerpt: "After a release lands, rerun standard benchmarks and store the new baseline with environment details."
category: "Release"
trigger: "A release finishes deploying"
cadence: "After each release"
tooling: "Benchmark suite, release SHA, environment metadata"
proof: "Baseline results are tied to the released revision"
stop: "Results, conditions, and benchmark version are recorded"
memory: "Append baseline data to the performance history"
source_title: "Forward Future Loop Library"
source_url: "https://signals.forwardfuture.ai/loop-library/#top"
attribution: "Matthew Berman"
status: curated
tags:
  - benchmarks
  - release
  - performance
---

## Loop

Use this to keep performance comparisons honest across releases.

1. Wait until the release is deployed and stable.
2. Capture release SHA, environment, benchmark version, and test conditions.
3. Run the standard benchmark suite.
4. Compare against the prior baseline and flag large movement.
5. Store the new baseline with enough context to reproduce it.

Stop when the release has a benchmark record that future runs can compare against.
