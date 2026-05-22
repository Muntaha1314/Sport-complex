import { getCurrentUser, updateCurrentUser } from "./LoginUtility.js";

if (!localStorage.getItem("isLoggedIn")) {
  window.location.href = "login.html";
}

const PACKAGES = {
  "2days":    { name: "2 Days / Week",     price: 600,  maxDays: 2 },
  "3days":    { name: "3 Days / Week",     price: 850,  maxDays: 3 },
  "timeslot": { name: "Daily Fixed Time",  price: 1100, maxDays: null },
};

let selectedPkg = null;

// ── Helpers ──────────────────────────────────────────────────
function fmtDate(date) {
  return date.toLocaleDateString("en-GB", { day:"2-digit", month:"2-digit", year:"numeric" });
}
function addOneMonth(dateStr) {
  const [d,m,y] = dateStr.split("/").map(Number);
  const dt = new Date(y, m-1, d);
  dt.setMonth(dt.getMonth() + 1);
  return fmtDate(dt);
}
function isExpired(dateStr) {
  const [d,m,y] = dateStr.split("/").map(Number);
  return new Date(y, m-1, d) < new Date();
}
function medicalOk(user) {
  const r = user.medicalReport;
  if (!r || !r.issueDate) return false;
  return !isExpired(r.expiryDate);
}

// ── Medical warning ──────────────────────────────────────────
function checkMedical() {
  const user = getCurrentUser();
  const warn = document.getElementById("medical-warning");
  if (!medicalOk(user)) {
    warn.classList.remove("hidden");
    document.querySelectorAll(".select-btn").forEach(b => {
      b.disabled = true;
      b.textContent = "Need Report";
    });
  } else {
    warn.classList.add("hidden");
  }
}

// ── Current subscription banner ──────────────────────────────
function showCurrentSub() {
  const user = getCurrentUser();
  const sub = user.subscription;
  const box = document.getElementById("current-sub-box");
  if (!sub) { box.classList.add("hidden"); return; }

  box.classList.remove("hidden", "expired-notice");
  if (isExpired(sub.endDate)) {
    box.classList.add("expired-notice");
    box.classList.remove("success");
    box.innerHTML = `Your <strong>${sub.packageName}</strong> subscription expired on <strong>${sub.endDate}</strong>. Please renew below.`;
  } else {
    box.classList.add("success");
    box.innerHTML = `Active: <strong>${sub.packageName}</strong> — ${sub.days}${sub.timeSlot ? " | " + sub.timeSlot : ""} — expires <strong>${sub.endDate}</strong>`;
  }
}

// ── Package select buttons ───────────────────────────────────
document.querySelectorAll(".select-btn").forEach(btn => {
  btn.addEventListener("click", function() {
    selectedPkg = this.dataset.pkg;
    const pkg = PACKAGES[selectedPkg];

    document.getElementById("form-title").textContent = "Subscribe: " + pkg.name;
    document.getElementById("form-price-info").textContent =
      `Price: ${pkg.price.toLocaleString()} ₺ — valid for 1 month.`;

    // Reset pickers
    document.getElementById("day-picker").classList.add("hidden");
    document.getElementById("timeslot-picker").classList.add("hidden");
    document.querySelectorAll("#day-checkboxes input").forEach(cb => cb.checked = false);
    document.getElementById("timeslot-select").value = "";

    if (selectedPkg === "2days" || selectedPkg === "3days") {
      const picker = document.getElementById("day-picker");
      picker.classList.remove("hidden");
      document.getElementById("day-picker-label").textContent =
        `Choose your ${pkg.maxDays} days:`;
    }
    if (selectedPkg === "timeslot") {
      document.getElementById("timeslot-picker").classList.remove("hidden");
    }

    document.getElementById("subscribe-form").classList.remove("hidden");
    document.getElementById("subscribe-form").scrollIntoView({ behavior: "smooth" });
  });
});

// ── Cancel ───────────────────────────────────────────────────
document.getElementById("cancel-select-btn").addEventListener("click", () => {
  selectedPkg = null;
  document.getElementById("subscribe-form").classList.add("hidden");
});

// ── Enforce checkbox max ─────────────────────────────────────
document.querySelectorAll("#day-checkboxes input").forEach(cb => {
  cb.addEventListener("change", () => {
    if (!selectedPkg) return;
    const max = PACKAGES[selectedPkg].maxDays;
    const checked = document.querySelectorAll("#day-checkboxes input:checked");
    if (checked.length > max) {
      cb.checked = false;
      alert(`You can only choose ${max} days for this package.`);
    }
  });
});

