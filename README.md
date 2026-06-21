# Söuthsea Swimrun — website

The website for Söuthsea Swimrun (the UK's first swimrun club), live at
**https://southseaswimrun.com**.

It's a static site — plain HTML/CSS with one small JS file. No build step,
no framework, no database.

## Where everything lives / how it goes live

| Thing | Where |
|---|---|
| **Source code** | This GitHub repo (`southseaswimrun/sos`), branch `main`, in `southsea-site/` |
| **Hosting** | Cloudflare Pages — auto-deploys from this repo |
| **Domain + DNS** | Cloudflare (`dash.cloudflare.com`) |
| **Membership / sessions / payments** | Heylo (`heylo.com`) |

**To change the site:** edit a file in `southsea-site/`, commit, and push to
`main`. Cloudflare rebuilds automatically and the change is live in ~1 minute.

## Structure

```
southsea-site/
├── index.html          # Homepage
├── blog.html           # Race reports & blog index
├── posts/              # One HTML file per race report / blog post
├── images/             # All images (self-hosted — no external hot-linking)
├── js/main.js          # Fade-in on scroll + auto-updating copyright year
├── favicon.svg         # Site icon
├── 404.html            # Branded "not found" page
├── robots.txt          # Search-engine directives
├── sitemap.xml         # List of pages for search engines
├── _headers            # Security + caching headers (Cloudflare Pages)
└── _redirects          # Old WordPress URLs -> new pages (Cloudflare Pages)
```

## Notes

- **Security headers** (CSP, HSTS, X-Frame-Options, etc.) live in
  `southsea-site/_headers`. The Content-Security-Policy is strict: no inline
  JS is allowed, so any new script must go in an external `.js` file.
- **Copyright year** updates itself — use `<span data-year>2026</span>` and
  `js/main.js` rewrites it to the current year.
- **Adding a post:** copy an existing file in `posts/`, edit the content, and
  add a card linking to it on `blog.html` (and optionally `index.html`).
  Remember to add it to `sitemap.xml`.
- **Images:** drop files into `images/` and reference them as `/images/<name>`.

## Roadmap

- A simple `/admin` page so non-technical members can write and publish posts
  without touching HTML (planned — Phase 2).
