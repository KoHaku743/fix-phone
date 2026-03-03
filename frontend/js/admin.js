/* ============================================================
   admin.js – SSStylish Repair Admin Panel
   ============================================================ */

const API = '';

// ─── Auth helpers ─────────────────────────────────────────
const TOKEN_KEY = 'fixphone-admin-token';
const USER_KEY  = 'fixphone-admin-user';

function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

function saveToken(token) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch (_) {}
}

function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch (_) {}
}

function getCurrentUser() {
  try { return localStorage.getItem(USER_KEY) || 'owner'; } catch { return 'owner'; }
}

function saveCurrentUser(username) {
  try { localStorage.setItem(USER_KEY, username); } catch (_) {}
}

function clearCurrentUser() {
  try { localStorage.removeItem(USER_KEY); } catch (_) {}
}

function logout() {
  clearToken();
  clearCurrentUser();
  loadLoginUsers();
  showLoginOverlay();
}

/** Update topbar avatar and title based on logged-in user. */
function updateUserDisplay() {
  const username = getCurrentUser();
  const avatar = document.getElementById('topbar-avatar');
  if (avatar) {
    avatar.textContent = username === 'staff' ? 'S' : 'O';
    avatar.title = username === 'staff' ? window.t('login.staff-label') : window.t('login.owner-label');
  }
}

/** Authenticated fetch wrapper – adds Bearer token header. */
async function authFetch(url, options = {}) {
  const token = getToken();
  if (!token) {
    showLoginOverlay();
    throw new Error('Not authenticated.');
  }
  const headers = { ...(options.headers || {}), 'Authorization': `Bearer ${token}` };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    clearCurrentUser();
    showLoginOverlay();
    throw new Error('Session expired. Please sign in again.');
  }
  return res;
}

// ─── Login overlay ────────────────────────────────────────
function showLoginOverlay() {
  const overlay = document.getElementById('login-overlay');
  if (overlay) overlay.style.display = 'flex';
  showLoginStep(1);
}

function hideLoginOverlay() {
  const overlay = document.getElementById('login-overlay');
  if (overlay) overlay.style.display = 'none';
}

function showLoginStep(step) {
  const step1 = document.getElementById('login-step1');
  const step2 = document.getElementById('login-step2');
  if (step1) step1.style.display = step === 1 ? 'block' : 'none';
  if (step2) step2.style.display = step === 2 ? 'block' : 'none';
  if (step === 1) {
    const errEl = document.getElementById('login-error');
    if (errEl) errEl.style.display = 'none';
    const pwInput = document.getElementById('admin-password');
    if (pwInput) pwInput.value = '';
  }
  if (step === 2) {
    setTimeout(() => {
      const pwInput = document.getElementById('admin-password');
      if (pwInput) pwInput.focus();
    }, 50);
  }
}

async function loadLoginUsers() {
  const container = document.getElementById('login-user-buttons');
  if (!container) return;
  try {
    const res = await fetch(`${API}/api/auth/users`);
    const data = await res.json();
    const users = data.users || [];
    if (!users.length) {
      container.innerHTML = `<div style="text-align:center;color:var(--danger);font-size:0.85rem;padding:1rem 0;">${window.t('login.no-users')}</div>`;
      return;
    }
    const avatarGradients = {
      owner: 'linear-gradient(135deg,#00d4ff,#7c3aed)',
      staff: 'linear-gradient(135deg,#7c3aed,#ec4899)',
    };
    container.innerHTML = users.map(u => `
      <button class="btn btn-ghost" data-username="${escapeHtml(u.username)}"
        style="justify-content:flex-start;gap:0.75rem;padding:0.875rem 1.1rem;text-align:left;">
        <div style="width:2.1rem;height:2.1rem;border-radius:50%;background:${avatarGradients[u.username] || avatarGradients.owner};
          display:flex;align-items:center;justify-content:center;font-weight:800;color:#0a0e1a;font-size:1rem;flex-shrink:0;">
          ${escapeHtml(u.displayName.charAt(0).toUpperCase() || u.username.charAt(0).toUpperCase())}
        </div>
        <div>
          <div style="font-weight:700;font-size:0.9rem;color:var(--text-primary);">${escapeHtml(u.displayName)}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">
            ${u.username === 'owner' ? window.t('login.owner-access') : window.t('login.staff-access')}
          </div>
        </div>
      </button>
    `).join('');

    container.querySelectorAll('button[data-username]').forEach(btn => {
      btn.addEventListener('click', () => selectLoginUser(btn.dataset.username, users));
    });
  } catch (err) {
    container.innerHTML = `<div style="text-align:center;color:var(--danger);font-size:0.85rem;padding:1rem 0;">${escapeHtml(err.message)}</div>`;
  }
}

function selectLoginUser(username, users) {
  const user = users ? users.find(u => u.username === username) : null;
  const displayName = user ? user.displayName : (username === 'owner' ? window.t('login.owner-label') : window.t('login.staff-label'));

  const hiddenInput = document.getElementById('login-username');
  if (hiddenInput) hiddenInput.value = username;

  const avatarEl = document.getElementById('login-user-avatar-badge');
  if (avatarEl) {
    avatarEl.textContent = (displayName.charAt(0) || username.charAt(0)).toUpperCase();
    avatarEl.style.background = username === 'staff'
      ? 'linear-gradient(135deg,#7c3aed,#ec4899)'
      : 'linear-gradient(135deg,#00d4ff,#7c3aed)';
    avatarEl.style.color = username === 'staff' ? '#fff' : '#0a0e1a';
  }

  const nameEl = document.getElementById('login-user-display');
  if (nameEl) nameEl.textContent = displayName;

  showLoginStep(2);
}

async function handleLogin(e) {
  e.preventDefault();
  const password   = document.getElementById('admin-password').value;
  const username   = document.getElementById('login-username')?.value || 'owner';
  const btn        = document.getElementById('login-btn');
  const btnText    = document.getElementById('login-btn-text');
  const btnLoading = document.getElementById('login-btn-loading');
  const errorEl    = document.getElementById('login-error');

  errorEl.style.display = 'none';
  btn.disabled = true;
  btnText.style.display = 'none';
  btnLoading.style.display = 'inline';

  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    saveToken(data.token);
    saveCurrentUser(data.username || username);
    hideLoginOverlay();
    document.getElementById('admin-password').value = '';
    updateUserDisplay();
    loadAllData();
  } catch (err) {
    errorEl.textContent  = err.message;
    errorEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
  }
}

