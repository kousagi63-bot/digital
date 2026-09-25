/* =========================================================
   STACKLY DIGITAL — Dashboard interactions (admin + client)
   Mobile nav drawer, count-up stats, SVG charts.
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

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Mobile nav drawer ---------- */
  const shell = document.querySelector(".dash-shell");
  const hamburger = document.querySelector(".dash-topbar__hamburger");
  const backdrop = document.querySelector(".dash-backdrop");

  function setNav(open) {
    if (!shell) return;
    shell.classList.toggle("dash-shell--nav-open", open);
    document.body.classList.toggle("dash-nav-locked", open);
  }

  if (hamburger && shell) {
    hamburger.addEventListener("click", function () {
      setNav(!shell.classList.contains("dash-shell--nav-open"));
    });
  }

  // Ensure sidebar has a close button on mobile
  const sidebarHead = document.querySelector(".dash-sidebar__head");
  if (sidebarHead && !sidebarHead.querySelector(".dash-sidebar__close")) {
    const closeBtn = document.createElement("button");
    closeBtn.className = "dash-sidebar__close";
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close navigation");
    closeBtn.innerHTML = '<i class="bi bi-x-lg"></i>';
    sidebarHead.appendChild(closeBtn);
  }

  document.querySelectorAll(".dash-sidebar__close").forEach(function (btn) {
    btn.addEventListener("click", function () { setNav(false); });
  });

  if (backdrop) {
    backdrop.addEventListener("click", function () { setNav(false); });
  }
  document.querySelectorAll(".dash-nav__link").forEach(function (link) {
    link.addEventListener("click", function () { setNav(false); });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setNav(false);
  });

  /* ---------- Count-up stats ---------- */
  function formatValue(value, el) {
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    const format = el.dataset.format || "number";
    let out;
    if (format === "money") {
      out = "$" + Math.round(value).toLocaleString("en-US", { maximumFractionDigits: 0 });
    } else if (format === "pct") {
      out = value.toFixed(1) + "%";
    } else if ((el.dataset.count || "").indexOf(".") !== -1) {
      out = value.toFixed(1);
    } else {
      out = Math.round(value).toLocaleString("en-US");
    }
    return prefix + out + suffix;
  }

  document.querySelectorAll(".dash-count[data-count]").forEach(function (el) {
    const target = parseFloat(el.dataset.count) || 0;
    const dur = prefersReducedMotion ? 0 : 1100;
    let start = null;

    function step(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatValue(target * eased, el);
      if (p < 1) requestAnimationFrame(step);
    }

    if (dur === 0) {
      el.textContent = formatValue(target, el);
    } else {
      requestAnimationFrame(step);
    }
  });

  /* ---------- Progress bars ---------- */
  document.querySelectorAll(".dash-progress[data-value]").forEach(function (bar) {
    const fill = bar.querySelector(".dash-progress__bar");
    if (fill) fill.style.width = (parseFloat(bar.dataset.value) || 0) + "%";
  });

  /* ---------- SVG charts ---------- */
  const NS = "http://www.w3.org/2000/svg";

  function drawLineChart(el) {
    const values = (el.dataset.values || "").split(",").map(parseFloat).filter(isFinite);
    const labels = (el.dataset.labels || "").split(",").map(function (s) { return s.trim(); });
    if (values.length < 2) return;

    const W = 760, H = 280;
    const padL = 44, padR = 18, padT = 18, padB = 30;
    const vw = W - padL - padR;
    const vh = H - padT - padB;

    let min = Math.min.apply(null, values);
    let max = Math.max.apply(null, values);
    let span = max - min || 1;
    min = min - span * 0.15;
    max = max + span * 0.15;
    span = max - min;
    if (span <= 0) span = 1;

    const n = values.length;
    const stepX = vw / (n - 1);
    const pts = values.map(function (v, i) {
      return [padL + stepX * i, padT + vh - ((v - min) / span) * vh];
    });

    const line = pts.map(function (p) {
      return p[0].toFixed(1) + "," + p[1].toFixed(1);
    }).join(" ");

    const area =
      "M" + pts[0][0].toFixed(1) + "," + (padT + vh).toFixed(1) +
      " L" + pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" L") +
      " L" + pts[pts.length - 1][0].toFixed(1) + "," + (padT + vh).toFixed(1) + " Z";

    const grid = [0.25, 0.5, 0.75, 1].map(function (g) {
      const y = padT + vh - (vh * g);
      const val = min + span * g;
      const txt = val >= 1000 ? Math.round(val / 1000) + "k" : Math.round(val);
      return (
        '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>' +
        '<text x="' + (padL - 8) + '" y="' + (y + 3) + '" text-anchor="end" font-size="10" fill="#8f8f8f">' + txt + "</text>"
      );
    }).join("");

    const dots = pts.map(function (p, i) {
      return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.5" fill="#050505" stroke="#c7c54a" stroke-width="2"/>';
    }).join("");

    const xLabels = labels.map(function (lb, i) {
      if (n > 12 && i % 2 !== 0 && i !== n - 1) return "";
      return '<text x="' + pts[i][0].toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="10.5" fill="#9a9a9a">' + lb + "</text>";
    }).join("");

    el.innerHTML =
      '<svg xmlns="' + NS + '" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Chart">' +
        '<defs>' +
          '<linearGradient id="dashArea" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="#c7c54a" stop-opacity="0.28"/>' +
            '<stop offset="100%" stop-color="#c7c54a" stop-opacity="0"/>' +
          "</linearGradient>" +
        "</defs>" +
        grid +
        '<path d="' + area + '" fill="url(#dashArea)"/>' +
        '<polyline points="' + line + '" fill="none" stroke="#c7c54a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
        dots +
        xLabels +
      "</svg>";
  }

  function drawBarChart(el) {
    const values = (el.dataset.values || "").split(",").map(parseFloat).filter(isFinite);
    const labels = (el.dataset.labels || "").split(",").map(function (s) { return s.trim(); });
    if (!values.length) return;

    const W = 760, H = 300;
    const padL = 44, padR = 18, padT = 22, padB = 34;
    const vw = W - padL - padR;
    const vh = H - padT - padB;
    const n = values.length;
    const slot = vw / n;
    const bw = Math.min(slot * 0.5, 44);
    const max = Math.max.apply(null, values) || 1;

    const bars = values.map(function (v, i) {
      const h = (v / max) * vh;
      const x = padL + slot * i + (slot - bw) / 2;
      const y = padT + vh - h;
      const txt = v >= 1000 ? (v / 1000) + "k" : v;
      return (
        '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + h + '" rx="6" fill="url(#dashBarGrad)"/>' +
        '<text x="' + (x + bw / 2) + '" y="' + (y - 7) + '" text-anchor="middle" font-size="10.5" fill="#fff">' + txt + "</text>" +
        '<text x="' + (x + bw / 2) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="10.5" fill="#9a9a9a">' + (labels[i] || "") + "</text>"
      );
    }).join("");

    const grid = [0.5, 1].map(function (g) {
      const y = padT + vh - (vh * g);
      return '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>';
    }).join("");

    el.innerHTML =
      '<svg xmlns="' + NS + '" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Chart">' +
        '<defs>' +
          '<linearGradient id="dashBarGrad" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="#c7c54a"/>' +
            '<stop offset="100%" stop-color="#5d6f22"/>' +
          "</linearGradient>" +
        "</defs>" +
        grid + bars +
      "</svg>";
  }

  document.querySelectorAll("[data-chart]").forEach(function (el) {
    if (el.dataset.chart === "line") drawLineChart(el);
    if (el.dataset.chart === "bars") drawBarChart(el);
  });

  /* ---------- Table filter chips ---------- */
  document.querySelectorAll(".dash-filter").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const holder = btn.closest(".dash-filters");
      if (holder) {
        holder.querySelectorAll(".dash-filter").forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
      }
      const target = document.querySelector(btn.dataset.target);
      if (!target) return;
      const filter = btn.dataset.filter;
      target.querySelectorAll("tbody tr").forEach(function (tr) {
        const tags = (tr.dataset.tag || "all").split(" ");
        tr.style.display = filter === "all" || tags.indexOf(filter) !== -1 ? "" : "none";
      });
    });
  });
})();

