const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const restaurantRoutes = require('./routes/restaurants');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const { requestLogger } = require('./middleware/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────
// CORS configuration. In development we restrict to the local dev server;
// in production we simply reflect whatever origin is making the request
// (same‑origin or a custom domain). Avoid hard‑coding the Netlify URL here.
const corsOptions = {
  credentials: true,
};

if (process.env.NODE_ENV === 'production') {
  // allow requests from whatever origin the browser sends; makes the
  // service usable at any domain without updating env vars
  corsOptions.origin = true;
} else {
  corsOptions.origin = process.env.FRONTEND_URL || 'http://localhost:5173';
}

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment-methods', paymentRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Serve static frontend ─────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  // `public` is the folder where the client build is output by Vite
  app.use(express.static(path.join(__dirname, '../public')));

  // for any non-API route, return the React app
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
}

// ─── 404 Handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ─── Error Handler ─────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  const isDev = process.env.NODE_ENV !== 'production';
  console.error('[ERROR]', err.message);
  console.error('[STACK]', err.stack);
  
  const errorResponse = {
    success: false,
    message: isDev ? err.message : 'Internal server error.',
  };
  
  if (isDev) {
    errorResponse.stack = err.stack;
    errorResponse.details = err.toString();
  }
  
  res.status(500).json(errorResponse);
});

// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Food Ordering API running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
