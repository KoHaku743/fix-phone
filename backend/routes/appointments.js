const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getDb } = require('../database');
const { sendBookingConfirmation } = require('../mailer');

// POST /api/appointments
router.post('/', async (req, res) => {
  try {
    const { prepare } = getDb();
    const { customer_name, customer_email, customer_phone, device_model, service_id, notes, customer_lang } = req.body;

    if (!customer_name || !customer_email || !customer_phone || !device_model || !service_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const lang = customer_lang === 'en' ? 'en' : 'sk';

    // Generate a secure unique token for customer conversation access
    const conversation_token = crypto.randomBytes(24).toString('hex');

    const result = prepare(`
      INSERT INTO appointments (customer_name, customer_email, customer_phone, device_model, service_id, notes, status, conversation_token, customer_lang)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(customer_name.trim(), customer_email.trim(), customer_phone.trim(), device_model.trim(), service_id, notes?.trim() || null, conversation_token, lang);

    const appointment = prepare(`
      SELECT a.*, s.name as service_name FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.id = ?
    `).get(result.lastInsertRowid);

    // Send confirmation email (non-blocking)
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const conversationUrl = `${baseUrl}/conversation/${conversation_token}`;
    sendBookingConfirmation({
      to: customer_email.trim(),
      customerName: customer_name.trim(),
      deviceModel: device_model.trim(),
      serviceName: appointment.service_name,
      orderNumber: appointment.id,
      conversationUrl,
      lang,
    }).catch(err => console.warn('⚠️  Could not send confirmation email:', err.message));

    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
