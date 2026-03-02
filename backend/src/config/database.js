const { Pool } = require('pg');
require('dotenv').config();

// Validate JWT Secret on startup
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'secret') {
  console.warn('⚠️  WARNING: JWT_SECRET is using default value. Please set a strong secret in .env');
}

// Build connection config: prefer DATABASE_URL if present, otherwise use individual params
let poolConfig;

if (process.env.DATABASE_URL) {
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : false,
  };
  console.log('[DB] 🔗 Connecting via DATABASE_URL');
} else {
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'food_ordering',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: false,
  };
  console.log(`[DB] 🔗 Connecting via individual params: ${poolConfig.user}@${poolConfig.host}:${poolConfig.port}/${poolConfig.database}`);
}

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  console.log('[DB] ✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('[DB] ❌ Unexpected database error:', err.message);
  process.exit(1);
});

// Test connection on startup with improved error messaging and retry
const testConnectionWithRetry = async (attempts = 5, delayMs = 2000) => {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await pool.query('SELECT NOW()');
      console.log('[DB] ✅ Initial connection test passed');
      return;
    } catch (err) {
      console.error(`[DB] Attempt ${attempt} failed: ${err.code || 'N/A'} ${err.message || ''}`);
      if (attempt === attempts) {
        console.error('[DB] 🚨 FATAL: Cannot connect to database on startup');
        console.error('[DB] Error Details:');
        console.error('[DB]   Message:', err.message || '(no message)');
        console.error('[DB]   Code:', err.code || '(no code)');
        if (err.address) console.error('[DB]   Host:', err.address);
        if (err.port) console.error('[DB]   Port:', err.port);
        console.error('\n[DB] Troubleshooting:');
        console.error('  1. Ensure PostgreSQL is running');
        console.error('  2. Verify DATABASE_URL or DB_* environment variables');
        console.error('  3. Check database credentials and permissions');
        console.error('  4. Verify the database exists: CREATE DATABASE food_ordering;');
        process.exit(1);
      }

      // Wait before next attempt
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      // slightly increase delay
      delayMs = Math.min(10000, Math.floor(delayMs * 1.7));
    }
  }
};

testConnectionWithRetry().catch((err) => {
  console.error('[DB] Unexpected error during startup test:', err);
  process.exit(1);
});

module.exports = pool;
