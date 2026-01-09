// ====== STORAGE KEYS ======
const BORROWED_KEY = "borrowedBooks";   // [{id, borrowedAt, dueAt, status:"borrowed"}]
const HISTORY_KEY  = "returnedHistory"; // [{id, returnedAt}]
const BOOKS_JSON   = "./books.json";    // כדי להביא title/author/cover

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
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function isOverdue(dueAt) {
  if (!dueAt) return false;
  return new Date(dueAt).getTime() < Date.now();
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function setActiveTab(which) {
  const current = which === "current";
  tabCurrent.classList.toggle("active", current);
  tabHistory.classList.toggle("active", !current);

  currentView.classList.toggle("hidden", !current);
  historyView.classList.toggle("hidden", current);
}

// ====== RENDER ======
async function initProfile() {
  // load storage
  let borrowed = load(BORROWED_KEY, []);
  let history  = load(HISTORY_KEY, []);

  // bring books data
  const books = await fetch(BOOKS_JSON).then(r => r.json()).catch(() => []);
  const bookById = new Map(books.map(b => [b.id, b]));

  // stats
  const overdueCount = borrowed.filter(b => b.status === "borrowed" && isOverdue(b.dueAt)).length;
  statBorrowed.textContent = borrowed.filter(b => b.status === "borrowed").length;
  statOverdue.textContent  = overdueCount;
  statReturned.textContent = history.length;

  countCurrent.textContent = borrowed.filter(b => b.status === "borrowed").length;
  countHistory.textContent = history.length;

  // lists
  renderCurrent(borrowed, bookById);
  renderHistory(history, bookById);

  // empty states
  currentEmpty.classList.toggle("hidden", borrowed.filter(b => b.status === "borrowed").length !== 0);
  historyEmpty.classList.toggle("hidden", history.length !== 0);

  // tabs
  tabCurrent.addEventListener("click", () => setActiveTab("current"));
  tabHistory.addEventListener("click", () => setActiveTab("history"));

  // default tab
  setActiveTab("current");
}

function renderCurrent(borrowed, bookById) {
  const current = borrowed
    .filter(x => x.status === "borrowed")
    .sort((a, b) => new Date(b.borrowedAt) - new Date(a.borrowedAt));

  currentList.innerHTML = "";

  current.forEach(item => {
    const book = bookById.get(item.id) || { title: "Unknown Book", author: "", cover: "" };

    const overdue = isOverdue(item.dueAt);

    const card = document.createElement("div");
    card.className = "book-card";
    card.innerHTML = `
      <img class="cover" src="${book.cover || ""}" alt="${book.title}">
      <div>
        <p class="book-title">${book.title}</p>
        <p class="book-meta">${book.author ? book.author + " • " : ""}${book.category || ""}</p>
        <div class="badges">
          <span class="badge">Borrowed: ${formatDate(item.borrowedAt)}</span>
          ${item.dueAt ? `<span class="badge ${overdue ? "overdue" : ""}">Due: ${formatDate(item.dueAt)}</span>` : ""}
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
  const sorted = [...history].sort((a, b) => new Date(b.returnedAt) - new Date(a.returnedAt));

  historyList.innerHTML = "";

  sorted.forEach(item => {
    const book = bookById.get(item.id) || { title: "Unknown Book", author: "", cover: "" };

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
  let borrowed = load(BORROWED_KEY, []);
  let history  = load(HISTORY_KEY, []);

  // remove from borrowed (or mark returned)
  borrowed = borrowed.filter(x => x.id !== bookId);

  // add to history
  history.unshift({ id: bookId, returnedAt: new Date().toISOString() });

  save(BORROWED_KEY, borrowed);
  save(HISTORY_KEY, history);

  // re-render
  initProfile();
}

// ====== (optional) seed demo data ======
// run once from console if you want to test UI quickly:
// localStorage.setItem("borrowedBooks", JSON.stringify([
//   {id: 2, borrowedAt: new Date().toISOString(), dueAt: new Date(Date.now()+3*86400000).toISOString(), status:"borrowed"},
//   {id: 3, borrowedAt: new Date(Date.now()-5*86400000).toISOString(), dueAt: new Date(Date.now()-1*86400000).toISOString(), status:"borrowed"}
// ]))

initProfile();