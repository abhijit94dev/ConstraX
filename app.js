/* =========================================================
   CONSTRUCTION TRACKER - APP.JS
   ========================================================= */

// =========================================================
// CONFIGURATION
// =========================================================
const CONFIG = {
  // *** IMPORTANT: Replace this with your actual Google Apps Script Web App URL ***
  API_URL: "https://script.google.com/macros/s/AKfycbxOldS-w3342-E6FF4EAet3z3VoxoivpYMW3qzDEEU_oMBWhmurbcAsnKbXL6Pfb-ZL/exec",

  // For demo/testing without backend, set to true to use mock data
  USE_MOCK: false
};

// =========================================================
// STATE
// =========================================================
let state = {
  user: null,
  isAdmin: false,
  currentPage: "dashboard",
  allData: [],
  editMode: false
};

// =========================================================
// DOM REFS
// =========================================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// =========================================================
// TOAST NOTIFICATIONS
// =========================================================
function showToast(message, type = "success") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// =========================================================
// LOADING SPINNER
// =========================================================
function showLoading(show = true) {
  document.getElementById("globalSpinner").classList.toggle("show", show);
}

// =========================================================
// API CALLS
// =========================================================
async function apiPost(payload) {
  if (CONFIG.USE_MOCK) {
    return mockApiCall(payload);
  }

  const formData = new URLSearchParams();

  for (let key in payload) {
    formData.append(key, payload[key]);
  }

  const response = await fetch(CONFIG.API_URL, {
    method: "POST",
    body: formData
  });

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    console.error("Invalid JSON:", text);
    return { status: "error", message: "Invalid server response" };
  }
}

async function apiGet(params) {
  if (CONFIG.USE_MOCK) {
    return mockApiGet(params);
  }

  const query = new URLSearchParams(params).toString();
  const url = `${CONFIG.API_URL}?${query}`;

  try {
    const response = await fetch(url, { method: "GET", mode: "cors" });
    return await response.json();
  } catch (e) {
    // Fallback: try with no-cors
    try {
      const response2 = await fetch(url, { method: "GET", mode: "no-cors" });
      // Opaque response - can't read body. Show error.
      throw new Error("Cannot read response. CORS issue.");
    } catch (e2) {
      throw new Error("API connection failed: " + e2.message);
    }
  }
}

// =========================================================
// MOCK API (for testing without backend)
// =========================================================
let mockDb = {
  users: [
    { id: 1, username: "admin", password: "admin123", role: "Admin", active: true, photoURL: "" },
    { id: 2, username: "user1", password: "user123", role: "User", active: true, photoURL: "" },
    { id: 3, username: "user2", password: "user123", role: "User", active: false, photoURL: "" }
  ],
  data: [
    { date: "2025-01-15", building: "Tower A", labour: 12, mistri: 4, cement: 30, notes: "Foundation work", entryBy: "user1" },
    { date: "2025-01-16", building: "Tower B", labour: 8, mistri: 3, cement: 20, notes: "Floor slab", entryBy: "user1" },
    { date: "2025-01-17", building: "Tower A", labour: 15, mistri: 5, cement: 40, notes: "Column casting", entryBy: "admin" },
    { date: "2025-01-18", building: "Parking", labour: 6, mistri: 2, cement: 15, notes: "", entryBy: "user1" },
    { date: "2025-01-19", building: "Tower B", labour: 10, mistri: 4, cement: 25, notes: "Beam work", entryBy: "admin" }
  ],
  nextId: 4,
  nextDataRow: 6
};

