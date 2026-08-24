// Port of _includes/newsletter.html. Rendered inside the footer on every
// non-post page; _layouts/post.html renders it itself, so it is exported for
// the posts workstream too.
import { getSiteConfig } from "@/components/lib/site-data";

const NEWSLETTER_SCRIPT = `
(function() {
  document.querySelectorAll('.js-newsletter-form').forEach(function(form) {
    if (form.dataset.bound) return;
    form.dataset.bound = 'true';

    form.addEventListener('submit', function() {
      var btn = form.querySelector('.newsletter-btn');
      var btnText = btn.querySelector('.btn-text');
      var btnLoading = btn.querySelector('.btn-loading');
      var success = form.parentNode.querySelector('.newsletter-success');

      btnText.style.display = 'none';
      btnLoading.style.display = 'inline-flex';
      btn.disabled = true;

      setTimeout(function() {
        form.style.display = 'none';
        success.style.display = 'flex';
      }, 1500);
    });
  });
})();
`;

const NEWSLETTER_STYLE = `
  .newsletter-section {
    border-top: 1px solid var(--border-color, rgba(0,0,0,0.08));
    padding: 40px 0 10px;
    margin-top: 40px;
  }

  .newsletter-inner {
    max-width: 520px;
    margin: 0 auto;
    text-align: center;
  }

  .newsletter-heading {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary, #111);
    margin: 0 0 8px;
  }

  .newsletter-tagline {
    font-size: 14px;
    color: var(--text-secondary, #555);
    margin: 0 0 20px;
    line-height: 1.5;
  }

  .newsletter-input-group {
    display: flex;
    gap: 8px;
    max-width: 440px;
    margin: 0 auto;
  }

  .newsletter-email {
    flex: 1;
    padding: 10px 14px;
    font-size: 14px;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 8px;
    background: var(--bg-primary, #fff);
    color: var(--text-primary, #111);
    outline: none;
    transition: border-color 0.2s ease;
  }

  .newsletter-email:focus {
    border-color: var(--accent, #555);
  }

  .newsletter-email::placeholder {
    color: var(--text-tertiary, #999);
  }

  .newsletter-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    background: var(--text-primary, #111);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .newsletter-btn:hover {
    opacity: 0.85;
    transform: translateY(-1px);
  }

  .newsletter-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .btn-loading {
    display: inline-flex;
    align-items: center;
    animation: nl-spin 1s linear infinite;
  }

  @keyframes nl-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .newsletter-privacy {
    font-size: 12px;
    color: var(--text-tertiary, #999);
    margin: 10px 0 0;
  }

  .newsletter-success {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 16px;
    background: var(--bg-secondary, #f9f9f9);
    border-radius: 8px;
    color: #16a34a;
    font-size: 15px;
    font-weight: 500;
  }

  .newsletter-success p {
    margin: 0;
  }

  @media screen and (max-width: 480px) {
    .newsletter-input-group {
      flex-direction: column;
    }

    .newsletter-btn {
      width: 100%;
      justify-content: center;
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

export default function Newsletter() {
  const newsletter = getSiteConfig().newsletter as NewsletterConfig;
  return (
    <>
      {newsletter.enabled ? (
        <>
          <div className="newsletter-section">
            <div className="newsletter-inner">
              <div className="newsletter-text">
                <h3 className="newsletter-heading">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  {newsletter.heading}
                </h3>
                <p className="newsletter-tagline">{newsletter.tagline}</p>
              </div>
              <form
                className="js-newsletter-form"
                action={newsletter.google_form_action}
                method="POST"
                target="newsletter-iframe"
              >
                <div className="newsletter-input-group">
                  <input
                    type="email"
                    name={newsletter.google_form_entry}
                    placeholder="your@email.com"
                    required
                    autoComplete="email"
                    className="newsletter-email"
                    aria-label="Email address"
                  />
                  <button type="submit" className="newsletter-btn">
                    <span className="btn-text">{newsletter.button_text}</span>
                    <span className="btn-loading" style={{ display: "none" }}>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M12 2v4m0 12v4m-7.07-15.07l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                      </svg>
                    </span>
                  </button>
                </div>
                <p className="newsletter-privacy">No spam. Unsubscribe anytime.</p>
              </form>
              <div className="newsletter-success" style={{ display: "none" }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <p>{newsletter.success_message}</p>
              </div>
            </div>
          </div>
          <iframe name="newsletter-iframe" style={{ display: "none" }} aria-hidden="true"></iframe>
        </>
      ) : null}

      <script dangerouslySetInnerHTML={{ __html: NEWSLETTER_SCRIPT }} />
      <style dangerouslySetInnerHTML={{ __html: NEWSLETTER_STYLE }} />
    </>
  );
}
