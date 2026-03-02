# FoodFlow Backend - Setup & Troubleshooting Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your settings:
# - Change JWT_SECRET to something strong and unique
# - Update DATABASE_URL or individual DB credentials
# - Ensure FRONTEND_URL matches your frontend dev server
```

### 3. Set Up Database
```bash
# Create the database (if using local PostgreSQL)
psql -U postgres -c "CREATE DATABASE food_ordering;"

# Run migrations to create tables
npm run db:migrate

# Seed demo data (6 test users + restaurants + menu items)
npm run db:seed
```

### 4. Start the Server
```bash
# Development mode (with hot reload via nodemon)
npm run dev

# Production mode
npm start
```

You should see:
```
[DB] 🔗 Connecting via DATABASE_URL
[DB] ✅ Connected to PostgreSQL database
[DB] ✅ Initial connection test passed
🚀 Food Ordering API running on http://localhost:5000
📋 Health check: http://localhost:5000/api/health
```

---

## 🔐 Security Improvements Made

### 1. **JWT Secret Validation**
- The system now warns if `JWT_SECRET` is weak or using the default value
- **Action Required**: Set a strong JWT_SECRET in `.env`
  ```env
  JWT_SECRET=a-very-long-random-string-with-numbers-and-symbols-12345!@#
  ```

### 2. **Input Validation Middleware**
- All requests are now validated for proper format
- Invalid data returns clear error messages with status 400
- Protects against malformed inputs

### 3. **Enhanced Error Messages in Development**
- Development mode shows detailed error messages and stack traces
- Production mode shows generic messages without exposing internals
- Set `NODE_ENV=production` in `.env` for production deployments

---

## 🐛 Troubleshooting

### Issue: "Internal server error" on login

**Possible Causes:**

1. **Database Connection Failed**
   - Check if PostgreSQL is running:
     ```bash
     psql -U postgres -c "SELECT NOW();"
     ```
   - Verify credentials in `.env`
   - Check server logs for `[DB] 🚨 FATAL` message

2. **Database Tables Don't Exist**
   - Run migrations:
     ```bash
     npm run db:migrate
     ```
   - Verify tables exist:
     ```bash
     psql -U postgres -d food_ordering -c "\dt"
     ```

3. **Seed Data Not Present**
   - Run the seed script:
     ```bash
     npm run db:seed
     ```
   - Check logs for `✅ Users seeded`

4. **JWT Secret Issues**
   - The system warns on startup if using weak JWT_SECRET
   - Check that `JWT_SECRET` is set in `.env` and is at least 10 characters

5. **CORS Issues (Frontend can't reach API)**
   - Verify `FRONTEND_URL` in `.env` matches your frontend URL
   - For Vite dev server: `FRONTEND_URL=http://localhost:5173`
   - For production: Set to your actual frontend domain

### Issue: "Access denied. No token provided"

- The frontend must include `Authorization: Bearer <token>` header
- Token must be stored after successful login
- Check browser DevTools → Network tab → Request Headers

### Issue: Database connection refused

```
[DB] Error Details:
  Message: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**
- Start PostgreSQL:
  - Windows: Services → PostgreSQL → Start
  - Mac: `brew services start postgresql`
  - Linux: `sudo systemctl start postgresql`
- Verify host/port in `.env`
- Restart the server after fixing

### Issue: "relation 'users' does not exist"

The migrations haven't been run.

```bash
npm run db:migrate
npm run db:seed
```

---

## 📋 Available Demo Users

All users have password: `password123`

| Email | Role | Country | Permissions |
|-------|------|---------|-------------|
| nick@shield.com | Admin | — | Full access |
| marvel@shield.com | Manager | India | View/create/approve orders (India only) |
| america@shield.com | Manager | America | View/create/approve orders (USA only) |
| thanos@shield.com | Member | India | View restaurants & create orders (India only) |
| thor@shield.com | Member | India | View restaurants & create orders (India only) |
| travis@shield.com | Member | America | View restaurants & create orders (USA only) |

---

## 🔍 Debugging Tips

### 1. Enable Verbose Logging
Set `NODE_ENV=development` in `.env` to see:
- Request method, path, status code, duration
- Detailed error messages with stack traces
- Database connection details

### 2. Check Server Logs
Look for these log patterns:
- `[LOGIN ERROR]` - Authentication failure details
- `[DB] ❌` - Database connection problems
- `[ERROR]` - Unexpected errors with full stack

### 3. Test Database Directly
```bash
# Connect to the database
psql -U postgres -d food_ordering

# Check if users table exists and has data
SELECT * FROM users;

# Check if restaurants table exists
SELECT * FROM restaurants;
```

### 4. Test API Endpoints Manually
```bash
# Health check (no auth required)
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nick@shield.com","password":"password123"}'

# Get current user (replace TOKEN with the token from login response)
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

---

## 📝 New Middleware & Features

### 1. **Request Logger Middleware**
- Logs all requests with timing information
- Shows HTTP method, path, status code, and duration
- Disabled in production to avoid performance impact

### 2. **Input Validation Middleware**
- Validates email format
- Validates required fields
- Validates array structures for orders
- Returns 400 status with clear error message

### 3. **Enhanced Error Handler**
- Development: Shows full error details and stack trace
- Production: Shows generic message without exposing internals

---

## 🌟 Best Practices

1. **Environment Variables**
   - Never commit `.env` file to git
   - Use `.env.example` for documentation
   - Use different secrets for dev/prod

2. **Database**
   - Always run migrations on fresh deployment
   - Seed demo data only for development
   - Back up production database regularly

3. **Security**
   - Change JWT_SECRET in production
   - Use HTTPS in production
   - Implement rate limiting for login endpoint
   - Validate all user inputs (now done by middleware)

4. **Monitoring**
   - Watch server logs for `[ERROR]` and `[DB] ❌` messages
   - Monitor database connection pool usage
   - Track API response times (logged by requestLogger)

---

## 🆘 Still Having Issues?

1. Check server console output for the exact error message
2. Verify all `.env` variables are set correctly
3. Ensure PostgreSQL is running and accessible
4. Run migrations and seed again: `npm run db:migrate && npm run db:seed`
5. Review the detailed error logs in browser DevTools
6. Check that DATABASE_URL or individual DB params are correct
