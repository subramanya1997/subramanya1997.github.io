---
layout: page
title: Books
permalink: /books/
includelink: true
custom_layout: true
---

<div class="books-container">
  <div class="books-list">
    {% for book in site.books %}
      <div class="book-entry">
        <div class="book-date">{{ book.date | date: "%Y-%m-%d" }}</div>
        <h2 class="book-title"><a href="{{ book.url }}">{{ book.title }}</a></h2>
        
        {% if book.tags.size > 0 %}
        <div class="book-tags">
          {% for tag in book.tags %}
            <span class="tag">{{ tag }}</span>
          {% endfor %}
        </div>
        {% endif %}
        
        <div class="book-excerpt">
          {{ book.excerpt }}
        </div>
        
        <a href="{{ book.url }}" class="continue-reading">
          Continue reading
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </a>
      </div>
      
      {% unless forloop.last %}
        <hr class="book-divider">
      {% endunless %}
    {% endfor %}
  </div>
</div>

<style>
  .books-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 20px;
  }
  
  .books-list {
    margin-top: 20px;
  }
  
  .book-entry {
    margin-bottom: 30px;
  }
  
  .book-date {
    font-size: 14px;
    color: #555;
    margin-bottom: 8px;
  }
  
  .book-title {
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 10px 0;
  }
  
  .book-title a {
    color: #111;
    text-decoration: none;
  }
  
  .book-title a:hover {
    color: #555555;
  }
  
  .book-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .book-excerpt {
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
  
  .book-divider {
    border: none;
    border-top: 1px solid #e5e5e5;
    margin: 30px 0;
  }
  
  @media (max-width: 768px) {
    .books-container {
      padding: 0 15px;
    }
    
    .book-title {
      font-size: 22px;
    }
  }
</style>