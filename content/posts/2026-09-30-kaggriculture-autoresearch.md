---
layout: post
title: "Inside a 3,056-rated farming agent"
description: "An evidence-backed account of adapting autoresearch to Kaggriculture: the 3,056 live peak, local repairs, interactive replays, and the final results."
excerpt: "I used coding agents to research a competitive farming policy. It reached a live rating of 3,056.31, but the final version scored 1,647.7. Here is how the research loop worked, what improved, and what our tests missed."
image: /assets/posts/kaggriculture-autoresearch/charts/04_historical82_win_progression.png
schema_type: TechArticle
interactive: kaggriculture
date: 2026-09-30
author: Subramanya N
tags: [AI Agents, Autoresearch, Kaggriculture, Evaluation]
ready: true
---

<div class="kaggriculture-article">
I used coding agents to build a farming policy for Kaggriculture. On August 22, it reached a live rating of **3,056.31**. The final version I submitted scored **1,647.7**. Between those two results sits the part of the project I want to explain: how an automated research loop makes progress, and how its tests can stop telling you what you need to know.

The agents proposed strategies, wrote Python, ran games, inspected losses, and kept or rejected changes. Some repairs held up on the same recorded games. Others improved average cash while losing matches the previous policy had won. A better-looking experiment report could still leave me with a worse competition result.

This is a reconstruction from saved code, experiment reports, public replays, and submission receipts. “Day 0” means our earliest dated development report, August 10. The rating is the highest returned score among 66 archived submission histories we checked; it is not a claim of first place or a complete all-time record. <a class="evidence-ref" href="/assets/posts/kaggriculture-autoresearch/data/history_evidence.json">History evidence ↗</a>

## From a crop loop to a competitive farm

Kaggriculture gives two players a 30-day season, with 24 decision steps per day. We buy land, hire workers, grow crops and tend animals. Both farms sell into one market: more output can depress the price. Winning means finishing with more banked cash after inputs, feed and wages. Travel consumes worker time that could otherwise service or deliver production.

By Generation 1, the baseline grew carrots with several workers. Generation 1 sent **21 experimenters** after different hypotheses: crops, animals, labor, land, and delivery. The promoted melon strategy increased mean cash on the same development panel from **6,588 to 32,350**. It won 52 of its 60 held-out tournament matches. Generation 2 combined activities into a portfolio allocator and reported 70 wins in a different 80-match tournament. These tournaments cannot be joined into one learning curve.

<div class="timeline" aria-label="Four stages of the research">
  <div><span>Aug 10</span><strong>Explore the economics</strong><p>Single crops, species, workers and routes. A simple panel supplies rapid feedback.</p></div>
  <div><span>Aug 22</span><strong>Verify the live peak</strong><p>Gen68 reaches 3,056.31. Surviving code matches the uploaded file hash.</p></div>
  <div><span>Sep 17–18</span><strong>Repair complete programmes</strong><p>Production, feed, wages and sales are evaluated together on fixed replay cases.</p></div>
  <div><span>Sep 30</span><strong>Audit the final package</strong><p>Broader controls, responsive opponents, runtime and extracted-archive checks.</p></div>
</div>


![The original starter-panel mean cash rises from a 6,588-coin carrot baseline through 32,350, 107,200, 161,296 and 178,890 coins across the first four documented generations.](/assets/posts/kaggriculture-autoresearch/charts/09_early_development.svg)

<span class="post-img-caption">Early gains on the starter panel. These tests were separate from the later competition matchups.</span>


Early gains included splitting feed pickups so the first carrier did not drain supplies needed by the others. Real opponent replays then exposed a larger weakness: starter-agent tests rewarded farms that struggled against aggressive land expansion and shared-market competition. A good crop had to remain profitable after both players sold it.


![Archived Gen68 live rating declined after its August 22 peak while mean own cash stayed comparatively stable.](/assets/posts/kaggriculture-autoresearch/charts/05_gen68_live_history.svg)

<span class="post-img-caption">Gen68’s live rating after its August 22 peak. Daily cash stayed relatively steady as the opponents changed.</span>


## The autoresearch starting point

Our original <code>program.md</code> explicitly describes an adaptation of <a href="https://github.com/karpathy/autoresearch" target="_blank" rel="noopener noreferrer">Karpathy’s autoresearch</a>. His reference setup lets an agent edit training code, run a five-minute training budget, measure validation bits per byte, and retain or reject the experiment. A fixed evaluator makes the comparison meaningful. The instructions and experiment log are part of the research system.

