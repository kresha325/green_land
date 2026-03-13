const CART_STORAGE_KEY = "cart";
const SHIPPING_COST = 4;

const cartItemsContainer = document.getElementById("cart-items");
const cartItemTemplate = document.getElementById("cart-item-template");
const cartSubtitle = document.getElementById("cart-subtitle");
const subtotalValue = document.getElementById("subtotal-value");
const shippingValue = document.getElementById("shipping-value");
const totalValue = document.getElementById("total-value");
const checkoutTotal = document.getElementById("checkout-total");

function normalizeCartItems(items) {
  const source = Array.isArray(items) ? items : [];
  const map = new Map();

  source.forEach((item) => {
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
        id,
        title: item.title || "Product",
        price,
        image: item.image || "",
        quantity: quantity > 0 ? quantity : 1,
      });
      return;
    }

    const existing = map.get(id);
    existing.quantity += quantity > 0 ? quantity : 1;
  });

  return Array.from(map.values());
}

function readCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
    return normalizeCartItems(parsed);
  } catch (_error) {
    localStorage.setItem(CART_STORAGE_KEY, "[]");
    return [];
  }
}

let cart = readCart();

function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`;
}

function persistCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalizeCartItems(cart)));
}

function updateSummary() {
  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity || 1),
    0
  );
  const total = subtotal + (cart.length > 0 ? SHIPPING_COST : 0);

  if (cartSubtitle) {
    const count = cart.length;
    const label = count === 1 ? "item" : "items";
    cartSubtitle.textContent = `You have ${count} ${label} in your cart`;
  }

  if (subtotalValue) subtotalValue.textContent = formatPrice(subtotal);
  if (shippingValue) {
    shippingValue.textContent = cart.length > 0 ? formatPrice(SHIPPING_COST) : formatPrice(0);
  }
  if (totalValue) totalValue.textContent = formatPrice(total);
  if (checkoutTotal) checkoutTotal.textContent = formatPrice(total);
}

function changeQuantity(productId, delta) {
  const item = cart.find((product) => String(product.id) === String(productId));
  if (!item) return;

  item.quantity = Math.max(1, Number(item.quantity || 1) + delta);
  persistCart();
  renderCart();
}

function removeItem(productId) {
  cart = cart.filter((product) => String(product.id) !== String(productId));
  persistCart();
  renderCart();
}

function bindCartEvents() {
  if (!cartItemsContainer) return;

  cartItemsContainer.querySelectorAll(".qty-increase").forEach((button) => {
    button.addEventListener("click", () => {
      changeQuantity(button.dataset.id, 1);
    });
  });

  cartItemsContainer.querySelectorAll(".qty-decrease").forEach((button) => {
    button.addEventListener("click", () => {
      changeQuantity(button.dataset.id, -1);
    });
  });

  cartItemsContainer.querySelectorAll(".delete-icon").forEach((button) => {
    button.addEventListener("click", () => {
      removeItem(button.dataset.id);
    });
  });
}

function renderCart() {
  if (!cartItemsContainer) return;

  cartItemsContainer.innerHTML = "";

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = "<p>Shporta eshte bosh.</p>";
    updateSummary();
    return;
  }

  cart.forEach((item) => {
    const image = item.image || "images/parfum1.png";
    const quantity = Number(item.quantity || 1);
    const unitPrice = Number(item.price);
    const lineTotal = Number(item.price) * quantity;

    if (cartItemTemplate) {
      const fragment = cartItemTemplate.content.cloneNode(true);
      const card = fragment.querySelector(".cart-item");
      const imageEl = fragment.querySelector('[data-role="image"]');
      const titleEl = fragment.querySelector('[data-role="title"]');
      const metaEl = fragment.querySelector('[data-role="meta"]');
      const quantityEl = fragment.querySelector('[data-role="quantity"]');
      const lineTotalEl = fragment.querySelector('[data-role="line-total"]');
      const increaseBtn = fragment.querySelector('[data-role="increase"]');
      const decreaseBtn = fragment.querySelector('[data-role="decrease"]');
      const removeBtn = fragment.querySelector('[data-role="remove"]');

      if (imageEl) {
        imageEl.src = image;
        imageEl.alt = item.title;
      }
      if (titleEl) titleEl.textContent = item.title;
      if (metaEl) metaEl.textContent = "Extra cheese and toping";
      if (quantityEl) quantityEl.textContent = String(quantity);
      if (lineTotalEl) lineTotalEl.textContent = formatPrice(lineTotal);
      if (increaseBtn) increaseBtn.dataset.id = item.id;
      if (decreaseBtn) decreaseBtn.dataset.id = item.id;
      if (removeBtn) removeBtn.dataset.id = item.id;

      if (card) {
        cartItemsContainer.appendChild(card);
      }
      return;
    }

    // Fallback rendering if template is not available
    const fallbackCard = document.createElement("div");
    fallbackCard.className = "cart-item";
    fallbackCard.innerHTML = `
      <img src="${image}" alt="${item.title}" />
      <div class="cart-info">
        <h4>${item.title}</h4>
        <p>Extra cheese and toping</p>
      </div>
      <div class="cart-qty-vertical">
        <span>${quantity}</span>
        <div>
          <button type="button" class="qty-increase" data-id="${item.id}" aria-label="Increase quantity">
            <i class="fas fa-chevron-up"></i>
          </button>
          <button type="button" class="qty-decrease" data-id="${item.id}" aria-label="Decrease quantity">
            <i class="fas fa-chevron-down"></i>
          </button>
        </div>
      </div>
      <div class="cart-price">${formatPrice(lineTotal)}</div>
      <button type="button" class="delete-icon" data-id="${item.id}" aria-label="Remove item">
        <i class="far fa-trash-alt"></i>
      </button>
    `;

    cartItemsContainer.appendChild(fallbackCard);
  });

  bindCartEvents();
  updateSummary();
}

document.addEventListener("cart:updated", () => {
  cart = readCart();
  renderCart();
});

document.addEventListener("DOMContentLoaded", () => {
  cart = readCart();
  renderCart();
});
