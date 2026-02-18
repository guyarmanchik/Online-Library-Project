document.addEventListener("DOMContentLoaded", () => {
  const EMPTY_CATEGORY_MESSAGE = `
    <div class="catalog-error">
      <h3>Nothing here yet 📚</h3>
      <p>
        We don’t have any books in this category at the moment.<br>
        New titles are being added regularly — stay tuned!
      </p>
    </div>
  `;

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const chipsWrap = document.getElementById("chips");
  const searchInput = document.getElementById("q");
  const grid = document.getElementById("grid");
  const countEl = document.getElementById("visibleCount");

  const params = new URLSearchParams(window.location.search);
  const initialSearch = (params.get("q") || "").trim();
  if (initialSearch && searchInput) searchInput.value = initialSearch;

  let activeGenre = "All";
  let allBooks = [];

  const BORROWED_KEY = "bookify_borrowed";

  function readStorage(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function isBookBorrowed(bookId) {
    const borrowed = readStorage(BORROWED_KEY, []);
    return borrowed.some((x) => Number(x.id) === Number(bookId));
  }

  function mapCategory(raw) {
    const c = (raw || "").trim().toLowerCase();

    if (c === "self-improvement" || c === "self-help") return "Self-Help";
    if (c === "fantasy") return "Fantasy";
    if (c === "young adult") return "Young Adult";
    if (c === "mystery") return "Mystery";
    if (c === "romance") return "Romance";

    return "Fiction";
  }

  function normalizeCoverPath(path) {
    if (!path) return "images/placeholder-cover.png";
    if (path.startsWith("/images/")) return path.slice(1);
    return path;
  }

  function escapeHtml(value) {
    return String(value)
      .split("&").join("&amp;")
      .split("<").join("&lt;")
      .split(">").join("&gt;")
      .split('"').join("&quot;")
      .split("'").join("&#039;");
  }

  function pseudoRating(book) {
    const base = 4.2;
    const bump = ((Number(book.id) || 1) % 7) * 0.1;
    return (base + bump).toFixed(1);
  }

  function createCard(book) {
    const title = book.title || "Untitled";
    const author = book.author || "Unknown";
    const cover = normalizeCoverPath(book.cover);

    const available = !isBookBorrowed(book.id);
    const rating = pseudoRating(book);

    return `
      <article
        class="book-card"
        data-id="${escapeHtml(book.id)}"
        role="button"
        tabindex="0"
        aria-label="Open details for ${escapeHtml(title)}"
      >
        <div class="book-cover">
          <img
            src="${cover}"
            alt="${escapeHtml(title)} cover"
            loading="lazy"
            decoding="async"
            onerror="this.src='images/placeholder-cover.png'"
          >
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
    const term = (searchInput?.value || "").toLowerCase().trim();

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
      const goToDetails = () => {
        const id = card.dataset.id;
        window.location.href = `borrow.html?id=${encodeURIComponent(id)}`;
      };

      card.addEventListener("click", goToDetails);

      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToDetails();
        }
      });
    });
  }

  function applyFilters() {
    renderBooks(getFilteredBooks());
  }

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

  if (searchInput) searchInput.addEventListener("input", applyFilters);

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

  window.addEventListener("focus", applyFilters);
});
