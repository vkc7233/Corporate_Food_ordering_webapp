# FoodFlow Backend - Quick Reference Guide

## 🚀 Get Started in 5 Minutes

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Create database (if needed)
psql -U postgres -c "CREATE DATABASE food_ordering;"

# 3. Setup database tables & demo data
npm run db:migrate
npm run db:seed

# 4. Start the server
npm run dev
```

You should see:
```
[DB] ✅ Connected to PostgreSQL database
🚀 Food Ordering API running on http://localhost:5000
```

---

## 🔑 Key Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/health` | GET | ❌ | Health check |
| `/api/auth/login` | POST | ❌ | Login & get token |
| `/api/auth/me` | GET | ✅ | Current user info |
| `/api/restaurants` | GET | ✅ | List restaurants |
| `/api/restaurants/:id` | GET | ✅ | Restaurant details |
| `/api/orders` | GET | ✅ | User's orders |
| `/api/orders` | POST | ✅ | Create order |
| `/api/orders/:id/place` | POST | ✅ | Place order |

---

## 📝 Example Requests

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nick@shield.com",
    "password": "password123"
  }'
```

### Get Token and Use It
```bash
# 1. Login and save token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nick@shield.com","password":"password123"}' \
  | jq -r '.token')

# 2. Use token to access protected endpoint
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Create Order
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d '{
    "restaurant_id": "restaurant-uuid-here",
    "items": [
      {
        "menu_item_id": "item-uuid-here",
        "quantity": 2
      },
      {
        "menu_item_id": "another-item-uuid",
        "quantity": 1
      }
    ],
    "notes": "Extra spicy please"
  }'
```

---

## 📊 Demo Users (Password: password123)

```javascript
const users = [
  { email: "nick@shield.com", role: "admin", country: "Global" },
  { email: "marvel@shield.com", role: "manager", country: "India" },
  { email: "america@shield.com", role: "manager", country: "America" },
  { email: "thanos@shield.com", role: "member", country: "India" },
  { email: "thor@shield.com", role: "member", country: "India" },
  { email: "travis@shield.com", role: "member", country: "America" }
];
```

---

## ⚙️ Environment Variables

```env
# Required
PORT=5000
NODE_ENV=development
JWT_SECRET=your-strong-secret-key

# Database (choose one)
DATABASE_URL=postgresql://user:pass@host:port/db    # For cloud
# OR
DB_HOST=localhost
DB_PORT=5432
DB_NAME=food_ordering
DB_USER=postgres
DB_PASSWORD=password

# Frontend
FRONTEND_URL=http://localhost:5173
```

---

## 🐛 Debugging

### See Detailed Errors
Set `NODE_ENV=development` in `.env`

### Test Database Connection
```bash
psql -U postgres -d food_ordering -c "SELECT * FROM users LIMIT 1;"
```

### Check API Health
```bash
curl http://localhost:5000/api/health
```

### Watch Server Logs
```bash
# Look for:
[DB] ✅ Connected
[INFO] POST /api/auth/login - 200 - 125ms
[ERROR] Something failed
```

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── middleware/
│   │   ├── auth.js           # JWT & RBAC
│   │   ├── validation.js      # Input validation ✨ NEW
│   │   └── logger.js          # Request logging ✨ NEW
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── orderController.js
│   │   ├── restaurantController.js
│   │   └── paymentController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── orders.js
│   │   ├── restaurants.js
│   │   └── payments.js
│   ├── config/
│   │   ├── database.js        # DB connection
│   │   ├── migrate.js         # Create tables
│   │   └── seed.js            # Demo data
│   └── index.js               # Main app
├── .env                       # Configuration ✨ UPDATED
├── .env.example               # Template
├── package.json
└── SETUP_AND_TROUBLESHOOTING.md ✨ NEW
```

---

## 🔒 Security Features

- ✅ JWT authentication with expiry (24h)
- ✅ Password hashing with bcryptjs
- ✅ Input validation on all requests
- ✅ Role-based access control (RBAC)
- ✅ Country-based data isolation
- ✅ CORS protection
- ✅ Protected routes

---

## 📈 Recent Improvements (✨ NEW)

### What's Fixed:
1. **Better Error Messages** - See actual errors in dev mode
2. **Input Validation** - All requests validated
3. **Request Logging** - See request timing
4. **JWT Security** - Stronger secret validation
5. **Database Diagnostics** - Clear startup messages
6. **Environment Config** - Fixed CORS issues

### See Full Details:
- [Improvements Summary](../IMPROVEMENTS_SUMMARY.md)
- [Setup & Troubleshooting](./SETUP_AND_TROUBLESHOOTING.md)

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| "Can't connect to database" | Start PostgreSQL, verify credentials |
| "relation 'users' does not exist" | Run `npm run db:migrate` |
| "No data to seed" | Run `npm run db:seed` |
| "CORS error from frontend" | Check `FRONTEND_URL` in `.env` |
| "Invalid token" | Token may be expired, login again |
| "Access denied" | Check user role and country access |

---

## ✅ Quick Checklist

- [ ] `.env` file created with proper values
- [ ] PostgreSQL running
- [ ] Database created: `CREATE DATABASE food_ordering;`
- [ ] Migrations run: `npm run db:migrate`
- [ ] Seed data loaded: `npm run db:seed`
- [ ] Server starts: `npm run dev`
- [ ] Health check works: `curl http://localhost:5000/api/health`
- [ ] Can login: `curl -X POST ... /api/auth/login`

---

## 📚 More Resources

- Full [Setup & Troubleshooting Guide](./SETUP_AND_TROUBLESHOOTING.md)
- [Improvements Summary](../IMPROVEMENTS_SUMMARY.md)
- [Implementation Checklist](../IMPLEMENTATION_CHECKLIST.md)
- Main [README](../README.md)

---

**Need Help?** Check the troubleshooting guide or review server console output.