// ─── State ────────────────────────────────────────────────
let allAppointments = [];
let allServices = [];
let allRepairTypes = [];
let allInventory = [];
let currentOrderFilter = 'all';
let ordersSearchTerm = '';

// ─── Utilities ────────────────────────────────────────────
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('sk-SK', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return '—';
  return n.toFixed(2) + ' €';
}

function formatPriceRange(priceFrom, priceTo) {
  const hasFrom = priceFrom != null && !isNaN(Number(priceFrom));
  const hasTo   = priceTo   != null && !isNaN(Number(priceTo));
  if (hasFrom && hasTo) return `${Number(priceFrom).toFixed(0)} – ${Number(priceTo).toFixed(0)} €`;
  if (hasFrom) return `${window.t('services.price-from')} ${Number(priceFrom).toFixed(0)} €`;
  if (hasTo)   return `${window.t('services.price-up-to')} ${Number(priceTo).toFixed(0)} €`;
  return window.t('services.price-on-request');
}

function statusBadge(status) {
  const map = {
    pending:       'badge-pending',
    confirmed:     'badge-confirmed',
    diagnostics:   'badge-confirmed',
    waiting_parts: 'badge-pending',
    completed:     'badge-completed',
    cancelled:     'badge-cancelled',
  };
  const keys = {
    pending:       'status.pending',
    confirmed:     'status.confirmed',
    diagnostics:   'status.diagnostics',
    waiting_parts: 'status.waiting_parts',
    completed:     'status.completed',
    cancelled:     'status.cancelled',
  };
  return `<span class="badge ${map[status] || 'badge-pending'}">${window.t(keys[status] || 'status.pending')}</span>`;
}

