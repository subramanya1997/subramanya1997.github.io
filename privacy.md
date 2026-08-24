---
layout: page
title: Privacy Policy
description: Privacy policy for subramanya.ai - what data is collected (Google Analytics, newsletter, comments), why, and your choices.
permalink: /privacy/
includelink: false
---

_Last updated: August 23, 2026_

subramanya.ai is the personal website of Subramanya N. It is a static site
hosted on GitHub Pages. It has no user accounts, no login, and sells nothing.
This page explains the small amount of data the site does touch, and what your
choices are.

## What is collected

- **Server logs.** The site is served by GitHub Pages (with the Fastly CDN).
  GitHub may log standard request metadata such as IP address, user agent, and
  requested URL to operate the service. That logging is governed by the
  [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).
  I do not have access to raw server logs.
- **Analytics.** The site uses Google Analytics 4 to understand which posts
  people read and roughly how long they stay. This involves cookies and IP-based
  processing by Google, governed by the
  [Google Privacy Policy](https://policies.google.com/privacy). Aggregate view
  counts (never individual data) are published back onto the site, for example
  on the [stats page](/stats/). If you block analytics with a browser extension
  or your browser's tracking protection, everything on the site still works.
- **Newsletter.** The subscribe form submits your email address to a Google
  Form I control. It is used only to send occasional posts, and never shared or
  sold. To unsubscribe, use the link in any email or write to
  [{{ site.email }}](mailto:{{ site.email }}) and I will delete your address.
- **Comments.** Post comments are powered by [Utterances](https://utteranc.es/),
  which stores comments as GitHub issues. Commenting requires signing in to
  GitHub and is subject to GitHub's privacy statement; I never see your GitHub
  credentials.

## What is not collected

No data is sold or shared with advertisers. There is no ad network, no
fingerprinting script, no cross-site tracking pixel, and no collection of
payment or government-ID information - the site has nothing to charge you for.

## Automated and agent access

Automated agents may read the site anonymously; no personal data is required
to use any endpoint listed in [/openapi.json](/openapi.json) or
[/llms.txt](/llms.txt). Crawler and AI-usage preferences are declared in
[/robots.txt](/robots.txt).

## Questions

Email [{{ site.email }}](mailto:{{ site.email }}) with any privacy question or
deletion request, or see the [contact page](/contact/).
