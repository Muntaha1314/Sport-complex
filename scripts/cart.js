// cart.js — Shopping Cart Module
import { getCurrentUser, updateCurrentUser } from "./LoginUtility.js";

// ── Auth guard ────────────────────────────────────────────
if (!localStorage.getItem("isLoggedIn")) {
  window.location.href = "login.html";
}

// ── Storage helpers ───────────────────────────────────────
function getCart() {
  const user = getCurrentUser();
  if (!user) return [];
  const allCarts = JSON.parse(localStorage.getItem("carts")) || {};
  return allCarts[user.email] || [];
}

function saveCart(cart) {
  const user = getCurrentUser();
  if (!user) return;
  const allCarts = JSON.parse(localStorage.getItem("carts")) || {};
  allCarts[user.email] = cart;
  localStorage.setItem("carts", JSON.stringify(allCarts));
}

function getReservations() {
  return JSON.parse(localStorage.getItem("reservations")) || [];
}

function saveReservations(list) {
  localStorage.setItem("reservations", JSON.stringify(list));
}

function fmtDate(date) {
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── Update cart count in sidebar ──────────────────────────
function updateCartCount() {
  const cart = getCart();
  document.querySelectorAll(".cart-count").forEach(el => {
    el.textContent = cart.length;
  });
}

// ── Render cart ───────────────────────────────────────────
function renderCart() {
  const cart = getCart();
  const user = getCurrentUser();
  const emptyEl = document.getElementById("empty-cart");
  const contentEl = document.getElementById("cart-content");
  const tbody = document.getElementById("cart-body");

  updateCartCount();

  if (cart.length === 0) {
    emptyEl.classList.remove("hidden");
    contentEl.classList.add("hidden");
    return;
  }

  emptyEl.classList.add("hidden");
  contentEl.classList.remove("hidden");

  tbody.innerHTML = "";
  let totalPrice = 0;

  cart.forEach((item, index) => {
    totalPrice += item.price;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${item.sport}</strong></td>
      <td>${item.date}</td>
      <td>${item.time}</td>
      <td>${item.price} ₺</td>
      <td><button class="remove-btn" data-index="${index}">✕ Remove</button></td>
    `;
    tbody.appendChild(row);
  });

  // Attach remove handlers
  tbody.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", function () {
      removeFromCart(parseInt(this.dataset.index));
    });
  });

  // Summary
  document.getElementById("total-items").textContent = cart.length;
  document.getElementById("total-price").textContent = totalPrice.toLocaleString() + " ₺";
  
  const balance = user ? (user.balance || 0) : 0;
  document.getElementById("wallet-balance").textContent = balance.toFixed(2) + " ₺";

  const warning = document.getElementById("balance-warning");
  const confirmBtn = document.getElementById("confirm-btn");
  if (balance < totalPrice) {
    warning.classList.remove("hidden");
    confirmBtn.disabled = true;
    confirmBtn.classList.add("btn-disabled");
  } else {
    warning.classList.add("hidden");
    confirmBtn.disabled = false;
    confirmBtn.classList.remove("btn-disabled");
  }
}

// ── Remove from cart ──────────────────────────────────────
function removeFromCart(index) {
  const cart = getCart();
  if (index < 0 || index >= cart.length) return;

  const item = cart[index];
  if (!confirm(`Remove ${item.sport} (${item.time}) on ${item.date} from cart?`)) return;

  cart.splice(index, 1);
  saveCart(cart);
  renderCart();
}

// ── Confirm & Pay ─────────────────────────────────────────
document.getElementById("confirm-btn").addEventListener("click", () => {
  const user = getCurrentUser();
  const cart = getCart();
  if (cart.length === 0) return;

  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);
  const balance = user.balance || 0;

  if (balance < totalPrice) {
    alert(`Insufficient balance. You need ${totalPrice} ₺ but have ${balance.toFixed(2)} ₺.\n\nPlease deposit funds in your wallet.`);
    return;
  }

  if (!confirm(`Confirm ${cart.length} reservation(s)?\n\nTotal: ${totalPrice.toLocaleString()} ₺\nWallet balance after: ${(balance - totalPrice).toFixed(2)} ₺`)) return;

  // Create reservations
  const reservations = getReservations();
  const today = fmtDate(new Date());

  cart.forEach(item => {
    reservations.push({
      sport: item.sport,
      date: item.date,
      time: item.time,
      price: item.price,
      userEmail: user.email,
      username: user.username,
      confirmedAt: today,
      status: "Confirmed",
    });
  });

  saveReservations(reservations);

  // Deduct from wallet
  updateCurrentUser({ balance: balance - totalPrice });

  // Save to reservation payment log (for manager budget)
  const resPayments = JSON.parse(localStorage.getItem("reservationPayments")) || [];
  cart.forEach(item => {
    resPayments.push({
      username: user.username,
      email: user.email,
      sport: item.sport,
      date: item.date,
      time: item.time,
      amount: item.price,
      paidAt: today,
    });
  });
  localStorage.setItem("reservationPayments", JSON.stringify(resPayments));

  // Clear cart
  saveCart([]);
  alert(`${cart.length} reservation(s) confirmed! Total: ${totalPrice.toLocaleString()} ₺`);
  renderCart();
  renderMyReservations();
});

// ── Clear cart ────────────────────────────────────────────
document.getElementById("clear-btn").addEventListener("click", () => {
  const cart = getCart();
  if (cart.length === 0) return;
  if (!confirm("Remove all items from your cart?")) return;
  saveCart([]);
  renderCart();
});

// ── My confirmed reservations ─────────────────────────────
function renderMyReservations() {
  const user = getCurrentUser();
  if (!user) return;

  const reservations = getReservations().filter(r => r.userEmail === user.email);
  const tbody = document.getElementById("reservations-body");

  if (reservations.length === 0) {
    tbody.innerHTML = "<tr><td colspan='6'>No confirmed reservations yet.</td></tr>";
    return;
  }

  tbody.innerHTML = "";
  [...reservations].reverse().forEach(res => {
    // Check if date has passed
    const [d, m, y] = res.date.split("/").map(Number);
    const resDate = new Date(y, m - 1, d);
    const isPast = resDate < new Date(new Date().toDateString());
    const status = isPast ? "Completed" : res.status;
    const statusClass = isPast ? "status-completed" : "status-confirmed";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${res.sport}</strong></td>
      <td>${res.date}</td>
      <td>${res.time}</td>
      <td>${res.price} ₺</td>
      <td>${res.confirmedAt}</td>
      <td class="${statusClass}">${status}</td>
    `;
    tbody.appendChild(row);
  });
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  renderMyReservations();
});
