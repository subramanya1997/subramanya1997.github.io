---
layout: post
title: "Context Graphs: My Thoughts on the Trillion Dollar Evolution of Agentic Infrastructure"
excerpt: "After reading Jaya Gupta's post about Context Graphs, I have not been able to stop thinking about it. For me, it did something personal: it gave a name to the architectural pattern I have been circling around in the agentic infrastructure discussions on this blog for the past year. Gupta's thesis is simple but profound—the last generation of enterprise software created trillion dollar companies by becoming systems of record. The question now is whether a new layer will emerge on top of them: a system of record for decisions."
author: Subramanya N
date: 2025-12-26
tags: [Context Graphs, Agentic AI, Enterprise AI, MCP, Agent Skills, AI Infrastructure, Decision Traces, AI Governance, Systems of Record]
image: /assets/images/context-graphs.png
ready: true
---

After reading Jaya Gupta's post about Context Graphs, I have not been able to stop thinking about it [1]. For me, it did something personal: it gave a name to the architectural pattern I have been circling around in the agentic infrastructure discussions on this blog for the past year.

Gupta's thesis is simple but profound. The last generation of enterprise software (Salesforce, Workday, SAP) created trillion dollar companies by becoming **systems of record**. Own the canonical data, own the workflow, own the lock in. The question now is whether those systems survive the shift to agents. Gupta argues they will, but that a new layer will emerge on top of them: **a system of record for decisions**.

I agree. And I think this is the missing piece that connects everything I have been writing about.

## The Missing Layer: Decision Traces

What resonated most with me was Gupta's articulation of the **decision trace**. This is the context that currently lives in Slack threads, deal desk conversations, escalation calls, and people's heads. It is the exception logic that says, "We always give healthcare companies an extra 10% because their procurement cycles are brutal." It is the precedent from past decisions that says, "We structured a similar deal for Company X last quarter, we should be consistent."

None of this is captured in our systems of record. The CRM shows the final price, but not who approved the deviation or why. The support ticket says "escalated to Tier 3," but not the cross system synthesis that led to that decision. As Gupta puts it:

> "The reasoning connecting data to action was never treated as data in the first place."

This is the wall that every enterprise hits when they try to scale agents. The wall is not missing data. It is missing **decision traces**.

## From Tools to Skills to Context: The Evolution I Have Been Documenting

Reading Gupta's post, I realized that the evolution I have been documenting on this blog (from MCP to Agent Skills to governance) is really a story about building the infrastructure for context graphs. Let me explain.

**Phase 1** was about **tools**. The Model Context Protocol (MCP) gave agents the ability to interact with external systems. It was the plumbing that connected agents to databases, APIs, and the outside world. But we quickly learned that tool access alone is not enough. An agent with a hammer is not a carpenter.

**Phase 2** was about **skills**. Anthropic's Agent Skills standard gave us a way to codify procedural knowledge, the "how to" guides that teach agents to use tools effectively. Skills are the brain of the agent. They turn tribal knowledge into portable, composable assets. But even skills are not enough. An agent with a hammer and a carpentry manual is still not a master carpenter.

**Phase 3** is about **context**. This is where context graphs come in. A context graph is the accumulated record of every decision, every exception, and every outcome. It answers the question, "What happened last time?" It turns exceptions into precedents and tribal knowledge into institutional knowledge.

| **Phase** | **Primitive** | **What It Provides** | **My Analogy** |
|---|---|---|---|
| **Phase 1** | Tools (MCP) | Capability | The agent has a hammer. |
| **Phase 2** | Skills (Agent Skills) | Expertise | The agent has a carpentry manual. |
| **Phase 3** | Context (Context Graphs) | Experience | The agent has access to the record of every house it has ever built. |

## Why This Matters for the Governance Stack

The governance stack I have been advocating for (agent registries, tool registries, skill registries, policy engines) is the infrastructure that makes context graphs possible. The agent registry provides the identity of the agent making the decision. The tool registry (MCP) provides the capabilities available to that agent. The skill registry provides the expertise that guides the agent's actions. And the orchestration layer is where the decision trace is captured and persisted.

Without this infrastructure, decision traces are ephemeral. They exist for a moment in the agent's context window and then disappear. With this infrastructure, every decision becomes a durable artifact that can be audited, learned from, and used as precedent.

## My Takeaway

Gupta is right that agent first startups have a structural advantage here. They sit in the execution path. They see the full context at decision time. Incumbents, built on current state storage, simply cannot capture this.

But the bigger insight for me is this: **we are not just building agents. We are building the decision record of the enterprise.** The context graph is not a feature; it is the foundation of a new kind of system of record. The enterprises that win in the agentic era will be those that recognize this and invest in the infrastructure to capture, store, and leverage their decision traces.

We started by giving agents tools. Then we taught them skills. Now, we must give them context. That is the trillion dollar evolution.

**References:**

[1] [Gupta, J. (2025, December 23). *AI's trillion dollar opportunity: Context graphs*. X.](https://x.com/JayaGup10/status/2003525933534179480)