We substituted a farming policy and game evaluations. **The LLMs wrote and investigated Python; the submitted policy did not call an LLM during play.** Initially, one evaluation contained 20 games against the starter and 20 against the current champion. A candidate needed no errors, improved head-to-head margin, and at least the champion’s starter-panel cash.

<div class="comparison-table" role="region" aria-label="Autoresearch comparison" tabindex="0">
<table><thead><tr><th>Design choice</th><th>Karpathy’s reference</th><th>Our game-agent adaptation</th></tr></thead><tbody>
<tr><td>Editable object</td><td>Training code in one file</td><td>Initially one policy file; later a frozen source tree</td></tr>
<tr><td>Feedback</td><td>Validation bits per byte</td><td>Wins, retained wins, own cash and opponent-relative margin</td></tr>
<tr><td>Evaluation boundary</td><td>Fixed preparation and evaluator</td><td>Fixed panels and engine, plus explicit opponent-model assumptions</td></tr>
<tr><td>Memory</td><td>Experiment instructions and results log</td><td>Logs, generation reports, rejected hypotheses and saved replays</td></tr>
</tbody></table>
</div>

Karpathy’s <a href="https://github.com/karpathy/autoresearch/blob/master/program.md" target="_blank" rel="noopener noreferrer">agent instructions</a> establish a baseline before changes and preserve failed results in the log. His <a href="https://karpathy.github.io/2019/04/25/recipe/" target="_blank" rel="noopener noreferrer">2019 training recipe</a> also argues for inspecting data and verifying a simple evaluation pipeline before adding complexity. Both ideas mattered here: every economic intervention needed a checkable mechanism.

## The research architecture

The research system had two jobs: explore ideas concurrently and make one defensible decision about what to keep. A coordinator read the rules, the current champion, and the accumulated learnings, then assigned a distinct hypothesis to each experimenter. Each experimenter worked in an isolated worktree and returned a candidate policy with its results.

<div class="research-architecture" role="group" aria-label="Research architecture: shared knowledge feeds a coordinator, parallel experimenters, serialized evaluation, and a promotion decision">
<div class="architecture-node architecture-memory"><strong>Shared research memory</strong><span>Rules and instructions · current champion · results.tsv · LEARNINGS.md</span></div>
<div class="architecture-arrow" aria-hidden="true">↓</div>
<div class="architecture-node"><strong>Coordinator</strong><span>Read the evidence, identify a mechanism, assign separate hypotheses</span></div>
<div class="architecture-arrow" aria-hidden="true">↓ Parallel research</div>
<div class="architecture-lanes">
<div class="architecture-node"><strong>Experimenter A</strong><span>Production and crop economics</span></div>
<div class="architecture-node"><strong>Experimenter B</strong><span>Workers and delivery routes</span></div>
<div class="architecture-node"><strong>Experimenter C</strong><span>Feed, wages and market effects</span></div>
</div>
<p class="architecture-note">Example hypothesis lanes; each produces separate code and a report.</p>
<div class="architecture-arrow" aria-hidden="true">↓ Candidates and reports</div>
<div class="architecture-node"><strong>Freeze and evaluate</strong><span>Pin source and cases → benchmark queue → recorded controls and responsive games</span></div>
<div class="architecture-arrow" aria-hidden="true">↓</div>
<div class="architecture-node"><strong>Review the complete result</strong><span>Retained wins · recoveries · both banks · paid inputs · runtime · archive checks</span></div>
<div class="architecture-arrow" aria-hidden="true">↓</div>
<div class="architecture-outcomes">
<div class="architecture-node"><strong>Keep</strong><span>Promote the checked candidate; verify any combination again</span></div>
<div class="architecture-node"><strong>Reject or hold</strong><span>Save the failure or missing evidence for the next research brief</span></div>
</div>
<div class="architecture-feedback">↺ Update the experiment log and learnings, then repeat</div>
<div class="architecture-release">A locally qualified policy still needs a separate upload decision and live feedback.</div>
</div>

<span class="post-img-caption">The later research loop: parallel coding, serialized measurement, and evidence feeding the next generation.</span>

The diagram combines the original coordinator/experimenter roles with the stricter evaluation process used in September. Early generations used different compute arrangements. By September 28, recorded benchmarks went through one shared queue, with at most three policy workers inside the active run. This kept competing experiments from changing timing-sensitive results simply by fighting for the same machine.

