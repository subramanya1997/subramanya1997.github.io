---
layout: post
title: "OIDC-A, Eighteen Months Later: The Questions Held Up"
description: "A follow-up to the OIDC-A proposal. What the agent identity field answered since April 2025, what it left open, where Cross App Access and ID-JAG fit, where the real fragmentation is, and what I got wrong."
excerpt: "In April 2025 I proposed OpenID Connect for Agents. Eighteen months later the field has answered about five of the questions it asked and is fighting over the rest in more than seventy competing drafts. The questions held up. Some of my answers did not. Here is the honest scorecard."
author: Subramanya N
date: 2026-11-12
last_modified_at: 2026-11-12
tags: [OIDC-A, OpenID, OAuth, AI Agents, Agentic AI, Identity, Security, Authorization, Delegation, MCP, Standards]
mermaid: false
ready: true
schema_type: TechArticle
faq:
  - q: "Is OIDC-A still relevant in 2026?"
    a: "Its questions are. Multi-hop delegation with scope narrowing at each hop, purpose that stays attached to authority, revocation down a chain, and binding an agent to what is actually running are all still open in November 2026. Its envelope is not: nobody adopted agent claims in the ID token, and delegation data moved into access tokens and grants."
  - q: "Does Cross App Access (ID-JAG) solve agent identity?"
    a: "No, and it does not claim to. The Identity Assertion Authorization Grant lets an enterprise identity provider broker access between two applications without a consent screen for each one. The draft says it does not define processing for the actor token and that its client check does not identify or authenticate any actor. It solves the first hop well and leaves the agent itself unspecified."
  - q: "Why is the agent identity standards landscape so fragmented?"
    a: "Because the hard questions were left open and everyone is answering them separately. IETF participants counted 32 individual agent and delegation drafts in six months and more than 70 by mid 2026. Shipped products from Microsoft, Google, AWS and Okta each express the agent, the user and the delegation differently, and none of them carries a delegation chain."
  - q: "Would OIDC-A have prevented the big AI agent security incidents?"
    a: "Some of them. Incidents caused by stolen or over-broad tokens and by agents handing work to more privileged agents are delegation failures, and narrower, shorter-lived, attributable delegation would have limited them. Prompt injection, malicious packages, and people misusing a legitimate agent are not identity problems, and no identity standard fixes them."
---

In April 2025 I published a proposal called [OpenID Connect for Agents](/2025/04/28/oidc-a-proposal/), OIDC-A for short. It asked a simple set of questions. When an AI agent shows up at your API, what is it? Who sent it? How many hands did that permission pass through, and did it shrink along the way? What was it sent to do? Can you prove any of that?

Eighteen months have passed. A lot has shipped. I have read the drafts, the vendor docs, and the incident reports, and I want to give an honest account of where OIDC-A stands.

The short version is this. The questions held up. About five of them have real answers now. The rest are still open, and they are being fought over in more drafts than anyone can read. A few of my own answers were wrong, and I will say which ones.

## What OIDC-A asked

Strip away the claim tables and OIDC-A asked for six things.

1. **A separate identity for the agent.** Not the user, and not just the app's client ID.
2. **A record of who delegated.** The user behind the agent, kept distinct from the agent.
3. **A delegation chain.** Every hop from the user to the agent that is calling you, with permissions that can only get narrower at each hop.
4. **Purpose and constraints.** What the agent was sent to do, and the limits it was given.
5. **Attestation.** Some proof of what is actually running.
6. **Descriptors.** The agent's type, model, provider, capabilities, and a trust level.

The first five are about authority. The last one is about description. Keep that split in mind. It turns out to matter more than anything else in this post.

## What got answered

I want to give credit first, because some of this work is very good.

**The agent as its own principal.** This one is settled. Microsoft Entra Agent ID gives each agent its own identity and marks it in the token, so a resource can tell an agent from a person.[1] Google Cloud gives each agent a SPIFFE identity with a certificate that lasts 24 hours.[2] The one agent document adopted by an IETF working group, the WIMSE draft on AI agent identity, treats the agent as a workload with its own identifier and short-lived, key-bound credentials.[3] In April 2025, an agent was usually a client ID and a pasted API key. That is no longer the default.

