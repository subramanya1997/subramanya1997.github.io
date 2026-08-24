// Port of _includes/translation-toast.html.
import { includeScript, includeStyle } from "@/components/lib/includes";

export default function TranslationToast() {
  return (
    <>
      <div
        className="translation-toast"
        id="translationToast"
        role="alert"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="toast-content">
          <div className="toast-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
          </div>
          <div className="toast-text">
            <span className="toast-message" id="toastMessage">
              This page has been automatically translated.
            </span>
            <a href="#" className="toast-link" id="toastOriginalLink">
              View original in English
            </a>
          </div>
          <button
            className="toast-dismiss"
            id="toastDismiss"
            type="button"
            aria-label="Dismiss notification"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="toast-progress" id="toastProgress"></div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: includeStyle("translation-toast.html") }} />
      <script dangerouslySetInnerHTML={{ __html: includeScript("translation-toast.html") }} />
    </>
  );
}