The coordinator rechecked promising claims and compared candidates with the champion. If the champion changed while another candidate was waiting, that candidate needed another comparison. Combining two successful branches also required a fresh test: workers, fertilizer, inventory and shared market prices made their gains interact.

### What actually ran during a game

The coding agents belonged to the research loop. **The submitted policy was Python and made no LLM calls during play.** It received the current observation, chose actions, and returned commands to the game engine.

<div class="policy-architecture" role="group" aria-label="Game execution: current observation to Python policy to commands to game engine">
<div class="architecture-node"><strong>Current observation</strong><span>Public farm state and available information</span></div>
<div class="architecture-arrow" aria-hidden="true">↓</div>
<div class="architecture-node"><strong>Python policy</strong><span>Evaluate production, labor, prices and routes</span></div>
<div class="architecture-arrow" aria-hidden="true">↓</div>
<div class="architecture-node"><strong>Commands → game engine</strong><span>Apply actions and return the next observation</span></div>
<div class="architecture-feedback">↺ Repeat for each decision step · no LLM in the game</div>
</div>

The checked benchmark wrapper rejected missing cases, duplicate episode/seat pairs, incomplete games and candidate errors. Later reviews examined ordered bank changes and actual paid inputs. A proposed wage saving had to account for the productive work being removed; a profitable harvest needed a funded delivery route.

We kept three kinds of evidence separate:

<div class="evidence-types">
<div><b>Recorded</b><p>Opponent commands come from a saved game. Useful for matched repairs; limited when a real rival would change plans.</p></div>
<div><b>Responsive</b><p>Opponent code acts on the changed game state. Fresh worlds help test effects beyond the repair panel.</p></div>
<div><b>Live</b><p>Accepted uploads, hosted status and completed competition games. Local results do not establish a live rating.</p></div>
</div>

## What measurably improved

On one historical panel of **the same 82 cases**, the accepted Route848 baseline won 61 games. By Demand859V3, that became **79 wins and three losses**. Improvements involved funded production and service, feed and fertilizer custody, competitive sale valuation, and returning output before the season ended. This was a repeatedly used development panel, so its improvement establishes repairs on those cases rather than unseen performance.


![Wins on an identical 82-case recorded panel increase from 61 to 79 across tested source versions.](/assets/posts/kaggriculture-autoresearch/charts/04_historical82_win_progression.svg)

<span class="post-img-caption">Wins on the same 82 recorded games rose from 61 to 79.</span>


A separate September 30 panel tells a less flattering story. Versions 251, 336, 340, 361 and 397 each won **90 of the same 120 games**, although their cash and margins differed. Version 340 earned more own cash than the final source on this panel; later choices also considered other difficult cases and runtime. There was no universal ordering of “best.”


![Five exact versions all win 90 of 120 games, while own cash and margin change by version.](/assets/posts/kaggriculture-autoresearch/charts/03_frozen120_progression.svg)

<span class="post-img-caption">All five versions won 90 of the same 120 games. More cash did not always mean a larger winning margin.</span>


## What we learned from leaders

We inspected public farm states, labor, production and deliveries. A recent outcome-selected sample contained **29 own games and 25 leader views across 19 games**. On engine day 6, leaders’ median farms had 22 strawberries, seven cows, three geese and nine paid hands; ours had 12, four, zero and seven. On day 10, our median cash was 15,589 versus their 3,869.


![Selected public leader farms show more early strawberries, cows, geese and hired hands, alongside lower day-ten cash balances.](/assets/posts/kaggriculture-autoresearch/charts/06_leader_comparison.svg)

<span class="post-img-caption">Public leader farms invested more in production and workers early in the season. These are observations from different games, not a controlled comparison.</span>


The hypothesis was earlier capital deployment, followed by production that workers could actually service and deliver. A rival’s farm composition alone was insufficient: delivery timing, shared prices, purchased feed and escalating wages could reverse its economics. We needed to copy a mechanism and test it, rather than copy a board arrangement.

## Explore the saved games

Choose a win or a loss, scrub through the season, and inspect the farms. The icons represent **actual saved public states**, with exact cash and worker positions. Tap a cell for its details. The viewer opens on day 6; slide back for the opening moves. The clock uses engine days 0–29. Recorded commands are requests, not proof of completed sales.


