const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// POST /api/reviews – submit a review by conversation token
router.post('/', (req, res) => {
  try {
    const { prepare } = getDb();
    const { conversation_token, rating, review_text } = req.body;
    if (!conversation_token || rating == null) {
      return res.status(400).json({ error: 'conversation_token and rating are required' });
    }
    const r = parseInt(rating, 10);
    if (isNaN(r) || r < 1 || r > 5) {
      return res.status(400).json({ error: 'rating must be between 1 and 5' });
    }

    const appt = prepare('SELECT * FROM appointments WHERE conversation_token = ?').get(conversation_token);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    if (appt.status !== 'completed') {
      return res.status(400).json({ error: 'Reviews can only be submitted for completed appointments' });
    }

    const existing = prepare('SELECT id FROM reviews WHERE appointment_id = ?').get(appt.id);
    if (existing) return res.status(409).json({ error: 'A review already exists for this appointment' });

    const result = prepare(`
      INSERT INTO reviews (appointment_id, conversation_token, rating, review_text, customer_name, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(appt.id, conversation_token, r, review_text || null, appt.customer_name || null);

    const review = prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reviews/public – returns approved reviews
router.get('/public', (req, res) => {
  try {
    const { prepare } = getDb();
    const reviews = prepare(`
      SELECT id, rating, review_text, customer_name, created_at
      FROM reviews WHERE status = 'approved' ORDER BY created_at DESC
    `).all();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
