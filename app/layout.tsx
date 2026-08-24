// Root layout: <html>/<body> from _layouts/default.html plus the site-wide
// half of _includes/head.html. Per-page head tags live in
// components/site/PageHead.tsx.
//
// NOTE: app/globals.css (Tailwind + shadcn) is deliberately NOT imported here.
// The ported pages are styled by the legacy stylesheets in public/css and
// public/assets/css, and Tailwind's preflight would reset them. See
// components/PARITY-NOTES.md.
import type { Viewport } from "next";
import { getSiteConfig } from "@/components/lib/site-data";

const FONT_AWESOME =
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.0/css/all.min.css";

// _includes/head.html — sets <html lang> from ?lang= before paint.
const LANG_SCRIPT = `
      (function() {
        const lang = new URLSearchParams(window.location.search).get('lang');
        document.documentElement.setAttribute('lang', lang || 'en');
      })();
    `;

// Applies the stored colour-scheme preference before anything paints, so there
// is no flash of the wrong theme. With no stored preference the root attribute
// stays unset and css/main.css falls through to prefers-color-scheme.
const THEME_SCRIPT = `
      (function() {
        try {
          var stored = localStorage.getItem('theme');
          if (stored === 'dark' || stored === 'light') {
            document.documentElement.setAttribute('data-theme', stored);
          }
        } catch (e) {}
      })();
    `;

// Replaces the inline onload="this.media='all'" attribute on the Font Awesome
// <link>, which JSX cannot express. Same non-blocking behavior.
const FONT_AWESOME_SWAP = `
      (function() {
        var fa = document.getElementById('font-awesome-css');
        if (!fa) return;
        if (fa.sheet) { fa.media = 'all'; return; }
        fa.addEventListener('load', function() { this.media = 'all'; });
      })();
    `;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1114" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const site = getSiteConfig();
  const languages = site.languages.map((language) => language.code).join(",");

  return (
    <html
      lang={site.default_lang}
      data-default-lang={site.default_lang}
      data-supported-languages={languages}
      data-baseurl=""
    >
      <body>
        {/* Colour scheme — must run before any content paints. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />

        {/* Favicons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/assets/favicon/apple-touch-icon.png" />
        <link
          rel="icon"
          type="image/png"
          sizes="512x512"
          href="/assets/favicon/android-chrome-512x512.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/assets/favicon/android-chrome-192x192.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="128x128"
          href="/assets/favicon/favicon-128x128.png"
        />
        <link rel="icon" type="image/png" sizes="64x64" href="/assets/favicon/favicon-64x64.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon/favicon-16x16.png" />
        <link rel="icon" type="image/svg+xml" href="/assets/favicon/favicon.svg" />
        <link rel="shortcut icon" href="/assets/favicon/favicon.ico" />
        <link rel="manifest" href="/assets/favicon/site.webmanifest" />
        <meta name="msapplication-TileColor" content="#555555" />
        <meta name="msapplication-TileImage" content="/assets/favicon/mstile-144x144.png" />

        {/* Fonts - Preconnect for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
          precedence="font"
        />

        {/* Custom CSS */}
        <link rel="stylesheet" href="/css/main.css" precedence="site" />

        {/* RSS Feed */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title="RSS Feed"
          href={`${site.url}/feed.xml`}
        />

        {/*
          Agent discovery (RFC 8288 Web Linking + RFC 9727 api-catalog).
          GitHub Pages cannot emit HTTP Link response headers, so we publish the
          equivalent <link> elements here.
        */}
        <link
          rel="api-catalog"
          type="application/linkset+json"
          href={`${site.url}/.well-known/api-catalog`}
          title="Agent resource catalog (RFC 9727)"
        />
        <link
          rel="service-desc"
          type="application/json"
          href={`${site.url}/openapi.json`}
          title="OpenAPI 3.1 specification of the read-only content API"
        />
        <link
          rel="describedby"
          type="text/plain"
          href={`${site.url}/llms.txt`}
          title="Machine-readable site summary (llms.txt)"
        />
        <link
          rel="describedby"
          type="text/plain"
          href={`${site.url}/llms-full.txt`}
          title="Full site content for LLM ingestion (llms-full.txt)"
        />
        <link
          rel="service-doc"
          type="text/html"
          href={`${site.url}/docs/`}
          title="Architecture and developer documentation"
        />
        <link rel="sitemap" type="application/xml" href={`${site.url}/sitemap.xml`} />
        <link rel="search" type="text/html" href={`${site.url}/search/`} title="Site search" />
        <link rel="author" type="text/html" href={`${site.url}/work/`} title={site.title} />

        <script dangerouslySetInnerHTML={{ __html: LANG_SCRIPT }} />

        {/* Font Awesome - loaded with media="print", swapped to all once ready */}
        <link
          rel="stylesheet"
          href={FONT_AWESOME}
          media="print"
          id="font-awesome-css"
          precedence="font-awesome"
        />
        <script dangerouslySetInnerHTML={{ __html: FONT_AWESOME_SWAP }} />
        <noscript>
          <link rel="stylesheet" href={FONT_AWESOME} />
        </noscript>

        {children}
      </body>
    </html>
  );
}