<div class="replay-explorer" id="replay-explorer">
<div class="replay-explorer-top"><h3>Replay a saved game</h3><label for="replay-case">Game <select id="replay-case" data-manifest="/assets/posts/kaggriculture-autoresearch/data/interactive_replays/interactive_replay_manifest.json" aria-label="Choose a saved win or loss"><option>Loading saved games…</option></select></label></div>
<p id="replay-scope" class="replay-scope">Saved public observations · no simulation</p>
<div class="replay-bank-row"><div><span>Our bank</span><strong id="replay-own-bank">—</strong></div><div><span>Rival bank</span><strong id="replay-rival-bank">—</strong></div><div><span>Margin</span><strong id="replay-margin">—</strong></div></div>
<div class="replay-controls"><button id="replay-play" type="button" disabled>▶ Play</button><label for="replay-speed">Speed <select id="replay-speed"><option value="4">4 turns/s</option><option value="12" selected>12 turns/s</option><option value="24">24 turns/s</option></select></label><span id="replay-time">Loading…</span></div>
<label class="replay-slider-label" for="replay-turn">Season timeline <input id="replay-turn" type="range" min="0" max="719" step="1" value="0" disabled aria-label="Saved observation from turn zero to 719"></label>
<div class="replay-boards"><div><h4>Our farm</h4><div id="replay-own-farm" class="replay-farm" aria-label="Our public farm"></div></div><div><h4>Rival farm</h4><div id="replay-rival-farm" class="replay-farm" aria-label="Rival public farm"></div></div></div>
<p class="replay-legend">🌾 Wheat · 🥕 Carrot · 🍈 Melon · 🍅 Tomato · 🍓 Strawberry · 🐄 Cow · 🐑 Sheep · 🪿 Goose<br><span class="replay-farmer-example">F</span> Farmer · <span class="replay-hands-example">2</span> Hands at this cell · diagonal fill: locked land</p>
<p id="replay-cell-info" class="replay-cell-info" aria-live="polite">Select a farm cell to inspect its saved state.</p>
<p id="replay-result" class="replay-result"></p>
<details class="replay-command"><summary>Our command entering this state</summary><p>Requested from the prior observation; completed fills are not inferred.</p><pre id="replay-command">—</pre></details>
<p id="replay-error" class="replay-error" hidden role="alert"></p>
</div>

<details class="video-archive" id="replay-videos"><summary>Watch or download the four 37-second videos</summary><div>
<p>The silent clips show all 720 saved observations at 24fps, plus opening and final holds. Cash is never interpolated. Captions mark checkpoints; fullscreen makes the grid easier to inspect.</p>

<figure class="replay-card">
<div class="replay-heading"><span class="scope-label">RECORDED LOCAL TEST</span><h3>Recovering a loss: −15 → +753 coins</h3></div>
<video id="video-859-recovery" controls preload="none" playsinline poster="/assets/posts/kaggriculture-autoresearch/videos/859_recovery_poster.png" aria-label="Demand859V3 recorded replay showing a recovered loss and a final 753-coin win">
<source src="/assets/posts/kaggriculture-autoresearch/videos/859_recovery.mp4" type="video/mp4">
<track kind="captions" src="/assets/posts/kaggriculture-autoresearch/videos/859_recovery.vtt" srclang="en" label="Replay notes">
Your browser cannot play this video. <a href="/assets/posts/kaggriculture-autoresearch/videos/859_recovery.mp4">Download the replay visualization</a>.
</video>
<figcaption>A local loss becomes a 753-coin win: 67,293 versus 66,540. Watch the final-day carrot delivery.</figcaption>
</figure>

<figure class="replay-card">
<div class="replay-heading"><span class="scope-label">RECORDED LOCAL TEST</span><h3>A last-day route in a 241-coin win</h3></div>
<video id="video-397-route" controls preload="none" playsinline poster="/assets/posts/kaggriculture-autoresearch/videos/397_narrow_preserved_win_poster.png" aria-label="Final397 recorded replay with a last-day fertilizer route and a 241-coin final margin">
<source src="/assets/posts/kaggriculture-autoresearch/videos/397_narrow_preserved_win.mp4" type="video/mp4">
<track kind="captions" src="/assets/posts/kaggriculture-autoresearch/videos/397_narrow_preserved_win.vtt" srclang="en" label="Replay notes">
Your browser cannot play this video. <a href="/assets/posts/kaggriculture-autoresearch/videos/397_narrow_preserved_win.mp4">Download the replay visualization</a>.
</video>
<figcaption>A preserved local win, ending at 107,511 versus 107,270. The change improves the margin by 85 coins.</figcaption>
</figure>

