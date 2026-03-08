const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getDb } = require('../database');
const { sendBookingConfirmation } = require('../mailer');
const ioc = require('../ioc');

// POST /api/appointments
router.post('/', async (req, res) => {
  try {
    const { prepare } = getDb();
    const { customer_name, customer_email, customer_phone, device_model, service_id, notes, customer_lang, customer_city } = req.body;

    if (!customer_name || !customer_email || !customer_phone || !device_model || !service_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (!/^\+?[\d\s\-()\u202F]{7,20}$/.test(customer_phone.trim())) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const lang = customer_lang === 'en' ? 'en' : 'sk';

    // Generate a secure unique token for customer conversation access
    const conversation_token = crypto.randomBytes(24).toString('hex');

    const result = prepare(`
      INSERT INTO appointments (customer_name, customer_email, customer_phone, device_model, service_id, notes, status, conversation_token, customer_lang, customer_city)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `).run(customer_name.trim(), customer_email.trim(), customer_phone.trim(), device_model.trim(), service_id, notes?.trim() || null, conversation_token, lang, customer_city?.trim() || null);

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
      customerCity: customer_city?.trim() || null,
    }).catch(err => console.warn('⚠️  Could not send confirmation email:', err.message));

    // Emit socket.io event to all connected servers
    ioc.emit('new-appointment', appointment);

    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/appointments/available-slots?date=YYYY-MM-DD
router.get('/available-slots', (req, res) => {
  try {
    const { prepare } = getDb();
    const { date } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'date query parameter required (YYYY-MM-DD)' });
    }
    const dayOfWeek = new Date(date).getDay();
    const slots = prepare(`
      SELECT ts.id, ts.slot_time, ts.capacity,
             COALESCE(b.booked, 0) as booked
      FROM time_slots ts
      LEFT JOIN (
        SELECT slot_time, COUNT(*) as booked
        FROM slot_bookings WHERE slot_date = ?
        GROUP BY slot_time
      ) b ON ts.slot_time = b.slot_time
      WHERE ts.day_of_week = ? AND ts.is_active = 1
      ORDER BY ts.slot_time
    `).all(date, dayOfWeek);

    const available = slots
      .filter(s => s.booked < s.capacity)
      .map(s => ({
        slot_time: s.slot_time,
        capacity: s.capacity,
        available: s.capacity - s.booked,
      }));
    res.json(available);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