function showToast(type, title, message = '', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const colors = { success: 'var(--success)', error: 'var(--danger)', info: 'var(--teal)', warning: 'var(--warning)' };
  const toast = document.createElement('div');
  toast.style.cssText = `
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-left: 3px solid ${colors[type] || colors.info};
    border-radius: 10px;
    padding: 0.85rem 1.1rem;
    min-width: 260px;
    max-width: 360px;
    display: flex;
    align-items: flex-start;
    gap: 0.65rem;
    box-shadow: 0 8px 30px rgba(0,0,0,0.4);
    animation: slideDown 0.3s ease;
    font-family: inherit;
  `;
  toast.innerHTML = `
    <span style="font-size:1.1rem;flex-shrink:0;">${icons[type] || '•'}</span>
    <div>
      <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);margin-bottom:0.15rem;">${escapeHtml(title)}</div>
      ${message ? `<div style="font-size:0.78rem;color:var(--text-secondary);">${escapeHtml(message)}</div>` : ''}
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'all 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// ─── Tab Switching ────────────────────────────────────────
function switchTab(tabName) {
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === `tab-${tabName}`);
  });
  const titleKeys = {
    dashboard:    'admin.tab.dashboard',
    orders:       'admin.tab.orders',
    services:     'admin.tab.services',
    'repair-types': 'admin.tab.repair-types',
    inventory:    'admin.tab.inventory',
    staff:        'admin.tab.staff',
    settings:     'admin.tab.settings',
  };
  const topTitle = document.getElementById('topbar-title');
  if (topTitle) topTitle.textContent = window.t(titleKeys[tabName] || 'admin.tab.dashboard');

  if (tabName === 'dashboard')     loadDashboard();
  if (tabName === 'orders')        renderOrders();
  if (tabName === 'services')      renderServices();
  if (tabName === 'repair-types')  renderRepairTypes();
  if (tabName === 'inventory')     renderInventory();
  if (tabName === 'staff')         renderStaffTab();
  if (tabName === 'settings')      loadSettings();
}

// ─── Load all data ────────────────────────────────────────
async function loadAllData() {
  try {
    const [apptRes, svcRes, rtRes, invRes] = await Promise.all([
      authFetch(`${API}/api/admin/appointments`),
      authFetch(`${API}/api/admin/services`),
      authFetch(`${API}/api/admin/repair-types`),
      authFetch(`${API}/api/admin/inventory`),
    ]);
    allAppointments = await apptRes.json();
    allServices     = await svcRes.json();
    allRepairTypes  = await rtRes.json();
    allInventory    = await invRes.json();

    const pending = allAppointments.filter(a => a.status === 'pending').length;
    const badge = document.getElementById('pending-badge');
    if (badge) badge.textContent = pending;

    // Staff open-orders badge (pending orders)
    const staffBadge = document.getElementById('staff-open-badge');
    if (staffBadge) {
      if (pending > 0) {
        staffBadge.textContent = pending;
        staffBadge.style.display = 'inline-flex';
      } else {
        staffBadge.style.display = 'none';
      }
    }

    // Low-stock badge
    const lowStockItems = allInventory.filter(i => i.quantity <= i.min_quantity);
    const lowBadge = document.getElementById('low-stock-badge');
    if (lowBadge) {
      if (lowStockItems.length > 0) {
        lowBadge.textContent = lowStockItems.length;
        lowBadge.style.display = 'inline-flex';
      } else {
        lowBadge.style.display = 'none';
      }
    }

    loadDashboard();
  } catch (err) {
    if (err.message !== 'Session expired. Please sign in again.') {
      showToast('error', window.t('admin.toast.load-error'), window.t('admin.toast.load-error-msg'));
    }
    console.error(err);
  }
}

// ─── Dashboard ────────────────────────────────────────────

/**
 * Returns true if the appointment counts as belonging to `user` for revenue.
 * Appointments created before the assigned_to column existed (null) are
 * attributed to the owner for backward compatibility.
 */
function isAssignedToUser(appt, user) {
  return appt.assigned_to === user || (appt.assigned_to === null && user === 'owner');
}

function loadDashboard() {
  const total     = allAppointments.length;
  const pending   = allAppointments.filter(a => a.status === 'pending').length;
  const completed = allAppointments.filter(a => a.status === 'completed').length;

  // Revenue filtered by current staff member (null assigned_to treated as 'owner' for backward compatibility)
  const currentUser = getCurrentUser();
  const myRevenue = allAppointments
    .filter(a => a.status === 'completed' && isAssignedToUser(a, currentUser))
    .reduce((sum, a) => sum + (parseFloat(a.quoted_price) || 0), 0);

  // Today's orders
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = allAppointments.filter(a => (a.created_at || '').slice(0, 10) === todayStr).length;

  // My monthly revenue (current month, current user; null assigned_to treated as 'owner')
  const nowYM = new Date().toISOString().slice(0, 7);
  const myMonthlyRevenue = allAppointments
    .filter(a => a.status === 'completed' && isAssignedToUser(a, currentUser) && (a.created_at || '').slice(0, 7) === nowYM)
    .reduce((sum, a) => sum + (parseFloat(a.quoted_price) || 0), 0);

  setText('stat-total',            total);
  setText('stat-pending',          pending);
  setText('stat-completed',        completed);
  setText('stat-revenue',          formatCurrency(myRevenue));
  setText('stat-today',            todayCount);
  setText('stat-monthly-revenue',  formatCurrency(myMonthlyRevenue));

  // Top 3 device models
  const modelCounts = {};
  allAppointments.forEach(a => {
    if (a.device_model) {
      const key = a.device_model.trim();
      modelCounts[key] = (modelCounts[key] || 0) + 1;
    }
  });
  const top3 = Object.entries(modelCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const topEl = document.getElementById('top-models-list');
  if (topEl) {
    if (!top3.length) {
      topEl.innerHTML = `<span style="color:var(--text-muted);font-size:0.85rem;">${window.t('empty.no-appts')}</span>`;
    } else {
      topEl.innerHTML = top3.map(([model, count], i) => `
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);padding:0.65rem 1rem;display:flex;align-items:center;gap:0.6rem;min-width:180px;">
          <span style="font-size:1.1rem;">${['🥇','🥈','🥉'][i]}</span>
          <div>
            <div style="font-size:0.88rem;font-weight:700;color:var(--text-primary);">${escapeHtml(model)}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);">${count} ${window.t(count === 1 ? 'count.appts' : 'count.appts-plural', { n: count })}</div>
          </div>
        </div>
      `).join('');
    }
  }

  const recent = allAppointments.slice(0, 8);
  setText('recent-count', window.t('count.showing', { n: recent.length, total }));

  const tbody = document.getElementById('recent-tbody');
  if (!tbody) return;

  if (!recent.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">${window.t('empty.no-appts')}</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(a => `
    <tr>
      <td class="td-mono">#${a.id}</td>
      <td class="td-primary">${escapeHtml(a.customer_name)}</td>
      <td>${escapeHtml(a.device_model)}</td>
      <td>${escapeHtml(a.service_name || '—')}</td>
      <td>${statusBadge(a.status)}</td>
    </tr>
  `).join('');
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ─── Orders ───────────────────────────────────────────────
function getFilteredOrders() {
  let list = allAppointments;
  if (currentOrderFilter !== 'all') {
    list = list.filter(a => a.status === currentOrderFilter);
  }
  if (ordersSearchTerm) {
    const q = ordersSearchTerm.toLowerCase();
    list = list.filter(a =>
      (a.customer_name  || '').toLowerCase().includes(q) ||
      (a.customer_email || '').toLowerCase().includes(q) ||
      (a.device_model   || '').toLowerCase().includes(q) ||
      (a.service_name   || '').toLowerCase().includes(q)
    );
  }
  return list;
}

function renderOrders() {
  const filtered = getFilteredOrders();
  const n = filtered.length;
  setText('orders-count', n === 1 ? window.t('count.appts', { n }) : window.t('count.appts-plural', { n }));

  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">${window.t('empty.no-orders')}</div><div class="empty-state-sub">${window.t('empty.no-orders-sub')}</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(a => `
    <tr>
      <td class="td-mono">#${a.id}</td>
      <td class="td-primary">${escapeHtml(a.customer_name)}</td>
      <td>
        <div style="font-size:0.78rem;">${escapeHtml(a.customer_email)}</div>
        <div style="font-size:0.75rem;color:var(--text-muted);">${escapeHtml(a.customer_phone)}</div>
      </td>
      <td>${escapeHtml(a.device_model)}</td>
      <td>
        <div>${escapeHtml(a.service_name || '—')}</div>
        ${a.quoted_price != null ? `<div style="font-size:0.75rem;color:var(--teal);">💰 ${formatCurrency(a.quoted_price)}</div>` : ''}
      </td>
      <td>${statusBadge(a.status)}</td>
      <td>
        <button class="btn btn-ghost btn-sm btn-icon" title="${window.t('admin.action.edit')}" onclick="openOrderModal(${a.id})">✏️</button>
      </td>
    </tr>
  `).join('');
}

// ─── Services ─────────────────────────────────────────────
function renderServices() {
  const n = allServices.length;
  setText('services-count', n === 1 ? window.t('count.services', { n }) : window.t('count.services-plural', { n }));

  const tbody = document.getElementById('services-tbody');
  if (!tbody) return;

  if (!allServices.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">🛠️</div><div class="empty-state-text">${window.t('empty.no-services')}</div><div class="empty-state-sub">${window.t('empty.no-services-sub')}</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = allServices.map(s => `
    <tr>
      <td class="td-mono">#${s.id}</td>
      <td class="td-primary">${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.repair_type_name || '—')}</td>
      <td style="color:var(--teal);font-weight:700;">${formatPriceRange(s.price_from, s.price_to)}</td>
      <td>
        <span class="badge ${s.in_stock ? 'badge-in-stock' : 'badge-out-of-stock'}">
          ${s.in_stock ? window.t('stock.in') : window.t('stock.out')}
        </span>
      </td>
      <td>
        <div style="display:flex;gap:0.4rem;">
          <button class="btn btn-ghost btn-sm btn-icon" title="${window.t('admin.action.edit')}" onclick="openServiceModal(${s.id})">✏️</button>
          <button class="btn btn-danger btn-sm btn-icon" title="${window.t('admin.action.delete')}" onclick="deleteService(${s.id})">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ─── Repair Types ─────────────────────────────────────────
