---
layout: page
title: Stats
permalink: /stats/
includelink: true
custom_layout: true
---

<div class="stats-container">
  <header class="stats-header">
    <h1>Site Statistics</h1>
    <p class="stats-subtitle">Real-time analytics for this site. All data updates automatically.</p>
  </header>

  <section class="stats-cards">
    <div class="stat-card">
      <div class="stat-card-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
        <span class="stat-number">01</span>
      </div>
      <h3 class="stat-label">Total Views</h3>
      <p class="stat-value" id="total-views">
        {% assign total_views = 0 %}
        {% for item in site.data.view_count.view_counts %}
          {% assign total_views = total_views | plus: item.views %}
        {% endfor %}
        {{ total_views }}
      </p>
      <p class="stat-description">All-time page views</p>
      <p class="stat-meta">Since site launch</p>
    </div>

    <div class="stat-card">
      <div class="stat-card-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <span class="stat-number">02</span>
      </div>
      <h3 class="stat-label">Avg. Engagement</h3>
      <p class="stat-value" id="avg-engagement">
        {% assign total_engagement = 0 %}
        {% assign count = site.data.view_count.view_counts | size %}
        {% for item in site.data.view_count.view_counts %}
          {% assign total_engagement = total_engagement | plus: item.engagement_rate %}
        {% endfor %}
        {% assign avg = total_engagement | divided_by: count | round %}
        {{ avg }}%
      </p>
      <p class="stat-description">Average reader engagement</p>
    </div>

    <div class="stat-card">
      <div class="stat-card-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span class="stat-number">03</span>
      </div>
      <h3 class="stat-label">Avg. Read Time</h3>
      <p class="stat-value" id="avg-read-time">
        {% assign total_duration = 0 %}
        {% assign count = site.data.view_count.view_counts | size %}
        {% for item in site.data.view_count.view_counts %}
          {% assign total_duration = total_duration | plus: item.avg_duration_seconds %}
        {% endfor %}
        {% assign avg_seconds = total_duration | divided_by: count | round %}
        {% assign avg_minutes = avg_seconds | divided_by: 60 | round %}
        {{ avg_minutes }}m
      </p>
      <p class="stat-description">Time spent reading</p>
    </div>

    <div class="stat-card">
      <div class="stat-card-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
        <span class="stat-number">04</span>
      </div>
      <h3 class="stat-label">Blog Posts</h3>
      <p class="stat-value">{{ site.posts | size }}</p>
      <p class="stat-description">Published articles</p>
    </div>

    <div class="stat-card">
      <div class="stat-card-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span class="stat-number">05</span>
      </div>
      <h3 class="stat-label">Tracked Posts</h3>
      <p class="stat-value">{{ site.data.view_count.view_counts | size }}</p>
      <p class="stat-description">Posts with 100+ views</p>
    </div>
  </section>

  <section class="stats-section">
    <h2 class="stats-section-title">Top Performing Posts</h2>
    <div class="stats-table">
      {% for item in site.data.view_count.view_counts %}
        {% assign post_title = nil %}
        {% for post in site.posts %}
          {% if post.url == item.url %}
            {% assign post_title = post.title %}
            {% break %}
          {% endif %}
        {% endfor %}
        <div class="stats-row {% if forloop.first %}first{% endif %}">
          <div class="stats-row-content">
            <span class="stats-rank">{{ forloop.index }}</span>
            <div class="stats-row-info">
              <a href="{{ item.url }}" class="stats-row-title">{{ post_title | default: item.url }}</a>
              <span class="stats-row-url">{{ item.url }}</span>
            </div>
          </div>
          <div class="stats-row-metrics">
            <div class="stats-metric">
              <span class="stats-metric-value">{{ item.views | number_with_delimiter }}</span>
              <span class="stats-metric-label">views</span>
            </div>
            <div class="stats-metric">
              <span class="stats-metric-value">{{ item.engagement_rate }}%</span>
              <span class="stats-metric-label">engagement</span>
            </div>
            <div class="stats-metric">
              <span class="stats-metric-value" data-seconds="{{ item.avg_duration_seconds }}">{% assign mins = item.avg_duration_seconds | divided_by: 60.0 | round: 1 %}{{ mins }}m</span>
              <span class="stats-metric-label">avg. time</span>
            </div>
          </div>
        </div>
      {% endfor %}
    </div>
  </section>

  <section class="stats-section">
    <h2 class="stats-section-title">Data Source</h2>
    <div class="stats-info-card">
      <div class="stats-info-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      </div>
      <div class="stats-info-content">
        <h3>Privacy-Focused Analytics</h3>
        <p>This site uses Google Analytics 4 with privacy-preserving settings. Data is aggregated and no personally identifiable information is collected. View counts are updated daily via GitHub Actions.</p>
        <p class="stats-info-meta">
          <span>Last updated: {{ site.data.view_count.last_updated | date: "%B %d, %Y at %I:%M %p" }}</span>
        </p>
      </div>
    </div>
  </section>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  // Format numbers with commas
  function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  
  // Format time in seconds to readable format (e.g., "2m 30s" or "5.5m")
  function formatTime(seconds) {
    const mins = Math.round(seconds / 60 * 10) / 10; // Round to 1 decimal
    if (mins < 1) {
      return Math.round(seconds) + 's';
    }
    return mins + 'm';
  }
  
  // Format the total views
  const totalViewsEl = document.getElementById('total-views');
  if (totalViewsEl) {
    const rawValue = parseInt(totalViewsEl.textContent.trim());
    if (!isNaN(rawValue)) {
      totalViewsEl.textContent = formatNumber(rawValue);
    }
  }
  
  // Format all stat values that are numbers
  document.querySelectorAll('.stats-metric-value').forEach(function(el) {
    const text = el.textContent.trim();
    
    // Handle time values with data-seconds attribute
    if (el.dataset.seconds) {
      const seconds = parseFloat(el.dataset.seconds);
      if (!isNaN(seconds)) {
        el.textContent = formatTime(seconds);
      }
      return;
    }
    
    // Handle regular numbers
    const num = parseInt(text);
    if (!isNaN(num) && !text.includes('%') && !text.includes('m') && !text.includes('s')) {
      el.textContent = formatNumber(num);
    }
  });
  
  // Add animation on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });
  
  document.querySelectorAll('.stat-card, .stats-row').forEach(el => {
    observer.observe(el);
  });
});
</script>
