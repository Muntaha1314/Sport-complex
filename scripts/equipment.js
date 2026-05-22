// equipment.js - Gym Equipment Management

const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if (!currentUser || currentUser.role !== "manager") {
  window.location.href = "login.html";
}

// ── Storage ───────────────────────────────────────────────
function getEquipment() { return JSON.parse(localStorage.getItem("gymEquipment")) || []; }
function saveEquipment(list) { localStorage.setItem("gymEquipment", JSON.stringify(list)); }
function fmtDate(str) {
  const dt = new Date(str + "T00:00:00");
  return dt.toLocaleDateString("en-GB", { day:"2-digit", month:"2-digit", year:"numeric" });
}
function genId() { return "EQ-" + Math.floor(1000 + Math.random() * 9000); }

// ── Summary cards ─────────────────────────────────────────
function updateSummary() {
  const list = getEquipment();
  let maint = 0, repair = 0;
  list.forEach(eq => (eq.records || []).forEach(r => {
    if (r.type === "maintenance") maint += r.cost;
    else repair += r.cost;
  }));
  document.getElementById("total-count").textContent  = list.length;
  document.getElementById("total-maint").textContent  = maint.toLocaleString()  + " ₺";
  document.getElementById("total-repair").textContent = repair.toLocaleString() + " ₺";
  document.getElementById("total-all").textContent    = (maint + repair).toLocaleString() + " ₺";
}

// ── Badge helper ──────────────────────────────────────────
function statusBadge(status) {
  const cls = { "Operational":"b-op", "Under Maintenance":"b-mnt", "Under Repair":"b-rep", "Out of Service":"b-out" };
  return `<span class="badge ${cls[status] || 'b-op'}">${status}</span>`;
}

