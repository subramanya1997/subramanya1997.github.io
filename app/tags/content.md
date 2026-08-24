---
layout: page
title: Tags
permalink: /tags/
custom_layout: true
description: Browse posts and books by topic.
page_stylesheets:
  - /assets/css/pages/tags.css
---

<div class="tags-page">
  <div class="tags-shell">
    <header class="tags-hero">
      <p class="tags-overline">Topic archive</p>
      <h1>Browse by tag</h1>
      <p class="tags-summary">
        Explore recurring topics across essays, notes, and book writeups.
      </p>
      <a class="tags-secondary-link" href="{{ '/search/' | prepend: site.baseurl }}" data-preserve-lang>Search the archive</a>
    </header>

    {% if site.data.tag_archives and site.data.tag_archives.size > 0 %}
      <div class="tag-directory">
        {% for tag in site.data.tag_archives %}
          <a class="tag-directory-card" href="{{ '/tags/' | append: tag.slug | append: '/' | prepend: site.baseurl }}" data-preserve-lang>
            <span class="tag-directory-name">{{ tag.name }}</span>
            <span class="tag-directory-meta">
              {{ tag.total_count }} item{% if tag.total_count != 1 %}s{% endif %}
              {% if tag.post_count > 0 and tag.book_count > 0 %}
                · {{ tag.post_count }} posts · {{ tag.book_count }} books
              {% elsif tag.post_count > 0 %}
                · {{ tag.post_count }} posts
              {% elsif tag.book_count > 0 %}
                · {{ tag.book_count }} books
              {% endif %}
            </span>
          </a>
        {% endfor %}
      </div>
    {% else %}
      <div class="tags-empty-state">
        <h2>No tags yet</h2>
        <p>Publish content with tags to build the archive.</p>
      </div>
    {% endif %}
  </div>
</div>
