/* =========================================================
   STACKLY DIGITAL — Animations & Interactions
   ========================================================= */

(function () {
  "use strict";

  /* ---------- Image cache-busting ----------
     Forces the browser to fetch fresh files after a manual image
     replacement. Appends a unique token to every <img>/poster URL that
     lives under the images/ folder (videos are left untouched). */
  (function () {
    function bustUrl(url) {
      if (!url || url.indexOf("images/") === -1 || url.indexOf("cb=") !== -1) return url;
      return url + (url.indexOf("?") === -1 ? "?" : "&") + "cb=" + Date.now();
    }
    function bust(el, attr) {
      var cur = el.getAttribute(attr);
      var next = bustUrl(cur);
      if (next !== cur) el.setAttribute(attr, next);
    }
    document.querySelectorAll("img[src]").forEach(function (img) { bust(img, "src"); });
    document.querySelectorAll("source[src]").forEach(function (src) { bust(src, "src"); });
    document.querySelectorAll("[poster]").forEach(function (el) { bust(el, "poster"); });
  })();

  /* ---------- Helpers ---------- */
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gsapAvailable = typeof window.gsap !== "undefined";
  const scrollTriggerAvailable = gsapAvailable && typeof window.ScrollTrigger !== "undefined";

  if (scrollTriggerAvailable) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ---------- Hero entrance ----------
     animateHero(slide, lockScroll) — scopes the timeline to one slide
     (defaults to the visible .is-active slide). lockScroll only on the
     initial page-load run so slide changes never freeze the viewport. */
  function animateHero(slide, lockScroll) {
    if (prefersReducedMotion) return;
    if (lockScroll) document.body.style.overflow = "hidden";
    if (!gsapAvailable) {
      document.body.style.overflow = "";
      return;
    }

    // When a hero slider exists, only animate the given slide (or the one
    // visible on load) so off-screen slides are never left in a hidden state.
    const active = slide || document.querySelector(".hero-slider__slide.is-active");
    const find = function (sel) {
      if (active) return Array.prototype.slice.call(active.querySelectorAll(sel));
      return Array.prototype.slice.call(document.querySelectorAll(sel));
    };

    // Finish any in-flight entrance at its natural end state before starting
    // a new one, so .from() never captures a half-animated value as target.
    if (heroTl) heroTl.progress(1).kill();

    const tl = gsap.timeline({
      onComplete: function () {
        if (lockScroll) document.body.style.overflow = "";
      },
    });
    heroTl = tl;

    tl.from(find('[data-hero="badge"]'), { y: 30, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(find('[data-hero="title"] .text-gradient, [data-hero="title"] .hero__line'), {
        yPercent: 110,
        duration: 1.1,
        ease: "power4.out",
        stagger: 0.12,
      }, "-=0.2")
      .from(find('[data-hero="desc"]'), { y: 30, opacity: 0, duration: 0.8 }, "-=0.6")
      .from(find('[data-hero="actions"] > *'), { y: 30, opacity: 0, duration: 0.7, stagger: 0.12 }, "-=0.45")
      .from(find('[data-hero="metrics"] .metric'), { y: 24, opacity: 0, duration: 0.7, stagger: 0.1 }, "-=0.45")
      .from(find('[data-hero="card"]'), { x: 60, opacity: 0, duration: 1, ease: "power3.out" }, "-=0.9");
  }

  // Exposed so the hero slider can replay the entrance on slide change.
  let heroTl = null;
  window.SDAnimateHero = animateHero;

  /* ---------- Hero video card: pause for reduced motion ---------- */
  if (prefersReducedMotion) {
    document.querySelectorAll(".hero__video-card__media, .hero__bg-video").forEach(function (video) {
      video.pause();
      video.removeAttribute("autoplay");
      video.currentTime = 0;
    });
  }

  /* ---------- Hero parallax ---------- */
  if (scrollTriggerAvailable && !prefersReducedMotion) {
    gsap.utils.toArray(".shape").forEach(function (shape) {
      gsap.to(shape, {
        yPercent: 25,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    });
  }

  /* ---------- Scroll parallax on hero / CTA backgrounds ----------
     Subtle depth on sub-page heroes and the CTA image. Scrubbed to
     scroll, so it reads as smooth motion rather than a jarring jump. */
  if (scrollTriggerAvailable && !prefersReducedMotion) {
    gsap.utils.toArray(".page-hero .hero__bg-img").forEach(function (img) {
      gsap.fromTo(img,
        { yPercent: -8, scale: 1.08 },
        {
          yPercent: 8,
          scale: 1.08,
          ease: "none",
          scrollTrigger: {
            trigger: ".page-hero",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    });

    gsap.utils.toArray(".cta__bg img").forEach(function (img) {
      gsap.fromTo(img,
        { yPercent: -8, scale: 1.06 },
        {
          yPercent: 8,
          scale: 1.06,
          ease: "none",
          scrollTrigger: {
            trigger: ".cta",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    });
  }

  /* ---------- Counters ---------- */
  function animateCount(el) {
    const target = parseFloat(el.dataset.count) || 0;
    const raw = String(el.dataset.count || "").trim();
    const decimals = (raw.split(".")[1] || "").length;

    function format(v) {
      return v.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }

    if (gsapAvailable && !prefersReducedMotion) {
      const holder = { v: 0 };
      gsap.to(holder, {
        v: target,
        duration: 2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
          once: true,
        },
        onUpdate: function () {
          el.textContent = format(holder.v);
        },
      });
    } else {
      el.textContent = format(target);
    }
  }

  document.querySelectorAll("[data-count]").forEach(animateCount);

  /* ---------- Navbar scroll state ---------- */
  const nav = document.getElementById("siteNav");
  const backToTop = document.getElementById("backToTop");
  const navLinks = document.querySelectorAll(".nav-links .nav-link");
  const sections = [];

  navLinks.forEach(function (link) {
    const id = link.getAttribute("href");
    if (id && id.startsWith("#")) {
      const sec = document.querySelector(id);
      if (sec) sections.push({ link: link, section: sec });
    }
  });

  /* Multi-page: highlight the active link from the current URL when there
     are no in-page anchor sections to track. */
  if (sections.length === 0) {
    const currentPage = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
    navLinks.forEach(function (l) {
      const href = l.getAttribute("href") || "";
      const target = href.startsWith("#")
        ? "index.html"
        : href.split("#")[0].split("/").pop().toLowerCase();
      l.classList.toggle("active", target === currentPage);
    });
  }

  function setActiveNavLink() {
    if (sections.length === 0) return;
    const pos = window.scrollY + 110;
    let current = null;
    sections.forEach(function (item) {
      if (item.section.offsetTop <= pos) current = item.link;
    });
    navLinks.forEach(function (l) { l.classList.remove("active"); });
    if (current) current.classList.add("active");
  }

  function onScroll() {
    const y = window.scrollY;
    if (nav) nav.classList.toggle("scrolled", y > 40);
    if (backToTop) backToTop.classList.toggle("visible", y > 700);
    setActiveNavLink();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Smooth scrolling (anchor) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      const id = anchor.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      const offcanvas = document.querySelector("#navMenu.show");
      if (offcanvas) {
        const instance = bootstrap.Offcanvas.getInstance(offcanvas) || new bootstrap.Offcanvas(offcanvas);
        instance.hide();
      }

      const top = target.getBoundingClientRect().top + window.scrollY - 66;
      window.scrollTo({ top: top, behavior: "smooth" });
    });
  });

  /* ---------- Back to top ---------- */
  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- Work filter ---------- */
  const filterBtns = document.querySelectorAll(".filter-btn");
  const workItems = document.querySelectorAll(".work-item");

  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      const filter = btn.dataset.filter;

      const visible = [];
      workItems.forEach(function (item) {
        const show = filter === "all" || item.dataset.category === filter;
        item.classList.toggle("is-hidden", !show);
        item.style.display = show ? "" : "none";
        if (show) visible.push(item);
      });

      if (gsapAvailable && !prefersReducedMotion) {
        gsap.fromTo(visible,
          { opacity: 0, y: 30 },
          {
            opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: "power3.out",
            onComplete: function () { if (scrollTriggerAvailable) ScrollTrigger.refresh(); },
          }
        );
      }
      if (scrollTriggerAvailable) ScrollTrigger.refresh();
    });
  });

  /* ---------- Testimonial slider ---------- */
  const track = document.getElementById("testimonialTrack");
  const prevBtn = document.getElementById("tPrev");
  const nextBtn = document.getElementById("tNext");
  const dotsWrap = document.getElementById("tDots");

  if (track && prevBtn && nextBtn && dotsWrap) {
    const total = track.children.length;
    let index = 0;
    let autoTimer = null;

    for (let i = 0; i < total; i++) {
      const dot = document.createElement("button");
      dot.className = "t-dot";
      dot.type = "button";
      dot.setAttribute("aria-label", "Go to testimonial " + (i + 1));
      if (i === 0) dot.classList.add("active");
      dot.addEventListener("click", function () { goTo(i, true); });
      dotsWrap.appendChild(dot);
    }
    const dots = dotsWrap.children;

    function goTo(i, manual) {
      index = (i + total) % total;
      const x = -index * 100;
      if (gsapAvailable && !prefersReducedMotion) {
        gsap.to(track, { xPercent: x, duration: 0.65, ease: "power3.out" });
      } else {
        track.style.transform = "translateX(" + x + "%)";
      }
      Array.from(dots).forEach(function (d, di) {
        d.classList.toggle("active", di === index);
      });
      if (manual) restartAuto();
    }

    function restartAuto() {
      if (autoTimer) clearInterval(autoTimer);
      autoTimer = setInterval(function () { goTo(index + 1, false); }, 6500);
    }

    prevBtn.addEventListener("click", function () { goTo(index - 1, true); });
    nextBtn.addEventListener("click", function () { goTo(index + 1, true); });

    const slider = document.querySelector(".testimonial-slider");
    if (slider) {
      slider.addEventListener("mouseenter", function () { if (autoTimer) clearInterval(autoTimer); });
      slider.addEventListener("mouseleave", restartAuto);
    }

    restartAuto();
  }

  /* ---------- Pricing toggle ---------- */
  const toggle = document.getElementById("billingToggle");
  const labelMonthly = document.getElementById("labelMonthly");
  const labelAnnual = document.getElementById("labelAnnual");

  if (toggle) {
    let isAnnual = false;

    toggle.addEventListener("click", function () {
      isAnnual = !isAnnual;
      toggle.setAttribute("aria-checked", String(isAnnual));
      if (labelMonthly) labelMonthly.classList.toggle("active", !isAnnual);
      if (labelAnnual) labelAnnual.classList.toggle("active", isAnnual);

      document.querySelectorAll(".price-card__price .amount").forEach(function (amountEl) {
        const value = isAnnual ? amountEl.dataset.annual : amountEl.dataset.monthly;
        if (gsapAvailable) {
          gsap.fromTo(amountEl,
            { y: 18, opacity: 0 },
            {
              y: 0, opacity: 1, duration: 0.4, ease: "power2.out",
              onStart: function () { amountEl.textContent = value; },
            }
          );
        } else {
          amountEl.textContent = value;
        }
      });
    });
  }

  /* ---------- Contact form ---------- */
  const contactForm = document.getElementById("contactForm");
  const formNote = document.getElementById("formNote");

  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      e.stopPropagation();

      let valid = true;
      const nameField = contactForm.querySelector("#cfName");
      if (nameField) {
        const nameCheck = window.SDName
          ? window.SDName.validate(nameField.value)
          : { valid: /^[A-Za-z]+(?:\s+[A-Za-z]+)*$/.test(nameField.value.trim()), message: "Name can only contain letters (A–Z, a–z) and spaces." };
        const fb = nameField.parentElement.querySelector(".invalid-feedback");
        if (!nameCheck.valid) {
          valid = false;
          nameField.classList.add("is-invalid");
          if (fb) {
            fb.textContent = nameCheck.message;
            fb.style.display = "block";
          }
        } else {
          nameField.classList.remove("is-invalid");
          if (fb) fb.style.display = "none";
        }
      }

      const emailField = contactForm.querySelector("#cfEmail");
      if (emailField) {
        const emailCheck = window.SDEmail
          ? window.SDEmail.validate(emailField.value)
          : { valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value.trim()), message: "Enter a valid email address." };
        const fb = emailField.parentElement.querySelector(".invalid-feedback");
        if (!emailCheck.valid) {
          valid = false;
          emailField.classList.add("is-invalid");
          if (fb) {
            fb.textContent = emailCheck.message;
            fb.style.display = "block";
          }
        } else {
          emailField.classList.remove("is-invalid");
          if (fb) fb.style.display = "none";
        }
      }

      const inputs = contactForm.querySelectorAll("[required]");
      inputs.forEach(function (input) {
        if (input === emailField || input === nameField) return;
        const fb = input.parentElement.querySelector(".invalid-feedback");
        if (!input.value.trim()) {
          valid = false;
          input.classList.add("is-invalid");
          if (fb) {
            fb.textContent = input.tagName === "SELECT" ? "Please select an option." : "This field is required.";
            fb.style.display = "block";
          }
        } else {
          input.classList.remove("is-invalid");
          if (fb) fb.style.display = "none";
        }
      });

      if (!valid) {
        if (formNote) {
          formNote.style.color = "#C7C54A";
          formNote.textContent = "Please fix the highlighted fields and try again.";
        }
        return;
      }

      window.location.href = "404.html";
    });
  }

  /* ---------- Newsletter form ---------- */
  const newsletterForm = document.getElementById("newsletterForm");
  const newsletterNote = document.getElementById("newsletterNote");

  if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const input = newsletterForm.querySelector("input[type='email']");
      const check = input
        ? (window.SDEmail ? window.SDEmail.validate(input.value) : { valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim()), message: "Enter a valid email address." })
        : { valid: false, message: "Please enter your email address." };
      if (!check.valid) {
        if (newsletterNote) {
          newsletterNote.style.color = "#C7C54A";
          newsletterNote.textContent = check.message;
        }
        return;
      }
      window.location.href = "404.html";
    });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item__head").forEach(function (head) {
    head.addEventListener("click", function () {
      const item = head.closest(".faq-item");
      const body = item.querySelector(".faq-item__body");
      const isOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach(function (other) {
        other.classList.remove("open");
        other.querySelector(".faq-item__body").style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add("open");
        body.style.maxHeight = body.scrollHeight + "px";
      }
    });
  });

  /* ---------- Init ---------- */
  window.addEventListener("load", function () {
    animateHero(null, true);
    if (scrollTriggerAvailable) ScrollTrigger.refresh();
  });
})();

