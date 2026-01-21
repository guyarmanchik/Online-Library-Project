
document.addEventListener("DOMContentLoaded", () => {
  // ===== Category of the Week =====
  const categories = [
    { title: "Fantasy", desc: "Magic, adventures, and unforgettable worlds." },
    { title: "Fiction", desc: "Stories that move you, surprise you, and stay with you." },
    { title: "Self-Improvement", desc: "Small steps that create big changes over time." },
    { title: "Mystery", desc: "Clues, twists, and page-turning suspense." },
    { title: "Science Fiction", desc: "Future worlds, technology, and big ideas." },
  ];

  let catIndex = 0;
  const categoryTitle = document.getElementById("categoryTitle");
  const categoryDesc = document.getElementById("categoryDesc");
  const catPrev = document.getElementById("catPrev");
  const catNext = document.getElementById("catNext");

  function renderCategory() {
    if (!categoryTitle || !categoryDesc) return;
    categoryTitle.textContent = categories[catIndex].title;
    categoryDesc.textContent = categories[catIndex].desc;
  }

  if (catPrev && catNext) {
    catPrev.addEventListener("click", () => {
      catIndex = (catIndex - 1 + categories.length) % categories.length;
      renderCategory();
    });

    catNext.addEventListener("click", () => {
      catIndex = (catIndex + 1) % categories.length;
      renderCategory();
    });
  }

  // ===== Hero image carousel =====
  const heroImages = [
    "images/library.jpg",
    "images/librarybackground.avif",
    "images/niceBook.jpg",
  ];

  let heroIndex = 0;
  const heroImg = document.getElementById("heroImg");
  const heroPrev = document.getElementById("heroPrev");
  const heroNext = document.getElementById("heroNext");

  function renderHero() {
    if (!heroImg) return;
    heroImg.src = heroImages[heroIndex];
  }

  if (heroPrev && heroNext) {
    heroPrev.addEventListener("click", () => {
      heroIndex = (heroIndex - 1 + heroImages.length) % heroImages.length;
      renderHero();
    });

    heroNext.addEventListener("click", () => {
      heroIndex = (heroIndex + 1) % heroImages.length;
      renderHero();
    });
  }

  // ===== init =====
  renderCategory();
  renderHero();
});