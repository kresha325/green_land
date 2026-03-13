const categoryContainer = document.getElementById("categories");
const productsContainer = document.querySelector(".products");
const allBtn = document.getElementById("all-products");
const navUsername = document.getElementById("nav-username");
const authTrigger = document.getElementById("auth-trigger");
const PAGE_SIZE = 9;

let sourceProducts = [];
let visibleProducts = [];
let activeSearchQuery = "";
let visibleCount = 0;
let isFetchingProducts = false;

// Shitje e cart-it
let mainCart = [];

function readCartFromStorage() {
  try {
    const parsed = JSON.parse(localStorage.getItem("cart") || "[]");
    if (!Array.isArray(parsed)) {
      localStorage.setItem("cart", "[]");
      return [];
    }
    return parsed;
  } catch (_error) {
    localStorage.setItem("cart", "[]");
    return [];
  }
}

function writeCartToStorage(items) {
  try {
    localStorage.setItem("cart", JSON.stringify(items));
  } catch (_error) {
    // Keep app usable even if storage write fails.
  }
}

function getCurrentUserIdentifier() {
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (currentUser && currentUser.email) return currentUser.email;
  } catch (_error) {
    // Ignore and fallback to guest.
  }

  return "guest";
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
    localStorage.setItem(FAVORITES_STORAGE_KEY, "[]");
    return [];
  }
}

function writeFavorites(items) {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(items));
  } catch (_error) {
    // Keep app usable if storage is full.
  }
}

function isFavoriteProduct(productId) {
  return readFavorites().some((item) => String(item.id) === String(productId));
}

function normalizeProductFromCard(card, triggerEl) {
  const title =
    triggerEl?.getAttribute("data-title") ||
    card.querySelector("h4")?.textContent?.trim() ||
    "Product";
  const description =
    triggerEl?.getAttribute("data-description") ||
    card.querySelector(".desc")?.textContent?.trim() ||
    "";
  const category = triggerEl?.getAttribute("data-category") || "";
  const price =
    triggerEl?.getAttribute("data-price") ||
    card.querySelector(".price")?.textContent?.replace("$", "").trim() ||
    "0";
  const image =
    triggerEl?.getAttribute("data-image") ||
    card.querySelector("img")?.getAttribute("src") ||
    "";
  const id =
    triggerEl?.getAttribute("data-id") ||
    `${title.toLowerCase().replace(/\s+/g, "-")}-${price}`;

  return {
    id: String(id),
    title,
    description,
    category,
    price: Number(price) || 0,
    image,
  };
}

function updateWishlistUi(wishlistEl, isActive) {
  if (!wishlistEl) return;

  wishlistEl.classList.toggle("active", Boolean(isActive));
}

function toggleFavoriteProduct(product) {
  const favorites = readFavorites();
  const existingIndex = favorites.findIndex((item) => String(item.id) === String(product.id));

  if (existingIndex >= 0) {
    favorites.splice(existingIndex, 1);
    writeFavorites(favorites);
    return false;
  }

  favorites.push(product);
  writeFavorites(favorites);
  return true;
}

function bindWishlistButton(wishlistEl) {
  if (!wishlistEl || wishlistEl.dataset.boundWishlist === "true") return;

  wishlistEl.dataset.boundWishlist = "true";

  const card = wishlistEl.closest(".product-card");
  if (!card) return;

  const addToCartBtn = card.querySelector(".add-to-cart");
  const product = normalizeProductFromCard(card, addToCartBtn);
  updateWishlistUi(wishlistEl, isFavoriteProduct(product.id));

  wishlistEl.addEventListener("click", (event) => {
    event.preventDefault();
    const normalized = normalizeProductFromCard(card, addToCartBtn);
    const active = toggleFavoriteProduct(normalized);
    updateWishlistUi(wishlistEl, active);
  });
}

function normalizeCartItems(items) {
  const map = new Map();

  items.forEach((item) => {
    if (!item || typeof item !== "object") {
      return;
    }

    const rawId = item.id || item.title;
    if (!rawId) {
      return;
    }

    const id = String(rawId);
    const quantity = Number(item.quantity || 1);
    const price = Number(item.price || 0);

    if (!map.has(id)) {
      map.set(id, {
        ...item,
        id,
        price,
        quantity: quantity > 0 ? quantity : 1,
      });
      return;
    }

    const existing = map.get(id);
    existing.quantity += quantity > 0 ? quantity : 1;
  });

  return Array.from(map.values());
}

function bindAddToCartButton(button) {
  if (!button || button.dataset.boundAddToCart === "true") return;

  button.dataset.boundAddToCart = "true";
  button.addEventListener("click", (event) => {
    event.preventDefault();
    addToCart(button);
  });
}

