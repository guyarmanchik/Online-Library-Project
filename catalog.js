document.addEventListener("DOMContentLoaded", () => {
  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const chipsWrap = document.getElementById("chips");
  const q = document.getElementById("q");
  const grid = document.getElementById("grid");
  const countEl = document.getElementById("visibleCount");

  let activeGenre = "All";

  function mapCategory(raw) {
    const c = (raw || "").trim();
    if (c.toLowerCase() === "self-improvement") return "Self-Help";
    return c || "Fiction";
  }

  function normalizeCoverPath(path) {
    if (!path) return "images/placeholder-cover.png";
    if (path.startsWith("/images/")) return path.slice(1); // "/images/x" -> "images/x"
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
    const available = !!book.available;
    const rating = pseudoRating(book);

    return `
      <article class="book-card"
        data-title="${escapeHtml(title)}"
        data-author="${escapeHtml(author)}"
        data-genre="${escapeHtml(genre)}">
        <div class="book-cover">
          <img src="${cover}" alt="${escapeHtml(title)} cover"
               onerror="this.src='images/placeholder-cover.png'">
        </div>
        <h3 class="book-title">${escapeHtml(title)}</h3>
        <p class="book-author">${escapeHtml(author)}</p>
        <div class="book-meta">
          <div class="book-rating"><span class="star">★</span><span>${rating}</span></div>
          <span class="book-badge ${available ? "" : "book-badge--off"}">
            ${available ? "Available" : "Unavailable"}
          </span>
        </div>
      </article>
    `;
  }

  function applyFilters() {
    const term = (q?.value || "").toLowerCase().trim();
    const cards = Array.from(document.querySelectorAll(".book-card"));
    let visible = 0;

    cards.forEach((card) => {
      const genre = card.dataset.genre || "";
      const title = (card.dataset.title || "").toLowerCase();
      const author = (card.dataset.author || "").toLowerCase();

      const matchGenre = activeGenre === "All" || genre === activeGenre;
      const matchSearch = !term || title.includes(term) || author.includes(term);

      const show = matchGenre && matchSearch;
      card.style.display = show ? "" : "none";
      if (show) visible++;
    });

    if (countEl) countEl.textContent = String(visible);
  }

  function renderBooks(list) {
    if (!grid) return;
    grid.innerHTML = list.map(createCard).join("");
    applyFilters();
  }

  // Chips click (event delegation)
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

  // Search
  if (q) q.addEventListener("input", applyFilters);

  // Load books.json
  fetch("books.json", { cache: "no-store" })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status} (${res.statusText})`);
      return res.json();
    })
    .then((data) => {
      if (!Array.isArray(data)) throw new Error("books.json is not an array");
      renderBooks(data);
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
});
