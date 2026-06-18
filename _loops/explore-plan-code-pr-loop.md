---
layout: loop
title: "Explore, plan, code, PR loop"
excerpt: "Separate codebase exploration from implementation, then verify the change and open a reviewable PR."
category: "Engineering"
trigger: "A change touches multiple files or unfamiliar code"
cadence: "Per feature or meaningful bug fix"
tooling: "Repo search, tests, build, GitHub"
proof: "Plan is reflected in the diff and checks pass"
stop: "PR is open with evidence and no known failing checks"
memory: "Keep the plan and verification notes in the PR description"
source_title: "Claude Code best practices"
source_url: "https://code.claude.com/docs/en/best-practices"
attribution: "Anthropic"
status: curated
tags:
  - planning
  - pull-request
  - tests
---

## Loop

Use this when implementation risk comes from not understanding the existing system.

1. Explore the relevant files, commands, docs, and tests without editing.
2. Write a concrete plan that names files, data flow, risks, and verification.
3. Implement the plan in the smallest coherent changes.
4. Run the planned verification.
5. Fix failures and update the plan if reality changed.
6. Open a PR with the plan, diff summary, and verification evidence.

Stop when the PR reviewer can understand what changed and how it was proven.