function mockApiCall(payload) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        switch (payload.action) {
          case "login": {
            const user = mockDb.users.find(u => u.username === payload.username && u.password === payload.password);
            if (!user) return resolve({ status: "error", message: "Invalid username or password" });
            if (user.active !== true) return resolve({ status: "error", message: "Account is deactivated. Contact admin." });
            return resolve({ status: "success", username: user.username, role: user.role, photoURL: user.photoURL || "" });
          }
          case "submitData": {
            mockDb.data.push({
              date: payload.date,
              building: payload.building,
              labour: Number(payload.labour) || 0,
              mistri: Number(payload.mistri) || 0,
              cement: Number(payload.cement) || 0,
              notes: payload.notes || "",
              entryBy: payload.entryBy
            });
            return resolve({ status: "success", message: "Entry added successfully" });
          }
          case "updateEntry": {
            const idx = payload.rowIndex;
            if (idx >= 0 && idx < mockDb.data.length) {
              mockDb.data[idx] = {
                date: payload.date,
                building: payload.building,
                labour: Number(payload.labour) || 0,
                mistri: Number(payload.mistri) || 0,
                cement: Number(payload.cement) || 0,
                notes: payload.notes || "",
                entryBy: payload.entryBy
              };
            }
            return resolve({ status: "success", message: "Entry updated successfully" });
          }
          case "deleteEntry": {
            const di = payload.rowIndex;
            if (di >= 0 && di < mockDb.data.length) {
              mockDb.data.splice(di, 1);
            }
            return resolve({ status: "success", message: "Entry deleted successfully" });
          }
          case "toggleUser": {
            const userObj = mockDb.users.find(u => u.id == payload.userId);
            if (userObj) userObj.active = payload.active;
            return resolve({ status: "success", message: "User status updated" });
          }
          default:
            return resolve({ status: "error", message: "Unknown action" });
        }
      } catch (e) {
        return resolve({ status: "error", message: e.message });
      }
    }, 300);
  });
}

function mockApiGet(params) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const action = params.action;
      switch (action) {
        case "getData": {
          let filtered;
          if (params.role === "Admin") {
            filtered = mockDb.data;
          } else {
            filtered = mockDb.data.filter(d => d.entryBy === params.username);
          }
          return resolve({ status: "success", data: filtered });
        }
        case "getUsers": {
          const safe = mockDb.users.map(u => ({ id: u.id, username: u.username, role: u.role, active: u.active, photoURL: u.photoURL }));
          return resolve({ status: "success", users: safe });
        }
        case "status":
          return resolve({ status: "success", timestamp: new Date().toISOString() });
        default:
          return resolve({ status: "error", message: "Unknown action" });
      }
    }, 200);
  });
}

// =========================================================
// LOGIN
// =========================================================
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const btn = document.getElementById("loginBtn");
  const errorEl = document.getElementById("loginError");

  if (!username || !password) {
    errorEl.textContent = "Please enter username and password";
    return;
  }

  errorEl.textContent = "";
  btn.classList.add("loading");

  try {
    const res = await apiPost({ action: "login", username, password });

    if (res.status !== "success") {
      errorEl.textContent = res.message || "Login failed";
      btn.classList.remove("loading");
      return;
    }

    // Save session
    state.user = {
      username: res.username,
      role: res.role,
      photoURL: res.photoURL || ""
    };
    state.isAdmin = res.role === "Admin";

    localStorage.setItem("constrax_session", JSON.stringify(state.user));

    // Show app
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("app").style.display = "block";

    initApp();
  } catch (err) {
    errorEl.textContent = "Connection error: " + err.message;
  }

  btn.classList.remove("loading");
}

// =========================================================
// LOGOUT
// =========================================================
function logout() {
  localStorage.removeItem("constrax_session");
  state.user = null;
  state.isAdmin = false;
  document.getElementById("loginPage").style.display = "flex";
  document.getElementById("app").style.display = "none";
  document.getElementById("loginUsername").value = "";
  document.getElementById("loginPassword").value = "";
  document.getElementById("loginError").textContent = "";
}

// =========================================================
// INIT APP
// =========================================================
function initApp() {
  // Show/hide admin items
  document.querySelectorAll(".admin-only").forEach(el => {
    el.style.display = state.isAdmin ? "" : "none";
  });

  // Update sidebar user info
  const initial = state.user.username.charAt(0).toUpperCase();
  document.getElementById("sidebarAvatar").textContent = initial;
  document.getElementById("sidebarName").textContent = state.user.username;
  document.getElementById("sidebarRole").textContent = state.isAdmin ? "Administrator" : "User";

  // Set today's date on entry form
  document.getElementById("entryDate").value = new Date().toISOString().split("T")[0];

  // Show/hide action columns in table based on admin
  document.getElementById("dashActionsHead").style.display = state.isAdmin ? "" : "none";

  // API status check
  checkApiStatus();
  setInterval(checkApiStatus, 30000);

  // Load dashboard data
  switchPage("dashboard");

  // Event listeners
  document.getElementById("loginForm").addEventListener("submit", handleLogin);
  document.getElementById("entryForm").addEventListener("submit", handleEntrySubmit);
  document.getElementById("editForm").addEventListener("submit", handleEditSubmit);
}

