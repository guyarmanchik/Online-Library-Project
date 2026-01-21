// ====== STORAGE KEYS (MATCH borrow.js) ======
const BORROWED_KEY = "bookify_borrowed"; // [{id,title,author,cover,borrowedAt}]
const HISTORY_KEY  = "bookify_history";  // [{id,title,author,cover,borrowedAt,returnedAt}]
const BOOKS_JSON   = "./books.json";     // optional enrich

// ====== ELEMENTS ======
const statBorrowed = document.getElementById("statBorrowed");
const statOverdue  = document.getElementById("statOverdue");
const statReturned = document.getElementById("statReturned");

const tabCurrent   = document.getElementById("tabCurrent");
const tabHistory   = document.getElementById("tabHistory");

const currentView  = document.getElementById("currentView");
const historyView  = document.getElementById("historyView");

const currentList  = document.getElementById("currentList");
const historyList  = document.getElementById("historyList");

const currentEmpty = document.getElementById("currentEmpty");
const historyEmpty = document.getElementById("historyEmpty");

const countCurrent = document.getElementById("countCurrent");
const countHistory = document.getElementById("countHistory");

// ====== HELPERS ======
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
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
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function setActiveTab(which) {
  const isCurrent = which === "current";
  tabCurrent.classList.toggle("active", isCurrent);
  tabHistory.classList.toggle("active", !isCurrent);

  currentView.classList.toggle("hidden", !isCurrent);
  historyView.classList.toggle("hidden", isCurrent);
}

// ====== MAIN ======
async function initProfile() {
  // load storage
  const borrowed = load(BORROWED_KEY, []);
  const history  = load(HISTORY_KEY, []);

  // try to enrich from books.json (optional)
  const books = await fetch(BOOKS_JSON).then(r => r.json()).catch(() => []);
  const bookById = new Map((books || []).map(b => [Number(b.id), b]));

  // stats
  statBorrowed.textContent = borrowed.length;
  statOverdue.textContent  = 0; // no due date in this model
  statReturned.textContent = history.length;

  countCurrent.textContent = borrowed.length;
  countHistory.textContent = history.length;

  // render lists
  renderCurrent(borrowed, bookById);
  renderHistory(history, bookById);

  // empty states
  currentEmpty.classList.toggle("hidden", borrowed.length !== 0);
  historyEmpty.classList.toggle("hidden", history.length !== 0);

  // tabs
  tabCurrent.addEventListener("click", () => setActiveTab("current"));
  tabHistory.addEventListener("click", () => setActiveTab("history"));

  // default tab
  setActiveTab("current");
}

function resolveBook(item, bookById) {
  // priority: books.json -> item itself -> fallback
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

function renderCurrent(borrowed, bookById) {
  const current = [...borrowed].sort(
    (a, b) => new Date(b.borrowedAt) - new Date(a.borrowedAt)
  );

  currentList.innerHTML = "";

  current.forEach(item => {
    const book = resolveBook(item, bookById);

    const card = document.createElement("div");
    card.className = "book-card";
    card.innerHTML = `
      <img class="cover" src="${book.cover || ""}" alt="${book.title}">
      <div>
        <p class="book-title">${book.title}</p>
        <p class="book-meta">${book.author ? book.author + " • " : ""}${book.category || ""}</p>
        <div class="badges">
          <span class="badge">Borrowed: ${formatDate(item.borrowedAt)}</span>
        </div>
      </div>
      <div class="actions">
        <button class="small-btn btn-return" data-return="${item.id}">Return</button>
        <a class="small-btn btn-details" href="borrow.html?id=${item.id}" style="text-decoration:none;display:inline-block;text-align:center;">Details</a>
      </div>
    `;

    currentList.appendChild(card);
  });

  // return handlers
  currentList.querySelectorAll("[data-return]").forEach(btn => {
    btn.addEventListener("click", () => handleReturn(Number(btn.dataset.return)));
  });
}

function renderHistory(history, bookById) {
  const sorted = [...history].sort(
    (a, b) => new Date(b.returnedAt) - new Date(a.returnedAt)
  );

  historyList.innerHTML = "";

  sorted.forEach(item => {
    const book = resolveBook(item, bookById);

    const card = document.createElement("div");
    card.className = "book-card";
    card.innerHTML = `
      <img class="cover" src="${book.cover || ""}" alt="${book.title}">
      <div>
        <p class="book-title">${book.title}</p>
        <p class="book-meta">${book.author ? book.author + " • " : ""}${book.category || ""}</p>
        <div class="badges">
          <span class="badge">Returned: ${formatDate(item.returnedAt)}</span>
        </div>
      </div>
      <div class="actions">
        <a class="small-btn btn-details" href="borrow.html?id=${item.id}" style="text-decoration:none;display:inline-block;text-align:center;">Details</a>
      </div>
    `;
    historyList.appendChild(card);
  });
}

function handleReturn(bookId) {
  const borrowed = load(BORROWED_KEY, []);
  const history  = load(HISTORY_KEY, []);

  const idx = borrowed.findIndex(x => Number(x.id) === Number(bookId));
  if (idx === -1) return;

  const item = borrowed[idx];

  // remove from borrowed
  borrowed.splice(idx, 1);

  // add to history (keep book fields if exist)
  history.unshift({
    id: item.id,
    title: item.title,
    author: item.author,
    cover: item.cover,
    borrowedAt: item.borrowedAt,
    returnedAt: new Date().toISOString(),
  });

  save(BORROWED_KEY, borrowed);
  save(HISTORY_KEY, history);

  // re-render
  initProfile();
}

initProfile();