function renderRepairTypes() {
  const n = allRepairTypes.length;
  setText('repair-types-count', n === 1 ? window.t('count.types', { n }) : window.t('count.types-plural', { n }));

  const tbody = document.getElementById('repair-types-tbody');
  if (!tbody) return;

  if (!allRepairTypes.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-state-icon">🏷️</div><div class="empty-state-text">${window.t('empty.no-types')}</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = allRepairTypes.map(rt => `
    <tr>
      <td class="td-mono">#${rt.id}</td>
      <td class="td-primary">${escapeHtml(rt.name)}</td>
      <td>${escapeHtml(rt.description || '—')}</td>
      <td style="white-space:nowrap;">${formatDate(rt.created_at)}</td>
      <td>
        <div style="display:flex;gap:0.4rem;">
          <button class="btn btn-ghost btn-sm btn-icon" title="${window.t('admin.action.edit')}" onclick="openRepairTypeModal(${rt.id})">✏️</button>
          <button class="btn btn-danger btn-sm btn-icon" title="${window.t('admin.action.delete')}" onclick="deleteRepairType(${rt.id})">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ─── Modal helpers ────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
  if (e.target.dataset.modal) {
    closeModal(e.target.dataset.modal);
  }
});

// ─── Order Modal (status + quoted_price + messages) ───────
function openOrderModal(id) {
  const appt = allAppointments.find(a => a.id === id);
  if (!appt) return;

  document.getElementById('order-id').value = appt.id;
  document.getElementById('order-status').value = appt.status;
  document.getElementById('order-quoted-price').value = appt.quoted_price != null ? appt.quoted_price : '';
  // Format appointment_date for datetime-local input (needs "YYYY-MM-DDTHH:MM")
  const apptDateEl = document.getElementById('order-appointment-date');
  if (apptDateEl) {
    if (appt.appointment_date) {
      // Normalise to "YYYY-MM-DDTHH:MM" expected by datetime-local
      apptDateEl.value = appt.appointment_date.slice(0, 16).replace(' ', 'T');
    } else {
      apptDateEl.value = '';
    }
  }
  document.getElementById('order-customer-info').innerHTML =
    `<strong>${escapeHtml(appt.customer_name)}</strong> &bull; ${escapeHtml(appt.device_model)} &bull; ${escapeHtml(appt.customer_email)}`;

  // Conversation link
  const convLinkWrap = document.getElementById('order-conv-link');
  const convLinkEl   = document.getElementById('order-conv-link-a');
  if (appt.conversation_token) {
    convLinkEl.href = `/conversation/${appt.conversation_token}`;
    convLinkWrap.style.display = 'block';
  } else {
    convLinkWrap.style.display = 'none';
  }

  openModal('modal-order');
  loadOrderMessages(appt.id);
}

async function loadOrderMessages(apptId) {
  const listEl = document.getElementById('admin-messages-list');
  if (!listEl) return;
  listEl.innerHTML = '<div style="text-align:center;color:var(--text-muted);font-size:0.85rem;padding:1rem 0;">Načítavam...</div>';

  try {
    const res = await authFetch(`${API}/api/admin/appointments/${apptId}/messages`);
    const msgs = await res.json();
    if (!msgs.length) {
      listEl.innerHTML = '<div style="text-align:center;color:var(--text-muted);font-size:0.85rem;padding:1rem 0;">Zatiaľ žiadne správy.</div>';
      return;
    }
    listEl.innerHTML = msgs.map(m => `
      <div style="display:flex;flex-direction:column;align-items:${m.sender === 'admin' ? 'flex-start' : 'flex-end'};">
        <div style="max-width:80%;background:${m.sender === 'admin' ? 'rgba(0,212,255,0.1)' : 'var(--bg-card)'};
          border:1px solid var(--border);border-radius:8px;padding:0.5rem 0.75rem;
          font-size:0.82rem;color:var(--text-primary);word-break:break-word;">
          ${escapeHtml(m.content)}
        </div>
        <div style="font-size:0.7rem;color:var(--text-muted);margin-top:3px;">
          ${m.sender === 'admin' ? '🔧 Technik' : '👤 Zákazník'} · ${formatDate(m.created_at)}
        </div>
      </div>
    `).join('');
    listEl.scrollTop = listEl.scrollHeight;
  } catch (err) {
    listEl.innerHTML = `<div style="color:var(--danger);font-size:0.82rem;">${escapeHtml(err.message)}</div>`;
  }
}