// =========================================================
// PAGE SWITCHING
// =========================================================
function switchPage(page) {
  state.currentPage = page;

  // Update sidebar nav
  document.querySelectorAll(".nav-item").forEach(el => {
    el.classList.toggle("active", el.dataset.page === page);
  });

  // Update bottom nav
  document.querySelectorAll(".bnav-item").forEach(el => {
    el.classList.toggle("active", el.dataset.page === page);
  });

  // Show/hide sections
  document.querySelectorAll(".page-section").forEach(el => {
    el.classList.add("hide");
  });
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.remove("hide");

  // Update title
  const titles = {
    dashboard: "📊 Dashboard",
    entry: "➕ Add Entry",
    reports: "📈 Reports",
    users: "👥 Users"
  };
  document.getElementById("pageTitle").textContent = titles[page] || "Dashboard";

  // Load data for page
  switch (page) {
    case "dashboard":
      loadDashboard();
      break;
    case "entry":
      loadEntryData();
      break;
    case "reports":
      // Set default date range
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      document.getElementById("reportFrom").value = formatDate(firstDay);
      document.getElementById("reportTo").value = formatDate(today);
      break;
    case "users":
      if (state.isAdmin) loadUsers();
      break;
  }
}

// =========================================================
// API STATUS CHECK
// =========================================================
async function checkApiStatus() {
  const led = document.getElementById("apiLed");
  const text = document.getElementById("apiStatusText");

  try {
    const res = await fetch(CONFIG.API_URL + "?action=users");

    const textRes = await res.text();
    const data = JSON.parse(textRes);

    if (data.status === "success") {
      led.className = "led green";
      text.textContent = "API Online";
    } else {
      led.className = "led red";
      text.textContent = "API Error";
    }

  } catch (e) {
    led.className = "led red";
    text.textContent = "Offline";
  }
}

// =========================================================
// FORMAT DATE
// =========================================================
function formatDate(dateStr) {
  if (!dateStr) return "-";

  // handle both string + date object
  const d = new Date(dateStr);

  if (isNaN(d)) {
    // যদি already formatted string হয়
    return dateStr;
  }

  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("default", { month: "short" });
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
}

function convertToISO(dateStr) {
  if (!dateStr) return "";

  // Already ISO (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split("-");
    return `${y}-${m}-${d}`;
  }

  // DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split("/");
    return `${y}-${m}-${d}`;
  }

  // fallback (try Date parse)
  const d = new Date(dateStr);
  if (!isNaN(d)) {
    return d.toISOString().split("T")[0];
  }

  return "";
}

// =========================================================
// DASHBOARD
// =========================================================
async function loadDashboard() {
  try {
    const res = await apiGet({
      action: "getData",
      username: state.user.username,
      role: state.user.role
    });

    if (res.status === "success") {
      state.allData = res.data || [];
      renderDashboardStats();
      renderDashboardTable();
    }
  } catch (e) {
    showToast("Failed to load dashboard data", "error");
  }
}

function renderDashboardStats() {
  const data = state.allData;
  document.getElementById("statEntries").textContent = data.length;
  document.getElementById("statLabour").textContent = data.reduce((s, d) => s + (Number(d.labour) || 0), 0);
  document.getElementById("statMistri").textContent = data.reduce((s, d) => s + (Number(d.mistri) || 0), 0);
  document.getElementById("statCement").textContent = data.reduce((s, d) => s + (Number(d.cement) || 0), 0);
}

function renderDashboardTable() {
  const tbody = document.getElementById("dashboardTableBody");
  const data = state.allData;

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:30px;color:#9ca3af;">No entries found</td></tr>`;
    return;
  }

  // Show latest 10 entries
  const recent = data.slice(-10).reverse();

  tbody.innerHTML = recent.map((row, idx) => {
    const rowIndex = data.indexOf(row);
    const actions = state.isAdmin
      ? `<td>
          <button class="btn-sm btn-edit" onclick="openEditModal(${rowIndex})">✏️ Edit</button>
          <button class="btn-sm btn-delete" onclick="confirmDelete(${rowIndex})">🗑️ Delete</button>
        </td>`
      : "";

    return `<tr>
      <td>${formatDate(row.date)}</td>
      <td>${row.building || ""}</td>
      <td>${row.labour || 0}</td>
      <td>${row.mistri || 0}</td>
      <td>${row.cement || 0}</td>
      <td>${row.notes || "-"}</td>
      ${state.isAdmin ? `<td><span class="badge badge-user">${row.entryBy || ""}</span></td>` : ""}
      ${actions}
    </tr>`;
  }).join("");
}

