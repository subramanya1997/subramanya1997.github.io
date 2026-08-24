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
      {% include components/book-card.html book=book tag_mode="plain" date_mode="iso" %}
      
      {% unless forloop.last %}
        <hr class="book-divider">
      {% endunless %}
    {% endfor %}
  </div>
</div>
