const skipGuestBtn = document.getElementById("skip-guest");

if (skipGuestBtn) {
  skipGuestBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
  });
}
const loginTab = document.getElementById("show-login");
const registerTab = document.getElementById("show-register");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const loggedView = document.getElementById("logged-view");
const welcomeText = document.getElementById("welcome-text");
const authMessage = document.getElementById("auth-message");
const logoutBtn = document.getElementById("logout-btn");

function getUsers() {
  return JSON.parse(localStorage.getItem("users") || "[]");
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser") || "null");
}

function setCurrentUser(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
}

function showMessage(text, type) {
  if (!authMessage) return;

  authMessage.textContent = text;
  authMessage.className = `auth-message ${type}`;
  authMessage.hidden = false;
}

function clearMessage() {
  if (!authMessage) return;

  authMessage.hidden = true;
  authMessage.textContent = "";
  authMessage.className = "auth-message";
}

function switchTab(tab) {
  clearMessage();

  if (tab === "login") {
    loginTab.classList.add("active");
    registerTab.classList.remove("active");
    loginForm.hidden = false;
    registerForm.hidden = true;
    return;
  }

  registerTab.classList.add("active");
  loginTab.classList.remove("active");
  registerForm.hidden = false;
  loginForm.hidden = true;
}

function renderCurrentUser() {
  const currentUser = getCurrentUser();

  if (!currentUser || !currentUser.name) {
    loggedView.hidden = true;
    return;
  }

  welcomeText.textContent = `Mire se erdhe, ${currentUser.name}!`;
  loggedView.hidden = false;
  loginForm.hidden = true;
  registerForm.hidden = true;
  loginTab.classList.remove("active");
  registerTab.classList.remove("active");
}

if (loginTab && registerTab) {
  loginTab.addEventListener("click", () => switchTab("login"));
  registerTab.addEventListener("click", () => switchTab("register"));
}

if (registerForm) {
  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    clearMessage();

    const name = document.getElementById("register-name").value.trim();
    const email = document.getElementById("register-email").value.trim().toLowerCase();
    const password = document.getElementById("register-password").value;

    if (name.length < 2) {
      showMessage("Emri duhet te kete te pakten 2 karaktere.", "error");
      return;
    }

    if (password.length < 6) {
      showMessage("Password duhet te kete te pakten 6 karaktere.", "error");
      return;
    }

    const users = getUsers();
    const exists = users.some((user) => user.email === email);

    if (exists) {
      showMessage("Ky email ekziston. Provo login.", "error");
      return;
    }

    const newUser = { name, email, password };
    users.push(newUser);
    saveUsers(users);
    setCurrentUser({ name, email });

    showMessage("Regjistrimi u krye me sukses.", "success");
    registerForm.reset();
    renderCurrentUser();
    setTimeout(() => {
      window.location.href = "index.html";
    }, 600);
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    clearMessage();

    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const password = document.getElementById("login-password").value;

    const users = getUsers();
    const user = users.find((item) => item.email === email && item.password === password);

    if (!user) {
      showMessage("Email ose password gabim.", "error");
      return;
    }

    setCurrentUser({ name: user.name, email: user.email });
    showMessage("Login u krye me sukses.", "success");
    loginForm.reset();
    renderCurrentUser();
    setTimeout(() => {
      window.location.href = "index.html";
    }, 600);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    showMessage("U be logout me sukses.", "success");
    loggedView.hidden = true;
    switchTab("login");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderCurrentUser();

  if (loggedView.hidden) {
    switchTab("login");
  }
});
