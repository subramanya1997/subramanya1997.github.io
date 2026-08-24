---
layout: loop
title: "Production error sweep"
excerpt: "Scan production logs, fix actionable root causes, verify the fix, and send a concise status update."
category: "Operations"
trigger: "Production logs or monitoring may contain new actionable errors"
cadence: "Hourly, daily, or after deploy"
tooling: "Logs, traces, issue tracker, tests, GitHub, Slack"
proof: "Error is reproduced or traced, fix is verified, and PR links evidence"
stop: "Actionable errors are fixed or a clean-log confirmation is posted"
memory: "Record incident, root cause, fix link, and prevention note"
attribution: "Matthew Berman"
status: curated
tags:
  - production
  - logs
  - incident
---

Use this as an operational maintenance check.

1. Review production logs and monitoring for new high-signal errors.
2. Ignore noise only after explaining why it is not actionable.
3. Trace each actionable issue to a likely root cause.
4. Write or update a regression test when possible.
5. Fix the root cause and verify the original signal is gone.
6. Open a PR or post a clean-log summary.

Stop when every reviewed error is resolved, owned, or explicitly not actionable.
