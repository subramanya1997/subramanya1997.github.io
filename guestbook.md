---
layout: page
title: Guestbook
permalink: /guestbook/
includelink: false
---

<div class="guestbook-container">
  <div class="guestbook-header">
    <h1>Guestbook</h1>
    <p>Leave a message to share your thoughts, feedback, or just say hello!</p>
  </div>

  <div class="guestbook-form-container">
    <div id="form-instructions">
      <p>Click the button below to open the guestbook form. After submitting, your message will appear here shortly.</p>
      <button id="open-form-btn" class="primary-btn">Open Guestbook Form</button>
    </div>
  </div>

  <div class="guestbook-entries">
    <h2>Messages</h2>
    <div id="entries-container" class="entries-container">
      <div class="loading-messages">Loading messages...</div>
    </div>
  </div>
</div>

<style>
  .guestbook-container {
    max-width: 800px;
    margin: 0 auto;
  }

  .guestbook-header {
    margin-bottom: 40px;
  }
  
  .guestbook-header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    position: relative;
    padding-bottom: 10px;
  }
  
  .guestbook-header h1:after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 50px;
    height: 4px;
    background: #555555;
    border-radius: 2px;
  }
  
  .guestbook-header p {
    font-size: 18px;
    color: #666666;
    max-width: 600px;
  }

  .guestbook-form-container {
    background: white;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    margin-bottom: 40px;
    border: 1px solid rgba(0,0,0,0.05);
    text-align: center;
  }

  #form-instructions p {
    margin-bottom: 25px;
    font-size: 16px;
    color: #4b5563;
  }

  .primary-btn {
    background: #555555;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .primary-btn:hover {
    background: #333333;
  }

  .primary-btn:disabled {
    background: #999999;
    cursor: not-allowed;
  }
  
  .form-note {
    margin-top: 15px;
    font-size: 14px;
    color: #666666;
  }

  .form-status {
    margin-top: 15px;
    padding: 10px;
    border-radius: 6px;
    display: none;
  }

  .form-status.success {
    background: #e5e5e5;
    color: #333333;
    display: block;
  }

  .form-status.error {
    background: #e5e5e5;
    color: #555555;
    display: block;
  }

  .guestbook-entries h2 {
    font-size: 1.5rem;
    margin-bottom: 20px;
  }

  .entries-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .entry {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
    border: 1px solid rgba(0,0,0,0.05);
  }

  .entry-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .entry-name {
    font-weight: 600;
  }

  .entry-date {
    color: #666666;
    font-size: 14px;
  }

  .entry-message {
    color: #333333;
    line-height: 1.6;
  }

  .loading-messages {
    text-align: center;
    padding: 20px;
    color: #666666;
  }

  .no-messages {
    text-align: center;
    padding: 30px;
    background: #f8f8f8;
    border-radius: 12px;
    color: #666666;
  }

  .thank-you-message {
    display: none;
    background: #e5e5e5;
    color: #333333;
    padding: 15px;
    border-radius: 6px;
    margin-top: 20px;
  }

  .refresh-button {
    background: none;
    border: none;
    color: #555555;
    cursor: pointer;
    font-size: 14px;
    padding: 5px 10px;
    display: flex;
    align-items: center;
    gap: 5px;
    margin: 0 auto 15px;
  }

  .refresh-button:hover {
    text-decoration: underline;
  }

  .refresh-icon {
    width: 16px;
    height: 16px;
  }
</style>

