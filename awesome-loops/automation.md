---
layout: page
title: Loops
description: A curated marketplace of repeatable automation loops for coding agents, research agents, operations, growth, evaluation, and customer workflows.
permalink: /awesome-loops/automation/
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

<div class="loop-marketplace" data-github-new-url="https://github.com/subramanya1997/subramanya1997.github.io/new/main/_loops">
  <header class="loop-hero">
    <p class="loop-eyebrow">awesome-loops / automation</p>
    <h1>Automation loop marketplace</h1>
    <p>Curated agent loops as copyable prompts, Agent Skills, Codex instructions, and Cursor rules. Every listing is Markdown, optional metadata stays optional, and every community submission goes through pull-request review.</p>
    <div class="loop-hero-actions">
      <a href="#submit-loop" class="loop-primary-action">Submit loop</a>
      <a href="https://github.com/subramanya1997/subramanya1997.github.io/tree/main/_loops" rel="noopener noreferrer">Browse Markdown</a>
    </div>
    <dl class="loop-stats" aria-label="Marketplace stats">
      <div>
        <dt>{{ site.loops.size }}</dt>
        <dd>Listings</dd>
      </div>
      <div>
        <dt>1</dt>
        <dd>Markdown file per loop</dd>
      </div>
      <div>
        <dt>PR</dt>
        <dd>Review gate</dd>
      </div>
    </dl>
  </header>

  <section class="loop-toolbar" aria-label="Marketplace filters">
    <label for="loop-search">Search</label>
    <input id="loop-search" type="search" placeholder="Search loops, links, source, or attribution" autocomplete="off">

    {% if categories.size > 0 %}
      <label for="loop-category">Category</label>
      <select id="loop-category">
        <option value="">All categories</option>
        {% for category in categories %}
          <option value="{{ category | downcase | escape }}">{{ category }}</option>
        {% endfor %}
      </select>
    {% endif %}

    <output id="loop-count" aria-live="polite">{{ site.loops.size }} loops</output>
  </section>

  <section class="loop-listings" aria-label="Automation loop listings">
    {% for loop in loops %}
      {% assign loop_search_text = loop.title | append: " " | append: loop.excerpt | append: " " | append: loop.content | append: " " | append: loop.category | append: " " | append: loop.tooling | append: " " | append: loop.proof | append: " " | append: loop.stop | append: " " | append: loop.source_title | append: " " | append: loop.attribution | append: " " | append: loop.tags | append: " " | append: loop.links | downcase %}
      <article class="loop-card" data-category="{{ loop.category | downcase | escape }}" data-search="{{ loop_search_text | strip_html | escape }}">
        <div class="loop-card-header">
          {% if loop.category or loop.status %}
            <p class="loop-card-meta">
              {% if loop.category %}{{ loop.category }}{% endif %}
              {% if loop.category and loop.status %} / {% endif %}
              {% if loop.status %}{{ loop.status }}{% endif %}
            </p>
          {% endif %}
          <h2><a href="{{ loop.url | prepend: site.baseurl }}">{{ loop.title }}</a></h2>
          <p>{{ loop.excerpt }}</p>
        </div>

        {% if loop.proof or loop.stop %}
          <dl class="loop-card-contract">
            {% if loop.proof %}
              <div>
                <dt>Verify</dt>
                <dd>{{ loop.proof }}</dd>
              </div>
            {% endif %}
            {% if loop.stop %}
              <div>
                <dt>Stop</dt>
                <dd>{{ loop.stop }}</dd>
              </div>
            {% endif %}
          </dl>
        {% endif %}

        {% if loop.tags %}
          <div class="loop-tags" aria-label="Tags">
            {% for tag in loop.tags %}
              <span>{{ tag }}</span>
            {% endfor %}
          </div>
        {% endif %}

        {% if loop.source_url or loop.source_title or loop.attribution or loop.links %}
          <div class="loop-card-footer">
            {% if loop.source_url %}
              <a href="{{ loop.source_url }}" rel="noopener noreferrer">{{ loop.source_title | default: loop.source_url }}</a>
            {% elsif loop.source_title %}
              <span>{{ loop.source_title }}</span>
            {% endif %}
            {% if loop.attribution %}
              <span>{{ loop.attribution }}</span>
            {% elsif loop.links %}
              <span>{{ loop.links.size }} link{% if loop.links.size != 1 %}s{% endif %}</span>
            {% endif %}
          </div>
        {% endif %}
      </article>
    {% endfor %}
  </section>

  <section class="loop-submit" id="submit-loop">
    <div class="loop-submit-header">
      <p class="loop-eyebrow">Contribute</p>
      <h2>Submit a loop</h2>
      <p>Send the prompt or instructions you actually use. Source, attribution, tags, and MCP/resource links are optional.</p>
    </div>

    <form class="loop-submit-form" id="loop-submit-form">
      <input type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true" class="loop-honeypot">

      <div class="loop-form-row">
        <label for="loop-title">Title *</label>
        <input id="loop-title" name="title" required maxlength="90" placeholder="The production error sweep">
      </div>

      <div class="loop-form-row">
        <label for="loop-excerpt">Short pitch optional</label>
        <textarea id="loop-excerpt" name="excerpt" rows="2" maxlength="220" placeholder="Leave blank to derive this from the instructions."></textarea>
      </div>

      <div class="loop-form-grid">
        <div class="loop-form-row">
          <label for="loop-source-url">Source link optional</label>
          <input id="loop-source-url" name="source_url" type="url" placeholder="https://example.com/source">
        </div>

        <div class="loop-form-row">
          <label for="loop-attribution">Attribution optional</label>
          <input id="loop-attribution" name="attribution" placeholder="Name, handle, or organization">
        </div>
      </div>

      <div class="loop-form-row">
        <label for="loop-links">MCP, repo, docs, or resource links optional</label>
        <textarea id="loop-links" name="links" rows="3" placeholder="One per line. Use either https://example.com or Label | https://example.com"></textarea>
      </div>

      <div class="loop-form-row">
        <label for="loop-tags-input">Tags optional</label>
        <input id="loop-tags-input" name="tags" placeholder="engineering, logs, pr-review">
      </div>

      <div class="loop-form-row">
        <label for="loop-instructions">Loop instructions *</label>
        <textarea id="loop-instructions" name="instructions" required rows="8" placeholder="Paste the prompt or operating instructions. Keep secrets, private code, and private customer data out."></textarea>
      </div>

      <label class="loop-checkbox">
        <input type="checkbox" name="rights" required>
        <span>I have the right to share this loop and understand it may be edited before publication.</span>
      </label>

      <div class="loop-form-actions">
        <button type="submit">Open PR contribution</button>
        <button type="button" id="loop-preview-button">Preview Markdown</button>
      </div>

      <div class="loop-generated" id="loop-generated" hidden>
        <label for="loop-generated-markdown">Generated Markdown</label>
        <textarea id="loop-generated-markdown" readonly rows="12"></textarea>
        <p id="loop-generated-note" aria-live="polite"></p>
      </div>
    </form>
  </section>
</div>
