---
layout: post
title: "What Are Context Graphs, Really?"
excerpt: "The conversation around context graphs has exploded, but the term itself has become a Rorschach test. This is not about adding memory to your agent—it's about rethinking our assumptions about data, time, and organizational knowledge. The Two Clocks Problem reveals why we're missing half of time in enterprise systems, and why this is fundamentally a representation problem, not a database problem."
author: Subramanya N
date: 2026-01-01
tags: [Context Graphs, Agentic AI, Enterprise AI, Two Clocks Problem, Event Sourcing, Graph Representation Learning, AI Infrastructure, Organizational Memory]
image: /assets/images/context_graphs_followup.png
ready: true
---

Last week, I wrote about my reaction to Jaya Gupta's viral post on Context Graphs [1]. The idea of a "system of record for decisions" resonated deeply, framing the evolution of agentic infrastructure from tools to skills to memory. But since then, the conversation has exploded, and it has become clear that the term "context graph" itself is a bit of a Rorschach test. Everyone sees something different.

Animesh Koratana, founder of PlayerZero, has written a series of follow up posts that cut through the noise and get to the heart of what a context graph actually is, and why it is so structurally hard to build [2] [3]. His insights are critical for anyone serious about building agentic AI in the enterprise. This is not about "adding memory to your agent" or wiring up a graph database. It is about rethinking our assumptions about data, time, and the nature of organizational knowledge.

## The Two Clocks Problem: Why We Are Missing Half of Time

Koratana's most powerful insight is what he calls the **Two Clocks Problem**. We have built trillion dollar infrastructure for the **state clock**: what is true right now. Your CRM stores the final deal value. Your ticketing system stores "resolved." Your codebase stores the current state.

But we have almost no infrastructure for the **event clock**: what happened, in what order, and with what reasoning. The git blame shows *who* changed the timeout from 5s to 30s, but the *why* is gone. The CRM says "closed lost," but it does not say you were the second choice and the winner had one feature you are shipping next quarter. As Koratana puts it:

> "We've built trillion-dollar infrastructure for what's true now. Almost nothing for why it became true."

This is the core of the problem. We are asking agents to exercise judgment without access to precedent. We are training lawyers on verdicts without case law. The context graph is the infrastructure for the event clock. It is the case law of the enterprise.

## The Five Coordinate Systems Problem: Why This Is Not a Database Problem

So why can't we just build a better database? Because a context graph requires joins across five different coordinate systems that do not share keys:

1.  **Events**: What happened?
2.  **Timeline**: When did it happen?
3.  **Semantics**: What does it mean?
4.  **Attribution**: Who owned it?
5.  **Outcome**: What did it cause?

Each of these has a different geometry. Timelines are linear. Events are sequential. Semantics live in vector space. Attribution is graph structured. Outcomes are causal DAGs. And the keys are fluid. "Jaya Gupta" in an email, "J. Gupta" in a contract, and "@JayaGup10" in Slack are the same entity with no shared identifier.

Traditional databases are built for joins on stable keys within a single coordinate system. Context graphs require probabilistic joins across all five simultaneously. This is not a database problem; it is a representation problem.

## Agents as Informed Walkers: How We Solve the Representation Problem

If the ontology of every organization is different and constantly changing, how can we ever hope to model it? Koratana's answer is that we do not have to. The agents do it for us.

When an agent works through a problem, its trajectory is a trace through the state space of the organization. It is an implicit map of the ontology, discovered through use rather than specified upfront. This is the key insight from graph representation learning (node2vec): you do not need to know the structure of a graph to learn representations of it. You just need to walk it.

Agents are **informed walkers**. Their trajectories are not random; they are problem directed. By accumulating enough of these trajectories, we can learn embeddings that encode the structure of the organization. We can learn that two engineers who never interact are structurally equivalent because they play the same role in different subgraphs. We can learn that a certain sequence of events is a precursor to churn, even if those events have never been explicitly linked.

## What This Actually Means for Builders

So, what is a context graph, really? It is not a graph database. It is not a vector store. It is a **learned representation of organizational reasoning, derived from the trajectories of agents solving problems**.

This has profound implications for how we build agentic systems:

1.  **The agents are not building the context graph; they are solving problems worth solving.** The context graph is an emergent property of their work. The focus should be on deploying agents into real workflows, not on building a perfect ontology upfront.
2.  **The value is in the trajectories, not the state.** We need to shift our focus from storing the final state to capturing the full, replayable history of how that state was reached.
3.  **This is a machine learning problem, not a data engineering problem.** The goal is not to build a perfect data model, but to learn a representation that is useful for reasoning.

Building a context graph is not about buying a new piece of software. It is about a fundamental shift in how we think about data, time, and the nature of work in the agentic era. It is about recognizing that the most valuable asset we have is not our data, but the accumulated wisdom of the decisions we make every day. And it is about building the infrastructure to finally capture that wisdom and put it to work.

**References:**

[1] [Gupta, J. (2025, December 23). *AI's trillion-dollar opportunity: Context graphs*. X.](https://x.com/JayaGup10/status/2003525933534179480)

[2] [Koratana, A. (2026, January 1). *Why context graphs are rare in the wild*. LinkedIn.](https://www.linkedin.com/pulse/why-context-graphs-rare-wild-animesh-koratana-3wzte/)

[3] [Koratana, A. (2025, December 28). *How to build a context graph*. LinkedIn.](https://www.linkedin.com/pulse/how-build-context-graph-animesh-koratana-6abve)
