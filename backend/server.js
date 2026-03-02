const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { initDb } = require('./database');

const app = express();
const PORT = 3000;

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

app.use(limiter);

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/services', require('./routes/services'));
app.use('/api/appointments', appointmentLimiter, require('./routes/appointments'));
app.use('/api/admin', require('./routes/admin'));

// Frontend routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

// Initialize DB then start
initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fix-Phone server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

module.exports = app;
