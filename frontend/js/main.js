/* ============================================================
   main.js – SSStylish Repair customer-facing page
   ============================================================ */

const API = '';  // Same-origin: backend serves frontend

// ─── Navbar scroll effect ─────────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
});

// ─── Smooth scroll for nav links ──────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ─── Intersection Observer – reveal on scroll ─────────────
const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ─── Language toggle ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.lang-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = window.currentLang() === 'en' ? 'sk' : 'en';
      window.setLanguage(next);
      // Re-render dynamic content with new language
      loadServices();
    });
  });
});

// ─── Service icon mapping ──────────────────────────────────
function getServiceIcon(typeName, serviceName) {
  const t = (typeName || '').toLowerCase();
  const s = (serviceName || '').toLowerCase();
  if (t.includes('screen') || s.includes('screen') || t.includes('obrazovk') || s.includes('obrazovk')) return '📱';
  if (t.includes('battery') || s.includes('battery') || t.includes('bater') || s.includes('bater')) return '🔋';
  if (t.includes('water') || s.includes('water') || t.includes('vod') || s.includes('vod')) return '💧';
  if (t.includes('software') || s.includes('software') || s.includes('restore') || s.includes('softvér')) return '💻';
  return '🔧';
}

// ─── Format price range ────────────────────────────────────
function formatPriceRange(priceFrom, priceTo) {
  const hasFrom = priceFrom != null && !isNaN(Number(priceFrom));
  const hasTo   = priceTo   != null && !isNaN(Number(priceTo));
  if (hasFrom && hasTo) {
    return `${window.t('services.price-from')} ${Number(priceFrom).toFixed(0)} € – ${Number(priceTo).toFixed(0)} €`;
  }
  if (hasFrom) return `${window.t('services.price-from')} ${Number(priceFrom).toFixed(0)} €`;
  if (hasTo)   return `${window.t('services.price-up-to')} ${Number(priceTo).toFixed(0)} €`;
  return window.t('services.price-on-request');
}

// ─── Load & render services ───────────────────────────────
async function loadServices() {
  const grid = document.getElementById('services-grid');
  if (!grid) return;

  try {
    const res = await fetch(`${API}/api/services`);
    const services = await res.json();

    if (!services.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);">${window.t('services.empty')}</div>`;
      return;
    }

    grid.innerHTML = services.map((s, i) => `
      <div class="service-card" style="animation-delay:${i * 0.08}s">
        <div class="service-card-content">
          <span class="service-type-badge">${escapeHtml(s.repair_type_name || 'General')}</span>
          <div class="service-icon">${getServiceIcon(s.repair_type_name, s.name)}</div>
          <h3 class="service-name">${escapeHtml(s.name)}</h3>
          <p class="service-description">${escapeHtml(s.description || 'Profesionálna oprava s originálnymi dielmi.')}</p>
          <div class="service-footer">
            <span class="service-price service-price-range">${formatPriceRange(s.price_from, s.price_to)}</span>
            <div class="service-meta">
              <span class="service-stock ${s.in_stock ? 'stock-in' : 'stock-out'}">
                ${s.in_stock ? window.t('services.in-stock') : window.t('services.out-stock')}
              </span>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    // Observe new cards
    grid.querySelectorAll('.service-card').forEach(card => {
      const cardObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            cardObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      cardObserver.observe(card);
    });

    // Render picker in booking section
    renderServicePicker(services);

  } catch (err) {
    console.error('Failed to load services:', err);
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-muted);">${window.t('services.error')}</div>`;
  }
}

// ─── Service picker (Booking Step 1) ─────────────────────
let _allServices = [];

