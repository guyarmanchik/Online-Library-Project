document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // 1) STORAGE KEYS (MUST MATCH profile.js)
  // =========================
  const BORROWED_KEY = "bookify_borrowed"; // [{id,title,author,cover,category,borrowedAt}]
  const HISTORY_KEY  = "bookify_history";  // [{id,title,author,cover,borrowedAt,returnedAt}]
  const RECENT_KEY   = "recentBooks";      // [id,id,id] (נשאר כמו אצלך)

  // =========================
  // 2) HELPERS: load/save
  // =========================
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

  function normalizeCover(path) {
    if (!path) return "images/placeholder-cover.png";
    if (path.startsWith("/images/")) return path.slice(1);
    return path;
  }

  // =========================
  // 3) BORROW STATE (based on localStorage)
  // =========================
  function isBorrowed(id) {
    const borrowed = load(BORROWED_KEY, []);
    return borrowed.some(x => Number(x.id) === Number(id));
  }

  function borrowBook(book) {
    let borrowed = load(BORROWED_KEY, []);

    // remove existing record for this id (avoid duplicates)
    borrowed = borrowed.filter(x => Number(x.id) !== Number(book.id));

    borrowed.unshift({
      id: Number(book.id),
      title: book.title || "",
      author: book.author || "",
      cover: normalizeCover(book.cover),
      category: book.category || "",
      borrowedAt: new Date().toISOString(),
    });

    save(BORROWED_KEY, borrowed);
  }

  function returnBook(book) {
    // remove from borrowed
    let borrowed = load(BORROWED_KEY, []);
    borrowed = borrowed.filter(x => Number(x.id) !== Number(book.id));
    save(BORROWED_KEY, borrowed);

    // add to history
    const history = load(HISTORY_KEY, []);
    history.unshift({
      id: Number(book.id),
      title: book.title || "",
      author: book.author || "",
      cover: normalizeCover(book.cover),
      borrowedAt: new Date().toISOString(), // אם תרצה לשמור borrowedAt המקורי – אפשר לשדרג
      returnedAt: new Date().toISOString(),
    });
    save(HISTORY_KEY, history);
  }

  // =========================
  // 4) RECENTLY VIEWED
  // =========================
  function addRecent(id) {
    let recent = load(RECENT_KEY, []);
    recent = recent.filter(x => Number(x) !== Number(id));
    recent.unshift(Number(id));
    recent = recent.slice(0, 3);
    save(RECENT_KEY, recent);
  }

  function renderRecentlyViewed(books) {
    const historyList = document.getElementById("historyList");
    if (!historyList) return;

    const recentIds = load(RECENT_KEY, []);
    const recentBooks = recentIds
      .map(id => books.find(b => Number(b.id) === Number(id)))
      .filter(Boolean);

    if (recentBooks.length === 0) {
      historyList.innerHTML = `<li class="history__empty">No items yet. Browse books to build history.</li>`;
      return;
    }

    historyList.innerHTML = recentBooks.map(b => `
      <li class="history__item">
        <a href="borrow.html?id=${b.id}" class="history__card">
          <img src="${normalizeCover(b.cover)}" alt="${b.title}" class="history__img"
               onerror="this.src='images/placeholder-cover.png'">
          <div class="history__info">
            <div class="history__title">${b.title}</div>
            <div class="history__author">${b.author || ""}</div>
          </div>
        </a>
      </li>
    `).join("");
  }

  // =========================
  // 5) READ ID FROM URL
  // =========================
  const params = new URLSearchParams(window.location.search);
  const bookId = Number(params.get("id")) || 1;

  // =========================
  // 6) ELEMENTS
  // =========================
  const statusEl = document.getElementById("bookStatus");
  const hintEl   = document.getElementById("bookAvailabilityText");
  const borrowBtn = document.getElementById("borrowBtn");
  const returnBtn = document.getElementById("returnBtn");
  const msgEl = document.getElementById("systemMessage");

  function showMessage(text) {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.style.opacity = "1";
    clearTimeout(window._msgTimer);
    window._msgTimer = setTimeout(() => {
      msgEl.style.opacity = "0";
    }, 2500);
  }

  function renderAvailability() {
    const borrowedNow = isBorrowed(bookId);

    if (!borrowedNow) {
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

  // =========================
  // 7) LOAD BOOK DATA (UI + save full details)
  // =========================
  fetch("./books.json", { cache: "no-store" })
    .then(res => res.json())
    .then(books => {
      const book = books.find(b => Number(b.id) === Number(bookId));
      if (!book) {
        document.body.innerHTML = "<h2 style='padding:20px'>Book not found</h2>";
        return;
      }

      // ----- Fill page -----
      document.getElementById("bookTitle").textContent = book.title || "";
      document.getElementById("bookAuthor").textContent = book.author || "";
      document.getElementById("bookCategory").textContent = book.category || "";

      const cat2 = document.getElementById("bookCategory2");
      if (cat2) cat2.textContent = book.category || "";

      document.getElementById("bookIsbn").textContent = book.isbn || "-";
      document.getElementById("bookYear").textContent = book.year || "-";
      document.getElementById("bookLanguage").textContent = book.language || "-";

      const coverImg = document.getElementById("bookCover");
      coverImg.src = normalizeCover(book.cover);

      const idEl = document.getElementById("bookId");
      if (idEl) idEl.textContent = book.id;

      // ----- Description toggle -----
      const descEl = document.getElementById("bookDescription");
      const toggleBtn = document.getElementById("toggleDescBtn");

      descEl.textContent = book.description || "";
      let expanded = false;

      function renderDesc() {
        if (!book.description || book.description.length < 160) {
          toggleBtn.style.display = "none";
          descEl.classList.remove("desc-text--clamp");
          return;
        }

        toggleBtn.style.display = "inline-flex";
        descEl.classList.toggle("desc-text--clamp", !expanded);

        const span = toggleBtn.querySelector("span");
        if (span) span.textContent = expanded ? "Read less" : "Read more";
      }

      toggleBtn.addEventListener("click", () => {
        expanded = !expanded;
        renderDesc();
      });

      renderDesc();

      // ----- Recently viewed -----
      addRecent(bookId);
      renderRecentlyViewed(books);

      // ----- Availability -----
      renderAvailability();

      // ----- Borrow / Return -----
      borrowBtn.addEventListener("click", () => {
        if (isBorrowed(bookId)) return;
        borrowBook(book);
        showMessage("✅ Book borrowed successfully.");
        renderAvailability();

        // ✅ אופציונלי: מעבר לאזור אישי ישר אחרי Borrow
        // window.location.href = "profile.html";
      });

      returnBtn.addEventListener("click", () => {
        if (!isBorrowed(bookId)) return;
        returnBook(book);
        showMessage("✅ Book returned successfully.");
        renderAvailability();
      });

      // ----- Zoom follows mouse -----
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
      document.body.innerHTML = "<h2 style='padding:20px'>Error loading books.json</h2>";
    });
});