function syncCartFromStorage() {
  const parsed = readCartFromStorage();
  cart = normalizeCartItems(parsed);
  writeCartToStorage(cart);
}

// Ngarko të gjitha produktet
async function loadAllProducts() {
  if (!productsContainer) return;
  if (isFetchingProducts) return;

  try {
    isFetchingProducts = true;
    const response = await fetch("https://dummyjson.com/products?limit=100");

    if (!response.ok) {
      throw new Error("Nuk u moren produktet");
    }

    const data = await response.json();
    initializeProductList(data.products || []);
  } catch (error) {
    console.error("Error loading all products:", error);
    productsContainer.innerHTML = "<p>Nuk u ngarkuan produktet.</p>";
  } finally {
    isFetchingProducts = false;
  }
}

// Ngarko kategoritë dinamikisht
async function loadCategories() {
  if (!categoryContainer) return;

  try {
    const response = await fetch("https://dummyjson.com/products/categories");

    if (!response.ok) {
      throw new Error("Nuk u ngarkuan kategorite");
    }

    const categories = await response.json();

    // Fshi butonat statik
    categoryContainer.innerHTML = "";

    // Krijo butonat dinamikisht për çdo kategori
    categories.forEach((category) => {
      const button = document.createElement("button");
      button.className = "category-button";
      
      // Kontrolloje nëse category është objekt apo string
      const categoryName =
        typeof category === "object" ? category.name : category;
      const categorySlug =
        typeof category === "object" ? category.slug : category;
      
      button.textContent = categoryName;
      button.setAttribute("data-category", categorySlug);

      button.addEventListener("click", (e) => {
        e.preventDefault();
        setActiveButton(button);
        loadProductsByCategory(categorySlug);
      });
      categoryContainer.appendChild(button);
    });
  } catch (error) {
    console.error("Error loading categories:", error);
  }
}

