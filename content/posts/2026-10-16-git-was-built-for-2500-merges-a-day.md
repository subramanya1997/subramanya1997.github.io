---
layout: post
title: "Git Was Built for 2,500 Merges a Day"
description: "In four weeks every major AI lab rebuilt the same thing: a server-arbitrated, versioned workspace where humans and agents write to the same state. What Anthropic, Perplexity, OpenAI, Google, Microsoft and Cursor shipped, why FUSE lost, why the Git client is dying while the Git model survives, and what is still unsolved."
excerpt: "Anthropic merged about 2,500 changes a day in May and more than 30,000 a day in September. Git's client could not keep up, so they inverted it. Between September 16 and October 15, 2026, every major lab hit the same wall and shipped the same primitive. Storage is solved. Deciding who wins a write is not."
author: Subramanya N
date: 2026-10-16
last_modified_at: 2026-10-16
image: /assets/images/git-merges-a-day-card.png
tags: [AI Agents, Agentic AI, Source Control, Git, Agent Infrastructure, Virtual Filesystem, Sandboxing, Anthropic, Perplexity, OpenAI, Developer Tools]
mermaid: false
ready: true
schema_type: TechArticle
faq:
  - q: "Why did Anthropic replace Git?"
    a: "Volume. Anthropic averaged about 2,500 merges to main per day in May 2026 and more than 30,000 per day by September, almost all of them written by Claude. Git assumes every client is a full server with a complete offline copy of the repository. At that rate the mirrors and clones became the bottleneck, so a seven-person team built Scion, where the server is authoritative, changesets are created server-side, and moving a shared ref is one compare-and-swap on a single Cloud Spanner row."
  - q: "What is the difference between a fork layer and write arbitration?"
    a: "The fork layer is where an agent's private copy lives: a whole VM, a storage bucket, a file or shard, a repository, or a single document. Write arbitration is the rule for what happens when two writers want the same state at the same time: compare-and-set on the head with replay, branch then merge, last writer wins with every version kept, or live co-editing. Every product that shipped in the September to October 2026 window is one cell in that grid."
  - q: "Why did Perplexity reject a FUSE filesystem for agents?"
    a: "They measured it. A FUSE-backed virtual filesystem was roughly 400 times slower than local files on filesystem-heavy work, because every request needs a network round trip, and it needed privileged capabilities from the host, which would have forced every agent into a privileged sandbox. They kept Git as the model and wire format, gave each agent a local checkout inside a sandbox, and moved the arbitration to a server."
  - q: "Is the Git client dead?"
    a: "For agents at scale, yes, in the sense that both Anthropic and Perplexity kept the Git model and wire format but stopped relying on the Git client's local-first design. Humans still clone and push. Agents submit to an authoritative server that decides whether the change was built on the current head. Anthropic says plainly that Scion is not a suitable Git replacement for general use."
---

In May 2026, Anthropic merged about 2,500 code changes into main every day. By September it was more than 30,000 a day.[1] That is a 12x jump in four months, and almost none of those changes were typed by a person. Claude wrote them.

Git did not break at that number. The thing that broke was the assumption underneath Git, and underneath almost every storage and collaboration tool of the last twenty years. The assumption is that writes arrive at human speed, from one author at a time, and that the author is sometimes offline. Agents write at machine speed, in parallel, and they are never offline.

Between September 16 and October 15, 2026, every major lab hit that wall in public. Anthropic, Perplexity, OpenAI, Google, and Microsoft each shipped, or described, the same primitive: a versioned workspace where humans and agents write to the same state, with a server deciding who wins. Nobody coordinated this. They all arrived at the same answer because the problem only has one shape.

This post walks through what each of them built, what it has in common, and what is still open. I will keep the jargon light. If a sentence needs a glossary, I did not write it well enough.

## Four weeks, one primitive

Here is the window, day by day. Blue is a workspace people use. Red is the write path underneath it, the part that decides what happens when two writers collide.

