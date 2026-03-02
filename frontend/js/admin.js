/* ============================================================
   admin.js – FixPhone Admin Panel
   ============================================================ */

const API = '';

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
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return '$0.00';
  return '$' + n.toFixed(2);
}

function statusBadge(status) {
  const map = {
    pending:   'badge-pending',
    confirmed: 'badge-confirmed',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
  };
  const labels = {
    pending:   '⏳ Pending',
    confirmed: '🔵 Confirmed',
    completed: '✅ Completed',
    cancelled: '❌ Cancelled',
  };
  return `<span class="badge ${map[status] || 'badge-pending'}">${labels[status] || status}</span>`;
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
  const titles = { dashboard: 'Dashboard', orders: 'All Appointments', services: 'Services', 'repair-types': 'Repair Types' };
  const topTitle = document.getElementById('topbar-title');
  if (topTitle) topTitle.textContent = titles[tabName] || tabName;

  if (tabName === 'dashboard')     loadDashboard();
  if (tabName === 'orders')        renderOrders();
  if (tabName === 'services')      renderServices();
  if (tabName === 'repair-types')  renderRepairTypes();
}

// ─── Load all data ────────────────────────────────────────
async function loadAllData() {
  try {
    const [apptRes, svcRes, rtRes] = await Promise.all([
      fetch(`${API}/api/admin/appointments`),
      fetch(`${API}/api/admin/services`),
      fetch(`${API}/api/admin/repair-types`),
    ]);
    allAppointments = await apptRes.json();
    allServices     = await svcRes.json();
    allRepairTypes  = await rtRes.json();

    const pending = allAppointments.filter(a => a.status === 'pending').length;
    const badge = document.getElementById('pending-badge');
    if (badge) badge.textContent = pending;

    loadDashboard();
  } catch (err) {
    showToast('error', 'Load Error', 'Failed to load data from the server.');
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
    .reduce((sum, a) => sum + (parseFloat(a.service_price) || 0), 0);

  setText('stat-total',     total);
  setText('stat-pending',   pending);
  setText('stat-completed', completed);
  setText('stat-revenue',   formatCurrency(revenue));

  const recent = allAppointments.slice(0, 8);
  setText('recent-count', `Showing ${recent.length} of ${total} total`);

  const tbody = document.getElementById('recent-tbody');
  if (!tbody) return;

  if (!recent.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">No appointments yet</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(a => `
    <tr>
      <td class="td-mono">#${a.id}</td>
      <td class="td-primary">${escapeHtml(a.customer_name)}</td>
      <td>${escapeHtml(a.device_model)}</td>
      <td>${escapeHtml(a.service_name || '—')}</td>
      <td>${formatDate(a.appointment_date)}</td>
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
  setText('orders-count', `${filtered.length} appointment${filtered.length !== 1 ? 's' : ''}`);

  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">No orders found</div><div class="empty-state-sub">Try adjusting filters or search terms</div></div></td></tr>`;
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
        ${a.service_price ? `<div style="font-size:0.75rem;color:var(--teal);">${formatCurrency(a.service_price)}</div>` : ''}
      </td>
      <td style="white-space:nowrap;">${formatDate(a.appointment_date)}</td>
      <td>${statusBadge(a.status)}</td>
      <td>
        <button class="btn btn-ghost btn-sm btn-icon" title="Edit status" onclick="openOrderModal(${a.id})">✏️</button>
      </td>
    </tr>
  `).join('');
}

// ─── Services ─────────────────────────────────────────────
function renderServices() {
  setText('services-count', `${allServices.length} service${allServices.length !== 1 ? 's' : ''}`);

  const tbody = document.getElementById('services-tbody');
  if (!tbody) return;

  if (!allServices.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">🛠️</div><div class="empty-state-text">No services yet</div><div class="empty-state-sub">Click "Add Service" to create your first service</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = allServices.map(s => `
    <tr>
      <td class="td-mono">#${s.id}</td>
      <td class="td-primary">${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.repair_type_name || '—')}</td>
      <td style="color:var(--teal);font-weight:700;">${formatCurrency(s.price)}</td>
      <td>${s.duration_minutes} min</td>
      <td>
        <span class="badge ${s.in_stock ? 'badge-in-stock' : 'badge-out-of-stock'}">
          ${s.in_stock ? '✓ In Stock' : '✗ Out of Stock'}
        </span>
      </td>
      <td>
        <div style="display:flex;gap:0.4rem;">
          <button class="btn btn-ghost btn-sm btn-icon" title="Edit" onclick="openServiceModal(${s.id})">✏️</button>
          <button class="btn btn-danger btn-sm btn-icon" title="Delete" onclick="deleteService(${s.id})">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ─── Repair Types ─────────────────────────────────────────
function renderRepairTypes() {
  setText('repair-types-count', `${allRepairTypes.length} type${allRepairTypes.length !== 1 ? 's' : ''}`);

  const tbody = document.getElementById('repair-types-tbody');
  if (!tbody) return;

  if (!allRepairTypes.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-state-icon">🏷️</div><div class="empty-state-text">No repair types yet</div></div></td></tr>`;
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
          <button class="btn btn-ghost btn-sm btn-icon" title="Edit" onclick="openRepairTypeModal(${rt.id})">✏️</button>
          <button class="btn btn-danger btn-sm btn-icon" title="Delete" onclick="deleteRepairType(${rt.id})">🗑️</button>
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

// Close modal on overlay click or close button
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
  if (e.target.dataset.modal) {
    closeModal(e.target.dataset.modal);
  }
});

// ─── Order Modal ──────────────────────────────────────────
function openOrderModal(id) {
  const appt = allAppointments.find(a => a.id === id);
  if (!appt) return;

  document.getElementById('order-id').value = appt.id;
  document.getElementById('order-status').value = appt.status;
  document.getElementById('order-customer-info').innerHTML =
    `<strong>${escapeHtml(appt.customer_name)}</strong> &bull; ${escapeHtml(appt.device_model)} &bull; ${escapeHtml(appt.customer_email)}`;

  openModal('modal-order');
}

async function saveOrderStatus() {
  const id     = document.getElementById('order-id').value;
  const status = document.getElementById('order-status').value;

  try {
    const res = await fetch(`${API}/api/admin/appointments/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error((await res.json()).error);

    const updated = await res.json();
    const idx = allAppointments.findIndex(a => a.id === updated.id);
    if (idx !== -1) allAppointments[idx] = { ...allAppointments[idx], status: updated.status };

    closeModal('modal-order');
    renderOrders();
    loadDashboard();
    const badge = document.getElementById('pending-badge');
    if (badge) badge.textContent = allAppointments.filter(a => a.status === 'pending').length;
    showToast('success', 'Status Updated', `Appointment #${id} set to "${status}".`);
  } catch (err) {
    showToast('error', 'Update Failed', err.message);
  }
}

// ─── Service Modal ────────────────────────────────────────
function populateRepairTypeDropdown(selectedId = '') {
  const select = document.getElementById('service-repair-type');
  if (!select) return;
  select.innerHTML = '<option value="">— Select repair type —</option>';
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
    titleEl.textContent = 'Edit Service';
    document.getElementById('service-id').value          = svc.id;
    document.getElementById('service-name').value        = svc.name;
    document.getElementById('service-description').value = svc.description || '';
    document.getElementById('service-price').value       = svc.price;
    document.getElementById('service-duration').value    = svc.duration_minutes;
    document.getElementById('service-stock').value       = svc.in_stock ? '1' : '0';
    populateRepairTypeDropdown(svc.repair_type_id);
  } else {
    titleEl.textContent = 'Add Service';
    document.getElementById('service-id').value          = '';
    document.getElementById('service-name').value        = '';
    document.getElementById('service-description').value = '';
    document.getElementById('service-price').value       = '';
    document.getElementById('service-duration').value    = '60';
    document.getElementById('service-stock').value       = '1';
  }
  openModal('modal-service');
}

async function saveService() {
  const id       = document.getElementById('service-id').value;
  const name     = document.getElementById('service-name').value.trim();
  const price    = parseFloat(document.getElementById('service-price').value);
  const repairTypeId = document.getElementById('service-repair-type').value || null;
  const description  = document.getElementById('service-description').value.trim();
  const duration     = parseInt(document.getElementById('service-duration').value) || 60;
  const inStock      = parseInt(document.getElementById('service-stock').value);

  if (!name) { showToast('error', 'Validation', 'Service name is required.'); return; }
  if (isNaN(price) || price < 0) { showToast('error', 'Validation', 'Valid price is required.'); return; }

  const body = { repair_type_id: repairTypeId, name, description: description || null, price, duration_minutes: duration, in_stock: inStock };

  try {
    const url    = id ? `${API}/api/admin/services/${id}` : `${API}/api/admin/services`;
    const method = id ? 'PUT' : 'POST';
    const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
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
    showToast('success', id ? 'Service Updated' : 'Service Created', `"${saved.name}" saved successfully.`);
  } catch (err) {
    showToast('error', 'Save Failed', err.message);
  }
}

async function deleteService(id) {
  const svc = allServices.find(s => s.id === id);
  if (!svc) return;
  if (!confirm(`Delete service "${svc.name}"? This action cannot be undone.`)) return;

  try {
    const res = await fetch(`${API}/api/admin/services/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error);
    allServices = allServices.filter(s => s.id !== id);
    renderServices();
    showToast('success', 'Service Deleted', `"${svc.name}" has been removed.`);
  } catch (err) {
    showToast('error', 'Delete Failed', err.message);
  }
}

// ─── Repair Type Modal ────────────────────────────────────
function openRepairTypeModal(id = null) {
  const titleEl = document.getElementById('modal-repair-type-title');

  if (id) {
    const rt = allRepairTypes.find(r => r.id === id);
    if (!rt) return;
    titleEl.textContent = 'Edit Repair Type';
    document.getElementById('repair-type-id').value          = rt.id;
    document.getElementById('repair-type-name').value        = rt.name;
    document.getElementById('repair-type-description').value = rt.description || '';
  } else {
    titleEl.textContent = 'Add Repair Type';
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

  if (!name) { showToast('error', 'Validation', 'Repair type name is required.'); return; }

  const body = { name, description: description || null };

  try {
    const url    = id ? `${API}/api/admin/repair-types/${id}` : `${API}/api/admin/repair-types`;
    const method = id ? 'PUT' : 'POST';
    const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
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
    showToast('success', id ? 'Type Updated' : 'Type Created', `"${saved.name}" saved.`);
  } catch (err) {
    showToast('error', 'Save Failed', err.message);
  }
}

async function deleteRepairType(id) {
  const rt = allRepairTypes.find(r => r.id === id);
  if (!rt) return;
  if (!confirm(`Delete repair type "${rt.name}"? This action cannot be undone.`)) return;

  try {
    const res = await fetch(`${API}/api/admin/repair-types/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error);
    allRepairTypes = allRepairTypes.filter(r => r.id !== id);
    renderRepairTypes();
    showToast('success', 'Type Deleted', `"${rt.name}" has been removed.`);
  } catch (err) {
    showToast('error', 'Delete Failed', err.message);
  }
}

// ─── Event Listeners ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Sidebar navigation
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', () => switchTab(item.dataset.tab));
  });

  // Modal save buttons
  document.getElementById('save-order-btn')?.addEventListener('click', saveOrderStatus);
  document.getElementById('save-service-btn')?.addEventListener('click', saveService);
  document.getElementById('save-repair-type-btn')?.addEventListener('click', saveRepairType);

  // Add buttons
  document.getElementById('add-service-btn')?.addEventListener('click', () => openServiceModal());
  document.getElementById('add-repair-type-btn')?.addEventListener('click', () => openRepairTypeModal());

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

  // Load data
  loadAllData();
});
