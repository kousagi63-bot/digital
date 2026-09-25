/* =========================================================
   STACKLY DIGITAL — Shared password validation
   Used across the whole website (signup + dashboard settings).
   Requirements:
     - at least one uppercase letter (A–Z)
     - at least one lowercase letter (a–z)
     - at least one numeric character (0–9)
     - at least one special character (e.g. @ # $ % !)
   Exposes window.SDPassword.validate(value) -> { valid, message }
   ========================================================= */
(function () {
  "use strict";

  var RE = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])[\s\S]+$/;

  function validate(value) {
    var v = String(value || "");

    if (!v) {
      return { valid: false, message: "Password is required." };
    }

    if (!RE.test(v)) {
      return {
        valid: false,
        message: "Password must include an uppercase letter, a lowercase letter, a number, and a special character.",
      };
    }

    return { valid: true, message: "" };
  }

  window.SDPassword = { validate: validate };
})();