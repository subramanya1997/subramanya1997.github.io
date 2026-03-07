---
layout: page
title: Books
permalink: /books/
includelink: true
custom_layout: true
page_stylesheets:
  - /assets/css/components/content-cards.css
  - /assets/css/pages/books-index.css
---

<div class="books-container">
  <div class="books-list">
    {% for book in site.books %}
      {% include components/book-card.html book=book tag_mode="plain" date_mode="iso" %}
      
      {% unless forloop.last %}
        <hr class="book-divider">
      {% endunless %}
    {% endfor %}
  </div>
</div>
