document.addEventListener("DOMContentLoaded", () => {
  const THEME_STORAGE_KEY = "bookify-theme";
  const toggleButtons = Array.from(
    document.querySelectorAll("#themeToggle, #themeToggleMobile")
  );

  const prefersDarkMode =
    window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;

  function isDarkModeActive() {
    return document.body.classList.contains("dark");
  }

  function updateToggleIcons() {
    if (toggleButtons.length === 0) return;
    const icon = isDarkModeActive() ? "☀️" : "🌙";
    toggleButtons.forEach((btn) => (btn.textContent = icon));
  }

  function applyTheme(theme) {
    const isDark = theme === "dark";
    document.body.classList.toggle("dark", isDark);
    document.documentElement.dataset.theme = theme;
    updateToggleIcons();
  }

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const initialTheme = savedTheme || (prefersDarkMode ? "dark" : "light");
  applyTheme(initialTheme);

  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const nextTheme = isDarkModeActive() ? "light" : "dark";
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      applyTheme(nextTheme);
    });
  });
});
