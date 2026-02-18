document.addEventListener("DOMContentLoaded", () => {
  const BORROWED_KEY = "bookify_borrowed";
  const HISTORY_KEY = "bookify_history";
  const BOOKS_JSON = "books.json";
  const PLACEHOLDER_COVER = "images/placeholder-cover.png";

  const statBorrowed = document.getElementById("statBorrowed");
  const statOverdue = document.getElementById("statOverdue");
  const statReturned = document.getElementById("statReturned");

  const tabCurrent = document.getElementById("tabCurrent");
  const tabHistory = document.getElementById("tabHistory");

  const currentView = document.getElementById("currentView");
  const historyView = document.getElementById("historyView");

  const currentList = document.getElementById("currentList");
  const historyList = document.getElementById("historyList");

  const currentEmpty = document.getElementById("currentEmpty");
  const historyEmpty = document.getElementById("historyEmpty");

  const countCurrent = document.getElementById("countCurrent");
  const countHistory = document.getElementById("countHistory");

  function load(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US-u-nu-latn", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      timeZone: "Asia/Jerusalem",
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeCoverPath(path) {
    if (!path) return PLACEHOLDER_COVER;
    if (path.startsWith("/images/")) return path.slice(1);
    return path;
  }

  function setActiveTab(which) {
    const isCurrent = which === "current";

    tabCurrent?.classList.toggle("active", isCurrent);
    tabHistory?.classList.toggle("active", !isCurrent);

    currentView?.classList.toggle("hidden", !isCurrent);
    historyView?.classList.toggle("hidden", isCurrent);
  }

  async function loadBooksMap() {
    try {
      const res = await fetch(BOOKS_JSON, { cache: "no-store" });
      if (!res.ok) return new Map();
      const data = await res.json();
      if (!Array.isArray(data)) return new Map();
      return new Map(data.map((b) => [Number(b.id), b]));
    } catch {
      return new Map();
    }
  }

  function resolveBook(item, bookById) {
    const fromJson = bookById.get(Number(item.id));
    if (fromJson) return fromJson;

    return {
      id: item.id,
      title: item.title || "Unknown Book",
      author: item.author || "",
      category: item.category || "",
      cover: item.cover || "",
    };
  }

  function makeCoverImg(src, title) {
    const safeTitle = escapeHtml(title || "Book cover");
    const cover = normalizeCoverPath(src);
    return `
      <img
        class="cover"
        src="${cover}"
        alt="${safeTitle}"
        loading="lazy"
        decoding="async"
        onerror="this.src='${PLACEHOLDER_COVER}'"
      >
    `;
  }

  function renderCurrent(borrowed, bookById) {
    if (!currentList) return;

    const current = [...borrowed].sort(
      (a, b) => new Date(b.borrowedAt || 0) - new Date(a.borrowedAt || 0)
    );

    currentList.innerHTML = current
      .map((item) => {
        const book = resolveBook(item, bookById);
        const title = book.title || "Unknown Book";
        const author = book.author || "";
        const category = book.category || "";
        const meta = `${author ? `${author} • ` : ""}${category}`;

        return `
          <div class="book-card">
            ${makeCoverImg(book.cover, `${title} cover`)}
            <div>
              <p class="book-title">${escapeHtml(title)}</p>
              <p class="book-meta">${escapeHtml(meta)}</p>
              <div class="badges">
                <span class="badge">Borrowed: ${escapeHtml(formatDate(item.borrowedAt))}</span>
              </div>
            </div>
            <div class="actions">
              <button class="small-btn btn-return" type="button" data-return="${escapeHtml(item.id)}">Return</button>
              <a class="small-btn btn-details" href="borrow.html?id=${encodeURIComponent(item.id)}">Details</a>
            </div>
          </div>
        `;
      })
      .join("");

    currentList.querySelectorAll("[data-return]").forEach((btn) => {
      btn.addEventListener("click", () => handleReturn(btn.dataset.return));
    });
  }

  function renderHistory(history, bookById) {
    if (!historyList) return;

    const sorted = [...history].sort(
      (a, b) => new Date(b.returnedAt || 0) - new Date(a.returnedAt || 0)
    );

    historyList.innerHTML = sorted
      .map((item) => {
        const book = resolveBook(item, bookById);
        const title = book.title || "Unknown Book";
        const author = book.author || "";
        const category = book.category || "";
        const meta = `${author ? `${author} • ` : ""}${category}`;

        return `
          <div class="book-card">
            ${makeCoverImg(book.cover, `${title} cover`)}
            <div>
              <p class="book-title">${escapeHtml(title)}</p>
              <p class="book-meta">${escapeHtml(meta)}</p>
              <div class="badges">
                <span class="badge">Returned: ${escapeHtml(formatDate(item.returnedAt))}</span>
              </div>
            </div>
            <div class="actions">
              <a class="small-btn btn-details" href="borrow.html?id=${encodeURIComponent(item.id)}">Details</a>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function handleReturn(bookIdRaw) {
    const bookId = Number(bookIdRaw);
    if (!Number.isFinite(bookId)) return;

    const borrowed = load(BORROWED_KEY, []);
    const history = load(HISTORY_KEY, []);

    const idx = borrowed.findIndex((x) => Number(x.id) === bookId);
    if (idx === -1) return;

    const item = borrowed[idx];
    borrowed.splice(idx, 1);

    history.unshift({
      id: item.id,
      title: item.title,
      author: item.author,
      cover: item.cover,
      category: item.category,
      borrowedAt: item.borrowedAt,
      returnedAt: new Date().toISOString(),
    });

    save(BORROWED_KEY, borrowed);
    save(HISTORY_KEY, history);

    renderAll();
  }

  let bookById = new Map();

  async function renderAll() {
    const borrowed = load(BORROWED_KEY, []);
    const history = load(HISTORY_KEY, []);

    if (statBorrowed) statBorrowed.textContent = String(borrowed.length);
    if (statOverdue) statOverdue.textContent = "0";
    if (statReturned) statReturned.textContent = String(history.length);

    if (countCurrent) countCurrent.textContent = String(borrowed.length);
    if (countHistory) countHistory.textContent = String(history.length);

    renderCurrent(borrowed, bookById);
    renderHistory(history, bookById);

    currentEmpty?.classList.toggle("hidden", borrowed.length !== 0);
    historyEmpty?.classList.toggle("hidden", history.length !== 0);
  }

  async function initProfile() {
    bookById = await loadBooksMap();

    tabCurrent?.addEventListener("click", () => setActiveTab("current"));
    tabHistory?.addEventListener("click", () => setActiveTab("history"));

    setActiveTab("current");
    await renderAll();
  }

  initProfile();
});
