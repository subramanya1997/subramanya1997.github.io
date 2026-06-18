---
layout: loop
title: "Support refund polling loop"
excerpt: "Poll a customer-support chat until an agent joins, then respond quickly with the goal and evidence."
category: "Customer support"
trigger: "A support chat is waiting for a human agent"
cadence: "Every 5 minutes until joined, then every minute"
tooling: "Browser or computer control, order details, support chat"
proof: "Support agent response and refund or escalation result are captured"
stop: "Refund is completed, escalation is logged, or human input is required"
memory: "Store order, timestamps, support outcome, and follow-up needs"
source_title: "Codex-maxxing"
source_url: "https://jxnl.co/writing/2026/05/10/codex-maxxing/"
attribution: "Jason Liu"
status: curated
tags:
  - support
  - polling
  - browser
---

## Loop

Use this for support queues where the expensive part is waiting and responding promptly.

1. Keep the support chat open.
2. Poll at a low cadence while waiting for an agent.
3. Once an agent joins, increase cadence.
4. Present the concise goal, account/order context, and relevant evidence.
5. Respond to questions without inventing facts.
6. Capture the final outcome.

Stop when the refund is complete, the case is escalated, or the agent asks for information only the user can provide.
