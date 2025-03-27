---
layout: page
title: Blog
permalink: /blog/
includelink: true
---

<div class="blog-header">
  <h1>My Blog</h1>
  <p>Thoughts, ideas, and technical articles about my work and interests.</p>
  
  <div class="blog-tools">
    <div class="search-wrapper">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <input type="text" id="search-input" placeholder="Search blog posts..." oninput="searchPosts()">
    </div>
    
    <div id="selected-filters" class="selected-filters">
      <!-- Active filters will appear here -->
    </div>
  </div>
</div>

<div class="blog-container">
  <div class="blog-posts">
    <ul class="posts">
      {% for post in site.posts %}
        <li data-tags="{{ post.tags | join: ',' }}">
          <div class="post-meta-top">
            <span class="post-date">{{ post.date | date: "%b %-d, %Y" }}</span>
            {% if post.reading_time %}
              <span class="reading-time">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                {{ post.reading_time }} min read
              </span>
            {% endif %}
          </div>
          <a class="post-link" href="{{ post.url | prepend: site.baseurl }}">{{ post.title }}</a>
          <div class="post-excerpt">{{ post.excerpt }}</div>
          <div class="post-tags">
            {% for tag in post.tags %}
              <span class="tag" onclick="filterPostsByTag('{{ tag }}')">{{ tag }}</span>
            {% endfor %}
          </div>
        </li>
      {% endfor %}
    </ul>
  </div>
  
  <div class="blog-sidebar">
    <div class="sidebar-section">
      <h3>Recent Posts</h3>
      <ul class="recent-posts">
        {% for post in site.posts limit:5 %}
          <li>
            <a href="{{ post.url | prepend: site.baseurl }}">{{ post.title }}</a>
            <span class="post-date-small">{{ post.date | date: "%b %-d, %Y" }}</span>
          </li>
        {% endfor %}
      </ul>
    </div>
  </div>
</div>

<style>
  .blog-header {
    margin-bottom: 40px;
  }
  
  .blog-header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    position: relative;
    padding-bottom: 10px;
  }
  
  .blog-header h1:after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 50px;
    height: 4px;
    background: #2563eb;
    border-radius: 2px;
  }
  
  .blog-header p {
    font-size: 18px;
    color: #64748b;
    max-width: 600px;
  }
  
  .blog-tools {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-top: 25px;
  }
  
  .search-wrapper {
    position: relative;
    max-width: 400px;
  }
  
  .search-icon {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #64748b;
  }
  
  #search-input {
    width: 100%;
    padding: 12px 20px 12px 45px;
    border-radius: 30px;
    border: 1px solid #e2e8f0;
    font-size: 16px;
    transition: all 0.2s ease;
  }
  
  #search-input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
  
  .selected-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    min-height: 40px;
  }
  
  .blog-container {
    display: flex;
    gap: 40px;
  }
  
  .blog-posts {
    flex: 1;
  }
  
  .posts {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 25px;
  }
  
  .posts li {
    background: white;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    border: 1px solid rgba(0,0,0,0.05);
  }
  
  .posts li:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.05);
  }
  
  .blog-sidebar {
    width: 300px;
    flex-shrink: 0;
  }
  
  .sidebar-section {
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 30px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
    border: 1px solid rgba(0,0,0,0.05);
  }
  
  .sidebar-section h3 {
    font-size: 18px;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(0,0,0,0.05);
  }
  
  .sidebar-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .recent-posts {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .recent-posts li {
    margin-bottom: 15px;
    padding-bottom: 15px;
    border-bottom: 1px solid rgba(0,0,0,0.05);
  }
  
  .recent-posts li:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
  
  .recent-posts a {
    display: block;
    font-weight: 500;
    margin-bottom: 5px;
  }
  
  .post-date-small {
    font-size: 12px;
    color: #64748b;
  }
  
  .post-meta-top {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 10px;
  }
  
  .post-date {
    display: inline-block;
    font-size: 14px;
    color: #64748b;
    background: #f0f4ff;
    padding: 5px 12px;
    border-radius: 30px;
    font-weight: 500;
  }
  
  .reading-time {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 14px;
    color: #64748b;
  }
  
  .post-link {
    font-size: 1.5rem;
    font-weight: 600;
    color: #111;
    margin: 0.5rem 0;
    display: block;
    line-height: 1.3;
  }
  
  .post-link:hover {
    color: #2563eb;
  }
  
  .post-excerpt {
    margin: 12px 0 20px;
    color: #4b5563;
    line-height: 1.6;
  }
  
  .post-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .tag {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 3px 8px;
    background-color: #eef2ff;
    color: #4b5563;
    border-radius: 16px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 400;
  }
  
  .tag:hover {
    background-color: #2563eb;
    color: white;
  }
  
  /* Clean tag cloud grid layout in categories */
  .categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 8px;
  }
  
  .categories-grid .tag {
    text-align: center;
    justify-content: center;
  }
  
  @media screen and (max-width: 1024px) {
    .blog-container {
      flex-direction: column;
    }
    
    .blog-sidebar {
      width: 100%;
      margin-top: 30px;
    }
  }
