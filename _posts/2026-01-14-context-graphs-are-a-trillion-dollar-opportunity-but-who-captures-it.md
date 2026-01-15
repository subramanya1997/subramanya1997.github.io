---
layout: post
title: "Context Graphs Are a Trillion-Dollar Opportunity. But Who Actually Captures It?"
excerpt: "The concept of Context Graphs has rapidly captured the industry's imagination. The thesis is that the next trillion-dollar enterprise platforms will not be systems of record for data, but systems of record for decisions. But who actually captures this opportunity? The answer is hiding in plain sight—in the agentic tools that are already operating in the wild, generating decision traces every second."
author: Subramanya N
date: 2026-01-14
tags: [Context Graphs, Agentic AI, Enterprise AI, Claude Code, Claude Cowork, AI Infrastructure, Systems of Record, Anthropic]
image: /assets/images/context_graphs_opportunity.png
ready: true
---

The concept of **Context Graphs**, first articulated by Jaya Gupta of Foundation Capital, has rapidly captured the industry's imagination [1]. The thesis is that the next trillion-dollar enterprise platforms will not be systems of record for data, but systems of record for **decisions**.

The thesis is compelling. But the most pressing question remains: **who actually captures this trillion-dollar opportunity?**

The answer, I believe, is hiding in plain sight. It is not in the data warehouses or the CRMs. It is in the agentic tools that are already operating in the wild, in the execution path, generating decision traces every second. And the most advanced and widely discussed of these tools, Anthropic's Claude Code and the newly released Claude Cowork, provide a fascinating, real-world case study of both the immense potential and the critical, missing piece.

## The Agents in the Arena: Claude Code and Cowork

On January 12, 2026, Anthropic launched Claude Cowork, a desktop agent that extends the power of its developer-focused Claude Code tool to non-technical users [2]. This was not just another feature release. It was a statement. While the industry has been debating the future of agentic workflows, Anthropic has been shipping them.

What makes Claude Code and Cowork so different is that they are not just chatbots; they are **doers**. They operate within a designated folder on your computer, with the ability to read, write, and create files. They can take a messy folder of receipts and turn it into a structured expense report. They can take scattered notes and draft a coherent document. They are, in short, executing complex, multi-step tasks that generate a rich history of decisions.

Perhaps the most stunning demonstration of this was the revelation that Claude Cowork itself was built almost entirely by Claude Code in about a week and a half. Think about that. An AI agent planned and executed the creation of a new software product. This is not a theoretical exercise; it is a real-world, complex **decision trace** of immense value.

## The Irony: Generating Traces, But Not Capturing Them

Every time a developer uses Claude Code to refactor a codebase, or a project manager uses Claude Cowork to organize a project folder, a decision trace is generated. The agent is walking the graph of the user's intent, pulling context from different files, making decisions, and executing actions. It is creating the raw material of a context graph.

But where does that raw material go? It evaporates. It is ephemeral, living for a moment in the agent's context window or the user's chat history, but it is not persisted as a structured, queryable artifact. The *why* is lost, leaving only the *what*.

This is the central irony of the current agentic landscape. The most advanced agentic tools are the perfect instruments for creating context graphs, yet they are not being used for that purpose. They are generating a constant stream of valuable decision data that is simply being discarded.

![The Ephemeral Nature of Decision Traces in Today's Agents](/assets/images/context_graphs_agentic_loop.png){: width="2752" height="1536" }

*The Ephemeral Nature of Decision Traces in Today's Agents*

![The Evolution of Agentic Infrastructure](/assets/images/context_graphs_evolution.png){: width="2752" height="1536" }

## Why Incumbents Can't Just Add This Feature

Incumbents are structurally disadvantaged from capturing this opportunity. They are simply in the wrong place architecturally.

*   **Systems of Record (Salesforce, Workday):** These platforms are built to store the current **state** of an object. They know the deal is closed-won, but they do not have a record of the dozen steps, approvals, and exceptions that led to that outcome. They are in the wrong architectural layer.
*   **Data Warehouses (Snowflake, Databricks):** These platforms are in the **read path**, not the write path. They receive data via ETL *after* the decisions have been made and the context has been lost. They can tell you what happened, but they cannot tell you why.

Trying to retrofit decision trace capture onto these systems is like trying to understand a chess game by only looking at the final board position. You have lost the move-by-move history that contains all the strategic insight.

![The Context Graph Opportunity Landscape](/assets/images/context_graphs_opportunity.png){: width="2752" height="1536" }

## The Real Race: Who Builds the "Event Clock" for Agents?

So, who are the real contenders?

| Contender | Strengths | Weaknesses |
| :--- | :--- | :--- |
| **Anthropic (The Agent Provider)** | Owns the agent and the execution path. In the pole position to build persistence directly into their products. | Not their core business. May see it as a feature, not a platform. Risks vendor lock-in for customers. |
| **Orchestration Startups** | Focused on the cross-system workflow layer where context is richest. Can be vendor-neutral, orchestrating agents from multiple providers. | Need to convince customers to adopt a new layer in their stack. Dependent on agent providers for core capabilities. |

This brings us to a critical distinction. The goal is not to simply monitor agents. Agent observability and telemetry tools are useful for capturing the *what*—metrics, logs, and traces of execution. They can tell you an agent made 10 API calls and wrote 3 files. But they cannot tell you *why*.

![Telemetry vs. Decision Traces](/assets/images/context_graphs_telemetry.png){: width="2752" height="1536" }

A **decision trace** captures the reasoning, the context, and the precedents that led to an action. This is a fundamentally different and more valuable asset than telemetry. The trillion-dollar prize will go to whoever successfully builds the **event clock** for the agentic era—the system that captures the decision traces of every agent, human, and automated process in the enterprise. My bet is on a new category of company to emerge: one that is purpose-built to be this system of record for decisions.

## From "Code" and "Cowork" to "Context"

Jaya Gupta was right. The opportunity is massive. But the winner will not be a better database or a smarter CRM. The winner will be the company that recognizes that the actions of agents like Claude Code and Cowork are not just outputs; they are assets. They are the building blocks of the enterprise's collective intelligence.

For Anthropic, the path seems clear. The next logical product in their suite is not just a new skill or a new integration. It is **Claude Context**: a platform that captures, stores, and makes sense of every decision trace their agents generate. It would transform their tools from powerful productivity aids into an indispensable system of record for the modern enterprise.

Whether Anthropic seizes this opportunity or leaves the door open for a new wave of startups remains to be seen. But one thing is certain: the race to build the context graph is on, and the companies that are in the execution path of agentic work are the ones with the head start.

**References:**

[1] [Gupta, J. (2025, December 22). *AI's trillion-dollar opportunity: Context graphs*. Foundation Capital.](https://foundationcapital.com/context-graphs-ais-trillion-dollar-opportunity/)

[2] [Nuñez, M. (2026, January 12). *Anthropic launches Cowork, a Claude Desktop agent that works in your files — no coding required*. VentureBeat.](https://venturebeat.com/technology/anthropic-launches-cowork-a-claude-desktop-agent-that-works-in-your-files-no)
