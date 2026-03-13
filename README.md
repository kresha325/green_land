# Green Land Web Shop

Green Land është një aplikacion web statik për një dyqan online, i ndërtuar me HTML, CSS dhe JavaScript (pa backend). Projekti është modular, përdor API publike për produktet, ruan state në localStorage dhe është i optimizuar për GitHub Pages.

---

## 📦 Funksionalitetet Kryesore

- **Produktet nga API**: Produktet merren në kohë reale nga [dummyjson.com/products](https://dummyjson.com/products) përmes thirrjeve `fetch` në JavaScript.
- **Modal Produkti**: Klikimi mbi një produkt hap një modal me detaje të plota të produktit (nga API).
- **Kërkimi & Sugjerimet**: Search bar me sugjerime live (nga produktet e API-së), i ndarë në modul të veçantë (`js/search.js`).
- **Sistemi i Njoftimeve (Snackbar)**: Njoftimet shfaqen si snackbar në këndin e poshtëm, me badge për unread, ruhet në localStorage.
- **Autentikim & User State**: Regjistrimi, login/logout, ruajtja e user-it aktiv në localStorage (`users`, `currentUser`).
- **Avatar & Navbar Dinamike**: Ikona e avatarit bëhet e gjelbër kur user-i është i loguar, emri i user-it shfaqet poshtë ikonave (vetëm desktop).
- **Cart & Favorites**: Shtimi/menaxhimi i produkteve në cart dhe favorites, të ruajtura në localStorage (`cart`, `favorites_{user}`).
- **Pagesa (UI Demo)**: Checkout me simulim pagese (UI), pa pagesë reale.
- **Responsive Design**: UI i përshtatur për desktop dhe mobile (emri i user-it fshihet në mobile).
- **Logout**: Funksion logout në user page.
- **GitHub Pages Ready**: Path-et e CSS/JS të rregulluara për deploy në GitHub Pages.

---

## 🛠️ Teknologjitë & Strukturë File-sh

- **HTML**: index.html, cart.html, user.html, notification.html, auth.html, success.html
- **CSS**: css/style.css, css/cart.css, css/user.css, css/notification.css
- **JavaScript**:
  - `js/script.js` – Logjika kryesore e produktit & API
  - `js/search.js` – Kërkimi & sugjerimet
  - `js/user.js` – User page, favorites, logout
  - `js/cart.js` – Cart & checkout
  - `js/payment.js` – Pagesa (UI)
  - `js/notification.js` – Njoftimet & snackbar
  - `js/auth.js` – Regjistrimi & login
  - `js/success.js` – Suksesi i pagesës

---

## 🌐 Thirrjet API

- **Produktet**: 
  - `fetch('https://dummyjson.com/products')` – Lista e produkteve
  - `fetch('https://dummyjson.com/products/{id}')` – Detajet e produktit për modal
- **Sugjerimet në Search**: Sugjerimet merren nga të njëjtat të dhëna të API-së, filtrohen live në frontend.

---

## 🗄️ Përdorimi i localStorage

- `users` – Lista e user-ave të regjistruar
- `currentUser` – User-i i loguar aktualisht
- `cart` – Produktet në cart për user-in aktiv
- `favorites_{user}` – Produktet e preferuara për çdo user
- `notifications_{user}` – Njoftimet për user-in
- `notifications_unread_{user}` – Numri i njoftimeve të pa lexuara

---

## 🚀 Deploy në GitHub Pages

1. **Krijo një repo në GitHub** (p.sh. `green_land`)
2. **Ngarko të gjitha file-t** (ruaj strukturën e folderave)
3. **Rregullo path-et relative të CSS/JS** (të gjitha path-et duhet të jenë relative, p.sh. `css/style.css`)
4. **Commit & Push**: 
   ```bash
   git add .
   git commit -m "Deploy Green Land web shop"
   git push -u origin main
   ```
5. **Shko te Settings → Pages → Deploy from branch**
6. **Zgjidh branch-in `main` dhe folderin `/root`**
7. **Akseso faqen në**: `https://{username}.github.io/{repo}/`

---

## ℹ️ Shënime të Rëndësishme

- **Pagesa është vetëm UI demo** – Nuk ka pagesa reale, nuk ruhet asnjë të dhënë sensitive.
- **API është publike (dummyjson.com)** – Nuk kërkohet backend.
- **Për çdo ndryshim në kod, bëj push në GitHub për të përditësuar faqen.**

---

## 📁 Struktura e Projektit

```
├── index.html
├── cart.html
├── success.html
├── css/
│   ├── style.css
│   ├── cart.css
│   ├── user.css
│   └── notification.css
├── images/
├── js/
│   ├── script.js
│   ├── search.js
│   ├── user.js
│   ├── cart.js
│   ├── payment.js
│   ├── notification.js
│   ├── auth.js
│   └── success.js
```

---

## 👤 Autorë & Kontribut

- Projekti është ndërtuar për provim përfundimtar WebDev.
- Mund të përdoret, forkohet dhe modifikohet lirisht për qëllime mësimore.

---

## 💡 Shembuj Kodesh (API & localStorage)

```js
// Thirrje për të marrë produktet
fetch('https://dummyjson.com/products')
  .then(res => res.json())
  .then(data => {
    // ... përdor produktet
  });

// Ruajtja e user-it aktiv
localStorage.setItem('currentUser', JSON.stringify(user));

// Shtimi i produktit në cart
let cart = JSON.parse(localStorage.getItem('cart')) || [];
cart.push(product);
localStorage.setItem('cart', JSON.stringify(cart));
```

---

## 📞 Pyetje & Ndihmë

Për çdo pyetje, kontakto instruktorin ose hap një issue në repo.

---

**Deploy link https://kresha325.github.io/green_land ** 🌱