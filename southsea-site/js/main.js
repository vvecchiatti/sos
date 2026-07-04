/* Söuthsea Swimrun — site behaviour
   Kept external (not inline) so the site can run under a strict
   Content-Security-Policy with script-src 'self'. */
(function () {
  'use strict';

  // Fade-in on scroll
  var faders = document.querySelectorAll('.fade-in');
  if ('IntersectionObserver' in window && faders.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (el) {
        if (el.isIntersecting) {
          el.target.classList.add('visible');
          observer.unobserve(el.target);
        }
      });
    }, { threshold: 0.1 });
    faders.forEach(function (el) { observer.observe(el); });
  } else {
    // No IntersectionObserver: show everything.
    faders.forEach(function (el) { el.classList.add('visible'); });
  }

  // Mobile hamburger nav
  var navToggle = document.querySelector('.nav-toggle');
  var navMenu = document.querySelector('.nav-links');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    // Close the menu after tapping any link in it.
    navMenu.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        document.body.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Post photo gallery lightbox (.post-gallery on blog posts)
  var galleryItems = Array.prototype.slice.call(document.querySelectorAll('.post-gallery-item img'));
  if (galleryItems.length) {
    var current = 0;
    var overlay = document.createElement('div');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Photo viewer');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:200;background:rgba(8,8,8,0.95);display:none;align-items:center;justify-content:center;flex-direction:column;padding:2rem;';
    var img = document.createElement('img');
    img.style.cssText = 'max-width:92vw;max-height:80vh;object-fit:contain;border-radius:2px;';
    var counter = document.createElement('div');
    counter.style.cssText = 'color:rgba(255,255,255,0.6);font-size:0.8rem;letter-spacing:0.1em;margin-top:1rem;';
    var mkBtn = function (label, css) {
      var b = document.createElement('button');
      b.textContent = label;
      b.setAttribute('aria-label', label === '×' ? 'Close' : (label === '‹' ? 'Previous photo' : 'Next photo'));
      b.style.cssText = 'position:absolute;background:rgba(255,255,255,0.08);color:#fff;border:1px solid rgba(255,255,255,0.2);border-radius:6px;cursor:pointer;font-size:1.4rem;line-height:1;padding:0.5rem 0.9rem;' + css;
      return b;
    };
    var btnClose = mkBtn('×', 'top:1rem;right:1rem;');
    var btnPrev = mkBtn('‹', 'left:1rem;top:50%;transform:translateY(-50%);');
    var btnNext = mkBtn('›', 'right:1rem;top:50%;transform:translateY(-50%);');
    overlay.appendChild(img); overlay.appendChild(counter);
    overlay.appendChild(btnClose); overlay.appendChild(btnPrev); overlay.appendChild(btnNext);
    document.body.appendChild(overlay);

    var show = function (i) {
      current = (i + galleryItems.length) % galleryItems.length;
      img.src = galleryItems[current].src;
      img.alt = galleryItems[current].alt || '';
      counter.textContent = (current + 1) + ' / ' + galleryItems.length;
      overlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    };
    var hide = function () {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
    };
    galleryItems.forEach(function (el, i) {
      el.closest('.post-gallery-item').addEventListener('click', function () { show(i); });
    });
    btnClose.addEventListener('click', hide);
    btnPrev.addEventListener('click', function () { show(current - 1); });
    btnNext.addEventListener('click', function () { show(current + 1); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) hide(); });
    document.addEventListener('keydown', function (e) {
      if (overlay.style.display === 'none') return;
      if (e.key === 'Escape') hide();
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
  }

  // Auto-update any copyright year placeholders (<span data-year></span>)
  var years = document.querySelectorAll('[data-year]');
  if (years.length) {
    var y = String(new Date().getFullYear());
    years.forEach(function (el) { el.textContent = y; });
  }
})();
