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
    const subscriptions = JSON.parse(localStorage.getItem("subscriptions")) || [];
    const reservations = JSON.parse(localStorage.getItem("reservations")) || [];
    const equipment = JSON.parse(localStorage.getItem("equipment")) || [];

    // Calculate income
    let subRevenue = 0;
    let resRevenue = 0;

    subscriptions.forEach((sub) => {
      if (sub.price) subRevenue += parseFloat(sub.price);
    });

    reservations.forEach((res) => {
      if (res.price) resRevenue += parseFloat(res.price);
    });

    const totalIncome = subRevenue + resRevenue;

    // Calculate expenses
    let maintenanceCosts = 0;
    let repairCosts = 0;

    equipment.forEach((item) => {
      if (item.maintenanceCost) maintenanceCosts += parseFloat(item.maintenanceCost);
      if (item.repairCost) repairCosts += parseFloat(item.repairCost);
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
    loadSubscriptionPayments(subscriptions);
  }

  function updateBudgetCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = parseFloat(value).toFixed(2) + " ₺";
    }
  }

  function loadSubscriptionPayments(subscriptions) {
    const tbody = document.getElementById("sub-payments-body");
    if (!tbody) return;

    if (subscriptions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7">No subscription payments yet.</td></tr>';
      return;
    }

    tbody.innerHTML = subscriptions
      .map(
        (sub) => `
        <tr>
          <td>${sanitize(sub.username || "N/A")}</td>
          <td>${sanitize(sub.package || "N/A")}</td>
          <td>${sanitize(sub.duration || "N/A")}</td>
          <td>${sanitize(sub.startDate || "N/A")}</td>
          <td>${sanitize(sub.expiryDate || "N/A")}</td>
          <td>${sub.price || 0} ₺</td>
          <td>${sanitize(sub.purchaseDate || "N/A")}</td>
        </tr>
      `
      )
      .join("");
  }

  // ─────────────────────────────────────────────────────
  // TAB 4: EQUIPMENT OVERVIEW
  // ─────────────────────────────────────────────────────

  function loadEquipmentOverview() {
    const equipment = JSON.parse(localStorage.getItem("equipment")) || [];
    const overviewDiv = document.getElementById("equipment-overview");

    if (!overviewDiv) return;

    if (equipment.length === 0) {
      overviewDiv.innerHTML = "<p>No equipment recorded.</p>";
      return;
    }

    let totalCost = 0;
    let maintenanceCost = 0;
    let repairCost = 0;

    const status = {
      operational: 0,
      maintenance: 0,
      repair: 0,
    };

    equipment.forEach((item) => {
      if (item.price) totalCost += parseFloat(item.price);
      if (item.maintenanceCost) maintenanceCost += parseFloat(item.maintenanceCost);
      if (item.repairCost) repairCost += parseFloat(item.repairCost);

      const itemStatus = item.status || "operational";
      if (status[itemStatus] !== undefined) status[itemStatus]++;
    });

    const summary = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin: 16px 0;">
        <div class="budget-card card-green">
          <div class="bcard-label">Total Equipment Value</div>
          <div class="bcard-value">${totalCost.toFixed(2)} ₺</div>
        </div>
        <div class="budget-card card-red">
          <div class="bcard-label">Maintenance Costs</div>
          <div class="bcard-value">${maintenanceCost.toFixed(2)} ₺</div>
        </div>
        <div class="budget-card card-orange">
          <div class="bcard-label">Repair Costs</div>
          <div class="bcard-value">${repairCost.toFixed(2)} ₺</div>
        </div>
        <div class="budget-card card-blue">
          <div class="bcard-label">Operational</div>
          <div class="bcard-value">${status.operational}</div>
        </div>
        <div class="budget-card card-yellow">
          <div class="bcard-label">Under Maintenance</div>
          <div class="bcard-value">${status.maintenance}</div>
        </div>
        <div class="budget-card card-gray">
          <div class="bcard-label">Repair Pending</div>
          <div class="bcard-value">${status.repair}</div>
        </div>
      </div>
    `;

    overviewDiv.innerHTML = summary;
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
