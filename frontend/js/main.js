// =====================================================
// ALGOLAB - main.js
// Shared behavior used across all pages (navbar, etc.)
// This file does NOT contain any algorithm logic.
// =====================================================

// Wait until the HTML is fully loaded before touching the DOM
document.addEventListener("DOMContentLoaded", function () {

  // ---- Mobile navigation toggle ----
  // On small screens, the nav links are hidden until the
  // hamburger button (#nav-toggle) is clicked.
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      navLinks.classList.toggle("open");
    });
  }

});
