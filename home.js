document.addEventListener("DOMContentLoaded", () => {
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

  if (catPrev) {
    catPrev.addEventListener("click", () => {
      catIndex = (catIndex - 1 + categories.length) % categories.length;
      renderCategory();
    });
  }

  if (catNext) {
    catNext.addEventListener("click", () => {
      catIndex = (catIndex + 1) % categories.length;
      renderCategory();
    });
  }

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

  if (heroPrev) {
    heroPrev.addEventListener("click", () => {
      heroIndex = (heroIndex - 1 + heroImages.length) % heroImages.length;
      renderHero();
    });
  }

  if (heroNext) {
    heroNext.addEventListener("click", () => {
      heroIndex = (heroIndex + 1) % heroImages.length;
      renderHero();
    });
  }

  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  const searchStatus = document.getElementById("searchStatus");

  if (searchForm && searchInput) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const query = searchInput.value.trim();
      if (!query) {
        if (searchStatus) searchStatus.textContent = "Type something to search 🙂";
        searchInput.focus();
        return;
      }

      window.location.href = `catalog.html?q=${encodeURIComponent(query)}`;
    });
  }

  renderCategory();
  renderHero();
});
