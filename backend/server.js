const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { initDb } = require('./database');

const app  = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

// Trust the first proxy (e.g. Docker/nginx) so express-rate-limit can
// correctly identify clients via the X-Forwarded-For header.
app.set('trust proxy', 1);

// ─── Security headers ─────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  next();
});

app.use(cors());
app.use(express.json());

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

// API Routes
app.use('/api/auth',         authLimiter, require('./routes/auth'));
app.use('/api/services',     require('./routes/services'));
app.use('/api/appointments', appointmentLimiter, require('./routes/appointments'));
app.use('/api/admin',        require('./routes/admin'));
app.use('/api/conversations', require('./routes/messages'));
app.use('/api/track',        require('./routes/track'));

// Frontend routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin.html'));
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

// Initialize DB then start
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
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

module.exports = app;
