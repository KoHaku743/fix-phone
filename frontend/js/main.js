/* ============================================================
   main.js – FixPhone customer-facing page
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

// ─── Service icon mapping ──────────────────────────────────
function getServiceIcon(typeName, serviceName) {
  const t = (typeName || '').toLowerCase();
  const s = (serviceName || '').toLowerCase();
  if (t.includes('screen') || s.includes('screen'))   return '📱';
  if (t.includes('battery') || s.includes('battery')) return '🔋';
  if (t.includes('water') || s.includes('water'))     return '💧';
  if (t.includes('software') || s.includes('software') || s.includes('restore')) return '💻';
  return '🔧';
}

// ─── Load & render services ───────────────────────────────
async function loadServices() {
  const grid = document.getElementById('services-grid');
  if (!grid) return;

  try {
    const res = await fetch(`${API}/api/services`);
    const services = await res.json();

    if (!services.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);">No services available yet.</div>`;
      return;
    }

    grid.innerHTML = services.map((s, i) => `
      <div class="service-card" style="animation-delay:${i * 0.08}s">
        <div class="service-card-content">
          <span class="service-type-badge">${s.repair_type_name || 'General'}</span>
          <div class="service-icon">${getServiceIcon(s.repair_type_name, s.name)}</div>
          <h3 class="service-name">${escapeHtml(s.name)}</h3>
          <p class="service-description">${escapeHtml(s.description || 'Professional repair service with genuine parts.')}</p>
          <div class="service-footer">
            <span class="service-price">$${Number(s.price).toFixed(2)}</span>
            <div class="service-meta">
              <span class="service-duration">⏱ ${s.duration_minutes} min</span>
              <span class="service-stock ${s.in_stock ? 'stock-in' : 'stock-out'}">
                ${s.in_stock ? '✓ In Stock' : '✗ Unavailable'}
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

    // Populate service dropdown in booking form
    populateServiceDropdown(services);

  } catch (err) {
    console.error('Failed to load services:', err);
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-muted);">Failed to load services. Please try again.</div>`;
  }
}

function populateServiceDropdown(services) {
  const select = document.getElementById('service_id');
  if (!select) return;
  services.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `${s.name} – $${Number(s.price).toFixed(2)}`;
    select.appendChild(opt);
  });
}

// ─── Set min date for appointment ─────────────────────────
function setMinDate() {
  const input = document.getElementById('appointment_date');
  if (!input) return;
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  input.min = now.toISOString().slice(0, 16);
}

// ─── Form validation ──────────────────────────────────────
function validateForm(data) {
  const errors = [];
  if (!data.customer_name?.trim()) errors.push('Full name is required.');
  if (!data.customer_email?.trim()) errors.push('Email address is required.');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customer_email)) errors.push('Please enter a valid email address.');
  if (!data.customer_phone?.trim()) errors.push('Phone number is required.');
  if (!data.device_model?.trim()) errors.push('Device model is required.');
  if (!data.appointment_date) errors.push('Appointment date is required.');
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
    customer_name:    form.customer_name.value.trim(),
    customer_email:   form.customer_email.value.trim(),
    customer_phone:   form.customer_phone.value.trim(),
    device_model:     form.device_model.value.trim(),
    service_id:       form.service_id.value || null,
    appointment_date: form.appointment_date.value,
    notes:            form.notes.value.trim() || null,
  };

  const errors = validateForm(data);
  if (errors.length) {
    errors.forEach(msg => showToast('error', 'Validation Error', msg));
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

    if (!res.ok) throw new Error(result.error || 'Booking failed');

    showToast('success', 'Appointment Booked!', `We'll see you on ${formatDate(data.appointment_date)}. Confirmation sent to ${data.customer_email}.`);
    form.reset();

  } catch (err) {
    showToast('error', 'Booking Failed', err.message || 'Something went wrong. Please try again.');
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
  return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Init ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadServices();
  setMinDate();

  const form = document.getElementById('booking-form');
  if (form) form.addEventListener('submit', handleBooking);
});
