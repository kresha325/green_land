(function () {
  const productCache = new Map();
  let modalRoot = null;
  let modalDialog = null;
  let modalBody = null;
  let modalTitle = null;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function ensureModal() {
    if (modalRoot) {
      return;
    }

    modalRoot = document.createElement("div");
    modalRoot.className = "product-modal";
    modalRoot.hidden = true;
    modalRoot.innerHTML = `
      <div class="product-modal-backdrop" data-product-modal-close="true"></div>
      <div class="product-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
        <button class="product-modal-close" type="button" aria-label="Mbyll" data-product-modal-close="true">&times;</button>
        <div class="product-modal-body" id="product-modal-content">
          <h2 id="product-modal-title">Detaje Produkti</h2>
        </div>
      </div>
    `;

    document.body.appendChild(modalRoot);

    modalDialog = modalRoot.querySelector(".product-modal-dialog");
    modalBody = modalRoot.querySelector(".product-modal-body");
    modalTitle = modalRoot.querySelector("#product-modal-title");

    modalRoot.addEventListener("click", (event) => {
      const closeRequested = Boolean(
        event.target &&
          event.target.closest &&
          event.target.closest("[data-product-modal-close=\"true\"]"),
      );
      if (closeRequested) {
        close();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modalRoot && !modalRoot.hidden) {
        close();
      }
    });
  }

  function close() {
    if (!modalRoot) return;
    modalRoot.hidden = true;
    document.body.classList.remove("product-modal-open");
  }

  function setLoadingState() {
    if (!modalBody) return;
    modalBody.innerHTML = `
      <h2 id="product-modal-title">Detaje Produkti</h2>
      <p class="product-modal-loading">Duke ngarkuar te dhenat nga API...</p>
    `;
  }

  function renderProduct(product) {
    if (!modalBody || !product) return;

    const images = Array.isArray(product.images) ? product.images : [];
    const mainImage = product.thumbnail || images[0] || "images/parfum1.png";

    modalBody.innerHTML = `
      <h2 id="product-modal-title">${escapeHtml(product.title || "Detaje Produkti")}</h2>
      <div class="product-modal-top">
        <img class="product-modal-main-image" src="${escapeHtml(mainImage)}" alt="${escapeHtml(product.title || "Product")}" />
        <div class="product-modal-summary">
          <p><strong>Category:</strong> ${escapeHtml(product.category || "-")}</p>
          <p><strong>Brand:</strong> ${escapeHtml(product.brand || "-")}</p>
          <p><strong>Price:</strong> $${escapeHtml(product.price || "-")}</p>
          <p><strong>Rating:</strong> ${escapeHtml(product.rating || "-")}</p>
          <p><strong>Stock:</strong> ${escapeHtml(product.stock || "-")}</p>
        </div>
      </div>
      <p class="product-modal-description">${escapeHtml(product.description || "")}</p>
    `;

    if (modalTitle) {
      modalTitle.textContent = product.title || "Detaje Produkti";
    }
  }

  async function getProductById(productId) {
    const normalizedId = String(productId || "").trim();

    if (!normalizedId) {
      throw new Error("ID e produktit mungon.");
    }

    if (productCache.has(normalizedId)) {
      return productCache.get(normalizedId);
    }

    const response = await fetch(`https://dummyjson.com/products/${normalizedId}`);
    if (!response.ok) {
      throw new Error("Produkti nuk u gjet nga API.");
    }

    const product = await response.json();
    productCache.set(normalizedId, product);
    return product;
  }

  async function openById(productId, fallbackProduct) {
    ensureModal();

    if (!modalRoot || !modalDialog) return;

    modalRoot.hidden = false;
    document.body.classList.add("product-modal-open");
    setLoadingState();

    try {
      const product = await getProductById(productId);
      renderProduct(product);
    } catch (_error) {
      if (fallbackProduct && typeof fallbackProduct === "object") {
        renderProduct(fallbackProduct);
        return;
      }

      modalBody.innerHTML = `
        <h2 id="product-modal-title">Detaje Produkti</h2>
        <p class="product-modal-error">Nuk u arrit te merren te dhenat e plota te produktit.</p>
      `;
    }
  }

  function bindContainer(container) {
    if (!container || container.dataset.productModalBound === "true") {
      return;
    }

    container.dataset.productModalBound = "true";

    container.addEventListener("click", (event) => {
      const card = event.target.closest(".product-card");
      if (!card || !container.contains(card)) return;

      const clickedInteractive = event.target.closest("button, a, input, textarea, select, label");
      if (clickedInteractive) return;

      const productId =
        card.getAttribute("data-product-id") ||
        card.querySelector("[data-id]")?.getAttribute("data-id") ||
        "";

      const fallbackProduct = {
        id: productId,
        title: card.querySelector("h4")?.textContent?.trim() || "Produkt",
        description: card.querySelector(".desc")?.textContent?.trim() || "",
        price: card.querySelector(".price")?.textContent?.replace("$", "").trim() || "-",
        thumbnail: card.querySelector("img")?.getAttribute("src") || "",
      };

      openById(productId, fallbackProduct);
    });
  }

  window.ProductDetailsModal = {
    openById,
    bindContainer,
    close,
  };
})();