**The user kept separate from the agent.** Also settled, though not the way I wrote it. I made the agent the subject of the token and put the user in a `delegator_sub` claim. The field did the reverse. The user stays in `sub`, and the agent appears as the client or the actor. Their way is better. Every existing policy is keyed on the user, and it keeps working.

**Registration that scales.** I proposed extending Dynamic Client Registration. The Model Context Protocol tried that, found that open registration produces a flood of anonymous clients, and moved to Client ID Metadata Documents instead.[4] The client is now a URL you can fetch and inspect.

**The enterprise first hop.** This is Cross App Access, and it deserves its own section.

## What Cross App Access is, and what it is not

Cross App Access is the product name. The spec underneath is the Identity Assertion Authorization Grant, ID-JAG for short.[5] It solves one problem, and it solves it cleanly.

Say your company uses an AI client and a project tracker. Both sign in through the same identity provider. Today the AI client has to send the user through a consent screen for every tool it connects to. With ID-JAG, the client instead asks the identity provider for a short-lived grant aimed at the project tracker, then trades that grant for an access token. The identity provider decides. The user does not click through anything. The security team gets one place to say yes or no.

It is built from two existing RFCs. It is an IETF working group document. Okta made it generally available in August 2026, and it is a stable extension to MCP that ships in real clients.[6][7]

So I will not call it chaos. It is the least chaotic thing in this space.

My complaint is about what it gets mistaken for. It is being sold as identity for agents, and the draft itself says otherwise. Two sentences from the current revision:

- It "does not define normative processing requirements for actor_token".
- Its client check "does not by itself identify or authenticate any actor represented in an act claim".[5]

Read those again. The spec that the industry is rallying around as the agent answer says, in its own text, that it does not process the agent and does not identify it. It authorizes a connection between two apps. It does not say which agent is on the other end of that connection, what that agent hands to a sub-agent, or what happens at hop two.

That is not a flaw in ID-JAG. It is a deliberate boundary. But the slot it left empty is the exact slot OIDC-A was written to fill.

## What nobody has answered

Here is the scorecard as I see it in November 2026.

| What OIDC-A asked for | Status today |
| :--- | :--- |
| Agent as a separate principal | **Answered.** Entra, Google, AWS, WIMSE. |
| User kept distinct from agent | **Answered**, with the user as subject. |
| Discovery and registration | **Answered differently.** Metadata documents, not registration calls. |
| Strong client authentication | **Answered.** Key-bound tokens are now expected. |
| A task or context ID for audit | **Mostly answered.** Transaction tokens carry one. |
| Multi-hop chain with narrowing | **Open.** At least ten competing drafts. Nothing shipped. |
| Purpose that stays attached | **Open** outside payments. |
| Constraints with real semantics | **Partly.** Rich authorization requests exist. Nobody agrees on a vocabulary. |
| Revocation down a chain | **Open.** Everyone says so. |
| Binding to the running instance | **Open.** Per-agent exists. Per-task does not. |
| Attestation of what is running | **Partly.** The platform can be attested. The model cannot. |
| Model, type, capabilities, trust level | **Not adopted by anyone.** |

The top five are plumbing. They got answered by profiling OAuth, which is how it should be.

The middle five are the ones that make an agent different from an app. They are all still open, and I am not the only one saying so. The OpenID Foundation whitepaper on agent identity, which I co-authored with twenty others, calls recursive delegation a transitive trust problem and calls revocation largely unsolved.[8] MCP's own roadmap says its authorization "assumes a person with a browser at consent time" and hands agent identity and delegation to a working group that is still forming.[9] NIST published a concept paper in February 2026 that asks, as open questions, whether an agent's identity should be persistent or per task and how delegation should be linked.[10]

The delegation chain is the clearest case. OAuth already has an `act` claim for "who is acting". It nests, so you can record a chain. But the RFC says the nested actors are informational only and should not be used for access decisions. It records who touched the request. It does not record what each one was allowed to do.

