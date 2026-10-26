/* ===== Допоміжні функції ===== */
const $ = (s, r = document) => r.querySelector(s);
const money = n => n.toLocaleString("uk-UA") + " ₴";
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };

/* ===== Шапка і підвал (спільні для всіх сторінок) ===== */
const page = location.pathname.split("/").pop() || "index.html";
const link = (h, t) => `<a href="${h}"${page === h ? ' class="on"' : ""}>${t}</a>`;
document.body.insertAdjacentHTML("afterbegin", `<header><div class="wrap">
  <a class="logo" href="index.html">Green Leaf</a>
  <nav>${link("index.html", "Головна")}${link("menu.html", "Меню")}${link("contacts.html", "Контакти")}</nav>
  <button class="btn cartbtn" id="openCart">Замовлення <b id="cartCount">0</b></button></div></header>`);
document.body.insertAdjacentHTML("beforeend", `<footer><div class="wrap">
  <div><div class="logo" style="font-size:24px">Green Leaf</div>Смакуємо моменти разом!</div>
  <div>+380 (97) 123-45-67<br>greenleaf@gmail.com<br>м. Біла Церква, вул. Шевченка, 12</div>
  <div>© 2026 Green Leaf. Усі права захищені.</div></div></footer>`);

/* ===== Картка страви ===== */
function cardHTML(p) {
  return `<article class="card"><div class="ph" data-info="${p.id}">
    ${p.hit ? '<span class="tag">Хіт</span>' : ""}${p.emoji}
    <img src="images/${p.img}" alt="${p.name}" onerror="this.remove()"></div>
    <div class="in"><small>${categories[p.cat]}</small><h3>${p.name}</h3><p>${p.desc}</p>
    <div class="row2"><span class="price">${money(p.price)}</span>
    <button class="btn light" data-add="${p.id}">Замовити</button></div></div></article>`;
}
function renderDishes(list, box) {
  box.innerHTML = list.length ? list.map(cardHTML).join("") : '<p class="empty">Нічого не знайдено</p>';
}

/* ===== Модальні вікна (створюються через JS) ===== */
document.body.insertAdjacentHTML("beforeend", `
  <dialog id="cartDlg"><h3>Ваше замовлення</h3><div id="cartList"></div><div class="total" id="cartTotal"></div>
    <form class="f" id="orderForm" novalidate>
      <label>Ім'я<input name="name"></label>
      <label>Телефон<input name="phone" placeholder="+380..."></label>
      <div class="err" id="orderErr"></div>
      <button class="btn">Підтвердити замовлення</button>
      <button type="button" class="btn light" data-close>Закрити</button></form></dialog>
  <dialog id="infoDlg"><div id="infoBody"></div><button class="btn light" data-close style="margin-top:10px">Закрити</button></dialog>`);

