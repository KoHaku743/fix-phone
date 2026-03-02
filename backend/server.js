const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { initDb } = require('./database');

const app  = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

// When ADMIN_PORT is set (and differs from PORT), admin routes are served on a
// separate Express server so the admin panel is only reachable on that port.
const ADMIN_PORT = parseInt(process.env.ADMIN_PORT, 10) || null;
const useAdminServer = ADMIN_PORT && ADMIN_PORT !== PORT;

// ─── Shared middleware factory ────────────────────────────
function applyCommonMiddleware(expressApp) {
  // Trust the first proxy (e.g. Docker/nginx) so express-rate-limit can
  // correctly identify clients via the X-Forwarded-For header.
  expressApp.set('trust proxy', 1);

  // Security headers
  expressApp.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
    next();
  });

  expressApp.use(cors());
  expressApp.use(express.json());
}

applyCommonMiddleware(app);

// Rate limiting for all routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for appointment creation
const appointmentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { error: 'Too many appointment requests, please try again later.' },
});

// Stricter limiter for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many login attempts, please try again later.' },
});

app.use(limiter);

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// ─── Public API routes (always on main server) ────────────
app.use('/api/services',      require('./routes/services'));
app.use('/api/appointments',  appointmentLimiter, require('./routes/appointments'));
app.use('/api/track',         require('./routes/track'));
app.use('/api/conversations', require('./routes/messages'));

// ─── Admin API + HTML routes ──────────────────────────────
// When ADMIN_PORT is configured these are mounted on the separate admin server
// only; when it is not configured they are served here for backward compatibility.
function mountAdminRoutes(expressApp) {
  expressApp.use('/api/auth',         authLimiter, require('./routes/auth'));
  expressApp.use('/api/admin',        require('./routes/admin'));
  expressApp.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin.html'));
  });
}

if (!useAdminServer) {
  mountAdminRoutes(app);
  // Admin-enhanced conversation view on single-server setup
  app.get('/admin/conversation/:token', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin-conversation.html'));
  });
}

// ─── Public frontend routes ───────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/conversation/:token', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/conversation.html'));
});

app.get('/track', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/track.html'));
});

// 404 – serve custom page for HTML requests, JSON for API
app.use((req, res) => {
  if (req.accepts('html')) {
    res.status(404).sendFile(path.join(__dirname, '../frontend/404.html'));
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// ─── Optional separate admin server ───────────────────────
let adminApp = null;
if (useAdminServer) {
  adminApp = express();
  applyCommonMiddleware(adminApp);
  adminApp.use(limiter);
  adminApp.use(express.static(path.join(__dirname, '../frontend')));
  mountAdminRoutes(adminApp);
  adminApp.get('/conversation/:token', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin-conversation.html'));
  });
  adminApp.use((req, res) => {
    if (req.accepts('html')) {
      res.status(404).sendFile(path.join(__dirname, '../frontend/404.html'));
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });
}

// ─── Initialize DB then start ─────────────────────────────
initDb().then(() => {
  if (!process.env.ADMIN_PASSWORD) {
    console.warn('⚠️  WARNING: ADMIN_PASSWORD environment variable is not set. The admin panel is disabled until it is configured.');
  }
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️  WARNING: JWT_SECRET environment variable is not set. Using an insecure default – set it before deploying to production.');
  }
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fix-Phone server running on http://localhost:${PORT}`);
  });
  if (adminApp) {
    adminApp.listen(ADMIN_PORT, '0.0.0.0', () => {
      console.log(`Fix-Phone admin panel running on http://localhost:${ADMIN_PORT}`);
    });
  }
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

module.exports = app;
