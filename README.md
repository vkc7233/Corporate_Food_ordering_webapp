# 🍽️ FoodFlow — Corporate Food Ordering System

A full-stack web application with **Role-Based Access Control (RBAC)** and **Country-based Relational Access** for corporate food ordering.

---

## 📐 Architecture Overview

```
food-ordering/
├── backend/                   # Node.js + Express REST API
│   └── src/
│       ├── config/            # Database connection, migrations, seed
│       ├── controllers/       # Business logic (auth, restaurants, orders, payments)
│       ├── middleware/         # JWT auth, RBAC, country-access enforcement
│       └── routes/            # Express route definitions
│
└── frontend/                  # React + TypeScript + Vite + TailwindCSS
    └── src/
        ├── context/           # AuthContext (JWT + RBAC) + CartContext
        ├── pages/             # Full pages (Dashboard, Restaurants, Orders...)
        ├── components/        # Reusable components (Navbar, ProtectedRoute)
        ├── services/          # Axios API client
        └── types/             # TypeScript types + RBAC permission map
```

---

## 👥 Users & Roles

| Name | Email | Role | Country | Password |
|------|-------|------|---------|----------|
| Nick Fury | nick@shield.com | Admin | — (Global) | password123 |
| Captain Marvel | marvel@shield.com | Manager | India | password123 |
| Captain America | america@shield.com | Manager | America | password123 |
| Thanos | thanos@shield.com | Member | India | password123 |
| Thor | thor@shield.com | Member | India | password123 |
| Travis | travis@shield.com | Member | America | password123 |

---

## 🔐 RBAC Permissions Matrix

| Feature | Admin | Manager | Member |
|---------|-------|---------|--------|
| View Restaurants & Menu | ✅ | ✅ | ✅ |
| Create Order (add items) | ✅ | ✅ | ✅ |
| Place Order (checkout & pay) | ✅ | ✅ | ❌ |
| Cancel Order | ✅ | ✅ | ❌ |
| Update Payment Method | ✅ | ❌ | ❌ |

---

## 🌍 Country-Based Access Control (Bonus)

| Role | Data Access |
|------|------------|
| **Admin** | All countries (India + America) |
| **Manager - India** | India restaurants & orders only |
| **Manager - America** | America restaurants & orders only |
| **Member - India** | India restaurants; own orders only |
| **Member - America** | America restaurants; own orders only |

**Implementation:**
- `countryAccess` middleware sets `req.countryFilter` (null for admin, country string for others)
- All queries are filtered by `req.countryFilter` where applicable
- JWT token carries `country` field — no extra DB lookup needed per request
- Attempting to access out-of-region data returns HTTP 403

---

## 🗃️ Database Schema

```sql
-- Users: stores role + country for RBAC
users (id, name, email, password, role, country, created_at)

-- Restaurants: tagged by country for isolation
restaurants (id, name, description, cuisine, address, country, image_url, is_active)

-- Menu items: belong to a restaurant (inherits country via join)
menu_items (id, restaurant_id, name, description, price, category, is_available)

-- Orders: tagged with country at creation time
orders (id, user_id, restaurant_id, payment_method_id, status, total_amount, country, notes, placed_at)

-- Order line items
order_items (id, order_id, menu_item_id, quantity, unit_price)

-- Payment methods: each user owns theirs; only admin can CRUD
payment_methods (id, user_id, type, details, is_default)
```

**Order status lifecycle:** `cart → placed → confirmed → preparing → delivered`
(can also transition to `cancelled` from cart/placed/confirmed)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| HTTP Client | Axios |
| Notifications | react-hot-toast |
| Routing | react-router-dom v6 |

---

## 🚀 Local Setup

### Combined deploy on Render (single service)

The frontend build can be integrated into the backend so that **one Render service** hosts both the API and the UI. Steps:

1. Ensure `frontend/vite.config.ts` has `build.outDir = '../backend/public'`.
2. Backend (`backend/package.json`) includes `build-client`/`build`/`postinstall` scripts that install/build the client.
3. Backend `src/index.js` serves `../public` as static assets and falls back to `index.html`.
4. In Render settings for the service set:
   * Build command: `npm install && npm run build` (run from `backend` directory).
   * Start command: `npm start`.
   * Environment variables: any backend secrets (DB, JWT, etc.).
   * **No need for `FRONTEND_URL` or `VITE_API_URL`** – the app is same‑origin.
5. When you push to the repo render will install dependencies (triggering `postinstall`), build the client, run migrations and seed, then start the server. The React app will be available at `/` and API endpoints at `/api/...`.

The rest of the README continues below.

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally (or a remote DB URL)

---

### 1. Clone & Install

```bash
git clone <repo-url>
cd food-ordering

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

---

### 2. Configure Environment

```bash
# In /backend, copy the example env
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
JWT_SECRET=your_super_secret_key_here

# Option A: Connection string
DATABASE_URL=postgresql://postgres:password@localhost:5432/food_ordering

# Option B: Individual params (used if DATABASE_URL is absent)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=food_ordering
DB_USER=postgres
DB_PASSWORD=password
```

---

### 3. Set Up Database

```bash
cd backend

# Create DB (if not exists)
psql -U postgres -c "CREATE DATABASE food_ordering;"

# Run migrations (creates tables)
npm run db:migrate

# Seed data (users, restaurants, menu items, payment methods)
npm run db:seed
```

---

### 4. Start Backend

```bash
cd backend
npm run dev
# → API running at http://localhost:5000
```

---

### 5. Start Frontend

```bash
cd frontend
npm run dev
# → App running at http://localhost:5173
```

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | ❌ | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Get current user |
| POST | `/api/auth/logout` | ✅ | Logout |

### Restaurants
| Method | Endpoint | Roles | Notes |
|--------|----------|-------|-------|
| GET | `/api/restaurants` | All | Country-filtered |
| GET | `/api/restaurants/:id` | All | With menu, country-filtered |
| GET | `/api/restaurants/:id/menu` | All | Menu only, country-filtered |

### Orders
| Method | Endpoint | Roles | Notes |
|--------|----------|-------|-------|
| GET | `/api/orders` | All | Country + ownership filtered |
| GET | `/api/orders/:id` | All | Single order |
| POST | `/api/orders` | All | Create cart |
| PUT | `/api/orders/:id/items` | All | Update cart items |
| POST | `/api/orders/:id/place` | Admin, Manager | Checkout & pay |
| POST | `/api/orders/:id/cancel` | Admin, Manager | Cancel order |

### Payment Methods
| Method | Endpoint | Roles | Notes |
|--------|----------|-------|-------|
| GET | `/api/payment-methods` | All | Own methods only |
| POST | `/api/payment-methods` | Admin | Add new method |
| PUT | `/api/payment-methods/:id` | Admin | Update method |
| DELETE | `/api/payment-methods/:id` | Admin | Delete method |

---

## 🔒 Security Design

1. **JWT Middleware** (`authenticate`): Validates Bearer token on all protected routes
2. **RBAC Middleware** (`authorize(...roles)`): Rejects requests from unauthorized roles
3. **Country Middleware** (`countryAccess`): Sets `req.countryFilter` based on user's JWT country
4. **All queries** respect `req.countryFilter` to enforce data isolation
5. **Passwords** hashed with bcrypt (cost factor 10)
6. **JWT payload** contains: `{ id, name, email, role, country }` — signed HS256, 24h expiry

---

## 📦 Seed Data Summary

- **6 users** (1 admin, 2 managers, 3 members) across 2 countries
- **6 restaurants** (3 India, 3 America) with realistic data
- **30 menu items** (5 per restaurant) across various categories
- **Payment methods** auto-generated per user based on country (UPI for India, card for America)

---

## 🎯 Design Decisions

- **Country stored in JWT**: Avoids an extra DB lookup on every request while enforcing access at middleware level
- **Order tagged with `country`**: Allows filtering orders by region even after the restaurant is no longer queried
- **Cart-first ordering**: Members can add items to cart; managers review and place orders — mimics real corporate approval workflow
- **Payment methods owned per user**: Each user has their own payment methods; admin manages their own