/* =========================================================
   STACKLY DIGITAL — Hero slider
   Two-slide carousel on the home page hero with auto-play,
   arrows and dot navigation. Respects prefers-reduced-motion.
   ========================================================= */
(function () {
  "use strict";

  var slider = document.getElementById("heroSlider");
  if (!slider) return;

  var track = slider.querySelector(".hero-slider__track");
  var slides = Array.prototype.slice.call(slider.querySelectorAll(".hero-slider__slide"));
  var dots = Array.prototype.slice.call(slider.querySelectorAll(".hero-slider__dot"));
  if (!track || slides.length < 2) return;

  var index = 0;
  var timer = null;
  var AUTO_MS = 7000;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var firstRender = true;

  function goTo(next) {
    index = (next + slides.length) % slides.length;
    track.style.transform = "translateX(-" + index * 100 + "%)";

    slides.forEach(function (slide, i) {
      var active = i === index;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", active ? "false" : "true");
      // Keep hidden-slide controls out of the tab order.
      if (active) slide.removeAttribute("inert");
      else slide.setAttribute("inert", "");
    });
    dots.forEach(function (dot, i) {
      dot.classList.toggle("is-active", i === index);
      dot.setAttribute("aria-current", i === index ? "true" : "false");
    });

    slides.forEach(function (slide, i) {
      slide.querySelectorAll("video").forEach(function (video) {
        if (i === index && !reduceMotion) {
          var playPromise = video.play();
          if (playPromise && playPromise.catch) playPromise.catch(function () {});
        } else {
          video.pause();
        }
      });
    });

    // Replay the hero entrance on the newly shown slide (the initial
    // render is animated by the page-load call in animateHero).
    if (firstRender) {
      firstRender = false;
    } else if (typeof window.SDAnimateHero === "function") {
      window.SDAnimateHero(slides[index], false);
    }
  }

  function nextSlide() { goTo(index + 1); }
  function prevSlide() { goTo(index - 1); }

  var firstCycleDone = false;

  function startAuto() {
    stopAuto();
    timer = setInterval(function () {
      firstCycleDone = true;
      nextSlide();
    }, AUTO_MS);
  }
  function stopAuto() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  var prevBtn = slider.querySelector(".hero-slider__arrow--prev");
  var nextBtn = slider.querySelector(".hero-slider__arrow--next");
  if (prevBtn) prevBtn.addEventListener("click", function () { stopAuto(); startAuto(); prevSlide(); });
  if (nextBtn) nextBtn.addEventListener("click", function () { stopAuto(); startAuto(); nextSlide(); });

  dots.forEach(function (dot) {
    dot.addEventListener("click", function () {
      stopAuto(); startAuto();
      goTo(parseInt(dot.getAttribute("data-slide"), 10) || 0);
    });
  });

  /* The hero fills the viewport, so the pointer often rests on it at
     load. Wait until the first auto-advance has fired before letting
     hover/focus pause the slider - otherwise slide 2 would never be
     revealed automatically. */
  slider.addEventListener("mouseenter", function () {
    if (firstCycleDone) stopAuto();
  });
  slider.addEventListener("mouseleave", startAuto);
  slider.addEventListener("focusin", function () {
    if (firstCycleDone) stopAuto();
  });
  slider.addEventListener("focusout", startAuto);

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      stopAuto();
    } else {
      startAuto();
    }
  });

  goTo(0);
  startAuto();
})();