// ── Render inventory table ────────────────────────────────
function renderList() {
  const list = getEquipment();
  const container = document.getElementById("equipment-list");
  if (list.length === 0) { container.innerHTML = '<p class="empty-msg">No equipment added yet.</p>'; updateSummary(); return; }

  let rows = list.map(eq => {
    const recs = eq.records || [];
    const mCost = recs.filter(r => r.type === "maintenance").reduce((s,r) => s+r.cost, 0);
    const rCost = recs.filter(r => r.type === "repair").reduce((s,r) => s+r.cost, 0);
    return `<tr>
      <td><strong>${eq.name}</strong></td>
      <td>${eq.type}</td>
      <td>${eq.serialNumber}</td>
      <td>${eq.purchaseDate}</td>
      <td>${statusBadge(eq.status)}</td>
      <td>${mCost.toLocaleString()} ₺</td>
      <td>${rCost.toLocaleString()} ₺</td>
      <td>
        <button class="rec-btn" data-id="${eq.id}">Records (${recs.length})</button>
        <button class="del-btn" data-id="${eq.id}" style="margin-left:4px;">Remove</button>
      </td>
    </tr>`;
  }).join("");

  container.innerHTML = `<table>
    <thead><tr><th>Name</th><th>Type</th><th>Serial</th><th>Purchased</th><th>Status</th><th>Maint. Cost</th><th>Repair Cost</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;

  container.querySelectorAll(".rec-btn").forEach(btn => btn.addEventListener("click", () => openModal(btn.dataset.id)));
  container.querySelectorAll(".del-btn").forEach(btn => btn.addEventListener("click", () => {
    const eq = getEquipment().find(e => e.id === btn.dataset.id);
    if (confirm(`Remove "${eq.name}"? All records will be lost.`)) {
      saveEquipment(getEquipment().filter(e => e.id !== btn.dataset.id));
      renderList();
    }
  }));
  updateSummary();
}

// ── Add equipment ─────────────────────────────────────────
document.getElementById("add-equipment-btn").addEventListener("click", () => {
  const name = document.getElementById("eq-name").value.trim();
  const type = document.getElementById("eq-type").value;
  const serial = document.getElementById("eq-serial").value.trim() || "—";
  const purchaseDate = document.getElementById("eq-purchase-date").value;
  if (!name) { alert("Please enter the equipment name."); return; }

  const list = getEquipment();
  list.push({ id: genId(), name, type, serialNumber: serial, purchaseDate: purchaseDate ? fmtDate(purchaseDate) : "—", status: "Operational", records: [] });
  saveEquipment(list);
  document.getElementById("eq-name").value = "";
  document.getElementById("eq-serial").value = "";
  document.getElementById("eq-purchase-date").value = "";
  renderList();
});

// ── Modal ─────────────────────────────────────────────────
let activeId = null;

function openModal(id) {
  activeId = id;
  const eq = getEquipment().find(e => e.id === id);
  document.getElementById("modal-title").textContent = eq.name + " — Records";
  document.getElementById("modal-info").textContent = `Type: ${eq.type}  |  Serial: ${eq.serialNumber}  |  Purchased: ${eq.purchaseDate}  |  Status: ${eq.status}`;
  document.getElementById("status-select").value = eq.status;
  document.getElementById("rec-date").value = new Date().toISOString().split("T")[0];
  renderRecords(eq);
  document.getElementById("modal-overlay").classList.remove("hidden");
  document.getElementById("record-modal").classList.remove("hidden");
}

function closeModal() {
  activeId = null;
  document.getElementById("modal-overlay").classList.add("hidden");
  document.getElementById("record-modal").classList.add("hidden");
}

document.getElementById("close-modal").addEventListener("click", closeModal);
document.getElementById("modal-overlay").addEventListener("click", closeModal);

// ── Render records table ──────────────────────────────────
function renderRecords(eq) {
  const recs = eq.records || [];
  const tbody = document.getElementById("rec-tbody");
  if (recs.length === 0) { tbody.innerHTML = "<tr><td colspan='6'>No records yet.</td></tr>"; document.getElementById("rec-totals").textContent = ""; return; }

  tbody.innerHTML = "";
  [...recs].reverse().forEach((rec, ri) => {
    const origIdx = recs.length - 1 - ri;
    const typeLabel = rec.type === "maintenance"
      ? '<span class="t-maint">Maintenance</span>'
      : '<span class="t-repair">Repair (service center)</span>';
    const row = document.createElement("tr");
    row.innerHTML = `<td>${typeLabel}</td><td>${rec.date}</td><td>${rec.by}</td><td style="text-align:left">${rec.notes}</td><td>${rec.cost.toLocaleString()} ₺</td><td><button class="del-btn del-rec" data-idx="${origIdx}">✕</button></td>`;
    row.querySelector(".del-rec").addEventListener("click", function() { deleteRecord(eq.id, parseInt(this.dataset.idx)); });
    tbody.appendChild(row);
  });

  const mCost = recs.filter(r => r.type === "maintenance").reduce((s,r) => s+r.cost, 0);
  const rCost = recs.filter(r => r.type === "repair").reduce((s,r) => s+r.cost, 0);
  document.getElementById("rec-totals").textContent =
    `Maintenance: ${mCost.toLocaleString()} ₺  |  Repair: ${rCost.toLocaleString()} ₺  |  Total: ${(mCost+rCost).toLocaleString()} ₺`;
}

// ── Save record ───────────────────────────────────────────
document.getElementById("save-record-btn").addEventListener("click", () => {
  if (!activeId) return;
  const type  = document.getElementById("rec-type").value;
  const date  = document.getElementById("rec-date").value;
  const by    = document.getElementById("rec-by").value.trim();
  const cost  = parseFloat(document.getElementById("rec-cost").value) || 0;
  const notes = document.getElementById("rec-notes").value.trim();
  if (!date) { alert("Please select a date."); return; }
  if (!by)   { alert("Please enter who performed the work."); return; }
  if (!notes){ alert("Please add a description."); return; }

  const list = getEquipment();
  const eq = list.find(e => e.id === activeId);
  eq.records.push({ type, date: fmtDate(date), by: type === "repair" ? by + " (service center)" : by, cost, notes });
  saveEquipment(list);
  document.getElementById("rec-by").value = "";
  document.getElementById("rec-cost").value = "";
  document.getElementById("rec-notes").value = "";
  renderRecords(eq);
  renderList();
});

// ── Delete record ─────────────────────────────────────────
function deleteRecord(eqId, idx) {
  if (!confirm("Delete this record?")) return;
  const list = getEquipment();
  const eq = list.find(e => e.id === eqId);
  eq.records.splice(idx, 1);
  saveEquipment(list);
  renderRecords(eq);
  renderList();
}

// ── Update status ─────────────────────────────────────────
document.getElementById("update-status-btn").addEventListener("click", () => {
  if (!activeId) return;
  const newStatus = document.getElementById("status-select").value;
  const list = getEquipment();
  const eq = list.find(e => e.id === activeId);
  eq.status = newStatus;
  saveEquipment(list);
  document.getElementById("modal-info").textContent = `Type: ${eq.type}  |  Serial: ${eq.serialNumber}  |  Purchased: ${eq.purchaseDate}  |  Status: ${newStatus}`;
  renderList();
  alert("Status updated to: " + newStatus);
});

// ── Toggle label for record type ──────────────────────────
document.getElementById("rec-type").addEventListener("change", function() {
  document.getElementById("rec-by-label").textContent =
    this.value === "repair" ? "Service Center Name" : "Performed By";
  document.getElementById("rec-by").placeholder =
    this.value === "repair" ? "e.g. TechFix Istanbul" : "e.g. Ali (gym technician)";
});

// ── Init ──────────────────────────────────────────────────
renderList();
