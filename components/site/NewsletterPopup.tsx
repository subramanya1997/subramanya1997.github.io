// Port of _includes/newsletter-popup.html (rendered at the end of <body>).
import { getSiteConfig } from "@/components/lib/site-data";

const POPUP_SCRIPT = `
(function() {
  var STORAGE_KEY = 'nl_subscribed';
  var SCROLL_THRESHOLD = 0.85;

  if (localStorage.getItem(STORAGE_KEY)) return;
  if (sessionStorage.getItem('nl_popup_closed')) return;

  var overlay = document.getElementById('nl-popup-overlay');
  var closeBtn = document.getElementById('nl-popup-close');
  var form = document.getElementById('nl-popup-form');
  var success = document.getElementById('nl-popup-success');
  if (!overlay) return;

  var shown = false;

  function showPopup() {
    if (shown) return;
    shown = true;
    overlay.classList.add('visible');
    window.removeEventListener('scroll', onScroll);
  }

  function hidePopup() {
    overlay.classList.remove('visible');
    sessionStorage.setItem('nl_popup_closed', 'true');
  }

  function onScroll() {
    var scrolled = window.scrollY + window.innerHeight;
    var total = document.documentElement.scrollHeight;
    if (scrolled / total >= SCROLL_THRESHOLD) showPopup();
  }

  window.addEventListener('scroll', onScroll);

  closeBtn.addEventListener('click', hidePopup);

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) hidePopup();
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && overlay.classList.contains('visible')) hidePopup();
  });

  form.addEventListener('submit', function() {
    var btn = form.querySelector('.nl-popup-btn');
    btn.querySelector('.nl-popup-btn-text').style.display = 'none';
    btn.querySelector('.nl-popup-btn-loading').style.display = 'inline-flex';
    btn.disabled = true;

    setTimeout(function() {
      form.style.display = 'none';
      success.style.display = 'flex';
      localStorage.setItem(STORAGE_KEY, 'true');
      setTimeout(function() { overlay.classList.remove('visible'); }, 2000);
    }, 1500);
  });
})();
`;

const POPUP_STYLE = `
  .nl-popup-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
  }

  .nl-popup-overlay.visible {
    opacity: 1;
    visibility: visible;
  }

  .nl-popup {
    background: var(--bg-primary, #fff);
    border-radius: 16px 16px 0 0;
    padding: 32px 28px 28px;
    max-width: 480px;
    width: 100%;
    position: relative;
    transform: translateY(100%);
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.12);
  }

  .nl-popup-overlay.visible .nl-popup {
    transform: translateY(0);
  }

  .nl-popup-close {
    position: absolute;
    top: 12px;
    right: 12px;
    background: none;
    border: none;
    color: var(--text-tertiary, #999);
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nl-popup-close:hover {
    color: var(--text-primary, #111);
    background: var(--bg-secondary, #f5f5f5);
  }

  .nl-popup-body {
    text-align: center;
  }

  .nl-popup-heading {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary, #111);
    margin: 0 0 8px;
  }

  .nl-popup-tagline {
    font-size: 14px;
    color: var(--text-secondary, #555);
    margin: 0 0 20px;
    line-height: 1.5;
  }

  .nl-popup-input-group {
    display: flex;
    gap: 8px;
  }

  .nl-popup-email {
    flex: 1;
    padding: 12px 14px;
    font-size: 15px;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 10px;
    background: var(--bg-primary, #fff);
    color: var(--text-primary, #111);
    outline: none;
    transition: border-color 0.2s ease;
  }

  .nl-popup-email:focus {
    border-color: var(--accent, #555);
  }

  .nl-popup-email::placeholder {
    color: var(--text-tertiary, #999);
  }

  .nl-popup-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 12px 24px;
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    background: var(--text-primary, #111);
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .nl-popup-btn:hover {
    opacity: 0.85;
    transform: translateY(-1px);
  }

  .nl-popup-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .nl-popup-btn-loading {
    display: inline-flex;
    align-items: center;
    animation: nl-popup-spin 1s linear infinite;
  }

  @keyframes nl-popup-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .nl-popup-privacy {
    font-size: 12px;
    color: var(--text-tertiary, #999);
    margin: 10px 0 0;
  }

  .nl-popup-success {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 16px;
    color: #16a34a;
    font-size: 16px;
    font-weight: 500;
  }

  .nl-popup-success p {
    margin: 0;
  }

  @media screen and (min-width: 481px) {
    .nl-popup {
      border-radius: 16px;
      margin-bottom: 24px;
    }

    .nl-popup-overlay {
      align-items: center;
    }
  }

  @media screen and (max-width: 480px) {
    .nl-popup {
      padding: 28px 20px 24px;
    }

    .nl-popup-input-group {
      flex-direction: column;
    }

    .nl-popup-btn {
      width: 100%;
    }
  }
`;

interface NewsletterConfig {
  enabled?: boolean;
  google_form_action?: string;
  google_form_entry?: string;
  heading?: string;
  tagline?: string;
  button_text?: string;
  success_message?: string;
}

export default function NewsletterPopup() {
  const newsletter = getSiteConfig().newsletter as NewsletterConfig;
  if (!newsletter.enabled) return null;

  return (
    <>
      <div className="nl-popup-overlay" id="nl-popup-overlay">
        <div className="nl-popup" role="dialog" aria-label="Subscribe to newsletter">
          <button className="nl-popup-close" id="nl-popup-close" aria-label="Close">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div className="nl-popup-body">
            <h3 className="nl-popup-heading">{newsletter.heading}</h3>
            <p className="nl-popup-tagline">{newsletter.tagline}</p>
            <form
              className="nl-popup-form"
              id="nl-popup-form"
              action={newsletter.google_form_action}
              method="POST"
              target="nl-popup-iframe"
            >
              <div className="nl-popup-input-group">
                <input
                  type="email"
                  name={newsletter.google_form_entry}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                  className="nl-popup-email"
                  aria-label="Email address"
                />
                <button type="submit" className="nl-popup-btn">
                  <span className="nl-popup-btn-text">{newsletter.button_text}</span>
                  <span className="nl-popup-btn-loading" style={{ display: "none" }}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 2v4m0 12v4m-7.07-15.07l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                    </svg>
                  </span>
                </button>
              </div>
              <p className="nl-popup-privacy">No spam. Unsubscribe anytime.</p>
            </form>
            <div className="nl-popup-success" id="nl-popup-success" style={{ display: "none" }}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <p>{newsletter.success_message}</p>
            </div>
          </div>
        </div>
      </div>
      <iframe name="nl-popup-iframe" style={{ display: "none" }} aria-hidden="true"></iframe>

      <script dangerouslySetInnerHTML={{ __html: POPUP_SCRIPT }} />
      <style dangerouslySetInnerHTML={{ __html: POPUP_STYLE }} />
    </>
  );
}
