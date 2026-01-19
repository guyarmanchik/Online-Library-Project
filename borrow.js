// Read id from URL: borrow.html?id=3
const params = new URLSearchParams(window.location.search);
const bookId = Number(params.get("id")) || 1;

fetch("./books.json")
  .then((res) => res.json())
  .then((books) => {
    const book = books.find((b) => b.id === bookId);
    
    // ===== Save recently viewed books =====
    const HISTORY_KEY = "recentBooks";

    let recentBooks = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];

    // remove current book if already exists
    recentBooks = recentBooks.filter(id => id !== bookId);

    // add current book to beginning
    recentBooks.unshift(bookId);

    // keep only last 3
    recentBooks = recentBooks.slice(0, 3);

    // save back to localStorage
    localStorage.setItem(HISTORY_KEY, JSON.stringify(recentBooks));


    if (!book) {
      document.body.innerHTML = "<h2 style='padding:20px'>Book not found</h2>";
      return;
    }

    // Fill hero
    document.getElementById("bookTitle").textContent = book.title;
    document.getElementById("bookAuthor").textContent = book.author;
    document.getElementById("bookCategory").textContent = book.category;

    // Info card
    const cat2 = document.getElementById("bookCategory2");
    if (cat2) cat2.textContent = book.category;

    document.getElementById("bookIsbn").textContent = book.isbn;
    document.getElementById("bookYear").textContent = book.year;
    document.getElementById("bookLanguage").textContent = book.language;

    // Description
    const descEl = document.getElementById("bookDescription");
    const toggleBtn = document.getElementById("toggleDescBtn");
    descEl.textContent = book.description || "";

    let isExpanded = false;

    function renderDescToggle() {
      if (!book.description || book.description.length < 160) {
        toggleBtn.style.display = "none";
        descEl.classList.remove("desc-text--clamp");
        return;
      }
      toggleBtn.style.display = "inline-flex";
      descEl.classList.toggle("desc-text--clamp", !isExpanded);
      toggleBtn.textContent = isExpanded ? "Read less" : "Read more";
    }

    toggleBtn.addEventListener("click", () => {
      isExpanded = !isExpanded;
      renderDescToggle();
    });

    // ===== Render Recently Viewed =====
    const historyList = document.getElementById("historyList");

    function renderRecentlyViewed() {
      if (!historyList) return;

      const recentIds = JSON.parse(localStorage.getItem("recentBooks")) || [];

      const recentBooks = recentIds
        .map(id => books.find(b => b.id === id))
        .filter(Boolean);

      if (recentBooks.length === 0) {
        historyList.innerHTML = `
      <li class="history__empty">
        No items yet. Browse books to build history.
      </li>`;
        return;
      }

      historyList.innerHTML = recentBooks.map(book => `
    <li class="history__item">
      <a href="borrow.html?id=${book.id}" class="history__card">
        <img src="${book.cover}" alt="${book.title}" class="history__img">
        <div class="history__info">
          <div class="history__title">${book.title}</div>
          <div class="history__author">${book.author}</div>
        </div>
      </a>
    </li>
  `).join("");
    }

    // קריאה לפונקציה
    renderRecentlyViewed();


    renderDescToggle();

    // Cover
    const coverImg = document.getElementById("bookCover");
    coverImg.src = book.cover || "images/placeholder-cover.png";

    // ID
    const idEl = document.getElementById("bookId");
    if (idEl) idEl.textContent = book.id;

    // Status
    const statusEl = document.getElementById("bookStatus");
    const hintEl = document.getElementById("bookAvailabilityText");

    // Buttons + message
    const borrowBtn = document.getElementById("borrowBtn");
    const returnBtn = document.getElementById("returnBtn");
    const msgEl = document.getElementById("systemMessage");

    function showMessage(text) {
      msgEl.textContent = text;
      msgEl.style.opacity = "1";
      clearTimeout(window._msgTimer);
      window._msgTimer = setTimeout(() => {
        msgEl.style.opacity = "0";
      }, 2500);
    }

    function renderAvailability() {
      if (book.available) {
        statusEl.textContent = "Available";
        statusEl.className = "badge badge--available";
        hintEl.textContent = "Ready to borrow now";

        borrowBtn.disabled = false;
        returnBtn.disabled = true;

        borrowBtn.className = "book-btn book-btn--primary";
        returnBtn.className = "book-btn book-btn--ghost";
      } else {
        statusEl.textContent = "Borrowed";
        statusEl.className = "badge badge--borrowed";
        hintEl.textContent = "This book is currently borrowed";

        borrowBtn.disabled = true;
        returnBtn.disabled = false;

        borrowBtn.className = "book-btn book-btn--ghost";
        returnBtn.className = "book-btn book-btn--return-active";
      }
    }

    renderAvailability();

    borrowBtn.addEventListener("click", () => {
      if (!book.available) return;
      book.available = false;
      showMessage("✅ Book borrowed successfully.");
      renderAvailability();
    });

    returnBtn.addEventListener("click", () => {
      if (book.available) return;
      book.available = true;
      showMessage("✅ Book returned successfully.");
      renderAvailability();
    });

    // ===== Zoom follows mouse (single clean version) =====
    const coverWrap = document.getElementById("coverWrap");

    if (coverWrap && coverImg) {
      coverWrap.addEventListener("mousemove", (e) => {
        const rect = coverWrap.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        coverImg.style.transformOrigin = `${x}% ${y}%`;
        coverWrap.classList.add("zoom");
      });

      coverWrap.addEventListener("mouseleave", () => {
        coverWrap.classList.remove("zoom");
        coverImg.style.transformOrigin = "50% 50%";
      });
    }
  })
  .catch(() => {
    document.body.innerHTML =
      "<h2 style='padding:20px'>Error loading books.json</h2>";
  });
// ===== Hamburger (Borrow page) =====
document.addEventListener("DOMContentLoaded", () => {
  const burger = document.getElementById("bfBurger");
  const nav = document.querySelector(".bf-nav");
  if (!burger || !nav) return;

  burger.addEventListener("click", () => {
    nav.classList.toggle("is-open");
  });

  // close after clicking a link
  nav.addEventListener("click", (e) => {
    if (e.target.classList.contains("bf-nav__link")) {
      nav.classList.remove("is-open");
    }
  });
});