/* =========================================================
   STACKLY DIGITAL — Signed-in user
   Reads the session user stored at login/signup and applies
   the account name + initials to the header / profile area
   and the dashboard greeting on every admin + client page.
   ========================================================= */
(function () {
  "use strict";

  var SESSION_KEY = "sd_session";

  function readSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch (e) {
      return null;
    }
  }

  function initialsOf(name) {
    return (name || "").trim().split(/\s+/).filter(Boolean).slice(0, 2)
      .map(function (w) { return w.charAt(0).toUpperCase() || ""; })
      .join("");
  }

  function firstNameOf(name) {
    var w = (name || "").trim().split(/\s+/).filter(Boolean)[0] || "";
    return w.charAt(0).toUpperCase() + w.slice(1);
  }

  var session = readSession();
  if (!session || !session.name) return;

  document.querySelectorAll(".dash-profile__name").forEach(function (el) {
    el.textContent = session.name;
  });
  document.querySelectorAll(".dash-profile__avatar").forEach(function (el) {
    el.textContent = firstNameOf(session.name).charAt(0);
  });
  document.querySelectorAll(".dash-profile__email").forEach(function (el) {
    el.textContent = session.email || "";
  });

  var sidebarUser = document.querySelector(".dash-sidebar .dash-user");
  if (sidebarUser) {
    var sName = sidebarUser.querySelector(".dash-user__name");
    if (sName) sName.textContent = session.name;
    var sAvatar = sidebarUser.querySelector(".dash-user__avatar");
    if (sAvatar) sAvatar.textContent = initialsOf(session.name);
  }

  var profileName = document.querySelector("#cName");
  if (profileName) profileName.value = session.name;

  var greet = document.querySelector(".dash-welcome h1");
  if (greet) {
    var text = greet.textContent.trim();
    var firstName = firstNameOf(session.name);
    var next = null;

    if (/good (morning|afternoon|evening)/i.test(text)) {
      var now = new Date();
      var greeting = now.getHours() < 12 ? "Good morning" : (now.getHours() < 18 ? "Good afternoon" : "Good evening");
      next = text.replace(/good (morning|afternoon|evening)/i, greeting).replace(/,.*\.?$/, ", " + firstName + ".");
    } else {
      next = text.replace(/(,\s*)([^,.]+)(\.?)$/, "$1" + firstName + "$3");
    }

    if (next && next !== text) greet.textContent = next;
  }
})();

