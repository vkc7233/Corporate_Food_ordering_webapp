const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const restaurantRoutes = require('./routes/restaurants');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const { requestLogger } = require('./middleware/logger');
const pool = require('./config/database');

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

// DB health check (development only - shows more details)
app.get('/api/health/db', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    return res.json({
      success: true,
      db: {
        now: result.rows[0],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const isDev = process.env.NODE_ENV !== 'production';
    console.error('[DB HEALTH] error:', err);
    return res.status(503).json({
      success: false,
      message: 'Database unavailable',
      ...(isDev && { error: err.message }),
    });
  }
});

// Dev helper: list registered routes (development only)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/routes', (_req, res) => {
    try {
      const routes = [];
      app._router.stack.forEach((middleware) => {
        if (middleware.route) {
          // routes registered directly on the app
          const methods = Object.keys(middleware.route.methods).join(',').toUpperCase();
          routes.push({ path: middleware.route.path, methods });
        } else if (middleware.name === 'router' && middleware.handle && middleware.handle.stack) {
          // router middleware
          middleware.handle.stack.forEach((handler) => {
            if (handler.route) {
              const methods = Object.keys(handler.route.methods).join(',').toUpperCase();
              routes.push({ path: handler.route.path, methods });
            }
          });
        }
      });

      // also print to server console for quick inspection
      console.log('[DEV] Registered routes:', routes.map(r => `${r.methods} ${r.path}`).join(' | '));

      return res.json({ success: true, routes });
    } catch (err) {
      console.error('[DEV] Error listing routes:', err);
      return res.status(500).json({ success: false, message: 'Could not list routes' });
    }
  });
}

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
