/* =========================================================
   STACKLY DIGITAL — Shared email validation
   Used across the whole website (login, signup, contact,
   newsletter, dashboard settings).
   Rules:
     - only letters, numbers, "@" and "." are allowed
     - exactly one "@"
     - a valid domain + extension required (e.g. .com, .in, .org)
   Exposes window.SDEmail.validate(value) -> { valid, message }
   ========================================================= */
(function () {
  "use strict";

  var ALLOWED_RE = /^[A-Za-z0-9@.]+$/;
  var DOMAIN_RE = /^[A-Za-z0-9][A-Za-z0-9.\-]*\.[A-Za-z]{2,}$/;

  function splitAt(value) {
    var parts = value.split("@");
    return { local: parts[0] || "", domain: parts[1] || "", count: parts.length - 1 };
  }

  function validateDomain(domain) {
    if (!DOMAIN_RE.test(domain)) return false;
    var labels = domain.split(".");
    var tld = labels[labels.length - 1];
    return /^[A-Za-z]{2,}$/.test(tld) && labels[0].length > 0;
  }

  function validate(value) {
    var v = String(value || "").trim();

    if (!v) {
      return { valid: false, message: "Email is required." };
    }

    if (!ALLOWED_RE.test(v)) {
      return { valid: false, message: "Only letters, numbers, @ and dots are allowed." };
    }

    var parts = splitAt(v);
    if (parts.count !== 1) {
      return { valid: false, message: "Email must contain exactly one @ symbol." };
    }

    if (!parts.local || /^\.|\.$|\.\./.test(parts.local)) {
      return { valid: false, message: "Enter a valid email address." };
    }

    if (!validateDomain(parts.domain)) {
      return {
        valid: false,
        message: "Email needs a valid domain and extension, e.g. name@example.com.",
      };
    }

    return { valid: true, message: "" };
  }

  window.SDEmail = { validate: validate };
})();