// ── Confirm subscribe ────────────────────────────────────────
document.getElementById("confirm-subscribe-btn").addEventListener("click", () => {
  if (!selectedPkg) return;
  const user = getCurrentUser();
  const pkg = PACKAGES[selectedPkg];

  // Check medical
  if (!medicalOk(user)) {
    alert("You need a valid medical fitness report to subscribe.");
    return;
  }

  // Collect days / slot
  let days = "Any";
  let timeSlot = null;

  if (selectedPkg === "2days" || selectedPkg === "3days") {
    const checked = [...document.querySelectorAll("#day-checkboxes input:checked")].map(c => c.value);
    if (checked.length < pkg.maxDays) {
      alert(`Please select exactly ${pkg.maxDays} days.`);
      return;
    }
    days = checked.join(", ");
  }
  if (selectedPkg === "timeslot") {
    timeSlot = document.getElementById("timeslot-select").value;
    if (!timeSlot) { alert("Please choose a time slot."); return; }
    days = "Mon – Sat";
  }

  // Check balance
  if ((user.balance || 0) < pkg.price) {
    alert(`Not enough balance. You need ${pkg.price} ₺ but have ${(user.balance || 0).toFixed(2)} ₺.\n\nPlease deposit funds in your wallet.`);
    return;
  }

  // Check for active subscription
  const hasActiveSub = user.subscription && !isExpired(user.subscription.endDate);
  if (hasActiveSub) {
    if (!confirm(`You already have an active subscription (${user.subscription.packageName}) until ${user.subscription.endDate}.\n\nReplace it with ${pkg.name}?\n\nDays: ${days}${timeSlot ? "\nTime: " + timeSlot : ""}\nCost: ${pkg.price} ₺\nExpires: ${addOneMonth(fmtDate(new Date()))}`)) return;
  }

  const today = fmtDate(new Date());
  const endDate = addOneMonth(today);

  if (!hasActiveSub && !confirm(`Confirm subscription?\n\nPackage: ${pkg.name}\nDays: ${days}${timeSlot ? "\nTime: " + timeSlot : ""}\nCost: ${pkg.price} ₺\nExpires: ${endDate}`)) return;

  const sub = { packageName: pkg.name, days, timeSlot, startDate: today, endDate, price: pkg.price };
  const history = user.subscriptionHistory || [];
  
  // If replacing an active subscription, mark the existing one in history as inactive
  if (hasActiveSub && history.length > 0) {
    // Find the most recent subscription in history and mark it as inactive
    for (let i = history.length - 1; i >= 0; i--) {
      if (!history[i].status || history[i].status === "active") {
        history[i].status = "inactive";
        break;
      }
    }
  }
  
  history.push(sub);

  updateCurrentUser({ balance: (user.balance - pkg.price), subscription: sub, subscriptionHistory: history });

  // Save to global payment log (for manager budget)
  const payments = JSON.parse(localStorage.getItem("subscriptionPayments")) || [];
  payments.push({ username: user.username, email: user.email, packageName: pkg.name, days, timeSlot, amount: pkg.price, startDate: today, endDate, paidAt: today });
  localStorage.setItem("subscriptionPayments", JSON.stringify(payments));

  document.getElementById("subscribe-form").classList.add("hidden");
  selectedPkg = null;
  alert(`Subscribed to ${pkg.name}! Valid until ${endDate}.`);
  showCurrentSub();
  renderHistory();
});

// ── History table ────────────────────────────────────────────
function renderHistory() {
  const user = getCurrentUser();
  const history = user.subscriptionHistory || [];
  const tbody = document.getElementById("history-body");
  if (history.length === 0) {
    tbody.innerHTML = "<tr><td colspan='6'>No subscription history yet.</td></tr>";
    return;
  }
  tbody.innerHTML = "";
  const reversed = [...history].reverse();
  reversed.forEach((sub, index) => {
    const isNewest = index === 0;
    const expired = isExpired(sub.endDate);
    
    let statusClass, statusText;
    if (isNewest && !expired) {
      statusClass = "status-active";
      statusText = "Active";
    } else {
      statusClass = "status-inactive";
      statusText = expired ? "Expired" : "Inactive";
    }
    
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${sub.packageName}</td>
      <td>${sub.days}${sub.timeSlot ? " | " + sub.timeSlot : ""}</td>
      <td>${sub.startDate}</td>
      <td>${sub.endDate}</td>
      <td>${sub.price.toLocaleString()} ₺</td>
      <td class="${statusClass}">${statusText}</td>
    `;
    tbody.appendChild(row);
  });
}

// ── Highlight active package row ─────────────────────────────
function highlightActiveRow() {
  const user = getCurrentUser();
  const sub = user.subscription;
  if (!sub || isExpired(sub.endDate)) return;
  const map = { "2 Days / Week": "2days", "3 Days / Week": "3days", "Daily Fixed Time": "timeslot" };
  const key = map[sub.packageName];
  if (key) {
    const btn = document.querySelector(`.select-btn[data-pkg="${key}"]`);
    if (btn) btn.closest("tr").classList.add("active-row");
  }
}

// ── Init ─────────────────────────────────────────────────────
checkMedical();
showCurrentSub();
renderHistory();
highlightActiveRow();
