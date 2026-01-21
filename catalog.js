document.addEventListener("DOMContentLoaded", () => {
  // ===== Empty state message =====
  const EMPTY_CATEGORY_MESSAGE = `
    <div class="catalog-error">
      <h3>Nothing here yet 📚</h3>
      <p>
        We don’t have any books in this category at the moment.<br>
        New titles are being added regularly — stay tuned!
      </p>
    </div>
  `;

  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const chipsWrap = document.getElementById("chips");
  const q = document.getElementById("q");
  const grid = document.getElementById("grid");
  const countEl = document.getElementById("visibleCount");

  let activeGenre = "All";
  let allBooks = [];

  // ===== STORAGE HELPERS (sync status with profile/borrow) =====
  // ✅ MUST MATCH profile.js
  const BORROWED_KEY = "bookify_borrowed"; // [{id,title,author,cover,borrowedAt,...}]

  function load(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }

  // ✅ book considered borrowed if its id exists in bookify_borrowed
  function isBorrowed(bookId) {
    const borrowed = load(BORROWED_KEY, []);
    return borrowed.some((x) => Number(x.id) === Number(bookId));
  }

  function mapCategory(raw) {
    const c = (raw || "").trim().toLowerCase();

    if (c === "self-improvement" || c === "self-help") return "Self-Help";
    if (c === "fantasy") return "Fantasy";
    if (c === "young adult") return "Young Adult";
    if (c === "mystery") return "Mystery";
    if (c === "romance") return "Romance";

    // default
    return "Fiction";
  }

  function normalizeCoverPath(path) {
    if (!path) return "images/placeholder-cover.png";
    if (path.startsWith("/images/")) return path.slice(1);
    return path;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function pseudoRating(book) {
    const base = 4.2;
    const bump = ((Number(book.id) || 1) % 7) * 0.1;
    return (base + bump).toFixed(1);
  }

  function createCard(book) {
    const title = book.title || "Untitled";
    const author = book.author || "Unknown";
    const genre = mapCategory(book.category);
    const cover = normalizeCoverPath(book.cover);

    // ✅ Availability synced with localStorage bookify_borrowed
    const available = !isBorrowed(book.id);

    const rating = pseudoRating(book);

    return `
      <article class="book-card"
        data-id="${book.id}"
        role="button"
        tabindex="0"
        aria-label="Open details for ${escapeHtml(title)}"
      >
        <div class="book-cover">
          <img src="${cover}" alt="${escapeHtml(title)} cover"
               loading="lazy"
               decoding="async"
               onerror="this.src='images/placeholder-cover.png'">
        </div>
        <h3 class="book-title">${escapeHtml(title)}</h3>
        <p class="book-author">${escapeHtml(author)}</p>
        <div class="book-meta">
          <div class="book-rating">
            <span class="star">★</span><span>${rating}</span>
          </div>
          <span class="book-badge ${available ? "" : "book-badge--off"}">
            ${available ? "Available" : "Unavailable"}
          </span>
        </div>
      </article>
    `;
  }

  function getFilteredBooks() {
    const term = (q?.value || "").toLowerCase().trim();

    return allBooks.filter((book) => {
      const genre = mapCategory(book.category);
      const title = (book.title || "").toLowerCase();
      const author = (book.author || "").toLowerCase();

      const matchGenre = activeGenre === "All" || genre === activeGenre;
      const matchSearch = !term || title.includes(term) || author.includes(term);

      return matchGenre && matchSearch;
    });
  }

  function renderBooks(list) {
    if (!grid) return;

    if (countEl) countEl.textContent = String(list.length);

    if (list.length === 0) {
      grid.innerHTML = EMPTY_CATEGORY_MESSAGE;
      return;
    }

    grid.innerHTML = list.map(createCard).join("");

    grid.querySelectorAll(".book-card").forEach((card) => {
      const go = () => {
        const id = card.dataset.id;
        window.location.href = `borrow.html?id=${id}`;
      };

      card.addEventListener("click", go);

      // keyboard support (Enter/Space)
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go();
        }
      });
    });
  }

  function applyFilters() {
    const filtered = getFilteredBooks();
    renderBooks(filtered);
  }

  // chips filters
  if (chipsWrap) {
    chipsWrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;

      chipsWrap.querySelectorAll(".chip").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      activeGenre = btn.dataset.filter || "All";
      applyFilters();
    });
  }

  // search
  if (q) q.addEventListener("input", applyFilters);

  // load books
  fetch("books.json", { cache: "no-store" })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status} (${res.statusText})`);
      return res.json();
    })
    .then((data) => {
      if (!Array.isArray(data)) throw new Error("books.json is not an array");
      allBooks = data;
      applyFilters();
    })
    .catch((err) => {
      console.error("books.json load error:", err);

      if (grid) {
        grid.innerHTML = `
          <div class="catalog-error">
            Could not load <code>books.json</code>.<br/>
            <small>${escapeHtml(err.message)}</small><br/><br/>
            ✅ Fix: Open <b>catalog.html</b> with <b>Live Server</b> (not file://).<br/>
            ✅ And make sure <b>books.json</b> is in the <b>same folder</b> as catalog.html.
          </div>
        `;
      }

      if (countEl) countEl.textContent = "0";
    });

  // ✅ bonus: refresh badges when tab becomes active
  window.addEventListener("focus", applyFilters);
});
