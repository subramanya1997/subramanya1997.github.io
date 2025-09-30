---
layout: page
title: Publications
permalink: /publications/
---

This page contains my scholarly articles and technical publications.

## Technical Articles

{% assign posts = site.posts | where: "ready", true | sort: 'date' | reverse %}
{% for post in posts %}
<article class="publication-item">
  <h3><a href="{{ post.url }}">{{ post.title }}</a></h3>
  <div class="publication-meta">
    <span class="author">{% if post.author %}{{ post.author }}{% else %}Subramanya N{% endif %}</span>
    <span class="date">{{ post.date | date: "%B %d, %Y" }}</span>
  </div>
  {% if post.excerpt %}
  <p class="abstract">{{ post.excerpt | strip_html }}</p>
  {% endif %}
  {% if post.tags %}
  <div class="keywords">
    <strong>Keywords:</strong> {{ post.tags | join: ', ' }}
  </div>
  {% endif %}
</article>
{% endfor %}

<style>
  .publication-item {
    margin-bottom: 40px;
    padding-bottom: 30px;
    border-bottom: 1px solid rgba(0,0,0,0.1);
  }
  
  .publication-item h3 {
    margin-bottom: 10px;
  }
  
  .publication-meta {
    color: #666;
    margin-bottom: 15px;
    font-size: 14px;
  }
  
  .publication-meta .author {
    font-weight: 600;
  }
  
  .publication-meta .date {
    margin-left: 10px;
  }
  
  .abstract {
    margin: 15px 0;
    line-height: 1.6;
  }
  
  .keywords {
    font-size: 14px;
    color: #666;
    margin-top: 10px;
  }
</style>

