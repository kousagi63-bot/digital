/* =========================================================
   STACKLY DIGITAL — AUTH PAGES (login + signup)
   Role selection, password toggles and client-side validation.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Image cache-busting ---------- */
  (function () {
    function bustUrl(url) {
      if (!url || url.indexOf('images/') === -1 || url.indexOf('cb=') !== -1) return url;
      return url + (url.indexOf('?') === -1 ? '?' : '&') + 'cb=' + Date.now();
    }
    function bust(el, attr) {
      var cur = el.getAttribute(attr);
      var next = bustUrl(cur);
      if (next !== cur) el.setAttribute(attr, next);
    }
    document.querySelectorAll('img[src]').forEach(function (img) { bust(img, 'src'); });
    document.querySelectorAll('source[src]').forEach(function (src) { bust(src, 'src'); });
    document.querySelectorAll('[poster]').forEach(function (el) { bust(el, 'poster'); });
  })();

  var ROLE_DASH = { admin: 'admin.html', client: 'client.html' };
  var FALLBACK_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ---------- User store (localStorage) ---------- */
  var USERS_KEY = 'sd_users';
  var SESSION_KEY = 'sd_session';

  function readUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function writeUsers(users) {
    try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); } catch (e) { /* storage unavailable */ }
  }

  function writeSession(data) {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch (e) { /* storage unavailable */ }
  }

  function deriveName(email) {
    var local = String(email || '').split('@')[0].toLowerCase();
    var name = local.replace(/[._\-+]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!name) return 'Guest';
    return name.split(' ').map(function (w) {
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join(' ');
  }

  function findAccount(email, role) {
    var key = email.trim().toLowerCase() + '|' + role;
    var users = readUsers();
    if (users[key]) return users[key];
    var prefix = email.trim().toLowerCase() + '|';
    var found = null;
    Object.keys(users).forEach(function (k) {
      if (!found && k.indexOf(prefix) === 0) found = users[k];
    });
    return found;
  }

  function qs(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }
  function qsa(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  /* ---------- Password show / hide ---------- */
  qsa('[data-toggle-password]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = qs(btn.getAttribute('data-target'));
      if (!input) return;
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      var icon = btn.querySelector('i');
      if (icon) icon.className = show ? 'bi bi-eye-slash' : 'bi bi-eye';
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      input.focus();
    });
  });

  /* ---------- Validation helpers ---------- */
  function setError(input, message) {
    input.classList.add('is-invalid');
    var wrap = input.closest('.auth-field');
    var fb = wrap ? qs('.invalid-feedback', wrap) : null;
    if (fb) {
      fb.textContent = message;
      fb.style.display = 'block';
    }
  }

  function validateEmail(value) {
    var v = String(value || '').trim();
    if (window.SDEmail) {
      return window.SDEmail.validate(v);
    }
    return { valid: FALLBACK_EMAIL_RE.test(v), message: 'Enter a valid email address.' };
  }

  function validateName(value) {
    var v = String(value || '').trim();
    if (window.SDName) {
      return window.SDName.validate(v);
    }
    if (!v) return { valid: false, message: 'Full name is required.' };
    if (v.length < 2) return { valid: false, message: 'Name must be at least 2 characters.' };
    return {
      valid: /^[A-Za-z]+(?:\s+[A-Za-z]+)*$/.test(v),
      message: 'Name can only contain letters (A–Z, a–z) and spaces.'
    };
  }

  function validatePassword(value) {
    var v = String(value || '');
    if (window.SDPassword) {
      return window.SDPassword.validate(v);
    }
    var FALLBACK_PASSWORD_RE = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
    return {
      valid: FALLBACK_PASSWORD_RE.test(v),
      message: 'Password must include an uppercase letter, a lowercase letter, a number, and a special character.'
    };
  }

  function clearError(input) {
    input.classList.remove('is-invalid');
    var wrap = input.closest('.auth-field');
    var fb = wrap ? qs('.invalid-feedback', wrap) : null;
    if (fb) {
      fb.style.display = 'none';
      fb.textContent = '';
    }
  }

  qsa('.auth-form .form-control').forEach(function (input) {
    input.addEventListener('input', function () {
      clearError(input);
    });
  });

  var resetRoleError = function () {
    var group = qs('#roleGroup');
    if (group) group.classList.remove('is-invalid');
  };

  function understandRole() {
    var r = qs('input[name="role"]:checked');
    return r ? r.value : null;
  }

  function validateRole() {
    var group = qs('#roleGroup');
    var role = understandRole();
    if (!role && group) group.classList.add('is-invalid');
    return role;
  }

  qsa('.auth-form .auth-role__input').forEach(function (radio) {
    radio.addEventListener('change', resetRoleError);
  });

  var remember = qs('#rememberMe');
  if (remember) {
    remember.addEventListener('change', function () {
      var options = qs('#authOptions');
      if (options) options.classList.remove('is-invalid');
    });
  }

  /* ---------- Consent checkbox clears its error ---------- */
  var consent = qs('#agreeTerms');
  if (consent) {
    consent.addEventListener('change', function () {
      var group = qs('#consentGroup');
      if (group) group.classList.remove('is-invalid');
    });
  }

  /* ---------- Login ---------- */
  var loginForm = qs('#loginForm');
  if (loginForm) {
    var REMEMBER_KEY = 'sd_remember';

    try {
      var saved = JSON.parse(localStorage.getItem(REMEMBER_KEY) || 'null');
      if (saved && saved.email) {
        var mailField = qs('#loginEmail');
        if (mailField) mailField.value = saved.email;
        var roleInput = qs('input[name="role"][value="' + saved.role + '"]');
        if (roleInput) roleInput.checked = true;
        var rem = qs('#rememberMe');
        if (rem) rem.checked = true;
      }
    } catch (e) { /* ignore restore failures */ }

    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      e.stopPropagation();

      var role = validateRole();
      var email = qs('#loginEmail');
      var pass = qs('#loginPassword');
      var remember = qs('#rememberMe');
      var ok = true;

      var check = validateEmail(email.value);
      if (!check.valid) {
        setError(email, check.message);
        ok = false;
      }

      if (!pass.value) {
        setError(pass, 'Password is required.');
        ok = false;
      } else {
        var loginPassCheck = validatePassword(pass.value);
        if (!loginPassCheck.valid) {
          setError(pass, loginPassCheck.message);
          ok = false;
        }
      }

      if (remember && !remember.checked) {
        var authOptions = qs('#authOptions');
        if (authOptions) authOptions.classList.add('is-invalid');
        ok = false;
      }

      if (!role || !ok) return;

      try {
        if (remember && remember.checked) {
          localStorage.setItem(REMEMBER_KEY, JSON.stringify({ role: role, email: email.value.trim() }));
        }
      } catch (e2) { /* storage unavailable */ }

      var account = findAccount(email.value.trim(), role);
      writeSession({
        name: account ? account.name : deriveName(email.value.trim()),
        email: email.value.trim(),
        role: role
      });

      window.location.href = ROLE_DASH[role];
    });
  }

  /* ---------- Signup ---------- */
  var signupForm = qs('#signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      e.stopPropagation();

      var role = validateRole();
      var name = qs('#signupName');
      var email = qs('#signupEmail');
      var pass = qs('#signupPassword');
      var confirm = qs('#signupConfirm');
      var ok = true;

      var checkName = validateName(name.value);
      if (!checkName.valid) {
        setError(name, checkName.message);
        ok = false;
      }

      var check = validateEmail(email.value);
      if (!check.valid) {
        setError(email, check.message);
        ok = false;
      }

      if (!pass.value) {
        setError(pass, 'Password is required.');
        ok = false;
      } else {
        var passCheck = validatePassword(pass.value);
        if (!passCheck.valid) {
          setError(pass, passCheck.message);
          ok = false;
        }
      }

      if (!confirm.value) {
        setError(confirm, 'Confirm your password.');
        ok = false;
      } else if (confirm.value !== pass.value) {
        setError(confirm, 'Passwords do not match.');
        ok = false;
      }

      if (!consent.checked) {
        var consentGroup = qs('#consentGroup');
        if (consentGroup) consentGroup.classList.add('is-invalid');
        ok = false;
      }

      if (!role || !ok) return;

      var users = readUsers();
      var userKey = email.value.trim().toLowerCase() + '|' + role;
      users[userKey] = {
        name: name.value.trim(),
        email: email.value.trim(),
        role: role
      };
      writeUsers(users);
      writeSession(users[userKey]);

      window.location.href = ROLE_DASH[role];
    });
  }

  /* ---------- Forgot password modal ---------- */
  var forgotBtn = qs('#forgotSend');
  if (forgotBtn) {
    forgotBtn.addEventListener('click', function () {
      var email = qs('#forgotEmail');
      var err = qs('#forgotError');
      var success = qs('#forgotSuccess');

      if (!email || !validateEmail(email.value).valid) {
        if (email) email.classList.add('is-invalid');
        if (err) {
          err.textContent = email && email.value.trim() ? validateEmail(email.value).message : 'Enter a valid email address.';
          err.style.display = 'block';
        }
        return;
      }

      email.classList.remove('is-invalid');
      if (err) err.style.display = 'none';
      if (success) success.style.display = 'block';
      forgotBtn.disabled = true;
      if (email) email.disabled = true;
    });
  }
})();