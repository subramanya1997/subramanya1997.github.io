---
layout: page
title: Blog
permalink: /blog/
includelink: true
custom_layout: true
page_stylesheets:
  - /assets/css/components/content-cards.css
  - /assets/css/pages/blog-index.css
---

<div class="blog-container">
  <div class="blog-posts">
    {% for post in site.posts %}
      {% assign post_views = nil %}
      {% for view_data in site.data.view_count.view_counts %}
        {% if post.url == view_data.url %}
          {% assign post_views = view_data.views %}
          {% break %}
        {% endif %}
      {% endfor %}
      {% include components/post-card.html post=post post_views=post_views tag_mode="plain" date_mode="human" %}
      
      {% unless forloop.last %}
        <hr class="post-divider">
      {% endunless %}
    {% endfor %}
  </div>
</div>
