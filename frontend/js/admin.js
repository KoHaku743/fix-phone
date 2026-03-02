/* ============================================================
   admin.js – SSStylish Repair Admin Panel
   ============================================================ */

const API = '';

// ─── Auth helpers ─────────────────────────────────────────
const TOKEN_KEY = 'fixphone-admin-token';

function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

function saveToken(token) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch (_) {}
}

function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch (_) {}
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
    showLoginOverlay();
    throw new Error('Session expired. Please sign in again.');
  }
  return res;
}

// ─── Login overlay ────────────────────────────────────────
function showLoginOverlay() {
  const overlay = document.getElementById('login-overlay');
  if (overlay) overlay.style.display = 'flex';
}

function hideLoginOverlay() {
  const overlay = document.getElementById('login-overlay');
  if (overlay) overlay.style.display = 'none';
}

async function handleLogin(e) {
  e.preventDefault();
  const password   = document.getElementById('admin-password').value;
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
      body:    JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    saveToken(data.token);
    hideLoginOverlay();
    document.getElementById('admin-password').value = '';
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
    pending:   'badge-pending',
    confirmed: 'badge-confirmed',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
  };
  const keys = {
    pending:   'status.pending',
    confirmed: 'status.confirmed',
    completed: 'status.completed',
    cancelled: 'status.cancelled',
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
    settings:     'admin.tab.settings',
  };
  const topTitle = document.getElementById('topbar-title');
  if (topTitle) topTitle.textContent = window.t(titleKeys[tabName] || 'admin.tab.dashboard');

  if (tabName === 'dashboard')     loadDashboard();
  if (tabName === 'orders')        renderOrders();
  if (tabName === 'services')      renderServices();
  if (tabName === 'repair-types')  renderRepairTypes();
  if (tabName === 'settings')      loadSettings();
}

// ─── Load all data ────────────────────────────────────────
async function loadAllData() {
  try {
    const [apptRes, svcRes, rtRes] = await Promise.all([
      authFetch(`${API}/api/admin/appointments`),
      authFetch(`${API}/api/admin/services`),
      authFetch(`${API}/api/admin/repair-types`),
    ]);
    allAppointments = await apptRes.json();
    allServices     = await svcRes.json();
    allRepairTypes  = await rtRes.json();

    const pending = allAppointments.filter(a => a.status === 'pending').length;
    const badge = document.getElementById('pending-badge');
    if (badge) badge.textContent = pending;

    loadDashboard();
  } catch (err) {
    if (err.message !== 'Session expired. Please sign in again.') {
      showToast('error', window.t('admin.toast.load-error'), window.t('admin.toast.load-error-msg'));
    }
    console.error(err);
  }
}

// ─── Dashboard ────────────────────────────────────────────
function loadDashboard() {
  const total     = allAppointments.length;
  const pending   = allAppointments.filter(a => a.status === 'pending').length;
  const completed = allAppointments.filter(a => a.status === 'completed').length;
  const revenue   = allAppointments
    .filter(a => a.status === 'completed')
    .reduce((sum, a) => sum + (parseFloat(a.quoted_price) || 0), 0);

  setText('stat-total',     total);
  setText('stat-pending',   pending);
  setText('stat-completed', completed);
  setText('stat-revenue',   formatCurrency(revenue));

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

  try {
    const body = { status };
    if (quotedRaw !== '') body.quoted_price = quoted_price;

    const res = await authFetch(`${API}/api/admin/appointments/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.json()).error);

    const updated = await res.json();
    const idx = allAppointments.findIndex(a => a.id === updated.id);
    if (idx !== -1) allAppointments[idx] = { ...allAppointments[idx], status: updated.status, quoted_price: updated.quoted_price };

    closeModal('modal-order');
    renderOrders();
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

// ─── Event Listeners ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  // Sidebar navigation
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', () => switchTab(item.dataset.tab));
  });

  // Modal save buttons
  document.getElementById('save-order-btn')?.addEventListener('click', saveOrderStatus);
  document.getElementById('save-service-btn')?.addEventListener('click', saveService);
  document.getElementById('save-repair-type-btn')?.addEventListener('click', saveRepairType);

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
    });
  });

  // Check auth
  if (!getToken()) {
    showLoginOverlay();
  } else {
    loadAllData();
  }
});

