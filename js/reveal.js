/* =========================================================
   STACKLY DIGITAL — Scroll reveal
   Lightweight IntersectionObserver-based entrance animations.
   - Elements opt in with [data-reveal] ("up" default; fade,
     left, right, scale available)
   - Dashboard content (page headings, stats, cards) is wired
     in automatically for consistent coverage across every page.
   - Sibling elements inside a shared .row / grid cascade with
     a capped stagger delay (override per item with data-delay)
   - Respects prefers-reduced-motion; no-JS fallback via .js gate
   - Only animates opacity + translate/scale (no layout shift)
   ========================================================= */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  var elements = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));

  /* Automatically opt dashboard content blocks into the same
     system (before first paint) so cards, stats, page headings
     and buttons animate consistently on every admin/client page. */
  var AUTOMATIC =
    '.dash-content .dash-heading, ' +
    '.dash-content .dash-welcome, ' +
    '.dash-content .dash-stat, ' +
    '.dash-content .dash-card';

  var autoEls = Array.prototype.slice.call(document.querySelectorAll(AUTOMATIC)).filter(function (el) {
    return !el.hasAttribute('data-reveal');
  });
  autoEls.forEach(function (el) {
    el.setAttribute('data-reveal', '');
    elements.push(el);
  });

  if (reduce.matches || elements.length === 0) {
    elements.forEach(function (el) { el.classList.add('is-revealed'); });
    return;
  }

  if (!('IntersectionObserver' in window)) {
    elements.forEach(function (el) { el.classList.add('is-revealed'); });
    return;
  }

  var GROUPS = '.row, .work-grid, .team-grid, .award-grid, .timeline, .stats-grid, .pricing-grid, .jobs-grid, .contact-grid, .dash-card-grid, .dash-stats';
  var MAX_STAGGER = 0.6;
  var STEP = 0.1;

  function staggerFor(el) {
    var group = el.closest(GROUPS);
    var peerList = group ? Array.prototype.slice.call(group.querySelectorAll('[data-reveal]')) : [el];
    var index = peerList.indexOf(el);
    if (index === -1) index = 0;
    var delay = Math.min(index * STEP, MAX_STAGGER);
    var attr = el.getAttribute('data-delay');
    if (attr !== null && parseFloat(attr) >= 0) delay = parseFloat(attr);
    return delay;
  }

  elements.forEach(function (el) {
    el.style.setProperty('--reveal-delay', staggerFor(el).toFixed(3) + 's');
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      el.classList.add('is-revealed');
      observer.unobserve(el);
    });
  }, {
    rootMargin: '0px 0px -8% 0px',
    threshold: 0.12,
  });

  elements.forEach(function (el) {
    observer.observe(el);
  });

  reduce.addEventListener('change', function (e) {
    if (!e.matches) return;
    elements.forEach(function (el) { el.classList.add('is-revealed'); });
  });
})();