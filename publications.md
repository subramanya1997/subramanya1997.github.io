---
layout: page
title: Publications
permalink: /publications/
description: Papers and standards proposals by Subramanya N on agentic AI identity, authorization, and security.
---

<ul class="pub-list">
  {% for pub in site.data.about.publications %}
  <li class="pub-item">
    <a class="pub-title" href="{{ pub.url }}" target="_blank" rel="noopener">{{ pub.title }}</a>
    <div class="pub-authors">{{ pub.authors }}</div>
    <div class="pub-meta">{{ pub.venue }} · {{ pub.year }}{% if pub.related_post %} · <a href="{{ pub.related_post | prepend: site.baseurl }}" data-preserve-lang>Related post</a>{% endif %}</div>
  </li>
  {% endfor %}
</ul>

{% if site.data.about.scholar_id %}
<p class="pub-scholar"><a href="https://scholar.google.com/citations?user={{ site.data.about.scholar_id }}&hl=en" target="_blank" rel="noopener">View full profile on Google Scholar &rarr;</a></p>
{% endif %}

<style>
  .pub-list { list-style: none; padding: 0; margin: 0; }
  .pub-item { padding: 18px 0; border-bottom: 1px solid var(--border-color); }
  .pub-item:last-child { border-bottom: none; }
  .pub-title { display: inline-block; font-size: 17px; font-weight: 600; line-height: 1.4; color: var(--text-primary); text-decoration: none; }
  .pub-title:hover { color: var(--accent); }
  .pub-authors { margin-top: 6px; font-size: 14px; line-height: 1.5; color: var(--text-secondary); }
  .pub-meta { margin-top: 4px; font-size: 13px; color: var(--text-tertiary); }
  .pub-meta a { color: var(--accent); text-decoration: none; }
  .pub-meta a:hover { text-decoration: underline; }
  .pub-scholar { margin-top: 24px; font-size: 14px; }
  .pub-scholar a { color: var(--accent); text-decoration: none; }
  .pub-scholar a:hover { text-decoration: underline; }
</style>
