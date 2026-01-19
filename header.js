// header.js
document.addEventListener("DOMContentLoaded", () => {
  const burger = document.getElementById("bfBurger");
  const nav = document.querySelector(".bf-nav");

  // אם בעמוד אין המבורגר/ניווט - לא עושים כלום
  if (!burger || !nav) return;

  // נגישות
  burger.setAttribute("aria-expanded", "false");

  function openMenu() {
    nav.classList.add("is-open");
    burger.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    nav.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
  }

  function toggleMenu() {
    nav.classList.contains("is-open") ? closeMenu() : openMenu();
  }

  burger.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // סגירה בלחיצה על לינק בתפריט
  nav.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (link) closeMenu();
  });

  // סגירה בלחיצה מחוץ לתפריט
  document.addEventListener("click", (e) => {
    if (!nav.classList.contains("is-open")) return;
    if (nav.contains(e.target) || burger.contains(e.target)) return;
    closeMenu();
  });

  // סגירה ב-ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
});
