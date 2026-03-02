const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { requireAuth } = require('../middleware/auth');
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

// GET /api/admin/appointments
router.get('/appointments', (req, res) => {
  try {
    const { prepare } = getDb();
    const appointments = prepare(`
      SELECT a.*, s.name as service_name, s.price_from, s.price_to
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      ORDER BY a.created_at DESC
    `).all();
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/appointments/:id  – update status and/or quoted_price and/or assigned_to
router.put('/appointments/:id', async (req, res) => {
  try {
    const { prepare } = getDb();
    const { status, quoted_price, assigned_to, appointment_date } = req.body;
    const validStatuses = ['pending', 'confirmed', 'diagnostics', 'waiting_parts', 'completed', 'cancelled'];
    if (status !== undefined && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Fetch appointment before updating so we have old status + customer info
    const apptBefore = prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
    if (!apptBefore) return res.status(404).json({ error: 'Appointment not found' });

    if (status !== undefined) {
      prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, req.params.id);
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

    const appointment = prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);

    // Notify customer by email when status actually changed and email is available
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

    res.json(appointment);
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

// POST /api/admin/appointments/:id/messages  – admin sends message → notify customer via email
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

    // Send email notification to customer (non-blocking)
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

    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
    const { repair_type_id, name, description, price_from, price_to, duration_minutes, in_stock } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing required fields' });
    const result = prepare(`
      INSERT INTO services (repair_type_id, name, description, price_from, price_to, duration_minutes, in_stock)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      repair_type_id || null, name, description || null,
      price_from != null ? parseFloat(price_from) : null,
      price_to != null ? parseFloat(price_to) : null,
      duration_minutes || 60,
      in_stock !== undefined ? in_stock : 1
    );
    const service = prepare('SELECT * FROM services WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(service);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/services/:id
router.put('/services/:id', (req, res) => {
  try {
    const { prepare } = getDb();
    const { repair_type_id, name, description, price_from, price_to, duration_minutes, in_stock } = req.body;
    prepare(`
      UPDATE services SET repair_type_id=?, name=?, description=?, price_from=?, price_to=?, duration_minutes=?, in_stock=? WHERE id=?
    `).run(
      repair_type_id || null, name, description || null,
      price_from != null ? parseFloat(price_from) : null,
      price_to != null ? parseFloat(price_to) : null,
      duration_minutes || 60, in_stock, req.params.id
    );
    const service = prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
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
    const { part_name, model_name, quantity, min_quantity, unit_price } = req.body;
    if (!part_name || !model_name) return res.status(400).json({ error: 'part_name and model_name are required' });
    const result = prepare(`
      INSERT INTO inventory (part_name, model_name, quantity, min_quantity, unit_price)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      part_name, model_name,
      quantity != null ? parseInt(quantity, 10) : 0,
      min_quantity != null ? parseInt(min_quantity, 10) : 1,
      unit_price != null ? parseFloat(unit_price) : null
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
    const { part_name, model_name, quantity, min_quantity, unit_price } = req.body;
    if (!part_name || !model_name) return res.status(400).json({ error: 'part_name and model_name are required' });
    prepare(`
      UPDATE inventory SET part_name=?, model_name=?, quantity=?, min_quantity=?, unit_price=? WHERE id=?
    `).run(
      part_name, model_name,
      quantity != null ? parseInt(quantity, 10) : 0,
      min_quantity != null ? parseInt(min_quantity, 10) : 1,
      unit_price != null ? parseFloat(unit_price) : null,
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

// ── Settings (SMTP, etc.) ──────────────────────────────────────

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
    // Mask SMTP password in response
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
      // Don't overwrite password if client sends the masked placeholder
      if (key === 'smtp_pass' && value === SMTP_PASS_MASK) continue;
      prepare(`INSERT INTO settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(key, value);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/settings/test-smtp  – send a test email
router.post('/settings/test-smtp', async (req, res) => {
  try {
    const { getSmtpSettings, createTransport } = require('../mailer');
    const cfg = getSmtpSettings();
    if (!cfg) return res.status(400).json({ error: 'SMTP not configured' });

    const transport = createTransport(cfg);
    await transport.sendMail({
      from: cfg.smtp_from || cfg.smtp_user,
      to: cfg.smtp_user,
      subject: 'SSStylish Repair – SMTP test',
      text: 'SMTP nastavenia fungujú správne! ✅',
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
