/*
  landing.js
  - Handles theme persistence (light/dark) using localStorage.
  - Adds smooth scroll behavior for “Learn More” without heavy animation.
  - Keeps logic self-contained and safe (no backend dependencies).
*/

(() => {
  const STORAGE_KEY = "ai-dashboard-theme";
  const root = document.documentElement;

  const getInitialTheme = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  };

  const applyTheme = (theme) => {
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  };

  const setTheme = (theme) => {
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
    syncThemeUI(theme);
  };

  const toggleTheme = () => {
    const current = root.classList.contains("dark") ? "dark" : "light";
    setTheme(current === "dark" ? "light" : "dark");
  };

  const syncThemeUI = (theme) => {
    const label = document.querySelector("[data-theme-label]");
    const icon = document.querySelector("[data-theme-icon]");
    const btn = document.querySelector("[data-theme-toggle]");

    if (label) label.textContent = theme === "dark" ? "Dark" : "Light";
    if (icon) icon.setAttribute("data-icon", theme);
    if (btn) btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  };

  // Initial theme (prevents mismatch if this file loads after paint)
  const initialTheme = getInitialTheme();
  applyTheme(initialTheme);

  // Wire toggle
  const themeBtn = document.querySelector("[data-theme-toggle]");
  if (themeBtn) {
    themeBtn.addEventListener("click", toggleTheme);
    syncThemeUI(initialTheme);
  }

  // Smooth scroll helper for “Learn More” and in-page links
  const scrollToSelector = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    const btn = target.closest("[data-scroll]");
    if (btn) {
      e.preventDefault();
      const selector = btn.getAttribute("data-scroll");
      if (selector) scrollToSelector(selector);
      return;
    }

    // Keep anchor navigation clean and smooth (same-page only)
    const link = target.closest("a[href^=\"#\"]");
    if (link) {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;
      const el = document.querySelector(href);
      if (!el) return;
      e.preventDefault();
      scrollToSelector(href);
    }
  });

  // Header elevation on scroll (subtle)
  const header = document.querySelector("[data-header]");
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 6);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Footer year
  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();

