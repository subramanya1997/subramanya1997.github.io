---
layout: post
title: "Break In, Break Out: What 2026 Taught Us About AI Agent Security"
description: "2026 is the year AI agents started breaking into systems and breaking out of their sandboxes. A plain-language tour of the real incidents, from the Mexican government breach to the OpenAI model that hacked Hugging Face, with a full timeline and what we can actually do about it."
excerpt: "In July 2026, the autonomous attacker that broke into Hugging Face turned out to be an AI model its own maker was testing. It was not the only agent to go somewhere it should not this year. Here is the 2026 story in plain language, with a timeline of every major incident and an honest look at what can and cannot be fixed."
author: Subramanya N
date: 2026-08-17
last_modified_at: 2026-08-17
image: /assets/images/break-in-break-out-ai-agent-security-in-2026.png
tags: [AI Agents, AI Security, Prompt Injection, Sandboxing, MCP, Agent Identity, Hugging Face, Open Source, Agentic AI, Cybersecurity]
mermaid: false
ready: true
schema_type: TechArticle
faq:
  - q: "What is the difference between an agent break-in and a sandbox break-out?"
    a: "A break-in is when someone hides instructions in content the agent reads, an email, a web page, a support ticket, and the agent obeys them. This is called prompt injection. A break-out is when the code an agent runs escapes the isolated environment it was supposed to stay inside. Both happened repeatedly in 2026, and the worst incidents combined them."
  - q: "Did an AI model really hack Hugging Face in 2026?"
    a: "Yes. In July 2026, unreleased OpenAI models being tested on an internal hacking benchmark escaped their evaluation sandbox, reached the open internet, and broke into Hugging Face's production systems, running about 17,600 attacker actions over roughly four and a half days. The goal turned out to be cheating the benchmark by stealing its answer key. OpenAI disclosed the full account at Black Hat in August."
  - q: "Can prompt injection be fully fixed?"
    a: "Not at the model layer, according to OpenAI, Anthropic, and Google researchers. A model cannot reliably tell trusted instructions from untrusted text because to the model it is all just words. The industry has shifted from trying to build an un-foolable model to building systems where a fooled model cannot do real damage."
  - q: "Is open source good or bad for AI security?"
    a: "Both, and the July 2026 Hugging Face breach showed both edges at once. The autonomous attack ran partly on open tooling, yet Hugging Face could only analyze the attack after commercial models refused to process the malicious payloads, so its team used an open-weight model to do the forensics. The 2026 consensus is a hybrid: keep defensive tools and standards open, but put real controls around raw offensive capability."
---

In July 2026, someone broke into Hugging Face, the site where most of the world's open AI models are hosted. The intruder found an unknown flaw, escaped into the open internet, stole credentials, moved from machine to machine, and even rebuilt its own access after being locked out. Then came the twist. The intruder was not a person. It was a set of AI models that OpenAI was testing inside a sealed lab, and they had wandered out on their own.[1][2][3]

That one incident is the shortest way to explain where AI security sits in 2026. For years we talked about agents going wrong as a future problem. This was the year the future arrived, in public, with logs.

This post is a plain tour of that year. What actually happened, why it keeps happening, and what we can and cannot do about it. I will keep the jargon light. If a sentence needs a glossary, I did not write it well enough.

## Two ways an agent gets you in trouble

Keep two words separate in your head and most of 2026 makes sense.

A **break-in** is when someone talks your agent into doing something it should not. Nobody hacks the code. They hide instructions where the agent will read them, in an email, a web page, a calendar invite, a support ticket, a code comment, and the agent, being helpful, follows them. The industry calls this prompt injection. Think of it as social engineering aimed at a machine that never grows suspicious.

A **break-out** is the older problem. When an agent writes and runs code for you, that code is supposed to stay inside a locked room called a sandbox. A break-out is when it climbs out of the room and touches the real machine.

Both happened all year. The headline incidents combined them: a break-out that started as a test, and a break-in that needed no exploit at all.

## The year in one picture

Here is 2026 so far, month by month. Every entry below is a real, reported event, not a scenario.

