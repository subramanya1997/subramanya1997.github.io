---
layout: page
title: Work
permalink: /work/
includelink: true
custom_layout: true
---

<div class="work-container">
  <div class="experience">
    <!-- Experience Entries -->
    {% for job in site.data.about.experience %}
    <div class="work-entry">
      <div class="company-logo">
        {% if job.logo %}
          <img src="{{ job.logo }}" alt="{{ job.company }} logo">
        {% else %}
          <div class="logo-placeholder">
            {% assign first_letter = job.company | slice: 0 %}
            {{ first_letter }}
          </div>
        {% endif %}
      </div>
      <div class="work-details">
        <div class="company-name">{{ job.company }}</div>
        <div class="position">{{ job.position }}</div>
        <div class="period">{{ job.period }}</div>
        <div class="work-description">
          <p>{{ job.description }}</p>
          <ul>
            {% for achievement in job.achievements %}
              <li>{{ achievement }}</li>
            {% endfor %}
          </ul>
        </div>
      </div>
    </div>
    {% endfor %}

    <!-- Education Entries -->
    {% for edu in site.data.about.education %}
    <div class="work-entry">
      <div class="company-logo">
        {% if edu.logo %}
          <img src="{{ edu.logo }}" alt="{{ edu.institution }} logo">
        {% else %}
          <div class="logo-placeholder">
            {% assign first_letter = edu.institution | slice: 0 %}
            {{ first_letter }}
          </div>
        {% endif %}
      </div>
      <div class="work-details">
        <div class="company-name">{{ edu.institution }}</div>
        <div class="position">{{ edu.degree }}</div>
        <div class="period">{{ edu.period }}</div>
        <div class="work-description">
          <p>{{ edu.description }}</p>
          <ul>
            {% for detail in edu.details %}
              {% for item in detail %}
                <li><strong>{{ item[0] }}:</strong> {{ item[1] }}</li>
              {% endfor %}
            {% endfor %}
          </ul>
        </div>
      </div>
    </div>
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

<style>
  .work-container {
    display: flex;
    margin-top: 20px;
    max-width: 800px;
    margin: 0 auto;
  }
  
  .experience {
    flex: 1;
  }
  
  .work-entry {
    display: flex;
    gap: 20px;
    margin-bottom: 30px;
  }
  
  .company-logo {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .company-logo img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  
  .logo-placeholder {
    width: 100%;
    height: 100%;
    border-radius: 5px;
    background-color: #f5f5f5;
    color: #555555;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: bold;
  }
  
  .work-details {
    flex: 1;
  }
  
  .company-name {
    font-size: 0.95rem;
    font-weight: 600;
    color: #555555;
    margin-bottom: 2px;
  }
  
  .position {
    font-size: 1.2rem;
    font-weight: 600;
    color: #111;
    margin-bottom: 4px;
  }
  
  .period {
    display: inline-block;
    font-size: 12px;
    color: #666666;
    margin-bottom: 10px;
  }
  
  .work-description p {
    margin-bottom: 12px;
    line-height: 1.5;
    font-size: 14px;
  }
  
  .work-description ul {
    margin: 0;
    padding-left: 20px;
  }
  
  .work-description ul li {
    margin-bottom: 6px;
    line-height: 1.4;
    font-size: 14px;
  }
  
  .resume-container {
    margin-top: 30px;
    margin-bottom: 30px;
    display: flex;
    justify-content: center;
  }
  
  .resume-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #555555;
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s ease;
  }
  
  .resume-button:hover {
    color: #333333;
    text-decoration: underline;
  }
  
  .resume-button svg {
    transition: transform 0.2s ease;
  }
  
  .resume-button:hover svg {
    transform: translateX(3px);
  }
  
  @media screen and (max-width: 1024px) {
    .work-container {
      flex-direction: column;
    }
  }
</style> 