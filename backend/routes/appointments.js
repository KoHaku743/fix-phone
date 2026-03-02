const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// POST /api/appointments
router.post('/', (req, res) => {
  try {
    const { prepare } = getDb();
    const { customer_name, customer_email, customer_phone, device_model, service_id, appointment_date, notes } = req.body;

    if (!customer_name || !customer_email || !customer_phone || !device_model || !appointment_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = prepare(`
      INSERT INTO appointments (customer_name, customer_email, customer_phone, device_model, service_id, appointment_date, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(customer_name, customer_email, customer_phone, device_model, service_id || null, appointment_date, notes || null);

    const appointment = prepare('SELECT * FROM appointments WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