// Ngarko produktet sipas kategorisë
async function loadProductsByCategory(category) {
  if (!productsContainer) return;
  if (isFetchingProducts) return;

  try {
    isFetchingProducts = true;
    const url = `https://dummyjson.com/products/category/${category}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Nuk u ngarkuan produktet e kategorise");
    }

    const data = await response.json();

    if (data.products && data.products.length > 0) {
      initializeProductList(data.products);
    } else {
      productsContainer.innerHTML = "<p>Nuk ka produkte në këtë kategori</p>";
    }
  } catch (error) {
    console.error("Error loading products by category:", error);
    productsContainer.innerHTML =
      "<p>Nuk u ngarkuan produktet për këtë kategori.</p>";
  } finally {
    isFetchingProducts = false;
  }
}

// Inicjalizo listën aktive të produkteve dhe shfaq batch-in e parë
function initializeProductList(products) {
  sourceProducts = Array.isArray(products) ? products : [];
  applySearchFilter(activeSearchQuery);
}

function applySearchFilter(query = "") {
  if (!productsContainer) return;

  activeSearchQuery = query.trim().toLowerCase();

  visibleProducts = sourceProducts.filter((product) =>
    product.title.toLowerCase().includes(activeSearchQuery)
  );

  visibleCount = 0;
  productsContainer.innerHTML = "";

  if (visibleProducts.length === 0) {
    productsContainer.innerHTML = "<p>Nuk u gjet asnje produkt me kete emer.</p>";
    return;
  }

  renderNextBatch();
}

// Renderizo batch-et nga 9 produkte sa herë bëhet scroll poshtë
function renderNextBatch() {
  if (!productsContainer) return;
  if (visibleCount >= visibleProducts.length) return;

  const nextProducts = visibleProducts.slice(visibleCount, visibleCount + PAGE_SIZE);
  visibleCount += nextProducts.length;

  nextProducts.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.setAttribute("data-product-id", String(product.id));

    const productImage = product.thumbnail || (product.images && product.images[0]) || "";

    card.innerHTML = `
      <img src="${productImage}" alt="${product.title}" />
      <h4>${product.title}</h4>
      <p class="desc">${product.description}</p>
      <div class="price-cart">
        <span class="price">$${product.price}</span>
        <button class="add-to-cart" data-id="${product.id}" data-title="${product.title}" data-description="${product.description}" data-category="${product.category}" data-price="${product.price}" data-image="${productImage}">Add to cart</button>
        <button class="wishlist" type="button" aria-label="Favorite" data-id="${product.id}" data-title="${product.title}" data-description="${product.description}" data-category="${product.category}" data-price="${product.price}" data-image="${productImage}"><i class="fas fa-heart"></i></button>
      </div>
    `;

    const addToCartButton = card.querySelector(".add-to-cart");
    if (addToCartButton) {
      bindAddToCartButton(addToCartButton);
    }

    const wishlistButton = card.querySelector(".wishlist");
    if (wishlistButton) {
      bindWishlistButton(wishlistButton);
    }

    productsContainer.appendChild(card);
  });
}

function handleInfiniteScroll() {
  if (!productsContainer) return;

  const reachedBottom =
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 120;

  if (reachedBottom) {
    renderNextBatch();
  }
}

// Shto produktin në cart
function addToCart(e) {
  syncCartFromStorage();

  const fallbackButton =
    document.activeElement && document.activeElement.closest
      ? document.activeElement.closest("button")
      : null;
  const buttonFromArg = e && e.tagName === "BUTTON" ? e : null;
  const button = buttonFromArg || (e && e.currentTarget ? e.currentTarget : e && e.target ? e.target : fallbackButton);
  if (!button || typeof button.getAttribute !== "function") return;

  const productCard = button.closest(".product-card");
  const titleFromCard = productCard
    ? productCard.querySelector("h4")?.textContent?.trim()
    : "";
  const priceFromCard = productCard
    ? productCard
        .querySelector(".price")
        ?.textContent?.replace("$", "")
        .trim()
    : "";
  const imageFromCard = productCard
    ? productCard.querySelector("img")?.getAttribute("src")
    : "";

  const productTitle = button.getAttribute("data-title") || titleFromCard;
  const productPrice = button.getAttribute("data-price") || priceFromCard;
  const productImage = button.getAttribute("data-image") || imageFromCard || "";
  const productId =
    button.getAttribute("data-id") ||
    `${(productTitle || "product").toLowerCase().replace(/\s+/g, "-")}-${productPrice || "0"}`;

  if (!productTitle || !productPrice) {
    return;
  }

  const product = {
    id: String(productId),
    title: productTitle,
    price: productPrice,
    image: productImage,
    quantity: 1
  };

  // Kontrollo nëse produkti ekziston në cart
  const existingProduct = cart.find(item => String(item.id) === String(productId));
  
  if (existingProduct) {
    existingProduct.quantity++;
  } else {
    cart.push(product);
  }

  // Ruaj në localStorage
  writeCartToStorage(cart);
  
  // Update notification badge
  updateCartBadge();
  
  alert(productTitle + " u shtua në cart!");
}

window.addToCart = addToCart;

// Përditëso badge-in e cart-it
function updateCartBadge() {
  const badge = document.querySelector(".notification-badge");
  if (badge) {
    syncCartFromStorage();
    // Shfaq numrin e produkteve unike në cart
    badge.textContent = String(cart.length);
  }
}

function updateCurrentUserDisplay() {
  if (!navUsername) return;

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

  if (currentUser && currentUser.name) {
    navUsername.textContent = currentUser.name;
    navUsername.hidden = false;
    if (authTrigger) {
      authTrigger.classList.add("logged-in");
    }
    return;
  }

  navUsername.hidden = true;
  if (authTrigger) {
    authTrigger.classList.remove("logged-in");
  }
}

// Vendos butonin aktiv
function setActiveButton(button) {
  // Hiq "active" nga të gjithë butonat e kategorive
  document.querySelectorAll(".category-button").forEach(btn => {
    btn.classList.remove("active");
  });
  // Hiq "active" nga butoni ALL
  allBtn.classList.remove("active");
  
  // Shto "active" vetëm te butoni i klikuar
  button.classList.add("active");
}

// Buton ALL - ngarko të gjitha produktet
if (allBtn) {
  allBtn.addEventListener("click", () => {
    setActiveButton(allBtn);
    loadAllProducts();
  });
}

window.addEventListener("scroll", handleInfiniteScroll);

if (productsContainer) {
  productsContainer.querySelectorAll(".add-to-cart").forEach((button) => {
    bindAddToCartButton(button);
  });

  productsContainer.querySelectorAll(".wishlist").forEach((button) => {
    bindWishlistButton(button);
  });
}

window.addEventListener("pageshow", () => {
  updateCartBadge();
});

window.addEventListener("storage", (event) => {
  if (event.key === "cart") {
    updateCartBadge();
  }
});

// Inicijalizim
document.addEventListener("DOMContentLoaded", () => {
    // Go to Top Button logic
    const goToTopBtn = document.getElementById("go-to-top");
    window.addEventListener("scroll", () => {
      if (!goToTopBtn) return;
      if (window.scrollY > 200) {
        goToTopBtn.style.display = "block";
      } else {
        goToTopBtn.style.display = "none";
      }
    });
    if (goToTopBtn) {
      goToTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  if (productsContainer && categoryContainer && allBtn) {
    loadCategories();
    loadAllProducts();
  }

  if (window.ProductDetailsModal && productsContainer) {
    window.ProductDetailsModal.bindContainer(productsContainer);
  }

  updateCartBadge();
  updateCurrentUserDisplay();

  // Dynamic avatar link: user.html nëse je loguar, auth modal nëse jo
  const authTrigger = document.getElementById("auth-trigger");
  if (authTrigger) {
    let currentUser = null;
    try {
      currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch (_e) {}
    // Hiq eventet ekzistuese për të shmangur dyfishim
    const newAuthTrigger = authTrigger.cloneNode(true);
    authTrigger.parentNode.replaceChild(newAuthTrigger, authTrigger);
    if (currentUser && currentUser.email) {
      newAuthTrigger.setAttribute("href", "user.html");
      // Mos shto event click për modal
    } else {
      newAuthTrigger.setAttribute("href", "#");
      newAuthTrigger.addEventListener("click", function(e) {
        e.preventDefault();
        const modal = document.getElementById("auth-modal");
        if (modal) {
          modal.hidden = false;
          modal.style.display = "block";
        }
      });
    }
  }

  // Siguro që modal-i auth të jetë gjithmonë i fshehur kur faqja hapet/rifreskohet dhe përdor vetëm një referencë
  const modal = document.getElementById("auth-modal");
  if (modal) {
    modal.hidden = true;
    modal.style.display = "none";

    // Modal logic
    function closeAuthModal() {
      modal.hidden = true;
      modal.style.display = "none";
      console.log("[MODAL] closeAuthModal u thirr (forco display none)");
    }
    const closeBtn = document.getElementById("auth-modal-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", closeAuthModal);
    }
    // Mbyll modalin edhe me klikim jashtë (event delegation)
    modal.addEventListener("click", (e) => {
      // Klikim jashtë content ose në backdrop
      if (
        e.target === modal ||
        (e.target.classList && e.target.classList.contains("auth-modal-backdrop"))
      ) {
        closeAuthModal();
      }
    });

    // Skip & Continue as Guest
    const skipGuestBtn = document.getElementById("modal-skip-guest");
    if (skipGuestBtn) {
      skipGuestBtn.addEventListener("click", () => {
        localStorage.removeItem("currentUser");
        closeAuthModal();
        updateCurrentUserDisplay && updateCurrentUserDisplay();
      });
    }
  }

  // Only show login form by default, hide register form
  const loginForm = document.getElementById("modal-login-form");
  const registerForm = document.getElementById("modal-register-form");
  if (loginForm && registerForm) {
    loginForm.hidden = false;
    registerForm.hidden = true;
  }

  // Auth logic (localStorage, no reload)
  const modalAuthMsg = document.getElementById("modal-auth-message");
  function showModalMsg(msg) {
    if (modalAuthMsg) {
      modalAuthMsg.textContent = msg;
      modalAuthMsg.hidden = false;
    }
  }
  function clearModalMsg() {
    if (modalAuthMsg) {
      modalAuthMsg.textContent = "";
      modalAuthMsg.hidden = true;
    }
  }
  if (loginForm) {
    loginForm.addEventListener("submit", function(e) {
      e.preventDefault();
      clearModalMsg();
      const email = document.getElementById("modal-login-email").value.trim().toLowerCase();
      const password = document.getElementById("modal-login-password").value;
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) {
        showModalMsg("Email ose password gabim!");
        return;
      }
      localStorage.setItem("currentUser", JSON.stringify(user));
      closeAuthModal();
      // Forco mbylljen e modalit edhe në rast edge-case
      if (modal) {
        modal.hidden = true;
        modal.style.display = "none";
      }
      if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/" || window.location.pathname === "") {
        setTimeout(() => window.location.reload(), 200);
      }
    });
  }
  if (registerForm) {
    registerForm.addEventListener("submit", function(e) {
      e.preventDefault();
      clearModalMsg();
      const name = document.getElementById("modal-register-name").value.trim();
      const email = document.getElementById("modal-register-email").value.trim().toLowerCase();
      const password = document.getElementById("modal-register-password").value;
      if (name.length < 2) {
        showModalMsg("Emri duhet te kete te pakten 2 karaktere.");
        return;
      }
      if (password.length < 6) {
        showModalMsg("Password duhet te kete te pakten 6 karaktere.");
        return;
      }
      let users = JSON.parse(localStorage.getItem("users") || "[]");
      if (users.some(u => u.email === email)) {
        showModalMsg("Ky email ekziston!");
        return;
      }
      const user = { name, email, password };
      users.push(user);
      localStorage.setItem("users", JSON.stringify(users));
      localStorage.setItem("currentUser", JSON.stringify(user));
      closeAuthModal();
      // Forco mbylljen e modalit edhe në rast edge-case
      if (modal) {
        modal.hidden = true;
        modal.style.display = "none";
      }
      if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/" || window.location.pathname === "") {
        setTimeout(() => window.location.reload(), 200);
      }
    });
  }
});

window.GreenLandSearchApi = {
  applySearchFilter,
  getProducts: () => sourceProducts,
};