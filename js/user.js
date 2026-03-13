const favoritesGrid = document.getElementById("favorites-grid");
const favoritesEmpty = document.getElementById("favorites-empty");
const userSubtitle = document.getElementById("user-subtitle");
const favoritesCategories = document.getElementById("favorites-categories");
const favoritesAllButton = document.getElementById("favorites-all");
const favoritesCategoryButtons = document.getElementById("favorites-category-buttons");
const userLogoutButton = document.getElementById("user-logout-btn");

let activeCategory = "all";

function getCurrentUserIdentifier() {
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (currentUser && currentUser.email) {
      if (userSubtitle) {
        userSubtitle.textContent = `Favorites: ${currentUser.name || currentUser.email}`;
      }

      if (userLogoutButton) {
        userLogoutButton.hidden = false;
      }

      return currentUser.email;
    }
  } catch (_error) {
    // Ignore and fallback to guest.
  }

  if (userSubtitle) {
    userSubtitle.textContent = "Favorites: Guest";
  }

  if (userLogoutButton) {
    userLogoutButton.hidden = true;
  }

  return "guest";
}

function handleLogout() {
  localStorage.removeItem("currentUser");
  window.location.href = "auth.html";
}

function getFavoritesStorageKey() {
  return `favorites_${getCurrentUserIdentifier()}`;
}

const FAVORITES_STORAGE_KEY = getFavoritesStorageKey();

function readFavorites() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function writeFavorites(items) {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(items));
}

async function hydrateFavoritesWithDescriptions(items) {
  if (!Array.isArray(items) || !items.length) {
    return items;
  }

  const updated = [...items];
  let changed = false;

  const tasks = updated.map(async (item, index) => {
    if (!item || typeof item !== "object") return;

    const hasDescription = typeof item.description === "string" && item.description.trim() !== "";
    const hasCategory = typeof item.category === "string" && item.category.trim() !== "";
    if (hasDescription && hasCategory) return;

    const numericId = Number(item.id);
    if (!Number.isFinite(numericId)) return;

    try {
      const response = await fetch(`https://dummyjson.com/products/${numericId}`);
      if (!response.ok) return;

      const product = await response.json();
      if (!product || typeof product !== "object") return;

      const nextItem = { ...item };

      if (!hasDescription && typeof product.description === "string" && product.description.trim() !== "") {
        nextItem.description = product.description;
      }

      if (!hasCategory && typeof product.category === "string" && product.category.trim() !== "") {
        nextItem.category = product.category;
      }

      const descriptionChanged = (nextItem.description || "") !== (item.description || "");
      const categoryChanged = (nextItem.category || "") !== (item.category || "");

      if (descriptionChanged || categoryChanged) {
        updated[index] = nextItem;
        changed = true;
      }
    } catch (_error) {
      // Ignore network errors and keep the current local data.
    }
  });

  await Promise.all(tasks);

  if (changed) {
    writeFavorites(updated);
  }

  return updated;
}

function readCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem("cart") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function writeCart(items) {
  localStorage.setItem("cart", JSON.stringify(items));
}

function addToCartFromFavorites(product) {
  const cart = readCart();
  const existing = cart.find((item) => String(item.id) === String(product.id));

  if (existing) {
    existing.quantity = Number(existing.quantity || 1) + 1;
  } else {
    cart.push({
      id: String(product.id),
      title: product.title,
      price: Number(product.price) || 0,
      image: product.image || "",
      quantity: 1,
    });
  }

  writeCart(cart);
  window.alert(`${product.title} u shtua ne cart!`);
}

function removeFavorite(productId) {
  const updated = readFavorites().filter((item) => String(item.id) !== String(productId));
  writeFavorites(updated);
  renderFavorites();
}

function formatCategoryLabel(category) {
  return String(category || "")
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function renderCategoryFilters(favorites) {
  if (!favoritesCategories || !favoritesCategoryButtons || !favoritesAllButton) return;

  const categories = Array.from(
    new Set(
      favorites
        .map((item) => (typeof item.category === "string" ? item.category.trim() : ""))
        .filter(Boolean),
    ),
  );

  if (!favorites.length) {
    favoritesCategories.hidden = true;
    favoritesCategoryButtons.innerHTML = "";
    activeCategory = "all";
    return;
  }

  favoritesCategories.hidden = false;

  if (activeCategory !== "all" && !categories.includes(activeCategory)) {
    activeCategory = "all";
  }

  favoritesAllButton.classList.toggle("active", activeCategory === "all");
  favoritesAllButton.onclick = () => {
    activeCategory = "all";
    renderFavorites();
  };

  favoritesCategoryButtons.innerHTML = "";

  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-filter-button";
    button.textContent = formatCategoryLabel(category);
    button.classList.toggle("active", activeCategory === category);
    button.addEventListener("click", () => {
      activeCategory = category;
      renderFavorites();
    });

    favoritesCategoryButtons.appendChild(button);
  });
}

async function renderFavorites() {
  if (!favoritesGrid) return;

  const favorites = await hydrateFavoritesWithDescriptions(readFavorites());
  renderCategoryFilters(favorites);

  const filteredFavorites =
    activeCategory === "all"
      ? favorites
      : favorites.filter((item) => String(item.category || "") === activeCategory);

  favoritesGrid.innerHTML = "";

  if (!filteredFavorites.length) {
    if (favoritesEmpty) favoritesEmpty.hidden = false;
    if (favorites.length && activeCategory !== "all") {
      favoritesEmpty.textContent = "Nuk ka produkte ne kete kategori.";
    } else {
      favoritesEmpty.textContent = "Nuk ka produkte te pelqyera ende.";
    }
    return;
  }

  if (favoritesEmpty) favoritesEmpty.hidden = true;

  filteredFavorites.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.setAttribute("data-product-id", String(product.id || ""));
    const description = (product.description || "").trim();
    card.innerHTML = `
      <img src="${product.image || "images/parfum1.png"}" alt="${product.title}" />
      <h4>${product.title}</h4>
      <p class="desc">${description}</p>
      <div class="price-cart">
        <span class="price">$${Number(product.price || 0).toFixed(2)}</span>
        <div class="favorite-actions">
          <button class="add-to-cart favorite-add" type="button">Add to cart</button>
          <button class="wishlist active favorite-remove" type="button" aria-label="Remove from favorites"><i class="fas fa-heart"></i></button>
        </div>
      </div>
    `;

    const addButton = card.querySelector(".favorite-add");
    const removeButton = card.querySelector(".favorite-remove");

    if (addButton) {
      addButton.addEventListener("click", () => {
        addToCartFromFavorites(product);
      });
    }

    if (removeButton) {
      removeButton.addEventListener("click", () => {
        removeFavorite(product.id);
      });
    }

    favoritesGrid.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.ProductDetailsModal && favoritesGrid) {
    window.ProductDetailsModal.bindContainer(favoritesGrid);
  }

  if (userLogoutButton) {
    userLogoutButton.addEventListener("click", handleLogout);
  }

  renderFavorites();
});