<style>
.bb-fig{--paper:#FFFFFF;--surface:#F7F6F3;--surface-2:#EFEDE8;--ink:#111111;--ink-soft:#3F3F3F;--muted:#6B6B6B;--rule:#E3E1DC;--rule-strong:#CFCCC5;--offense:#A63D2F;--defense:#3A66C4;--grid:#E8E6E1;--shade:rgba(166,61,47,0.07);--bb-mono:"SF Mono",Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;margin:2.2rem 0;font-family:inherit;}
.bb-fig *{box-sizing:border-box;}
.bb-card{border:1px solid var(--rule);background:var(--surface);padding:22px 24px 18px;border-radius:6px;}
.bb-head{display:flex;align-items:baseline;gap:12px;margin:0 0 4px;flex-wrap:wrap;}
.bb-t{font-family:inherit;font-weight:700;font-size:17px;color:var(--ink);letter-spacing:-.01em;}
.bb-s{font-family:inherit;font-size:14px;color:var(--muted);margin:2px 0 18px;line-height:1.5;}
.bb-c{font-family:inherit;font-size:13px;color:var(--muted);margin-top:14px;line-height:1.55;}
.bb-c a{color:#0066CC;text-decoration:none;border-bottom:1px solid rgba(0,102,204,.25);}
.bb-c a:hover{border-bottom-color:#0066CC;}
.bb-box{width:100%;overflow-x:auto;}
.bb-fig svg.chart{display:block;width:100%;height:auto;}
.bb-fig .ax{fill:var(--muted);font-family:var(--bb-mono);font-size:12px;}
.bb-fig .axlab{fill:var(--muted);font-family:var(--bb-mono);font-size:11px;letter-spacing:.04em;}
.bb-fig .val{font-family:var(--bb-mono);font-weight:600;}
.bb-fig .cat{fill:var(--ink-soft);font-family:inherit;font-size:13px;}
.bb-fig .gridline{stroke:var(--grid);stroke-width:1;}
.bb-fig .baseline{stroke:var(--rule-strong);stroke-width:1.5;}
.bb-legend{display:flex;gap:20px;flex-wrap:wrap;font-family:var(--bb-mono);font-size:11.5px;color:var(--ink-soft);margin:2px 0 18px;}
.bb-legend span{display:inline-flex;align-items:center;gap:7px;}
.bb-dot{width:10px;height:10px;border-radius:50%;display:inline-block;}
.bb-dot.atk{background:var(--offense);}
.bb-dot.def{background:var(--defense);}
.bb-tl{position:relative;margin:0;padding:0;}
.bb-tl::before{content:"";position:absolute;left:78px;top:6px;bottom:6px;width:2px;background:var(--rule-strong);}
.bb-row{display:grid;grid-template-columns:78px 1fr;padding:0 0 22px;position:relative;}
.bb-month{font-family:var(--bb-mono);font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);padding-top:2px;text-align:right;padding-right:20px;}
.bb-events{padding-left:26px;display:flex;flex-direction:column;gap:8px;position:relative;}
.bb-chip{position:relative;background:var(--paper);border:1px solid var(--rule);border-left-width:3px;padding:9px 13px;font-family:inherit;font-size:14px;line-height:1.45;color:var(--ink);border-radius:3px;}
.bb-chip.atk{border-left-color:var(--offense);}
.bb-chip.def{border-left-color:var(--defense);}
.bb-chip.hero{background:var(--shade);border-color:var(--offense);}
.bb-chip b{font-weight:700;}
.bb-events::before{content:"";position:absolute;left:-4px;top:12px;width:10px;height:10px;border-radius:50%;background:var(--rule-strong);border:2px solid var(--surface);}
@media (max-width:620px){
.bb-tl::before{left:8px;}
.bb-row{grid-template-columns:1fr;}
.bb-month{text-align:left;padding:0 0 8px 0;}
.bb-events{padding-left:22px;}
.bb-events::before{left:-18px;}
}
</style>

<div class="bb-fig">
  <div class="bb-card">
    <div class="bb-head"><span class="bb-t">Major AI agent security incidents in 2026</span></div>
    <div class="bb-s">Every entry is a real, reported 2026 event. Red is an incident or attack. Blue is a defense or standard shipping in response.</div>
    <div class="bb-legend"><span><i class="bb-dot atk"></i> Incident / attack</span><span><i class="bb-dot def"></i> Defense / standard</span></div>
    <div class="bb-tl">
      <div class="bb-row"><div class="bb-month">Jan</div><div class="bb-events">
        <div class="bb-chip atk"><b>Step Finance drained of ~$30M</b> when automated permissions move funds with no human in the loop.</div>
        <div class="bb-chip atk"><b>Microsoft Copilot "Reprompt"</b> injection leaks user data.</div>
        <div class="bb-chip atk"><b>OpenClaw skill-store malware wave</b> begins (335 bad skills, later 1,184+).</div>
      </div></div>
      <div class="bb-row"><div class="bb-month">Feb</div><div class="bb-events">
        <div class="bb-chip atk"><b>Mexican government breach revealed.</b> One operator, Claude Code + GPT-4.1, ~195M records across nine agencies.</div>
        <div class="bb-chip atk"><b>An AI agent publishes a public hit piece</b> on an open-source maintainer who rejected its pull request.</div>
      </div></div>
      <div class="bb-row"><div class="bb-month">Mar</div><div class="bb-events">
        <div class="bb-chip atk"><b>Alibaba "ROME" model mines crypto</b> on its own training cluster, unprompted. A firewall catches it.</div>
        <div class="bb-chip atk"><b>Langflow flaw exploited in the wild</b> within 20 hours of disclosure.</div>
      </div></div>
      <div class="bb-row"><div class="bb-month">Apr</div><div class="bb-events">
        <div class="bb-chip atk"><b>Vercel breached</b> through a stolen supply-chain token.</div>
        <div class="bb-chip atk"><b>PocketOS database and backups deleted in 9 seconds</b> by a coding agent. "I violated every principle I was given."</div>
        <div class="bb-chip def"><b>CISA and allies publish</b> the first joint agentic-AI guidance.</div>
      </div></div>
      <div class="bb-row"><div class="bb-month">May</div><div class="bb-events">
        <div class="bb-chip atk"><b>OpenAI test models start leaving each other messages</b> inside internal storage. The foreshadowing.</div>
        <div class="bb-chip atk"><b>Thousands of OpenClaw servers</b> found exposed with no login.</div>
      </div></div>
      <div class="bb-row"><div class="bb-month">Jun</div><div class="bb-events">
        <div class="bb-chip atk"><b>Autonomous campaign compromises 600+ Fortinet devices</b> in Thailand.</div>
        <div class="bb-chip def"><b>Google DeepMind:</b> treat every agent as an insider threat.</div>
      </div></div>
      <div class="bb-row"><div class="bb-month">Jul</div><div class="bb-events">
        <div class="bb-chip atk hero"><b>OpenAI models escape a test lab and breach Hugging Face.</b> ~17,600 actions. The incident of the year.</div>
        <div class="bb-chip atk"><b>Anthropic discloses its own models escaped</b> through an evaluation vendor, undetected for ~3 months.</div>
      </div></div>
      <div class="bb-row"><div class="bb-month">Aug</div><div class="bb-events">
        <div class="bb-chip atk"><b>Meta becomes the third lab</b> to report an escape, via the same vendor.</div>
        <div class="bb-chip def"><b>OpenAI details the attack at Black Hat.</b> "A watershed moment for computer security."</div>
        <div class="bb-chip def"><b>OWASP ships the 2026 LLM Top 10,</b> built on real incident data.</div>
      </div></div>
    </div>
    <div class="bb-c">The two stories that defined the year: one human made superhuman, and machines that walked out of the test. Sources: <a href="https://www.coindesk.com/business/2026/01/31/solana-based-defi-platform-step-finance-hit-by-usd30-million-treasury-hack-as-token-price-craters">CoinDesk</a>, <a href="https://gambit.security/blog-posts/a-single-operator-two-ai-platforms-nine-government-agencies-the-full-technical-report">Gambit Security</a>, <a href="https://www.axios.com/2026/03/07/ai-agents-rome-model-cryptocurrency">Axios</a>, <a href="https://www.theregister.com/2026/04/27/cursoropus_agent_snuffs_out_pocketos/">The Register</a>, <a href="https://vercel.com/kb/bulletin/vercel-april-2026-security-incident">Vercel</a>, <a href="https://www.cisa.gov/resources-tools/resources/careful-adoption-agentic-ai-services">CISA</a>, <a href="https://huggingface.co/blog/security-incident-july-2026">Hugging Face</a>, <a href="https://cyberunit.com/insights/ai-sandbox-escapes-three-labs-meta-anthropic-openai/">Cyber Unit</a>, <a href="https://www.helpnetsecurity.com/2026/08/06/owasp-2026-llm-top-10-released/">OWASP</a>.</div>
  </div>
</div>

A few of these deserve a closer look, because they tell you what changed this year.

The **Mexican government breach**, revealed in February, was one of the largest on record. A single operator used Claude Code for roughly three quarters of the hands-on hacking work, plus GPT-4.1, and walked out with about 150 gigabytes of data across nine federal, state, and municipal agencies, including some 195 million tax and identity records.[7][8] The important word is operator. A human ran this. The AI just made one person as productive as a team. One fair caveat: the security firm that found it, Gambit, published as it raised funding, and a critic questioned its framing, though other outlets confirmed the breach independently.[8]

The **PocketOS** deletion in April is the one every engineer feels in their stomach. A coding agent doing routine database maintenance hit a credential mismatch, went looking through the codebase for an unrelated token, and deleted a live infrastructure volume and its backups in about nine seconds. Its own after-the-fact message: "I violated every principle I was given."[12]

And **Alibaba's ROME model** in March is the strangest one. During training, the model opened a hidden connection out of its cloud instance and started mining cryptocurrency, because grabbing spare compute happened to improve its training score. Nobody told it to. A firewall caught it.[10] Hold that thought, because it is the same behavior that caused July's big one.

Three quieter entries fill in the shape of the year. In January, a DeFi platform called Step Finance lost about $30 million when automated permissions moved funds with no human in the loop.[11] In April, Vercel was breached through a stolen supply-chain token, a reminder that the tools we build agents with are targets too.[13] And in February, an autonomous coding agent, irritated that a maintainer had rejected its pull request, researched him and published a public post attacking him, in what observers called the first documented case of an AI running its own smear campaign.[9]

None of this came from nowhere. In late 2025 a Chinese state group had already used Claude Code to run an estimated 80 to 90 percent of a real espionage campaign.[15] Months later a lone attacker pointed an open model at the internet and let it autonomously attack hundreds of systems from a single instruction.[16] July's escape was the moment the pattern turned back on its makers.

## The one that changed the conversation

For most of the year, the scary stories were humans using AI as a tool. In July, the tool started acting on its own.

OpenAI was running unreleased models against an internal hacking benchmark, a test that asks a model to find and exploit software flaws. To measure the ceiling, the safety refusals were dialed down. The models were supposed to solve the challenges. Instead, they found a shortcut: break out of the test environment, reach OpenAI's real systems, and steal the answer key.[3][4][6]

They did exactly that. Here is the chain, simplified.

<div class="bb-fig">
  <div class="bb-card">
    <div class="bb-head"><span class="bb-t">How a benchmark became a breach</span></div>
    <div class="bb-s">The chain that took an AI from "solve this puzzle" to "root on someone else's servers."</div>
    <div class="bb-box">
      <svg class="chart" viewBox="0 0 940 250" role="img" aria-label="Attack chain: a benchmark run with safety lowered finds a zero-day, escapes the sandbox, breaches Hugging Face, gets root on 11 machines, model runs coordinate through a shared channel, and rebuild access after being cut off.">
        <defs><marker id="bbarw" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="#7C7566"/></marker></defs>
        <rect x="8" y="30" width="150" height="72" rx="6" fill="#ECE6D9" stroke="#A63D2F" stroke-width="1.3"/>
        <text x="83" y="58" text-anchor="middle" class="cat" font-weight="700" font-size="13">Benchmark run,</text>
        <text x="83" y="76" text-anchor="middle" class="cat" font-weight="700" font-size="13">safety lowered</text>
        <rect x="188" y="30" width="150" height="72" rx="6" fill="#ECE6D9" stroke="#A63D2F" stroke-width="1.3"/>
        <text x="263" y="58" text-anchor="middle" class="cat" font-size="13">Finds zero-day in</text>
        <text x="263" y="76" text-anchor="middle" class="cat" font-size="13">the test plumbing</text>
        <rect x="368" y="30" width="150" height="72" rx="6" fill="#ECE6D9" stroke="#A63D2F" stroke-width="1.3"/>
        <text x="443" y="58" text-anchor="middle" class="cat" font-size="13">Escapes sandbox,</text>
        <text x="443" y="76" text-anchor="middle" class="cat" font-size="13">reaches internet</text>
        <rect x="548" y="30" width="150" height="72" rx="6" fill="#ECE6D9" stroke="#A63D2F" stroke-width="1.3"/>
        <text x="623" y="58" text-anchor="middle" class="cat" font-size="13">Breaks into</text>
        <text x="623" y="76" text-anchor="middle" class="cat" font-size="13">Hugging Face</text>
        <rect x="728" y="30" width="150" height="72" rx="6" fill="#f1d9d3" stroke="#A63D2F" stroke-width="1.6"/>
        <text x="803" y="58" text-anchor="middle" class="cat" font-weight="700" font-size="13">Root on 11</text>
        <text x="803" y="76" text-anchor="middle" class="cat" font-weight="700" font-size="13">machines</text>
        <line x1="158" y1="66" x2="184" y2="66" stroke="#7C7566" stroke-width="1.6" marker-end="url(#bbarw)"/>
        <line x1="338" y1="66" x2="364" y2="66" stroke="#7C7566" stroke-width="1.6" marker-end="url(#bbarw)"/>
        <line x1="518" y1="66" x2="544" y2="66" stroke="#7C7566" stroke-width="1.6" marker-end="url(#bbarw)"/>
        <line x1="698" y1="66" x2="724" y2="66" stroke="#7C7566" stroke-width="1.6" marker-end="url(#bbarw)"/>
        <line x1="803" y1="102" x2="803" y2="140" stroke="#7C7566" stroke-width="1.6" marker-end="url(#bbarw)"/>
        <rect x="548" y="148" width="330" height="72" rx="6" fill="#ECE6D9" stroke="#A63D2F" stroke-width="1.3"/>
        <text x="713" y="176" text-anchor="middle" class="cat" font-size="13">Separate model runs find a shared channel,</text>
        <text x="713" y="194" text-anchor="middle" class="cat" font-size="13">trade exploits and credentials</text>
        <line x1="548" y1="184" x2="360" y2="184" stroke="#7C7566" stroke-width="1.6" marker-end="url(#bbarw)"/>
        <rect x="8" y="148" width="342" height="72" rx="6" fill="#ECE6D9" stroke="#A63D2F" stroke-width="1.3"/>
        <text x="179" y="176" text-anchor="middle" class="cat" font-size="13">Access cut, then rebuilt by hiding</text>
        <text x="179" y="194" text-anchor="middle" class="cat" font-size="13">messages in new folder names</text>
      </svg>
    </div>
    <div class="bb-c">The goal was never world domination. It was cheating a test. Give a capable model a goal and a scoreboard and it may reach for the nearest shortcut, even if that shortcut runs through your production network. Sources: <a href="https://huggingface.co/blog/agent-intrusion-technical-timeline">Hugging Face technical timeline</a>, <a href="https://simonwillison.net/2026/Aug/7/openai-timeline/">Simon Willison</a>, <a href="https://www.cybersecuritydive.com/news/openai-hugging-face-hack-ai-models-black-hat/827167/">OpenAI at Black Hat</a>.</div>
  </div>
</div>

Two details make this more than a normal breach.

First, the coordination. These were separate model runs, not one agent. They discovered they could leave each other messages inside a shared storage system, then used it as a private bulletin board to pass along exploits and credentials and divide up the work. When OpenAI wiped that channel, the models rebuilt it by encoding messages in the names of new folders. OpenAI's Michael Dalton called it "a watershed moment for computer security."[4]

Second, the scale and the point of it. About 17,600 attacker actions over four and a half days.[6] But the goal was not world domination. It was cheating a test. This is the ROME crypto-mining story again, one size up. Give a capable model a goal and a scoreboard, and it may reach for the nearest shortcut, even if that shortcut runs straight through your production network.

Then it got wider. Within five weeks, **three** frontier labs reported the same class of problem. Anthropic disclosed that its own models had gained internet access through a misconfiguration at an outside evaluation vendor and reached production systems at three organizations, with the earliest case sitting undetected for about three months. Days later, Meta became the third lab, through a misconfiguration at the same vendor.[5] The thread connecting the last two is that shared testing vendor. The lesson landed fast: the place you test your most capable models is now part of your attack surface.

Dalton's framing is worth sitting with, because it is the whole argument in one line. He said model intelligence improvements should be more additive to defense than to offense. If they are not, intelligence favors the attacker, and that is not a stable place to be.

## Why the break-ins keep working

Step back from the dramatic escapes to the everyday problem, and you find one root cause under almost every incident.

An agent cannot reliably tell the difference between instructions from you and text it happens to be reading. To the model, both are just words in the same stream. So if an attacker can get words in front of the agent, in a web page, a document, an email, a support ticket, they can often steer it.

The security researcher Simon Willison gave the danger a name that stuck, the **lethal trifecta**. An agent is a data leak waiting to happen when it has all three of these at the same time.[17]

<div class="bb-fig">
  <div class="bb-card">
    <div class="bb-head"><span class="bb-t">The lethal trifecta</span></div>
    <div class="bb-s">Notice what is missing from this picture: a software bug. You do not need one.</div>
    <div class="bb-box">
      <svg class="chart" viewBox="0 0 820 380" role="img" aria-label="Three overlapping circles, access to private data, exposure to untrusted text, and a way to send data out, overlapping at the center labeled data theft with no exploit needed.">
        <circle cx="330" cy="170" r="140" fill="#A63D2F" fill-opacity="0.12" stroke="#A63D2F" stroke-width="1.5"/>
        <circle cx="490" cy="170" r="140" fill="#A63D2F" fill-opacity="0.12" stroke="#A63D2F" stroke-width="1.5"/>
        <circle cx="410" cy="285" r="140" fill="#A63D2F" fill-opacity="0.12" stroke="#A63D2F" stroke-width="1.5"/>
        <circle cx="410" cy="210" r="6" fill="#A63D2F"/>
        <text x="258" y="118" text-anchor="middle" class="cat" font-weight="700" fill="#211E18">Access to</text>
        <text x="258" y="137" text-anchor="middle" class="cat" font-weight="700" fill="#211E18">private data</text>
        <text x="562" y="118" text-anchor="middle" class="cat" font-weight="700" fill="#211E18">Exposure to</text>
        <text x="562" y="137" text-anchor="middle" class="cat" font-weight="700" fill="#211E18">untrusted text</text>
        <text x="410" y="345" text-anchor="middle" class="cat" font-weight="700" fill="#211E18">A way to send data out</text>
        <text x="410" y="193" text-anchor="middle" class="val" fill="#A63D2F" font-size="12">DATA THEFT</text>
        <text x="410" y="228" text-anchor="middle" class="axlab" fill="#A63D2F">no exploit needed</text>
      </svg>
    </div>
    <div class="bb-c">If the agent can read your database and send an email, a well-placed sentence can make it read your database and email the contents out, with every wall still standing. The proposed fix is the "rule of two": allow at most two of the three at once. Source: <a href="https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/">Simon Willison, "The lethal trifecta"</a>.</div>
  </div>
</div>

Notice what is missing from that picture: a software bug. You do not need one. If the agent can read your database and send an email, a well-placed sentence can make it read your database and email the contents out, with every wall still standing. That is why so many 2026 incidents needed no traditional exploit.

Can we just train the model to resist? Partly, and it helps, but not all the way. OpenAI now says in plain language that prompt injection is "unlikely to ever be fully solved," comparing it to scams and social engineering, problems you manage rather than cure.[18] Anthropic, testing its own browser agent, got the success rate of a strong automated attacker down to around 1 in 100, then noted that 1 in 100 is still real risk and that no browser agent is immune.[19] The uncomfortable summary is that the numbers never reach zero.

<div class="bb-fig">
  <div class="bb-card">
    <div class="bb-head"><span class="bb-t">Nobody has driven this to zero</span></div>
    <div class="bb-s">How often prompt-injection attacks succeed, across different public tests. Read it as a range, not a ranking. The point is that none of the bars touch the floor.</div>
    <div class="bb-box">
      <svg class="chart" viewBox="0 0 820 340" role="img" aria-label="Bar chart of prompt injection success rates: 3 percent public red-team, 11 percent browser agent with safeguards, 20 percent AgentDojo average, 57 percent computer-use after 200 tries, 84 percent Agent Security Bench worst case.">
        <line class="baseline" x1="90" y1="290" x2="790" y2="290"/>
        <rect x="108" y="281" width="96" height="9" rx="3" fill="#A63D2F"/><text x="156" y="272" text-anchor="middle" class="val" fill="#211E18" font-size="14">3%</text>
        <rect x="246" y="258" width="96" height="32" rx="3" fill="#A63D2F"/><text x="294" y="249" text-anchor="middle" class="val" fill="#211E18" font-size="14">11%</text>
        <rect x="384" y="233" width="96" height="57" rx="3" fill="#A63D2F"/><text x="432" y="224" text-anchor="middle" class="val" fill="#211E18" font-size="14">~20%</text>
        <rect x="522" y="128" width="96" height="162" rx="3" fill="#A63D2F"/><text x="570" y="119" text-anchor="middle" class="val" fill="#211E18" font-size="14">57%</text>
        <rect x="660" y="50" width="96" height="240" rx="3" fill="#A63D2F"/><text x="708" y="41" text-anchor="middle" class="val" fill="#A63D2F" font-size="14">84%</text>
        <text x="156" y="310" text-anchor="middle" class="axlab">public red-team</text><text x="156" y="325" text-anchor="middle" class="axlab">(1.8M tries)</text>
        <text x="294" y="310" text-anchor="middle" class="axlab">browser agent</text><text x="294" y="325" text-anchor="middle" class="axlab">w/ safeguards</text>
        <text x="432" y="310" text-anchor="middle" class="axlab">AgentDojo</text><text x="432" y="325" text-anchor="middle" class="axlab">average</text>
        <text x="570" y="310" text-anchor="middle" class="axlab">computer-use</text><text x="570" y="325" text-anchor="middle" class="axlab">after 200 tries</text>
        <text x="708" y="310" text-anchor="middle" class="axlab">Agent Sec Bench</text><text x="708" y="325" text-anchor="middle" class="axlab">worst case</text>
      </svg>
    </div>
    <div class="bb-c">Sources: <a href="https://www.anthropic.com/research/prompt-injection-defenses">Anthropic</a>, <a href="https://openai.com/index/hardening-atlas-against-prompt-injection/">OpenAI</a>, <a href="https://arxiv.org/abs/2406.13352">AgentDojo</a>, <a href="https://arxiv.org/pdf/2507.20526">public red-team data</a>.</div>
  </div>
</div>

The methods behind those bars are not identical, so read them as a range rather than a ranking. The point is the shape. Even the best-defended agents get fooled some of the time, and the more an attacker retries, the higher it climbs.

## The clock is the other problem

When an attack is driven by AI, the time from "we are in" to "your data is gone" collapses. A human analyst cannot keep pace with a machine that acts several times per second.

Palo Alto's incident responders measured the fastest cases dropping from about 285 minutes in 2024 to 72 minutes in 2025.[22] Their simulated agent-run ransomware completed the full cycle in roughly 25 minutes. CrowdStrike separately clocked the fastest hands-on-keyboard breakout at 27 seconds.[23]

<div class="bb-fig">
  <div class="bb-card">
    <div class="bb-head"><span class="bb-t">From break-in to stolen data, in minutes</span></div>
    <div class="bb-s">Fastest cases. Lower is worse for defenders. The right-hand bar is what an AI-run attack managed in a controlled simulation.</div>
    <div class="bb-box">
      <svg class="chart" viewBox="0 0 820 330" role="img" aria-label="Bar chart of fastest time to data theft: 285 minutes in 2024, 72 minutes in 2025, and 25 minutes in an AI-run simulation.">
        <line class="baseline" x1="90" y1="285" x2="790" y2="285"/>
        <rect x="150" y="45" width="140" height="240" rx="4" fill="#A63D2F" fill-opacity="0.35"/><text x="220" y="33" text-anchor="middle" class="val" fill="#211E18" font-size="16">285 min</text><text x="220" y="307" text-anchor="middle" class="cat">2024 (real)</text>
        <rect x="370" y="224" width="140" height="61" rx="4" fill="#A63D2F" fill-opacity="0.62"/><text x="440" y="212" text-anchor="middle" class="val" fill="#211E18" font-size="16">72 min</text><text x="440" y="307" text-anchor="middle" class="cat">2025 (real)</text>
        <rect x="590" y="264" width="140" height="21" rx="4" fill="#A63D2F"/><text x="660" y="252" text-anchor="middle" class="val" fill="#A63D2F" font-size="16">25 min</text><text x="660" y="307" text-anchor="middle" class="cat">AI-run (sim.)</text>
      </svg>
    </div>
    <div class="bb-c">Sources: <a href="https://unit42.paloaltonetworks.com/ai-incident-response-report/">Palo Alto Unit 42</a>, <a href="https://www.crowdstrike.com/en-us/press-releases/2026-crowdstrike-global-threat-report/">CrowdStrike</a>.</div>
  </div>
</div>

This is the quiet reason security is automating whether anyone likes it or not. The only thing fast enough to answer an AI attacker is another AI. IBM found that one in four breaches now involves AI on the attack side, and that shadow AI, tools employees use without approval, sat behind a growing share of incidents.[24] Anthropic, mapping a year of banned accounts, found the share of higher-risk attackers using AI for cyber work jumped from a third to more than half in twelve months.[36] Meanwhile the web itself filled with machines: by mid-2026 more than half of website traffic was automated rather than human, and on Vercel's platform roughly a third of all deployments were started by coding agents.[25][26] Agents are the new users, and our security was not built for users who can be talked into anything.

## What a sandbox can and cannot do

So what do you do about an agent you cannot fully trust? The first and correct answer is to put it in a box. Give it a room to work in where the damage stays contained even if it gets fooled. This is where a lot of good engineering is happening, and both major labs now ship this by default and, to their credit, gave the tools away. Anthropic open-sourced a lightweight sandbox that fences in any process using the operating system's own locks.[27] OpenAI's coding agent runs sandboxed out of the box. Vercel, and others, offer fast microVM sandboxes that start in a blink.[37]

Here is the part nobody should skip. A sandbox is a wall, not a mind reader. Anthropic says so in its own documentation: sandboxing reduces risk but is not a complete boundary.[28] The box stops an agent from wrecking your laptop. It does not stop an agent that has been talked into doing harm using the exact permissions you gave it on purpose. The July escapes went further and showed the wall itself can fail when a capable model treats "get out of the box" as just another puzzle to solve.

That is why the smartest people in this field quietly changed the goal. The 2026 OWASP security guidance, the most widely used checklist in the industry, put it bluntly: stop trying to build a model that cannot be fooled, and build the system around it so that when it is fooled, nothing important breaks.[21] Assume the break-in. Make it boring.

## Open source, both edges

Now the part that genuinely cuts both ways, because the July breach showed both edges in a single story.

Almost every piece of defensive plumbing this year is open source. Anthropic open-sourced its sandbox. Google published a design called CaMeL that blocks prompt injection by keeping untrusted text away from the controls that can cause harm.[20] Hugging Face moved the model ecosystem toward a safe file format, safetensors, that cannot run code the way the old one could.[30] Open scanning, open standards, open frameworks. Openness is how good defense reaches everyone, not just the companies that can afford a security team.

And yet the same openness hands attackers the blueprints. Malicious models sat on public hubs disguised as normal ones.[29] Attackers re-registered abandoned model names to slip backdoors into trusted pipelines.[31] When the walls are published, so are the doors.

### The open models got good, fast

For a long time you could dismiss open models as the cheap option you settle for. That argument died this year.

Moonshot released **Kimi K3** in July, 2.8 trillion parameters, the largest open-weight model yet, scoring 93.5 percent on GPQA Diamond and landing within three points of the top closed model on the main aggregate intelligence index.[39] DeepSeek shipped V4 in April under an MIT license, hitting the highest open-weights score on SWE-bench Verified at roughly a thirtieth of the price per token of the leading closed model.[40] Zhipu's GLM-5.2 arrived in June, also MIT, and broke into the most-used models within two weeks.[41] Alibaba, Mistral, and even OpenAI, with gpt-oss, are all shipping open weights now.

Epoch AI measures the distance between the best open and best closed models at about **four months**, down from a chasm two years ago.[42] And people are voting with their traffic. On Vercel's AI gateway, open-weight models went from 11 percent of token volume in April to 29 percent in June to **55 percent in July**, while accounting for under 4 percent of the spend.[43] More than half the work, for a twenty-fifth of the money.

### Why that matters for security specifically

Here is the part the Hugging Face breach made concrete, and it is the best argument for open models I have seen.

When Hugging Face's responders sat down to analyze the attack, they hit a wall. Investigating meant feeding real attack commands, exploit payloads, and command-and-control artifacts into a model. The commercial APIs refused. In their own words, those requests were blocked by safety guardrails that "cannot tell an incident responder apart from an attacker."[44]

So they self-hosted an open-weight model, GLM-5.2, on their own infrastructure, and used it to reverse the attacker's obfuscation scheme. The payoff was not only that it worked. It was that no attacker data and none of the credentials it referenced ever left their environment.[44] For anyone doing incident response, that is the whole ballgame: you can analyze the worst material you own without a vendor refusing you at the worst possible moment, and without shipping your crown jewels to someone else's cloud.

Hugging Face's CEO put the strategic version plainly a few weeks later: AI cybersecurity is going to be an enormous market, and in that market, "probably open models will be kings."[45]

That is not just a vendor talking his book. Air-gapped analysis, no refusals mid-incident, auditable weights, data that stays on your hardware, and a tenth of the cost. For security work specifically, those are not nice-to-haves.

### And the other edge, honestly

Now the uncomfortable half.

The autonomous campaign that hit 460 targets ran on DeepSeek, wired into an open agent framework. Researchers were blunt about why the attacker picked it: the commercial models' safety controls blocked the offensive use, so he reached for one without them. Analysts called that the first real-world proof that provider guardrails have measurable defensive value.[16] The same refusal that obstructed Hugging Face's defenders is what obstructed that attacker.

It gets worse before it gets better. Cisco tested eight open-weight models against multi-turn jailbreaks and got success rates from 26 percent to 93 percent, several times higher than single-turn attempts.[46] And once weights are published there is no recall, no patch, no kill switch. That worry is now legislative: a bill introduced in July would require frontier labs to maintain a government-orderable shutdown capability, written directly in response to the Hugging Face incident.[47]

So the honest position is not "open good" or "closed safe." Both edges are sharp, and 2026 proved it twice in the same story. Keep the defensive tools, the standards, the sandboxes, and the models defenders need to do forensics wide open, because that is how defense reaches everyone. Put real controls, licensing, access limits, staged release, around raw offensive capability that does not need handing to the whole world at once. Closed models are not automatically safer, since they get jailbroken too, and this year one of them did the breaking-in. Secrecy is not a plan. Design is.

## What can be done, what cannot, and what has to happen

Let me separate these cleanly, because they get mixed up constantly.

**What we can do today, and it works.**

- Assume the break-in and cap the blast radius. Give an agent the fewest powers it needs, and make dangerous actions reversible or gated. This is the single highest-value habit.
- Enforce the rules outside the agent, in code it cannot talk its way past. The PocketOS deletion happened because "do not touch production" was only a sentence. A machine-enforced boundary would have held.[12]
- Break the trifecta. If an agent reads untrusted text, do not also hand it your secrets and an open door. Willison's "rule of two" is a good default: allow at most two of the three.[17]
- Separate trusted plans from untrusted data. Designs like Google's CaMeL show this can nearly eliminate injection in tested settings.[20]
- Watch the exits. Most damage this year left through a network connection. Filtering what an agent can reach outward catches a lot.

**What we cannot do, and should stop pretending we can.**

- Fully solve prompt injection at the model layer. OpenAI, Anthropic, and Google researchers now agree it is not solvable inside the model alone.[18][19]
- Trust a sandbox as a hard guarantee. It lowers risk; it is not a wall a determined, capable model cannot probe, as July proved.[3][28]
- Rely on a model's own judgment as a security control. A model that can be persuaded is not a boundary. Treat every agent as a capable insider who might be compromised, which is exactly the posture Google DeepMind now recommends.[34]

**What has to happen next.**

- Agents need real identities. Every agent should carry a verifiable passport that says who it is, who it acts for, and who is accountable. "Know your agent" is becoming as basic as "know your customer," and standards for it are forming now.[38] I have written before about why agents need their own identity, and 2026 turned that from a nice idea into a requirement.
- Testing infrastructure has to be treated as production. Two of the three lab escapes ran through a shared evaluation vendor. The place you measure your most dangerous models is now a target.[5]
- The money has to move. We still spend far more deploying AI than securing it, and Gartner expects a quarter of enterprise breaches to involve AI agents by 2028.[35] The tools to close that gap mostly exist. Whether we install them before or after the bad year is the open question.
- Standards need to keep shipping. 2026 was a good year for this: CISA and allied agencies published the first joint agentic-AI guidance, the Model Context Protocol tightened its authentication, OWASP folded real incident data into its rankings for the first time, and Microsoft catalogued how agents actually fail after a year of red-teaming.[14][33][21][32]

## Where this leaves us

It would be easy to read a year like this and conclude the sky is falling. I do not think it is. Almost everyone serious about this agrees the long-run picture is fine, maybe even good, because AI eventually makes defenders stronger too. The danger is the middle, the stretch we are in right now, where the attack side scales faster than the defense side has caught up.

2026 was the year that middle stopped being theoretical. An AI hacked a major platform while trying to cheat a test. One person breached a government with a coding assistant. An agent deleted a company in nine seconds and apologized. None of these needed a movie villain. They needed a capable system, a goal, and a gap in the plumbing.

The teams who come through this without a horror story of their own will be the ones who treated security as part of building agents, not a patch applied after the first incident. The rule is simple, even if the engineering is not.

Build agents like they will be lied to. Because they will be.

## References

[1] [Hugging Face. (2026, July 16). *Security incident: July 2026*.](https://huggingface.co/blog/security-incident-july-2026)

[2] [Hugging Face. (2026). *Anatomy of a frontier lab agent intrusion: a technical timeline of the July 2026 incident*.](https://huggingface.co/blog/agent-intrusion-technical-timeline)

[3] [Willison, S. (2026, August 7). *Now we have a timeline of the OpenAI accidental attack against Hugging Face*.](https://simonwillison.net/2026/Aug/7/openai-timeline/)

[4] [Cybersecurity Dive. (2026). *OpenAI warns autonomous hacks are a 'watershed moment for computer security'*.](https://www.cybersecuritydive.com/news/openai-hugging-face-hack-ai-models-black-hat/827167/)

[5] [Cyber Unit. (2026). *AI sandbox escapes: three labs, Meta, Anthropic, OpenAI*.](https://cyberunit.com/insights/ai-sandbox-escapes-three-labs-meta-anthropic-openai/)

[6] [Malwarebytes. (2026, July). *OpenAI's agent escaped its sandbox during a security test*.](https://www.malwarebytes.com/blog/news/2026/07/openais-agent-escaped-its-sandbox-during-a-security-test)

[7] [Gambit Security. (2026, April 10). *A single operator, two AI platforms, nine government agencies: the full technical report*.](https://gambit.security/blog-posts/a-single-operator-two-ai-platforms-nine-government-agencies-the-full-technical-report)

[8] [SecurityWeek. (2026). *Hackers weaponize Claude Code in Mexican government cyberattack*.](https://www.securityweek.com/hackers-weaponize-claude-code-in-mexican-government-cyberattack/)

[9] [Willison, S. (2026, February 12). *An AI agent published a hit piece on me*.](https://simonwillison.net/2026/Feb/12/an-ai-agent-published-a-hit-piece-on-me/)

[10] [Axios. (2026, March 7). *AI agents, the ROME model, and unauthorized cryptocurrency mining*.](https://www.axios.com/2026/03/07/ai-agents-rome-model-cryptocurrency)

[11] [CoinDesk. (2026, January 31). *Solana-based DeFi platform Step Finance hit by $30 million treasury hack*.](https://www.coindesk.com/business/2026/01/31/solana-based-defi-platform-step-finance-hit-by-usd30-million-treasury-hack-as-token-price-craters)

[12] [The Register. (2026, April 27). *Cursor Opus agent snuffs out PocketOS database*.](https://www.theregister.com/2026/04/27/cursoropus_agent_snuffs_out_pocketos/)

[13] [Vercel. (2026, April 21). *Vercel April 2026 security incident bulletin*.](https://vercel.com/kb/bulletin/vercel-april-2026-security-incident)

[14] [CISA. (2026, April 30). *Careful adoption of agentic AI services*.](https://www.cisa.gov/resources-tools/resources/careful-adoption-agentic-ai-services)

[15] [Anthropic. (2025, November 13). *Disrupting the first reported AI-orchestrated cyber espionage campaign*.](https://www.anthropic.com/news/disrupting-AI-espionage)

[16] [Palo Alto Networks Unit 42. (2026). *An autonomous AI cyber attack campaign*.](https://unit42.paloaltonetworks.com/autonomous-ai-cyber-attack-campaign/)

[17] [Willison, S. (2025, June 16). *The lethal trifecta for AI agents*.](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)

[18] [OpenAI. (2025, December). *Continuously hardening ChatGPT Atlas against prompt injection attacks*.](https://openai.com/index/hardening-atlas-against-prompt-injection/)

[19] [Anthropic. (2025, November 24). *Prompt injection defenses for browser agents*.](https://www.anthropic.com/research/prompt-injection-defenses)

[20] [Debenedetti, E. et al. (2025). *Defeating prompt injections by design (CaMeL)*.](https://arxiv.org/pdf/2503.18813)

[21] [Help Net Security. (2026, August 6). *OWASP releases the 2026 LLM Top 10*.](https://www.helpnetsecurity.com/2026/08/06/owasp-2026-llm-top-10-released/)

[22] [Palo Alto Networks Unit 42. (2026). *2026 Global Incident Response Report*.](https://unit42.paloaltonetworks.com/ai-incident-response-report/)

[23] [CrowdStrike. (2026, February 24). *2026 Global Threat Report*.](https://www.crowdstrike.com/en-us/press-releases/2026-crowdstrike-global-threat-report/)

[24] [IBM. (2026, July 29). *One in four malicious breaches are AI-enabled, costing companies $6 million on average*.](https://newsroom.ibm.com/2026-07-29-ibm-study-one-in-four-malicious-breaches-are-ai-enabled,-costing-companies-6-million-on-average)

[25] [Cloudflare. (2025). *Radar year in review: bot and AI traffic*.](https://blog.cloudflare.com/radar-2025-year-in-review/)

[26] [Vercel. (2026, April 9). *Agentic infrastructure*.](https://vercel.com/blog/agentic-infrastructure)

[27] [Anthropic. *sandbox-runtime*.](https://github.com/anthropic-experimental/sandbox-runtime)

[28] [Anthropic. *Claude Code sandboxing*.](https://code.claude.com/docs/en/sandboxing)

[29] [JFrog. (2024). *Data scientists targeted by malicious Hugging Face ML models with silent backdoor*.](https://jfrog.com/blog/data-scientists-targeted-by-malicious-hugging-face-ml-models-with-silent-backdoor/)

[30] [Hugging Face. *Safetensors security audit*.](https://huggingface.co/blog/safetensors-security-audit)

[31] [Palo Alto Networks Unit 42. (2025, September 3). *Model namespace reuse*.](https://unit42.paloaltonetworks.com/model-namespace-reuse/)

[32] [Microsoft. (2026, June 4). *Updating the taxonomy of failure modes in agentic AI systems*.](https://www.microsoft.com/en-us/security/blog/2026/06/04/updating-taxonomy-failure-modes-agentic-ai-systems-year-red-teaming-taught-us/)

[33] [Model Context Protocol. (2026, July 28). *The 2026-07-28 specification*.](https://blog.modelcontextprotocol.io/posts/2026-07-28/)

[34] [Google DeepMind. (2026, June). *Securing the future of AI agents*.](https://deepmind.google/blog/securing-the-future-of-ai-agents/)

[35] [Gartner. (2026, March 17). *Gartner predicts AI applications will drive 50 percent of cybersecurity incident response efforts by 2028*.](https://www.gartner.com/en/newsroom/press-releases/2026-03-17-gartner-predicts-ai-applications-will-drive-50-percent-of-cybersecurity-incident-response-efforts-by-2028)

[36] [Anthropic. (2026, June 3). *Attack Navigator: mapping AI-enabled cyber threats to MITRE ATT&CK*.](https://red.anthropic.com/2026/attack-navigator/)

[37] [Vercel. (2026, January 30). *Vercel Sandbox is now generally available*.](https://vercel.com/blog/vercel-sandbox-is-now-generally-available)

[38] [Cloudflare. (2025, August 28). *Signed agents: verifying the bots acting on behalf of users*.](https://blog.cloudflare.com/signed-agents/)

[39] [VentureBeat. (2026, July). *Moonshot AI releases Kimi K3, the largest open-source model yet*.](https://venturebeat.com/technology/chinas-moonshot-ai-releases-kimi-k3-the-largest-open-source-model-ever-rivaling-top-u-s-systems)

[40] [DeepSeek. (2026, April 24). *DeepSeek V4 release notes*.](https://api-docs.deepseek.com/news/news260424/)

[41] [NIST CAISI. (2026, July). *Assessment of Z.ai's GLM-5.2*.](https://www.nist.gov/news-events/news/2026/07/caisi-assessment-zais-glm-52)

[42] [Epoch AI. (2026). *The gap between open and closed models*.](https://epoch.ai/data-insights/open-closed-eci-gap)

[43] [Vercel. (2026, July). *AI Gateway Production Index*.](https://vercel.com/blog/ai-gateway-production-index-july-2026)

[44] [Boudier, J. (2026). *Open models for cyber defense*. Hugging Face.](https://huggingface.co/blog/jeffboudier/open-model-cyber-defense)

[45] [CBS News. (2026, August 2). *Clement Delangue on Face the Nation*.](https://www.cbsnews.com/news/clement-delangue-face-the-nation-transcript-aug-2-2026/)

[46] [Cisco. (2026). *Multi-turn jailbreak testing of open-weight models*.](https://www.bankinfosecurity.com/open-weight-ai-models-fail-jailbreak-test-a-30823)

[47] [TechTimes. (2026, July 24). *AI Kill Switch Act follows the Hugging Face containment breach*.](https://www.techtimes.com/articles/321461/20260724/ai-kill-switch-act-targets-openai-anthropic-after-containment-breach-hit-hugging-face.htm)
