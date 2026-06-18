---
layout: page
title: Loops
description: A marketplace of repeatable automation loops for coding agents, research agents, operations, growth, evaluation, and customer workflows.
permalink: /awesome-loops/
includelink: true
custom_layout: true
page_stylesheets:
  - /assets/css/pages/loop-marketplace.css
page_scripts:
  - /assets/js/pages/loop-marketplace.js
---

{% assign loops = site.loops | sort: "title" %}
{% assign categorized_loops = site.loops | where_exp: "loop", "loop.category" %}
{% assign categories = categorized_loops | map: "category" | uniq | sort %}

<div class="loop-marketplace" data-github-issue-url="https://github.com/subramanya1997/subramanya1997.github.io/issues/new">
  <header class="loop-hero">
    <div class="loop-hero-copy">
      <p class="loop-eyebrow">awesome-loops</p>
      <h1>Automation loops</h1>
      <p>Reusable agent workflows you can open in Claude, add to Cursor, or launch with Codex. Every submission is a Markdown automation reviewed through GitHub.</p>
    </div>
    <div class="loop-hero-panel">
      <div class="loop-platform-strip" aria-label="Supported platforms">
        <span><img src="{{ '/assets/images/logos/claude.svg' | prepend: site.baseurl }}" alt="" aria-hidden="true" width="18" height="18">Claude</span>
        <span><img src="{{ '/assets/images/logos/cursor.svg' | prepend: site.baseurl }}" alt="" aria-hidden="true" width="18" height="18">Cursor</span>
        <span><img src="{{ '/assets/images/logos/openai.svg' | prepend: site.baseurl }}" alt="" aria-hidden="true" width="18" height="18">Codex</span>
      </div>
      <div class="loop-hero-actions">
        <a href="#submit-loop" class="loop-primary-action">Create automation</a>
        <a href="https://github.com/subramanya1997/subramanya1997.github.io/tree/main/_loops" rel="noopener noreferrer">Browse Markdown</a>
      </div>
    </div>
  </header>

  <section class="loop-toolbar" aria-label="Marketplace filters">
    <input id="loop-search" type="search" placeholder="Search automations" autocomplete="off" aria-label="Search automations">

    {% if categories.size > 0 %}
      <select id="loop-category" aria-label="Filter by category">
        <option value="">All categories</option>
        {% for category in categories %}
          <option value="{{ category | downcase | escape }}">{{ category }}</option>
        {% endfor %}
      </select>
    {% endif %}
  </section>

  <section class="loop-listings" aria-label="Automation loop listings">
    {% for loop in loops %}
      {% assign loop_search_text = loop.title | append: " " | append: loop.excerpt | append: " " | append: loop.content | append: " " | append: loop.category | append: " " | append: loop.tooling | append: " " | append: loop.proof | append: " " | append: loop.stop | append: " " | append: loop.attribution | append: " " | append: loop.tags | append: " " | append: loop.links | downcase %}
      <article class="loop-card" data-category="{{ loop.category | downcase | escape }}" data-search="{{ loop_search_text | strip_html | escape }}">
        <div class="loop-card-top">
          {% if loop.category %}
            <span class="loop-card-pill">{{ loop.category }}</span>
          {% endif %}
        </div>

        <h2><a href="{{ loop.url | prepend: site.baseurl }}">{{ loop.title }}</a></h2>
        <p>{{ loop.excerpt }}</p>

        {% if loop.tags %}
          <div class="loop-tags" aria-label="Tags">
            {% for tag in loop.tags limit: 3 %}
              <span>{{ tag }}</span>
            {% endfor %}
          </div>
        {% endif %}

        <div class="loop-card-footer">
          {% if loop.attribution %}
            <span>{{ loop.attribution }}</span>
          {% elsif loop.category %}
            <span>{{ loop.category }}</span>
          {% else %}
            <span>Markdown automation</span>
          {% endif %}
        </div>
      </article>
    {% endfor %}
  </section>

  <section class="loop-submit" id="submit-loop">
    <form class="loop-submit-form" id="loop-submit-form" novalidate>
      <div class="loop-submit-header">
        <div class="loop-submit-title">
          <h2>Create automation loop</h2>
        </div>
        <div class="loop-submit-tabs" role="tablist" aria-label="Submission view">
          <button type="button" id="loop-form-tab" class="is-active" role="tab" aria-selected="true" aria-controls="loop-form-panel" data-loop-submit-tab="form">Form</button>
          <button type="button" id="loop-markdown-tab" role="tab" aria-selected="false" aria-controls="loop-markdown-panel" data-loop-submit-tab="markdown">Markdown</button>
        </div>
      </div>

      <input type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true" class="loop-honeypot">

      <div class="loop-submit-pane" id="loop-form-panel" role="tabpanel" aria-labelledby="loop-form-tab">
        <div class="loop-form-row">
          <label for="loop-title">Title *</label>
          <input id="loop-title" name="title" required maxlength="90" placeholder="The production error sweep">
        </div>

        <div class="loop-form-row">
          <label for="loop-excerpt">Description optional</label>
          <textarea id="loop-excerpt" name="excerpt" rows="2" maxlength="220" placeholder="Leave blank to derive this from the instructions."></textarea>
        </div>

        <div class="loop-form-row">
          <label for="loop-tags-input">Tags optional</label>
          <input id="loop-tags-input" name="tags" placeholder="engineering, logs, pr-review">
        </div>

        <div class="loop-form-row">
          <label for="loop-instructions">Loop instructions *</label>
          <textarea id="loop-instructions" name="instructions" required rows="9" placeholder="Paste the prompt or operating instructions. Keep secrets, private code, and private customer data out."></textarea>
        </div>

        <label class="loop-checkbox">
          <input type="checkbox" name="rights" required>
          <span>I have the right to share this loop and understand it may be edited before publication.</span>
        </label>
      </div>

      <pre class="loop-markdown-preview" id="loop-markdown-panel" role="tabpanel" aria-labelledby="loop-markdown-tab" hidden><code id="loop-markdown-preview"></code></pre>

      <div class="loop-form-actions">
        <button type="submit">Create submission issue</button>
      </div>
      <p class="loop-submit-note" id="loop-submit-note" aria-live="polite">Submit opens a GitHub issue. A repository workflow turns the issue into a PR.</p>
    </form>
  </section>
</div>
