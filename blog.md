---
layout: page
title: Blog
permalink: /blog/
includelink: true
custom_layout: true
---

<div class="blog-container">
  <div class="blog-posts">
    {% assign popular_urls = site.data.popular_posts.posts | map: "url" %}
    {% for post in site.posts %}
      {% assign is_trending = false %}
      {% assign post_url_normalized = post.url %}
      {% for popular_post in site.data.popular_posts.posts %}
        {% assign popular_url_normalized = popular_post.url %}
        {% if post_url_normalized == popular_url_normalized %}
          {% assign is_trending = true %}
          {% break %}
        {% endif %}
      {% endfor %}
      <div class="blog-post">
        <div class="post-meta">
          <span class="post-date" data-date="{{ post.date | date: "%Y-%m-%d" }}">{{ post.date | date: "%Y-%m-%d" }}</span>
          <span class="post-reading-time">
            {% if is_trending %}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="trending-icon" title="Trending">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
            {% endif %}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            {% include reading_time.html content=post.content %}
          </span>
        </div>
        <h2 class="post-title"><a href="{{ post.url | prepend: site.baseurl }}">{{ post.title }}</a></h2>
        
        {% if post.tags.size > 0 %}
        <div class="post-tags">
          {% for tag in post.tags %}
            <span class="tag">{{ tag }}</span>
          {% endfor %}
        </div>
        {% endif %}
        
        <div class="post-excerpt">
          {{ post.excerpt }}
        </div>
        
        <a href="{{ post.url | prepend: site.baseurl }}" class="continue-reading">
          Continue reading
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </a>
      </div>
      
      {% unless forloop.last %}
        <hr class="post-divider">
      {% endunless %}
    {% endfor %}
  </div>
</div>

<style>
  .blog-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 20px;
  }
  
  .blog-posts {
    margin-top: 20px;
  }
  
  .blog-post {
    margin-bottom: 30px;
  }
  
  .post-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }
  
  .post-date {
    font-size: 14px;
    color: #555;
  }
  
  .post-reading-time {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 14px;
    color: #555;
  }
  
  .post-reading-time svg {
    flex-shrink: 0;
  }
  
  .post-reading-time .trending-icon {
    stroke: #ff6b6b;
    cursor: help;
  }
  
  .post-title {
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 10px 0;
  }
  
  .post-title a {
    color: #111;
    text-decoration: none;
  }
  
  .post-title a:hover {
    color: #555555;
  }
  
  .post-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .post-excerpt {
    font-size: 14px;
    line-height: 1.6;
    color: #444;
    margin-bottom: 12px;
  }
  
  .continue-reading {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: #555555;
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
  }
  
  .continue-reading:hover {
    color: #333333;
    text-decoration: underline;
  }
  
  .continue-reading svg {
    transition: transform 0.2s ease;
  }
  
  .continue-reading:hover svg {
    transform: translateX(3px);
  }
  
  .post-divider {
    border: none;
    border-top: 1px solid #e5e5e5;
    margin: 30px 0;
  }
  
  @media (max-width: 768px) {
    .blog-container {
      padding: 0 15px;
    }
    
    .post-title {
      font-size: 22px;
    }
  }
</style>

<script>
  // Format dates with ordinal suffixes (e.g., "December 8th, 2025")
  document.addEventListener('DOMContentLoaded', function() {
    const dateElements = document.querySelectorAll('.post-date[data-date]');
    
    dateElements.forEach(function(el) {
      const dateStr = el.getAttribute('data-date');
      if (!dateStr) return;
      
      const date = new Date(dateStr + 'T00:00:00');
      if (isNaN(date.getTime())) return;
      
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      
      // Get ordinal suffix
      let suffix = 'th';
      if (day === 1 || day === 21 || day === 31) {
        suffix = 'st';
      } else if (day === 2 || day === 22) {
        suffix = 'nd';
      } else if (day === 3 || day === 23) {
        suffix = 'rd';
      }
      
      el.textContent = month + ' ' + day + suffix + ', ' + year;
    });
  });
</script>