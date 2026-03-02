const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// GET /api/services
router.get('/', (req, res) => {
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

// GET /api/services/:id
router.get('/:id', (req, res) => {
  try {
    const { prepare } = getDb();
    const service = prepare(`
      SELECT s.*, rt.name as repair_type_name
      FROM services s
      LEFT JOIN repair_types rt ON s.repair_type_id = rt.id
      WHERE s.id = ?
    `).get(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
