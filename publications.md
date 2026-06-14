---
layout: page
title: Publications
permalink: /publications/
includelink: true
custom_layout: true
description: Peer-reviewed papers and standards proposals by Subramanya N on agentic AI identity, authorization, and security.
page_stylesheets:
  - /assets/css/components/content-cards.css
  - /assets/css/pages/blog-index.css
---

<div class="blog-container">
  <div class="blog-posts">
    {% for pub in site.data.about.publications %}
      <div class="blog-post">
        <div class="post-meta">
          <span class="post-date">{{ pub.year }}</span>
        </div>

        <h2 class="post-title"><a href="{{ pub.url }}" target="_blank" rel="noopener">{{ pub.title }}</a></h2>

        <div class="post-excerpt">
          <p>{{ pub.authors }}</p>
          <p><em>{{ pub.venue }}</em></p>
        </div>

        <a href="{{ pub.url }}" class="continue-reading" target="_blank" rel="noopener">
          Read paper
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </a>

        {% if pub.related_post %}
          <a href="{{ pub.related_post | prepend: site.baseurl }}" class="continue-reading" data-preserve-lang>
            Related post
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </a>
        {% endif %}
      </div>

      {% unless forloop.last %}
        <hr class="post-divider">
      {% endunless %}
    {% endfor %}
  </div>

  {% if site.data.about.scholar_id %}
    <p class="scholar-link">
      <a href="https://scholar.google.com/citations?user={{ site.data.about.scholar_id }}&hl=en" target="_blank" rel="noopener">View full profile on Google Scholar &rarr;</a>
    </p>
  {% endif %}
</div>
