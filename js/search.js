const searchForm = document.getElementById("product-search-form");
const searchInput = document.getElementById("product-search");
const searchSuggestions = document.getElementById("search-suggestions");

function updateSearchSuggestions(query = "") {
  if (!searchSuggestions) return;

  const api = window.GreenLandSearchApi;
  const products = api && typeof api.getProducts === "function" ? api.getProducts() : [];
  const normalizedQuery = String(query || "").trim().toLowerCase();
  searchSuggestions.innerHTML = "";

  if (!normalizedQuery) {
    searchSuggestions.hidden = true;
    return;
  }

  const matches = products.filter((product) =>
    String(product && product.title ? product.title : "")
      .toLowerCase()
      .includes(normalizedQuery),
  );

  if (matches.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "search-suggestion-empty";
    emptyState.textContent = "Nuk u gjet asnje produkt";
    searchSuggestions.appendChild(emptyState);
    searchSuggestions.hidden = false;
    return;
  }

  matches.forEach((product) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "search-suggestion-item";
    item.textContent = product.title;
    item.addEventListener("click", () => {
      if (searchInput) {
        searchInput.value = product.title;
      }

      if (api && typeof api.applySearchFilter === "function") {
        api.applySearchFilter(product.title);
      }

      searchSuggestions.hidden = true;
    });

    searchSuggestions.appendChild(item);
  });

  searchSuggestions.hidden = false;
}

document.addEventListener("DOMContentLoaded", () => {
  const api = window.GreenLandSearchApi;

  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      const query = event.target.value;
      if (api && typeof api.applySearchFilter === "function") {
        api.applySearchFilter(query);
      }
      updateSearchSuggestions(query);
    });
  }

  if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const query = searchInput ? searchInput.value : "";
      if (api && typeof api.applySearchFilter === "function") {
        api.applySearchFilter(query);
      }
      updateSearchSuggestions(query);
    });
  }

  document.addEventListener("click", (event) => {
    if (!searchForm || !searchSuggestions) return;

    if (!searchForm.contains(event.target)) {
      searchSuggestions.hidden = true;
    }
  });
});
