-- =============================================================
-- FoodFlow Database Schema
-- PostgreSQL 14+
-- =============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- USERS
-- Stores all employees with their role and country assignment
-- role: 'admin' | 'manager' | 'member'
-- country: NULL for admin (global access), 'India' or 'America' for others
-- =============================================================
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,          -- bcrypt hashed
    role        VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'member')),
    country     VARCHAR(50),                    -- NULL = global (admin only)
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- =============================================================
-- RESTAURANTS
-- Each restaurant belongs to a country (India or America)
-- Non-admin users can only see restaurants matching their country
-- =============================================================
CREATE TABLE IF NOT EXISTS restaurants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    cuisine     VARCHAR(50),
    address     TEXT,
    country     VARCHAR(50) NOT NULL,           -- 'India' or 'America'
    image_url   VARCHAR(500),
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restaurants_country ON restaurants(country);

-- =============================================================
-- MENU ITEMS
-- Belongs to a restaurant; inherits country through restaurant
-- =============================================================
CREATE TABLE IF NOT EXISTS menu_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    price           DECIMAL(10,2) NOT NULL,
    category        VARCHAR(50),
    image_url       VARCHAR(500),
    is_available    BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);

-- =============================================================
-- PAYMENT METHODS
-- Each user owns their payment methods
-- Only Admin role can CREATE/UPDATE/DELETE payment methods
-- =============================================================
CREATE TABLE IF NOT EXISTS payment_methods (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(20) NOT NULL CHECK (type IN ('card', 'upi', 'wallet', 'bank')),
    details     JSONB NOT NULL,                 -- flexible: { last4, brand } for card, { upi_id } for UPI, etc.
    is_default  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id);

-- =============================================================
-- ORDERS
-- country column enables fast filtering by region
-- status: cart → placed → confirmed → preparing → delivered
--         any of the above (except delivered) → cancelled
-- =============================================================
CREATE TABLE IF NOT EXISTS orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id),
    restaurant_id       UUID NOT NULL REFERENCES restaurants(id),
    payment_method_id   UUID REFERENCES payment_methods(id),
    status              VARCHAR(20) NOT NULL DEFAULT 'cart' CHECK (
                            status IN ('cart', 'placed', 'confirmed', 'preparing', 'delivered', 'cancelled')
                        ),
    total_amount        DECIMAL(10,2) DEFAULT 0,
    notes               TEXT,
    country             VARCHAR(50) NOT NULL,  -- copied from restaurant at order creation time
    placed_at           TIMESTAMP,             -- set when status changes to 'placed'
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_country  ON orders(country);
CREATE INDEX IF NOT EXISTS idx_orders_status   ON orders(status);

-- =============================================================
-- ORDER ITEMS
-- Line items for each order; unit_price is snapshotted at order creation
-- =============================================================
CREATE TABLE IF NOT EXISTS order_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id    UUID NOT NULL REFERENCES menu_items(id),
    quantity        INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price      DECIMAL(10,2) NOT NULL,    -- price at time of order (snapshot)
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- =============================================================
-- ENTITY RELATIONSHIPS
--
-- users (1) ──────── (many) payment_methods
-- users (1) ──────── (many) orders
-- restaurants (1) ── (many) menu_items
-- restaurants (1) ── (many) orders
-- orders (1) ──────── (many) order_items
-- order_items (many) ─── (1) menu_items
-- orders (many) ──── (1) payment_methods
-- =============================================================

-- =============================================================
-- SAMPLE SEED QUERIES (see src/config/seed.js for full data)
-- =============================================================

-- Admin user
-- INSERT INTO users (name, email, password, role, country)
-- VALUES ('Nick Fury', 'nick@shield.com', '<bcrypt_hash>', 'admin', NULL);

-- India Restaurant
-- INSERT INTO restaurants (name, cuisine, country)
-- VALUES ('Spice Garden', 'Indian', 'India');

-- Menu item
-- INSERT INTO menu_items (restaurant_id, name, price, category)
-- VALUES ('<restaurant_id>', 'Butter Chicken', 320.00, 'Main Course');

-- Cart order (created by member, placed by manager)
-- INSERT INTO orders (user_id, restaurant_id, status, country)
-- VALUES ('<user_id>', '<restaurant_id>', 'cart', 'India');
