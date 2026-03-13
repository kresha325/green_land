(function () {
  const PRODUCTS_API_URL = "https://dummyjson.com/products?limit=100";

  const notificationsList = document.getElementById("notifications-list");
  const notificationsEmpty = document.getElementById("notifications-empty");
  const notificationsSubtitle = document.getElementById("notifications-subtitle");
  const unreadCountEl = document.getElementById("notifications-unread-count");
  const markReadButton = document.getElementById("notifications-mark-read");
  const navNotificationBadge = document.getElementById("notifications-badge");
  const notificationsTrigger = document.getElementById("notifications-trigger");
  const notificationsSnackbar = document.getElementById("notifications-snackbar");
  const notificationsSnackbarList = document.getElementById("notifications-snackbar-list");
  const notificationsSnackbarEmpty = document.getElementById("notifications-snackbar-empty");
  const notificationsSeeAll = document.getElementById("notifications-see-all");

  function getCurrentUserIdentifier() {
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
      if (currentUser && currentUser.email) {
        if (notificationsSubtitle) {
          notificationsSubtitle.textContent = `Njoftime per: ${currentUser.name || currentUser.email}`;
        }
        return currentUser.email;
      }
    } catch (_error) {
      // Ignore and fallback to guest.
    }

    if (notificationsSubtitle) {
      notificationsSubtitle.textContent = "Njoftime per: Guest";
    }

    return "guest";
  }

  const userId = getCurrentUserIdentifier();
  const SNAPSHOT_KEY = `notification_snapshot_${userId}`;
  const NOTIFICATIONS_KEY = `notifications_${userId}`;
  const UNREAD_KEY = `notifications_unread_${userId}`;

  function readJson(key, fallback) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "null");
      return parsed === null ? fallback : parsed;
    } catch (_error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function readNotifications() {
    const parsed = readJson(NOTIFICATIONS_KEY, []);
    return Array.isArray(parsed) ? parsed : [];
  }

  function writeNotifications(items) {
    writeJson(NOTIFICATIONS_KEY, items);
  }

  function readUnreadCount() {
    const value = Number(localStorage.getItem(UNREAD_KEY) || "0");
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  function setUnreadCount(count) {
    const safeCount = Math.max(0, Number(count) || 0);
    localStorage.setItem(UNREAD_KEY, String(safeCount));
  }

  function formatCurrency(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "$0.00";
    return `$${amount.toFixed(2)}`;
  }

  function formatTime(timestamp) {
    try {
      return new Date(timestamp).toLocaleString();
    } catch (_error) {
      return "";
    }
  }

  function normalizeSnapshot(products) {
    const snapshot = {};

    products.forEach((product) => {
      if (!product || product.id === undefined || product.id === null) return;
      const id = String(product.id);
      snapshot[id] = {
        id,
        title: product.title || "Product",
        price: Number(product.price) || 0,
        category: product.category || "",
        brand: product.brand || "",
        image: product.thumbnail || (Array.isArray(product.images) ? product.images[0] : "") || "",
      };
    });

    return snapshot;
  }

  function createNewProductNotification(product) {
    return {
      id: `new-${product.id}-${Date.now()}`,
      type: "new-product",
      productId: String(product.id),
      title: product.title,
      category: product.category,
      brand: product.brand,
      image: product.image,
      newPrice: Number(product.price) || 0,
      createdAt: new Date().toISOString(),
    };
  }

  function createPriceChangeNotification(previous, current) {
    return {
      id: `price-${current.id}-${Date.now()}`,
      type: "price-change",
      productId: String(current.id),
      title: current.title,
      category: current.category,
      brand: current.brand,
      image: current.image,
      oldPrice: Number(previous.price) || 0,
      newPrice: Number(current.price) || 0,
      createdAt: new Date().toISOString(),
    };
  }

  async function fetchProducts() {
    const response = await fetch(PRODUCTS_API_URL);
    if (!response.ok) {
      throw new Error("Nuk u ngarkuan produktet nga API.");
    }

    const data = await response.json();
    return Array.isArray(data.products) ? data.products : [];
  }

  async function syncNotificationsFromApi() {
    const products = await fetchProducts();
    const currentSnapshot = normalizeSnapshot(products);
    const previousSnapshot = readJson(SNAPSHOT_KEY, {});

    const isFirstSnapshot = !previousSnapshot || Object.keys(previousSnapshot).length === 0;
    const newNotifications = [];

    if (!isFirstSnapshot) {
      Object.keys(currentSnapshot).forEach((id) => {
        const current = currentSnapshot[id];
        const previous = previousSnapshot[id];

        if (!previous) {
          newNotifications.push(createNewProductNotification(current));
          return;
        }

        if (Number(previous.price) !== Number(current.price)) {
          newNotifications.push(createPriceChangeNotification(previous, current));
        }
      });
    }

    writeJson(SNAPSHOT_KEY, currentSnapshot);

    if (newNotifications.length > 0) {
      const existing = readNotifications();
      const merged = [...newNotifications, ...existing].slice(0, 200);
      writeNotifications(merged);
      setUnreadCount(readUnreadCount() + newNotifications.length);
    }

    updateUnreadUi();
  }

  function updateUnreadUi() {
    const unread = readUnreadCount();

    if (unreadCountEl) {
      unreadCountEl.textContent = `${unread} unread`;
    }

    if (navNotificationBadge) {
      navNotificationBadge.textContent = String(unread);
      navNotificationBadge.hidden = unread === 0;
    }
  }

  function getNotificationText(entry) {
    if (entry.type === "price-change") {
      return `Cmimi: ${formatCurrency(entry.oldPrice)} -> ${formatCurrency(entry.newPrice)}`;
    }

    return `Produkt i ri: ${formatCurrency(entry.newPrice)}`;
  }

  function renderNotificationsSnackbar() {
    if (!notificationsSnackbarList) return;

    const notifications = readNotifications().slice(0, 6);
    notificationsSnackbarList.innerHTML = "";

    if (!notifications.length) {
      if (notificationsSnackbarEmpty) {
        notificationsSnackbarEmpty.hidden = false;
      }
      return;
    }

    if (notificationsSnackbarEmpty) {
      notificationsSnackbarEmpty.hidden = true;
    }

    notifications.forEach((entry) => {
      const item = document.createElement("article");
      item.className = "notifications-snackbar-item";
      item.setAttribute("data-notification-id", entry.id || "");
      item.innerHTML = `
        <div class="notifications-snackbar-title">${entry.title || "Product"}</div>
        <div class="notifications-snackbar-text">${getNotificationText(entry)}</div>
      `;

      item.addEventListener("click", () => {
        window.location.href = `notification.html?notificationId=${encodeURIComponent(entry.id || "")}`;
      });

      notificationsSnackbarList.appendChild(item);
    });
  }

  function closeSnackbar() {
    if (!notificationsSnackbar) return;
    notificationsSnackbar.hidden = true;
  }

  function toggleSnackbar() {
    if (!notificationsSnackbar) return;

    renderNotificationsSnackbar();
    notificationsSnackbar.hidden = !notificationsSnackbar.hidden;
  }

  function renderNotificationsPage() {
    if (!notificationsList) return;

    const notifications = readNotifications();
    notificationsList.innerHTML = "";

    if (notifications.length === 0) {
      if (notificationsEmpty) notificationsEmpty.hidden = false;
      return;
    }

    if (notificationsEmpty) notificationsEmpty.hidden = true;

    notifications.forEach((entry) => {
      const card = document.createElement("article");
      card.className = "notification-card";

      const message =
        entry.type === "price-change"
          ? `<span class="old-price">${formatCurrency(entry.oldPrice)}</span><span class="new-price">${formatCurrency(entry.newPrice)}</span>`
          : `<span class="new-price">${formatCurrency(entry.newPrice)}</span>`;

      const typeLabel = entry.type === "price-change" ? "Price Updated" : "New Product";

      card.innerHTML = `
        <img src="${entry.image || "images/parfum1.png"}" alt="${entry.title || "Product"}" />
        <div>
          <h3>${entry.title || "Product"}</h3>
          <p class="notification-meta">${formatTime(entry.createdAt)} | ${entry.category || "-"}</p>
          <p class="notification-message">${
            entry.type === "price-change"
              ? `Cmimi ka ndryshuar: ${message}`
              : `Produkt i ri nga API: ${message}`
          }</p>
          <span class="notification-type ${entry.type}">${typeLabel}</span>
        </div>
      `;

      notificationsList.appendChild(card);
    });
  }

  function attachPageEvents() {
    if (!markReadButton) return;

    markReadButton.addEventListener("click", () => {
      setUnreadCount(0);
      updateUnreadUi();
    });
  }

  function attachNavbarEvents() {
    if (!notificationsTrigger || !notificationsSnackbar) return;

    notificationsTrigger.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleSnackbar();
    });

    if (notificationsSeeAll) {
      notificationsSeeAll.addEventListener("click", () => {
        closeSnackbar();
      });
    }

    document.addEventListener("click", (event) => {
      if (!notificationsSnackbar || notificationsSnackbar.hidden) return;
      if (notificationsSnackbar.contains(event.target)) return;
      if (notificationsTrigger.contains(event.target)) return;
      closeSnackbar();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeSnackbar();
      }
    });
  }

  window.addEventListener("storage", (event) => {
    if (event.key === UNREAD_KEY || event.key === NOTIFICATIONS_KEY) {
      updateUnreadUi();
      renderNotificationsPage();
      renderNotificationsSnackbar();
    }
  });

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      await syncNotificationsFromApi();
    } catch (_error) {
      // Ignore network issues silently; existing notifications remain visible.
    }

    updateUnreadUi();
    renderNotificationsPage();
    renderNotificationsSnackbar();
    attachPageEvents();
    attachNavbarEvents();
  });
})();
