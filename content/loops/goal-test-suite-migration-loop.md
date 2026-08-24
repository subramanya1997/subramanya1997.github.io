---
layout: loop
title: "Goal with test-suite oracle"
excerpt: "Give a long-running agent migration a hard finish line by requiring it to satisfy an existing test suite."
category: "Engineering"
trigger: "A port, rewrite, or migration has a trusted reference test suite"
cadence: "Until the goal is complete or blocked"
tooling: "Goal runner, original tests, build logs, implementation repo"
proof: "The target implementation passes the reference tests"
stop: "The full reference suite passes or a blocker is documented"
memory: "Persist failing tests, fixes, and remaining incompatibilities"
attribution: "Jason Liu"
status: curated
tags:
  - migration
  - goals
  - tests
---

Use this when a large task needs an external oracle instead of vibes.

1. Identify the reference implementation and test suite.
2. Make the success condition explicit: the new implementation must pass those tests.
3. Run the tests before changing code and record the baseline.
4. Implement in small passes.
5. Rerun failing tests after each pass.
6. Keep a compatibility ledger for known gaps.

Stop when the reference suite passes or the blocker is precise enough for a human decision.
