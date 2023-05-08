---
layout: page
title: Books
permalink: /Books/
includelink: true
---

<div class="search-wrapper">
  <input type="text" id="search-input" placeholder="Search books..." oninput="searchPosts()">
</div>

<p class="note">Tip: Click on the tags below each post to filter the articles.</p>
<div id="selected-filters" class="post-tags"></div>

<ul class="posts">
  {% for book in site.books %}
    <li data-tags="{{ book.tags | join: ',' }}">
      <span class="post-date">{{ book.date | date: "%b %-d, %Y" }}</span>
      <a class="post-link" href="{{ book.web_url | prepend: site.baseurl }}">{{ book.title }}</a>
      <br>
      {{ book.excerpt }}
      <div class="post-tags">
        {% for tag in book.tags %}
          <span class="tag" onclick="filterPostsByTag('{{ tag }}')">{{ tag }}</span>
        {% endfor %}
      </div>
    </li>
  {% endfor %}
</ul>

<script>
  function filterPostsByTag(tag) {
    const selectedFiltersDiv = document.getElementById('selected-filters');
    const existingFilter = selectedFiltersDiv.querySelector(`[data-tag="${tag}"]`);

    // If the filter is already added, do nothing
    if (existingFilter) return;

    // Create the filter element and add it to the selected filters div
    const filter = document.createElement('span');
    filter.className = 'tag';
    filter.textContent = `${tag} x`;
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
      const postTags = postListItem.getAttribute('data-tags').split(',');

      const matchesSearchQuery = postTitle.includes(searchQuery);
      const matchesSelectedFilters = filters.length === 0 || filters.some(filter => postTags.includes(filter));

      if (matchesSearchQuery && matchesSelectedFilters) {
        postListItem.style.display = 'block';
      } else {
        postListItem.style.display = 'none';
      }
    });
  }
</script>