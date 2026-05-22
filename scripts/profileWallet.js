import { updateCurrentUser, getCurrentUser } from "./LoginUtility.js";
// this function is responsible of loading the profile picture chosen by the user
function profilePicLoad() {
  document
    .getElementById("profile-pic")
    .addEventListener("change", function (event) {
      const file = event.target.files[0];
      const profileImage = document.getElementById("profile-image");
      const fallbackText = document.getElementById("fallback-text");

      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          profileImage.src = e.target.result;
          profileImage.style.display = "block";
          fallbackText.style.display = "none";
        };
        reader.readAsDataURL(file);
      }
    });
}
profilePicLoad();

// this function display the balance, and call the showDeposit input function when user want to deposit
function displayBalance() {
  document.addEventListener("DOMContentLoaded", function () {
    const balanceElement = document.getElementById("balance");
    let balance = getCurrentUser().balance;
    balanceElement.textContent = balance.toFixed(2); // Show balance with 2 decimal places

    document
      .getElementById("add-deposit-btn")
      .addEventListener("click", function () {
        showDepositInput();
      });
  });
}
displayBalance();

function showDepositInput() {
  const walletDiv = document.querySelector(".wallet");

  // Check if input already exists
  if (document.querySelector(".enter-amount-container")) return;

  const amountDiv = document.createElement("div");
  amountDiv.classList.add("enter-amount-container");
  amountDiv.innerHTML = `
      <input id="amount-input" type="number" placeholder="Enter deposit" />
      <button id="confirm-amount-btn">Confirm</button>
    `;

  walletDiv.appendChild(amountDiv);

  // Add event listener for confirmation
  document
    .getElementById("confirm-amount-btn")
    .addEventListener("click", function () {
      updateBalance();
    });

  // just for better UI do the same thing when Enter is pressed
  document
    .getElementById("amount-input")
    .addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        updateBalance();
      }
    });
}

function updateBalance() {
  const inputElement = document.getElementById("amount-input");
  const balanceElement = document.getElementById("balance");
  let balance = getCurrentUser().balance;
  let amount = parseFloat(inputElement.value);

  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid amount.");
    return;
  }

  balance += amount;
  updateCurrentUser({ balance: balance });
  balanceElement.textContent = balance.toFixed(2); // Update UI with new balance

  // Remove input field after confirming
  document.querySelector(".enter-amount-container").remove();
}


// ── Display extra user fields ─────────────────────────────────────
function displayUserInfo() {
  const user = getCurrentUser();
  document.querySelector(".user-name-p").textContent  = user.username  || "—";
  document.querySelector(".user-email-p").textContent = user.email     || "—";
  document.querySelector(".user-phone-p").textContent = user.phone     || "Not provided";
  document.querySelector(".user-dob-p").textContent   = user.dob       || "Not provided";
}
displayUserInfo();

// ── Helpers ───────────────────────────────────────────────────────
function fmtDate(date) {
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function getExpiryDate(issueDateStr) {
  const dt = new Date(issueDateStr + "T00:00:00");
  dt.setFullYear(dt.getFullYear() + 1);
  return fmtDate(dt);
}
function getMedicalStatus(report) {
  if (!report || !report.issueDate) return "missing";
  const [d, m, y] = report.expiryDate.split("/").map(Number);
  const expDt = new Date(y, m - 1, d);
  if (expDt < new Date()) return "expired";
  const daysLeft = Math.ceil((expDt - new Date()) / (86400000));
  return daysLeft <= 30 ? "expiring" : "valid";
}

// ── Medical report status display ─────────────────────────────────
function renderMedicalStatus() {
  const user = getCurrentUser();
  const card = document.getElementById("medical-status-card");
  const text = document.getElementById("medical-status-text");
  const formTitle = document.getElementById("medical-form-title");
  if (!card) return;

  const report = user.medicalReport;
  const status = getMedicalStatus(report);

  card.className = "status-card";
  if (status !== "missing") card.classList.add(status);

  if (status === "missing") {
    text.textContent = "No report on file. Please fill in the form below.";
    formTitle.textContent = "Add Medical Report";
  } else {
    const [d, m, y] = report.expiryDate.split("/").map(Number);
    const daysLeft = Math.ceil((new Date(y, m-1, d) - new Date()) / 86400000);
    if (status === "valid") {
      text.textContent = `Valid — issued by ${report.issuedBy} on ${report.issueDate}. Expires ${report.expiryDate} (${daysLeft} days left).`;
    } else if (status === "expiring") {
      text.textContent = `Expiring soon! Expires ${report.expiryDate} — only ${daysLeft} days left. Please renew.`;
    } else {
      text.textContent = `Expired on ${report.expiryDate}. You need to renew this report to use gym services.`;
    }
    formTitle.textContent = "Update Medical Report";
    document.getElementById("medical-issuer").value = report.issuedBy || "";
  }
}

// ── Save medical report ───────────────────────────────────────────
function setupMedicalForm() {
  const saveBtn = document.getElementById("save-medical-btn");
  if (!saveBtn) return;

  document.getElementById("medical-issue-date").max = new Date().toISOString().split("T")[0];

  saveBtn.addEventListener("click", () => {
    const issueDate = document.getElementById("medical-issue-date").value;
    const issuedBy  = document.getElementById("medical-issuer").value.trim();
    if (!issueDate) { alert("Please select the issue date."); return; }
    if (!issuedBy)  { alert("Please enter the doctor or institution name."); return; }

    const issueDateFmt = fmtDate(new Date(issueDate + "T00:00:00"));
    const expiryDate   = getExpiryDate(issueDate);

    updateCurrentUser({ medicalReport: { issueDate: issueDateFmt, expiryDate, issuedBy } });
    alert(`Report saved. Valid until ${expiryDate}.`);
    renderMedicalStatus();
  });
}

// ── Subscription summary ──────────────────────────────────────────
function renderSubSummary() {
  const user = getCurrentUser();
  const card = document.getElementById("sub-summary-card");
  if (!card) return;
  const sub = user.subscription;
  if (!sub) { card.className = "status-card"; return; }

  const [d, m, y] = sub.endDate.split("/").map(Number);
  const expired = new Date(y, m-1, d) < new Date();

  card.className = "status-card " + (expired ? "expired" : "valid");
  if (expired) {
    card.innerHTML = `Your <strong>${sub.packageName}</strong> subscription expired on ${sub.endDate}. <a href="subscriptions.html">Renew →</a>`;
  } else {
    card.innerHTML = `<strong>${sub.packageName}</strong> — ${sub.days}${sub.timeSlot ? " | " + sub.timeSlot : ""}<br>Expires <strong>${sub.endDate}</strong> &nbsp; <a href="subscriptions.html">Manage →</a>`;
  }
}

// ── Init ──────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  renderMedicalStatus();
  setupMedicalForm();
  renderSubSummary();
});
