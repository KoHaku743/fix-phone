const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { requireAuth } = require('../middleware/auth');

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
      SELECT a.*, s.name as service_name, s.price as service_price
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      ORDER BY a.created_at DESC
    `).all();
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/appointments/:id
router.put('/appointments/:id', (req, res) => {
  try {
    const { prepare } = getDb();
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, req.params.id);
    const appointment = prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appointment);
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
    const { repair_type_id, name, description, price, duration_minutes, in_stock } = req.body;
    if (!name || price === undefined) return res.status(400).json({ error: 'Missing required fields' });
    const result = prepare(`
      INSERT INTO services (repair_type_id, name, description, price, duration_minutes, in_stock)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(repair_type_id || null, name, description || null, price, duration_minutes || 60, in_stock !== undefined ? in_stock : 1);
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
    const { repair_type_id, name, description, price, duration_minutes, in_stock } = req.body;
    prepare(`
      UPDATE services SET repair_type_id=?, name=?, description=?, price=?, duration_minutes=?, in_stock=? WHERE id=?
    `).run(repair_type_id, name, description, price, duration_minutes, in_stock, req.params.id);
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

module.exports = router;