In June 2026 a new IETF draft appeared to fix exactly that. It defines a claim called `delegation_chain`. It requires each hop's scope to be equal to or narrower than the one before. Its stated reason is that `act` "captures only the identity of each actor in the chain, not the authorization constraints applied at each hop".[11] One of its authors is Aaron Parecki, who also wrote ID-JAG.

I want to be careful here. That draft does not cite OIDC-A, it is not adopted, and it puts the chain in the access token, not the ID token. It is not my proposal coming back. It is other people arriving at the same structure fourteen months later because the problem only has one shape. I will take that.

## Where the chaos actually is

The chaos is in the empty slot.

At an IETF OAuth meeting in June 2026, George Fletcher counted 32 individual drafts on agents and delegation in six months and called the volume "overwhelming".[12] By the next full meeting the count was past 70, and Hannes Tschofenig described the stated requirements as "a wish list to Santa Claus".[13] There are at least ten drafts that each define a different actor chain. There are two unrelated drafts that are both named AAuth.

The same thing shows up in shipped products. Here is how OIDC-A and four of them say the same three things.

| | The agent | The user | The chain |
| :--- | :--- | :--- | :--- |
| **OIDC-A** | `sub` plus `agent_*` claims | `delegator_sub` | `delegation_chain` |
| **ID-JAG** | `client_id` | `sub` | none |
| **Microsoft Entra** | `azp` plus a numeric facet claim | `sub` and `oid` | none |
| **Google Cloud** | SPIFFE ID | handled by the platform | none |
| **WIMSE draft** | workload ID as `client_id` | `sub` | points to other specs |

Look at the last column. Not one shipped token carries a chain. An agent that calls an agent that calls a tool arrives at the tool looking like a single hop.

Some of this is normal. Standards bodies winnow. Most of those seventy drafts will expire, and that is healthy. I also have to own that OIDC-A was one of them: an individual proposal, published on a blog, that never went to a working group.

But there is a part that is not healthy, and it is the reason I wrote this post. The field answered the easy hop, declared progress, and left the hard part to a free-for-all. A developer building a multi-agent system today has a good answer for "how does my client reach one enterprise tool" and no answer at all for "how does my tool know what the third agent in the chain is allowed to do". The more specs that ship around that gap without filling it, the more it looks solved when it is not.

## What I got wrong

I said I would be honest, so here it is.

**The ID token was the wrong carrier.** An ID token is issued for one audience, the app the user signed into. The API that needs to make a decision about an agent never sees it. Everything since has put agent and delegation data in access tokens and grants, where the decision actually happens. ID-JAG shows the right pattern: the identity assertion goes in as an input to an exchange and never travels further. I had the right content in the wrong envelope. The name "OpenID Connect for Agents" carries the same mistake.

**Per-hop signatures were optional.** I wrote that each step in the chain should be signed "if applicable". That makes the chain only as trustworthy as whoever issued the last token, which is the same weakness I was criticizing in `act`. The newer drafts sign by default. They are right.

**The trust level and capability claims had no authority behind them.** I defined `agent_trust_level` and `agent_capabilities` without saying who issues them or what the values mean. A claim that anyone can set to "verified" tells you nothing. Nobody picked these up, and they were right not to.

**I made the model name a required claim.** A resource cannot verify it. It changes mid-session when a request gets routed to a fallback. It also tells every service you call which vendor you use. Microsoft's own documentation warns against making authorization decisions on this kind of informational field.[1] It belongs in an audit record, not in a required claim.

**Revocation was one sentence.** I wrote that robust revocation mechanisms are needed and moved on. A 2026 paper on de-provisioning agents scored OIDC-A as failing on exactly that point, and it was a fair score.

So when I say OIDC-A held up, I mean the first five items on my list: the authority questions. The sixth item, the descriptors, did not. No standard, no protocol, and no vendor token carries them.

## What the incidents say

The incident record of the last eighteen months sorts the same way, and that is what convinced me.