// =========================================================
// ENTRY DATA (for entry page)
// =========================================================
async function loadEntryData() {
  try {
    const res = await apiGet({
      action: "getData",
      username: state.user.username,
      role: state.user.role
    });

    if (res.status === "success") {
      state.allData = res.data || [];
      renderEntryTable();
    }
  } catch (e) {
    showToast("Failed to load entries", "error");
  }
}

function renderEntryTable() {
  const tbody = document.getElementById("entryTableBody");
  const data = state.allData;

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:30px;color:#9ca3af;">No entries found</td></tr>`;
    return;
  }

  const reversed = [...data].reverse();

  tbody.innerHTML = reversed.map((row, displayIdx) => {
    const realIdx = data.length - 1 - displayIdx;
    const actions = `<td>
      <button class="btn-sm btn-edit" onclick="openEditModal(${realIdx})">✏️ Edit</button>
      <button class="btn-sm btn-delete" onclick="confirmDelete(${realIdx})">🗑️ Delete</button>
    </td>`;

    return `<tr>
      <td>${formatDate(row.date)}</td>
      <td>${row.building || ""}</td>
      <td>${row.labour || 0}</td>
      <td>${row.mistri || 0}</td>
      <td>${row.cement || 0}</td>
      <td>${row.notes || "-"}</td>
      ${state.isAdmin ? `<td><span class="badge badge-user">${row.entryBy || ""}</span></td>` : ""}
      ${actions}
    </tr>`;
  }).join("");
}

// =========================================================
// SUBMIT ENTRY
// =========================================================
async function handleEntrySubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  btn.classList.add("loading");

  const payload = {
    action: "submitData",
    date: document.getElementById("entryDate").value,
    building: document.getElementById("entryBuilding").value.trim(),
    labour: Number(document.getElementById("entryLabour").value) || 0,
    mistri: Number(document.getElementById("entryMistri").value) || 0,
    cement: Number(document.getElementById("entryCement").value) || 0,
    notes: document.getElementById("entryNotes").value.trim(),
    entryBy: state.user.username
  };

  try {
    const res = await apiPost(payload);
    if (res.status === "success") {
      showToast("Entry added successfully!", "success");
      document.getElementById("entryForm").reset();
      document.getElementById("entryDate").value = new Date().toISOString().split("T")[0];
      // Auto refresh
      await loadEntryData();
      await loadDashboard();
    } else {
      showToast(res.message || "Failed to add entry", "error");
    }
  } catch (e) {
    showToast("Error: " + e.message, "error");
  }

  btn.classList.remove("loading");
}

// =========================================================
// EDIT MODAL
// =========================================================
function openEditModal(rowIndex) {
  const data = state.allData[rowIndex];
  if (!data) return;

  state.editMode = true;

  document.getElementById("editDate").value = data.date || "";
  document.getElementById("editBuilding").value = data.building || "";
  document.getElementById("editLabour").value = data.labour || 0;
  document.getElementById("editMistri").value = data.mistri || 0;
  document.getElementById("editCement").value = data.cement || 0;
  document.getElementById("editNotes").value = data.notes || "";
  document.getElementById("editRowIndex").value = rowIndex;

  document.getElementById("editModal").classList.add("open");
}

function closeEditModal() {
  document.getElementById("editModal").classList.remove("open");
  state.editMode = false;
}

async function handleEditSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector(".btn-save");
  const rowIndex = Number(document.getElementById("editRowIndex").value);

  const payload = {
    action: "updateEntry",
    rowIndex,
    date: document.getElementById("editDate").value,
    building: document.getElementById("editBuilding").value.trim(),
    labour: Number(document.getElementById("editLabour").value) || 0,
    mistri: Number(document.getElementById("editMistri").value) || 0,
    cement: Number(document.getElementById("editCement").value) || 0,
    notes: document.getElementById("editNotes").value.trim(),
    entryBy: state.user.username
  };

  try {
    const res = await apiPost(payload);
    if (res.status === "success") {
      showToast("Entry updated successfully!", "success");
      closeEditModal();
      // Auto refresh
      await loadEntryData();
      await loadDashboard();
    } else {
      showToast(res.message || "Failed to update", "error");
    }
  } catch (e) {
    showToast("Error: " + e.message, "error");
  }
}

