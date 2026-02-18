document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEYS = {
    borrowed: "bookify_borrowed",
    history: "bookify_history",
    recent: "recentBooks",
  };

  function readStorage(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeCoverPath(path) {
    if (!path) return "images/placeholder-cover.png";
    if (path.startsWith("/images/")) return path.slice(1);
    return path;
  }

  function isBookBorrowed(bookId) {
    const borrowed = readStorage(STORAGE_KEYS.borrowed, []);
    return borrowed.some((item) => Number(item.id) === Number(bookId));
  }

  function addBorrowedRecord(book) {
    let borrowed = readStorage(STORAGE_KEYS.borrowed, []);
    borrowed = borrowed.filter((item) => Number(item.id) !== Number(book.id));

    borrowed.unshift({
      id: Number(book.id),
      title: book.title || "",
      author: book.author || "",
      cover: normalizeCoverPath(book.cover),
      category: book.category || "",
      borrowedAt: new Date().toISOString(),
    });

    writeStorage(STORAGE_KEYS.borrowed, borrowed);
  }

  function moveBorrowedToHistory(book) {
    const borrowed = readStorage(STORAGE_KEYS.borrowed, []);
    const history = readStorage(STORAGE_KEYS.history, []);

    const index = borrowed.findIndex((item) => Number(item.id) === Number(book.id));
    if (index === -1) return;

    const borrowedItem = borrowed[index];

    borrowed.splice(index, 1);
    writeStorage(STORAGE_KEYS.borrowed, borrowed);

    history.unshift({
      id: Number(borrowedItem.id),
      title: borrowedItem.title || book.title || "",
      author: borrowedItem.author || book.author || "",
      cover: borrowedItem.cover || normalizeCoverPath(book.cover),
      category: borrowedItem.category || book.category || "",
      borrowedAt: borrowedItem.borrowedAt,
      returnedAt: new Date().toISOString(),
    });

    writeStorage(STORAGE_KEYS.history, history);
  }

  function addToRecentlyViewed(bookId) {
    let recent = readStorage(STORAGE_KEYS.recent, []);
    recent = recent.filter((id) => Number(id) !== Number(bookId));
    recent.unshift(Number(bookId));
    recent = recent.slice(0, 3);
    writeStorage(STORAGE_KEYS.recent, recent);
  }

  function renderRecentlyViewed(books) {
    const listEl = document.getElementById("historyList");
    if (!listEl) return;

    const recentIds = readStorage(STORAGE_KEYS.recent, []);
    const recentBooks = recentIds
      .map((id) => books.find((b) => Number(b.id) === Number(id)))
      .filter(Boolean);

    if (recentBooks.length === 0) {
      listEl.innerHTML = `<li class="history__empty">No items yet. Browse books to build history.</li>`;
      return;
    }

    listEl.innerHTML = recentBooks
      .map(
        (book) => `
          <li class="history__item">
            <a href="borrow.html?id=${book.id}" class="history__card">
              <img
                src="${normalizeCoverPath(book.cover)}"
                alt="${book.title}"
                class="history__img"
                onerror="this.src='images/placeholder-cover.png'"
              >
              <div class="history__info">
                <div class="history__title">${book.title}</div>
                <div class="history__author">${book.author || ""}</div>
              </div>
            </a>
          </li>
        `
      )
      .join("");
  }

  const params = new URLSearchParams(window.location.search);
  const currentBookId = Number(params.get("id")) || 1;

  const statusEl = document.getElementById("bookStatus");
  const hintEl = document.getElementById("bookAvailabilityText");
  const borrowBtn = document.getElementById("borrowBtn");
  const returnBtn = document.getElementById("returnBtn");
  const messageEl = document.getElementById("systemMessage");

  let messageTimerId = null;

  function showToast(text) {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.style.opacity = "1";

    if (messageTimerId) clearTimeout(messageTimerId);
    messageTimerId = setTimeout(() => {
      messageEl.style.opacity = "0";
    }, 2500);
  }

  function renderAvailability() {
    if (!statusEl || !hintEl || !borrowBtn || !returnBtn) return;

    const borrowedNow = isBookBorrowed(currentBookId);

    if (!borrowedNow) {
      statusEl.textContent = "Available";
      statusEl.className = "badge badge--available";
      hintEl.textContent = "Ready to borrow now";

      borrowBtn.disabled = false;
      returnBtn.disabled = true;

      borrowBtn.className = "book-btn book-btn--primary";
      returnBtn.className = "book-btn book-btn--ghost";
      return;
    }

    statusEl.textContent = "Borrowed";
    statusEl.className = "badge badge--borrowed";
    hintEl.textContent = "This book is currently borrowed";

    borrowBtn.disabled = true;
    returnBtn.disabled = false;

    borrowBtn.className = "book-btn book-btn--ghost";
    returnBtn.className = "book-btn book-btn--return-active";
  }

  fetch("./books.json", { cache: "no-store" })
    .then((res) => res.json())
    .then((books) => {
      const book = books.find((b) => Number(b.id) === Number(currentBookId));
      if (!book) {
        document.body.innerHTML = "<h2 style='padding:20px'>Book not found</h2>";
        return;
      }

      const titleEl = document.getElementById("bookTitle");
      const authorEl = document.getElementById("bookAuthor");
      const categoryEl = document.getElementById("bookCategory");
      const category2El = document.getElementById("bookCategory2");
      const isbnEl = document.getElementById("bookIsbn");
      const yearEl = document.getElementById("bookYear");
      const languageEl = document.getElementById("bookLanguage");
      const idEl = document.getElementById("bookId");
      const coverImg = document.getElementById("bookCover");

      if (titleEl) titleEl.textContent = book.title || "";
      if (authorEl) authorEl.textContent = book.author || "";
      if (categoryEl) categoryEl.textContent = book.category || "";
      if (category2El) category2El.textContent = book.category || "";
      if (isbnEl) isbnEl.textContent = book.isbn || "-";
      if (yearEl) yearEl.textContent = book.year || "-";
      if (languageEl) languageEl.textContent = book.language || "-";
      if (idEl) idEl.textContent = book.id;

      if (coverImg) coverImg.src = normalizeCoverPath(book.cover);

      const descEl = document.getElementById("bookDescription");
      const toggleBtn = document.getElementById("toggleDescBtn");

      if (descEl) descEl.textContent = book.description || "";

      let isExpanded = false;

      function renderDescriptionToggle() {
        if (!descEl || !toggleBtn) return;

        const text = book.description || "";
        if (text.length < 160) {
          toggleBtn.style.display = "none";
          descEl.classList.remove("desc-text--clamp");
          return;
        }

        toggleBtn.style.display = "inline-flex";
        descEl.classList.toggle("desc-text--clamp", !isExpanded);

        const label = toggleBtn.querySelector("span");
        if (label) label.textContent = isExpanded ? "Read less" : "Read more";
      }

      if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
          isExpanded = !isExpanded;
          renderDescriptionToggle();
        });
      }

      renderDescriptionToggle();

      addToRecentlyViewed(currentBookId);
      renderRecentlyViewed(books);
      renderAvailability();

      if (borrowBtn) {
        borrowBtn.addEventListener("click", () => {
          if (isBookBorrowed(currentBookId)) return;
          addBorrowedRecord(book);
          showToast("✅ Book borrowed successfully.");
          renderAvailability();
        });
      }

      if (returnBtn) {
        returnBtn.addEventListener("click", () => {
          if (!isBookBorrowed(currentBookId)) return;
          moveBorrowedToHistory(book);
          showToast("✅ Book returned successfully.");
          renderAvailability();
        });
      }

      const coverWrap = document.getElementById("coverWrap");
      if (coverWrap && coverImg) {
        coverWrap.addEventListener("mousemove", (e) => {
          const rect = coverWrap.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          coverImg.style.transformOrigin = `${x}% ${y}%`;
        });

        coverWrap.addEventListener("mouseleave", () => {
          coverImg.style.transformOrigin = "50% 50%";
        });
      }
    })
    .catch(() => {
      document.body.innerHTML = "<h2 style='padding:20px'>Error loading books.json</h2>";
    });
});
