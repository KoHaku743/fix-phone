/* ============================================================
   routes/messages.js – Public customer conversation endpoint.
   Access is gated by the per-appointment conversation_token.
   ============================================================ */

const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// GET /api/conversations/:token  – fetch appointment + messages
router.get('/:token', (req, res) => {
  try {
    const { prepare } = getDb();
    const appt = prepare(`
      SELECT a.id, a.customer_name, a.customer_email, a.device_model, a.status, a.quoted_price,
             a.notes, a.created_at, a.customer_lang, s.name as service_name
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

// POST /api/conversations/:token/messages  – customer sends a message
router.post('/:token/messages', (req, res) => {
  try {
    const { prepare } = getDb();
    const appt = prepare(`SELECT id FROM appointments WHERE conversation_token = ?`).get(req.params.token);
    if (!appt) return res.status(404).json({ error: 'Conversation not found' });

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    if (content.length > 2000) {
      return res.status(400).json({ error: 'Message too long (max 2000 characters)' });
    }

    const result = prepare(`
      INSERT INTO messages (appointment_id, sender, content) VALUES (?, 'customer', ?)
    `).run(appt.id, content.trim());

    const msg = prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