</style>

<script>
  function filterPostsByTag(tag) {
    const selectedFiltersDiv = document.getElementById('selected-filters');
    const existingFilter = selectedFiltersDiv.querySelector(`[data-tag="${tag}"]`);

    // If the filter is already added, do nothing
    if (existingFilter) return;

    // Create the filter element and add it to the selected filters div
    const filter = document.createElement('span');
    filter.className = 'tag';
    filter.innerHTML = `${tag} <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    filter.setAttribute('data-tag', tag);
    filter.onclick = () => {
      filter.remove();
      showOrHidePostsByCurrentFilters();
    };
    selectedFiltersDiv.appendChild(filter);

    showOrHidePostsByCurrentFilters();
  }

  function showOrHidePostsByCurrentFilters() {
    const selectedFiltersDiv = document.getElementById('selected-filters');
    const filters = Array.from(selectedFiltersDiv.children).map(filter => filter.getAttribute('data-tag'));
    
    const postListItems = document.querySelectorAll('.posts li');
    postListItems.forEach((postListItem) => {
      const postTags = postListItem.getAttribute('data-tags').split(',');
      if (filters.length === 0 || filters.some(filter => postTags.includes(filter))) {
        postListItem.style.display = 'block';
      } else {
        postListItem.style.display = 'none';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const selectedTag = localStorage.getItem('selectedTag');
    if (selectedTag) {
      localStorage.removeItem('selectedTag');
      filterPostsByTag(selectedTag);
    }
  });

  function searchPosts() {
    const searchInput = document.getElementById('search-input');
    const searchQuery = searchInput.value.toLowerCase();

    // Revert to displaying posts based on the selected filters if the search input is empty
    if (searchQuery.length === 0) {
      showOrHidePostsByCurrentFilters();
      return;
    }

    const selectedFiltersDiv = document.getElementById('selected-filters');
    const filters = Array.from(selectedFiltersDiv.children).map(filter => filter.getAttribute('data-tag'));

    const postListItems = document.querySelectorAll('.posts li');
    postListItems.forEach((postListItem) => {
      const postTitle = postListItem.querySelector('.post-link').textContent.toLowerCase();
      const postExcerpt = postListItem.querySelector('.post-excerpt').textContent.toLowerCase();
      const postTags = postListItem.getAttribute('data-tags').split(',');

      const matchesSearchQuery = postTitle.includes(searchQuery) || postExcerpt.includes(searchQuery);
      const matchesSelectedFilters = filters.length === 0 || filters.some(filter => postTags.includes(filter));

      if (matchesSearchQuery && matchesSelectedFilters) {
        postListItem.style.display = 'block';
      } else {
        postListItem.style.display = 'none';
      }
    });
  }
</script>