<figure class="replay-card">
<div class="replay-heading"><span class="scope-label">RECORDED LOCAL TEST</span><h3>The fragile control: a 46-coin win</h3></div>
<video id="video-397-fragile" controls preload="none" playsinline poster="/assets/posts/kaggriculture-autoresearch/videos/397_fragile46_win_poster.png" aria-label="Final397 recorded replay showing a narrow 46-coin win used as a fragile control">
<source src="/assets/posts/kaggriculture-autoresearch/videos/397_fragile46_win.mp4" type="video/mp4">
<track kind="captions" src="/assets/posts/kaggriculture-autoresearch/videos/397_fragile46_win.vtt" srclang="en" label="Replay notes">
Your browser cannot play this video. <a href="/assets/posts/kaggriculture-autoresearch/videos/397_fragile46_win.mp4">Download the replay visualization</a>.
</video>
<figcaption>A fragile local win survives: 106,486 versus 106,440. Average gains elsewhere would not compensate for losing this game.</figcaption>
</figure>

<figure class="replay-card">
<div class="replay-heading"><span class="scope-label hosted">ACTUAL HOSTED MATCH</span><h3>A completed game, a 1,226-coin loss</h3></div>
<video id="video-361-loss" controls preload="none" playsinline poster="/assets/posts/kaggriculture-autoresearch/videos/361_live_strategic_loss_poster.png" aria-label="Margin361 actual hosted replay ending in a 1226-coin loss">
<source src="/assets/posts/kaggriculture-autoresearch/videos/361_live_strategic_loss.mp4" type="video/mp4">
<track kind="captions" src="/assets/posts/kaggriculture-autoresearch/videos/361_live_strategic_loss.vtt" srclang="en" label="Replay notes">
Your browser cannot play this video. <a href="/assets/posts/kaggriculture-autoresearch/videos/361_live_strategic_loss.mp4">Download the replay visualization</a>.
</video>
<figcaption>An actual hosted loss: 75,156 versus 76,382. The game completed; paid workers also performed productive work.</figcaption>
</figure>

</div></details>

The clips are silent reconstructions from pinned replays, rather than original screen recordings. No policy or game engine was rerun. Only public farm states and our recorded commands are displayed. <a href="/assets/posts/kaggriculture-autoresearch/data/video_cases.json">Case evidence</a> · <a href="/assets/posts/kaggriculture-autoresearch/videos/video_manifest.json">Video checks and source hashes</a>. Gen68's peak has a verified rating record, but no corresponding full replay was found in the saved records; its video is therefore absent.

## Anomalies that changed our decisions

**The narrow-panel mirage.** A repaired historical-policy branch improved from two to six wins on 15 difficult cases, while losing both winning controls. The same exact source then won only **21/120**, compared with its parent’s 90/120: five losses recovered, **74 prior wins lost**. The small panel found behavior worth studying; it could not qualify a replacement.


![A candidate wins six versus two on a selected 15-case panel, but only 21 versus 90 on the complete 120-case panel.](/assets/posts/kaggriculture-autoresearch/charts/07_anomaly_panels.svg)

<span class="post-img-caption">A targeted test looked promising; the broader panel revealed 74 lost wins.</span>


**The average concealed a loss.** Candidate 390 improved mean margin over 191 recorded cases and recovered one loss, but lost two previous wins. In one, our cash rose by 86 coins while the rival’s rose by 358. Positive average income did not satisfy win preservation; the candidate was rejected.

**A strategy could finish and still fail runtime.** Candidate 388 recorded six wins and ten draws against a responsive opponent, but two own callbacks exceeded our local one-second criterion. Profiling identified repeated retirement-market calculations and route construction. Version 397 compared shortest routes before building commands and skipped empty market hours. Equivalent-function checks preceded full games. Its maximum own callback on a fresh 16-game panel was **0.786 seconds**. The frozen peer still overran and remained explicitly unqualified; this was not a hosted latency guarantee.


