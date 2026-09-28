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

(function () {
  'use strict';

  var STORAGE_KEY = 'sd-page-transition';
  var NAV_SELECTOR = '#siteNav a[href], .dash-sidebar a[href], .error-hero a[href], .auth-card__logo[href]';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var overlay = null;
  var isNavigating = false;
  var revealFallback = null;

  function readFlag() {
    try {
      return window.sessionStorage.getItem(STORAGE_KEY);
    } catch (err) {
      return null;
    }
  }

  function writeFlag() {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, '1');
    } catch (err) {
      return;
    }
  }

  function clearFlag() {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      return;
    }
  }

  function createOverlay(state) {
    if (overlay) return overlay;
    if (!document.body) return null;

    var resume = state === 'resume';

    var node = document.createElement('div');
    node.className = resume ? 'page-transition is-resumed' : 'page-transition';
    node.setAttribute('role', 'status');
    node.setAttribute('aria-live', 'polite');
    node.setAttribute('aria-label', 'Loading the next page');
    node.innerHTML = [
      '<div class="page-transition__inner">',
      '<div class="page-transition__mark"><span>SD</span></div>',
      '<div class="page-transition__brand">Stackly <span>Digital</span></div>',
      '<p class="page-transition__label">Preparing your next chapter</p>',
      '<div class="page-transition__bar" aria-hidden="true"></div>',
      '<div class="page-transition__dots" aria-hidden="true"><i></i><i></i><i></i></div>',
      '</div>',
    ].join('');

    document.body.appendChild(node);
    overlay = node;

    if (resume) {
      /* Destination page: the outgoing document's overlay is still on screen,
         so this is the same curtain continuing across the navigation. Show it
         already settled — no fade-in, no scroll lock — otherwise it reads as a
         second preloader flashing on top of the first. */
      node.classList.add('is-visible');
      return node;
    }

    document.documentElement.classList.add('page-transition-active');
    var show = function () { node.classList.add('is-visible'); };
    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(show);
    } else {
      window.setTimeout(show, 0);
    }
    return node;
  }

  function hideOverlay() {
    if (!overlay) return;
    var node = overlay;
    /* The pre-painted curtain (.page-preboot) and a resumed overlay both use
       the short 220ms lift, so they are removed on the same beat. */
    var quick = node.classList.contains('is-resumed') || node.classList.contains('page-preboot');
    node.classList.add('is-leaving');
    document.documentElement.classList.remove('page-transition-active');
    window.setTimeout(function () {
      /* nav-pending has to survive the fade: dropping it would fall back to
         .page-preboot { display: none } and cut the lift short. */
      document.documentElement.classList.remove('nav-pending');
      if (node.parentNode) node.parentNode.removeChild(node);
      if (overlay === node) overlay = null;
    }, reduceMotion.matches ? 0 : (quick ? 240 : 460));
  }

  function startNavigation(url) {
    if (isNavigating) return;
    isNavigating = true;
    writeFlag();
    createOverlay();
    window.setTimeout(function () {
      window.location.assign(url);
    }, reduceMotion.matches ? 0 : 680);
  }

  function onNavigationClick(event) {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    var target = event.target;
    if (!target || typeof target.closest !== 'function') return;
    var link = target.closest(NAV_SELECTOR);
    if (!link || link.getAttribute('data-no-transition') !== null) return;
    if (link.hasAttribute('download') || (link.target && link.target !== '_self')) return;

    var href = link.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;

    var url;
    try {
      url = new URL(link.href, document.baseURI);
    } catch (err) {
      return;
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:' && url.protocol !== 'file:') return;
    if (url.origin !== window.location.origin || url.hash || url.href === window.location.href) return;

    event.preventDefault();
    startNavigation(url.href);
  }

  function onBackClick(event) {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var target = event.target;
    if (!target || typeof target.closest !== 'function') return;
    var button = target.closest('.error-hero button[aria-label="Go back to the previous page"]');
    if (!button || reduceMotion.matches) return;
    if (isNavigating) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    isNavigating = true;
    writeFlag();
    createOverlay();
    window.setTimeout(function () {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.assign('index.html');
      }
    }, 680);
  }

  function claimPreboot() {
    var node = document.getElementById('pagePreboot');
    if (!node) return false;
    overlay = node;
    return true;
  }

  function revealDestination() {
    if (!readFlag() || reduceMotion.matches) {
      clearFlag();
      /* Reduced motion never shows the curtain, so make sure the class the
         head script set cannot leave the pre-painted node covering the page. */
      document.documentElement.classList.remove('nav-pending');
      return;
    }

    isNavigating = false;
    if (!claimPreboot()) createOverlay('resume');

    var completed = false;
    var complete = function () {
      if (completed) return;
      completed = true;
      if (revealFallback) {
        window.clearTimeout(revealFallback);
        revealFallback = null;
      }
      clearFlag();
      hideOverlay();
    };

    /* Wait for the page to be ready, but never keep the curtain up over a
       fully rendered document — a slow `load` (fonts, the hero video) must not
       stall the hand-off. Two frames so the new paint lands before we lift. */
    var lift = function () {
      var next = function () { window.setTimeout(complete, 40); };
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(function () { window.requestAnimationFrame(next); });
      } else {
        window.setTimeout(next, 0);
      }
    };

    if (document.readyState === 'complete') {
      lift();
    } else {
      window.addEventListener('load', lift, { once: true });
    }
    revealFallback = window.setTimeout(complete, 700);
  }

  document.addEventListener('click', onNavigationClick);
  document.addEventListener('click', onBackClick, true);
  window.addEventListener('pageshow', function (event) {
    if (!event.persisted) return;
    clearFlag();
    isNavigating = false;
    hideOverlay();
  });

  revealDestination();
})();
