// =====================================================
// ALGOLAB - main.js
// Shared navigation & sidebar controller for ALGOLAB
// This file does NOT contain any algorithm logic.
// =====================================================

function initSidebarController() {
  const navToggle = document.getElementById("nav-toggle");
  const sidebar = document.getElementById("app-sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  const closeBtn = document.getElementById("sidebar-close-btn");

  function openSidebar() {
    if (sidebar) sidebar.classList.add("open");
    if (backdrop) backdrop.classList.add("active");
    document.body.classList.add("sidebar-open");
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", "true");
    }
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove("open");
    if (backdrop) backdrop.classList.remove("active");
    document.body.classList.remove("sidebar-open");
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", "false");
    }
  }

  if (navToggle) {
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-controls", "app-sidebar");
    navToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      if (sidebar && sidebar.classList.contains("open")) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      closeSidebar();
    });
  }

  if (backdrop) {
    backdrop.addEventListener("click", function () {
      closeSidebar();
    });
  }

  // Close sidebar when clicking outside of it
  document.addEventListener("click", function (e) {
    if (
      sidebar &&
      sidebar.classList.contains("open") &&
      !sidebar.contains(e.target) &&
      navToggle &&
      !navToggle.contains(e.target)
    ) {
      closeSidebar();
    }
  });

  // Auto-close drawer when any navigation link inside sidebar is clicked
  if (sidebar) {
    const links = sidebar.querySelectorAll("a");
    links.forEach(function (link) {
      link.addEventListener("click", function () {
        closeSidebar();
      });
    });
  }

  // Escape key closes sidebar drawer and restores focus
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && sidebar && sidebar.classList.contains("open")) {
      closeSidebar();
      if (navToggle) {
        navToggle.focus();
      }
    }
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSidebarController);
  } else {
    initSidebarController();
  }
}