// =========================================================
// DELETE CONFIRM
// =========================================================
function confirmDelete(rowIndex) {
  const overlay = document.createElement("div");
  overlay.className = "confirm-dialog";
  overlay.innerHTML = `
    <div class="confirm-box">
      <h3>🗑️ Delete Entry</h3>
      <p>Are you sure you want to delete this entry? This action cannot be undone.</p>
      <div class="confirm-actions">
        <button class="confirm-cancel">Cancel</button>
        <button class="confirm-delete">Delete</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector(".confirm-cancel").onclick = () => overlay.remove();
  overlay.querySelector(".confirm-delete").onclick = async () => {
    overlay.remove();
    await deleteEntry(rowIndex);
  };

  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
}

async function deleteEntry(rowIndex) {
  try {
    const res = await apiPost({ action: "deleteEntry", rowIndex });
    if (res.status === "success") {
      showToast("Entry deleted successfully", "success");
      // Auto refresh
      await loadEntryData();
      await loadDashboard();
    } else {
      showToast(res.message || "Failed to delete", "error");
    }
  } catch (e) {
    showToast("Error: " + e.message, "error");
  }
}

// =========================================================
// USERS (Admin)
// =========================================================
async function loadUsers() {
  try {
    const res = await apiGet({ action: "getUsers", role: state.user.role });
    if (res.status === "success") {
      renderUsersTable(res.users || []);
    }
  } catch (e) {
    showToast("Failed to load users", "error");
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById("usersTableBody");

  tbody.innerHTML = users.map(user => {
    const initial = user.username.charAt(0).toUpperCase();
    const isActive = user.active === true || user.active === "TRUE" || user.active === true;
    const roleBadge = user.role === "Admin" ? "badge-admin" : "badge-user";

    return `<tr>
      <td>${user.id}</td>
      <td>
        <div class="user-row">
          <div class="user-avatar-sm">${initial}</div>
          ${user.username}
        </div>
      </td>
      <td><span class="badge ${roleBadge}">${user.role}</span></td>
      <td><span class="badge ${isActive ? "badge-active" : "badge-inactive"}">${isActive ? "Active" : "Inactive"}</span></td>
      <td>
        <div class="toggle-switch ${isActive ? "active" : ""}" 
             onclick="toggleUser(${user.id}, ${!isActive})"></div>
      </td>
    </tr>`;
  }).join("");
}

async function toggleUser(userId, newStatus) {
  try {
    const res = await apiPost({ action: "toggleUser", userId, active: newStatus });
    if (res.status === "success") {
      showToast(`User ${newStatus ? "activated" : "deactivated"} successfully`, "success");
      await loadUsers();
    } else {
      showToast(res.message || "Failed to update user", "error");
    }
  } catch (e) {
    showToast("Error: " + e.message, "error");
  }
}

// =========================================================
// REPORTS
// =========================================================
function generateReport() {
  const fromInput = document.getElementById("reportFrom").value;
  const toInput = document.getElementById("reportTo").value;

  if (!fromInput || !toInput) {
    showToast("Please select both from and to dates", "error");
    return;
  }

  const fromDate = convertToISO(fromInput);
  const toDate = convertToISO(toInput);

  const filtered = state.allData.filter(item => {
    if (!item.date) return false;

    const rowDate = convertToISO(item.date);
    return rowDate >= fromDate && rowDate <= toDate;
  });

  if (filtered.length === 0) {
    document.getElementById("reportResults").style.display = "none";
    showToast("No data found for the selected date range", "info");
    return;
  }

  // Summary
  const totalLabour = filtered.reduce((s, d) => s + (Number(d.labour) || 0), 0);
  const totalMistri = filtered.reduce((s, d) => s + (Number(d.mistri) || 0), 0);
  const totalCement = filtered.reduce((s, d) => s + (Number(d.cement) || 0), 0);

  document.getElementById("reportSummary").innerHTML = `
    <div class="report-summary-item">
      <div class="val">${totalLabour}</div>
      <div class="lbl">Total Labour</div>
    </div>
    <div class="report-summary-item">
      <div class="val">${totalMistri}</div>
      <div class="lbl">Total Mistri</div>
    </div>
    <div class="report-summary-item">
      <div class="val">${totalCement}</div>
      <div class="lbl">Total Cement (bags)</div>
    </div>
    <div class="report-summary-item">
      <div class="val">${filtered.length}</div>
      <div class="lbl">Total Entries</div>
    </div>
  `;

  // Table
  const tbody = document.getElementById("reportTableBody");
  tbody.innerHTML = filtered.map(row => `
    <tr>
      <td>${formatDate(row.date)}</td>
      <td>${row.building || ""}</td>
      <td>${row.labour || 0}</td>
      <td>${row.mistri || 0}</td>
      <td>${row.cement || 0}</td>
      <td>${row.notes || "-"}</td>
    </tr>
  `).join("");

  document.getElementById("reportResults").style.display = "block";
}

// =========================================================
// SHARE REPORT (Capture as Image)
// =========================================================
async function shareReport() {
  const from = document.getElementById("reportFrom").value;
  const to = document.getElementById("reportTo").value;

  if (!from || !to) {
    showToast("Select date range first", "error");
    return;
  }

  const fromISO = convertToISO(from);
  const toISO = convertToISO(to);

  const filtered = state.allData.filter(item => {
    const d = convertToISO(item.date);
    return d >= fromISO && d <= toISO;
  });

  if (!filtered.length) {
    showToast("No data to share", "error");
    return;
  }

  // Date range
  document.getElementById("shareDateRange").innerText =
    `${formatDate(from)} → ${formatDate(to)}`;

  // Table
  document.getElementById("shareTableBody").innerHTML =
    filtered.map(row => `
      <tr>
        <td style="border:1px solid #ddd;padding:6px;text-align:center;">${formatDate(row.date)}</td>
        <td style="border:1px solid #ddd;padding:6px;text-align:center;">${row.building || ""}</td>
        <td style="border:1px solid #ddd;padding:6px;text-align:center;">${row.labour || 0}</td>
        <td style="border:1px solid #ddd;padding:6px;text-align:center;">${row.mistri || 0}</td>
        <td style="border:1px solid #ddd;padding:6px;text-align:center;">${row.cement || 0}</td>
        <td style="border:1px solid #ddd;padding:6px;text-align:center;">${row.notes || "-"}</td>
      </tr>
    `).join("");

  // Totals
  const totalLabour = filtered.reduce((s, d) => s + Number(d.labour || 0), 0);
  const totalMistri = filtered.reduce((s, d) => s + Number(d.mistri || 0), 0);
  const totalCement = filtered.reduce((s, d) => s + Number(d.cement || 0), 0);

  document.getElementById("shareLabour").innerText = totalLabour;
  document.getElementById("shareMistri").innerText = totalMistri;
  document.getElementById("shareCement").innerText = totalCement;

  const el = document.getElementById("shareTemplate");

  el.style.display = "block";
  el.style.width = "700px";

  const canvas = await html2canvas(el, {
    backgroundColor: "#f9fafb",
    scale: 2
  });

  el.style.display = "none";

  const link = document.createElement("a");
  link.download = "report.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// =========================================================
// CLOSE MODAL ON OVERLAY CLICK
// =========================================================
document.getElementById("editModal").addEventListener("click", function (e) {
  if (e.target === this) closeEditModal();
});

// =========================================================
// CHECK SESSION ON LOAD
// =========================================================
(function () {
  const saved = localStorage.getItem("constrax_session");
  if (saved) {
    try {
      const session = JSON.parse(saved);
      if (session && session.username) {
        state.user = session;
        state.isAdmin = session.role === "Admin";
        document.getElementById("loginPage").style.display = "none";
        document.getElementById("app").style.display = "block";
        initApp();
        return;
      }
    } catch (e) {
      localStorage.removeItem("constrax_session");
    }
  }
  // Show login page by default
  document.getElementById("loginPage").style.display = "flex";
  document.getElementById("loginForm").addEventListener("submit", handleLogin);
})();
