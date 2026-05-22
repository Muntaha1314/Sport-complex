// reservationTimes.js — Sports Complex Reservation Module
import { getCurrentUser } from "./LoginUtility.js";

// ── Auth guard ────────────────────────────────────────────
if (!localStorage.getItem("isLoggedIn")) {
  window.location.href = "login.html";
}

// ── Sport configuration ───────────────────────────────────
const SPORTS = {
  football: { name: "Football", price: 200, capacity: 1, icon: "⚽" },
  swimming: { name: "Swimming", price: 100, capacity: 40, icon: "🏊" },
  tennis:   { name: "Tennis",   price: 150, capacity: 1, icon: "🎾" },
};

// ── Time slots (hourly, Mon–Sat) ──────────────────────────
const TIME_SLOTS = [
  "09:00-10:00", "10:00-11:00", "11:00-12:00",
  "12:00-13:00", "13:00-14:00", "14:00-15:00",
  "15:00-16:00", "16:00-17:00", "17:00-18:00",
  "18:00-19:00", "19:00-20:00", "20:00-21:00",
];

// ── Storage helpers ───────────────────────────────────────
function getReservations() {
  return JSON.parse(localStorage.getItem("reservations")) || [];
}

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

function updateCartCount() {
  const cart = getCart();
  document.querySelectorAll(".cart-count").forEach(el => {
    el.textContent = cart.length;
  });
}

// ── Date picker ───────────────────────────────────────────
const dateInput = document.getElementById("res-date");
const dateStatus = document.getElementById("date-status");
const sportsSections = document.getElementById("sports-sections");
const sundayMsg = document.getElementById("sunday-msg");

// Set min date to today
const today = new Date();
dateInput.min = today.toISOString().split("T")[0];
dateInput.value = today.toISOString().split("T")[0];

dateInput.addEventListener("change", loadSlots);

function fmtDate(dateStr) {
  const dt = new Date(dateStr + "T00:00:00");
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── Load slots for selected date ──────────────────────────
function loadSlots() {
  const dateStr = dateInput.value;
  if (!dateStr) return;

  const selectedDate = new Date(dateStr + "T00:00:00");
  const dayOfWeek = selectedDate.getDay();

  // Sunday check
  if (dayOfWeek === 0) {
    sportsSections.classList.add("hidden");
    sundayMsg.classList.remove("hidden");
    dateStatus.textContent = "❌ Closed on Sundays";
    dateStatus.className = "date-status status-closed";
    return;
  }

  sundayMsg.classList.add("hidden");
  sportsSections.classList.remove("hidden");

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  dateStatus.textContent = `📅 ${dayNames[dayOfWeek]}, ${fmtDate(dateStr)}`;
  dateStatus.className = "date-status status-open";

  const formattedDate = fmtDate(dateStr);
  const reservations = getReservations();
  const cart = getCart();

  // Render each sport's slots
  Object.keys(SPORTS).forEach(sportKey => {
    const sport = SPORTS[sportKey];
    const container = document.getElementById(sportKey + "-slots");
    container.innerHTML = "";

    TIME_SLOTS.forEach(slot => {
      // Count existing reservations for this sport/date/slot
      const resCount = reservations.filter(r =>
        r.sport === sport.name && r.date === formattedDate && r.time === slot
      ).length;

      // Check if already in this user's cart
      const inCart = cart.some(c =>
        c.sport === sport.name && c.date === formattedDate && c.time === slot
      );

      const remaining = sport.capacity - resCount;
      const isFull = remaining <= 0;

      const slotEl = document.createElement("div");
      slotEl.className = "slot-card";

      if (inCart) {
        slotEl.classList.add("slot-in-cart");
        slotEl.innerHTML = `
          <div class="slot-time">${slot}</div>
          <div class="slot-status">🛒 In Cart</div>
        `;
      } else if (isFull) {
        slotEl.classList.add("slot-reserved");
        slotEl.innerHTML = `
          <div class="slot-time">${slot}</div>
          <div class="slot-status">Full</div>
        `;
      } else {
        slotEl.classList.add("slot-available");
        slotEl.innerHTML = `
          <div class="slot-time">${slot}</div>
          <div class="slot-price">${sport.price} ₺</div>
          ${sport.capacity > 1 ? `<div class="slot-capacity">${remaining}/${sport.capacity} spots</div>` : ""}
          <button class="slot-add-btn">+ Add to Cart</button>
        `;

        slotEl.querySelector(".slot-add-btn").addEventListener("click", () => {
          addToCart(sport.name, formattedDate, slot, sport.price);
        });
      }

      container.appendChild(slotEl);
    });
  });
}

// ── Add to cart ───────────────────────────────────────────
function addToCart(sport, date, time, price) {
  const user = getCurrentUser();
  if (!user) {
    alert("Please log in to make a reservation.");
    return;
  }

  const cart = getCart();

  // Check if already in cart
  const exists = cart.some(c => c.sport === sport && c.date === date && c.time === time);
  if (exists) {
    alert("This slot is already in your cart.");
    return;
  }

  // Check if already reserved by this user
  const reservations = getReservations();
  const alreadyReserved = reservations.some(r =>
    r.sport === sport && r.date === date && r.time === time && r.userEmail === user.email
  );
  if (alreadyReserved) {
    alert("You already have a reservation for this slot.");
    return;
  }

  cart.push({
    sport,
    date,
    time,
    price,
    addedAt: new Date().toISOString(),
  });

  saveCart(cart);
  updateCartCount();
  loadSlots(); // Refresh to show "In Cart" state
  alert(`${sport} slot (${time}) on ${date} added to cart!`);
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  loadSlots();
});
