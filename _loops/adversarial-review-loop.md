---
layout: loop
title: "Adversarial review loop"
excerpt: "Use a fresh context to review a diff against the original requirements, then fix only correctness gaps."
category: "Engineering"
trigger: "A feature, migration, or bug fix is ready for review"
cadence: "Before merge"
tooling: "Git diff, subagent or second session, tests"
proof: "Findings cite concrete gaps against the requirements"
stop: "No correctness or requirement gaps remain"
memory: "Record accepted findings and rejected non-issues in the PR"
attribution: "Anthropic"
status: curated
tags:
  - code-review
  - verification
  - pull-request
---

Run an independent review after the implementation session finishes.

1. Give the reviewer the plan, acceptance criteria, and diff.
2. Ask for gaps that affect correctness, coverage, security, or stated requirements.
3. Ignore style-only suggestions unless they block the requirements.
4. Fix accepted findings in the implementation session.
5. Re-run the same tests and review once more.

End only when the reviewer has no remaining requirement-level findings and the evidence is attached to the PR.
