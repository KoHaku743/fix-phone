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
  // Also include DB-based staff accounts
  try {
    const { getDb } = require('../database');
    const { prepare } = getDb();
    const dbStaff = prepare('SELECT username, display_name FROM staff_accounts WHERE is_active = 1').all();
    for (const s of dbStaff) {
      // Skip if already included via env vars
      if (!users.find(u => u.username === s.username)) {
        users.push({ username: s.username, displayName: s.display_name });
      }
    }
  } catch (_) {}
  res.json({ users });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username = 'owner', password } = req.body;

  // First check env-var based auth (backward compat)
  const passwordMap = {
    owner: process.env.ADMIN_PASSWORD,
    staff: process.env.STAFF_PASSWORD,
  };

  const expectedPassword = passwordMap[username];

  if (expectedPassword) {
    const given    = Buffer.from(typeof password === 'string' ? password : '');
    const expected = Buffer.from(expectedPassword);
    const valid = given.length === expected.length &&
      crypto.timingSafeEqual(given, expected);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    const role = username === 'owner' ? 'owner' : 'staff';
    return res.json({ token: createToken(username), username, role });
  }

  // If no env-var match, check staff_accounts table
  try {
    const { getDb } = require('../database');
    const { prepare } = getDb();
    const account = prepare('SELECT * FROM staff_accounts WHERE username = ? AND is_active = 1').get(username);
    if (account) {
      const givenHash = crypto.createHash('sha256')
        .update(typeof password === 'string' ? password : '')
        .digest('hex');
      if (givenHash === account.password_hash) {
        return res.json({ token: createToken(username), username, role: account.role || 'staff' });
      }
      return res.status(401).json({ error: 'Invalid password' });
    }
  } catch (_) {}

  if (!process.env.ADMIN_PASSWORD) {
    return res.status(503).json({ error: 'Admin password not configured on server. Set the ADMIN_PASSWORD environment variable.' });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

module.exports = router;
