/* ============================================================
   routes/track.js – Public repair status tracker endpoint.
   Requires order ID + customer e-mail for basic privacy.
   ============================================================ */

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

const STATUS_STEPS = ['pending', 'confirmed', 'diagnostics', 'waiting_parts', 'completed'];

// GET /api/track/:id?email=...
router.get('/:id', (req, res) => {
  try {
    const { prepare } = getDb();
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const appt = prepare(`
      SELECT a.id, a.customer_name, a.device_model, a.status, a.created_at,
             a.quoted_price, a.conversation_token, a.warranty_expiry,
             s.name as service_name
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.id = ? AND LOWER(a.customer_email) = LOWER(?)
    `).get(req.params.id, email.trim());

    if (!appt) return res.status(404).json({ error: 'Order not found. Please check your order number and email.' });

    // Check if a review already exists for this appointment
    let has_review = false;
    try {
      const existing = prepare('SELECT id FROM reviews WHERE appointment_id = ?').get(appt.id);
      has_review = !!existing;
    } catch (_) {}

    const stepIndex = STATUS_STEPS.indexOf(appt.status);
    res.json({
      id: appt.id,
      customer_name: appt.customer_name,
      device_model: appt.device_model,
      service_name: appt.service_name,
      status: appt.status,
      quoted_price: appt.quoted_price,
      warranty_expiry: appt.warranty_expiry || null,
      conversation_token: appt.conversation_token || null,
      has_review,
      created_at: appt.created_at,
      progress_steps: STATUS_STEPS,
      current_step_index: stepIndex === -1 ? (appt.status === 'cancelled' ? -2 : 0) : stepIndex,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
