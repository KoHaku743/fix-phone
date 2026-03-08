const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getDb } = require('../database');
const { requireAuth, requireOwner } = require('../middleware/auth');
const { sendMessageNotification, sendStatusUpdateNotification } = require('../mailer');

// All admin routes require a valid token
router.use(requireAuth);

// Additionally block admin access when no ADMIN_PASSWORD is configured
router.use((req, res, next) => {
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(503).json({ error: 'Admin access is not configured on this server.' });
  }
  next();
});

// ── Helper: write an audit log entry ─────────────────────
function auditLog(username, action, entity_type, entity_id, details) {
  try {
    const { prepare } = getDb();
    prepare(`
      INSERT INTO audit_log (admin_username, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(username, action, entity_type || null, entity_id || null,
      details ? JSON.stringify(details) : null);
  } catch (_) {}
}

// GET /api/admin/appointments
router.get('/appointments', (req, res) => {
  try {
    const { prepare } = getDb();
    const appointments = prepare(`
      SELECT a.*, s.name as service_name, s.price_from, s.price_to, s.warranty_days
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      ORDER BY a.created_at DESC
    `).all();
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/appointments/:id  – update status, quoted_price, assigned_to, payment, etc.
router.put('/appointments/:id', async (req, res) => {
  try {
    const { prepare } = getDb();
    const { status, quoted_price, assigned_to, appointment_date, payment_status, payment_method } = req.body;
    const validStatuses = ['pending', 'confirmed', 'diagnostics', 'waiting_parts', 'completed', 'cancelled'];
    const validPaymentStatuses = ['unpaid', 'paid', 'refunded'];
    if (status !== undefined && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    if (payment_status !== undefined && !validPaymentStatuses.includes(payment_status)) {
      return res.status(400).json({ error: 'Invalid payment_status' });
    }

    const apptBefore = prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
    if (!apptBefore) return res.status(404).json({ error: 'Appointment not found' });

    if (status !== undefined) {
      prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, req.params.id);

      // Warranty: when completing, compute warranty_expiry
      if (status === 'completed' && apptBefore.service_id) {
        const svc = prepare('SELECT warranty_days FROM services WHERE id = ?').get(apptBefore.service_id);
        if (svc && svc.warranty_days > 0) {
          const expiry = new Date();
          expiry.setDate(expiry.getDate() + svc.warranty_days);
          prepare('UPDATE appointments SET warranty_expiry = ? WHERE id = ?')
            .run(expiry.toISOString().slice(0, 10), req.params.id);
        }
      }
      if (status !== apptBefore.status) {
        auditLog(req.adminUser.username, 'status_change', 'appointment', req.params.id,
          { from: apptBefore.status, to: status });
      }
    }
    if (quoted_price !== undefined) {
      const price = quoted_price === null ? null : parseFloat(quoted_price);
      prepare('UPDATE appointments SET quoted_price = ? WHERE id = ?').run(price, req.params.id);
    }
    if (assigned_to !== undefined) {
      let newAssignedTo = null;
      if (assigned_to !== null) {
        const currentUser = req.adminUser && req.adminUser.username;
        if (!currentUser || assigned_to !== currentUser) {
          return res.status(403).json({ error: 'You may only assign appointments to yourself or unassign them.' });
        }
        newAssignedTo = currentUser;
      }
      prepare('UPDATE appointments SET assigned_to = ? WHERE id = ?').run(newAssignedTo, req.params.id);
    }
    if (appointment_date !== undefined) {
      const date = appointment_date === null || appointment_date === '' ? null : appointment_date;
      prepare('UPDATE appointments SET appointment_date = ? WHERE id = ?').run(date, req.params.id);
    }
    if (payment_status !== undefined) {
      prepare('UPDATE appointments SET payment_status = ? WHERE id = ?').run(payment_status, req.params.id);
      if (payment_status !== apptBefore.payment_status) {
        auditLog(req.adminUser.username, 'payment_status_change', 'appointment', req.params.id,
          { from: apptBefore.payment_status, to: payment_status });
      }
    }
    if (payment_method !== undefined) {
      prepare('UPDATE appointments SET payment_method = ? WHERE id = ?').run(payment_method, req.params.id);
    }

    const appointment = prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);

    // Notify customer by email when status actually changed
    if (status !== undefined && status !== apptBefore.status && appointment.customer_email) {
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      const conversationUrl = appointment.conversation_token
        ? `${baseUrl}/conversation/${appointment.conversation_token}`
        : null;
      const newQuotedPrice = quoted_price !== undefined
        ? (quoted_price === null ? null : parseFloat(quoted_price))
        : appointment.quoted_price;
      sendStatusUpdateNotification({
        to: appointment.customer_email,
        customerName: appointment.customer_name,
        orderNumber: appointment.id,
        newStatus: status,
        quotedPrice: newQuotedPrice,
        conversationUrl,
        lang: appointment.customer_lang || 'sk',
      }).catch(err => console.warn('⚠️  Could not send status update email:', err.message));
    }

    // Emit socket.io event
    try { req.app.locals.io && req.app.locals.io.emit('appointment-updated', appointment); } catch (_) {}

    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/appointments/:id/invoice
router.get('/appointments/:id/invoice', (req, res) => {
  try {
    const { prepare } = getDb();
    const appt = prepare(`
      SELECT a.*, s.name as service_name, s.warranty_days
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.id = ?
    `).get(req.params.id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Invoice #${appt.id}</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; color: #333; }
  h1 { color: #1a1a2e; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  td, th { padding: 10px; border: 1px solid #ddd; text-align: left; }
  th { background: #f5f5f5; }
  .total { font-weight: bold; font-size: 1.2em; }
  @media print { button { display: none; } }
</style>
</head>
<body>
<h1>Invoice / Receipt</h1>
<p><strong>Order #:</strong> ${appt.id}</p>
<p><strong>Date:</strong> ${appt.created_at ? appt.created_at.slice(0, 10) : ''}</p>
<hr>
<table>
  <tr><th>Field</th><th>Value</th></tr>
  <tr><td>Customer Name</td><td>${escHtml(appt.customer_name)}</td></tr>
  <tr><td>Email</td><td>${escHtml(appt.customer_email)}</td></tr>
  <tr><td>Phone</td><td>${escHtml(appt.customer_phone)}</td></tr>
  <tr><td>Device</td><td>${escHtml(appt.device_model)}</td></tr>
  <tr><td>Service</td><td>${escHtml(appt.service_name || '')}</td></tr>
  <tr><td>Status</td><td>${escHtml(appt.status)}</td></tr>
  <tr><td>Payment Status</td><td>${escHtml(appt.payment_status || 'unpaid')}</td></tr>
  <tr><td>Payment Method</td><td>${escHtml(appt.payment_method || '')}</td></tr>
  <tr class="total"><td>Quoted Price</td><td>${appt.quoted_price != null ? '€' + Number(appt.quoted_price).toFixed(2) : 'TBD'}</td></tr>
  ${appt.warranty_expiry ? `<tr><td>Warranty Until</td><td>${escHtml(appt.warranty_expiry)}</td></tr>` : ''}
</table>
${appt.notes ? `<p><strong>Notes:</strong> ${escHtml(appt.notes)}</p>` : ''}
<br>
<button onclick="window.print()">Print / Save PDF</button>
</body>
</html>`;
    res.type('text/html').send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// GET /api/admin/conversations/:token
router.get('/conversations/:token', (req, res) => {
  try {
    const { prepare } = getDb();
    const appt = prepare(`
      SELECT a.*, s.name as service_name
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.conversation_token = ?
    `).get(req.params.token);
    if (!appt) return res.status(404).json({ error: 'Conversation not found' });

    const messages = prepare(`
      SELECT id, sender, content, created_at
      FROM messages WHERE appointment_id = ? ORDER BY created_at ASC
    `).all(appt.id);

    res.json({ appointment: appt, messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/appointments/:id/messages
router.get('/appointments/:id/messages', (req, res) => {
  try {
    const { prepare } = getDb();
    const messages = prepare(`
      SELECT * FROM messages WHERE appointment_id = ? ORDER BY created_at ASC
    `).all(req.params.id);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/appointments/:id/messages
router.post('/appointments/:id/messages', async (req, res) => {
  try {
    const { prepare } = getDb();
    const appt = prepare(`
      SELECT a.*, s.name as service_name FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.id = ?
    `).get(req.params.id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Message content is required' });
    if (content.length > 2000) return res.status(400).json({ error: 'Message too long (max 2000 characters)' });

    const result = prepare(`
      INSERT INTO messages (appointment_id, sender, content) VALUES (?, 'admin', ?)
    `).run(appt.id, content.trim());

    const msg = prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);

    if (appt.conversation_token && appt.customer_email) {
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      const conversationUrl = `${baseUrl}/conversation/${appt.conversation_token}`;
      sendMessageNotification({
        to: appt.customer_email,
        customerName: appt.customer_name,
        orderNumber: appt.id,
        adminMessage: content.trim(),
        conversationUrl,
        lang: appt.customer_lang || 'sk',
      }).catch(err => console.warn('⚠️  Could not send message notification:', err.message));
    }

    // Emit socket.io event
    try { req.app.locals.io && req.app.locals.io.emit('new-message', { appointment_id: appt.id, message: msg }); } catch (_) {}

    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Services ──────────────────────────────────────────────

// GET /api/admin/services
router.get('/services', (req, res) => {
  try {
    const { prepare } = getDb();
    const services = prepare(`
      SELECT s.*, rt.name as repair_type_name
      FROM services s
      LEFT JOIN repair_types rt ON s.repair_type_id = rt.id
      ORDER BY rt.name, s.name
    `).all();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/services
router.post('/services', (req, res) => {
  try {
    const { prepare } = getDb();
    const { repair_type_id, name, description, price_from, price_to, duration_minutes, in_stock, warranty_days } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing required fields' });
    const result = prepare(`
      INSERT INTO services (repair_type_id, name, description, price_from, price_to, duration_minutes, in_stock, warranty_days)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      repair_type_id || null, name, description || null,
      price_from != null ? parseFloat(price_from) : null,
      price_to != null ? parseFloat(price_to) : null,
      duration_minutes || 60,
      in_stock !== undefined ? in_stock : 1,
      warranty_days != null ? parseInt(warranty_days, 10) : 0
    );
    const service = prepare('SELECT * FROM services WHERE id = ?').get(result.lastInsertRowid);
    auditLog(req.adminUser.username, 'create', 'service', result.lastInsertRowid, { name });
    res.status(201).json(service);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/services/:id
router.put('/services/:id', (req, res) => {
  try {
    const { prepare } = getDb();
    const { repair_type_id, name, description, price_from, price_to, duration_minutes, in_stock, warranty_days } = req.body;
    prepare(`
      UPDATE services SET repair_type_id=?, name=?, description=?, price_from=?, price_to=?, duration_minutes=?, in_stock=?, warranty_days=? WHERE id=?
    `).run(
      repair_type_id || null, name, description || null,
      price_from != null ? parseFloat(price_from) : null,
      price_to != null ? parseFloat(price_to) : null,
      duration_minutes || 60, in_stock,
      warranty_days != null ? parseInt(warranty_days, 10) : 0,
      req.params.id
    );
    const service = prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    auditLog(req.adminUser.username, 'update', 'service', req.params.id, { name });
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/services/:id
router.delete('/services/:id', (req, res) => {
  try {
    const { prepare } = getDb();
    const result = prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Service not found' });
    auditLog(req.adminUser.username, 'delete', 'service', req.params.id, {});
    res.json({ message: 'Service deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/repair-types
router.get('/repair-types', (req, res) => {
  try {
    const { prepare } = getDb();
    const types = prepare('SELECT * FROM repair_types ORDER BY name').all();
    res.json(types);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/repair-types
router.post('/repair-types', (req, res) => {
  try {
    const { prepare } = getDb();
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = prepare('INSERT INTO repair_types (name, description) VALUES (?, ?)').run(name, description || null);
    const type = prepare('SELECT * FROM repair_types WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(type);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/repair-types/:id
router.put('/repair-types/:id', (req, res) => {
  try {
    const { prepare } = getDb();
    const { name, description } = req.body;
    prepare('UPDATE repair_types SET name=?, description=? WHERE id=?').run(name, description, req.params.id);
    const type = prepare('SELECT * FROM repair_types WHERE id = ?').get(req.params.id);
    if (!type) return res.status(404).json({ error: 'Repair type not found' });
    res.json(type);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/repair-types/:id
router.delete('/repair-types/:id', (req, res) => {
  try {
    const { prepare } = getDb();
    const result = prepare('DELETE FROM repair_types WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Repair type not found' });
    res.json({ message: 'Repair type deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Inventory ─────────────────────────────────────────────

// GET /api/admin/inventory
router.get('/inventory', (req, res) => {
  try {
    const { prepare } = getDb();
    const items = prepare('SELECT * FROM inventory ORDER BY model_name, part_name').all();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/inventory
router.post('/inventory', (req, res) => {
  try {
    const { prepare } = getDb();
    const { part_name, model_name, quantity, min_quantity, unit_price,
            supplier_name, supplier_contact, supplier_notes, cost_price } = req.body;
    if (!part_name || !model_name) return res.status(400).json({ error: 'part_name and model_name are required' });
    const result = prepare(`
      INSERT INTO inventory (part_name, model_name, quantity, min_quantity, unit_price,
                             supplier_name, supplier_contact, supplier_notes, cost_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      part_name, model_name,
      quantity != null ? parseInt(quantity, 10) : 0,
      min_quantity != null ? parseInt(min_quantity, 10) : 1,
      unit_price != null ? parseFloat(unit_price) : null,
      supplier_name || null, supplier_contact || null, supplier_notes || null,
      cost_price != null ? parseFloat(cost_price) : null
    );
    const item = prepare('SELECT * FROM inventory WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/inventory/:id
router.put('/inventory/:id', (req, res) => {
  try {
    const { prepare } = getDb();
    const { part_name, model_name, quantity, min_quantity, unit_price,
            supplier_name, supplier_contact, supplier_notes, cost_price } = req.body;
    if (!part_name || !model_name) return res.status(400).json({ error: 'part_name and model_name are required' });
    prepare(`
      UPDATE inventory SET part_name=?, model_name=?, quantity=?, min_quantity=?, unit_price=?,
        supplier_name=?, supplier_contact=?, supplier_notes=?, cost_price=? WHERE id=?
    `).run(
      part_name, model_name,
      quantity != null ? parseInt(quantity, 10) : 0,
      min_quantity != null ? parseInt(min_quantity, 10) : 1,
      unit_price != null ? parseFloat(unit_price) : null,
      supplier_name || null, supplier_contact || null, supplier_notes || null,
      cost_price != null ? parseFloat(cost_price) : null,
      req.params.id
    );
    const item = prepare('SELECT * FROM inventory WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Inventory item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/inventory/:id
router.delete('/inventory/:id', (req, res) => {
  try {
    const { prepare } = getDb();
    const result = prepare('DELETE FROM inventory WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Inventory item not found' });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Settings ──────────────────────────────────────────────

const ALLOWED_SETTINGS_KEYS = [
  'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from', 'smtp_secure',
];
const SMTP_PASS_MASK = '••••••••';

// GET /api/admin/settings
router.get('/settings', (req, res) => {
  try {
    const { prepare } = getDb();
    const rows = prepare(`SELECT key, value FROM settings`).all();
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    if (settings.smtp_pass) settings.smtp_pass = SMTP_PASS_MASK;
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/settings
router.put('/settings', (req, res) => {
  try {
    const { prepare } = getDb();
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      if (!ALLOWED_SETTINGS_KEYS.includes(key)) continue;
      if (key === 'smtp_pass' && value === SMTP_PASS_MASK) continue;
      prepare(`INSERT INTO settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(key, value);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/settings/test-smtp
router.post('/settings/test-smtp', async (req, res) => {
  try {
    const { getSmtpSettings, createTransport } = require('../mailer');
    const cfg = getSmtpSettings();
    if (!cfg) return res.status(400).json({ error: 'SMTP not configured' });
    const transport = createTransport(cfg);
    await transport.sendMail({
      from: cfg.smtp_from || cfg.smtp_user,
      to: cfg.smtp_user,
      subject: 'SSStylie Repair – SMTP test',
      text: 'SMTP nastavenia fungujú správne! ✅',
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Analytics ─────────────────────────────────────────────

// GET /api/admin/analytics/overview
router.get('/analytics/overview', (req, res) => {
  try {
    const { prepare } = getDb();

    const totals = prepare(`
      SELECT
        COUNT(*) as orders_total,
        COALESCE(SUM(CASE WHEN quoted_price IS NOT NULL THEN quoted_price ELSE 0 END), 0) as revenue_total,
        COUNT(CASE WHEN created_at >= date('now','-7 days') THEN 1 END) as orders_week,
        COUNT(CASE WHEN created_at >= date('now','-30 days') THEN 1 END) as orders_month,
        COALESCE(SUM(CASE WHEN created_at >= date('now','-7 days') AND quoted_price IS NOT NULL THEN quoted_price ELSE 0 END), 0) as revenue_week,
        COALESCE(SUM(CASE WHEN created_at >= date('now','-30 days') AND quoted_price IS NOT NULL THEN quoted_price ELSE 0 END), 0) as revenue_month
      FROM appointments WHERE status = 'completed'
    `).get();

    // avg_turnaround: for completed orders, difference in days * 24
    const turnaround = prepare(`
      SELECT AVG((julianday('now') - julianday(created_at)) * 24) as avg_hours
      FROM appointments WHERE status = 'completed'
    `).get();

    // return_rate: customers with more than 1 order / total unique customers
    const returnRate = prepare(`
      SELECT
        COUNT(DISTINCT customer_email) as total_customers,
        COUNT(DISTINCT CASE WHEN cnt > 1 THEN customer_email END) as returning_customers
      FROM (
        SELECT customer_email, COUNT(*) as cnt FROM appointments GROUP BY customer_email
      )
    `).get();

    const returnRatePct = returnRate.total_customers > 0
      ? (returnRate.returning_customers / returnRate.total_customers) * 100
      : 0;

    res.json({
      revenue_total: totals.revenue_total,
      revenue_week: totals.revenue_week,
      revenue_month: totals.revenue_month,
      orders_total: totals.orders_total,
      orders_week: totals.orders_week,
      orders_month: totals.orders_month,
      avg_turnaround_hours: turnaround.avg_hours || 0,
      return_rate_pct: returnRatePct,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/analytics/revenue-by-day?days=30
router.get('/analytics/revenue-by-day', (req, res) => {
  try {
    const { prepare } = getDb();
    const days = parseInt(req.query.days, 10) || 30;
    const rows = prepare(`
      SELECT date(created_at) as date,
             COALESCE(SUM(quoted_price), 0) as revenue,
             COUNT(*) as count
      FROM appointments
      WHERE status = 'completed'
        AND created_at >= date('now', ? || ' days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).all(`-${days}`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/analytics/service-popularity
router.get('/analytics/service-popularity', (req, res) => {
  try {
    const { prepare } = getDb();
    const rows = prepare(`
      SELECT s.name as service_name, COUNT(a.id) as count
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      GROUP BY a.service_id
      ORDER BY count DESC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/analytics/top-services
router.get('/analytics/top-services', (req, res) => {
  try {
    const { prepare } = getDb();
    const rows = prepare(`
      SELECT s.name as service_name,
             COUNT(a.id) as count,
             COALESCE(SUM(a.quoted_price), 0) as total_revenue
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      WHERE a.status = 'completed'
      GROUP BY a.service_id
      ORDER BY count DESC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Reviews ───────────────────────────────────────────────

// GET /api/admin/reviews
router.get('/reviews', (req, res) => {
  try {
    const { prepare } = getDb();
    const { status } = req.query;
    let rows;
    if (status) {
      rows = prepare('SELECT * FROM reviews WHERE status = ? ORDER BY created_at DESC').all(status);
    } else {
      rows = prepare('SELECT * FROM reviews ORDER BY created_at DESC').all();
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/reviews/:id
router.put('/reviews/:id', (req, res) => {
  try {
    const { prepare } = getDb();
    const { status } = req.body;
    const validStatuses = ['pending', 'approved', 'hidden'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    prepare('UPDATE reviews SET status = ? WHERE id = ?').run(status, req.params.id);
    const review = prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/reviews/:id
router.delete('/reviews/:id', (req, res) => {
  try {
    const { prepare } = getDb();
    const result = prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Review not found' });
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Time Slots ────────────────────────────────────────────

// GET /api/admin/slots
router.get('/slots', (req, res) => {
  try {
    const { prepare } = getDb();
    const slots = prepare('SELECT * FROM time_slots ORDER BY day_of_week, slot_time').all();
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/slots
router.put('/slots', (req, res) => {
  try {
    const { prepare } = getDb();
    const slots = req.body;
    if (!Array.isArray(slots)) return res.status(400).json({ error: 'Body must be an array of slots' });
    for (const slot of slots) {
      const { day_of_week, slot_time, capacity, is_active } = slot;
      prepare(`
        INSERT INTO time_slots (day_of_week, slot_time, capacity, is_active)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(day_of_week, slot_time) DO UPDATE SET
          capacity = excluded.capacity,
          is_active = excluded.is_active
      `).run(day_of_week, slot_time, capacity ?? 3, is_active ?? 1);
    }
    const updated = prepare('SELECT * FROM time_slots ORDER BY day_of_week, slot_time').all();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/calendar?date=YYYY-MM-DD
router.get('/calendar', (req, res) => {
  try {
    const { prepare } = getDb();
    const { date } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'date query parameter required (YYYY-MM-DD)' });
    }
    // Find the Monday of the week containing the given date
    const d = new Date(date);
    const day = d.getDay();
    const diffToMonday = (day === 0 ? -6 : 1 - day);
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const fmt = dt => dt.toISOString().slice(0, 10);
    const appointments = prepare(`
      SELECT a.*, s.name as service_name
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      WHERE date(a.appointment_date) BETWEEN ? AND ?
      ORDER BY a.appointment_date ASC
    `).all(fmt(monday), fmt(sunday));
    res.json({ week_start: fmt(monday), week_end: fmt(sunday), appointments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CRM ───────────────────────────────────────────────────

// GET /api/admin/crm/customers
router.get('/crm/customers', (req, res) => {
  try {
    const { prepare } = getDb();
    const customers = prepare(`
      SELECT
        a.customer_email as email,
        MAX(a.customer_name) as name,
        COUNT(a.id) as total_orders,
        COALESCE(SUM(a.quoted_price), 0) as total_spent,
        MIN(a.created_at) as first_visit,
        MAX(a.created_at) as last_visit,
        COALESCE(cn.loyalty_repairs, 0) as loyalty_repairs,
        cn.notes as notes
      FROM appointments a
      LEFT JOIN customer_notes cn ON cn.customer_email = a.customer_email
      GROUP BY a.customer_email
      ORDER BY last_visit DESC
    `).all();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/crm/customers/:email/history
router.get('/crm/customers/:email/history', (req, res) => {
  try {
    const { prepare } = getDb();
    const appointments = prepare(`
      SELECT a.*, s.name as service_name
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.customer_email = ?
      ORDER BY a.created_at DESC
    `).all(req.params.email);
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/crm/customers/:email/notes
router.get('/crm/customers/:email/notes', (req, res) => {
  try {
    const { prepare } = getDb();
    const row = prepare('SELECT notes, loyalty_repairs FROM customer_notes WHERE customer_email = ?').get(req.params.email);
    res.json(row || { notes: null, loyalty_repairs: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/crm/customers/:email/notes
router.put('/crm/customers/:email/notes', (req, res) => {
  try {
    const { prepare } = getDb();
    const { notes, loyalty_repairs } = req.body;
    prepare(`
      INSERT INTO customer_notes (customer_email, notes, loyalty_repairs, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(customer_email) DO UPDATE SET
        notes = excluded.notes,
        loyalty_repairs = excluded.loyalty_repairs,
        updated_at = CURRENT_TIMESTAMP
    `).run(req.params.email, notes || null, loyalty_repairs != null ? parseInt(loyalty_repairs, 10) : 0);
    const row = prepare('SELECT notes, loyalty_repairs FROM customer_notes WHERE customer_email = ?').get(req.params.email);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Staff Accounts (owner only) ───────────────────────────

// GET /api/admin/staff-accounts
router.get('/staff-accounts', requireOwner, (req, res) => {
  try {
    const { prepare } = getDb();
    const accounts = prepare(`
      SELECT id, username, display_name, role, is_active, created_at
      FROM staff_accounts ORDER BY created_at ASC
    `).all();
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/staff-accounts
router.post('/staff-accounts', requireOwner, (req, res) => {
  try {
    const { prepare } = getDb();
    const { username, display_name, password, role } = req.body;
    if (!username || !display_name || !password) {
      return res.status(400).json({ error: 'username, display_name and password are required' });
    }
    const validRoles = ['owner', 'staff'];
    if (role && !validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const password_hash = crypto.createHash('sha256').update(password).digest('hex');
    const result = prepare(`
      INSERT INTO staff_accounts (username, display_name, password_hash, role)
      VALUES (?, ?, ?, ?)
    `).run(username, display_name, password_hash, role || 'staff');
    const account = prepare(`
      SELECT id, username, display_name, role, is_active, created_at FROM staff_accounts WHERE id = ?
    `).get(result.lastInsertRowid);
    auditLog(req.adminUser.username, 'create', 'staff_account', result.lastInsertRowid, { username, role });
    res.status(201).json(account);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/staff-accounts/:id
router.put('/staff-accounts/:id', requireOwner, (req, res) => {
  try {
    const { prepare } = getDb();
    const { display_name, password, role, is_active } = req.body;
    const existing = prepare('SELECT * FROM staff_accounts WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Staff account not found' });

    const validRoles = ['owner', 'staff'];
    if (role && !validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const newHash = password
      ? crypto.createHash('sha256').update(password).digest('hex')
      : existing.password_hash;
    prepare(`
      UPDATE staff_accounts SET display_name=?, password_hash=?, role=?, is_active=? WHERE id=?
    `).run(
      display_name || existing.display_name,
      newHash,
      role || existing.role,
      is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
      req.params.id
    );
    const account = prepare(`
      SELECT id, username, display_name, role, is_active, created_at FROM staff_accounts WHERE id = ?
    `).get(req.params.id);
    auditLog(req.adminUser.username, 'update', 'staff_account', req.params.id, { display_name, role });
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/staff-accounts/:id
router.delete('/staff-accounts/:id', requireOwner, (req, res) => {
  try {
    const { prepare } = getDb();
    const result = prepare('DELETE FROM staff_accounts WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Staff account not found' });
    auditLog(req.adminUser.username, 'delete', 'staff_account', req.params.id, {});
    res.json({ message: 'Staff account deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Audit Log ─────────────────────────────────────────────

// GET /api/admin/audit-log?limit=100
router.get('/audit-log', (req, res) => {
  try {
    const { prepare } = getDb();
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const rows = prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?').all(limit);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