![Saved-callback measurements improve after route and market optimization; a separate completed episode's total elapsed time exceeds summed own callback time.](/assets/posts/kaggriculture-autoresearch/charts/08_runtime_and_clocks.svg)

<span class="post-img-caption">Callback runtime and total game duration measure different things. Neither chart alone explains the hosted loss.</span>


**Same cash did not mean the same path.** An initial archive check matched 12 of 13 full paths. One 20-coin seed purchase shifted four callbacks; state later rejoined and both final banks matched. A predeclared repeat matched all 13. We retained both observations: the repeat did not erase the mismatch or prove universal determinism. <a class="evidence-ref" href="/assets/posts/kaggriculture-autoresearch/data/anomaly_evidence.json">Anomaly evidence ↗</a>

## The final result, without rounding away the losses

The final 397 source was accepted as submission **56722213** at 23:54 UTC on September 30. Its original saved hosted-status check remained unconfirmed at the research cutoff; the later official result is recorded in the closing section below. Local evaluation covered **133 recorded cases: 93 wins, 40 losses**, retaining every parent win with **zero new recoveries**. Own cash improved in 41 cases and was equal in 92: **3,125 additional coins in total**, or 23.50 per game. That was a small measured gain.


![Final397 changes compared with361: 41 cases improve, 92 stay equal, zero regress, with no new win recoveries.](/assets/posts/kaggriculture-autoresearch/charts/01_paired397_distribution.svg)

<span class="post-img-caption">Final397 gained cash in 41 of 133 recorded cases, with no new wins.</span>


The priority remained all first-40 wins, then all first-60 wins, then margins strictly above 30,000. One source had to meet each target; wins from different branches could not be added together.

<div class="cohort-explorer" id="cohort-explorer">
<div class="explorer-top"><h3>Explore the final 60-game cohorts</h3><div class="tabs" role="group" aria-label="Select recorded cohort"><button type="button" data-cohort="0" aria-pressed="true">Cohort A</button><button type="button" data-cohort="1" aria-pressed="false">Cohort B</button></div></div>
<p class="explorer-note">Recorded opponent commands · exact source 397 · complete coverage, no imputed games</p>
<div id="cohort-summary" class="cohort-summary" aria-live="polite"></div>
<div id="game-grid" class="game-grid" aria-label="Choose a game to inspect its final cash and margin"></div>
<p class="grid-legend"><span class="legend-square floor"></span> Margin &gt; 30,000 <span class="legend-square win"></span> Other win <span class="legend-square loss"></span> Loss · Select a game for cash and margin</p>
<p id="game-detail" class="game-detail" aria-live="polite"></p>
<details><summary>View the complete static margin chart</summary><a href="/assets/posts/kaggriculture-autoresearch/charts/02_cohorts397_margins.svg"><img src="/assets/posts/kaggriculture-autoresearch/charts/02_cohorts397_margins.svg" alt="Both complete chronological 60-game cohorts show remaining negative margins, with a marker after game40 and a strict30,000 target line." loading="lazy"></a></details>
</div>

The target was not achieved. Cohort A ended at **37/40 and 46/60**; B at **36/40 and 44/60**. Only **11/120** margins exceeded 30,000. The live peak of 3,056 belongs to the archived Gen68 source, not this final upload.

The research loop produced real repairs and useful negative results. It also showed where our process became slow: repeatedly optimizing a familiar development set could yield small cash improvements while leaving strategic losses intact. A better next cycle would reserve unseen opponents earlier, test complete economic programmes, and rank hypotheses by plausible recoverable deficit. A launched run, a higher average, and a successful upload each answer different questions.

## What the tests could tell us

A win means finishing with more banked cash than the rival. A recovery means winning a case the parent policy did not win. Gaining cash in an already-won game is useful, but it is not another recovered loss. That distinction explains why the final version could gain 3,125 coins across the recorded panel without adding a single win.

The final checks included 133 recorded games, 16 fresh responsive games, two known runtime cases, and 26 comparisons of the extracted submission archive. Those archive comparisons repeated existing cases; they were not 26 new opponents. The responsive panel used one frozen opponent, so it still offered limited evidence about how the policy would fare against the field.

I pinned the tested source, baseline, case list and submission archive so the results could be traced back to the code that produced them. The detailed [evaluation notes](/assets/posts/kaggriculture-autoresearch/data/pipeline_design_notes.md), [figure data](/assets/posts/kaggriculture-autoresearch/data/plot_data.json), and [failure analysis](/assets/posts/kaggriculture-autoresearch/data/anomaly_evidence.json) are available for readers who want to inspect the mechanics.


## Ranking and closing results

The final upload completed, but it did **not** reproduce the historical 3,000-plus peak. A one-time official check at **8:14 p.m. Pacific on September 30** returned the results below. Submission scores, team placement and the archived peak describe different records. <a href="/assets/posts/kaggriculture-autoresearch/data/closing_evidence.json">Download the dated closing evidence</a>.

<div class="comparison-table" role="region" aria-label="Verified ratings and ranking scope" tabindex="0">
<table><thead><tr><th>Record</th><th>Verified result</th><th>What it establishes</th></tr></thead><tbody>
<tr><td>Archived Gen68 peak</td><td><b>3,056.31</b></td><td>August 22 live rating; no contemporaneous rank located.</td></tr>
<tr><td>Historical team placement</td><td><b>13th · 2,943.4</b></td><td>September 13, 6:02 p.m. Pacific snapshot; not the final competition placement.</td></tr>
<tr><td>Earlier Margin361 upload<br><code>56719676</code></td><td><b>2,145.4 · COMPLETE</b></td><td>Official submission score at the closing check.</td></tr>
<tr><td>Final397 upload<br><code>56722213</code></td><td><b>1,647.7 · COMPLETE</b></td><td>Official submission score at the same check; below the earlier upload.</td></tr>
<tr><td>Settled final competition rank</td><td><b>Unverified</b></td><td>Our team was absent from the returned first 200 leaderboard rows. That response does not establish an exact or settled final placement.</td></tr>
<tr><td>Final397 recorded cohorts</td><td><b>A: 37/40 · 46/60<br>B: 36/40 · 44/60</b></td><td>Complete local panels; zero-loss targets remained unmet.</td></tr>
</tbody></table></div>

The 1,647.7 result is part of the outcome, even though the final local candidate preserved wins and gained cash. These two uploads did not play a matched live schedule, so their score difference cannot isolate the effect of the code change. The practical lesson is to judge promotion using broader responsive opponents and live feedback, while retaining the exact failures that the development panel missed.

## References

1. Andrej Karpathy, [autoresearch](https://github.com/karpathy/autoresearch), original README. The fixed evaluation instrument, bounded experiments and human-authored research programme informed our adaptation.
2. Andrej Karpathy, [autoresearch agent programme](https://github.com/karpathy/autoresearch/blob/master/program.md). Baseline measurement, experiment logging, and keep/discard decisions. Observed repository and file revisions are saved in <a href="/assets/posts/kaggriculture-autoresearch/data/reference_notes.json">reference notes</a>.
3. Andrej Karpathy, [A Recipe for Training Neural Networks](https://karpathy.github.io/2019/04/25/recipe/), April 25, 2019. Data inspection, simple evaluation baselines and incremental hypothesis testing. This is a methodology reference, not a separate autoresearch blog post.
4. Kaggle, [Kaggriculture leaderboard](https://www.kaggle.com/competitions/kaggriculture/leaderboard). The official closing submission/leaderboard API snapshot is bundled in <a href="/assets/posts/kaggriculture-autoresearch/data/official_snapshot.json">dated results</a>; final placement remains unverified.
5. Project records: <a href="/assets/posts/kaggriculture-autoresearch/data/documentation_inventory.json">hashed documentation inventory</a>, <a href="/assets/posts/kaggriculture-autoresearch/data/pipeline_design_notes.md">pipeline design audit</a>, and <a href="/assets/posts/kaggriculture-autoresearch/data/history_evidence.json">development and live-rating evidence</a>. These distinguish documented starter experiments, matched recorded panels and archived live history.
6. Experiment analysis: <a href="/assets/posts/kaggriculture-autoresearch/data/plot_data.json">exact figure datasets</a> and <a href="/assets/posts/kaggriculture-autoresearch/data/anomaly_evidence.json">anomaly evidence</a>. The figure datasets cover all nine Matplotlib charts.
7. Game visualizations: <a href="/assets/posts/kaggriculture-autoresearch/data/interactive_replays/interactive_replay_manifest.json">interactive replay provenance</a> and <a href="/assets/posts/kaggriculture-autoresearch/videos/video_manifest.json">video provenance</a>. Both reconstruct saved public states; they are not new simulated results or original screen recordings. The video manifests also contain frame mappings and source hashes.

<div class="source-note"><p>Results use records through September 30, 2026, including the official closing check at 8:14 p.m. Pacific. Supporting records are linked above.</p></div>

</div>