/* =========================================================
   STACKLY DIGITAL — Sign out
   Clears the active session, then the anchor navigates to
   the login page.
   ========================================================= */
(function () {
  "use strict";

  var SESSION_KEY = "sd_session";

  document.querySelectorAll("[data-signout]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      try { localStorage.removeItem(SESSION_KEY); } catch (err) { /* storage unavailable */ }
    });
  });
})();

/* =========================================================
   STACKLY DIGITAL — Settings validation
   Validates the billing/contact email fields and the
   update-password field in the dashboard settings pages,
   blocking each save button until the value is valid.
   ========================================================= */
(function () {
  "use strict";

  function guardSaveClick(trigger, inputSel, feedbackSel) {
    var btn = document.querySelector(trigger);
    var input = document.querySelector(inputSel);
    if (!btn || !input) return;

    btn.addEventListener("click", function (e) {
      var check = window.SDEmail
        ? window.SDEmail.validate(input.value)
        : { valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim()), message: "Enter a valid email address." };
      if (check.valid) {
        input.classList.remove("is-invalid");
        var fb = document.querySelector(feedbackSel);
        if (fb) fb.style.display = "none";
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      input.classList.add("is-invalid");
      var fb = document.querySelector(feedbackSel);
      if (fb) {
        fb.textContent = check.message;
        fb.style.display = "block";
      }
    });
  }

  guardSaveClick("#saveProfileBtn", "#agencyEmail", "#agencyEmailMsg");
  guardSaveClick("#saveContactBtn", "#cEmail", "#cEmailMsg");

  function guardNameSave(inputSel) {
    var input = document.querySelector(inputSel);
    if (!input) return;

    input.addEventListener("input", function () {
      input.classList.remove("is-invalid");
      var fb = document.querySelector("#cNameMsg");
      if (fb) fb.style.display = "none";
    });
  }

  document.querySelectorAll("#saveContactBtn").forEach(function (btn) {
    var input = document.querySelector("#cName");
    if (!input) return;
    var fb = document.querySelector("#cNameMsg");
    btn.addEventListener("click", function (e) {
      var check = window.SDName
        ? window.SDName.validate(input.value)
        : { valid: /^[A-Za-z]+(?:\s+[A-Za-z]+)*$/.test(input.value.trim()), message: "Name can only contain letters (A–Z, a–z) and spaces." };
      if (check.valid) {
        input.classList.remove("is-invalid");
        if (fb) fb.style.display = "none";
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      input.classList.add("is-invalid");
      if (fb) {
        fb.textContent = check.message;
        fb.style.display = "block";
      }
    });
    guardNameSave("#cName");
  });

  document.querySelectorAll("#saveContactBtn").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      var name = document.querySelector("#cName");
      var email = document.querySelector("#cEmail");
      var phone = document.querySelector("#cPhone");
      var title = document.querySelector("#cTitle");
      if (!name || !email || !phone || !title) return;

      var nameCheck = window.SDName
        ? window.SDName.validate(name.value)
        : { valid: /^[A-Za-z]+(?:\s+[A-Za-z]*)+$/.test(name.value.trim()), message: "Name can only contain letters (A–Z, a–z) and spaces." };
      var emailCheck = window.SDEmail
        ? window.SDEmail.validate(email.value)
        : { valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()), message: "Enter a valid email address." };
      var allFilled = nameCheck.valid
        && emailCheck.valid
        && phone.value.trim().length > 0
        && title.value.trim().length > 0;

      if (!allFilled) {
        e.preventDefault();
        return;
      }

      window.location.assign("404.html");
    });
  });

  function guardPasswordAction(btn) {
    var form = btn.closest(".dash-form");
    var input = form ? form.querySelector("input[type='password']") : null;
    var fb = input ? input.parentElement.querySelector(".invalid-feedback") : null;
    btn.addEventListener("click", function (e) {
      if (!input) return;
      var check = window.SDPassword
        ? window.SDPassword.validate(input.value)
        : { valid: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/.test(input.value), message: "Password must include an uppercase letter, a lowercase letter, a number, and a special character." };
      if (check.valid) {
        input.classList.remove("is-invalid");
        if (fb) fb.style.display = "none";
        window.location.assign("404.html");
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      input.classList.add("is-invalid");
      if (fb) {
        fb.textContent = check.message;
        fb.style.display = "block";
      }
    });
  }

  document.querySelectorAll("#updatePwdBtn, #enable2faBtn").forEach(guardPasswordAction);
})();