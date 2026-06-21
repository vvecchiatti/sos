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

  // Auto-update any copyright year placeholders (<span data-year></span>)
  var years = document.querySelectorAll('[data-year]');
  if (years.length) {
    var y = String(new Date().getFullYear());
    years.forEach(function (el) { el.textContent = y; });
  }
})();
