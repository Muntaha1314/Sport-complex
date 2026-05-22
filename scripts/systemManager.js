// systemManager.js — Gym Management System Admin Dashboard
// =========================================================

(function () {
  "use strict";

  // ─────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────
  
  document.addEventListener("DOMContentLoaded", function () {
    // Check if admin is logged in
    if (localStorage.getItem("isLoggedIn") !== "true") {
      window.location.href = "login.html";
      return;
    }

    initializeEventListeners();
    loadInitialData();
  });

  // ─────────────────────────────────────────────────────
  // EVENT LISTENERS
  // ─────────────────────────────────────────────────────

  function initializeEventListeners() {
    // Tab navigation
    const tabButtons = document.querySelectorAll(".tab-btn");
    tabButtons.forEach((btn) => {
      btn.addEventListener("click", function () {
        switchTab(this.getAttribute("data-tab"));
      });
    });

    // Logout button
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", handleLogout);
    }

    // Filter listeners
    const medicalFilter = document.getElementById("medical-filter");
    const subFilter = document.getElementById("sub-filter");
    const resSportFilter = document.getElementById("res-sport-filter");

    if (medicalFilter) medicalFilter.addEventListener("change", filterSubscribers);
    if (subFilter) subFilter.addEventListener("change", filterSubscribers);
    if (resSportFilter) resSportFilter.addEventListener("change", filterReservations);
  }

  // ─────────────────────────────────────────────────────
  // TAB SWITCHING
  // ─────────────────────────────────────────────────────

  function switchTab(tabName) {
    // Hide all tabs
    const tabContents = document.querySelectorAll(".tab-content");
    tabContents.forEach((tab) => tab.classList.remove("active"));

    // Deactivate all buttons
    const tabBtns = document.querySelectorAll(".tab-btn");
    tabBtns.forEach((btn) => btn.classList.remove("active"));

    // Show selected tab
    const selectedTab = document.getElementById("tab-" + tabName);
    if (selectedTab) {
      selectedTab.classList.add("active");
    }

    // Activate selected button
    const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedBtn) {
      selectedBtn.classList.add("active");
    }

    // Load data for the tab
    switch (tabName) {
      case "members":
        loadMembers();
        break;
      case "subscribers":
        loadSubscribers();
        break;
      case "budget":
        loadBudgetData();
        break;
      case "equipment-tab":
        loadEquipmentOverview();
        break;
      case "reservations-tab":
        loadReservations();
        break;
      case "feedback-tab":
        loadFeedback();
        break;
    }
  }

  // ─────────────────────────────────────────────────────
  // INITIAL DATA LOAD
  // ─────────────────────────────────────────────────────

  function loadInitialData() {
    loadMembers();
  }

  // ─────────────────────────────────────────────────────
  // TAB 1: MEMBERS
  // ─────────────────────────────────────────────────────

  function loadMembers() {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const tbody = document.getElementById("members-table");

    if (!tbody) return;

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No members found.</td></tr>';
      return;
    }

    tbody.innerHTML = users
      .map(
        (user) => `
        <tr>
          <td>${sanitize(user.username)}</td>
          <td>${sanitize(user.email)}</td>
          <td>${sanitize(user.phone || "N/A")}</td>
          <td>${sanitize(user.dob || "N/A")}</td>
          <td>${user.balance || 0} ₺</td>
        </tr>
      `
      )
      .join("");
  }

  // ─────────────────────────────────────────────────────
  // TAB 2: SUBSCRIBERS & MEDICAL
  // ─────────────────────────────────────────────────────

  function loadSubscribers() {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    displaySubscribers(users);
  }

  function displaySubscribers(users) {
    const tbody = document.getElementById("subscribers-body");
    if (!tbody) return;

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7">No subscribers found.</td></tr>';
      return;
    }

    tbody.innerHTML = users
      .map((user) => {
        const subExpiry = user.subscription?.expiryDate || "N/A";
        const medicalIssuer = user.medicalReport?.issuer || "N/A";
        const medicalExpiry = user.medicalReport?.expiryDate || "N/A";
        const medicalStatus = calculateMedicalStatus(user.medicalReport);

        return `
          <tr>
            <td>${sanitize(user.username)}</td>
            <td>${sanitize(user.email)}</td>
            <td>${sanitize(user.subscription?.package || "None")}</td>
            <td>${sanitize(subExpiry)}</td>
            <td>${sanitize(medicalIssuer)}</td>
            <td>${sanitize(medicalExpiry)}</td>
            <td><span class="badge badge-${medicalStatus.toLowerCase()}">${medicalStatus}</span></td>
          </tr>
        `;
      })
      .join("");
  }

  function filterSubscribers() {
    const medicalValue = document.getElementById("medical-filter")?.value || "all";
    const subValue = document.getElementById("sub-filter")?.value || "all";
    const users = JSON.parse(localStorage.getItem("users")) || [];

    const filtered = users.filter((user) => {
      // Medical filter
      if (medicalValue !== "all") {
        const status = calculateMedicalStatus(user.medicalReport);
        if (
          (medicalValue === "valid" && status !== "Valid") ||
          (medicalValue === "expiring" && status !== "Expiring Soon") ||
          (medicalValue === "expired" && status !== "Expired") ||
          (medicalValue === "missing" && status !== "Missing")
        ) {
          return false;
        }
      }

      // Subscription filter
      if (subValue !== "all") {
        const hasActiveSub = user.subscription && !isExpired(user.subscription.expiryDate);
        if ((subValue === "active" && !hasActiveSub) || (subValue === "none" && hasActiveSub)) {
          return false;
        }
      }

      return true;
    });

    displaySubscribers(filtered);
  }

  function calculateMedicalStatus(medicalReport) {
    if (!medicalReport || !medicalReport.expiryDate) return "Missing";

    const today = new Date();
    const expiry = new Date(medicalReport.expiryDate);
    const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return "Expired";
    if (daysUntilExpiry <= 30) return "Expiring Soon";
    return "Valid";
  }

  function isExpired(dateString) {
    if (!dateString) return true;
    return new Date(dateString) < new Date();
  }

  // ─────────────────────────────────────────────────────
  // TAB 3: BUDGET & PAYMENTS
  // ─────────────────────────────────────────────────────

  function loadBudgetData() {
    // Read subscription payments from global payment log
    const subscriptionPayments = JSON.parse(localStorage.getItem("subscriptionPayments")) || [];
    const reservations = JSON.parse(localStorage.getItem("reservations")) || [];
    const equipment = JSON.parse(localStorage.getItem("gymEquipment")) || [];

    // Calculate income from subscription payments
    let subRevenue = 0;
    subscriptionPayments.forEach((payment) => {
      if (payment.amount) subRevenue += parseFloat(payment.amount);
    });

    // Calculate income from reservations
    let resRevenue = 0;
    reservations.forEach((res) => {
      if (res.price) resRevenue += parseFloat(res.price);
    });

    const totalIncome = subRevenue + resRevenue;

    // Calculate expenses from equipment records
    let maintenanceCosts = 0;
    let repairCosts = 0;

    equipment.forEach((item) => {
      const records = item.records || [];
      records.forEach((rec) => {
        if (rec.type === "maintenance") {
          maintenanceCosts += parseFloat(rec.cost) || 0;
        } else if (rec.type === "repair") {
          repairCosts += parseFloat(rec.cost) || 0;
        }
      });
    });

    const totalExpenses = maintenanceCosts + repairCosts;
    const netBalance = totalIncome - totalExpenses;

    // Update budget cards
    updateBudgetCard("budget-sub-revenue", totalIncome);
    updateBudgetCard("budget-maint-costs", maintenanceCosts);
    updateBudgetCard("budget-repair-costs", repairCosts);
    updateBudgetCard("budget-total-expenses", totalExpenses);
    updateBudgetCard("budget-net", netBalance);

    // Load subscription payments
    loadSubscriptionPayments(subscriptionPayments);
  }

  function updateBudgetCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = parseFloat(value).toFixed(2) + " ₺";
    }
  }

  function loadSubscriptionPayments(subscriptionPayments) {
    const tbody = document.getElementById("sub-payments-body");
    if (!tbody) return;

    if (subscriptionPayments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No subscription payments yet.</td></tr>';
      return;
    }

    tbody.innerHTML = subscriptionPayments
      .map(
        (payment) => `
        <tr>
          <td>${sanitize(payment.username || "N/A")}</td>
          <td>${sanitize(payment.packageName || "N/A")}</td>
          <td>${payment.amount || 0} ₺</td>
          <td>${sanitize(payment.startDate || "N/A")}</td>
          <td>${sanitize(payment.paidAt || "N/A")}</td>
        </tr>
      `
      )
      .join("");
  }

  // ─────────────────────────────────────────────────────
  // TAB 4: EQUIPMENT OVERVIEW
  // ─────────────────────────────────────────────────────

  function loadEquipmentOverview() {
    // Equipment is stored under "gymEquipment" key in localStorage
    const equipment = JSON.parse(localStorage.getItem("gymEquipment")) || [];
    const overviewDiv = document.getElementById("equipment-overview");

    if (!overviewDiv) return;

    if (equipment.length === 0) {
      overviewDiv.innerHTML = "<p>No equipment recorded.</p>";
      return;
    }

    // Create table with equipment list
    const rows = equipment
      .map(
        (item) => `
        <tr>
          <td>${sanitize(item.name)}</td>
          <td>${sanitize(item.type)}</td>
          <td>${sanitize(item.serialNumber || "N/A")}</td>
          <td>${sanitize(item.purchaseDate || "N/A")}</td>
          <td><span class="status-badge status-${item.status.toLowerCase().replace(/ /g, "-")}">${item.status}</span></td>
          <td>${(item.records || []).length}</td>
        </tr>
      `
      )
      .join("");

    const tableHTML = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <thead>
          <tr style="background-color: #f5f5f5; border-bottom: 2px solid #ddd;">
            <th style="padding: 12px; text-align: left; font-weight: bold;">Name</th>
            <th style="padding: 12px; text-align: left; font-weight: bold;">Type</th>
            <th style="padding: 12px; text-align: left; font-weight: bold;">Serial Number</th>
            <th style="padding: 12px; text-align: left; font-weight: bold;">Purchase Date</th>
            <th style="padding: 12px; text-align: left; font-weight: bold;">Status</th>
            <th style="padding: 12px; text-align: center; font-weight: bold;">Records</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <style>
        table tbody tr { border-bottom: 1px solid #eee; }
        table tbody tr:hover { background-color: #f9f9f9; }
        table td { padding: 12px; }
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          color: white;
        }
        .status-operational { background-color: #27ae60; }
        .status-under-maintenance { background-color: #f39c12; }
        .status-under-repair { background-color: #e74c3c; }
        .status-out-of-service { background-color: #95a5a6; }
      </style>
    `;

    overviewDiv.innerHTML = tableHTML;
  }

  // ─────────────────────────────────────────────────────
  // TAB 5: RESERVATIONS
  // ─────────────────────────────────────────────────────

  function loadReservations() {
    const reservations = JSON.parse(localStorage.getItem("reservations")) || [];
    displayReservations(reservations);
  }

  function displayReservations(reservations) {
    const tbody = document.getElementById("reservations-admin-body");
    if (!tbody) return;

    if (reservations.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7">No reservations found.</td></tr>';
      return;
    }

    tbody.innerHTML = reservations
      .map(
        (res) => `
        <tr>
          <td>${sanitize(res.username || "N/A")}</td>
          <td>${sanitize(res.userEmail || "N/A")}</td>
          <td>${sanitize(res.sport || "N/A")}</td>
          <td>${sanitize(res.date || "N/A")}</td>
          <td>${sanitize(res.time || "N/A")}</td>
          <td>${res.price || 0} ₺</td>
          <td>${sanitize(res.confirmationDate || "N/A")}</td>
        </tr>
      `
      )
      .join("");
  }

  function filterReservations() {
    const sportFilter = document.getElementById("res-sport-filter")?.value || "all";
    const reservations = JSON.parse(localStorage.getItem("reservations")) || [];

    const filtered =
      sportFilter === "all" ? reservations : reservations.filter((res) => res.sport === sportFilter);

    displayReservations(filtered);
  }

  // ─────────────────────────────────────────────────────
  // TAB 6: FEEDBACK
  // ─────────────────────────────────────────────────────

  function loadFeedback() {
    const feedback = JSON.parse(localStorage.getItem("userFeedback")) || [];
    const feedbackList = document.getElementById("feedback-list");

    if (!feedbackList) return;

    if (feedback.length === 0) {
      feedbackList.innerHTML = "<li>No feedback submitted yet.</li>";
      return;
    }

    feedbackList.innerHTML = feedback
      .map((fb) => `<li><strong>${sanitize(fb || "Anonymous")}:</strong> ${sanitize(fb)}</li>`)
      .join("");
  }

  // ─────────────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────────────

  function handleLogout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
  }

  // ─────────────────────────────────────────────────────
  // UTILITY FUNCTIONS
  // ─────────────────────────────────────────────────────

  function sanitize(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
})();
