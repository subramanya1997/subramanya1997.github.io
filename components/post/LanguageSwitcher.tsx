// Port of _includes/language-switcher.html. Only the languages that actually
// have a translation JSON for this post are listed (the Liquid walked
// `site.static_files`; see components/lib/post-extras#availableLanguages).
import { includeScript, includeStyle } from "@/components/lib/includes";
import { getSiteConfig } from "@/components/lib/site-data";
import { availableLanguages } from "@/components/lib/post-extras";

export default function LanguageSwitcher({ slug }: { slug: string }) {
  const defaultLang = getSiteConfig().default_lang;
  const languages = availableLanguages(slug);

  return (
    <>
      <div
        className="language-switcher"
        id="languageSwitcher"
        role="navigation"
        aria-label="Language selection"
      >
        <button
          className="language-switcher-toggle"
          id="languageSwitcherToggle"
          type="button"
          aria-haspopup="listbox"
          aria-expanded="false"
          aria-label="Select language"
        >
          <span className="current-lang" id="currentLangLabel">
            English
          </span>
          <svg
            className="dropdown-arrow"
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        <ul
          className="language-dropdown"
          id="languageDropdown"
          role="listbox"
          aria-label="Available languages"
        >
          {languages.map((language) => {
            const isDefault = language.code === defaultLang;
            return (
              <li
                key={language.code}
                className={`language-option${isDefault ? " active" : ""}`}
                role="option"
                data-lang={language.code}
                aria-selected={isDefault ? "true" : "false"}
                tabIndex={0}
              >
                <span className="lang-native">{language.native}</span>
                <svg
                  className="check-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </li>
            );
          })}
        </ul>
      </div>

      <style dangerouslySetInnerHTML={{ __html: includeStyle("language-switcher.html") }} />
      <script dangerouslySetInnerHTML={{ __html: includeScript("language-switcher.html") }} />
    </>
  );
}
