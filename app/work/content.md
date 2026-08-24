---
layout: page
title: Work
permalink: /work/
includelink: true
custom_layout: true
page_stylesheets:
  - /assets/css/components/work-entry.css
  - /assets/css/pages/work.css
---

<div class="work-container">
  <div class="experience">
    {% for job in site.data.about.experience %}
      {% include components/work-entry.html entry=job entry_type="experience" %}
    {% endfor %}

    {% for edu in site.data.about.education %}
      {% include components/work-entry.html entry=edu entry_type="education" %}
    {% endfor %}
  </div>
</div>

<div class="resume-container">
  <a href="{{ site.data.about.cv_file }}" class="resume-button" target="_blank">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
    Get My Résumé
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  </a>
</div>
