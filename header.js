document.addEventListener("DOMContentLoaded", () => {
  const burgerButton = document.getElementById("bfBurger");
  const navMenu = document.querySelector(".bf-nav");

  if (burgerButton && navMenu) {
    burgerButton.setAttribute("aria-expanded", "false");

    const isMenuOpen = () => navMenu.classList.contains("is-open");

    function openMenu() {
      navMenu.classList.add("is-open");
      burgerButton.setAttribute("aria-expanded", "true");
    }

    function closeMenu() {
      navMenu.classList.remove("is-open");
      burgerButton.setAttribute("aria-expanded", "false");
    }

    function toggleMenu() {
      isMenuOpen() ? closeMenu() : openMenu();
    }

    burgerButton.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    navMenu.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (link) closeMenu();
    });

    document.addEventListener("click", (e) => {
      if (!isMenuOpen()) return;
      if (navMenu.contains(e.target) || burgerButton.contains(e.target)) return;
      closeMenu();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
  }

  const footerAccordions = Array.from(document.querySelectorAll("details.foot-acc"));
  if (footerAccordions.length > 0) {
    const desktopQuery = window.matchMedia("(min-width: 1025px)");
    let lastDesktopState = desktopQuery.matches;

    function syncFooterAccordions(force) {
      const isDesktop = desktopQuery.matches;

      if (force || isDesktop !== lastDesktopState) {
        footerAccordions.forEach((d) => {
          d.open = isDesktop ? true : false;
        });
        lastDesktopState = isDesktop;
      }
    }

    syncFooterAccordions(true);
    desktopQuery.addEventListener("change", () => syncFooterAccordions(false));
  }
});
