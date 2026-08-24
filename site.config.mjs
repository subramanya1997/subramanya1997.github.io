// Site configuration — the single source of truth that replaced `_config.yml`.
//
// Plain JS (JSDoc-typed) so both the TypeScript app (`lib/content.ts`) and the
// bare-node build scripts (`scripts/next/**`) can import it without a TS
// toolchain. Only the keys the code actually consumes live here; the Jekyll
// build directives (`markdown`, `kramdown`, `highlighter`, `permalink`,
// `exclude`, `keep_files`, `collections`, `defaults`, `data_dir`) went away
// with the Jekyll toolchain — collection URLs are defined in lib/content.ts and
// scripts/next/lib/jekyll-content.mjs, and the loop stylesheet/script defaults
// are applied by the loop route.

/**
 * @typedef {Object} Language
 * @property {string} code
 * @property {string} name
 * @property {string} native
 */

/**
 * @typedef {Object} NewsletterConfig
 * @property {boolean} enabled
 * @property {string} google_form_action
 * @property {string} google_form_entry
 * @property {string} heading
 * @property {string} tagline
 * @property {string} button_text
 * @property {string} success_message
 */

/**
 * @typedef {Object} SiteConfig
 * @property {string} title
 * @property {string} email
 * @property {string} description
 * @property {string} baseurl
 * @property {string} url
 * @property {string} default_social_image
 * @property {string|number} social_image_version
 * @property {string} default_lang
 * @property {Language[]} languages
 * @property {NewsletterConfig} newsletter
 * @property {string} google_analytics
 */

/** @type {SiteConfig} */
export const site = {
  title: "Subramanya N",
  email: "subramanyanagabhushan@gmail.com",
  description:
    "Welcome to my personal website, a space where I blog and share my musings on academic and professional topics. Dive in to explore my intellectual journey and gain insights from my experiences in various fields!",
  baseurl: "",
  url: "https://subramanya.ai",
  default_social_image: "/assets/images/og/default.png",
  social_image_version: 20260619,

  // Internationalization (i18n)
  default_lang: "en",
  languages: [
    { code: "en", name: "English", native: "English" },
    { code: "es", name: "Spanish", native: "Español" },
    { code: "zh", name: "Chinese", native: "中文" },
    { code: "hi", name: "Hindi", native: "हिन्दी" },
    { code: "pt", name: "Portuguese", native: "Português" },
    { code: "fr", name: "French", native: "Français" },
    { code: "de", name: "German", native: "Deutsch" },
    { code: "ja", name: "Japanese", native: "日本語" },
    { code: "ko", name: "Korean", native: "한국어" },
  ],

  // Newsletter (Google Forms)
  newsletter: {
    enabled: true,
    google_form_action:
      "https://docs.google.com/forms/d/e/1FAIpQLSc4eTHxYn-6z_NzAR-ilXcEHk0v0L-wTkiuLoJmr_ea0-3m1Q/formResponse",
    google_form_entry: "emailAddress",
    heading: "Stay in the loop",
    tagline:
      "Get bi-weekly insights on AI agents, SaaS strategy, and the future of software - straight to your inbox.",
    button_text: "Subscribe",
    success_message: "You're subscribed! Check your inbox soon.",
  },

  // Google Analytics
  google_analytics: "G-04B5H1S8SJ",
};

export default site;