function renderServicePicker(services) {
  _allServices = services;
  const pickerGrid = document.getElementById('service-picker-grid');
  if (!pickerGrid) return;

  if (!services.length) {
    pickerGrid.innerHTML = `<div style="color:var(--text-muted);font-size:0.88rem;padding:1rem 0;">${window.t('services.empty')}</div>`;
    return;
  }

  pickerGrid.innerHTML = services.map(s => `
    <div class="picker-card ${!s.in_stock ? 'picker-card-unavailable' : ''}"
         data-service-id="${s.id}"
         data-service-name="${escapeHtml(s.name)}"
         role="button" tabindex="0"
         style="${!s.in_stock ? 'opacity:0.55;cursor:not-allowed;' : ''}">
      <div class="picker-card-icon">${getServiceIcon(s.repair_type_name, s.name)}</div>
      <div class="picker-card-name">${escapeHtml(s.name)}</div>
      <div class="picker-card-type">${escapeHtml(s.repair_type_name || '')}</div>
      <div class="picker-card-price">${formatPriceRange(s.price_from, s.price_to)}</div>
      <div class="picker-card-stock ${s.in_stock ? 'stock-in' : 'stock-out'}">
        ${s.in_stock ? window.t('services.in-stock') : window.t('services.out-stock')}
      </div>
    </div>
  `).join('');

  pickerGrid.querySelectorAll('.picker-card').forEach(card => {
    const svcId = card.dataset.serviceId;
    const svc = services.find(s => String(s.id) === String(svcId));
    if (!svc || !svc.in_stock) return;

    card.addEventListener('click', () => selectService(svcId, card.dataset.serviceName));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectService(svcId, card.dataset.serviceName); }
    });
  });

  // Re-apply current selection if any
  const currentId = document.getElementById('service_id')?.value;
  if (currentId) {
    const svc = services.find(s => String(s.id) === String(currentId));
    if (svc) selectService(currentId, svc.name);
  }
}

function selectService(id, name) {
  const hiddenInput  = document.getElementById('service_id');
  const selectedInfo = document.getElementById('booking-selected-service');
  const selectedName = document.getElementById('selected-service-name');

  if (hiddenInput) hiddenInput.value = id;

  // Update checkmark on picker cards
  document.querySelectorAll('.picker-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.serviceId === String(id));
  });

  // Show selected service banner
  if (selectedInfo && selectedName) {
    selectedName.textContent = name;
    selectedInfo.style.display = 'flex';
  }

  // Scroll smoothly to the form
  const formStep = document.getElementById('booking-form-step');
  if (formStep) {
    setTimeout(() => formStep.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
  }
}

// ─── Form validation ──────────────────────────────────────
function validateForm(data) {
  const errors = [];
  if (!data.service_id)        errors.push(window.t('val.service-required'));
  if (!data.notes?.trim())     errors.push(window.t('val.details-required'));
  return errors;
}

// ─── Booking form submission ──────────────────────────────
async function handleBooking(e) {
  e.preventDefault();
  const form = e.target;
  const btn  = document.getElementById('submit-btn');
  const textEl   = document.getElementById('submit-text');
  const loadEl   = document.getElementById('submit-loading');

  const data = {
    service_id: form.service_id.value || null,
    notes:      form.notes.value.trim() || null,
  };

  const errors = validateForm(data);
  if (errors.length) {
    errors.forEach(msg => showToast('error', window.t('toast.val-error'), msg));
    return;
  }

  btn.disabled = true;
  textEl.style.display = 'none';
  loadEl.style.display  = 'inline';

  try {
    const res = await fetch(`${API}/api/appointments`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) throw new Error(result.error || window.t('toast.something-wrong'));

    showToast('success', window.t('toast.booked-title'), window.t('toast.booked-msg'));
    form.reset();

    // Reset service picker after successful submission
    document.querySelectorAll('.picker-card').forEach(c => c.classList.remove('selected'));
    const selInfo = document.getElementById('booking-selected-service');
    if (selInfo) selInfo.style.display = 'none';

  } catch (err) {
    showToast('error', window.t('toast.book-fail'), err.message || window.t('toast.something-wrong'));
  } finally {
    btn.disabled = false;
    textEl.style.display = 'inline';
    loadEl.style.display  = 'none';
  }
}

// ─── Toast notifications ──────────────────────────────────
function showToast(type, title, message, duration = 5000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <div class="toast-body">
      <div class="toast-title">${escapeHtml(title)}</div>
      <div class="toast-message">${escapeHtml(message)}</div>
    </div>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

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
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('sk-SK', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── Init ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadServices();

  const form = document.getElementById('booking-form');
  if (form) form.addEventListener('submit', handleBooking);

  // "Change service" button scrolls back to picker
  const changeBtn = document.getElementById('change-service-btn');
  if (changeBtn) {
    changeBtn.addEventListener('click', () => {
      const pickerStep = document.getElementById('service-picker-step');
      if (pickerStep) pickerStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
});
