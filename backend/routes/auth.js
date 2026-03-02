const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const { createToken } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    // Admin password not configured – deny access
    return res.status(503).json({ error: 'Admin password not configured on server. Set the ADMIN_PASSWORD environment variable.' });
  }

  // Constant-time comparison to prevent timing attacks
  const given    = Buffer.from(typeof password === 'string' ? password : '');
  const expected = Buffer.from(adminPassword);
  const valid = given.length === expected.length &&
    crypto.timingSafeEqual(given, expected);

  if (!valid) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  res.json({ token: createToken() });
});

module.exports = router;