<style>
.gb-fig{--paper:#FFFFFF;--surface:#F7F6F3;--surface-2:#EFEDE8;--ink:#111111;--ink-soft:#3F3F3F;--muted:#6B6B6B;--rule:#E3E1DC;--rule-strong:#CFCCC5;--wp:#A63D2F;--ws:#3A66C4;--grid:#E8E6E1;--shade:rgba(166,61,47,0.07);--gb-mono:"SF Mono",Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;margin:2.2rem 0;font-family:inherit;}
.gb-fig *{box-sizing:border-box;}
.gb-card{border:1px solid var(--rule);background:var(--surface);padding:22px 24px 18px;border-radius:6px;}
.gb-head{display:flex;align-items:baseline;gap:12px;margin:0 0 4px;flex-wrap:wrap;}
.gb-t{font-family:inherit;font-weight:700;font-size:17px;color:var(--ink);letter-spacing:-.01em;}
.gb-s{font-family:inherit;font-size:14px;color:var(--muted);margin:2px 0 18px;line-height:1.5;}
.gb-c{font-family:inherit;font-size:13px;color:var(--muted);margin-top:14px;line-height:1.55;}
.gb-c a{color:#0066CC;text-decoration:none;border-bottom:1px solid rgba(0,102,204,.25);}
.gb-c a:hover{border-bottom-color:#0066CC;}
.gb-box{width:100%;overflow-x:auto;}
.gb-fig svg.chart{display:block;width:100%;height:auto;}
.gb-fig .ax{fill:var(--muted);font-family:var(--gb-mono);font-size:12px;}
.gb-fig .axlab{fill:var(--muted);font-family:var(--gb-mono);font-size:11px;letter-spacing:.04em;}
.gb-fig .val{font-family:var(--gb-mono);font-weight:600;}
.gb-fig .cat{fill:var(--ink-soft);font-family:inherit;font-size:13px;}
.gb-fig .gridline{stroke:var(--grid);stroke-width:1;}
.gb-fig .baseline{stroke:var(--rule-strong);stroke-width:1.5;}
.gb-legend{display:flex;gap:20px;flex-wrap:wrap;font-family:var(--gb-mono);font-size:11.5px;color:var(--ink-soft);margin:2px 0 18px;}
.gb-legend span{display:inline-flex;align-items:center;gap:7px;}
.gb-dot{width:10px;height:10px;border-radius:50%;display:inline-block;}
.gb-dot.wp{background:var(--wp);}
.gb-dot.ws{background:var(--ws);}
.gb-tl{position:relative;margin:0;padding:0;}
.gb-tl::before{content:"";position:absolute;left:78px;top:6px;bottom:6px;width:2px;background:var(--rule-strong);}
.gb-row{display:grid;grid-template-columns:78px 1fr;padding:0 0 22px;position:relative;}
.gb-month{font-family:var(--gb-mono);font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);padding-top:2px;text-align:right;padding-right:20px;}
.gb-events{padding-left:26px;display:flex;flex-direction:column;gap:8px;position:relative;}
.gb-chip{position:relative;background:var(--paper);border:1px solid var(--rule);border-left-width:3px;padding:9px 13px;font-family:inherit;font-size:14px;line-height:1.45;color:var(--ink);border-radius:3px;}
.gb-chip.wp{border-left-color:var(--wp);}
.gb-chip.ws{border-left-color:var(--ws);}
.gb-chip.hero{background:var(--shade);border-color:var(--wp);}
.gb-chip b{font-weight:700;}
.gb-events::before{content:"";position:absolute;left:-4px;top:12px;width:10px;height:10px;border-radius:50%;background:var(--rule-strong);border:2px solid var(--surface);}
.gb-grid{width:100%;min-width:600px;table-layout:fixed;border-collapse:separate;border-spacing:0;font-family:inherit;font-size:13px;}
.gb-fig .gb-grid th,.gb-fig .gb-grid td{border:1px solid var(--rule);padding:8px 9px;vertical-align:top;text-align:left;background:var(--paper);white-space:normal;overflow-wrap:anywhere;}
.gb-grid th{background:var(--surface-2);font-family:var(--gb-mono);font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);font-weight:600;}
.gb-grid th.rowh{background:var(--surface-2);width:110px;}
.gb-grid td.empty{background:var(--surface);}
.gb-pill{display:inline-block;margin:2px 4px 2px 0;padding:3px 8px;border-radius:3px;border:1px solid var(--rule-strong);background:var(--surface);font-size:12.5px;line-height:1.3;color:var(--ink);}
.gb-pill.wp{border-left:3px solid var(--wp);}
.gb-pill.ws{border-left:3px solid var(--ws);}
.gb-pill small{color:var(--muted);font-family:var(--gb-mono);font-size:10.5px;display:block;}
@media (max-width:620px){
.gb-tl::before{left:8px;}
.gb-row{grid-template-columns:1fr;}
.gb-month{text-align:left;padding:0 0 8px 0;}
.gb-events{padding-left:22px;}
.gb-events::before{left:-18px;}
.gb-grid{font-size:12px;}
.gb-grid th,.gb-grid td{padding:6px;}
.gb-grid th.rowh{width:auto;}
}
</style>

<div class="gb-fig">
  <div class="gb-card">
    <div class="gb-head"><span class="gb-t">The launch window, September 16 to October 15, 2026</span></div>
    <div class="gb-s">One row per date. Every entry is a shipped product, a beta, or a published engineering account, not a roadmap.</div>
    <div class="gb-legend"><span><i class="gb-dot ws"></i> Workspace people use</span><span><i class="gb-dot wp"></i> Write path underneath</span></div>
    <div class="gb-tl" role="list" aria-label="Timeline of agent workspace launches from September 16 to October 15, 2026">
      <div class="gb-row" role="listitem"><div class="gb-month">Sep 16</div><div class="gb-events">
        <div class="gb-chip ws"><b>Anthropic folds Cowork into Claude</b> and launches Claude Docs and Slides in beta. Colleagues edit what Claude wrote, one shareable link per project.</div>
      </div></div>
      <div class="gb-row" role="listitem"><div class="gb-month">Sep 17</div><div class="gb-events">
        <div class="gb-chip wp"><b>Claude Projects beta.</b> A coordinator routes work to threads. Each thread is a Claude Code cloud session on its own branch and copy of the repo. Overlap becomes a merge conflict.</div>
      </div></div>
      <div class="gb-row" role="listitem"><div class="gb-month">Sep 29</div><div class="gb-events">
        <div class="gb-chip ws"><b>OpenAI DevDay.</b> Dots, always-on agents with their own cloud computer. ChatGPT Space for teammates and dots. Pages, a document built for humans and agents to work in together.</div>
      </div></div>
      <div class="gb-row" role="listitem"><div class="gb-month">Oct 8</div><div class="gb-events">
        <div class="gb-chip ws"><b>Google Gemini at Work.</b> Coworker agents get their own Workspace account, email, calendar and Drive. They see only what you share with them.</div>
      </div></div>
      <div class="gb-row" role="listitem"><div class="gb-month">Oct 12</div><div class="gb-events">
        <div class="gb-chip wp"><b>Perplexity publishes its workspace design.</b> Each project is a bare Git repo. Agents submit commits from sandboxes. Stale submits get a structured reject and replay.</div>
      </div></div>
      <div class="gb-row" role="listitem"><div class="gb-month">Oct 13</div><div class="gb-events">
        <div class="gb-chip wp hero"><b>Anthropic describes Scion.</b> 2,500 merges a day became 30,000+. One authoritative server, changesets created server-side, refs moved by compare-and-swap on one Spanner row.</div>
      </div></div>
      <div class="gb-row" role="listitem"><div class="gb-month">Oct 15</div><div class="gb-events">
        <div class="gb-chip wp"><b>Perplexity open-sources SPACE,</b> the sandbox platform under its workspaces. Apache 2.0, Rust, Firecracker microVMs, snapshots and checkpoints.</div>
      </div></div>
    </div>
    <div class="gb-c">Seven launches, five companies, four weeks, one shape. Sources: <a href="https://thenextweb.com/news/anthropic-claude-cowork-merge-docs-slides">TNW</a>, <a href="https://claude.com/blog/projects-redesigned">Anthropic</a>, <a href="https://www.cnbc.com/2026/09/29/openai-devday-2026-live-updates.html">CNBC</a>, <a href="https://cloud.google.com/blog/products/ai-machine-learning/welcome-to-gemini-at-work-2026">Google Cloud</a>, <a href="https://www.perplexity.ai/hub/blog/building-shared-workspaces-for-people-and-agents">Perplexity</a>, <a href="https://www.anthropic.com/engineering/redesigning-source-control">Anthropic Engineering</a>, <a href="https://www.perplexity.ai/hub/blog/open-sourcing-space">Perplexity</a>.</div>
  </div>
</div>

Two things stand out. First, the user-facing launches came early in the window and the infrastructure accounts came late. The products shipped first, and then the teams explained what they had to build to make them work. Second, the two most detailed accounts, Anthropic's and Perplexity's, describe nearly the same system, and neither one mentions the other.

## What human-speed tooling assumed

Every tool we use to hold work in progress carries an assumption about how writes arrive. Agents break each one.

**POSIX files assume one writer at a time.** The filesystem has no idea which of two processes should win. Last write wins, silently. That was fine when the two processes were you and your editor. It is not fine when ten agents share a directory.

**Git assumes a rich client and a dumb server.** In Anthropic's words, Git assumes clients work offline and need a complete copy of the repository, and every client is capable of being a full server.[1] The server just stores objects. The client does the thinking: it holds the full history, resolves merges, and decides when to push. That design was a gift to humans on laptops and on planes. For an agent in a sandbox that will exist for ninety seconds, cloning a full repository is most of the work.

**Sync drives assume conflicts are rare.** Dropbox and Drive handle two edits to one file by making a "conflicted copy" and letting a human sort it out. That works when a conflict happens once a month. Agents will produce one every few seconds.

**Cloud docs assume every writer is a person.** Google Docs and Notion arbitrate at the keystroke. That is the right model when the writers are humans typing. An agent does not type. It produces a finished chunk and wants to land it as one unit, and it wants to know whether it landed.

**RAG over documents assumes the corpus is read-only.** Retrieval pipelines chunk and embed a snapshot. They do not have a story for an agent that reads a file, changes it, and needs the next agent to see the change. I wrote about why this pushes agents back toward the filesystem in [The Filesystem Is the Database](/2026/04/13/the-filesystem-is-the-database-why-agents-need-a-new-storage-primitive/).[24]

The common thread is simple. All of these tools were built when writes were slow, sparse, and human. The hard part was storing the bytes. The hard part now is deciding, quickly and correctly, which of many simultaneous writes wins.

## Anthropic: 2,500 to 30,000

Anthropic's number is the one that makes the whole argument.

<div class="gb-fig">
  <div class="gb-card">
    <div class="gb-head"><span class="gb-t">Merges to main per day at Anthropic</span></div>
    <div class="gb-s">May 2026 versus September 2026, as reported by Anthropic. Almost every change is written by Claude.</div>
    <div class="gb-box">
      <svg class="chart" viewBox="0 0 820 340" role="img" aria-label="Bar chart of daily merges to main at Anthropic: about 2,500 per day in May 2026 and more than 30,000 per day in September 2026, a 12 times increase in four months.">
        <line class="gridline" x1="90" y1="130" x2="790" y2="130"/>
        <line class="gridline" x1="90" y1="210" x2="790" y2="210"/>
        <line class="baseline" x1="90" y1="290" x2="790" y2="290"/>
        <text x="84" y="134" text-anchor="end" class="ax">20k</text>
        <text x="84" y="214" text-anchor="end" class="ax">10k</text>
        <text x="84" y="294" text-anchor="end" class="ax">0</text>
        <rect x="200" y="270" width="140" height="20" rx="3" fill="#A63D2F" fill-opacity="0.4"/>
        <text x="270" y="258" text-anchor="middle" class="val" fill="#211E18" font-size="16">~2,500</text>
        <text x="270" y="314" text-anchor="middle" class="cat">May 2026</text>
        <rect x="480" y="50" width="140" height="240" rx="3" fill="#A63D2F"/>
        <text x="550" y="38" text-anchor="middle" class="val" fill="#A63D2F" font-size="16">30,000+</text>
        <text x="550" y="314" text-anchor="middle" class="cat">September 2026</text>
        <line x1="345" y1="262" x2="470" y2="262" stroke="#7C7566" stroke-width="1.2" stroke-dasharray="4 4"/>
        <line x1="470" y1="262" x2="470" y2="60" stroke="#7C7566" stroke-width="1.2" stroke-dasharray="4 4"/>
        <text x="410" y="170" text-anchor="middle" class="val" fill="#211E18" font-size="22">12x</text>
        <text x="410" y="190" text-anchor="middle" class="axlab">in four months</text>
      </svg>
    </div>
    <div class="gb-c">The May figure is "around 2,500" and the September figure is "over 30,000", so 12x is a floor. Source: <a href="https://www.anthropic.com/engineering/redesigning-source-control">Anthropic, "Redesigning source control"</a>.</div>
  </div>
</div>

What they built is called Scion, and the engineering post is unusually candid about why.[1] A seven-person team built Scion and a companion system called Antique and migrated the company in five months. The design inverts Git's client model. There is one authoritative server. Clients are thin and always connected. Changesets are created server-side and are available everywhere instantly. Moving a shared ref, like main, is a compare-and-swap on a single Cloud Spanner row, done separately from creating the changeset. Reads go through three tiers, a local daemon, a cache, and the authoritative server, and each tier keeps a cache hit rate above 99 percent.

The resource numbers are large. The Scion footprint is 200x smaller than the old Git mirroring infrastructure in CPU and memory. CI alone got a 25 percent CPU capacity win.[1]

Two design choices matter more than the numbers. Anthropic did not build a merge queue. The post says a proper merge queue does not make much sense at agent scale, and that they invested in post-merge and pre-deploy testing instead. When changes conflict, Claude fixes the conflict, and the post says it typically does so faster than humans can even identify it. And humans still review every change. What changed is what they review. Reviewers now examine the intent of the change rather than reading every line. The system can apply permissions to individual directories to protect the most sensitive code.[1]

One more line is worth quoting because it sets the boundary for everything below. Anthropic says Scion is by no means a suitable replacement for Git for general use.[1] This is not a product. It is a company telling you what it had to do at 30,000 merges a day.

## Perplexity: the same shape, from the other direction

Perplexity's post came out the day before Anthropic's, and it describes the write path under its Projects product.[2] Projects itself launched on July 30, when Spaces were renamed and given a persistent, hierarchical file system that humans and agents share, plus a memory system called Brain.[5]

The engineering is this. Each project is a bare Git repository on a shared filesystem, AWS S3 Files, split into cells with their own Git service replicas. Agents do not touch the repository directly. Each agent gets a short-lived sandbox on SPACE, Perplexity's in-house sandbox platform, with a local checkout. When the agent is done, it submits. The Git service accepts the submit only if it was built on the current head. Otherwise it returns a structured stale-base response, and the agent replays its change on the new head and resubmits.[2]

The published numbers: fewer than 2 percent of submits are rejected as stale, median submit latency is under 1.7 seconds, and p99 is under 8 seconds. Attaching an agent to a warm checkout takes about 2.9 seconds, versus roughly 8 seconds for a cold start.[2]

Read those two paragraphs next to Anthropic's and the overlap is almost total. An authoritative server. A thin, sandboxed client. A single decision point at the head. Reject and replay instead of a lock. Perplexity did it for research documents and spreadsheets. Anthropic did it for a monorepo. The storage differs. The arbitration is the same.

Here is the inversion as a picture.

<div class="gb-fig">
  <div class="gb-card">
    <div class="gb-head"><span class="gb-t">Rich client, dumb server becomes thin client, authoritative server</span></div>
    <div class="gb-s">Left is Git as designed. Right is the write path both Anthropic and Perplexity built this autumn.</div>
    <div class="gb-box">
      <svg class="chart" viewBox="0 0 940 330" role="img" aria-label="Two flow diagrams. Left, rich client and dumb server: a full local clone with the entire history, edits made offline and committed locally, then pushed to a server that only stores objects. Right, thin client and authoritative server: a thin sandbox checkout, a change submitted against head H, then the server does a compare-and-set on the head. If head is still H the change is accepted and head advances. If head moved the submit is rejected as stale, the client replays on the new head and resubmits.">
        <defs><marker id="gbarw" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="#7C7566"/></marker></defs>
        <text x="228" y="30" text-anchor="middle" class="cat" font-weight="700" font-size="14">Rich client, dumb server</text>
        <text x="710" y="30" text-anchor="middle" class="cat" font-weight="700" font-size="14">Thin client, authoritative server</text>
        <line x1="470" y1="14" x2="470" y2="318" stroke="#CFCCC5" stroke-width="1" stroke-dasharray="3 5"/>
        <rect x="28" y="52" width="400" height="56" rx="6" fill="#ECE6D9" stroke="#CFCCC5" stroke-width="1.3"/>
        <text x="228" y="76" text-anchor="middle" class="cat" font-weight="700">Full local clone</text>
        <text x="228" y="94" text-anchor="middle" class="cat">entire history on every machine</text>
        <line x1="228" y1="108" x2="228" y2="134" stroke="#7C7566" stroke-width="1.6" marker-end="url(#gbarw)"/>
        <rect x="28" y="138" width="400" height="56" rx="6" fill="#ECE6D9" stroke="#CFCCC5" stroke-width="1.3"/>
        <text x="228" y="162" text-anchor="middle" class="cat" font-weight="700">Edit offline, commit locally</text>
        <text x="228" y="180" text-anchor="middle" class="cat">the client resolves merges</text>
        <line x1="228" y1="194" x2="228" y2="220" stroke="#7C7566" stroke-width="1.6" marker-end="url(#gbarw)"/>
        <rect x="28" y="224" width="400" height="56" rx="6" fill="#ECE6D9" stroke="#CFCCC5" stroke-width="1.3"/>
        <text x="228" y="248" text-anchor="middle" class="cat" font-weight="700">Push to a server that stores objects</text>
        <text x="228" y="266" text-anchor="middle" class="cat">and does little else</text>
        <rect x="510" y="52" width="400" height="56" rx="6" fill="#E4E9F4" stroke="#3A66C4" stroke-width="1.3"/>
        <text x="710" y="76" text-anchor="middle" class="cat" font-weight="700">Thin sandbox checkout</text>
        <text x="710" y="94" text-anchor="middle" class="cat">changesets created server-side</text>
        <line x1="710" y1="108" x2="710" y2="134" stroke="#7C7566" stroke-width="1.6" marker-end="url(#gbarw)"/>
        <rect x="510" y="138" width="400" height="56" rx="6" fill="#E4E9F4" stroke="#3A66C4" stroke-width="1.3"/>
        <text x="710" y="162" text-anchor="middle" class="cat" font-weight="700">Submit a change built on head H</text>
        <text x="710" y="180" text-anchor="middle" class="cat">server does compare-and-set on the head</text>
        <line x1="615" y1="194" x2="615" y2="220" stroke="#7C7566" stroke-width="1.6" marker-end="url(#gbarw)"/>
        <line x1="805" y1="194" x2="805" y2="220" stroke="#7C7566" stroke-width="1.6" marker-end="url(#gbarw)"/>
        <rect x="510" y="224" width="190" height="56" rx="6" fill="#E4E9F4" stroke="#3A66C4" stroke-width="1.6"/>
        <text x="605" y="248" text-anchor="middle" class="cat" font-weight="700">Head is still H</text>
        <text x="605" y="266" text-anchor="middle" class="cat">accepted, head advances</text>
        <rect x="720" y="224" width="190" height="56" rx="6" fill="#f1d9d3" stroke="#A63D2F" stroke-width="1.6"/>
        <text x="815" y="248" text-anchor="middle" class="cat" font-weight="700">Head moved</text>
        <text x="815" y="266" text-anchor="middle" class="cat">stale: replay, resubmit</text>
        <path d="M910,252 C935,252 935,166 914,166" fill="none" stroke="#A63D2F" stroke-width="1.4" stroke-dasharray="4 3" marker-end="url(#gbarw)"/>
        <text x="710" y="310" text-anchor="middle" class="axlab">no lock, no merge queue. Under 2% of submits come back stale.</text>
      </svg>
    </div>
    <div class="gb-c">Git survives on the right as the model and the wire format. What disappears is the client's job of holding the whole history and deciding what wins. Sources: <a href="https://www.anthropic.com/engineering/redesigning-source-control">Anthropic</a>, <a href="https://www.perplexity.ai/hub/blog/building-shared-workspaces-for-people-and-agents">Perplexity</a>.</div>
  </div>
</div>

Three days after the workspace post, Perplexity open-sourced SPACE itself under Apache 2.0.[3][4] It is written in Rust and runs each sandbox in a Firecracker microVM. Sandboxes get frequent file snapshots and checkpoints of the full running environment, and you can branch a sandbox. Perplexity reports no escape from the VM to the host in 108 attempts by testers, and sandbox creation three to five times faster than its previous provider on the same production traffic.[3]

## OpenAI, Google, Microsoft, Cursor

The other launches in the window were products, not engineering posts, so there is less to quote. But the shape is the same.

**OpenAI** used DevDay on September 29 to launch Dots, always-on agents that each get their own cloud computer and browser, and two shared surfaces: ChatGPT Space, where teammates and their dots work together, and Pages, a new kind of document built for humans and agents to collaborate on writing, charts and images.[6][7] A human can jump into a Page an agent is writing, edit it, leave feedback, and send the agent back to work.[7] OpenAI did not describe a version history or an arbitration rule for Pages, at least not in the keynote coverage I could find.

**Anthropic**, on the product side, folded Cowork into Claude on September 16 and launched Claude Docs and Slides in beta. Claude creates a document or deck that the user and their colleagues can edit directly, and each project gets one shareable link.[8] The next day it rebuilt Projects around a coordinator that routes work to threads, where each thread is a Claude Code cloud session working on its own branch and copy of the repo, and overlapping edits are resolved as a merge conflict like any other pull request.[9] That is branch-per-agent-then-merge, in product form.

**Google** announced coworker agents at Gemini at Work on October 8. Each agent gets its own Workspace account, including an email address, calendar, Drive, and a presence in the company directory. It acts under its own identity, not yours, and sees only what you share with it.[10] Google's approach to the write path is to reuse the one it already has: the agent is a user, and Drive and Docs already arbitrate among users. On the developer side, the Antigravity agent runs in a hosted Linux sandbox where files persist across interactions, so a scheduled run picks up the files the previous run left.[11]

**Microsoft** is a little outside the window, but it belongs in the picture. Scout, announced June 2 as the first of a category Microsoft calls Autopilots, operates under its own governed Entra identity rather than a shared service account, and is in private preview.[12] Its Co-Create feature lets you and Scout edit the same supported file at the same time, with your changes merged automatically, and those workspaces are stored in OneDrive or SharePoint.[13] Microsoft, like Google, is making the agent a user and leaning on the document stack it already owns.

**Cursor** shipped Origin, its own Git forge, in early beta in August. Repos support standard clone, push and pull, GitHub repos can be mirrored in, and cloud agents connect to Origin repos directly.[14] Coverage of the launch stressed stacked pull requests and agent-aware merge queues, helped by Cursor's 2025 acquisition of Graphite.[15] Origin is the one entrant that keeps Git the product and tries to make the forge agent-aware, which is a bet that the merge queue Anthropic abandoned can be made to work.

## The grid

The way to see all of this at once is as a grid. One axis is the fork layer, meaning where an agent's private copy lives. The other is write arbitration, meaning what happens when two writers want the same state.

<div class="gb-fig">
  <div class="gb-card">
    <div class="gb-head"><span class="gb-t">Where the fork lives, and who wins the write</span></div>
    <div class="gb-s">Rows are the fork layer. Columns are the arbitration rule. Placement is my reading of each vendor's public docs. Some products sit in two cells.</div>
    <div class="gb-legend"><span><i class="gb-dot ws"></i> Workspace people use</span><span><i class="gb-dot wp"></i> Write path or infrastructure</span></div>
    <div class="gb-box">
      <table class="gb-grid" aria-label="Matrix of fork layer against write arbitration. Rows: VM or sandbox, bucket, file or shard, repository, document. Columns: compare-and-set then replay, branch then merge, last writer wins with every version kept, live co-edit. Perplexity sits at VM and compare-and-set. Claude Projects threads, Daytona and SPACE sit at VM and branch then merge. Tigris sits at bucket and last writer wins with versions. Space sits at file or shard and last writer wins with versions, and also at compare-and-set when its if_version precondition is used. Turso AgentFS sits at file or shard and branch then merge. markdownfs sits at file or shard and live co-edit. Scion sits at repository and compare-and-set. Cursor Origin sits at repository and branch then merge. ChatGPT Pages, Claude Docs and Scout Co-Create sit at document and live co-edit.">
        <thead>
          <tr><th class="rowh">Fork layer</th><th>Compare-and-set, then replay</th><th>Branch, then merge</th><th>Last writer wins, every version kept</th><th>Live co-edit</th></tr>
        </thead>
        <tbody>
          <tr><th class="rowh">VM or sandbox</th><td><span class="gb-pill wp">Perplexity <small>SPACE + Git service</small></span></td><td><span class="gb-pill ws">Claude Projects threads</span> <span class="gb-pill wp">Daytona</span> <span class="gb-pill wp">SPACE</span></td><td class="empty"></td><td class="empty"></td></tr>
          <tr><th class="rowh">Bucket</th><td class="empty"></td><td class="empty"></td><td><span class="gb-pill wp">Tigris <small>bucket forks</small></span></td><td class="empty"></td></tr>
          <tr><th class="rowh">File or shard</th><td><span class="gb-pill wp">Space <small>with if_version</small></span></td><td><span class="gb-pill wp">Turso AgentFS <small>per-agent copy</small></span></td><td><span class="gb-pill wp">Space <small>default</small></span></td><td><span class="gb-pill wp">markdownfs <small>one live tree, server lock</small></span></td></tr>
          <tr><th class="rowh">Repository</th><td><span class="gb-pill wp">Scion</span></td><td><span class="gb-pill wp">Cursor Origin</span></td><td class="empty"></td><td class="empty"></td></tr>
          <tr><th class="rowh">Document</th><td class="empty"></td><td class="empty"></td><td class="empty"></td><td><span class="gb-pill ws">ChatGPT Pages</span> <span class="gb-pill ws">Claude Docs</span> <span class="gb-pill ws">Scout Co-Create</span></td></tr>
        </tbody>
      </table>
    </div>
    <div class="gb-c">The two cells that matter most are the compare-and-set column, where the two detailed engineering accounts landed, and the document row, where every consumer product landed. Nobody has yet shipped something that lives in both. Sources: <a href="https://www.perplexity.ai/hub/blog/building-shared-workspaces-for-people-and-agents">Perplexity</a>, <a href="https://claude.com/blog/projects-redesigned">Anthropic Projects</a>, <a href="https://www.daytona.io/dotfiles/daytona-raises-24m-series-a-to-give-every-agent-a-computer">Daytona</a>, <a href="https://www.tigrisdata.com/docs/forks">Tigris</a>, <a href="https://docs.spacefs.com/guides/concurrency.md">Space</a>, <a href="https://turso.tech/blog/agentfs">Turso</a>, <a href="https://github.com/subramanya1997/markdownfs">markdownfs</a>, <a href="https://www.anthropic.com/engineering/redesigning-source-control">Scion</a>, <a href="https://cursor.com/docs/origin">Cursor</a>, <a href="https://www.cnbc.com/2026/09/29/openai-devday-2026-live-updates.html">OpenAI</a>, <a href="https://learn.microsoft.com/en-us/microsoft-scout/overview">Microsoft</a>.</div>
  </div>
</div>

A few notes on the cells.

The **compare-and-set column** is where the two companies with the most agent traffic landed, and they got there from different storage. Scion arbitrates at the repository. Perplexity arbitrates at the repository but forks at the VM. Space, the startup, offers the same rule at the level of a single object: pass the version your change was based on, and if someone else wrote first you get a 412 and the winning version back.[18]

The **branch-then-merge column** is Git worktrees made into a product. Claude Projects threads, Daytona's forkable sandboxes, and SPACE's session branching all give each agent a private copy and defer the collision to a merge. This is the easiest model to ship because Git already knows how to merge. It is also the model Anthropic found does not scale past a certain rate, because the merge queue becomes the lock.

The **last-writer-wins column** is what object storage does naturally, with the modern twist that nothing is ever lost. Tigris bucket forks share objects by reference, writes to the fork create new versions, and you pay only for new versions.[20] Space's default is the same: both writes succeed, both versions stay in the history, and the docs are honest that one worker's change silently disappears from the head unless you ask for a precondition.[18]

The **document row** is where all the consumer products are, and it is the row with the least published detail about what happens underneath. Google Docs solved live co-editing for humans a long time ago. Whether that model holds when one of the editors produces a thousand-line change in one step is the open question I come back to below.

There is one more way into the live co-edit column, and it is the one I built. [markdownfs](https://github.com/subramanya1997/markdownfs) keeps a single in-memory tree of Markdown files that humans and agents write to directly, over a REST API, an MCP server, a CLI, or a FUSE mount. There are no per-writer forks. A single-writer lock in the server serializes every write, so two writers never interleave inside a file, and history comes from explicit commits that snapshot the whole tree and can be reverted.[27] That is live co-editing at file granularity with a lock as the arbiter instead of a CRDT. It is simple, and it is the right shape for shared agent memory. It has also never been asked to take 30,000 writes a day, and a lock that serializes writes on one machine is exactly the thing Scion and Perplexity removed from their path.

## Why FUSE lost and Git-as-model won

There was a tempting alternative to all of this, and both Anthropic and Perplexity considered it. Instead of giving each agent a checkout, mount the shared state as a network filesystem and let the agent read and write it directly. FUSE makes that easy. My own post in April argued the filesystem should be the agent's interface, and I still think that.[24] But the interface and the write path are different things.

Perplexity measured it. A FUSE-backed virtual filesystem was roughly 400 times slower than local files on filesystem-heavy workloads, because each request needs a network round trip. It also required privileged capabilities from the host, which would have forced every agent into a privileged sandbox.[2] They dropped it. Large and binary files arrive as Git LFS pointer files that record the real size, so the agent can decide whether to fetch them.[2]

<div class="gb-fig">
  <div class="gb-card">
    <div class="gb-head"><span class="gb-t">Perplexity's published latencies</span></div>
    <div class="gb-s">Seconds. Submit is the server-side accept of an agent's change. Attach is the time to give an agent a working checkout.</div>
    <div class="gb-box">
      <svg class="chart" viewBox="0 0 820 320" role="img" aria-label="Bar chart of Perplexity workspace latencies in seconds: median submit under 1.7, p99 submit under 8, warm attach about 2.9, cold attach about 8.">
        <line class="gridline" x1="90" y1="160" x2="790" y2="160"/>
        <line class="gridline" x1="90" y1="50" x2="790" y2="50"/>
        <line class="baseline" x1="90" y1="270" x2="790" y2="270"/>
        <text x="84" y="54" text-anchor="end" class="ax">8s</text>
        <text x="84" y="164" text-anchor="end" class="ax">4s</text>
        <text x="84" y="274" text-anchor="end" class="ax">0</text>
        <rect x="110" y="223" width="110" height="47" rx="3" fill="#3A66C4"/>
        <text x="165" y="211" text-anchor="middle" class="val" fill="#211E18" font-size="15">&lt;1.7s</text>
        <text x="165" y="292" text-anchor="middle" class="axlab">submit</text><text x="165" y="307" text-anchor="middle" class="axlab">median</text>
        <rect x="290" y="50" width="110" height="220" rx="3" fill="#3A66C4" fill-opacity="0.55"/>
        <text x="345" y="38" text-anchor="middle" class="val" fill="#211E18" font-size="15">&lt;8s</text>
        <text x="345" y="292" text-anchor="middle" class="axlab">submit</text><text x="345" y="307" text-anchor="middle" class="axlab">p99</text>
        <rect x="470" y="190" width="110" height="80" rx="3" fill="#A63D2F"/>
        <text x="525" y="178" text-anchor="middle" class="val" fill="#211E18" font-size="15">~2.9s</text>
        <text x="525" y="292" text-anchor="middle" class="axlab">attach</text><text x="525" y="307" text-anchor="middle" class="axlab">warm</text>
        <rect x="650" y="50" width="110" height="220" rx="3" fill="#A63D2F" fill-opacity="0.55"/>
        <text x="705" y="38" text-anchor="middle" class="val" fill="#211E18" font-size="15">~8s</text>
        <text x="705" y="292" text-anchor="middle" class="axlab">attach</text><text x="705" y="307" text-anchor="middle" class="axlab">cold</text>
      </svg>
    </div>
    <div class="gb-c">For scale, Perplexity's FUSE prototype was roughly 400 times slower than local files on filesystem-heavy work, which is why the agent gets a local checkout and the server gets the arbitration. Fewer than 2 percent of submits come back stale. Source: <a href="https://www.perplexity.ai/hub/blog/building-shared-workspaces-for-people-and-agents">Perplexity, "Building shared workspaces for people and agents"</a>.</div>
  </div>
</div>

Anthropic reached the same split for a different reason. The problem with Git at 30,000 merges a day was not the model, meaning commits, trees, refs. It was the client, meaning every machine holding the full history and every mirror trying to keep up. So Scion keeps Git's model and wire format and replaces the client with a thin daemon that talks to an authoritative server.[1]

Put the two together and you get the rule for this whole category. **Git survives as a model and a wire format. The Git client dies. The filesystem survives as the interface. The write path moves to a server.** The agent still sees files. The agent still produces commits. What it no longer does is decide, on its own machine, whether its write wins.

This also explains a result that looks unrelated. Perplexity tested an exploration agent that navigates a project's files against semantic search over the same 150 financial documents. The agent scored 0.867 on retrieving the right document and 0.627 on answering correctly, against roughly 0.39 and 0.37 for semantic search.[2] An agent that can walk a real tree of files beats one that gets handed chunks. That is the filesystem-as-interface half of the rule, measured.

## What this means for the startup layer

If the labs are each building the same primitive for themselves, where does that leave the companies selling it?

In a better spot than it looks, as long as they are selling the fork layer and not the arbitration. The grid above has a row for every kind of fork, and a startup in every row. Daytona raised a $24 million Series A in February to sell sandboxes an agent can fork into parallel branches and snapshot.[22] Tigris sells bucket forks that copy nothing and bill only for new versions.[20] Turso's AgentFS puts an agent's entire filesystem, state and history in one SQLite file.[21] Box has repositioned its content platform as a virtual filesystem for agents.[26] Space, a three-founder company that raised a $2.4 million pre-seed led by a16z Speedrun in August, sells forks at the shard level.[16]

Space is worth a closer look because it is the smallest company in the grid and it has the most complete answer to the arbitration question. Files are cut into content-defined chunks with FastCDC, averaging about 2 MiB, and each chunk is named by its SHA-256 hash, so a small edit rewrites only the shard it touches and the cost does not depend on how big the file is.[17] Every write is an immutable version. A fork starts as the same list of shards, so it copies nothing and is ready at once. The recommended agent pattern is to fork the drive, hand the agent a key that can only write to the fork, with that limit enforced by the endpoint on every request rather than by the prompt, review the result, and keep or delete the fork.[19] And for the cases where two agents must write the same object, the if_version precondition turns a silent lost update into a 412 you can retry.[18] That is compare-and-set at the object level, the same rule Scion applies at the repository.

So should a company building agent infrastructure buy that or build it? My estimate, from the published architecture, is that a parity rebuild of Space, meaning the sharded store, the versioning, forks, scoped keys, the S3-compatible API and the desktop mount, is roughly $1.5 million to $2.5 million with a US team, or $600,000 to $1 million with a blended team, over about a year. Drop the desktop mount and build only a forkable, versioned, S3-compatible store, and it is about a third of that. Those are my numbers, not anyone's quote, and they assume a team that has built storage before. The point is not that it is cheap. The point is that it is now a known quantity, because the labs published the shape, and a known quantity is a product category, not a moat.

The moat, if there is one, is above the storage. It is the arbitration rule, the permission model, and the history that lets a human ask what the agent did and roll it back. Those are exactly the parts Anthropic and Perplexity said were hard.

## What is still open

The storage question is settled. Everyone forks something, everyone keeps every version. The arbitration question is not, and the window exposed at least five gaps.

**Live human edits and agent batch commits in one file.** Every consumer product in the document row lets a person type into a document while an agent works on it. Every engineering account in the compare-and-set column treats an agent's change as an atomic unit that either lands on the head or is rejected. Nobody has published how those two coexist in the same file. If I am typing in paragraph three while an agent submits a rewrite of the whole document built on a head from forty seconds ago, who wins? OpenAI's Pages and Claude Docs will have an answer in code. Neither has written it down. markdownfs answers it with a lock and a commit log, which is honest but only scales as far as one server's write lock does.[27]

**Memory writes competing with project writes.** Perplexity's Brain updates a project's memory between tasks.[5] Claude Projects threads add to and draw from a shared memory.[9] Those are writes too, and they land in the same workspace the agents are editing. Memory is the part of the agent stack most people I talk to call unsolved, and yet it got no launch wave comparable to this one. I suspect that is because nobody has decided whether memory is a file under the same arbitration rule or something else.

**Cross-repository consistency.** Scion's compare-and-swap is one row per ref. Perplexity's is one head per project. A change that must land in two repositories at once, or in a repository and a document, has no atomic path in either system as described.

**Permission narrowing.** Scion has per-directory permissions.[1] Space has keys scoped to a fork.[19] Google's agents see only what you share.[10] These are three different answers, at three different granularities, and none of them yet covers the case of an agent that should be allowed to edit a file but not to delete it, or to append but not to rewrite.

**Humans are still the bottleneck.** This is the one that matters most. Anthropic still has a human review every one of 30,000 changes a day. What changed is that reviewers look at intent, not lines.[1] That is a tooling shift, not a removal of the constraint. If merges grow another 12x in the next four months, the review step is where it breaks. A Hacker News thread earlier this year on files as the shared interface for humans and agents ran to 132 comments and barely touched concurrency at all.[23] The field is still talking about where the files live. The hard problem has moved to who gets to change them, and who has to look.

## Where I land

I wrote in January that the workspace, not the chat window, would be where agents earn their keep.[25] I did not expect every lab to prove it in the same month.

The design is now clear enough to state in four lines. Keep Git as the model, because agents already speak it and it gives you history for free. Kill the Git client, because a full offline clone is the wrong unit for a machine that lives for a minute. Keep the filesystem as the interface, because an agent that walks a tree beats one that is handed chunks. Move the write path to a server, because only one place can decide who wins, and it has to decide in under two seconds.

What that leaves is the part no vendor can sell you. A compare-and-set tells you a write lost. It does not tell you whether it should have. For the next year, the interesting work is not in the storage. It is in the rule.

## References

[1] [Anthropic. (2026, October 13). *Redesigning source control for agent-scale development*. Anthropic Engineering.](https://www.anthropic.com/engineering/redesigning-source-control)

[2] [Perplexity. (2026, October 12). *Building shared workspaces for people and agents*.](https://www.perplexity.ai/hub/blog/building-shared-workspaces-for-people-and-agents)

[3] [Perplexity. (2026, October 15). *Open-sourcing SPACE*.](https://www.perplexity.ai/hub/blog/open-sourcing-space)

[4] [perplexityai/SPACE. *Sandboxed Platform for Agentic Code Execution*. GitHub.](https://github.com/perplexityai/SPACE)

[5] [Perplexity. (2026, July 30). *Spaces are now Projects*.](https://www.perplexity.ai/hub/blog/spaces-are-now-projects)

[6] [CNBC. (2026, September 29). *OpenAI DevDay 2026 live updates*.](https://www.cnbc.com/2026/09/29/openai-devday-2026-live-updates.html)

[7] [The Neuron. (2026, September). *OpenAI DevDay 2026: ChatGPT is becoming an AI operating system*.](https://www.theneuron.ai/news/openai-devday-2026-chatgpt-is-becoming-an-ai-operating-system/)

[8] [The Next Web. (2026, September 17). *Anthropic folds Cowork into Claude and launches Docs and Slides*.](https://thenextweb.com/news/anthropic-claude-cowork-merge-docs-slides)

[9] [Anthropic. (2026, September 17). *Projects redesigned: from folder to conversation*.](https://claude.com/blog/projects-redesigned)

[10] [Google Cloud. (2026, October 8). *Welcome to Gemini at Work 2026*.](https://cloud.google.com/blog/products/ai-machine-learning/welcome-to-gemini-at-work-2026)

[11] [Google. *Antigravity agent*. Gemini API documentation.](https://ai.google.dev/gemini-api/docs/antigravity-agent)

[12] [Microsoft. (2026, June 2). *Introducing Microsoft Scout, your always-on personal agent*.](https://www.microsoft.com/en-us/microsoft-365/blog/2026/06/02/introducing-microsoft-scout-your-always-on-personal-agent/)

[13] [Microsoft Learn. *Microsoft Scout (Frontier) overview*.](https://learn.microsoft.com/en-us/microsoft-scout/overview)

[14] [Cursor. *Origin*. Cursor documentation.](https://cursor.com/docs/origin)

[15] [InfoQ. (2026, August 25). *Cursor launches Origin as an alternative to GitHub*.](https://www.infoq.com/news/2026/08/cursor-origin-alternative-github/)

[16] [The Next Web. (2026, August 18). *Space raises $2.4M to abolish the hard drive with an AI-native filesystem for humans and agents*.](https://thenextweb.com/news/space-ai-native-filesystem-a16z-speedrun-2-4m)

[17] [Space. *Architecture*. Space documentation.](https://docs.spacefs.com/how-it-works/architecture.md)

[18] [Space. *Concurrency and preconditions*. Space documentation.](https://docs.spacefs.com/guides/concurrency.md)

[19] [Space. *Build with agents*. Space documentation.](https://docs.spacefs.com/agents.md)

[20] [Tigris. *Forks*. Tigris documentation.](https://www.tigrisdata.com/docs/forks)

[21] [Turso. (2025, November 13). *The missing abstraction for AI agents: the agent filesystem*.](https://turso.tech/blog/agentfs)

[22] [Daytona. (2026, February 5). *Daytona raises $24M Series A to give every agent a computer*.](https://www.daytona.io/dotfiles/daytona-raises-24m-series-a-to-give-every-agent-a-computer)

[23] [Hacker News. (2026). *Files are the interface humans and agents interact with*.](https://news.ycombinator.com/item?id=47286408)

[24] [Subramanya N. (2026, April 13). *The Filesystem Is the Database: Why Agents Need a New Storage Primitive*.](/2026/04/13/the-filesystem-is-the-database-why-agents-need-a-new-storage-primitive/)

[25] [Subramanya N. (2026, January 19). *The Agentic Workspace: A Strategic Imperative for the Next Era of SaaS*.](/2026/01/19/the-agentic-workspace-a-strategic-imperative-for-the-next-era-of-saas/)

[26] [Blocks and Files. (2026, March 9). *Box pitches 'virtual filesystem' layer for AI agents*.](https://www.blocksandfiles.com/ai-ml/2026/03/09/box-pitches-virtual-filesystem-layer-for-ai-agents/5208017)

[27] [Subramanya N. (2026). *markdownfs: a concurrent markdown database with Git-style versioning, multi-user permissions, REST and MCP*. GitHub.](https://github.com/subramanya1997/markdownfs)
