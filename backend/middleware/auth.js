/* ============================================================
   middleware/auth.js – Admin token creation & verification
   Uses only built-in Node.js crypto – no extra dependencies.
   ============================================================ */

const crypto = require('crypto');

const TOKEN_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) {
    // No secret configured – generate a per-process ephemeral secret so tokens
    // are still signed, but they won't survive a restart (intentional degraded mode).
    if (!getSecret._ephemeral) {
      getSecret._ephemeral = require('crypto').randomBytes(32).toString('hex');
    }
    return getSecret._ephemeral;
  }
  return s;
}

/** Create a signed token valid for 48 hours, carrying the staff username. */
function createToken(username = 'owner') {
  const exp     = Date.now() + TOKEN_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ exp, username })).toString('base64url');
  const sig     = crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

/**
 * Verify a token.
 * Returns { valid: true, username } when the token is valid and not expired.
 * Returns false otherwise.
 */
function verifyToken(token) {
  if (typeof token !== 'string') return false;
  const dot = token.lastIndexOf('.');
  if (dot < 1) return false;

  const payload = token.slice(0, dot);
  const sig     = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');

  try {
    // Constant-time comparison to prevent timing attacks
    if (sig.length !== expected.length) return false;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
    const { exp, username } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof exp !== 'number' || Date.now() >= exp) return false;
    return { valid: true, username: username || 'owner' };
  } catch {
    return false;
  }
}

/** Express middleware – rejects requests without a valid Bearer token. */
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const result = verifyToken(token);
  if (!result) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.adminUser = { username: result.username };
  next();
}

module.exports = { createToken, verifyToken, requireAuth };
