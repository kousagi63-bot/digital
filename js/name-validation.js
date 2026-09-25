/* =========================================================
   STACKLY DIGITAL — Shared name validation
   Used across the whole website (signup, contact, settings).
   Rules:
     - only letters (A–Z, a–z) and spaces are allowed
     - numbers, symbols and special characters are rejected
     - at least two letters
   Exposes window.SDName.validate(value) -> { valid, message }
   ========================================================= */
(function () {
  "use strict";

  var NAME_RE = /^[A-Za-z]+(?:\s+[A-Za-z]+)*$/;

  function validate(value) {
    var v = String(value || "").trim();

    if (!v) {
      return { valid: false, message: "Name is required." };
    }

    if (v.length < 2) {
      return { valid: false, message: "Name must be at least 2 characters." };
    }

    if (!NAME_RE.test(v)) {
      return {
        valid: false,
        message: "Name can only contain letters (A–Z, a–z) and spaces.",
      };
    }

    return { valid: true, message: "" };
  }

  window.SDName = { validate: validate };
})();