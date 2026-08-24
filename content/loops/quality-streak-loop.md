---
layout: loop
title: "Quality streak loop"
excerpt: "Run realistic cases until N pass in a row, restarting the streak whenever a failure is found and fixed."
category: "Evaluation"
trigger: "A workflow needs confidence under varied realistic inputs"
cadence: "Before release or after major fixes"
tooling: "Scenario generator, browser, tests, benchmark log"
proof: "The latest N realistic scenarios pass consecutively"
stop: "N consecutive scenarios pass with failures documented and protected"
memory: "Track failed cases, fixes, regression tests, and streak count"
attribution: "Matthew Berman"
status: curated
tags:
  - evaluation
  - qa
  - regression
---

Use this to force a workflow through varied examples without accepting a lucky pass.

1. Choose the required streak length before testing.
2. Generate or select realistic scenarios one at a time.
3. Run each scenario and record evidence.
4. When a scenario fails, document it, fix the root cause, and add regression coverage.
5. Reset the streak after every failure.
6. Continue until the target streak passes.

Stop when the latest N scenarios pass in a row and every earlier failure has a regression guard.