The breaches that an identity layer would have limited were all about authority. A token carried too much of it, for too long, across too many hands.

- **Salesloft Drift, August 2025.** Attackers stole OAuth tokens from an AI chat integration and used them to reach the Salesforce data of hundreds of companies.[14] The tokens were bearer tokens, long-lived, and broad.
- **Vercel, April 2026.** An employee had granted a third-party AI tool sweeping access to their Google Workspace account. When that tool was compromised, the grant became the way in.[15]
- **ServiceNow, November 2025.** Researchers showed that a low-privilege agent could ask a more privileged agent to do work for it, and the second agent would comply.[16] There was no narrowing between the two. That is a missing delegation chain, in production.
- **Hugging Face, July 2026.** I wrote about this one [in August](/2026/08/17/break-in-break-out-ai-agent-security-in-2026/). An agent found one credential that was shared across clusters and held admin rights on all of them. The fix was per-cluster workload identity.[17]

Every one of these is a case for short-lived, key-bound, narrowly scoped delegation that names who is acting. That is the heart of what OIDC-A asked for.

In none of them would knowing the agent's model have changed anything.

## What identity cannot fix

It would be dishonest to stop there. Several of the biggest agent incidents were not identity problems, and no identity standard would have helped.

**Prompt injection.** When an agent reads a poisoned email and leaks data, the agent was correctly identified and correctly authorized. It was simply tricked. Simon Willison's lethal trifecta still applies: private data, untrusted content, and a way to send things out.[18] A perfectly attested agent with all three is still exploitable.

**Misuse by the account holder.** In the espionage campaign Anthropic disclosed in November 2025, the attackers were using a real agent through real accounts.[19] I wrote [a post at the time](/2025/11/14/from-espionage-to-identity-securing-the-future-of-agentic-ai/) arguing that OIDC-A would have helped. Looking back, I overstated it. An attestation that says "this is a real, unmodified agent" would have been true.

**Supply chain.** A malicious package is a publisher problem. Agent claims do not touch it.

There is also a lesson I did not see coming. In April 2026 Microsoft fixed a flaw in which the role for administering agent identities could be used to take over other identities in the tenant.[20] The system that hands out agent identities becomes a target itself. OIDC-A said nothing about who is allowed to mint an agent.

## What I would write today

If I were writing the proposal now, it would not be a set of new claims. It would be a profile: a short document that says how the existing pieces fit together and fills the one slot that is still empty. It would also need a new name.

1. **Start from ID-JAG.** It is the right first hop. Do not compete with it.
2. **Define the actor.** Write the processing rules for the actor token that ID-JAG left out. Say how a resource identifies the agent, not just the app.
3. **Carry a signed chain in the access token.** Every hop signed. Every hop equal or narrower. Line it up with the chain draft that already exists instead of adding an eleventh.
4. **Make purpose a signed object.** Payments got this right. Google's AP2 has the user sign a mandate that says what the agent may buy, and the mandate travels with the request.[21] The same idea works outside payments: a signed, revocable statement of what the agent was sent to do, checked at each request.
5. **Use the revocation specs that now exist.** Shared Signals became final in September 2025. Say plainly that a chain handed out offline still needs a short lifetime, because nobody has solved pulling it back.
6. **Cover the admin plane.** Who can create an agent identity, and what stops that role from becoming the keys to everything.
7. **Ship tests.** Several of the 2026 advisories were products failing to do things OAuth already requires. A spec without a conformance suite does not change outcomes.

And I would drop the trust level, the capabilities endpoint, and the required model claim.

## Where this leaves us

OIDC-A asked what an agent is, who sent it, how far the permission traveled, what it was for, and how you would know. Eighteen months later the field has a good answer to the first two and is still arguing over the other three.

That is not a failure. Standards take time, and the pieces that have landed are solid. But I do not think we should confuse a clean first hop with a finished design. An agent that hands work to another agent is the normal case now, not the edge case, and at that second hop every shipped system goes quiet.

The questions were right. Some of my answers were not. The slot is still empty, and I would rather see one profile fill it than seventy drafts circle it.