function infoHTML(p) {
  const rows = [...p.specs, ["Категорія", categories[p.cat]]];
  return `<div class="mph">${p.emoji}<img src="images/${p.img}" alt="${p.name}" onerror="this.remove()"></div>
    <h3>${p.name}</h3><p class="muted">${p.desc}</p><p class="price">${money(p.price)}</p>
    <table class="spec">${rows.map(r => `<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join("")}</table>
    <button class="btn" data-add="${p.id}" style="margin-top:12px">Замовити</button>`;
}

/* ===== Кошик (зберігається в localStorage) ===== */
let cart = load("cart", {});
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  $("#cartCount").textContent = Object.values(cart).reduce((a, b) => a + b, 0);
}
function renderCart() {
  const ids = Object.keys(cart); let sum = 0;
  $("#cartList").innerHTML = ids.length ? ids.map(id => {
    const p = dishes.find(x => x.id == id); sum += p.price * cart[id];
    return `<div class="row"><span>${p.name}</span><span><button data-dec="${id}">−</button> <b>${cart[id]}</b> <button data-inc="${id}">+</button></span><b>${money(p.price * cart[id])}</b></div>`;
  }).join("") : '<p class="empty">Замовлення порожнє</p>';
  $("#cartTotal").textContent = ids.length ? "Разом: " + money(sum) : "";
  $("#orderForm").style.display = ids.length ? "grid" : "none";
}
saveCart();

/* ===== Делегування кліків ===== */
document.addEventListener("click", e => {
  const t = e.target;
  if (t.dataset.add) { cart[t.dataset.add] = (cart[t.dataset.add] || 0) + 1; saveCart(); const old = t.textContent; t.textContent = "Додано ✓"; setTimeout(() => t.textContent = old, 900); }
  if (t.dataset.inc) { cart[t.dataset.inc]++; saveCart(); renderCart(); }
  if (t.dataset.dec) { if (--cart[t.dataset.dec] <= 0) delete cart[t.dataset.dec]; saveCart(); renderCart(); }
  const info = t.closest("[data-info]");
  if (info) { $("#infoBody").innerHTML = infoHTML(dishes.find(x => x.id == info.dataset.info)); $("#infoDlg").showModal(); }
  if (t.dataset.close !== undefined) t.closest("dialog").close();
  if (t.closest("#openCart")) { renderCart(); $("#cartDlg").showModal(); }
});

/* ===== Оформлення замовлення з валідацією ===== */
$("#orderForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = e.target.name.value.trim(), phone = e.target.phone.value.trim();
  if (name.length < 2) return $("#orderErr").textContent = "Введіть ім'я";
  if (!/^\+?\d{10,13}$/.test(phone.replace(/[\s()-]/g, ""))) return $("#orderErr").textContent = "Некоректний номер телефону";
  const orders = load("orders", []);
  orders.push({ name, phone, items: cart, date: new Date().toLocaleString("uk-UA") });
  localStorage.setItem("orders", JSON.stringify(orders));
  cart = {}; saveCart();
  $("#cartList").innerHTML = `<p class="empty">Дякуємо, ${name}! Замовлення №${orders.length} прийнято.</p>`;
  $("#cartTotal").textContent = ""; e.target.style.display = "none"; e.target.reset(); $("#orderErr").textContent = "";
});

/* ===== Головна: популярні страви ===== */
const hitGrid = $("#hitGrid");
if (hitGrid) renderDishes(dishes.filter(p => p.hit), hitGrid);

/* ===== Меню: категорії, пошук, сортування ===== */
const grid = $("#menuGrid");
if (grid) {
  const params = new URLSearchParams(location.search);
  let cat = params.get("c") || "all";
  const q = $("#q"), sort = $("#sort");
  $("#chips").innerHTML = `<button class="chip" data-cat="all">Усі</button>` +
    Object.entries(categories).map(([k, v]) => `<button class="chip" data-cat="${k}">${v}</button>`).join("");
  function update() {
    let list = dishes.filter(p => (cat === "all" || p.cat === cat) && p.name.toLowerCase().includes(q.value.trim().toLowerCase()));
    if (sort.value === "asc") list.sort((a, b) => a.price - b.price);
    if (sort.value === "desc") list.sort((a, b) => b.price - a.price);
    if (sort.value === "name") list.sort((a, b) => a.name.localeCompare(b.name, "uk"));
    renderDishes(list, grid);
    $("#found").textContent = "Знайдено страв: " + list.length;
    document.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c.dataset.cat === cat));
  }
  document.querySelectorAll(".chip").forEach(c => c.onclick = () => { cat = c.dataset.cat; update(); });
  q.addEventListener("input", update); sort.addEventListener("change", update);
  update();
}

/* ===== Контакти: бронювання столика ===== */
const bf = $("#bookForm");
if (bf) {
  const showBookings = () => {
    const all = load("bookings", []);
    $("#bookings").innerHTML = all.length ? all.map(b => `<div class="box"><b>${b.name}</b> — ${b.date} о ${b.time}, гостей: ${b.guests}</div>`).join("") : '<p class="empty">Бронювань поки немає</p>';
  };
  bf.date.min = new Date().toISOString().slice(0, 10);
  bf.addEventListener("submit", e => {
    e.preventDefault();
    const name = bf.name.value.trim(), phone = bf.phone.value.trim();
    if (name.length < 2) return $("#bookErr").textContent = "Вкажіть ім'я";
    if (!/^\+?\d{10,13}$/.test(phone.replace(/[\s()-]/g, ""))) return $("#bookErr").textContent = "Некоректний номер телефону";
    if (!bf.date.value || !bf.time.value) return $("#bookErr").textContent = "Оберіть дату і час";
    const all = load("bookings", []);
    all.push({ name, phone, date: bf.date.value, time: bf.time.value, guests: bf.guests.value });
    localStorage.setItem("bookings", JSON.stringify(all));
    bf.reset(); $("#bookErr").textContent = ""; showBookings();
  });
  showBookings();
}
