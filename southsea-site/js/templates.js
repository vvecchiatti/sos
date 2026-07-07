/* Söuthsea Swimrun — shared HTML generators.
   Used by the /admin publishing tool (browser) and by local node scripts.
   The manifest is posts/posts.json: { reports: [...], articles: [...] }.
   Every generated page is fully static — no client-side rendering. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.SOS_TEMPLATES = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SITE = 'https://southseaswimrun.com';
  var HEYLO = 'https://heylo.com/invite/5VCbcSYC';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* Plain text -> article HTML.
     Rules: blank line separates paragraphs; a line starting with "## " becomes
     an <h2>, "### " an <h3>; a line of only "---" a divider; everything else
     is escaped text. Keeps writing simple for non-technical members. */
  function bodyTextToHtml(text) {
    var blocks = String(text || '').replace(/\r\n/g, '\n').split(/\n{2,}/);
    var out = [];
    blocks.forEach(function (b) {
      b = b.trim();
      if (!b) return;
      if (b.indexOf('### ') === 0) { out.push('<h3>' + esc(b.slice(4)) + '</h3>'); return; }
      if (b.indexOf('## ') === 0) { out.push('<h2>' + esc(b.slice(3)) + '</h2>'); return; }
      if (b === '---') { out.push('<hr>'); return; }
      out.push('<p>' + esc(b).replace(/\n/g, '<br>') + '</p>');
    });
    return out.join('\n\n');
  }

  function postLabel(p) { return p.year ? esc(p.tag) + ' ' + esc(p.year) : esc(p.tag); }

  function postCard(p) {
    return [
      '    <a href="posts/' + esc(p.slug) + '.html" class="post-card">',
      '      <div class="post-card-img"><img src="' + esc(p.cover) + '" alt="' + esc(p.title) + '" loading="lazy"></div>',
      '      <div class="post-card-body">',
      '        <div class="post-year">' + postLabel(p) + '</div>',
      '        <h3 class="post-title">' + esc(p.title) + '</h3>',
      '        <p class="post-excerpt">' + esc(p.excerpt) + '</p>',
      '        <span class="post-link">Read more</span>',
      '      </div>',
      '    </a>'
    ].join('\n');
  }

  /* ---------------- blog.html ---------------- */
  function renderBlogHtml(manifest) {
    var reports = manifest.reports || [];
    var articles = manifest.articles || [];
    var featured = reports[0];
    var rest = reports.slice(1);

    var sections = '';
    if (featured) {
      sections += [
        '  <a href="posts/' + esc(featured.slug) + '.html" class="featured-post">',
        '    <div class="featured-img">',
        '      <img src="' + esc(featured.cover) + '" alt="' + esc(featured.title) + '" loading="lazy">',
        '    </div>',
        '    <div class="featured-body">',
        '      <span class="post-tag">Latest ' + esc(featured.year) + '</span>',
        '      <h2 class="featured-title">' + esc(featured.title) + '</h2>',
        '      <p class="featured-excerpt">' + esc(featured.excerpt) + '</p>',
        '      <span class="read-more">Read the full report</span>',
        '    </div>',
        '  </a>',
        ''
      ].join('\n');
    }

    // Group the remaining reports by year, preserving manifest order.
    var i = 0;
    while (i < rest.length) {
      var year = rest[i].year;
      var group = [];
      while (i < rest.length && rest[i].year === year) { group.push(rest[i]); i++; }
      sections += '\n  <div class="section-divider"><span>' + esc(year) + '</span></div>\n  <div class="posts-grid">\n' +
        group.map(postCard).join('\n') + '\n  </div>\n';
    }

    if (articles.length) {
      sections += '\n  <div class="section-divider"><span>Swimrun Blog</span></div>\n  <div class="posts-grid">\n' +
        articles.map(postCard).join('\n') + '\n  </div>\n';
    }

    var ogImage = featured ? SITE + featured.cover : SITE + '/images/sos-home-about.jpg';

    return ['<!DOCTYPE html>',
'<html lang="en">',
'<head>',
'<meta charset="UTF-8">',
'<meta name="viewport" content="width=device-width, initial-scale=1.0">',
'<title>Race Reports &amp; Blog — Söuthsea Swimrun</title>',
'<meta name="description" content="Race reports and stories from Söuthsea Swimrun members — from first-timers to seasoned swimrunners. Real experiences from the water and the trail.">',
'<link rel="canonical" href="' + SITE + '/blog.html">',
'<meta name="theme-color" content="#080808">',
'<meta name="color-scheme" content="light dark">',
'<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
'<link rel="apple-touch-icon" href="/favicon.svg">',
'<meta property="og:type" content="website">',
'<meta property="og:site_name" content="Söuthsea Swimrun">',
'<meta property="og:locale" content="en_GB">',
'<meta property="og:title" content="Race Reports & Blog — Söuthsea Swimrun">',
'<meta property="og:description" content="Race reports and stories from Söuthsea Swimrun members — from first-timers to seasoned swimrunners. Real experiences from the water and the trail.">',
'<meta property="og:url" content="' + SITE + '/blog.html">',
'<meta property="og:image" content="' + esc(ogImage) + '">',
'<meta name="twitter:card" content="summary_large_image">',
'<meta name="twitter:title" content="Race Reports & Blog — Söuthsea Swimrun">',
'<meta name="twitter:description" content="Race reports and stories from Söuthsea Swimrun members — from first-timers to seasoned swimrunners. Real experiences from the water and the trail.">',
'<meta name="twitter:image" content="' + esc(ogImage) + '">',
'<link rel="preconnect" href="https://fonts.googleapis.com">',
'<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap" rel="stylesheet">',
'<style>',
":root{--black:#080808;--white:#ffffff;--accent:#00D44A;--accent-light:#00eb52;--sand:#f0f0f0;--sand-dark:#d0d0d0;--text-muted:#555555;--radius:4px;--font-display:'Bebas Neue',sans-serif;--font-body:'DM Sans',sans-serif;}",
'*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}',
'html{scroll-behavior:smooth;}',
'body{font-family:var(--font-body);background:var(--white);color:var(--black);overflow-x:hidden;font-size:16px;line-height:1.7;}',
'nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;justify-content:space-between;align-items:center;padding:1rem 2.5rem;background:rgba(10,10,10,0.93);backdrop-filter:blur(8px);border-bottom:1px solid rgba(255,255,255,0.07);}',
'.nav-logo{font-family:var(--font-display);font-size:1.4rem;color:var(--white);letter-spacing:0.08em;text-decoration:none;}',
'.nav-logo span{color:var(--accent);}',
'.nav-links{display:flex;gap:2rem;list-style:none;align-items:center;}',
'.nav-links a{font-size:0.8rem;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:rgba(245,242,235,0.7);text-decoration:none;transition:color 0.2s;}',
'.nav-links a:hover{color:var(--white);}',
'.nav-cta{background:var(--accent)!important;color:var(--black)!important;padding:0.4rem 1rem;border-radius:var(--radius);}',
'.page-hero{padding:8rem 2.5rem 4rem;background:var(--black);border-bottom:2px solid var(--accent);}',
'.page-hero-inner{max-width:1100px;margin:0 auto;}',
'.page-hero-label{font-size:0.7rem;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;color:var(--accent);display:block;margin-bottom:0.75rem;}',
'.page-hero-title{font-family:var(--font-display);font-size:clamp(3rem,7vw,5.5rem);color:var(--white);line-height:1;letter-spacing:0.03em;margin-bottom:1rem;}',
'.page-hero-desc{font-size:0.95rem;color:rgba(255,255,255,0.5);font-weight:300;max-width:480px;}',
'.blog-main{max-width:1100px;margin:0 auto;padding:4rem 2.5rem 6rem;}',
'.featured-post{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--sand-dark);margin-bottom:3rem;text-decoration:none;color:inherit;transition:border-color 0.2s;}',
'.featured-post:hover{border-color:var(--accent);}',
'.featured-img{aspect-ratio:4/3;overflow:hidden;background:var(--sand);}',
'.featured-img img{width:100%;height:100%;object-fit:cover;transition:transform 0.4s;}',
'.featured-post:hover .featured-img img{transform:scale(1.03);}',
'.featured-body{padding:2.5rem;display:flex;flex-direction:column;justify-content:center;background:var(--white);}',
'.post-tag{display:inline-block;font-size:0.65rem;font-weight:500;letter-spacing:0.15em;text-transform:uppercase;color:var(--accent);border:1px solid var(--accent);padding:0.2rem 0.6rem;border-radius:var(--radius);margin-bottom:1rem;width:fit-content;}',
'.featured-title{font-family:var(--font-display);font-size:2rem;line-height:1.05;letter-spacing:0.02em;color:var(--black);margin-bottom:1rem;}',
'.featured-excerpt{font-size:0.9rem;color:var(--text-muted);line-height:1.75;font-weight:300;margin-bottom:1.5rem;}',
'.read-more{display:inline-flex;align-items:center;gap:0.4rem;font-size:0.8rem;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:var(--black);border-bottom:1px solid var(--black);padding-bottom:2px;transition:color 0.2s,border-color 0.2s;text-decoration:none;}',
'.featured-post:hover .read-more{color:var(--accent);border-color:var(--accent);}',
'.posts-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.5rem;}',
'.post-card{border:1px solid var(--sand-dark);text-decoration:none;color:inherit;display:flex;flex-direction:column;transition:border-color 0.2s;}',
'.post-card:hover{border-color:var(--accent);}',
'.post-card-img{aspect-ratio:16/9;background:var(--sand);overflow:hidden;}',
'.post-card-img img{width:100%;height:100%;object-fit:cover;transition:transform 0.4s;}',
'.post-card:hover .post-card-img img{transform:scale(1.04);}',
'.post-card-body{padding:1.5rem;flex:1;display:flex;flex-direction:column;}',
'.post-year{font-size:0.65rem;font-weight:500;letter-spacing:0.15em;text-transform:uppercase;color:var(--text-muted);margin-bottom:0.5rem;}',
'.post-title{font-family:var(--font-display);font-size:1.3rem;line-height:1.1;letter-spacing:0.02em;color:var(--black);margin-bottom:0.75rem;flex:1;}',
'.post-excerpt{font-size:0.82rem;color:var(--text-muted);line-height:1.7;font-weight:300;margin-bottom:1.2rem;}',
'.post-link{font-size:0.75rem;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:var(--accent);display:inline-flex;align-items:center;gap:0.3rem;text-decoration:none;}',
'.section-divider{display:flex;align-items:center;gap:1rem;margin:3rem 0 2rem;}',
'.section-divider span{font-size:0.7rem;font-weight:500;letter-spacing:0.15em;text-transform:uppercase;color:var(--text-muted);white-space:nowrap;}',
".section-divider::before,.section-divider::after{content:'';flex:1;height:1px;background:var(--sand-dark);}",
'footer{background:var(--black);padding:2.5rem 2.5rem 2rem;border-top:1px solid rgba(255,255,255,0.07);}',
'.footer-bottom{max-width:1100px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;}',
'.footer-copy{font-size:0.78rem;color:rgba(245,242,235,0.25);font-weight:300;}',
'.footer-links-row{display:flex;gap:1.5rem;}',
'.footer-links-row a{font-size:0.75rem;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:rgba(245,242,235,0.4);text-decoration:none;transition:color 0.2s;}',
'.footer-links-row a:hover{color:var(--white);}',
'.footer-links-row a.green{color:var(--accent);}',
'@media(max-width:768px){nav{padding:1rem 1.5rem;}.page-hero{padding:7rem 1.5rem 3rem;}.blog-main{padding:3rem 1.5rem 5rem;}.featured-post{grid-template-columns:1fr;}.featured-img{aspect-ratio:16/9;}footer{padding:2rem 1.5rem;}.nav-links li:not(:last-child){display:none;}}',
'</style>',
'</head>',
'<body>',
'',
'<nav>',
'  <a href="index.html" class="nav-logo">SÖS<span>.</span></a>',
'  <ul class="nav-links">',
'    <li><a href="index.html">&#8592; Back to site</a></li>',
'    <li><a href="' + HEYLO + '" target="_blank" rel="noopener" class="nav-cta">Join Us</a></li>',
'  </ul>',
'</nav>',
'',
'<div class="page-hero">',
'  <div class="page-hero-inner">',
'    <span class="page-hero-label">Stories from the water &amp; trail</span>',
'    <h1 class="page-hero-title">Race Reports<br>&amp; Blog</h1>',
'    <p class="page-hero-desc">Written by SÖS members — from first-timers to seasoned swimrunners. Real experiences, real adventures.</p>',
'  </div>',
'</div>',
'',
'<main class="blog-main">',
'',
sections,
'</main>',
'',
'<footer>',
'  <div class="footer-bottom">',
'    <p class="footer-copy">© Söuthsea Swimrun <span data-year>2026</span>. All rights reserved.</p>',
'    <div class="footer-links-row">',
'      <a href="index.html">Back to site</a>',
'      <a href="https://www.instagram.com/southsea.swimrun" target="_blank" rel="noopener">Instagram</a>',
'      <a href="' + HEYLO + '" target="_blank" rel="noopener" class="green">Join on Heylo</a>',
'    </div>',
'  </div>',
'</footer>',
'',
'<script src="/js/main.js"></script>',
'</body>',
'</html>'].join('\n');
  }

  /* ---------------- individual post page ----------------
     Used for posts created through /admin (format "text"): body is plain text,
     photos live in a navigable gallery grid after the text. */
  function renderPostHtml(post) {
    var url = SITE + '/posts/' + post.slug + '.html';
    var ogImage = SITE + (post.cover || '/images/sos-home-about.jpg');
    var label = post.year ? esc(post.tag) + ' · ' + esc(post.year) : esc(post.tag);
    var bodyHtml = post.format === 'text' ? bodyTextToHtml(post.body) : (post.body || '');
    var byline = post.author ? '\n<p class="post-byline">By ' + esc(post.author) + '.</p>' : '';

    var gallery = '';
    if (post.gallery && post.gallery.length) {
      gallery = '\n<h2>Photos</h2>\n<div class="post-gallery">\n' + post.gallery.map(function (src, idx) {
        return '  <button class="post-gallery-item" type="button" aria-label="Open photo ' + (idx + 1) + '">' +
               '<img src="' + esc(src) + '" alt="' + esc(post.title) + ' — photo ' + (idx + 1) + '" loading="lazy"></button>';
      }).join('\n') + '\n</div>\n';
    }

    return ['<!DOCTYPE html>',
'<html lang="en">',
'<head>',
'<meta charset="UTF-8">',
'<meta name="viewport" content="width=device-width, initial-scale=1.0">',
'<title>' + esc(post.title) + ' — Söuthsea Swimrun</title>',
'<meta name="description" content="' + esc(post.excerpt) + '">',
'<link rel="canonical" href="' + esc(url) + '">',
'<meta name="theme-color" content="#080808">',
'<meta name="color-scheme" content="light dark">',
'<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
'<link rel="apple-touch-icon" href="/favicon.svg">',
'<meta property="og:type" content="article">',
'<meta property="og:site_name" content="Söuthsea Swimrun">',
'<meta property="og:locale" content="en_GB">',
'<meta property="og:title" content="' + esc(post.title) + ' — Söuthsea Swimrun">',
'<meta property="og:description" content="' + esc(post.excerpt) + '">',
'<meta property="og:url" content="' + esc(url) + '">',
'<meta property="og:image" content="' + esc(ogImage) + '">',
'<meta name="twitter:card" content="summary_large_image">',
'<meta name="twitter:title" content="' + esc(post.title) + ' — Söuthsea Swimrun">',
'<meta name="twitter:description" content="' + esc(post.excerpt) + '">',
'<meta name="twitter:image" content="' + esc(ogImage) + '">',
'<link rel="preconnect" href="https://fonts.googleapis.com">',
'<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap" rel="stylesheet">',
'<style>',
":root{--black:#080808;--white:#ffffff;--accent:#00D44A;--accent-light:#00eb52;--accent-pale:#e6fff0;--sand:#f0f0f0;--sand-dark:#d0d0d0;--text-muted:#555555;--radius:4px;--font-display:'Bebas Neue',sans-serif;--font-body:'DM Sans',sans-serif;}",
'*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}',
'html{scroll-behavior:smooth;}',
'body{font-family:var(--font-body);background:var(--white);color:var(--black);overflow-x:hidden;font-size:16px;line-height:1.7;}',
'nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;justify-content:space-between;align-items:center;padding:1rem 2.5rem;background:rgba(10,10,10,0.93);backdrop-filter:blur(8px);border-bottom:1px solid rgba(255,255,255,0.07);}',
'.nav-logo{font-family:var(--font-display);font-size:1.4rem;color:var(--white);letter-spacing:0.08em;text-decoration:none;}',
'.nav-logo span{color:var(--accent);}',
'.nav-links{display:flex;gap:2rem;list-style:none;align-items:center;}',
'.nav-links a{font-size:0.8rem;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:rgba(245,242,235,0.7);text-decoration:none;transition:color 0.2s;}',
'.nav-links a:hover{color:var(--white);}',
'.nav-cta{background:var(--accent)!important;color:var(--black)!important;padding:0.4rem 1rem;border-radius:var(--radius);}',
'.hero{min-height:50vh;background:var(--black);display:flex;flex-direction:column;justify-content:flex-end;padding:6rem 2.5rem 3.5rem;position:relative;overflow:hidden;}',
'.hero-bg{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0.35;}',
'.hero-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(8,8,8,1) 0%,rgba(8,8,8,0.5) 50%,rgba(8,8,8,0.15) 100%);}',
'.hero-inner{position:relative;max-width:860px;}',
'.hero-tag{display:inline-block;font-size:0.65rem;font-weight:500;letter-spacing:0.15em;text-transform:uppercase;color:var(--accent);border:1px solid var(--accent);padding:0.2rem 0.7rem;border-radius:var(--radius);margin-bottom:1rem;}',
'.hero-title{font-family:var(--font-display);font-size:clamp(2.5rem,6vw,4.5rem);color:var(--white);line-height:1;letter-spacing:0.02em;margin-bottom:0.75rem;}',
'.hero-year{font-size:0.8rem;color:rgba(255,255,255,0.35);font-weight:300;letter-spacing:0.1em;}',
'article{max-width:760px;margin:0 auto;padding:4rem 2rem 6rem;}',
'article p{color:#333;font-size:1rem;line-height:1.85;margin-bottom:1.4rem;font-weight:300;}',
'article h2,article h3,article h4{font-family:var(--font-display);letter-spacing:0.02em;margin:2.5rem 0 1rem;color:var(--black);}',
'article h2{font-size:2rem;}',
'article h3{font-size:1.6rem;}',
'article h4{font-size:1.3rem;}',
'article img{width:100%;height:auto;border-radius:2px;margin:1.5rem 0;display:block;}',
'article ul,article ol{padding-left:1.5rem;margin-bottom:1.4rem;}',
'article li{color:#333;font-size:1rem;line-height:1.8;font-weight:300;margin-bottom:0.3rem;}',
'article a{color:var(--accent);text-decoration:underline;text-underline-offset:3px;}',
'article a:hover{color:var(--accent-light);}',
'article em{font-style:italic;}',
'article strong{font-weight:500;}',
'article hr{border:none;border-top:1px solid var(--sand-dark);margin:2.5rem 0;}',
'article blockquote{border-left:3px solid var(--accent);padding:0.5rem 1.5rem;margin:1.5rem 0;color:var(--text-muted);font-style:italic;}',
'.post-byline{color:var(--text-muted);font-style:italic;}',
'.post-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:0.75rem;margin:1.5rem 0;}',
'.post-gallery-item{border:none;padding:0;background:var(--sand);cursor:zoom-in;aspect-ratio:4/3;overflow:hidden;border-radius:2px;}',
'.post-gallery-item img{width:100%;height:100%;object-fit:cover;margin:0;transition:transform 0.3s;}',
'.post-gallery-item:hover img{transform:scale(1.04);}',
'.img-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:0.75rem;margin:1.5rem 0;}',
'.img-gallery img{margin:0;}',
'.post-nav{border-top:1px solid var(--sand-dark);margin-top:3rem;padding-top:2rem;display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;}',
'.post-nav a{font-size:0.78rem;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:var(--black);text-decoration:none;border-bottom:1px solid var(--black);padding-bottom:2px;transition:color 0.2s;}',
'.post-nav a:hover{color:var(--accent);border-color:var(--accent);}',
'.post-nav a.back{color:var(--text-muted);border-color:var(--sand-dark);}',
'footer{background:var(--black);padding:2rem 2.5rem;border-top:1px solid rgba(255,255,255,0.07);}',
'.footer-inner{max-width:860px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;}',
'.footer-copy{font-size:0.78rem;color:rgba(245,242,235,0.25);font-weight:300;}',
'.footer-links{display:flex;gap:1.5rem;}',
'.footer-links a{font-size:0.75rem;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:rgba(245,242,235,0.4);text-decoration:none;transition:color 0.2s;}',
'.footer-links a:hover{color:var(--white);}',
'.footer-links a.green{color:var(--accent);}',
'@media(max-width:768px){nav{padding:1rem 1.5rem;}.hero{padding:6rem 1.5rem 2.5rem;}article{padding:3rem 1.5rem 5rem;}footer{padding:1.5rem;}.nav-links li:not(:last-child){display:none;}}',
'</style>',
'</head>',
'<body>',
'<nav>',
'  <a href="../index.html" class="nav-logo">SÖS<span>.</span></a>',
'  <ul class="nav-links">',
'    <li><a href="../blog.html">&#8592; All posts</a></li>',
'    <li><a href="' + HEYLO + '" target="_blank" rel="noopener" class="nav-cta">Join Us</a></li>',
'  </ul>',
'</nav>',
'<div class="hero">',
'  <div class="hero-bg" style="background-image:url(\'' + esc(post.cover) + '\');"></div>',
'  <div class="hero-overlay"></div>',
'  <div class="hero-inner">',
'    <span class="hero-tag">' + label + '</span>',
'    <h1 class="hero-title">' + esc(post.title) + '</h1>',
'    <span class="hero-year">Söuthsea Swimrun</span>',
'  </div>',
'</div>',
'<article>',
bodyHtml + byline,
gallery,
'<div class="post-nav">',
'  <a href="../blog.html" class="back">&#8592; All posts</a>',
'  <a href="../index.html">Back to site &#8594;</a>',
'</div>',
'</article>',
'<footer>',
'  <div class="footer-inner">',
'    <p class="footer-copy">© Söuthsea Swimrun <span data-year>2026</span></p>',
'    <div class="footer-links">',
'      <a href="../blog.html">Blog</a>',
'      <a href="https://www.instagram.com/southsea.swimrun" target="_blank" rel="noopener">Instagram</a>',
'      <a href="' + HEYLO + '" target="_blank" rel="noopener" class="green">Join on Heylo</a>',
'    </div>',
'  </div>',
'</footer>',
'<script src="/js/main.js"></script>',
'</body>',
'</html>'].join('\n');
  }

  /* ---------------- home page "latest posts" cards ----------------
     Replaces the content between the HOME-LATEST markers in index.html. */
  function renderHomeLatest(manifest) {
    // Newest across both reports and articles. Entries with an explicit ISO
    // `date` sort first (newest); the rest keep manifest order (reports, then
    // articles), so undated legacy posts stay in their existing sequence.
    var all = (manifest.reports || []).concat(manifest.articles || [])
      .map(function (p, i) { return { p: p, i: i }; });
    all.sort(function (a, b) {
      var da = a.p.date || '', db = b.p.date || '';
      if (da && db) return da < db ? 1 : (da > db ? -1 : a.i - b.i);
      if (da) return -1;
      if (db) return 1;
      return a.i - b.i;
    });
    var latest = all.slice(0, 3).map(function (x) { return x.p; });
    return latest.map(function (p, idx) {
      var metaColor = idx === 0 ? 'var(--accent)' : 'var(--text-muted)';
      var metaLabel = idx === 0
        ? (p.year ? 'Latest · ' + esc(p.year) : 'Latest')
        : (p.year ? esc(p.tag) + ' · ' + esc(p.year) : esc(p.tag));
      return [
        '      <a href="posts/' + esc(p.slug) + '.html" class="home-post-card" style="background: var(--white); text-decoration: none; color: inherit; display: flex; flex-direction: column;">',
        '        <div style="aspect-ratio:16/9; overflow:hidden;">',
        '          <img src="' + esc(p.cover) + '" alt="' + esc(p.title) + '" loading="lazy" style="width:100%;height:100%;object-fit:cover;">',
        '        </div>',
        '        <div style="padding: 1.25rem;">',
        '          <div style="font-size:0.65rem;font-weight:500;letter-spacing:0.15em;text-transform:uppercase;color:' + metaColor + ';margin-bottom:0.5rem;">' + metaLabel + '</div>',
        '          <h3 style="font-family:var(--font-display);font-size:1.3rem;letter-spacing:0.02em;line-height:1.1;margin-bottom:0.6rem;">' + esc(p.title) + '</h3>',
        '          <p style="font-size:0.82rem;color:var(--text-muted);line-height:1.7;font-weight:300;">' + esc(p.excerpt) + '</p>',
        '        </div>',
        '      </a>'
      ].join('\n');
    }).join('\n\n');
  }

  /* ---------------- sitemap.xml ---------------- */
  function renderSitemap(manifest) {
    var urls = [
      '  <url><loc>' + SITE + '/</loc><changefreq>monthly</changefreq><priority>1.0</priority></url>',
      '  <url><loc>' + SITE + '/blog.html</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>'
    ];
    var all = (manifest.reports || []).concat(manifest.articles || []);
    all.map(function (p) { return p.slug; }).sort().forEach(function (slug) {
      urls.push('  <url><loc>' + SITE + '/posts/' + esc(slug) + '.html</loc><changefreq>yearly</changefreq><priority>0.6</priority></url>');
    });
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls.join('\n') + '\n</urlset>\n';
  }

  return {
    esc: esc,
    bodyTextToHtml: bodyTextToHtml,
    renderBlogHtml: renderBlogHtml,
    renderPostHtml: renderPostHtml,
    renderHomeLatest: renderHomeLatest,
    renderSitemap: renderSitemap
  };
}));