async function sendAdminMessage() {
  const apptId  = document.getElementById('order-id').value;
  const input   = document.getElementById('admin-msg-input');
  const sendBtn = document.getElementById('admin-send-msg-btn');
  const content = input.value.trim();
  if (!content || !apptId) return;

  sendBtn.disabled = true;
  try {
    const res = await authFetch(`${API}/api/admin/appointments/${apptId}/messages`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    input.value = '';
    await loadOrderMessages(parseInt(apptId, 10));
    showToast('success', window.t('admin.toast.msg-sent'), '');
  } catch (err) {
    showToast('error', window.t('admin.toast.save-failed'), err.message);
  } finally {
    sendBtn.disabled = false;
  }
}

async function saveOrderStatus() {
  const id          = document.getElementById('order-id').value;
  const status      = document.getElementById('order-status').value;
  const quotedRaw   = document.getElementById('order-quoted-price').value;
  const quoted_price = quotedRaw !== '' ? parseFloat(quotedRaw) : null;
  const apptDateEl  = document.getElementById('order-appointment-date');
  const appointment_date = apptDateEl && apptDateEl.value ? apptDateEl.value : null;

  try {
    const body = { status };
    if (quotedRaw !== '') body.quoted_price = quoted_price;
    body.appointment_date = appointment_date;

    // Auto-assign to current user when moving to an active status and the order is unassigned
    const activeStatuses = ['confirmed', 'diagnostics', 'waiting_parts'];
    const apptCurrent = allAppointments.find(a => a.id === parseInt(id, 10));
    if (activeStatuses.includes(status) && apptCurrent && !apptCurrent.assigned_to) {
      body.assigned_to = getCurrentUser();
    }

    const res = await authFetch(`${API}/api/admin/appointments/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.json()).error);

    const updated = await res.json();
    const idx = allAppointments.findIndex(a => a.id === updated.id);
    if (idx !== -1) allAppointments[idx] = { ...allAppointments[idx], status: updated.status, quoted_price: updated.quoted_price, appointment_date: updated.appointment_date, assigned_to: updated.assigned_to };

    closeModal('modal-order');
    renderOrders();
    renderStaffTab();
    loadDashboard();
    const badge = document.getElementById('pending-badge');
    if (badge) badge.textContent = allAppointments.filter(a => a.status === 'pending').length;
    showToast('success', window.t('admin.toast.status-updated'), `#${id}`);
  } catch (err) {
    showToast('error', window.t('admin.toast.update-failed'), err.message);
  }
}

// ─── Service Modal ────────────────────────────────────────
function populateRepairTypeDropdown(selectedId = '') {
  const select = document.getElementById('service-repair-type');
  if (!select) return;
  select.innerHTML = `<option value="">${window.t('modal.select-repair-type')}</option>`;
  allRepairTypes.forEach(rt => {
    const opt = document.createElement('option');
    opt.value = rt.id;
    opt.textContent = rt.name;
    if (String(rt.id) === String(selectedId)) opt.selected = true;
    select.appendChild(opt);
  });
}

function openServiceModal(id = null) {
  const titleEl = document.getElementById('modal-service-title');
  populateRepairTypeDropdown();

  if (id) {
    const svc = allServices.find(s => s.id === id);
    if (!svc) return;
    titleEl.textContent = window.t('modal.edit-service');
    document.getElementById('service-id').value          = svc.id;
    document.getElementById('service-name').value        = svc.name;
    document.getElementById('service-description').value = svc.description || '';
    document.getElementById('service-price-from').value  = svc.price_from != null ? svc.price_from : '';
    document.getElementById('service-price-to').value    = svc.price_to   != null ? svc.price_to   : '';
    document.getElementById('service-stock').value       = svc.in_stock ? '1' : '0';
    populateRepairTypeDropdown(svc.repair_type_id);
  } else {
    titleEl.textContent = window.t('modal.add-service');
    document.getElementById('service-id').value          = '';
    document.getElementById('service-name').value        = '';
    document.getElementById('service-description').value = '';
    document.getElementById('service-price-from').value  = '';
    document.getElementById('service-price-to').value    = '';
    document.getElementById('service-stock').value       = '1';
  }
  openModal('modal-service');
}

async function saveService() {
  const id           = document.getElementById('service-id').value;
  const name         = document.getElementById('service-name').value.trim();
  const repairTypeId = document.getElementById('service-repair-type').value || null;
  const description  = document.getElementById('service-description').value.trim();
  const priceFromRaw = document.getElementById('service-price-from').value;
  const priceToRaw   = document.getElementById('service-price-to').value;
  const inStock      = parseInt(document.getElementById('service-stock').value);

  const price_from = priceFromRaw !== '' ? parseFloat(priceFromRaw) : null;
  const price_to   = priceToRaw   !== '' ? parseFloat(priceToRaw)   : null;

  if (!name) { showToast('error', window.t('admin.toast.val'), window.t('admin.toast.val-name')); return; }

  const body = { repair_type_id: repairTypeId, name, description: description || null, price_from, price_to, in_stock: inStock };

  try {
    const url    = id ? `${API}/api/admin/services/${id}` : `${API}/api/admin/services`;
    const method = id ? 'PUT' : 'POST';
    const res    = await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error((await res.json()).error);

    const saved = await res.json();
    const repairType = allRepairTypes.find(rt => String(rt.id) === String(saved.repair_type_id));
    saved.repair_type_name = repairType ? repairType.name : null;

    if (id) {
      const idx = allServices.findIndex(s => s.id === saved.id);
      if (idx !== -1) allServices[idx] = saved;
    } else {
      allServices.push(saved);
    }

    closeModal('modal-service');
    renderServices();
    showToast('success', window.t(id ? 'admin.toast.svc-updated' : 'admin.toast.svc-created'), `"${saved.name}"`);
  } catch (err) {
    showToast('error', window.t('admin.toast.save-failed'), err.message);
  }
}

async function deleteService(id) {
  const svc = allServices.find(s => s.id === id);
  if (!svc) return;
  if (!confirm(window.t('confirm.delete-service', { name: svc.name }))) return;

  try {
    const res = await authFetch(`${API}/api/admin/services/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error);
    allServices = allServices.filter(s => s.id !== id);
    renderServices();
    showToast('success', window.t('admin.toast.svc-deleted'), `"${svc.name}"`);
  } catch (err) {
    showToast('error', window.t('admin.toast.delete-failed'), err.message);
  }
}

// ─── Repair Type Modal ────────────────────────────────────
function openRepairTypeModal(id = null) {
  const titleEl = document.getElementById('modal-repair-type-title');

  if (id) {
    const rt = allRepairTypes.find(r => r.id === id);
    if (!rt) return;
    titleEl.textContent = window.t('modal.edit-repair-type');
    document.getElementById('repair-type-id').value          = rt.id;
    document.getElementById('repair-type-name').value        = rt.name;
    document.getElementById('repair-type-description').value = rt.description || '';
  } else {
    titleEl.textContent = window.t('modal.add-repair-type');
    document.getElementById('repair-type-id').value          = '';
    document.getElementById('repair-type-name').value        = '';
    document.getElementById('repair-type-description').value = '';
  }
  openModal('modal-repair-type');
}

async function saveRepairType() {
  const id          = document.getElementById('repair-type-id').value;
  const name        = document.getElementById('repair-type-name').value.trim();
  const description = document.getElementById('repair-type-description').value.trim();

  if (!name) { showToast('error', window.t('admin.toast.val'), window.t('admin.toast.val-type-name')); return; }

  const body = { name, description: description || null };

  try {
    const url    = id ? `${API}/api/admin/repair-types/${id}` : `${API}/api/admin/repair-types`;
    const method = id ? 'PUT' : 'POST';
    const res    = await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error((await res.json()).error);

    const saved = await res.json();
    if (id) {
      const idx = allRepairTypes.findIndex(r => r.id === saved.id);
      if (idx !== -1) allRepairTypes[idx] = saved;
    } else {
      allRepairTypes.push(saved);
    }

    closeModal('modal-repair-type');
    renderRepairTypes();
    showToast('success', window.t(id ? 'admin.toast.type-updated' : 'admin.toast.type-created'), `"${saved.name}"`);
  } catch (err) {
    showToast('error', window.t('admin.toast.save-failed'), err.message);
  }
}

async function deleteRepairType(id) {
  const rt = allRepairTypes.find(r => r.id === id);
  if (!rt) return;
  if (!confirm(window.t('confirm.delete-type', { name: rt.name }))) return;

  try {
    const res = await authFetch(`${API}/api/admin/repair-types/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error);
    allRepairTypes = allRepairTypes.filter(r => r.id !== id);
    renderRepairTypes();
    showToast('success', window.t('admin.toast.type-deleted'), `"${rt.name}"`);
  } catch (err) {
    showToast('error', window.t('admin.toast.delete-failed'), err.message);
  }
}

// ─── Settings ─────────────────────────────────────────────
async function loadSettings() {
  try {
    const res = await authFetch(`${API}/api/admin/settings`);
    const cfg = await res.json();
    document.getElementById('smtp-host').value   = cfg.smtp_host   || '';
    document.getElementById('smtp-port').value   = cfg.smtp_port   || '587';
    document.getElementById('smtp-secure').value = cfg.smtp_secure || 'false';
    document.getElementById('smtp-user').value   = cfg.smtp_user   || '';
    document.getElementById('smtp-pass').value   = cfg.smtp_pass   || '';
    document.getElementById('smtp-from').value   = cfg.smtp_from   || '';
  } catch (err) {
    showToast('error', window.t('admin.toast.load-error'), err.message);
  }
}

async function saveSettings() {
  const body = {
    smtp_host:   document.getElementById('smtp-host').value.trim(),
    smtp_port:   document.getElementById('smtp-port').value.trim(),
    smtp_secure: document.getElementById('smtp-secure').value,
    smtp_user:   document.getElementById('smtp-user').value.trim(),
    smtp_pass:   document.getElementById('smtp-pass').value,
    smtp_from:   document.getElementById('smtp-from').value.trim(),
  };

  try {
    const res = await authFetch(`${API}/api/admin/settings`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    showToast('success', window.t('admin.toast.settings-saved'), '');
  } catch (err) {
    showToast('error', window.t('admin.toast.save-failed'), err.message);
  }
}

async function testSmtp() {
  const btn = document.getElementById('test-smtp-btn');
  btn.disabled = true;
  try {
    const res = await authFetch(`${API}/api/admin/settings/test-smtp`, { method: 'POST' });
    if (!res.ok) throw new Error((await res.json()).error);
    showToast('success', window.t('admin.toast.smtp-ok'), window.t('admin.toast.smtp-ok-msg'));
  } catch (err) {
    showToast('error', window.t('admin.toast.smtp-fail'), err.message);
  } finally {
    btn.disabled = false;
  }
}

// ─── Inventory ────────────────────────────────────────────
function renderInventory() {
  const n = allInventory.length;
  setText('inventory-count', n === 1 ? window.t('count.inv-items', { n }) : window.t('count.inv-items-plural', { n }));

  const tbody = document.getElementById('inventory-tbody');
  if (!tbody) return;

  if (!allInventory.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">📦</div><div class="empty-state-text">${window.t('empty.no-inventory')}</div><div class="empty-state-sub">${window.t('empty.no-inventory-sub')}</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = allInventory.map(item => {
    const isLow = item.quantity <= item.min_quantity;
    return `
      <tr>
        <td class="td-mono">#${item.id}</td>
        <td class="td-primary">${escapeHtml(item.part_name)}</td>
        <td>${escapeHtml(item.model_name)}</td>
        <td>
          <span style="font-weight:700;color:${isLow ? 'var(--danger)' : 'var(--success)'};">${item.quantity}</span>
          ${isLow ? ' <span style="font-size:0.7rem;color:var(--danger);">⚠️ Low</span>' : ''}
        </td>
        <td>${item.min_quantity}</td>
        <td style="color:var(--teal);">${item.unit_price != null ? formatCurrency(item.unit_price) : '—'}</td>
        <td>
          <div style="display:flex;gap:0.4rem;">
            <button class="btn btn-ghost btn-sm btn-icon" title="${window.t('admin.action.edit')}" onclick="openInventoryModal(${item.id})">✏️</button>
            <button class="btn btn-danger btn-sm btn-icon" title="${window.t('admin.action.delete')}" onclick="deleteInventoryItem(${item.id})">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ─── Staff Tab ────────────────────────────────────────────
function renderStaffTab() {
  const currentUser = getCurrentUser();

  // Open orders: status === 'pending'
  const openOrders = allAppointments.filter(a => a.status === 'pending');
  const openTbody = document.getElementById('staff-open-tbody');
  if (openTbody) {
    if (!openOrders.length) {
      openTbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">🎉</div><div class="empty-state-text">${window.t('admin.staff.no-open')}</div></div></td></tr>`;
    } else {
      openTbody.innerHTML = openOrders.map(a => `
        <tr>
          <td class="td-mono">#${a.id}</td>
          <td class="td-primary">${escapeHtml(a.customer_name)}</td>
          <td>${escapeHtml(a.device_model)}</td>
          <td>${escapeHtml(a.service_name || '—')}</td>
          <td>${statusBadge(a.status)}</td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="staffTakeOrder(${a.id})">${window.t('admin.staff.take')}</button>
          </td>
        </tr>
      `).join('');
    }
  }

  // My active orders: only orders explicitly assigned to the current user
  const activeStatuses = ['confirmed', 'diagnostics', 'waiting_parts'];
  const activeOrders = allAppointments.filter(a =>
    activeStatuses.includes(a.status) && a.assigned_to === currentUser
  );
  const activeTbody = document.getElementById('staff-active-tbody');
  if (activeTbody) {
    if (!activeOrders.length) {
      activeTbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">${window.t('admin.staff.no-active')}</div></div></td></tr>`;
    } else {
      activeTbody.innerHTML = activeOrders.map(a => `
        <tr>
          <td class="td-mono">#${a.id}</td>
          <td class="td-primary">${escapeHtml(a.customer_name)}</td>
          <td>${escapeHtml(a.device_model)}</td>
          <td>${escapeHtml(a.service_name || '—')}</td>
          <td>${statusBadge(a.status)}</td>
          <td>
            <button class="btn btn-ghost btn-sm btn-icon" title="${window.t('admin.action.edit')}" onclick="openOrderModal(${a.id})">✏️</button>
          </td>
        </tr>
      `).join('');
    }
  }
}

async function staffTakeOrder(id) {
  try {
    const res = await authFetch(`${API}/api/admin/appointments/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: 'confirmed', assigned_to: getCurrentUser() }),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    const updated = await res.json();
    const idx = allAppointments.findIndex(a => a.id === updated.id);
    if (idx !== -1) allAppointments[idx] = { ...allAppointments[idx], status: updated.status, assigned_to: updated.assigned_to };

    // Refresh badges
    const pending = allAppointments.filter(a => a.status === 'pending').length;
    const pendingBadge = document.getElementById('pending-badge');
    if (pendingBadge) pendingBadge.textContent = pending;
    const staffBadge = document.getElementById('staff-open-badge');
    if (staffBadge) {
      if (pending > 0) { staffBadge.textContent = pending; staffBadge.style.display = 'inline-flex'; }
      else { staffBadge.style.display = 'none'; }
    }

    renderStaffTab();
    showToast('success', window.t('admin.toast.status-updated'), `#${id}`);
  } catch (err) {
    showToast('error', window.t('admin.toast.update-failed'), err.message);
  }
}

function openInventoryModal(id = null) {
  const titleEl = document.getElementById('modal-inventory-title');

  if (id) {
    const item = allInventory.find(i => i.id === id);
    if (!item) return;
    titleEl.textContent = window.t('admin.edit-inventory');
    document.getElementById('inventory-id').value      = item.id;
    document.getElementById('inv-part-name').value     = item.part_name;
    document.getElementById('inv-model-name').value    = item.model_name;
    document.getElementById('inv-quantity').value      = item.quantity;
    document.getElementById('inv-min-quantity').value  = item.min_quantity;
    document.getElementById('inv-unit-price').value    = item.unit_price != null ? item.unit_price : '';
  } else {
    titleEl.textContent = window.t('admin.add-inventory');
    document.getElementById('inventory-id').value      = '';
    document.getElementById('inv-part-name').value     = '';
    document.getElementById('inv-model-name').value    = '';
    document.getElementById('inv-quantity').value      = '0';
    document.getElementById('inv-min-quantity').value  = '1';
    document.getElementById('inv-unit-price').value    = '';
  }
  openModal('modal-inventory');
}

async function saveInventory() {
  const id          = document.getElementById('inventory-id').value;
  const part_name   = document.getElementById('inv-part-name').value.trim();
  const model_name  = document.getElementById('inv-model-name').value.trim();
  const quantity    = document.getElementById('inv-quantity').value;
  const min_qty     = document.getElementById('inv-min-quantity').value;
  const unit_price  = document.getElementById('inv-unit-price').value;

  if (!part_name || !model_name) {
    showToast('error', window.t('admin.toast.val'), window.t('admin.toast.val-inv-name'));
    return;
  }

  const body = {
    part_name, model_name,
    quantity: quantity !== '' ? parseInt(quantity, 10) : 0,
    min_quantity: min_qty !== '' ? parseInt(min_qty, 10) : 1,
    unit_price: unit_price !== '' ? parseFloat(unit_price) : null,
  };

  try {
    const url    = id ? `${API}/api/admin/inventory/${id}` : `${API}/api/admin/inventory`;
    const method = id ? 'PUT' : 'POST';
    const res    = await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error((await res.json()).error);

    const saved = await res.json();
    if (id) {
      const idx = allInventory.findIndex(i => i.id === saved.id);
      if (idx !== -1) allInventory[idx] = saved;
    } else {
      allInventory.push(saved);
    }

    // Update low-stock badge
    const lowStockItems = allInventory.filter(i => i.quantity <= i.min_quantity);
    const lowBadge = document.getElementById('low-stock-badge');
    if (lowBadge) {
      if (lowStockItems.length > 0) {
        lowBadge.textContent = lowStockItems.length;
        lowBadge.style.display = 'inline-flex';
      } else {
        lowBadge.style.display = 'none';
      }
    }

    closeModal('modal-inventory');
    renderInventory();
    showToast('success', window.t(id ? 'admin.toast.inv-updated' : 'admin.toast.inv-created'), `"${saved.part_name}"`);
  } catch (err) {
    showToast('error', window.t('admin.toast.save-failed'), err.message);
  }
}

async function deleteInventoryItem(id) {
  const item = allInventory.find(i => i.id === id);
  if (!item) return;
  if (!confirm(window.t('confirm.delete-inventory', { name: item.part_name }))) return;

  try {
    const res = await authFetch(`${API}/api/admin/inventory/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error);
    allInventory = allInventory.filter(i => i.id !== id);
    renderInventory();
    showToast('success', window.t('admin.toast.inv-deleted'), `"${item.part_name}"`);
  } catch (err) {
    showToast('error', window.t('admin.toast.delete-failed'), err.message);
  }
}

// ─── Receipt ──────────────────────────────────────────────
function printReceipt() {
  const id = parseInt(document.getElementById('order-id').value, 10);
  if (!id) return;
  const appt = allAppointments.find(a => a.id === id);
  if (!appt) return;

  const esc = str => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const fmtDate = d => d ? new Date(d).toLocaleString('sk-SK') : '—';
  const statusLabels = {
    pending: 'Prijaté', confirmed: 'Potvrdené', diagnostics: 'Diagnostika',
    waiting_parts: 'Čaká na diely', completed: 'Opravené', cancelled: 'Zrušené',
  };

  const html = `<!DOCTYPE html>
<html lang="sk"><head><meta charset="UTF-8"/>
<title>Potvrdenka #${appt.id}</title>
<style>
  body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;padding:0 20px;color:#1a1a2e;}
  .header{text-align:center;border-bottom:2px solid #00d4ff;padding-bottom:20px;margin-bottom:24px;}
  .logo{font-size:1.8rem;font-weight:900;} .logo span{color:#00d4ff;}
  .receipt-title{font-size:1.1rem;color:#555;margin-top:6px;}
  .receipt-id{font-size:1.3rem;font-weight:700;color:#00d4ff;margin-top:4px;}
  .section{margin-bottom:20px;}
  .section-title{font-weight:700;font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:10px;border-bottom:1px solid #eee;padding-bottom:4px;}
  .row{display:flex;margin-bottom:8px;}
  .label{width:200px;font-size:0.88rem;color:#555;flex-shrink:0;}
  .value{font-size:0.88rem;font-weight:600;color:#1a1a2e;}
  .footer{border-top:1px solid #eee;margin-top:30px;padding-top:16px;font-size:0.8rem;color:#888;text-align:center;}
  .status-badge{display:inline-block;background:#e8f4ff;color:#3b82f6;padding:4px 12px;border-radius:20px;font-weight:700;font-size:0.85rem;}
  .price{color:#00d4ff;font-size:1rem;font-weight:700;}
  @media print{button{display:none!important;}}
</style></head><body>
<div class="header">
  <div class="logo">⚡ <span>SSS</span>tylish Repair</div>
  <div class="receipt-title">Potvrdenka o prevzatí zariadenia do opravy</div>
  <div class="receipt-id">Zákazka #${appt.id}</div>
</div>
<div class="section">
  <div class="section-title">Zákazník</div>
  <div class="row"><div class="label">Meno</div><div class="value">${esc(appt.customer_name)}</div></div>
  <div class="row"><div class="label">E-mail</div><div class="value">${esc(appt.customer_email)}</div></div>
  <div class="row"><div class="label">Telefón</div><div class="value">${esc(appt.customer_phone)}</div></div>
</div>
<div class="section">
  <div class="section-title">Zariadenie &amp; Oprava</div>
  <div class="row"><div class="label">Model</div><div class="value">${esc(appt.device_model)}</div></div>
  <div class="row"><div class="label">Typ opravy</div><div class="value">${esc(appt.service_name || '—')}</div></div>
  <div class="row"><div class="label">Popis problému</div><div class="value">${esc(appt.notes || '—')}</div></div>
  <div class="row"><div class="label">Stav</div><div class="value"><span class="status-badge">${esc(statusLabels[appt.status] || appt.status)}</span></div></div>
  ${appt.quoted_price != null ? `<div class="row"><div class="label">Cena opravy</div><div class="value price">${Number(appt.quoted_price).toFixed(2)} €</div></div>` : ''}
</div>
<div class="section">
  <div class="section-title">Dátum</div>
  <div class="row"><div class="label">Prevzaté</div><div class="value">${fmtDate(appt.created_at)}</div></div>
</div>
<div class="footer">
  <p>SSStylish Repair · info@ssstylish.sk</p>
  <p>Zariadenie bolo prevzaté na opravu. Zákazník bude kontaktovaný e-mailom po diagnostike.</p>
</div>
<br/><div style="text-align:center;">
  <button onclick="window.print()" style="padding:10px 28px;background:#00d4ff;color:#0a0e1a;border:none;border-radius:8px;font-weight:700;font-size:1rem;cursor:pointer;">🖨️ Tlačiť / Uložiť PDF</button>
</div>
</body></html>`;

  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
}

// ─── Event Listeners ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  // Back button on login step 2
  const backBtn = document.getElementById('login-back-btn');
  if (backBtn) backBtn.addEventListener('click', () => showLoginStep(1));

  // Mobile sidebar toggle
  const hamburger = document.getElementById('topbar-hamburger');
  const sidebar   = document.getElementById('sidebar');
  const overlay   = document.getElementById('sidebar-overlay');

  function openSidebar() {
    sidebar?.classList.add('open');
    overlay?.classList.add('open');
    hamburger?.setAttribute('aria-expanded', 'true');
  }

  function closeSidebar() {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('open');
    hamburger?.setAttribute('aria-expanded', 'false');
  }

  hamburger?.addEventListener('click', () => {
    if (sidebar?.classList.contains('open')) closeSidebar();
    else openSidebar();
  });

  overlay?.addEventListener('click', closeSidebar);

  // Logout button
  document.getElementById('logout-btn')?.addEventListener('click', logout);

  // Sidebar navigation
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', () => {
      switchTab(item.dataset.tab);
      // Close sidebar on mobile after nav
      if (window.innerWidth <= 768) closeSidebar();
    });
  });

  // Modal save buttons
  document.getElementById('save-order-btn')?.addEventListener('click', saveOrderStatus);
  document.getElementById('save-service-btn')?.addEventListener('click', saveService);
  document.getElementById('save-repair-type-btn')?.addEventListener('click', saveRepairType);
  document.getElementById('save-inventory-btn')?.addEventListener('click', saveInventory);
  document.getElementById('print-receipt-btn')?.addEventListener('click', printReceipt);

  // Admin message send
  document.getElementById('admin-send-msg-btn')?.addEventListener('click', sendAdminMessage);
  const adminMsgInput = document.getElementById('admin-msg-input');
  if (adminMsgInput) {
    adminMsgInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAdminMessage(); }
    });
  }

  // Add buttons
  document.getElementById('add-service-btn')?.addEventListener('click', () => openServiceModal());
  document.getElementById('add-repair-type-btn')?.addEventListener('click', () => openRepairTypeModal());
  document.getElementById('add-inventory-btn')?.addEventListener('click', () => openInventoryModal());

  // Settings
  document.getElementById('save-settings-btn')?.addEventListener('click', saveSettings);
  document.getElementById('test-smtp-btn')?.addEventListener('click', testSmtp);

  // Orders filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentOrderFilter = btn.dataset.filter;
      renderOrders();
    });
  });

  // Orders search
  const searchInput = document.getElementById('orders-search');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      ordersSearchTerm = e.target.value;
      renderOrders();
    });
  }

  // Language toggle
  document.querySelectorAll('.lang-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = window.currentLang() === 'en' ? 'sk' : 'en';
      window.setLanguage(next);
      loadDashboard();
      renderOrders();
      renderServices();
      renderRepairTypes();
      renderInventory();
      renderStaffTab();
    });
  });

  // Check auth
  if (!getToken()) {
    loadLoginUsers();
    showLoginOverlay();
  } else {
    updateUserDisplay();
    loadAllData();
  }
});

