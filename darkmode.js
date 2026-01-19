// darkmode.js
// Shared dark mode toggle for all pages.
// Works with buttons: #themeToggle (desktop) and #themeToggleMobile (inside hamburger).

document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "bookify-theme";
  const buttons = Array.from(
    document.querySelectorAll("#themeToggle, #themeToggleMobile")
  );

  // If a page doesn't have toggles, do nothing
  if (buttons.length === 0) return;

  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  function setIcons() {
    const isDark = document.body.classList.contains("dark");
    buttons.forEach((btn) => {
      btn.textContent = isDark ? "☀️" : "🌙";
    });
  }

  function applyTheme(theme) {
    document.body.classList.toggle("dark", theme === "dark");
    document.documentElement.dataset.theme = theme;
    setIcons();
  }

  // Init theme from storage (fallback to OS preference)
  const saved = localStorage.getItem(STORAGE_KEY);
  const initial = saved || (prefersDark ? "dark" : "light");
  applyTheme(initial);

  // Toggle on click + persist
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = document.body.classList.contains("dark") ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
    });
  });
});
