---
layout: page
title: Publications
permalink: /publications/
description: Papers and standards proposals by Subramanya N on agentic AI identity, authorization, and security.
includelink: true
custom_layout: true
page_stylesheets:
  - /assets/css/components/content-cards.css
  - /assets/css/pages/blog-index.css
---

<div class="blog-container">
  <div class="blog-posts">
    {% for pub in site.data.about.publications %}
      <article class="blog-post">
        <div class="post-meta">
          <span class="post-date">{{ pub.year }} · {{ pub.venue }}</span>
        </div>

        <h2 class="post-title"><a href="{{ pub.url }}" target="_blank" rel="noopener">{{ pub.title }}</a></h2>

        <div class="post-excerpt">
          {{ pub.authors }}
        </div>

        <a href="{{ pub.url }}" class="continue-reading" target="_blank" rel="noopener">
          Continue reading
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </a>
      </article>

      {% unless forloop.last %}
        <hr class="post-divider">
      {% endunless %}
    {% endfor %}
  </div>
</div>
