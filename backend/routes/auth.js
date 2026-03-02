const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const { createToken } = require('../middleware/auth');

// GET /api/auth/users – return which user accounts are configured (no passwords exposed)
router.get('/users', (req, res) => {
  const users = [];
  if (process.env.ADMIN_PASSWORD) {
    users.push({ username: 'owner', displayName: process.env.OWNER_NAME || 'Owner' });
  }
  if (process.env.STAFF_PASSWORD) {
    users.push({ username: 'staff', displayName: process.env.STAFF_NAME || 'Staff' });
  }
  res.json({ users });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username = 'owner', password } = req.body;

  // Map username to the appropriate password env var
  const passwordMap = {
    owner: process.env.ADMIN_PASSWORD,
    staff: process.env.STAFF_PASSWORD,
  };

  const expectedPassword = passwordMap[username];

  if (!expectedPassword) {
    if (!process.env.ADMIN_PASSWORD) {
      return res.status(503).json({ error: 'Admin password not configured on server. Set the ADMIN_PASSWORD environment variable.' });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Constant-time comparison to prevent timing attacks
  const given    = Buffer.from(typeof password === 'string' ? password : '');
  const expected = Buffer.from(expectedPassword);
  const valid = given.length === expected.length &&
    crypto.timingSafeEqual(given, expected);

  if (!valid) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  res.json({ token: createToken(username), username });
});

module.exports = router;
