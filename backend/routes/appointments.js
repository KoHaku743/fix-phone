const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getDb } = require('../database');
const { sendBookingConfirmation } = require('../mailer');

// POST /api/appointments
router.post('/', async (req, res) => {
  try {
    const { prepare } = getDb();
    const { customer_name, customer_email, customer_phone, device_model, service_id, notes } = req.body;

    if (!customer_name || !customer_email || !customer_phone || !device_model) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate a secure unique token for customer conversation access
    const conversation_token = crypto.randomBytes(24).toString('hex');

    const result = prepare(`
      INSERT INTO appointments (customer_name, customer_email, customer_phone, device_model, service_id, notes, status, conversation_token)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(customer_name, customer_email, customer_phone, device_model, service_id || null, notes || null, conversation_token);

    const appointment = prepare(`
      SELECT a.*, s.name as service_name FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.id = ?
    `).get(result.lastInsertRowid);

    // Send confirmation email (non-blocking – errors are logged, not returned)
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const conversationUrl = `${baseUrl}/conversation/${conversation_token}`;
    sendBookingConfirmation({
      to: customer_email,
      customerName: customer_name,
      deviceModel: device_model,
      serviceName: appointment.service_name,
      orderNumber: appointment.id,
      conversationUrl,
    }).catch(err => console.warn('⚠️  Could not send confirmation email:', err.message));

    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
