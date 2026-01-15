// darkmode.js
// Shared dark mode toggle for all pages.
// Requires a button with id="themeToggle" somewhere in the DOM.

document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "bookify-theme";
  const btn = document.getElementById("themeToggle");

  // If a page doesn't have the toggle, just do nothing (no errors).
  // (This page DOES have the toggle, so your current flow is fine.)
  if (!btn) return;

  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  function setIcon() {
    btn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
  }

  function applyTheme(theme) {
    // Toggle class (what you already use)
    document.body.classList.toggle("dark", theme === "dark");

    // ALSO set a data attribute on <html> so CSS can target it
    document.documentElement.dataset.theme = theme;

    setIcon();
  }

  // Init theme from storage (fallback to OS preference)
  const saved = localStorage.getItem(STORAGE_KEY);
  const initial = saved || (prefersDark ? "dark" : "light");
  applyTheme(initial);

  // Toggle on click + persist
  btn.addEventListener("click", () => {
    const next = document.body.classList.contains("dark") ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  });
});