## References

[1] [Microsoft. (2026). *Agent token claims reference, Microsoft Entra Agent ID*.](https://learn.microsoft.com/entra/agent-id/agent-token-claims)

[2] [Google Cloud. (2026). *Agent identity overview*.](https://docs.cloud.google.com/iam/docs/agent-identity-overview)

[3] [IETF WIMSE Working Group. (2026, November 2). *draft-ietf-wimse-aims-01*.](https://datatracker.ietf.org/doc/draft-ietf-wimse-aims/)

[4] [Model Context Protocol. (2026, July 28). *The 2026-07-28 specification release*.](https://blog.modelcontextprotocol.io/posts/2026-07-28/)

[5] [Parecki, A., McGuinness, K., & Campbell, B. (2026, October 31). *Identity Assertion JWT Authorization Grant, draft-ietf-oauth-identity-assertion-authz-grant-06*.](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/)

[6] [Okta. (2026, August 24). *Okta brings first-class identity to AI agents with Agent SSO*.](https://okta.com/newsroom/press-releases/okta-brings-first-class-identity-to-ai-agents-with-agent-sso/)

[7] [Model Context Protocol. (2026, June 18). *Enterprise-managed authorization*.](https://blog.modelcontextprotocol.io/posts/enterprise-managed-auth/)

[8] [South, T., Nagabhushanaradhya, S., et al. (2025, October 29). *Identity Management for Agentic AI*. OpenID Foundation.](https://arxiv.org/abs/2510.25819)

[9] [Model Context Protocol. (2026, August 22). *Roadmap*.](https://modelcontextprotocol.io/development/roadmap)

[10] [NIST NCCoE. (2026, February 5). *Accelerating the adoption of software and AI agent identity and authorization*.](https://csrc.nist.gov/pubs/other/2026/02/05/accelerating-the-adoption-of-software-and-ai-agent/ipd)

[11] [Liu, D., Zhu, H., Krishnan, S., & Parecki, A. (2026, June 6). *Delegation Chain for OAuth 2.0, draft-liu-oauth-chain-delegation-00*.](https://datatracker.ietf.org/doc/draft-liu-oauth-chain-delegation/)

[12] [IETF OAuth Working Group. (2026, June 1). *Interim meeting minutes*.](http://ietfminutes.org/minutes/2026-06-01/oauth.html)

[13] [IETF OAuth Working Group. (2026, July). *IETF 126 meeting minutes*.](http://ietfminutes.org/minutes/ietf126/oauth.html)

[14] [BleepingComputer. (2025, August). *Salesloft breached to steal OAuth tokens for Salesforce data theft attacks*.](https://www.bleepingcomputer.com/news/security/salesloft-breached-to-steal-oauth-tokens-for-salesforce-data-theft-attacks)

[15] [Vercel. (2026, April). *Vercel April 2026 security incident bulletin*.](https://vercel.com/kb/bulletin/vercel-april-2026-security-incident)

[16] [AppOmni. (2025, November). *AI agent-to-agent discovery and prompt injection in ServiceNow Now Assist*.](https://appomni.com/ao-labs/ai-agent-to-agent-discovery-prompt-injection/)

[17] [Hugging Face. (2026). *Anatomy of a frontier lab agent intrusion: a technical timeline of the July 2026 incident*.](https://huggingface.co/blog/agent-intrusion-technical-timeline)

[18] [Willison, S. (2025, June 16). *The lethal trifecta for AI agents*.](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)

[19] [Anthropic. (2025, November 13). *Disrupting the first reported AI-orchestrated cyber espionage campaign*.](https://www.anthropic.com/news/disrupting-AI-espionage)

[20] [The Hacker News. (2026, April). *Microsoft patches Entra ID role flaw*.](https://thehackernews.com/2026/04/microsoft-patches-entra-id-role-flaw.html)

[21] [FIDO Alliance. (2026, April 28). *Google donates Agent Payments Protocol to FIDO Alliance*.](https://fidoalliance.org/google-donates-agent-payments-protocol-to-fido-alliance/)