<script>
  // Google Form URL for direct opening
  const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdDc5GD0KtUAb9Xv28PvS42o0DToKutQd1huhlL81ajn3kisQ/viewform';
  
  // Google Sheet ID
  const SHEET_ID = '1dsVrBWPDnjVTc7v8tUw_9eXX2FEDt9jRtHbh6KTznDA';
  
  // Public Google Sheet URL as JSON
  const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
  
  document.addEventListener('DOMContentLoaded', function() {
    // Load entries from Google Sheet
    fetchGuestbookEntries();
    
    // Set up event listener for the form open button
    const openFormBtn = document.getElementById('open-form-btn');
    openFormBtn.addEventListener('click', function() {
      window.open(FORM_URL, '_blank');
    });
    
    // Add refresh button
    const entriesContainer = document.getElementById('entries-container');
    const refreshButton = document.createElement('button');
    refreshButton.className = 'refresh-button';
    refreshButton.innerHTML = `
      <svg class="refresh-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 2v6h-6"></path>
        <path d="M3 12a9 9 0 0 1 15-6.7l3 2.7"></path>
        <path d="M3 22v-6h6"></path>
        <path d="M21 12a9 9 0 0 1-15 6.7l-3-2.7"></path>
      </svg>
      Refresh Messages
    `;
    refreshButton.addEventListener('click', function() {
      entriesContainer.innerHTML = '<div class="loading-messages">Loading messages...</div>';
      fetchGuestbookEntries();
    });
    
    // Insert refresh button before entries container
    const entriesSection = document.querySelector('.guestbook-entries');
    entriesSection.insertBefore(refreshButton, entriesContainer);
  });
  
  // Fetch guestbook entries from Google Sheet
  function fetchGuestbookEntries() {
    const entriesContainer = document.getElementById('entries-container');
    
    fetch(SHEET_URL)
      .then(response => response.text())
      .then(data => {
        // Google's response is not pure JSON, it has some extra text at the beginning
        // We need to extract the JSON part
        const jsonData = JSON.parse(data.substring(data.indexOf('{'), data.lastIndexOf('}') + 1));
        
        // Clear loading message
        entriesContainer.innerHTML = '';
        
        // Extract table data
        const table = jsonData.table;
        
        if (!table || !table.rows || table.rows.length <= 1) {
          // If no entries (excluding header row)
          entriesContainer.innerHTML = '<div class="no-messages">No messages yet. Be the first to sign the guestbook!</div>';
          return;
        }
        
        // Get column indices (the first row contains headers)
        const headers = table.cols.map(col => col.label);
        
        // Find column indices (case-insensitive matching to be more robust)
        let nameIndex = -1, messageIndex = -1, timestampIndex = -1;
        
        headers.forEach((header, index) => {
          const headerLower = header.toLowerCase();
          if (headerLower === 'name') nameIndex = index;
          else if (headerLower === 'message') messageIndex = index;
          else if (headerLower === 'timestamp') timestampIndex = index;
        });
        
        // Fallback to positional indices if headers don't match exactly
        if (nameIndex === -1) nameIndex = 2; // Column C
        if (messageIndex === -1) messageIndex = 4; // Column E
        if (timestampIndex === -1) timestampIndex = 0; // Column A
        
        // Sort entries by timestamp (newest first)
        // Skip the first row (headers)
        const entries = table.rows.slice(1).sort((a, b) => {
          const dateA = new Date(a.c[timestampIndex]?.v || 0);
          const dateB = new Date(b.c[timestampIndex]?.v || 0);
          return dateB - dateA;
        });
        
        // Display entries
        entries.forEach(entry => {
          // Skip entries with empty data
          if (!entry.c || !entry.c[nameIndex]?.v || !entry.c[messageIndex]?.v) return;
          
          const name = entry.c[nameIndex]?.v || 'Anonymous';
          const message = entry.c[messageIndex]?.v || '';
          const timestamp = entry.c[timestampIndex]?.v || '';
          
          if (message) {
            const dateFormatted = new Date(timestamp).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            
            const entryElement = document.createElement('div');
            entryElement.className = 'entry';
            entryElement.innerHTML = `
              <div class="entry-header">
                <div class="entry-name">${escapeHtml(name)}</div>
                <div class="entry-date">${dateFormatted}</div>
              </div>
              <div class="entry-message">${escapeHtml(message)}</div>
            `;
            
            entriesContainer.appendChild(entryElement);
          }
        });
        
        // If no valid entries were found
        if (entriesContainer.children.length === 0) {
          entriesContainer.innerHTML = '<div class="no-messages">No messages yet. Be the first to sign the guestbook!</div>';
        }
      })
      .catch(error => {
        console.error('Error fetching guestbook entries:', error);
        entriesContainer.innerHTML = '<div class="error">Failed to load messages. Please try again later.</div>';
      });
  }
  
  // Helper function to escape HTML to prevent XSS
  function escapeHtml(unsafe) {
    return unsafe
      .toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
</script> 